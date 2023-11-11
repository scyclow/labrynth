const SIZE = 2800

const GRID_SIZE = rndint(5, 26)
const FILLER_RINGS = chance(
  [5, 0],
  [5, 1],
  [70, 2],
  [15, 3],
  [5, 4]
)


const FILLER_SPACING = rnd(0.125, 0.2) * (2 / (FILLER_RINGS||1))

const PADDING = (FILLER_RINGS+1)*FILLER_SPACING*SIZE/GRID_SIZE

const thickProb =
  GRID_SIZE > 9 ? 0.25 :
  GRID_SIZE < 7 ? 1 :
  0.5

const STROKE_WIDTH = prb(thickProb) ? 'thick' : 'normal'
const STROKE_WIDTH_1 = 8
const STROKE_WIDTH_2 = STROKE_WIDTH === 'thick' ? 8 : 5
const HIDE_DIVISOR_LINE = FILLER_RINGS ? prb(0.25) : false

const DENSE = prb(0.9)

svg = new SVG(SIZE + PADDING*2, SIZE + PADDING*2)

const COLOR_COUNT = chance(
  [1, 1],
  [5, 2],
  [4, 3],
)


const DARK_COLOR_SCHEME = prb(0.5)

let BG_COLOR
let COLOR_PALETTE
if (DARK_COLOR_SCHEME) {
  BG_COLOR = '#000'
  COLOR_PALETTE = [
    pen.white,
    pen.red,
    pen.yellow,
    pen.teal,
    pen.orange,
    pen.magenta,
    pen.lime,
  ]
} else {
  BG_COLOR = '#fff'
  COLOR_PALETTE = [
    pen.black,
    pen.blue,
    pen.red,
    pen.purple,
  ]
}

svg.svg.style.background = BG_COLOR

const DIVISOR_STROKE_COLOR = sample(COLOR_PALETTE)
const FILLER_STROKE_COLOR = COLOR_COUNT === 1 || HIDE_DIVISOR_LINE
  ? DIVISOR_STROKE_COLOR
  : sample(COLOR_PALETTE)

const FILLER_STROKE_ALT_COLOR = COLOR_COUNT < 3
  ? sample([DIVISOR_STROKE_COLOR, FILLER_STROKE_COLOR])
  : sample(COLOR_PALETTE)


let LINE_COUNT = GRID_SIZE




console.log({
  G: GRID_SIZE,
  F: FILLER_RINGS,
  P1: penName(DIVISOR_STROKE_COLOR, STROKE_WIDTH_1),
  P2: penName(FILLER_STROKE_COLOR, STROKE_WIDTH_2),
  P3: penName(FILLER_STROKE_ALT_COLOR, STROKE_WIDTH_2),
  IMAGINED_DIVISORS: HIDE_DIVISOR_LINE,
  MAX_10_DIVISORS: DENSE
})




const toCoord = p => (p * SIZE / GRID_SIZE) + PADDING



const grid = times(GRID_SIZE + 1, x => times(GRID_SIZE + 1, y => []))
const storeLine = (x1, y1, x2, y2, metadata={}) => {
  if (
    grid[x2][y2].length &&
    grid[x2][y2][0].x2 === x1 &&
    grid[x2][y2][0].y2 === y1
  ) return


  grid[x1][y1].push({ x1, y1, x2, y2, metadata })
}






times(GRID_SIZE, x => storeLine(x, 0, x+1, 0, {edge: true}))
times(GRID_SIZE, y => storeLine(GRID_SIZE, y, GRID_SIZE, y+1, {edge: true}))
times(GRID_SIZE, x => storeLine(GRID_SIZE - x, GRID_SIZE, GRID_SIZE - (x+1), GRID_SIZE, {edge: true}))
times(GRID_SIZE, y => storeLine(0, GRID_SIZE - y, 0, GRID_SIZE - (y+1), {edge: true}))


