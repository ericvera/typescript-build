import path from 'path'

export const getUpAdjustedPath = (filePath: string, up: number) => {
  if (up === undefined) {
    return filePath
  }

  let tokens = filePath.split(path.sep)
  tokens = tokens.slice(up)

  return tokens.join(path.sep)
}
