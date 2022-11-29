let Debug = false

export const enableDebugLogging = () => {
  Debug = true
}

export const log = Debug ? console.log : () => true

export const logList = (list: string[]): void => {
  if (!Debug) {
    return
  }

  list.forEach((item) => {
    console.log(` - ${item}`)
  })
}
