import fs from 'fs'
import path from 'path'
import shell from 'shelljs'

const ConfigFileName = 'tsbconfig.json'
const ValidConfigKeys = ['copyFiles']
const ValidCopyFilesObjectKeys = ['up', 'files', 'outDirectory']

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

export const getCopyFileConfigObjects = (tsbConfigPath: string) => {
  // log("config found:", path)
  const config = fs.readFileSync(tsbConfigPath, 'utf8')

  if (!config) {
    console.error(`${tsbConfigPath} could not be read.`)
    shell.exit(1)
  }

  let json

  try {
    json = JSON.parse(config)
  } catch (error) {
    console.error(`Error parsing json from ${tsbConfigPath}.`)
    console.error(error.message)
    shell.exit(1)
  }

  for (const key in json) {
    if (!ValidConfigKeys.includes(key)) {
      console.error(`Found unexpected key '${key}' in ${tsbConfigPath}.`)
      shell.exit(1)
    }
  }

  // Get copyfiles params
  const copyfiles = json.copyFiles

  if (!Array.isArray(copyfiles)) {
    console.error(
      `Key copyfiles is expected to be an array of parameters to pass to copyfiles at ${tsbConfigPath}.`
    )
    shell.exit(1)
  }

  for (const copyFileItem of copyfiles) {
    for (const key in copyFileItem)
      if (!ValidCopyFilesObjectKeys.includes(key)) {
        console.error(
          `Found unexpected key '${key}' in one of the copyfiles items ${tsbConfigPath}. Expect only one of ${ValidCopyFilesObjectKeys.join(
            ', '
          )}.`
        )
        shell.exit(1)
      }
  }

  return copyfiles
}
