exports.config = {
  pen: {
    size: 4,
    fillStyle: '#000000',
    strokeStyle: 'red'
  },
  canvas: {
    width: 200,
    height: 200
  },
  grid: 32,
  like: 0.3
}

exports.convertImageData = function (data) {
  const arr = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] || data[i + 1] || data[i + 2] || data[i + 3]) {
      arr.push(1)
    } else {
      arr.push(0)
    }
  }
  return arr
}

exports.detect = function (imageData) {
  const arr = this.convertImageData(imageData.data)
  const rect = {}

  arr.forEach((v, i) => {
    if (v) {
      const y = Math.floor(i / this.config.canvas.width)
      const x = Math.floor(i % this.config.canvas.width)

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
  const offset = rect.size % this.config.grid
  if (offset === 0) {
    return rect
  }

  const toFixed = this.config.grid - offset
  const half = Math.floor(toFixed / 2)

  return {
    X: rect.X - half,
    Y: rect.Y - half,
    size: rect.size + toFixed
  }
}

exports.generateGridData = function (data, size) {
  const arr = this.convertImageData(data)
  const grid = this.config.grid
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
      gridData[y + x * grid] = px.filter(p => !!p).length / px.length
    }
  }
  return gridData
}

exports.compareArray = function (a, b) {
  const arr = []
  a.forEach((v, i) => {
    arr.push(Math.abs(v - b[i]) < this.config.like)
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