function drawDivisorLine(xStart, yStart, i) {
  let x1 = xStart
  let y1 = yStart
  let progress = true
  let originX, originY

  while (progress) {
    const surroundingPoints = []
    if (x1 > 0) {
      surroundingPoints.push(
        { x: x1-1, y: y1, existing: !!grid[x1-1][y1].length}
      )
    }
    if (x1 < GRID_SIZE) {
      surroundingPoints.push(
        { x: x1+1, y: y1, existing: !!grid[x1+1][y1].length}
      )
    }
    if (y1 > 0) {
      surroundingPoints.push(
        { x: x1, y: y1-1, existing: !!grid[x1][y1-1].length}
      )
    }
    if (y1 < GRID_SIZE) {
      surroundingPoints.push(
        { x: x1, y: y1+1, existing: !!grid[x1][y1+1].length}
      )
    }

    const validPoints = surroundingPoints.filter(p => !(p.x === originX && p.y === originY))

    if (validPoints.some(p => !p.existing)) {
      const {x, y} = sample(validPoints.filter(p => !p.existing))

      storeLine(x1, y1, x, y, {divisor: true, line: i})

      ;([originX, originY] = [x1, y1])
      ;([x1, y1] = [x, y])

    } else {
      if (!originX && !originY) return

      const edgePoint = chance(

        ...validPoints.filter(
          p =>
            p.x === 0 ||
            p.x === GRID_SIZE ||
            p.y === 0 ||
            p.y === GRID_SIZE
        )
      )


      const sampledValidPoint = sample(validPoints)
      const { x, y } = edgePoint || sampledValidPoint

      storeLine(x1, y1, x, y, {end: true, divisor: true, line: i})

      progress = false
    }
  }
}

times(GRID_SIZE, i => {
  const s1 = prb(0.5) ? 0 : GRID_SIZE
  const s2 = rndint(1, GRID_SIZE-1)

  const [xStart, yStart] = prb(0.5) ? [s1, s2] : [s2, s1]
  drawDivisorLine(xStart, yStart, i)
})

if (DENSE) {
  times(GRID_SIZE, x => drawDivisorLine(x, 0, LINE_COUNT++))
  times(GRID_SIZE, y => drawDivisorLine(GRID_SIZE, y, LINE_COUNT++))
  times(GRID_SIZE, x => drawDivisorLine(GRID_SIZE - x, GRID_SIZE, LINE_COUNT++))
  times(GRID_SIZE, y => drawDivisorLine(0, GRID_SIZE - y, LINE_COUNT++))
}



const lineList = grid.flat().filter(a => !(Array.isArray(a) && a.length === 0)).flat()
const points = times(GRID_SIZE + 1, x => times(GRID_SIZE + 1, y => ({})))


lineList.forEach(l => {
  if (l.x1 < l.x2) {
    points[l.x1][l.y1].r = true
    points[l.x2][l.y2].l = true
  }
  if (l.x1 > l.x2) {
    points[l.x1][l.y1].l = true
    points[l.x2][l.y2].r = true
  }

  if (l.y1 < l.y2) {
    points[l.x1][l.y1].d = true
    points[l.x2][l.y2].u = true
  }
  if (l.y1 > l.y2) {
    points[l.x1][l.y1].u = true
    points[l.x2][l.y2].d = true
  }
})


function drawInnerBorders(spacing, args1, args2) {
  times(GRID_SIZE + 1, x =>
    times(GRID_SIZE + 1, y => {
      if (points[x][y].r) {
        let xStartB, xEndB, xStartT, xEndT

        if (points[x][y].d) {
          xStartB = toCoord(x) + spacing
        } else if (points[x][y].l) {
          xStartB = toCoord(x)
        } else if (points[x][y].u) {
          xStartB = toCoord(x) - spacing
        }

        if (points[x][y].u) {
          xStartT = toCoord(x) + spacing
        } else if (points[x][y].l) {
          xStartT = toCoord(x)
        } else if (points[x][y].d) {
          xStartT = toCoord(x) - spacing
        }


        if (points[x+1][y].d) {
          xEndB = toCoord(x+1) - spacing
        } else if (points[x+1][y].r) {
          xEndB = toCoord(x+1)
        } else if (points[x+1][y].u) {
          xEndB = toCoord(x+1) + spacing
        }

        if (points[x+1][y].u) {
          xEndT = toCoord(x+1) - spacing
        } else if (points[x+1][y].r) {
          xEndT = toCoord(x+1)
        } else if (points[x+1][y].d) {
          xEndT = toCoord(x+1) + spacing
        }

        svg.drawLine(xStartB, toCoord(y)+spacing, xEndB, toCoord(y)+spacing, args1)
        svg.drawLine(xStartT, toCoord(y)-spacing, xEndT, toCoord(y)-spacing, args1)
      }

      if (points[x][y].d) {
        let yStartR, yEndR, yStartL, yEndL

        if (points[x][y].r) {
          yStartR = toCoord(y) + spacing
        } else if (points[x][y].u) {
          yStartR = toCoord(y)
        } else if (points[x][y].l) {
          yStartR = toCoord(y) - spacing
        }

        if (points[x][y].l) {
          yStartL = toCoord(y) + spacing
        } else if (points[x][y].u) {
          yStartL = toCoord(y)
        } else if (points[x][y].r) {
          yStartL = toCoord(y) - spacing
        }


        if (points[x][y+1].r) {
          yEndR = toCoord(y+1) - spacing
        } else if (points[x][y+1].d) {
          yEndR = toCoord(y+1)
        } else if (points[x][y+1].l) {
          yEndR = toCoord(y+1) + spacing
        }

        if (points[x][y+1].l) {
          yEndL = toCoord(y+1) - spacing
        } else if (points[x][y+1].d) {
          yEndL = toCoord(y+1)
        } else if (points[x][y+1].r) {
          yEndL = toCoord(y+1) + spacing
        }

        svg.drawLine(toCoord(x)+spacing, yStartR, toCoord(x)+spacing, yEndR, args2)
        svg.drawLine(toCoord(x)-spacing, yStartL, toCoord(x)-spacing, yEndL, args2)
      }

    })
  )
}


