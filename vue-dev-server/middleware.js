const vueCompiler = require('@vue/component-compiler')
const fs = require('fs')
const stat = require('util').promisify(fs.stat)
const root = process.cwd()
const path = require('path')
const parseUrl = require('parseurl')
const readSource = require('./readSource')
const { transformModuleImports } = require('./transformModuleImports')
const { loadPkg } = require('./loadPkg')

const defaultOptions = {
  cache: true
}
const vueMiddleware = (options = defaultOptions) => {
  let cache
  let time = {}
  if (options.cache) {
    const LRU = require('lru-cache')

    cache = new LRU({
      max: 500,
      length: function (n, key) {
        return n * 2 + key.length
      }
    })
  }
  const compiler = vueCompiler.createDefaultCompiler()

  async function tryCache(key, checkUpdateTime = true) {
    const data = cache.get(key)

    if (checkUpdateTime) {
      const cacheUpdateTime = time[key]
      const fileUpdateTime = (
        await stat(path.resolve(root, key.replace(/^\//, '')))
      ).mtime.getTime()
      if (cacheUpdateTime < fileUpdateTime) return null
    }

    return data
  }

  function send(res, source, mime) {
    res.setHeader('Content-Type', mime)
    res.end(source)
  }

  function injectSourceMapToBlock(block, lang) {
    const map = Base64.toBase64(JSON.stringify(block.map))
    let mapInject
    switch (lang) {
      case 'js':
        mapInject = `//# sourceMappingURL=data:application/json;base64,${map}\n`
        break
      case 'css':
        mapInject = `/*# sourceMappingURL=data:application/json;base64,${map}*/\n`
      default:
        break
    }
    return {
      ...block,
      code: mapInject + block.code
    }
  }

  function injectSourceMapToScript(script) {
    return injectSourceMapToBlock(script, 'js')
  }

  function injectSourceMapToStyle(styles) {
    return styles.map(styles => injectSourceMapToBlock(styles, 'css'))
  }

  // 根据这个函数，根据@vue/component-compiler转换单文件组件，最终返回浏览器能够识别的文件
  async function bundleSFC(req) {
    const { filepath, source, updateTime } = await readSource(req)
    const descriptorResult = compiler.compileToDescriptor(filepath, source)
    const assembleResult = vueCompiler.assemble(compiler, filepath, {
      ...descriptorResult,
      script: injectSourceMapToScript(descriptorResult.script),
      styles: injectSourceMapToStyle(descriptorResult.styles)
    })
    return { ...assembleResult, updateTime }
  }

  return async (req, res, next) => {
    console.log(req.path)
    if (req.path.endsWith('.vue')) {
      const key = parseUrl(req).pathname
      console.log(key)
      const result = await bundleSFC(req)
      out = result
      send(res, out.code, 'application/javascript')
    } else if (req.path.endsWith('.js')) {
      const result = await readSource(req)
      out = transformModuleImports(result.source)
      send(res, out, 'application/javascript')
    } else if (req.path.startsWith('/__modules/')) {
      const key = parseUrl(req).pathname
      const pkg = req.path.replace(/^\/__modules\//, '')
      out = (await loadPkg(pkg)).toString()
      send(res, out, 'application/javascript')
    }
  }
}

module.exports = vueMiddleware
