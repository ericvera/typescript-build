import findUp from 'find-up'
import path from 'path'
import shell, { ShellString } from 'shelljs'
import { fileExists } from './fs'
import { log } from './log'

enum ExecutionEnvironment {
  Yarn = 'yarn',
  NPM = 'npm',
  Global = 'global',
}

const logAndExitOnError = (result: ShellString, command: string) => {
  if (result.code !== 0) {
    console.error(`Error running command: ${command}`)
    console.error()

    if (result.stderr) {
      console.error('--- STDERR [START] ---')
      console.error(result.stderr)
      console.error('--- STDERR [END] ---')
    }

    if (result.stdout) {
      console.error('--- STDOUT [START] ---')
      console.error(result.stdout)
      console.error('--- STDOUT [END] ---')
    }

    shell.exit(result.code !== 0 ? result.code : 1)
  }
}

const getCommand = (
  executionEnvironment: ExecutionEnvironment,
  command: string
): string => {
  switch (executionEnvironment) {
    case ExecutionEnvironment.Yarn:
      return `yarn exec ${command}`
    case ExecutionEnvironment.NPM:
      return `npm exec -c '${command}'`
    case ExecutionEnvironment.Global:
      return command
  }
}

/**
 * Will execute the provided command and exit on error
 */
export const shellExecute = (
  executionEnvironment: ExecutionEnvironment,
  command: string
) => {
  const environmentCommand = getCommand(executionEnvironment, command)
  log(`Executing '${environmentCommand}'`)
  const result = shell.exec(environmentCommand)
  log(`Exited with code ${result.code}`)
  logAndExitOnError(result, environmentCommand)
}

/**
 * Returns the environment in which tsc is found or exit if none
 */
export const getExecutionEnvironment =
  async (): Promise<ExecutionEnvironment> => {
    const packagePath = await findUp('package.json')

    if (!packagePath) {
      throw new Error('package.json not found')
    }

    const packageDir = path.dirname(packagePath)

    if (await fileExists(path.join(packageDir, 'yarn-lock.json'))) {
      return ExecutionEnvironment.Yarn
    }

    if (await fileExists(path.join(packageDir, 'package-lock.json'))) {
      return ExecutionEnvironment.NPM
    }

    return ExecutionEnvironment.Global
  }
