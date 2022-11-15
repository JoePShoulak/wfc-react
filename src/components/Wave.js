import { Tile, Cell, Grid } from "../libraries/waveFunctionCollapse";
import { ReactP5Wrapper } from "react-p5-wrapper";
import React from "react";
import p5 from "p5";

/* == CONFIG DICTIONARIES == */
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

/* == SKETCH VARIABLES == */
const tileset = "circuit";
const mode = tilesetModes[tileset];
const GRID_SCALE = 1 / 40; // 1/3 is in deployment
const LOOP_DELAY = 10 * 1000; // ms
const width = 500;
const height = 500;

let images;
let waveFunction;

/* == HELPER FUNCTION == */
/**
 * Hoped this might work from StackOverflow.
 * Seems to require multiple images corrcetly,
 * but it's not fixing my p5.loadImage problem
 * */
function importAll(r) {
  let images = {};
  r.keys().forEach((item, index) => {
    images[item.replace("./", "")] = r(item);
  });
  return images;
}

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

function preload() {
  // const length = tilesetLengths[tileset];
  // images = loadAllImages(tileset, length);
  images = importAll(
    require.context("../tiles/circuit", false, /\.(png|jpe?g|svg)$/)
  );
  images = Object.values(images).map((i) => p5.prototype.loadImage(i));

  Tile.fullEdgeDetection = mode === "complex";
  Cell.resetCallback = (cell) => drawCell(cell);
  Cell.setOptions(images);
}

function reset() {
  p5.background("black");
  waveFunction.reset();
  p5.loop();
}

/* == MAIN FUNCTIONS == */
function sketch(p5) {
  p5.setup = () => {
    preload();

    p5.createCanvas(width, height);
    p5.fill("black");
    p5.background("black");
    p5.noStroke();

    waveFunction = new Grid(
      p5.floor(width * GRID_SCALE),
      p5.floor(height * GRID_SCALE)
    );
  };

  p5.draw = () => {
    if (!waveFunction.collapsed) {
      const newCell = waveFunction.observe();
      drawCell(newCell);
    } else {
      setTimeout(reset, LOOP_DELAY);
      p5.noLoop();
    }
  };
}

const Wave = () => {
  return <ReactP5Wrapper sketch={sketch} />;
};

export default Wave;
