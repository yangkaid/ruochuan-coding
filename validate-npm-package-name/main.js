// 这个包的作用就是验证npm包的名称是否符合要求
const validate = name => {
  let warnings = []
  let errors = []
  //不能为null
  if (name === null) {
    errors.push('name cannot be null')
    return done(warnings, errors)
  }
  //必须是一个字符串
  if (typeof name !== 'string') {
    errors.push('name must be a string')
    return done(warnings, errors)
  }
  //不能以点开始
  if (name.match(/^\./)) {
    errors.push('name cannot start with a period')
  }
  if (name.match(/^_/)) {
    errors.push('name cannot start with an underscore')
  }
  if (name.trim() !== name) {
    errors.push('name cannot contain leading or trailing spaces')
  }
  //不能包含大小写
  if (name.toLocaleLowerCase() !== name) {
    warnings.push('name can no longer cantain capital letters')
  }
  //不能包含特殊符号
  if (/[~'!()*]/.test(name.split('/').slice(-1)[0])) {
    warnings.push('name can no longer contain special characters')
  }
  //不能包含中文
  if (encodeURIComponent(name) !== name) {
    errors.push('name can only contain URL-friendly characters')
    return done(warnings, errors)
  }
  return done(warnings, errors)
}

const done = (warnings, errors) => {
  let result = {
    validForNewPackages: errors.length === 0 && warnings.length === 0,
    validForOldPackages: errors.length === 0,
    warnings: warnings,
    errors: errors
  }
  if (!result.warnings.length) {
    delete result.warnings
  }
  if (!result.errors.length) {
    delete result.errors
  }
  return result
}

let args = process.argv[2]
console.log(args)
const res = validate(args)
console.log(res)
