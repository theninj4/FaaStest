const calculator = module.exports = { }

const fetch = require('node-fetch')
const wait = (ms) => new Promise((resolve, reject) => { setTimeout(resolve, ms) })

calculator.add = async function (payload) {
  const res = await fetch(`http://localhost:3000/add?a=${payload.a}&b=${payload.b}`)
  const json = res.json()
  await wait(1)
  return json.sum
}
