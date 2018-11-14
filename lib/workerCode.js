const workerCode = module.exports = { }

workerCode.main = function () {
  return '(' + workerCode._workerCode.toString() + ')()'
}

workerCode._workerCode = function () {
  const workerThread = require('worker_threads')
  const vm = require('vm')
  const globals = {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    setImmediate,
    clearImmediate,
    process,
    require,
    Buffer,
    Promise,
    global: { Promise }
  }
  let module = { }

  workerThread.parentPort.on('message', async request => {
    if (request.type === 'loadModule') {
      return loadModule(request)
    }
    return handleRequest(request)
  })

  process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection in Worker at: ', reason)
  })
  process.on('uncaughtException', (e) => {
    console.log('Uncaught Exception in Worker at: ', e.message, '\n', e.stack)
  })

  const loadModule = async function (request) {
    Object.keys(module).forEach(k => delete module[k])
    module = { moduleId: request.moduleId }
    const script = new vm.Script(request.code)
    script.runInNewContext({ module, ...globals })
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
