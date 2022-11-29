import path from 'path'
import shell from 'shelljs'
import { fileExists } from './fs.js'

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
