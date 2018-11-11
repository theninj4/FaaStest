const workerCode = module.exports = { }

workerCode.generateFrom = function (code) {
  const b64Code = Buffer.from(code).toString('base64')
  return '(' + workerCode._workerCode.toString().replace('####', b64Code) + ')()'
}

workerCode._workerCode = function () {
  const workerThread = require('worker_threads')
  const vm = require('vm')
  const module = { }

  workerThread.parentPort.on('message', async request => {
    try {
      const result = await module.exports[request.func](request.payload)
      workerThread.parentPort.postMessage({ request, result })
    } catch (error) {
      workerThread.parentPort.postMessage({ request, error })
    }
  })

  const script = new vm.Script(Buffer.from('####', 'base64').toString('ascii'))
  script.runInNewContext({ module })
}
