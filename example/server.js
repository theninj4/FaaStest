const faastest = require('../.')
const fs = require('fs')
const assert = require('assert')

const fastify = require('fastify')()
fastify.get('/add', async (request, reply) => {
  reply.type('application/json').code(200)
  return { sum: Number(request.query.a) + Number(request.query.b) }
})
fastify.listen(3000)

faastest.defineFunctionLoader(function (module, version) {
  return fs.readFileSync(`${__dirname}/code/${module}-${version}.js`, { encoding: 'utf8' })
})

let latencies = [ ]
const loop = async function (i) {
  for (let j = 0; j < 1000; j++) {
    const a = Math.floor(Math.random() * 999)
    const b = Math.floor(Math.random() * 999)
    const f = Math.floor(Math.random() * 10)
    const startDate = process.hrtime.bigint()
    const result = await faastest.trigger({
      module: 'calculator' + (f < 5 ? 'A' : f < 7 ? 'B' : f < 9 ? 'C' : 'D'),
      func: 'add',
      version: 'v1.0.0',
      payload: { a, b }
    })
    latencies.push(process.hrtime.bigint() - startDate)
    assert.strictEqual(result, a + b)
    process.stdout.write('.')
  }
}
;(async () => {
  await (new Promise((resolve, reject) => { setTimeout(resolve, 1500) }))
  const startTime = new Date()
  await Promise.all(Array(10).fill().map((_, i) => loop(i)))
  const duration = (new Date()) - startTime
  console.log('\nTotal time:', duration.toLocaleString(), 'ms')
  latencies = latencies.sort((a, b) => a - b).map(a => Number(a) / (1024 * 1024))
  const total = latencies.reduce((xs, x) => xs + x, 0)
  console.log('Min', latencies[0].toLocaleString(), 'ms')
  console.log('P50', latencies[Math.floor(latencies.length / 2)].toLocaleString(), 'ms')
  console.log('Avg', (total / latencies.length).toLocaleString(), 'ms')
  console.log('P95', latencies[Math.floor((latencies.length / 100) * 95)].toLocaleString(), 'ms')
  console.log('Max', latencies[latencies.length - 1].toLocaleString(), 'ms')
  process.exit()
})()

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection in Test at: ', reason)
})
process.on('uncaughtException', (e) => {
  console.log('Uncaught Exception in Test at: ', e.message, '\n', e.stack)
})
