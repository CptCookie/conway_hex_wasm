import { Universe, Cell } from "wasm-hex-life";
import { memory } from "wasm-hex-life/hex_life_bg.wasm";

const pre = document.getElementById("wasm");
const can = document.getElementById("can");
const ctx = can.getContext("2d");

const universe = Universe.new();
const width = universe.width();
const height = universe.height();

const GRID_COLOR = "#CCCCCC";
const ALIVE_COLOR = "#1c1c1c";
const MAX_FRAMES = 5;
const TIME_PER_FRAME_MS = 1000 / MAX_FRAMES;


const hex_a = 2 * Math.PI / 6;             // inner angles
const hex_r = 10;                          // length from the center to the pik side
const hex_f =     Math.sin(hex_a) * hex_r; // length from the center to the flat side
const hex_s = 2 * Math.cos(hex_a) * hex_r; // length of one of the six sides


const getIndex = (row, column) => {
  "use strict";
  return row * width + column;
};

function drawHexagon(row, col, fill) {
  "use strict";
  let x = 2 * hex_r + col * 2 * hex_f + row % 2 * hex_f;
  let y = 2 * hex_r + row * 3/2 * hex_r;

  ctx.strokeStyle = GRID_COLOR;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(x + hex_r * Math.sin(hex_a * i), y + hex_r * Math.cos(hex_a * i));
  }
  ctx.closePath();
  ctx.stroke();

  if (fill) {
    ctx.fillStye = ALIVE_COLOR;
    ctx.fill();
  }
}


function drawUniverse() {
  "use strict";
  ctx.clearRect(0, 0, can.width, can.height);
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  for (let w = 0; w < width; w++) {
    for (let h = 0; h < height; h++) {
      drawHexagon(h, w, cells[getIndex(h,w)] === Cell.Alive);
    }
  }
}

can.addEventListener("click", event => {
  "use strict";
  const boundingRect = can.getBoundingClientRect();

  const scaleX = can.width / boundingRect.width;
  const scaleY = can.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  universe.toggle_cell(row, col);
});

const get_field_from_pixels = (x, y) => {
  "use strict";
  const rows = [Math.floor(y/hex_r), Math.ceil(y/hex_r)];
  const distances = rows.map(r => {
    const raw_col = (x - (r % 2 * hex_r / 2)) / hex_r;
    const left = (r, Math.floor(raw_col))
    const right = (r, Math.ceil(raw_col))
  }).flat();


  return (0,0);
}


const disance_point_field = (px, py, fr, fc) => {
  const fy = fr * hex_r + hex_r / 2
  const fx = fc * hex_f + hex_f / 2 + fr % 2 * hex_f / 2

  const dx = Math.abs(px - fx)
  const dy = Math.abs(py -fy)

  return Math.sqrt(dx ** 2 + dy ** 2)
}


const renderLoop = () => {
  "use strict";
  let pre_time = new Date();
  universe.tick();
  drawUniverse();
  let render_time = new Date() - pre_time;

  if(render_time < TIME_PER_FRAME_MS){
    setTimeout(()=> {requestAnimationFrame(renderLoop);}, TIME_PER_FRAME_MS-render_time);
  } else {
    requestAnimationFrame(renderLoop);
  }
};

requestAnimationFrame(renderLoop);

