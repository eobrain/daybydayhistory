import { parse } from 'node-html-parser'
import { pp } from 'passprint'

const cache = {}
let hitCount = 0
let missCount = 0

const hitRate = () => `${100 * hitCount / (hitCount + missCount)}%`

// Returns {status, text}
async function memoizeFetch (url) {
  let result = cache[url]
  if (result) {
    ++hitCount
    return result
  }
  ++missCount
  const response = await fetch(url)
  if (response.status === 200) {
    result = { status: response.status, text: await response.text() }
  } else {
    result = { status: response.status }
  }
  cache[url] = result
  return result
}

function filter (text) {
  const lines = text.split('\n')
  const out = []
  let on = true
  for (const line of lines) {
    if (line.match(/Born:/)) {
      on = false
    }
    if (line.match(/Died:/)) {
      on = true
    }
    if (on) {
      out.push(line.replaceAll(/\[[0-9]+\]/g, ''))
    }
  }
  return out.join('\n')
}

function pruneDom ($monthRoot) {
}

function taillerDom ($monthRoot) {
  const $span = $monthRoot.getElementById('Naissances')
  if (!$span) {
    return
  }
  const $ul = $span.parentNode.nextElementSibling.nextElementSibling
  $ul.parentNode.removeChild($ul)
}

function annotateDeaths ($yearRoot) {
  const $span = $yearRoot.getElementById('Deaths')
  if (!$span) {
    return
  }
  const $ul = $span.parentNode.nextElementSibling
  for (const $li of $ul.querySelectorAll('li')) {
    $li.insertAdjacentHTML('beforeend', ' (Died)')
  }
}

function findElementInMonthArticle ($monthRoot, monthUrl, monthString, day, year, weekdayString) {
  const ids = [
        `${monthString}_${day},_${year}_(${weekdayString})`,
        `${weekdayString},_${monthString}_${day},_${year}`
  ]
  const citations = []
  for (const id of ids) {
    const $nephewSpan = $monthRoot.getElementById(id)
    const citation = `${monthUrl}#${id}`
    citations.push(citation)
    if (!$nephewSpan) {
      continue
    }
    const $parent = $nephewSpan.parentNode
    const $theElement = $parent.nextSibling

    return { found: true, $theElement, citation }
  }
  console.log(`cannot find any of\n  ${citations.join('\n  ')}`)
  return { found: false }
}

function trouverElementDansArticleDuMois ($monthRoot, monthUrl, monthString, day, year, weekdayString) {
  const css = `li a[title="${day} ${monthString}"]`
  const $a = $monthRoot.querySelector(css)
  if (!$a) {
    console.log(`${css} not found in ${monthUrl}`)
    return { found: false }
  }
  const $theElement = $a.parentNode
  return { found: true, $theElement, citation: monthUrl }
}

export async function thisDay (thenDate, lang, locale) {
  const year = pp(thenDate.getUTCFullYear())
  const monthString = pp(thenDate.toLocaleDateString(locale, {
    month: 'long', timeZone: 'UTC'
  }))

  const day = pp(thenDate.getDate())

  const weekdayString = pp(thenDate.toLocaleDateString(locale, { weekday: 'long', timeZone: 'UTC' }))

  const monthUrl = ({
    en: `https://en.m.wikipedia.org/wiki/${monthString}_${year}`,
    fr: `https://fr.wikipedia.org/wiki/${monthString}_${year}`
  })[lang]
  const { status: monthStatus, text: monthHtml } = await memoizeFetch(pp(monthUrl))
  if (monthStatus !== 200) {
    console.log(`Got status ${monthStatus} from ${monthUrl}`)
  } else {
    const $monthRoot = parse(monthHtml)

    const prune = ({
      en: pruneDom,
      fr: taillerDom
    })[lang]
    prune($monthRoot)

    const findElement = ({
      en: findElementInMonthArticle,
      fr: trouverElementDansArticleDuMois
    })[lang]
    const { found, $theElement, citation } = findElement($monthRoot, monthUrl, monthString, day, year, weekdayString)
    if (found) {
      const text = filter($theElement.innerText)
      console.log(text)
      return { found, text, citation }
    }
  }

  const yearUrl = ({
    en: `https://en.m.wikipedia.org/wiki/${year}`,
    fr: `https://fr.wikipedia.org/wiki/${year}`
  })[lang]
  const { status: yearStatus, text: yearHtml } = await memoizeFetch(yearUrl)
  if (yearStatus !== 200) {
    console.log(`Got status ${yearStatus} from ${yearUrl}`)
  } else {
    const $yearRoot = parse(yearHtml)
    annotateDeaths($yearRoot)

    const dayPatt = (lang === 'fr' && day === 1) ? '1er' : day

    const pattern = new RegExp(({
      en: `^${monthString}\\s${day}\\s.\\s`,
      fr: `^${dayPatt}\\s${monthString}\\s?[:,]\\s`
    })[lang], 'i')

    const citation = yearUrl
    for (const $li of $yearRoot.querySelectorAll('li')) {
      if ($li.innerText.match(pattern) && !$li.innerText.match(/ \([d†]\.? /)) {
        const found = true
        const text = $li.innerText.replace(pattern, '')
        console.log(text)
        return { found, text, citation }
      }
    }
    console.log(`cannot find ${pattern} in ${citation}`)
  }
  return { found: false }
}

async function fromYear (year, lang) {
  const region = ({ en: 'US', fr: 'FR' })[lang]
  const locale = lang + '-' + region

  const thenDate = new Date()
  for (let dayOfYear = 1; dayOfYear <= 366; ++dayOfYear) {
    thenDate.setUTCFullYear(year, 0, dayOfYear)
    pp(thenDate)
    if (pp(thenDate.getUTCFullYear()) !== year) {
      console.log('must be leap year')
      break
    }

    const { found, text, citation } = await thisDay(thenDate, lang, locale)
    if (found) {
      pp(hitRate())
      const dayData = { lang, text, citation }
      pp(dayData)
    }
  }
}

if (process.argv.length <= 3) {
  console.log('Missing arguments: year language')
  process.exit(1)
}
try {
  const year = parseInt(process.argv[2])
  if (Number.isNaN(year)) {
    console.log(`Bad year "${process.argv[2]}", must be integer`)
    process.exit(1)
  }

  fromYear(year, process.argv[3])
} catch (e) {
  console.log('Exception: ', e)
  process.exit(1)
}
