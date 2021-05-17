import fs from 'fs'
import path from 'path'
import { Array, Number, Record, Static, String } from 'runtypes'
import shell from 'shelljs'

const ConfigFileName = 'tsbconfig.json'

export const getTSBConfigPaths = (refPaths: string[]) => {
  const configPaths = []

  for (const ref of refPaths) {
    const configPath = path.join(ref, ConfigFileName)

    if (fs.existsSync(configPath)) {
      configPaths.push(configPath)
    }
  }

  return configPaths
}

const CopyFilesEntry = Record({
  files: Array(String),
  outDirectory: String,
  up: Number,
})

const TSBConfig = Record({
  copyFiles: Array(CopyFilesEntry),
})

type TSBConfig = Static<typeof TSBConfig>

const loadTSBConfig = (tsbConfigPath: string): TSBConfig => {
  const json = fs.readFileSync(tsbConfigPath, 'utf8')

  if (!json) {
    console.error(`${tsbConfigPath} could not be read.`)
    shell.exit(1)
  }

  let config: TSBConfig

  try {
    config = JSON.parse(json)

    TSBConfig.check(config)
  } catch (error) {
    console.error(`Error parsing json from ${tsbConfigPath}.`)
    console.error(error.message)
    shell.exit(1)
  }

  return config
}

export const getCopyFileConfigItems = (tsbConfigPath: string) => {
  const config = loadTSBConfig(tsbConfigPath)

  return config.copyFiles
}
