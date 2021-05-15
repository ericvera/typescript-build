#!/usr/bin/env node
const shell = require('shelljs')
const path = require('path')
const fs = require('fs')

// CONSTANTS
const ConfigFileName = 'tsbconfig.json'
const ValidConfigKeys = ['copyfiles']
const ValidCopyFilesObjectKeys = ['options', 'files', 'outDirectory']

// HELPERS
const hasError = (command) => {
  const result = shell.exec(command, { silent: true })

  return !!result.stderr
}

const exitOnError = (command, result, errorMessage) => {
  if (!!result.stderr) {
    console.error(errorMessage)
    console.error(`Error running command: ${command}`)
    console.error()
    console.error(result.stderr)

    shell.exit(1)
  }
}

const getTSConfigJsonFromPath = (path) => {
  let command = `${baseCommand} --showConfig`

  if (path) {
    command += ` --project ${path}`
  }

  const result = shell.exec(command, { silent: true })
  exitOnError(command, result, `Error getting config at ${path}.`)

  // 3. Get the list of references if --build is included
  const tsconfigjson = JSON.parse(result.stdout)

  if (!tsconfigjson) {
    console.error(`Error parsing tsconfig file at ${path || shell.pwd()}.`)
    shell.exit(1)
  }

  return tsconfigjson
}

const getReferencesFromTSConfig = (tsconfigJson, tsconfigPath) => {
  const references = new Set()

  if (tsconfigJson && Array.isArray(tsconfigJson.references)) {
    for (const reference of tsconfigJson.references) {
      let refPath = reference.path

      if (!refPath) {
        console.error('No path found on tsconfig reference.')
        console.error('tsconfig:')
        console.error(tsconfigJson)
        shell.exit(1)
      }

      if (tsconfigPath) {
        refPath = path.join(path.dirname(tsconfigPath), refPath)
      } else {
        refPath = path.resolve(refPath)
      }

      if (!references.has(refPath)) {
        references.add(refPath)
      }
    }

    return references
  }

  return []
}

const getReferences = (tsconfigPath = undefined, references = new Set()) => {
  const tsconfigJson = getTSConfigJsonFromPath(tsconfigPath)
  const newReferences = getReferencesFromTSConfig(tsconfigJson, tsconfigPath)

  for (const newRef of newReferences) {
    if (!references.has(newRef)) {
      references.add(newRef)
      getReferences(newRef, references)
    }
  }

  return references
}

const getReferencesPaths = () => {
  const refs = getReferences()

  return [...refs].map((ref) => path.dirname(ref))
}

const getBaseCommand = () => {
  let baseCommand = 'tsc'

  if (hasError(`${baseCommand} -v`)) {
    baseCommand = 'yarn run tsc'

    if (hasError(`${baseCommand} -v`)) {
      console.error('Neither tsc nor yarn run tsc are available.')
      shell.exit(1)
    }
  }

  return baseCommand
}

const getTSBConfigPaths = () => {
  const refPaths = getReferencesPaths()
  const configPaths = []

  for (const ref of refPaths) {
    const configPath = path.join(ref, ConfigFileName)

    if (fs.existsSync(configPath)) {
      configPaths.push(configPath)
    }
  }

  return configPaths
}

const getCopyFileConfigObjects = (tsbConfigPath) => {
  // console.log("config found:", path)
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
  const copyfiles = json.copyfiles

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

const executeCopyFiles = (copyfilesConfigObjects, tsbConfigPath) => {
  console.log(`Executing copy files for config file ${tsbConfigPath}...`)

  for (const copyFilesConfigObject of copyfilesConfigObjects) {
    const copyCommand = `copyfiles ${
      copyFilesConfigObject.options
    } ${copyFilesConfigObject.files.join(' ')} ${
      copyFilesConfigObject.outDirectory
    }`
    const cwd = path.dirname(tsbConfigPath)

    const copyResult = shell.exec(copyCommand, {
      cwd,
      silent: true,
    })

    exitOnError(
      copyCommand,
      copyResult,
      `Error copying files with command '${copyCommand}' at '${cwd}'.`
    )
  }
}

const executeCleanFiles = (copyfilesConfigObjects, tsbConfigPath) => {
  console.log(`Executing clean for config file ${tsbConfigPath}...`)

  for (const copyFilesConfigObject of copyfilesConfigObjects) {
    const cleanCommand = `rimraf ${copyFilesConfigObject.outDirectory}`
    const cwd = path.dirname(tsbConfigPath)

    console.log(`Removing files with command '${cleanCommand}' at '${cwd}'...`)

    const cleanResult = shell.exec(cleanCommand, {
      cwd,
      silent: true,
    })

    exitOnError(
      cleanCommand,
      cleanResult,
      `Error removing files with command '${cleanCommand}' at '${cwd}'.`
    )
  }
}

// EXECUTE

// 1. Find command line base for tsc (yarn run tsc or straight tsc)
const baseCommand = getBaseCommand()

// 2. Run tsc command with provided args
const [, , ...args] = process.argv
const buildCommand = `${baseCommand} ${args.join(' ')}`
const result = shell.exec(buildCommand, { silent: true })
exitOnError(buildCommand, result, 'tsc compilation failed.')

// 3. If --build is not included exit successfully (0)
if (!args.includes('--build')) {
  shell.exit(0)
}

// 4. Get tsb configs to copy content
const tsbConfigPaths = getTSBConfigPaths()

console.log(`Found tsbConfigPaths: ${tsbConfigPaths.join(', ')}`)

// 5. Clean-up copy destination if in --clean mode or copy the defined files
for (const tsbConfigPath of tsbConfigPaths) {
  const copyfilesConfigObjects = getCopyFileConfigObjects(tsbConfigPath)

  if (args.includes('--clean')) {
    executeCleanFiles(copyfilesConfigObjects, tsbConfigPath)
  } else {
    executeCopyFiles(copyfilesConfigObjects, tsbConfigPath)
  }
}
