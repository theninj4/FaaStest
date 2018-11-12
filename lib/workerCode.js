const workerCode = module.exports = { }

workerCode.main = function () {
  return '(' + workerCode._workerCode.toString() + ')()'
}

workerCode._workerCode = function () {
  const workerThread = require('worker_threads')
  const vm = require('vm')
  let module = { }

  workerThread.parentPort.on('message', async request => {
    if (request.type === 'loadModule') {
      return loadModule(request)
    }
    return handleRequest(request)
  })

  const loadModule = async function (request) {
    Object.keys(module).forEach(k => delete module[k])
    module = { moduleId: request.moduleId }
    const script = new vm.Script(request.code)
    script.runInNewContext({ module })
    workerThread.parentPort.postMessage('loaded')
  }

  const handleRequest = async function (request) {
    try {
      const result = await module.exports[request.func](request.payload)
      if (request.moduleId !== module.moduleId) return
      workerThread.parentPort.postMessage({ request, result })
    } catch (error) {
      if (request.moduleId !== module.moduleId) return
      workerThread.parentPort.postMessage({ request, error })
    }
  }
}
