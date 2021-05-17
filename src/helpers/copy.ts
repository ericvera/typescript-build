import fs from 'fs/promises'
import glob from 'glob'
import path from 'path'
import { log } from './log'
import { getCopyFileConfigItems } from './tsbConfig'
import { getUpAdjustedPath } from './path'

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

    let { outDirectory, up } = copyFilesConfigObject

    log(' - files:')

    for (const file of files) {
      const source = path.join(cwd, file)
      const destination = path.join(
        cwd,
        outDirectory,
        getUpAdjustedPath(file, up)
      )
      log(`   - [from] ${source}`)
      log(`     [to]   ${destination}`)

      copyPromises.push(fs.copyFile(source, destination))
    }
  }

  return Promise.all(copyPromises)
}
