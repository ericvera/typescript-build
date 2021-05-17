import fs from 'fs/promises'
import path from 'path'
import { log } from './log'
import { getCopyFileConfigItems } from './tsbConfig'

export const executeCleanFiles = async (
  tsbConfigPath: string
): Promise<void> => {
  log(`Executing clean for config file ${tsbConfigPath}...`)

  const copyfilesConfigObjects = getCopyFileConfigItems(tsbConfigPath)
  const cwd = path.dirname(tsbConfigPath)

  for (const copyFilesConfigObject of copyfilesConfigObjects) {
    const outDirectory = copyFilesConfigObject.outDirectory
    log(`Removing directory ${outDirectory}`)
    await fs.rm(path.join(cwd, outDirectory), { recursive: true, force: true })
  }
}
