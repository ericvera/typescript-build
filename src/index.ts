#!/usr/bin/env node
import shell from 'shelljs'
import { executeCleanFiles } from './helpers/clean.js'
import { executeCopyFiles } from './helpers/copy.js'
import { getExecutionEnvironment, shellExecute } from './helpers/shell.js'
import { getRootTSBConfigPath, getTSBConfigPaths } from './helpers/tsbConfig.js'
import { getTSConfigPath } from './helpers/tsConfig.js'
import { enableDebugLogging, log, logList } from './helpers/log.js'
import ts from 'typescript'
import path from 'path'
;(async () => {
  const executionEnvironment = await getExecutionEnvironment()

  const [, , ...args] = process.argv

  // 1. Check options
  const isCopyOnly = !!args.includes('--copyOnly')
  const isBuild = !!args.includes('--build')

  let [firstArg, ...otherArgs] = args
  let sanitizedArgs = args

  // --debug only allowed if the first
  if (firstArg === '--debug') {
    // Set debug to true
    enableDebugLogging()

    // Remove --debug from args
    sanitizedArgs = otherArgs
  }

  if (isBuild && isCopyOnly) {
    log('Only one of --copyOnly or --build is allowed.')
    shell.exit(1)
  }

  if (!isBuild && !isCopyOnly) {
    log('One of --copyOnly or --build is required.')
    shell.exit(1)
  }

  let tsbConfigPaths
  const projects: string[] = []

  // 2. Run tsc command with provided args
  if (isBuild) {
    // 2a. Get path for current TSConfig
    const tsConfigPath = await getTSConfigPath(sanitizedArgs)
    log(`TSConfig path: ${tsConfigPath}`)

    // 2b. Get the list of projects that would be compiled
    const buildOptions: ts.BuildOptions = { dry: true }

    const reporter: ts.DiagnosticReporter = (diagnostic) => {
      if (typeof diagnostic.messageText !== 'string') {
        throw new Error(
          `diagnostic.messageText is unexpectedly not a string: '${JSON.stringify(
            diagnostic.messageText
          )}'`
        )
      }

      const matched = diagnostic.messageText.match(/(?:'[^']*'|^[^']*$)/)

      if (matched?.length !== 1) {
        throw new Error(
          `Unexpected format of message that is supposed to contain the project to be built: '${diagnostic.messageText}'`
        )
      }

      const projectPath = matched[0].replace(/'/g, '')

      // Codes from https://github.com/microsoft/TypeScript/blob/3fcd1b51a1e6b16d007b368229af03455c7d5794/src/compiler/diagnosticMessages.json
      switch (diagnostic.code) {
        case 6356:
        case 6357:
        case 6374:
        case 6375:
          projects.push(projectPath)
          log('Will build:', projectPath)
          break
        case 6361:
          log('Up to date:', projectPath)
          break
        default:
          throw new Error(`Unexpected diagnostic code: '${diagnostic.code}'`)
      }
    }

    const buildHost = ts.createSolutionBuilderHost(
      /*sys*/ undefined,
      /*createProgram*/ undefined,
      undefined,
      reporter
    )

    const builder = ts.createSolutionBuilder(
      buildHost,
      [tsConfigPath],
      buildOptions
    )

    // Dry build to get the list of projects that are not up-to-date
    builder.build()

    // 2c. Run tsc
    shellExecute(executionEnvironment, `tsc ${sanitizedArgs.join(' ')}`)

    // 2b. Get config paths for the command and current references
    // const refPaths = getReferencesPaths(executionEnvironment, tsConfigPath)

    const refPaths = projects.map((ref) => path.dirname(ref))
    if (refPaths.length > 0) {
      log('Found refPaths to be built:')
      logList(refPaths)
    } else {
      log('Found no refPaths to be build.')
    }

    // 2d. Get tsb configs to copy content
    tsbConfigPaths = getTSBConfigPaths(refPaths)
    if (tsbConfigPaths.length > 0) {
      log('Found tsbConfigPaths:')
      logList(tsbConfigPaths)
    } else {
      log('No tsbConfigPaths found.')
    }
  } else {
    tsbConfigPaths = getRootTSBConfigPath()
  }

  // 6. Clean-up copy destination if in --clean mode or copy the defined files
  const isCleanCommand = sanitizedArgs.includes('--clean')
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
