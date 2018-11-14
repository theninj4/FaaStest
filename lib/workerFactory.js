const workerFactory = module.exports = { }

const workerThreads = require('worker_threads')

const workerCode = require('./workerCode.js')

workerFactory.createWorker = function (i) {
  const worker = new workerThreads.Worker(workerCode.main(), { eval: true })
  worker._i = i
  worker._requests = new Map()
  worker.isBusy = () => (worker._requests.size > 0) || !worker._isOnline
  worker.getModuleId = () => worker._moduleId
  worker.unloadModule = () => { worker._isOnline = false }
  worker.on('online', () => { worker._isOnline = true })

  // worker.on('error', a => console.log(a))
  // worker.on('exit', a => console.log('\nTerminated', module, version))
  worker.stdout.pipe(process.stdout)
  worker.stderr.pipe(process.stderr)

  worker.loadModule = async function (moduleId, code) {
    worker._moduleId = moduleId
    worker._isOnline = false
    const loaded = new Promise((resolve, reject) => { worker._onLoaded = resolve })
    worker.postMessage({ type: 'loadModule', moduleId, code })
    await loaded
  }

  worker.exec = async function (request) {
    worker.postMessage(request)
    return new Promise((resolve, reject) => {
      worker._requests.set(request.id, { resolve, reject })
    })
  }
  worker.on('message', message => {
    if (message === 'loaded') {
      worker._isOnline = true
      return worker._onLoaded()
    }
    const { resolve, reject } = worker._requests.get(message.request.id)
    worker._requests.delete(message.request.id)
    if (message.error) {
      reject(message.error)
    } else {
      resolve(message.result)
    }
    if (worker._requests.size === 0) worker.isIdle()
  })

  return worker
}
