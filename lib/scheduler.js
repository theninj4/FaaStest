const scheduler = module.exports = { }

const v8 = require('v8')

const workerFactory = require('./workerFactory.js')

scheduler.maxWorkers = Math.floor(v8.getHeapStatistics().total_available_size / (1024 * 1024) * 0.8 / 10)
scheduler._workerPool = new Map()
scheduler._workQueue = new Map()
scheduler._spawning = new Map()

scheduler.getWorkerFor = async function (request) {
  const funcId = `${request.module}#${request.func}#${request.version}`
  if (scheduler._workerPool.has(funcId)) {
    return scheduler._workerPool.get(funcId)
  }

  return new Promise((resolve, reject) => {
    if (scheduler._workQueue.has(funcId)) {
      scheduler._workQueue.get(funcId).push({ request, resolve, reject })
    } else {
      scheduler._workQueue.set(funcId, [ { request, resolve, reject } ])
    }
    scheduler._maybeScheduleWork()
  })
}

scheduler.getWorkerPoolState = function () {
  const result = [ ]
  for (const someWorker of scheduler._workerPool.values()) {
    result.push(someWorker._module)
  }
  result.push('###')
  for (const someModule of scheduler._spawning.keys()) {
    result.push(someModule.split('#')[0])
  }
  return result
}
// setInterval(() => {
//   console.log('\n', scheduler.getWorkerPoolState())
// }, 500)

scheduler._maybeScheduleWork = async function () {
  if (scheduler._workQueue.size === 0) return
  if (scheduler._spawning.size > 0) return
  scheduler._deleteIdleWorkers()
  if (scheduler._workerPool.size >= scheduler.maxWorkers) return

  let spareWorkers = scheduler.maxWorkers - scheduler._workerPool.size
  while (spareWorkers-- > 0) {
    const workItem = scheduler._getNextItemOnWorkQueue()
    if (workItem) await scheduler._spawnWorkerWithTasks(workItem)
  }
}
setInterval(scheduler._maybeScheduleWork, 1000)

scheduler._deleteIdleWorkers = function () {
  let toDelete = scheduler._workQueue.size - (scheduler.maxWorkers - scheduler._workerPool.size)
  if (toDelete > 0) {
    for (const [ someFuncId, someWorker ] of scheduler._workerPool) {
      if (someWorker.getOpenRequestCount() > 0) continue
      if (someWorker.getAge() < 50) continue
      someWorker.terminate()
      scheduler._workerPool.delete(someFuncId)
      if (toDelete-- <= 1) break
    }
  }
}

scheduler._getNextItemOnWorkQueue = function () {
  for (const [ funcId, tasks ] of scheduler._workQueue) {
    const { module, version } = tasks[0].request
    if (!scheduler._spawning.has(`${module}#${version}`)) {
      return [ funcId, tasks ]
    }
  }
  return null
}

scheduler._spawnWorkerWithTasks = async function ([ funcId, tasks ]) {
  const { module, version } = tasks[0].request
  scheduler._spawning.set(`${module}#${version}`, [ funcId, tasks ])
  const code = await scheduler.functionLoader(module, version)
  const worker = await workerFactory.createWorker(module, version, code)
  scheduler._workerPool.set(funcId, worker)
  scheduler._spawning.delete(`${module}#${version}`)
  scheduler._workQueue.delete(funcId)
  tasks.forEach(task => task.resolve(worker))
}
