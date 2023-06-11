const useGrouping = false

const format = (minimumIntegerDigits, n) =>
  n.toLocaleString('en-US', { minimumIntegerDigits, useGrouping })

const century = year => format(2, Math.trunc(year / 100))

export const tomlDirectory = year => `data/${century(year)}`
const jsonDirectory = year => `json/${century(year)}`

export const tomlFile = year => `${tomlDirectory(year)}/${format(4, year)}.toml`
export const jsonFile = year => `${jsonDirectory(year)}/${format(4, year)}.json`

export const isoDate = (date) => {
  const year = date.getUTCFullYear()
  const month = 1 + date.getUTCMonth()
  const dayOfMonth = date.getUTCDate()
  return format(4, year) + '-' + format(2, month) + '-' + format(2, dayOfMonth)
}
