import { Universe, Cell } from "wasm-hex-life";
import { memory } from "wasm-hex-life/hex_life_bg.wasm";

const canvas_size = 20 // hexs
const hex_a = 2 * Math.PI / 6;              // inner angles
const hex_ro = 20;                          // length from the center to the pik side
const hex_ri = Math.sin(hex_a) * hex_ro;    // length from the center to the flat side

const play_button = document.getElementById("play");
const tick_button = document.getElementById("tick");
const canvas = document.getElementById("can");
canvas.width = canvas_size * hex_ri * 2 + hex_ri + canvas_size / 2
canvas.height = canvas_size * hex_ro * 3/2 + canvas_size
const ctx = canvas.getContext("2d");

const universe = Universe.new(canvas_size, canvas_size);
const width = universe.width();
const height = universe.height();

const GRID_COLOR = "#CCCCCC";
const ALIVE_COLOR = "#1c1c1c";
const MAX_FRAMES = 60;
const TIME_PER_FRAME_MS = 1000 / MAX_FRAMES;

let running = false;


const getIndex = (row, column) => {
  "use strict";
  return row * width + column;
};


function drawHexagon(row, col, fill) {
  "use strict";
  let x = hex_ro + col * 2 * hex_ri + row % 2 * hex_ri;
  let y = hex_ro + row * 3/2 * hex_ro;

  ctx.strokeStyle = GRID_COLOR;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(x + hex_ro * Math.sin(hex_a * i), y + hex_ro * Math.cos(hex_a * i));
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

  for (let w = 0; w < width; w++) {
    for (let h = 0; h < height; h++) {
      drawHexagon(h, w, cells[getIndex(h,w)] === Cell.Alive);
    }
  }
}


const get_field_from_pixels = (x, y) => {
  "use strict";
  const ry = (y-hex_ro) / (hex_ro * 3/2)
  const rx_top = (x - hex_ri - (Math.floor(ry + 0.5) % 2) * hex_ri) / (hex_ri * 2)
  const rx_bottom = (x - hex_ri - (Math.ceil(ry+ 0.5) % 2) * hex_ri) / (hex_ri * 2)

  const row_top = Math.floor(ry)
  const row_bottom = Math.ceil(ry)
  const col_top = Math.round(rx_top)
  const col_bottom = Math.round(rx_bottom)

  const d_top = Math.abs(row_top - ry) + Math.abs(col_top - rx_top)
  const d_bottom = Math.abs(row_bottom - ry) + Math.abs(col_bottom - rx_bottom)

  if(d_top < d_bottom){
    return [row_top, col_top]
  } else {
    return [row_bottom, col_bottom]
  }
}


const renderLoop = () => {
  "use strict";
  let pre_time = new Date();
  if (running) {
    universe.tick();
  }
  drawUniverse();
  let render_time = new Date() - pre_time;
  if(render_time < TIME_PER_FRAME_MS){
    setTimeout(()=> {requestAnimationFrame(renderLoop);}, TIME_PER_FRAME_MS-render_time);
  } else {
    requestAnimationFrame(renderLoop);
  }
};
requestAnimationFrame(renderLoop);


canvas.addEventListener("click", event => {
  "use strict";
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const [row, col] = get_field_from_pixels(canvasLeft, canvasTop)
  universe.toogle_cell(row, col);
});

play_button.addEventListener("click", () => {
  "use strict"
  running = !running
  if(running){
    play_button.innerText = "STOP"
    requestAnimationFrame(renderLoop);
  } else  {
    play_button.innerText = "RUN"
  }
})

tick_button.addEventListener("click", ()=> {
  universe.tick()
})

