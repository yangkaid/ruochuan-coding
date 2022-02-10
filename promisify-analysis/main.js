// promisify函数的功能主要就是把callback形式转换成promise形式
//我们知道node.js天生异步，错误回调的形式书写代码，回调函数的第一个参数是错误信息。

function promisify(original) {
  function fn(...args) {
    return new Promise((resolve, reject) => {
      args.push((err, ...values) => {
        if (err) {
          reject(err)
        }
        resolve(values)
      })
      /*
        通过指定的参数列表发起对目标(target)函数的调用。
        target:目标函数。
        thisArgument:target函数调用时绑定的this对象。
        argumentsList:target函数调用时传入的实参列表，该参数应该是一个类数组的对象。
        reutrn 返回值是调用完带着指定参数和 this 值的给定的函数后返回的结果。
      */
      Reflect.apply(original, this, args)
    })
  }
}

// const iamgeSrc = 'https://www.themealdb.com/images/ingredients/Lime.png'
function loadImage(src, callback) {
  const image = document.createElement('img')
  iamge.src = src
  image.alt = '公众号若川视野专用图？'
  image.style = 'width: 200px;height: 200px'
  image.onload = () => callback(null, image)
  image.onerror = () => callback(new Error('加载失败'))
  document.body.append(image)
}

const loadImagePromise = promisify(loadImage)
async function load() {
  try {
    const res = await loadImagePromise(imageSrc)
    console.log(res)
  } catch (error) {
    console.log(error)
  }
}
load()
