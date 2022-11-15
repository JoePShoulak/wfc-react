import React from "react";
import { ReactP5Wrapper } from "react-p5-wrapper";
import p5 from "p5";
import { Tile, Cell, Grid } from "../libraries/waveFunctionCollapse";

const tileset = "circuit";

const width = 500;
const height = 500;

const tilesetLengths = {
  "circuit-joe": 19,
  circuit: 13,
  lines: 2,
  polka: 2,
  roads: 2,
  "train-tracks": 2, // works with full edge
  "circuit-coding-train": 13,
  "test/mountains": 2,
  "test/pipes": 2,
  "test/rail": 7,
  "circuit-custom": 17,
};

const tilesetModes = {
  "circuit-joe": "complex",
  circuit: "simple",
  lines: "simple",
  polka: "simple",
  roads: "simple",
  "train-tracks": "complex",
  "circuit-coding-train": "simple",
  "circuit-custom": "complex",
};
const mode = tilesetModes[tileset];

/* == VARIABLES == */
const GRID_SCALE = 1 / 40; // 1/3 is in deployment
const SHOW_DRAW = true;
const LOOP_DELAY = 10 * 1000; // ms

let images;
let waveFunction;

/* == HELPER FUNCTION == */
function drawCell(cell) {
  const w = width / waveFunction.width;
  const h = height / waveFunction.height;

  const cells = [cell, ...Object.values(cell.neighbors)];

  cells.forEach((cell) => {
    const img = cell.state?.img;
    const pos = [cell.x * w, cell.y * h];
    const size = [w, h];

    img ? p5.image(img, ...pos, ...size) : p5.rect(...pos, ...size);
  });
}

const loadAllImages = (folder, number) => {
  const imgs = [];

  for (let i = 0; i < number; i++) {
    imgs.push(p5.loadImage(`../tiles/${folder}/${i}.png`));
  }

  return imgs;
};

function rotateImg(img, amount) {
  const w = img.width;
  const h = img.height;

  const newImg = p5.createGraphics(w, h);

  newImg.imageMode(p5.CENTER);
  newImg.translate(w / 2, h / 2);
  newImg.rotate(p5.HALF_PI * amount);
  newImg.image(img, 0, 0);

  return new Tile(newImg);
}

/* == MAIN FUNCTIONS == */

function preload() {
  const length = tilesetLengths[tileset];
  images = loadAllImages(tileset, length);
}

function reset() {
  p5.background("black");
  waveFunction.reset();
  p5.loop();
}

function setup() {
  preload();

  Tile.rotateImg = rotateImg;
  Tile.fullEdgeDetection = mode === "complex";
  Cell.resetCallback = (cell) => drawCell(cell);
  Cell.setOptions(images);

  p5.createCanvas(width, height);
  p5.fill("black");
  p5.background("black");
  p5.noStroke();

  waveFunction = new Grid(
    p5.floor(width * GRID_SCALE),
    p5.floor(height * GRID_SCALE)
  );
}

function draw() {
  if (SHOW_DRAW) {
    if (!waveFunction.collapsed) {
      const newCell = waveFunction.observe();
      drawCell(newCell);
    } else {
      setTimeout(reset, LOOP_DELAY);
      p5.noLoop();
    }
  } else {
    waveFunction.collapse();
    waveFunction.cells.forEach((cell) => drawCell(cell));
    p5.noLoop();
  }
}

function sketch(p5) {
  p5.setup = setup;
  p5.draw = draw;
}

const Wave = () => {
  return <ReactP5Wrapper sketch={sketch} />;
};

export default Wave;
