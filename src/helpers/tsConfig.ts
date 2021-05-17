import path from 'path'
import shell from 'shelljs'
import { fileExists } from './fs'
import { ExecutionEnvironment, shellExecute } from './shell'

interface IncompleteTSConfig {
  references: { path: string }
}

export const getTSConfigPath = async (args: string[]) => {
  // Arg that ends in .json
  const configParams = args.filter(
    (arg) => !arg.startsWith('--') && arg.endsWith('.json')
  )

  let projectFile = 'tsconfig.json'

  if (configParams.length > 1) {
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

  if (!fileExists(tsConfigPath)) {
    throw new Error(
      `Expected to find ts config at '${tsConfigPath}', but it was not there.`
    )
  }

  return tsConfigPath
}

const getTSConfigJsonFromPath = (
  executionEnvironment: ExecutionEnvironment,
  tsConfigPath: string
) => {
  let tscCommand = 'tsc --showConfig'

  if (tsConfigPath) {
    tscCommand += ` --project ${tsConfigPath}`
  }

  const result = shellExecute(executionEnvironment, tscCommand)

  const tsConfigJson = JSON.parse(result.stdout)

  if (!tsConfigJson) {
    console.error(
      `Error parsing tsconfig file at ${tsConfigPath || shell.pwd()}.`
    )
    shell.exit(1)
  }

  return tsConfigJson
}

const getReferencesFromTSConfig = (
  tsConfigJson: IncompleteTSConfig,
  tsConfigPath: string
) => {
  const references = new Set<string>()

  if (tsConfigJson && Array.isArray(tsConfigJson.references)) {
    for (const reference of tsConfigJson.references) {
      let refPath = reference.path

      if (!refPath) {
        console.error('No path found on tsconfig reference.')
        console.error('tsconfig:')
        console.error(tsConfigJson)
        shell.exit(1)
      }

      if (tsConfigPath) {
        refPath = path.join(path.dirname(tsConfigPath), refPath)
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

const getReferences = (
  executionEnvironment: ExecutionEnvironment,
  tsConfigPath: string,
  references = new Set<string>([tsConfigPath])
) => {
  const tsConfigJson = getTSConfigJsonFromPath(
    executionEnvironment,
    tsConfigPath
  )
  const newReferences = getReferencesFromTSConfig(tsConfigJson, tsConfigPath)

  for (const newRef of newReferences) {
    if (!references.has(newRef)) {
      references.add(newRef)
      getReferences(executionEnvironment, newRef, references)
    }
  }

  return references
}

export const getReferencesPaths = (
  executionEnvironment: ExecutionEnvironment,
  tsConfigPath: string
) => {
  const refs = getReferences(executionEnvironment, tsConfigPath)

  return [...refs].map((ref) => path.dirname(ref))
}
