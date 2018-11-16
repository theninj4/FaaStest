const scheduler = module.exports = { }

const workerFactory = require('./workerFactory.js')

scheduler.maxWorkers = process.env.THREAD_POOL_SIZE || 10
scheduler._workerPool = Array(scheduler.maxWorkers).fill().map((_, i) => workerFactory.createWorker(i))
scheduler._moduleMap = new Map()
scheduler._workQueue = new Map()
scheduler._spawning = new Set()

scheduler.getWorkerFor = async function (request) {
  if (scheduler._moduleMap.has(request.moduleId)) {
    return scheduler._moduleMap.get(request.moduleId)
  }

  return new Promise((resolve, reject) => {
    if (scheduler._workQueue.has(request.moduleId)) {
      scheduler._workQueue.get(request.moduleId).push({ request, resolve, reject })
    } else {
      scheduler._workQueue.set(request.moduleId, [ { request, resolve, reject } ])
    }
    scheduler._maybeScheduleWork()
  })
}

scheduler._maybeScheduleWork = async function () {
  if (scheduler._workQueue.size === 0) return
  const idleWorker = scheduler._getIdleWorker()
  if (!idleWorker) return
  const nextWorkItem = scheduler._getNextItemOnWorkQueue()
  if (!nextWorkItem) return
  const [ moduleId, taskList ] = nextWorkItem
  const { module, version } = taskList[0].request
  idleWorker.unloadModule()
  scheduler._moduleMap.delete(idleWorker.getModuleId())
  scheduler._spawning.add(moduleId)
  // console.log('Loading', moduleId)
  ;(async () => {
    const code = await scheduler.functionLoader(module, version)
    const startDate = process.hrtime.bigint()
    await idleWorker.loadModule(moduleId, code)
    if (process.env.DEBUG) {
      console.log(`Scheduling ${moduleId} took ${Number(process.hrtime.bigint() - startDate) / (1024 * 1024)}ms`)
    }
    taskList.forEach(task => task.resolve(idleWorker))
    scheduler._workQueue.delete(moduleId)
    scheduler._spawning.delete(moduleId)
    scheduler._moduleMap.set(idleWorker.getModuleId(), idleWorker)
  })()
}
setInterval(scheduler._maybeScheduleWork, 1000)
scheduler._workerPool.forEach(someWorker => { someWorker.isIdle = scheduler._maybeScheduleWork })

scheduler._getIdleWorker = function () {
  for (var i = 0; i < scheduler._workerPool.length; i++) {
    const someWorker = scheduler._workerPool[i]
    if (someWorker.isBusy()) continue
    scheduler._workerPool.splice(i, 1)
    scheduler._workerPool.push(someWorker)
    return someWorker
  }
}

scheduler._getNextItemOnWorkQueue = function () {
  for (const [ moduleId, tasks ] of scheduler._workQueue) {
    if (!scheduler._spawning.has(moduleId)) {
      return [ moduleId, tasks ]
    }
  }
  return null
}
