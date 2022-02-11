//release的意思是项目发布的流程，包括执行测试用例，更新依赖版本，打包编译所有的包，生成changelog文件，commit代码，发布包，提交到github
// 那我们可以通过一个命令，来使这个过程自动化

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
//版本id号
const preId =
  args.preId ||
  (semver.prerelease(currentVersion) && semver.prerelease(currentVersion))

//用于不执行测试，编译，推送git的操作，空跑打印输出
const idDryRun = args.dry

//用于跳过测试
const skipTests = args.skipTests

//用于跳过build
const skipBuild = args.skipBuild

//相对路径，读取packages文件夹，过滤出不以.开头且不以.ts结尾的文件
const packages = fs
  .readdirSync(path.resolve(__dirname, './packages'))
  .filter(p => !p.endWith('ts') && !p.startWith('.'))
// 跳过的包
const skippedPackages = []

//生成新的版本
const inc = i => semver.inc(currentVersion, i, preId)

//run会在终端真实的跑命令，
const run = (bin, args, opts) => {
  return execa(bin, args, { stdio: 'inherit', ...opts })
}
//dryRun空跑，只会在终端输出命令
const dryRun = (bin, args, opts = {}) => {
  console.log(chalk.blue(`[dryrun]${bin} ${args.join(' ')}`), opts)
}
const getPkgRoot = pkg => path.resolve(__dirname, '../packages' + pkg)

//输出青色的消息
const step = msg => console.log(chalk.cyan(msg))
const versionIncrements = [
  'patch', // 补丁版本号，对应 X.Y.Z 的 Z
  'minor', // 次级版本号，对应 X.Y.Z 的 Y
  'major', // 主要版本号，对应 X.Y.Z 的 X
  ...(preId ? ['prepatch', 'preminor', 'premajor', 'prerelease'] : []) // beta版本
]

//验证参数
async function validateVersion() {
  console.log(args)
  let targetVersion = args._[0]
  if (!targetVersion) {
    const { release } = await prompt({
      type: 'select',
      name: 'release',
      message: '请选择版本类型',
      choices: versionIncrements.map(i => `${i}(${inc(i)})`).concat(['custom'])
    })
    //选择了自定义交互式输入版本号
    if (release === 'custom') {
      targetVersion = (
        await prompt({
          type: 'input',
          name: 'version',
          message: '输入版本号',
          initial: currentVersion
        })
      ).version
    } else {
      targetVersion = release.match(/\((.*)\)/)[1]
    }
  }
  if (!semver.valid(targetVersion)) {
    throw new Error(`Invalid target version ${targetVersion}`)
  }
  const { yes } = await prompt({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion}. Confirm`
  })
  if (!yes) {
    return
  }
  console.log(targetVersion)
  return targetVersion
}
async function runTest() {
  if (!skipTests) {
    console.log(123123)
    run('node', ['test.js', 'yangkai'])
  } else {
    console.log('(skipped)')
  }
}
async function updateVersions(version) {
  updatePackage(path.resolve(__dirname), version)
  function updatePackage(pkgRoot, version) {
    const pkgPath = path.resolve(pkgRoot, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    //更新自身的version
    pkg.version = version
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  }
}
async function pushCode(version) {
  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' })
  if (stdout) {
    step('\nCommitting changes...')
    await run('git', ['add', '-A'])
    await run('git', ['commit', '-m', `release:v${version}`])
    await run('git', ['push'])
  } else {
    console.log('No changes to commit')
  }
}
async function main() {
  const targetVersion = await validateVersion()
  await runTest()
  await updateVersions(targetVersion)
  await pushCode(targetVersion)
}
main()
