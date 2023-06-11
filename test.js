import test from 'ava'
import { thisDay } from './index.js'

test('English', async t => {
  const result = await thisDay(new Date(Date.parse('1823-03-20')), 'en')
  t.is(result.length, 1)
  t.is(result[0].lang, 'en')
  t.is(result[0].citation, 'https://en.m.wikipedia.org/wiki/1823')
  t.is(result[0].text,
    'Emperor Agustín de Iturbide of Mexico abdicates, thus ending the short-lived First Mexican Empire.')
})

test('French', async t => {
  const result = await thisDay(new Date(Date.parse('1823-03-20')), 'fr')
  t.is(result.length, 1)
  t.is(result[0].lang, 'fr')
  t.is(result[0].citation, 'https://fr.wikipedia.org/wiki/mars_1823')
  t.is(result[0].text,
    '19 mars&#160;: Augustin Ier du Mexique est renversé par un officier, Santa Anna. Proclamation de la République mexicaine.')
})
