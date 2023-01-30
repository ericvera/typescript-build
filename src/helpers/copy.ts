import fs from 'fs/promises'
import glob from 'glob'
import path from 'path'
import { log } from './log.js'
import { getCopyFileConfigItems } from './tsbConfig.js'
import { getUpAdjustedPath } from './path.js'

export const executeCopyFiles = async (
  tsbConfigPath: string
): Promise<void[]> => {
  log(`Executing copy files for config file ${tsbConfigPath}...`)

  const copyfilesConfigObjects = getCopyFileConfigItems(tsbConfigPath)
  const cwd = path.dirname(tsbConfigPath)

  const copyPromises: Promise<void>[] = []

  for (const copyFilesConfigObject of copyfilesConfigObjects) {
    const files = new Set<string>()

    // Get file list
    for (const pattern of copyFilesConfigObject.files) {
      log(` - pattern: ${pattern}`)
      log(` - cwd: ${cwd}`)
      glob.sync(pattern, { cwd }).forEach((file) => {
        files.add(file)
      })
    }

    let { outDirectories, up } = copyFilesConfigObject
    const copyOperations: { from: string; to: string }[] = []

    log(' - files:')

    for (const file of files) {
      const from = path.join(cwd, file)

      for (const outDirectory of outDirectories) {
        const to = path.join(cwd, outDirectory, getUpAdjustedPath(file, up))
        log(`   - [from] ${from}`)
        log(`     [to]   ${to}`)

        copyOperations.push({ from, to })
      }
    }

    const dirSet = new Set<string>()
    copyOperations.forEach((copyOperation) => {
      dirSet.add(path.dirname(copyOperation.to))
    })

    const promises: Promise<string | undefined>[] = []

    dirSet.forEach((dir) => {
      promises.push(fs.mkdir(dir, { recursive: true }))
    })

    // Wait for directories to be created first
    await Promise.all(promises)

    copyOperations.forEach(({ from, to }) => {
      copyPromises.push(fs.copyFile(from, to))
    })
  }

  return Promise.all(copyPromises)
}
