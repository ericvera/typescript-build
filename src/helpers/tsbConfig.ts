import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import { Array, Boolean, Number, Optional, Record, Static, String } from 'runtypes'

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

export const getRootTSBConfigPath = () => {
  const configPath = path.join(shell.pwd().toString(), ConfigFileName)

    if (fs.existsSync(configPath)) {
      return [configPath]
    }
  
  return []
}

const CopyFilesEntry = Record({
  files: Array(String),
  outDirectories: Array(String),
  skipClean: Optional(Boolean),
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
  } catch (error: unknown) {
    console.error(`Error parsing json from ${tsbConfigPath}.`)
    
    if (error instanceof Error) {
      console.error(error.message)
    }

    shell.exit(1)
  }

  return config
}

export const getCopyFileConfigItems = (tsbConfigPath: string) => {
  const config = loadTSBConfig(tsbConfigPath)

  return config.copyFiles
}
