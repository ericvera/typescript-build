#!/usr/bin/env node
import shell from 'shelljs'
import { executeCleanFiles } from './helpers/clean.js'
import { executeCopyFiles } from './helpers/copy.js'
import { getExecutionEnvironment, shellExecute } from './helpers/shell.js'
import { getRootTSBConfigPath, getTSBConfigPaths } from './helpers/tsbConfig.js'
import { getReferencesPaths, getTSConfigPath } from './helpers/tsConfig.js'
import { log, logList } from './helpers/log.js'
  
;(async () => {
  const executionEnvironment = await getExecutionEnvironment()

  const [, , ...args] = process.argv

  // 1. Check options
  const isCopyOnly = !!args.includes('--copyOnly')
  const isBuild = !!args.includes('--build')

  if (isBuild && isCopyOnly) {
    log('Only one of --copyOnly or --build is allowed.')
    shell.exit(1)
  }

  if (!isBuild && !isCopyOnly) {
    log('One of --copyOnly or --build is required.')
    shell.exit(1)
  }

  let tsbConfigPaths

  // 2. Run tsc command with provided args
  if (isBuild) {
    shellExecute(executionEnvironment, `tsc ${args.join(' ')}`)
  

    // 2a. Get path for current TSConfig
    const tsConfigPath = await getTSConfigPath(args)
    log(`TSConfig path: ${tsConfigPath}`)

    // 2b. Get config paths for the command and current references
    const refPaths = getReferencesPaths(executionEnvironment, tsConfigPath)
    log(`Found refPaths:`)
    logList(refPaths)

    // 2c. Get tsb configs to copy content
     tsbConfigPaths = getTSBConfigPaths(refPaths)
    log('Found tsbConfigPaths:')
    logList(tsbConfigPaths)
  } else {
    tsbConfigPaths = getRootTSBConfigPath()
  }

  // 6. Clean-up copy destination if in --clean mode or copy the defined files
  const isCleanCommand = args.includes('--clean')
  log(isCleanCommand ? 'Running clean commands' : 'Running build commands')

  for (const tsbConfigPath of tsbConfigPaths) {
    if (isCleanCommand) {
      await executeCleanFiles(tsbConfigPath)
    } else {
      await executeCopyFiles(tsbConfigPath)
    }
  }

  log('Bye!')
})()
