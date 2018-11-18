import fetch from 'node-fetch'
import dayjs from 'dayjs'
import { promisify } from 'util'
const wait = promisify(setTimeout)

export async function add (payload) {
  const res = await fetch(`http://localhost:3000/add?a=${payload.a}&b=${payload.b}`)
  const json = await res.json()
  const today = dayjs().format('s') / 1
  await wait(today)
  return json.sum
}
