const faastest = module.exports = { }

const workerThreads = require('worker_threads')

faastest.configure = function (config) {
  faastest._config = config
  faastest._workerPool = new Map()
  faastest._workQueue = new Map()
  faastest._spawning = new Map()
}

faastest.trigger = async function (request) {
  request.id = Math.random()
  const worker = await faastest._getWorkerFor(request)
  return worker.exec(request)
}

faastest._getWorkerFor = async function (request) {
  const funcId = `${request.module}#${request.func}#${request.version}`
  if (faastest._workerPool.has(funcId)) {
    return faastest._workerPool.get(funcId)
  }

  return new Promise((resolve, reject) => {
    if (faastest._workQueue.has(funcId)) {
      faastest._workQueue.get(funcId).push({ request, resolve, reject })
    } else {
      faastest._workQueue.set(funcId, [ { request, resolve, reject } ])
    }
    faastest._maybeScheduleWork()
  })
}

faastest.getWorkerPoolState = function () {
  const result = [ ]
  for (const someWorker of faastest._workerPool.values()) {
    result.push(someWorker._module)
  }
  result.push('###')
  for (const someModule of faastest._spawning.keys()) {
    result.push(someModule.split('#')[0])
  }
  return result
}
// setInterval(() => {
//   console.log('\n', faastest.getWorkerPoolState())
// }, 500)

faastest._maybeScheduleWork = async function () {
  if (faastest._workQueue.size === 0) return
  const now = new Date()
  if (faastest._spawning.size === 0) {
    let toDelete = faastest._workQueue.size - (faastest._config.maxWorkers - faastest._workerPool.size)
    for (const [ someFuncId, someWorker ] of faastest._workerPool) {
      if (toDelete <= 0) break
      if (someWorker._requests.size > 0) continue
      if (now - someWorker._createdAt < 50) continue
      someWorker.terminate()
      faastest._workerPool.delete(someFuncId)
      toDelete--
    }
  }
  if (faastest._workerPool.size >= faastest._config.maxWorkers) return
  if (faastest._spawning.size > 0) return

  let nextSpawn = null
  for (const [ funcId, tasks ] of faastest._workQueue) {
    const { module, version } = tasks[0].request
    if (!faastest._spawning.has(`${module}#${version}`)) {
      nextSpawn = [ funcId, tasks ]
      break
    }
  }

  const [ funcId, tasks ] = nextSpawn // faastest._workQueue.entries().next().value
  const { module, version } = tasks[0].request

  faastest._spawning.set(`${module}#${version}`, nextSpawn)
  const code = await faastest._config.functionLoader(module, version)
  const worker = await faastest._createWorker(module, version, code)
  faastest._workerPool.set(funcId, worker)
  faastest._spawning.delete(`${module}#${version}`)
  faastest._workQueue.delete(funcId)
  tasks.forEach(task => task.resolve(worker))
}
setInterval(faastest._maybeScheduleWork, 1000)

faastest._createWorker = async function (module, version, code) {
  const wrappedCode = faastest._wrapCode(code)
  const worker = new workerThreads.Worker(wrappedCode, { eval: true })
  worker._module = module
  worker._requests = new Map()
  worker._createdAt = new Date()
  worker.on('message', message => {
    const { resolve, reject } = worker._requests.get(message.request.id)
    worker._requests.delete(message.request.id)
    if (message.error) {
      reject(message.error)
    } else {
      resolve(message.result)
    }
    faastest._maybeScheduleWork()
  })
  const done = new Promise((resolve, reject) => {
    worker._ready = resolve
  })
  worker.on('online', () => {
    // console.log('\nLoaded', module, version)
    worker._ready(worker)
  })
  // worker.on('error', a => console.log(a))
  worker.on('exit', () => {
    // console.log('\nTerminated', module, version)
  })
  // worker.stdout
  worker.die = function () {
    worker.postMessage('die')
  }
  worker.exec = async function (request) {
    worker.postMessage(request)
    return new Promise((resolve, reject) => {
      worker._requests.set(request.id, { resolve, reject })
    })
  }
  return done
}

faastest._wrapCode = function (code) {
  const b64Code = Buffer.from(code).toString('base64')
  return '(' + faastest._workerCode.toString().replace('####', b64Code) + ')()'
}

faastest._workerCode = function () {
  const workerThread = require('worker_threads')
  let inProgress = 0
  workerThread.parentPort.on('message', async request => {
    if (request === 'die') {
      return setInterval(() => {
        if (inProgress === 0) process.exit()
      }, 100)
    }
    inProgress++
    try {
      const result = await module.exports[request.func](request.payload)
      workerThread.parentPort.postMessage({ request, result })
    } catch (error) {
      workerThread.parentPort.postMessage({ request, error })
    }
    inProgress--
  })
  const code = Buffer.from('####', 'base64').toString('ascii')
  const module = { }
  eval(code)
}
