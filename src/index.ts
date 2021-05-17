#!/usr/bin/env node
//import shell from 'shelljs'
import { log } from './helpers/log'

// // 1. Run tsc command with provided args
// const [, , ...args] = process.argv
// const buildCommand = getCommand('tsc', args.join(' '))
// log(`Running tsc using command '${buildCommand}'`)
// const result = shell.exec(buildCommand, { silent: true })
// exitOnError(buildCommand, result, 'tsc compilation failed.')

// // 2. If --build is not included exit successfully (0)
// if (!args.includes('--build')) {
//   log('Not --build so we are done')
//   shell.exit(0)
// }

// // 3. Get path for current TSConfig
// const tsConfigPath = getTSConfigPath(args)
// log(`TSConfig path: ${tsConfigPath}`)

// // 4. Get config paths for the command and current references
// const refPaths = getReferencesPaths(tsConfigPath)
// log(`Found refPaths: ${refPaths.join(', ')}`)

// // 5. Get tsb configs to copy content
// const tsbConfigPaths = getTSBConfigPaths(refPaths)
// log(`Found tsbConfigPaths: ${tsbConfigPaths.join(', ')}`)

// // 6. Clean-up copy destination if in --clean mode or copy the defined files
// const isCleanCommand = args.includes('--clean')
// log(isCleanCommand ? 'Running clean commands' : 'Running build commands')

// for (const tsbConfigPath of tsbConfigPaths) {
//   const copyfilesConfigObjects = getCopyFileConfigObjects(tsbConfigPath)

//   if (isCleanCommand) {
//     executeCleanFiles(copyfilesConfigObjects, tsbConfigPath)
//   } else {
//     executeCopyFiles(copyfilesConfigObjects, tsbConfigPath)
//   }
// }
import { getExecutionEnvironment, shellExecute } from './helpers/shell'
;(async () => {
  // Do async stuff
  log('Hello')

  const executionEnvironment = await getExecutionEnvironment()

  shellExecute(executionEnvironment, 'tsc -v')

  log('Bye!')
})()
