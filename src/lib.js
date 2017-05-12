const config = {
  pen: {
    size: 12,
    fillStyle: '#000'
  },
  canvas: {
    width: 200,
    height: 200,
    size: window.innerWidth > 400 ? 400 : window.innerWidth
  },
  grid: 32,
  like: 0.1,
  accept: 0.6,
  grayThreshold: 128
}

const fontLib = []
const userDraw = {}

exports.config = config
exports.fontLib = fontLib
exports.userDraw = userDraw

/**
 * grid data
 * @typedef {Array} GridData
 *
 */

/**
 * convert ImageData into gray Array
 * @param {Uint8ClampedArray} data
 * @return {Array}
 */
exports.convertImageData = function (data) {
  const arr = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      arr.push(0)
      continue
    }
    if ((data[i] + data[i + 1] + data[i + 2]) > config.grayThreshold * 3 && data[i + 3] < config.accept) {
      arr.push(0)
    } else {
      arr.push(1)
    }
  }
  return arr
}

exports.compareArray = function (a, b) {
  let matched = 0
  a.forEach((v, i) => {
    if (v === 0 && b[i] === 0) {
      return
    }
    if (Math.abs(v - b[i]) < config.like) {
      matched++
    }
  })
  const validPoint = a.filter(v => v > 0).length + b.filter(v => v > 0).length
  return parseFloat(matched / validPoint).toFixed(4)
}

exports.combineArray = function (a, b, acc) {
  acc = acc || 0.5
  const arr = []
  a.forEach((v, i) => {
    arr.push(v * (1 - acc) + b[i] * acc)
  })
  return arr
}

/**
 * set canvas size
 * @param {Element} cvs
 * @param {Number} size
 */
exports.setSize = function (cvs, size) {
  cvs.width = size * window.devicePixelRatio
  cvs.height = size * window.devicePixelRatio
  cvs.style.width = size + 'px'
  cvs.style.height = size + 'px'
}

/**
 * clear canvas
 * @param {Element} cvs
 */
exports.clearCanvas = function (cvs) {
  cvs.getContext('2d').clearRect(0, 0, cvs.width, cvs.height)
}

/**
 * add font to fontLib
 * @param {String|Number} str
 * @param {Object} fontStyle
 */
exports.addFont = function (str, font) {
  if (this._canvas === undefined) {
    this._canvas = document.createElement('canvas')
  }
  const cvs = this._canvas
  this.setSize(cvs, config.grid * 4)
  const ctx = cvs.getContext('2d')

  this.clearCanvas(cvs)
  ctx.font = `200 ${cvs.height / 2}px ${font}`
  ctx.textAlign = 'center'
  ctx.fillStyle = '#000'
  ctx.fillText(str, cvs.width / 2, cvs.height / 2)

  const area = this.getAdjustArea(cvs)
  const data = this.getGridData(cvs, area)

  this.setSize(cvs, area.size)
  this.drawArea({
    cvs,
    data,
    area: { x: 0, y: 0, size: area.size * window.devicePixelRatio },
    style: v => `rgba(0, 0, 0, ${v})`
  })

  fontLib.push({
    value: str,
    data,
    img: cvs.toDataURL(),
    size: area.size
  })
}

/**
 * add custom font to fontLib
 * @param {String} value
 */
exports.addCustomFont = function (value) {
  const cvs = this._canvas
  const data = userDraw.data
  this.setSize(cvs, config.canvas.size)
  this.clearCanvas(cvs)
  this.drawArea({
    cvs,
    data,
    area: { x: 0, y: 0, size: this._canvas.width },
    style: v => `rgba(0, 0, 0, ${v})`
  })

  fontLib.push({
    value,
    data,
    img: cvs.toDataURL(),
    size: config.canvas.size
  })
}

exports.fixFont = function (fontLibItem, acc) {
  this.setSize(this._canvas, fontLibItem.size)
  this.clearCanvas(this._canvas)
  this.drawArea({
    cvs: this._canvas,
    data: userDraw.data,
    compare: fontLibItem.data,
    area: { x: 0, y: 0, size: this._canvas.width },
    style: (a, b) => `rgba(0, 0, 0, ${a * (1 - acc) + b * acc})`
  })
  fontLibItem.data = this.getAdjustGridData(this._canvas, 0.9)
  this.drawArea({
    cvs: this._canvas,
    data: fontLibItem.data,
    area: { x: 0, y: 0, size: this._canvas.width },
    style: v => `rgba(0, 0, 0, ${v})`
  })
  fontLibItem.img = this._canvas.toDataURL()
}

/**
 * drawGridData
 * @param {Element} cvs
 * @param {GridData} data
 * @param {{X, Y, size}} area
 */
