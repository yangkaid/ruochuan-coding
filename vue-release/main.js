const args = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
// node的语义化版本实现
const semver = require('semver')
const currentVersion = require('./package.json').version
// 交互式用户输入
const { prompt } = require('enquirer')
// 执行子进程命令，用于在终端命令执行
const execa = require('execa')

console.log(args)
async function test() {
  const { stdout } = await execa('echo', ['yangkai'])
  console.log(stdout)
}
test()