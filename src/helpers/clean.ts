import fs from 'fs/promises'
import path from 'path'
import { getCopyFileConfigItems } from './tsbConfig'
import { log } from './log'

export const executeCleanFiles = async (
  tsbConfigPath: string
): Promise<void> => {
  log(`Executing clean for config file ${tsbConfigPath}...`)

  const copyfilesConfigObjects = getCopyFileConfigItems(tsbConfigPath)
  const cwd = path.dirname(tsbConfigPath)

  for (const copyFilesConfigObject of copyfilesConfigObjects) {
    if (copyFilesConfigObject.skipClean === true) {
      log(`Skip removing directory for ${copyFilesConfigObject.outDirectories}`)
      continue
    }

    for (const outDirectory of copyFilesConfigObject.outDirectories) {
      log(`Removing directory ${outDirectory}`)
      await fs.rm(path.join(cwd, outDirectory), { recursive: true, force: true })
    }
  }
}
