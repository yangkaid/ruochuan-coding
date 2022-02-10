// ● write-file-atomic：fs.writeFile的扩展，使其操作原子化，并允许设置所有权
// ● dot-prop： 使用点操作符从嵌套对象中获取、设置或删除属性
// ● unique-string： 随机生成一个 32 位长度字符串

import path from 'path'
import os from 'os'
import fs from 'fs'
import writeFileAtomic from 'write-file-atomic'
import {getProperty, setProperty, hasProperty, deleteProperty} from 'dot-prop'
import uniquiString from 'unique-string'

const configDirectory = path.join(os.tmpdir(), uniquiString())
const permissionError = 'you do not have access to this file'
const mkdirOptions = {
  mode: 0o0700,
  recursive: true
}
const writeFileOptions = {
  mode: 0o0600
}

export default class ConfigStore {
  constructor(id, defaults, options = {}) {
    const pathPrefix = options.globalConfigPath
      ? path.join(id, 'config.json')
      : path.join('configstore', `${id}.json`)
    this._path = options.configPath || path.join(configDirectory, pathPrefix)
    if (defaults) {
      this.all = {
        ...defaults,
        ...this.all
      }
    }
  }
  get all() {
    try {
      return JSON.parse(fs.readFileSync(this._path, 'utf-8'))
    } catch (error) {
      //就没存过，返回{}
      if (error.code === 'ENOENT') {
        return {}
      }
      // 没权限报错
      if (error.code === 'EACCES') {
        error.message = `${error.message}\n${permissionError}`
      }
      // 这是个无效的json
      if (error.name === 'SyntaxError') {
        writeFileAtomic.sync(this._path, '', writeFileOptions)
        return {}
      }
      throw error
    }
  }

  set all(value) {
    try {
      //同步的创建目录，返回undefined或创建的第一个目录路径（如果 recursive 为 true）
      fs.mkdirSync(path.dirname(this._path), mkdirOptions)
      // 给文件写入权限并写入
      writeFileAtomic.sync(
        this._path,
        JSON.stringify(value, undefined, '\t'),
        writeFileOptions
      )
    } catch (error) {
      if (error.code === 'EACCES') {
        error.message = `${error.message}\n${permissionError}\n`
      }
    }
  }

  get size() {
    return Object.keys(this.all || {}).length
  }

  get(key) {
    return getProperty(this.all, key)
  }

  set(key, value) {
    const config = this.all
    if (arguments.length === 1) {
      for (const k of Object.keys(key)) {
        setProperty(config, k, key[k])
      }
    } else {
      setProperty(config, key, value)
    }
    this.all = config
  }

  has(key) {
    return hasProperty(this.all, key)
  }

  delete(key) {
    const config = this.all
    deleteProperty(config, key)
    this.all = config
  }

  clear() {
    this.all = {}
  }

  get path() {
    return this._path
  }
}
