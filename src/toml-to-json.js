import getStdin from 'get-stdin'
import TOML from '@iarna/toml'

const toml = await getStdin()

const json = JSON.stringify(TOML.parse(toml))

console.log(json)
