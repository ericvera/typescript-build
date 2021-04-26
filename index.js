#!/usr/bin/env node
const shell = require("shelljs")
const path = require("path")
const fs = require("fs")

// CONSTANTS
const ConfigFileName = "tsbconfig.json"

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

const getReferencFromTSConfig = (tsconfigjson) => {
  const references = new Set()

  if (tsconfigjson && Array.isArray(tsconfigjson.references)) {
    for (const reference of tsconfigjson.references) {
      const refPath = reference.path

      if (!refPath) {
        console.error("No path found on tsconfig reference.")
        console.error("tsconfig:")
        console.error(tsconfigjson)
        shell.exit(1)
      }

      const resolvedPath = path.resolve(refPath)

      if (!references.has(resolvedPath)) {
        references.add(resolvedPath)
      }
    }

    return references
  }

  return []
}

const getReferences = (path = undefined, references = new Set()) => {
  const tsconfigjson = getTSConfigJsonFromPath(path)
  const newReferences = getReferencFromTSConfig(tsconfigjson)

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
  let baseCommand = "tsc"

  if (hasError(`${baseCommand} -v`)) {
    baseCommand = "yarn run tsc"

    if (hasError(`${baseCommand} -v`)) {
      console.error("Neither tsc nor yarn run tsc are available.")
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

// EXECUTE

// 1. Find command line base for tsc (yarn run tsc or straight tsc)
const baseCommand = getBaseCommand()

// 2. Run tsc command with provided args
const [, , ...args] = process.argv
const buildCommand = `${baseCommand} ${args.join(" ")}`
result = shell.exec(buildCommand, { silent: true })
exitOnError(buildCommand, result, "tsc compilation failed.")

// 3. If --build is not included exit successfully (0)
if (!args.includes("--build")) {
  shell.exit(0)
}

// 4. Get references to copy content
const tsbConfigPaths = getTSBConfigPaths()

for (const path of tsbConfigPaths) {
  // console.log("config found:", path)
  const config = fs.readFileSync(path)

  if (!config) {
    console.error(`${path} could not be read.`)
    shell.exit(1)
  }

  let json

  try {
    json = JSON.parse(config)
  } catch (error) {
    console.error(`Error parsing json from ${path}.`)
    console.error(error.message)
    shell.exit(1)
  }

  for (const key in json) {
    if (!["copyfiles"].includes(key)) {
      console.error(`Found unexpected key '${key}' in ${path}.`)
      shell.exit(1)
    }
  }
}

// 5. Read tsb config for all references and copy based on

// 6. Run copy on current and all reference directories