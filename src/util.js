const config = {
  pen: {
    size: 4,
    fillStyle: '#000',
    strokeStyle: '#f00'
  },
  canvas: {
    width: 200,
    height: 200,
    size: 200
  },
  grid: 32,
  like: 0.2,
  accept: 0.6,
  grayThreshold: 128
}

const fontLib = []

exports.config = config
exports.fontLib = fontLib

/**
 * grid data
 * @typedef {Array} GridData
 *
 */

exports.convertImageData = function (data) {
  const arr = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      arr.push(0)
      continue
    }
    if ((data[i] + data[i + 1] + data[i + 2]) > config.grayThreshold * 3) {
      arr.push(0)
    } else {
      arr.push(1)
    }
  }
  return arr
}

exports.detect = function (imageData) {
  const arr = this.convertImageData(imageData.data)
  const rect = {}

  arr.forEach((v, i) => {
    if (v) {
      const y = Math.floor(i / config.canvas.width)
      const x = Math.floor(i % config.canvas.width)

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
    rect.Y = rect.YStart
    rect.X = Math.floor(rect.XStart - (YOffset - XOffset) / 2)
    rect.size = YOffset
  }

  if (YOffset < XOffset) {
    rect.X = rect.XStart
    rect.Y = Math.floor(rect.YStart - (XOffset - YOffset) / 2)
    rect.size = XOffset
  }

  return rect
}

exports.adjustGrid = function (rect) {
  const offset = rect.size % config.grid
  if (offset === 0) {
    return rect
  }

  const toFixed = config.grid - offset
  const half = Math.floor(toFixed / 2)

  return {
    X: rect.X - half,
    Y: rect.Y - half,
    size: rect.size + toFixed
  }
}

exports.generateGridData = function (data, size) {
  const arr = this.convertImageData(data)
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
      gridData[y + x * grid] = percent > config.accept ? percent : 0
    }
  }
  return gridData
}

exports.compareArray = function (a, b) {
  const arr = []
  a.forEach((v, i) => {
    arr.push(Math.abs(v - b[i]) < config.like)
  })
  return parseFloat(100 * arr.filter(v => !!v).length / arr.length).toFixed(2)
}

exports.combineArray = function (a, b) {
  const arr = []
  a.forEach((v, i) => {
    arr.push((v + b[i]) / 2)
  })
  return arr
}

/**
 * set canvas size
 * @param {Element} cvs
 * @param {Number} size
 */
exports.setSize = function (cvs, size) {
  cvs.width = size
  cvs.height = size
  cvs.style.width = size + 'px'
  cvs.style.height = size + 'px'
}

exports.clearCanvas = function (cvs) {
  cvs.getContext('2d').clearRect(0, 0, cvs.width, cvs.height)
}

/**
 * get grid area from canvas
 * @param {Element} cvs
 * @return {{X, Y, size}}
 */
exports.getGridArea = function (cvs) {
  const ctx = cvs.getContext('2d')
  return this.adjustGrid(this.detect(ctx.getImageData(0, 0, cvs.width, cvs.height)))
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
  this.setSize(cvs, config.canvas.size)
  const ctx = cvs.getContext('2d')

  ctx.clearRect(0, 0, config.canvas.size, config.canvas.size)
  ctx.font = `200 ${cvs.height / 2}px ${font}`
  ctx.textAlign = 'center'
  ctx.fillStyle = '#000'
  ctx.fillText(str, cvs.width / 2, cvs.height / 2)

  const rect = this.getGridArea(cvs)
  const imgData = ctx.getImageData(rect.X, rect.Y, rect.size, rect.size)
  const data = this.generateGridData(imgData.data, rect.size)

  this.setSize(cvs, rect.size)
  ctx.putImageData(imgData, 0, 0)

  fontLib.push({
    value: str,
    data,
    img: cvs.toDataURL(),
    size: rect.size
  })
}

exports.fixFont = function (fontLibItem, gridData) {
  fontLibItem.data = this.combineArray(fontLibItem.data, gridData)
  this.setSize(this._canvas, fontLibItem.size)
  this.clearCanvas(this._canvas)
  this.drawGridData({
    cvs: this._canvas,
    gridData: fontLibItem.data,
    rect: {
      X: 0,
      Y: 0,
      size: fontLibItem.size
    },
    fillStyle: v => `rgba(0, 0, 0, ${v})`
  })
  fontLibItem.img = this._canvas.toDataURL()
}

/**
 * drawGridData
 * @param {Element} cvs
 * @param {GridData} gridData
 * @param {{X, Y, size}} rect
 */
exports.drawGridData = function ({ cvs, gridData, rect, fillStyle }) {
  const ctx = cvs.getContext('2d')
  const step = rect.size / config.grid
  for (let y = 0; y < config.grid; y++) {
    for (let x = 0; x < config.grid; x++) {
      const index = x + y * config.grid
      ctx.fillStyle = fillStyle(gridData[index])
      ctx.fillRect(rect.X + x * step, rect.Y + y * step, step, step)
    }
  }
}
