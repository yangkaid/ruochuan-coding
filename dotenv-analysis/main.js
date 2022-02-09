const fs = require('fs')
const path = require('path')

const readingEnv = () => {
  const args = process.argv[2]
  console.log(args)
  let envPath = path.resolve(process.cwd(), `${args ? `.env.${args}` : '.env'}`)
  let envObj = parasEnv(fs.readFileSync(envPath, 'utf-8'))
  Object.keys(envObj).forEach(key => {
    process.env[key] = envObj[key]
  })
  console.log(process.env.ACTIVITY)
}
const parasEnv = src => {
  const obj = {}
  src
    .toString()
    .split('\n')
    .forEach((line, index) => {
      const keyValueArr = line.split('=')
      key = keyValueArr[0]
      val = keyValueArr[1] || ''
      obj[key] = val
    })
  return obj
}
readingEnv()
