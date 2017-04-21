const lib = require('./lib')
const { config } = lib

export default class Element {
  constructor (cvs, size = config.canvas.size) {
    if (cvs === undefined) {
      cvs = document.createElement('canvas')
    }
    this.cvs = cvs
    this.size = size
    this.callback = {}
    this.init(cvs)
  }

  init (cvs) {
    lib.setSize(cvs, this.size)
    this.addEvent(['mousedown', 'touchstart'], this.drawStart)
    this.addEvent(['mouseup', 'mouseleave', 'mouseenter', 'touchend'], this.drawEnd)
    this.addEvent(['mousemove', 'touchmove'], this.drawing)
  }

  addEvent (arr, fn) {
    arr.forEach(name => {
      this.cvs.addEventListener(name, fn.bind(this))
    })
  }

  drawing (e) {
    if (!this._line) {
      return
    }
    clearTimeout(this._afterDraw)
    if (e.touches && e.touches[0]) {
      e.offsetX = e.touches[0].pageX
      e.offsetY = e.touches[0].pageY
    }
    this._line.add(e.offsetX, e.offsetY)
  }

  drawStart () {
    this.stashPop()
    this._line = new Line(this.cvs)
  }

  drawEnd () {
    this._line = null
    this._afterDraw = setTimeout(this.afterDraw.bind(this), 600)
  }

  afterDraw () {
    this.stash()
    const area = this.getAdjustDetectArea()
    const data = lib.getGridData(this.cvs, area)
    this.callback.finish(data)
    lib.drawAreaBorder({
      cvs: this.cvs,
      area,
      style: 'rgba(255, 0, 0, 0.5)'
    })
  }

  stash () {
    this._snapshot = this.cvs.getContext('2d').getImageData(0, 0, this.cvs.width, this.cvs.height)
  }

  stashPop () {
    if (!this._snapshot) { return }
    this.cvs.getContext('2d').putImageData(this._snapshot, 0, 0)
    this._snapshot = null
  }

  clear () {
    this._snapshot = null
    lib.clearCanvas(this.cvs)
  }

  getDetectArea () {
    return lib.getDetectArea(this.cvs)
  }

  getAdjustDetectArea () {
    return lib.getAdjustArea(this.cvs)
  }
}

class Line {
  constructor (cvs) {
    this.cvs = cvs
    this.ctx = cvs.getContext('2d')
    this.ratio = window.devicePixelRatio
  }

  add (x, y) {
    x *= this.ratio
    y *= this.ratio
    if (this._last) {
      this.drawLine(this._last, { x, y })
    }
    this.drawArc(x, y)
    this._last = { x, y }
  }

  drawLine (p, n) {
    this.ctx.beginPath()
    this.ctx.moveTo(p.x, p.y)
    this.ctx.lineTo(n.x, n.y)
    this.ctx.lineWidth = config.pen.size * 2
    this.ctx.strokeStyle = config.pen.fillStyle
    this.ctx.stroke()
  }

  drawArc (x, y) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, config.pen.size, 0, Math.PI * 2)
    this.ctx.fillStyle = config.pen.fillStyle
    this.ctx.fill()
  }
}
