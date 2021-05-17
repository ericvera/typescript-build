import { log } from './log'
import { getCopyFileConfigItems } from './tsbConfig'

export const executeCleanFiles = (tsbConfigPath: string): void => {
  log(`Executing clean for config file ${tsbConfigPath}...`)

  const copyfilesConfigObjects = getCopyFileConfigItems(tsbConfigPath)

  log(copyfilesConfigObjects)
}