const strokeWidthDiff = STROKE_WIDTH_1 - STROKE_WIDTH_2
if (!HIDE_DIVISOR_LINE) {
  lineList.forEach(l => {
    svg.drawLine(
      toCoord(l.x1),
      toCoord(l.y1),
      toCoord(l.x2),
      toCoord(l.y2),
      {stroke: DIVISOR_STROKE_COLOR, strokeWidth: STROKE_WIDTH_1}
    )
  })
}

times(FILLER_RINGS, r =>
  drawInnerBorders(
    (r+1)*FILLER_SPACING*SIZE/GRID_SIZE + strokeWidthDiff,
    {stroke: FILLER_STROKE_COLOR, strokeWidth: STROKE_WIDTH_2},
    {stroke: FILLER_STROKE_ALT_COLOR, strokeWidth: STROKE_WIDTH_2}
  )
)


svg.mount()


let DRAW_MODE
let DEBUG_SVG

window.onkeypress = function(e) {
  if (e.code === 'Space') {
    const serializer = new XMLSerializer()
    const el = DRAW_MODE ? DEBUG_SVG : svg
    const source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(el.svg)
    const a = document.createElement("a")
    a.href = "data:image/svg+xmlcharset=utf-8,"+encodeURIComponent(source)
    a.download = `${tokenData.hash}${DRAW_MODE ? '-debug' : ''}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

  } else if (e.code === 'KeyD') {
    if (DRAW_MODE) {
      svg.svg.style.display = 'inherit'
      DEBUG_SVG.svg.remove()

    } else {
      svg.svg.style.display = 'none'

      DEBUG_SVG = new SVG(SIZE + PADDING*2, SIZE + PADDING*2, 'debug-view')
      DEBUG_SVG.svg.style.background = BG_COLOR

      times(GRID_SIZE + 1, x => {
        DEBUG_SVG.drawLine(
          toCoord(x), toCoord(0), toCoord(x), toCoord(GRID_SIZE),
          {stroke: DARK_COLOR_SCHEME ? pen.white : pen.black, opacity: 0.2}
        )
      })

      times(GRID_SIZE + 1, y => {
        DEBUG_SVG.drawLine(
          toCoord(0), toCoord(y), toCoord(GRID_SIZE), toCoord(y),
          {stroke: DARK_COLOR_SCHEME ? pen.white : pen.black, opacity: 0.2}
        )
      })



      DEBUG_SVG.css(`
        .edge {
          cursor: pointer;
        }

        .active-edge .edge {
          stroke-width: 15 !important;
        }
      `)

      times(LINE_COUNT + 1, l => {
        DEBUG_SVG.css(`
          .line-${l} {
            cursor: pointer;
          }
          .active-line-${l} .line-${l} {
            stroke-width: 25 !important;
          }
        `)
      })


      lineList.forEach(l => {
        let x1 = toCoord(l.x1)
        let y1 = toCoord(l.y1)
        let x2 = toCoord(l.x2)
        let y2 = toCoord(l.y2)

        if (l.metadata.end) {
          x2 = (x2+x1) / 2
          y2 = (y2+y1) / 2
        }
        const line = DEBUG_SVG.drawLine(
          x1, y1, x2, y2,
          {stroke: DIVISOR_STROKE_COLOR, strokeWidth: 10}
        )

        const className = l.metadata.edge
          ? 'edge'
          : `line-${l.metadata.line}`

        line.addEventListener('mouseover', () => {
          DEBUG_SVG.svg.classList.add('active-' + className)
        })

        line.addEventListener('mouseout', () => {
          DEBUG_SVG.svg.classList.remove('active-' + className)

        })

        line.classList.add(className)
      })

      DEBUG_SVG.mount()
    }
    DRAW_MODE = !DRAW_MODE
  }

}

