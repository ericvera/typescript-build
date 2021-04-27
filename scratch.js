const path = require('path')
const shell = require('shelljs')

const a = shell.pwd()

console.log(a.toString())

console.log(path.resolve('../index.js'))
console.log(path.join(a.toString(), '../index.js'))
