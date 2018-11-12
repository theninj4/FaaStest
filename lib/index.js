const faastest = module.exports = { }

require('events').EventEmitter.defaultMaxListeners = 15
const scheduler = require('./scheduler.js')

faastest.defineFunctionLoader = function (functionLoader) {
  scheduler.functionLoader = functionLoader
}

faastest.trigger = async function (userRequest) {
  const request = {
    id: Math.random(),
    moduleId: `${userRequest.module}#${userRequest.version}`,
    module: userRequest.module || null,
    func: userRequest.func || null,
    version: userRequest.version || null,
    payload: userRequest.payload || null
  }
  const worker = await scheduler.getWorkerFor(request)
  return worker.exec(request)
}
