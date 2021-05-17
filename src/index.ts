#!/usr/bin/env node
import shell from 'shelljs'
import { log, logList } from './helpers/log'
import { getExecutionEnvironment, shellExecute } from './helpers/shell'
import { getTSBConfigPaths } from './helpers/tsbConfig'
import { getReferencesPaths, getTSConfigPath } from './helpers/tsConfig'
;(async () => {
  const executionEnvironment = await getExecutionEnvironment()

  // 1. Run tsc command with provided args
  const [, , ...args] = process.argv
  shellExecute(executionEnvironment, `tsc ${args.join(' ')}`)

  // 2. If --build is not included exit successfully (0)
  if (!args.includes('--build')) {
    log('Not --build so tsb are done')
    shell.exit(0)
  }

  // 3. Get path for current TSConfig
  const tsConfigPath = await getTSConfigPath(args)
  log(`TSConfig path: ${tsConfigPath}`)

  // 4. Get config paths for the command and current references
  const refPaths = getReferencesPaths(executionEnvironment, tsConfigPath)
  log(`Found refPaths:`)
  logList(refPaths)

  // 5. Get tsb configs to copy content
  const tsbConfigPaths = getTSBConfigPaths(refPaths)
  log('Found tsbConfigPaths:')
  logList(tsbConfigPaths)

  // 6. Clean-up copy destination if in --clean mode or copy the defined files
  const isCleanCommand = args.includes('--clean')
  log(isCleanCommand ? 'Running clean commands' : 'Running build commands')

  // for (const tsbConfigPath of tsbConfigPaths) {
  //   const copyfilesConfigObjects = getCopyFileConfigObjects(tsbConfigPath)

  //   if (isCleanCommand) {
  //     executeCleanFiles(copyfilesConfigObjects, tsbConfigPath)
  //   } else {
  //     executeCopyFiles(copyfilesConfigObjects, tsbConfigPath)
  //   }
  // }

  log('Bye!')
})()
