import ConfigStore from "./main.js";
import fs from 'fs'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
console.log(pkg);

const config = new ConfigStore(pkg.name, pkg, {foo: 'bar'})

console.log(config.get('version'))