let Debug = false

export const enableDebugLogging = () => {
  Debug = true
}

export const log = (...args: any[]) => {
  if (!Debug) {
    return
  }

  console.log(args)
}

export const logList = (list: string[]): void => {
  if (!Debug) {
    return
  }

  list.forEach((item) => {
    console.log(` - ${item}`)
  })
}
