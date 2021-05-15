#!/usr/bin/env node
const shell = require('shelljs')
const path = require('path')
const fs = require('fs')

// CONSTANTS
const Debug = true

const log = Debug ? console.log : () => true

const ConfigFileName = 'tsbconfig.json'
const ValidConfigKeys = ['copyfiles']
const ValidCopyFilesObjectKeys = ['options', 'files', 'outDirectory']

// HELPERS
const hasError = (command) => {
  const result = shell.exec(command, { silent: true })

  return result.code !== 0 || !!result.stderr
}

const exitOnError = (command, result, errorMessage) => {
  if (result.code !== 0 || !!result.stderr) {
    console.error(errorMessage)
    console.error(`Error running command: ${command}`)
    console.error()
    console.error('STDERR:')
    console.error(result.stderr)
    console.error()
    console.error('STDOUT:')
    console.error(result.stdout)

    shell.exit(result.code !== 0 ? result.code : 1)
  }
}

const getTSConfigPath = (args) => {
  // Arg that ends in .json
  const configParams = args.filter(
    (arg) => !arg.startsWith('--') && arg.endsWith('.json')
  )

  let projectFile = 'tsconfig.json'

  if (configParams.lenght > 1) {
    throw new Error(
      `typescript-build does not know how to handle more than one config.`
    )
  }

  if (configParams.length === 1) {
    projectFile = configParams[0]
  }

  const tsConfigPath = path.isAbsolute(projectFile)
    ? projectFile
    : path.join(shell.pwd().toString(), projectFile)

  if (!fs.existsSync(tsConfigPath)) {
    throw new Error(
      `Expected to find ts config at '${tsConfigPath}', but it was not there.`
    )
  }

  return tsConfigPath
}

const getTSConfigJsonFromPath = (path) => {
  let tscArgs = '--showConfig'

  if (path) {
    tscArgs += ` --project ${path}`
  }

  const command = getCommand('tsc', tscArgs)

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

const getReferences = (tsconfigPath, references = new Set([tsConfigPath])) => {
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

const getReferencesPaths = (tsConfigPath) => {
  const refs = getReferences(tsConfigPath)

  return [...refs].map((ref) => path.dirname(ref))
}

const getCommand = (command, args) => {
  if (!hasError(`yarn run ${command} -v`)) {
    return `yarn run ${command} ${args}`
  }

  if (!hasError(`npm exec -c '${command} -v'`)) {
    return `npm exec -c '${command} ${args}'`
  }

  if (!hasError(`${command} -v`)) {
    return `${command} ${args}`
  }

  console.error(
    `Neither "yarn run ${command}", "npm exec -c '${command}'", nor "${command}" are available.`
  )
  shell.exit(1)
}

const getTSBConfigPaths = (refPaths) => {
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
  log(`Executing copy files for config file ${tsbConfigPath}...`)

  for (const copyFilesConfigObject of copyfilesConfigObjects) {
    const copyCommand = getCommand(
      'copyfiles',
      `${copyFilesConfigObject.options} ${copyFilesConfigObject.files.join(
        ' '
      )} ${copyFilesConfigObject.outDirectory}`
    )
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
  log(`Executing clean for config file ${tsbConfigPath}...`)

  for (const copyFilesConfigObject of copyfilesConfigObjects) {
    const cleanCommand = getCommand(
      'rimraf',
      `${copyFilesConfigObject.outDirectory}`
    )
    const cwd = path.dirname(tsbConfigPath)

    log(`Removing files with command '${cleanCommand}' at '${cwd}'...`)

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

// 1. Run tsc command with provided args
const [, , ...args] = process.argv
const buildCommand = getCommand('tsc', args.join(' '))
log(`Running tsc using command '${buildCommand}'`)
const result = shell.exec(buildCommand, { silent: true })
exitOnError(buildCommand, result, 'tsc compilation failed.')

// 2. If --build is not included exit successfully (0)
if (!args.includes('--build')) {
  log('Not --build so we are done')
  shell.exit(0)
}

// 3. Get path for current TSConfig
const tsConfigPath = getTSConfigPath(args)
log(`TSConfig path: ${tsConfigPath}`)

// 4. Get config paths for the command and current references
const refPaths = getReferencesPaths(tsConfigPath)
log(`Found refPaths: ${refPaths.join(', ')}`)

// 5. Get tsb configs to copy content
const tsbConfigPaths = getTSBConfigPaths(refPaths)
log(`Found tsbConfigPaths: ${tsbConfigPaths.join(', ')}`)

// 6. Clean-up copy destination if in --clean mode or copy the defined files
const isCleanCommand = args.includes('--clean')
log(isCleanCommand ? 'Running clean commands' : 'Running build commands')

for (const tsbConfigPath of tsbConfigPaths) {
  const copyfilesConfigObjects = getCopyFileConfigObjects(tsbConfigPath)

  if (isCleanCommand) {
    executeCleanFiles(copyfilesConfigObjects, tsbConfigPath)
  } else {
    executeCopyFiles(copyfilesConfigObjects, tsbConfigPath)
  }
}