exports.drawArea = function ({ cvs, data, area, style, compare }) {
  const ctx = cvs.getContext('2d')
  this.clearCanvas(cvs)
  const step = area.size / config.grid
  for (let y = 0; y < config.grid; y++) {
    for (let x = 0; x < config.grid; x++) {
      const index = x + y * config.grid
      if (compare) {
        ctx.fillStyle = style(data[index], compare[index])
      } else {
        ctx.fillStyle = style(data[index])
      }
      ctx.fillRect(area.x + x * step, area.x + y * step, step, step)
    }
  }
}

/**
 * drawAreaBorder
 * @param {Element} cvs
 * @param {{X, Y, size}} area
 */
exports.drawAreaBorder = function ({ cvs, area, style }) {
  const ctx = cvs.getContext('2d')
  ctx.strokeStyle = style
  ctx.lineWidth = 1
  ctx.strokeRect(area.x, area.y, area.size, area.size)
}

/**
 * detect text area from canvas
 * @param {Element} cvs
 * @return {{ x, y, size }}
 */
exports.getDetectArea = function (cvs) {
  const imageData = cvs.getContext('2d').getImageData(0, 0, cvs.width, cvs.height)
  const arr = this.convertImageData(imageData.data)
  const rect = {}

  arr.forEach((v, i) => {
    if (v) {
      const y = Math.floor(i / cvs.width)
      const x = Math.floor(i % cvs.width)

      if (rect.XStart === undefined) {
        rect.XStart = x
        rect.XEnd = x
        rect.YStart = y
        rect.YEnd = y
        return
      }

      if (x < rect.XStart) {
        rect.XStart = x
      }

      if (x > rect.XEnd) {
        rect.XEnd = x
      }

      if (y < rect.YStart) {
        rect.YStart = y
      }

      if (y > rect.YEnd) {
        rect.YEnd = y
      }
    }
  })

  const XOffset = rect.XEnd - rect.XStart
  const YOffset = rect.YEnd - rect.YStart

  if (YOffset >= XOffset) {
    rect.y = rect.YStart
    rect.x = Math.floor(rect.XStart - (YOffset - XOffset) / 2)
    rect.size = YOffset
  }

  if (YOffset < XOffset) {
    rect.x = rect.XStart
    rect.y = Math.floor(rect.YStart - (XOffset - YOffset) / 2)
    rect.size = XOffset
  }

  return rect
}

/**
 * adjust area to grid size
 * @param {{ x, y, size }} rect
 * @return {{ x, y, size }}
 */
exports.adjustArea = function (rect) {
  const offset = rect.size % config.grid
  if (offset === 0) {
    return rect
  }

  const toFixed = config.grid - offset
  const half = Math.floor(toFixed / 2)

  return {
    x: rect.x - half,
    y: rect.y - half,
    size: rect.size + toFixed
  }
}

/**
 * detect text area from canvas (adjusted)
 * @param {Element} cvs
 * @return {{ x, y, size }}
 */
exports.getAdjustArea = function (cvs) {
  return this.adjustArea(this.getDetectArea(cvs))
}

/**
 * get grid data
 * @param {Element} cvs
 * @param {{ x, y, size }} area
 * @return {Array}
 */
exports.getGridData = function (cvs, area, acc) {
  acc = acc || config.accept
  const imageData = cvs.getContext('2d').getImageData(area.x, area.y, area.size, area.size)
  const arr = this.convertImageData(imageData.data)
  const size = area.size
  const grid = config.grid
  const step = size / grid
  const gridData = []
  for (let x = 0; x < grid; x++) {
    for (let y = 0; y < grid; y++) {
      const px = []
      for (let xx = 0; xx < step; xx++) {
        for (let yy = 0; yy < step; yy++) {
          px.push(arr[y * step + x * size * step + yy + xx * size])
        }
      }
      const percent = px.filter(p => !!p).length / px.length
      gridData[y + x * grid] = percent > acc ? percent : 0
    }
  }
  return gridData
}

exports.getAdjustGridData = function (cvs, acc) {
  const area = this.getAdjustArea(cvs)
  return this.getGridData(cvs, area, acc)
}

/**
 * init fontLib with 0-9 a-z
 */
exports.initFontLib = function () {
  if (fontLib.length) { return }
  for (let i = 48; i < 91; i++) {
    if (i > 57 && i < 65) {
      continue
    }
    this.addFont(String.fromCharCode(i), `sans-serif`)
  }
}

/**
 * find best match font and save user data
 * @param {Array} data
 */
exports.findMatch = function (data) {
  fontLib.forEach(font => {
    font.acc = this.compareArray(data, font.data)
  })
  userDraw.data = data
  fontLib.sort((a, b) => b.acc - a.acc)
  return fontLib[0]
}
