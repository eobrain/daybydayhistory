import { isoDate, jsonFile } from './src/date-keys.js'
// import { pp } from 'passprint'
import fs from 'fs'

const cache = {}

async function memoizeFetch (path) {
  let result = cache[path]
  if (result) {
    // ++hitCount
    return result
  }
  // ++missCount
  try {
    if (typeof window === 'object') {
      // running in the browser
      const response = await fetch(path)
      if (response.status === 200) {
        result = { status: response.status, json: await response.json() }
      } else {
        result = { status: response.status }
      }
      cache[path] = result
      return result
    } else {
      // running in Node
      const json = JSON.parse(await fs.promises.readFile(path))
      result = { status: 200, json }
      cache[path] = result
      return result
    }
  } catch (e) {
    console.log(`Error fetching "${path}": ${e}`)
    return { status: 500 }
  }
}

export async function thisDay (date, lang) {
  const year = date.getUTCFullYear()
  const { status, json } = await memoizeFetch(jsonFile(year))
  if (status !== 200) {
    return []
  }
  const dayData = json[isoDate(date)]
  if (!dayData) {
    return []
  }
  return dayData.filter(x => x.lang === lang)
}
