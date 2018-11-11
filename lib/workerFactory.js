const workerFactory = module.exports = { }

const util = require('util')
const workerThreads = require('worker_threads')

const workerCode = require('./workerCode.js')

workerFactory.createWorker = async function (module, version, code) {
  const worker = new workerThreads.Worker(workerCode.generateFrom(code), { eval: true })
  worker._module = module
  worker._requests = new Map()
  worker._createdAt = new Date()
  worker.getOpenRequestCount = () => worker._requests.size
  worker.getAge = () => (new Date()) - worker._createdAt
  worker.on('message', message => {
    const { resolve, reject } = worker._requests.get(message.request.id)
    worker._requests.delete(message.request.id)
    if (message.error) {
      reject(message.error)
    } else {
      resolve(message.result)
    }
  })
  // worker.on('error', a => console.log(a))
  worker.on('exit', () => {
    // console.log('\nTerminated', module, version)
  })
  // worker.stdout
  worker.exec = async function (request) {
    worker.postMessage(request)
    return new Promise((resolve, reject) => {
      worker._requests.set(request.id, { resolve, reject })
    })
  }
  await util.promisify(worker.on.bind(worker))('online')
  return worker
}
