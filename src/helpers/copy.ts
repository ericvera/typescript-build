import glob from 'glob'
import path from 'path'
import { log } from './log'
import { getCopyFileConfigItems } from './tsbConfig'
import { getUpAdjustedPath } from './path'

export const executeCopyFiles = (tsbConfigPath: string): void => {
  log(`Executing copy files for config file ${tsbConfigPath}...`)

  const copyfilesConfigObjects = getCopyFileConfigItems(tsbConfigPath)
  const cwd = path.dirname(tsbConfigPath)

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
      const destinationFile = getUpAdjustedPath(file, up)
      const destination = path.join(outDirectory, destinationFile)
      log(`   - [from] ${file}`)
      log(`     [to]   ${destination}`)
    }

    // TODO: Copy files
  }
}
