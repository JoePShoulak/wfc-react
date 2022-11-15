/**
 * Based off the incredible work of Dan Shiffman
 *
 * Website: https://thecodingtrain.com/
 * Tutorial:  https://youtu.be/rI_y2GAlQFM
 * Repo: https://github.com/CodingTrain/Wave-Function-Collapse
 */

/* == HELPERS == */
const randomFrom = (array) => array[Math.floor(Math.random() * array.length)];

const componentToHex = (c) => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r, g, b, _a) => {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

/* == TILE CLASS == */
export class Tile {
  static fullEdgeDetection = false;

  // Must be set in sketch with access to p5
  static rotateImg(_img, _amount) {
    console.error(
      "Tile.rotateImg is not defined by default. Set this in your sketch for proper functionality."
    );
  }

  constructor(img) {
    this.img = img;
    this.img.loadPixels();
    this.edges = {};

    Grid.directions.forEach((dir) => (this.edges[dir] = this.edgeFromImg(dir)));
  }

  edgeFromImg(dir) {
    return Tile.fullEdgeDetection
      ? this.detectFullEdge(dir)
      : this.detectSimpleEdge(dir);
  }

  detectFullEdge(dir) {
    const w = this.img.width;
    const h = this.img.height;

    let edge = [];

    switch (dir) {
      case "up":
        for (let x = 0; x < w; x++) {
          edge.push(rgbToHex(...this.img.get(x, 0)));
        }
        break;
      case "right":
        for (let y = 0; y < h; y++) {
          edge.push(rgbToHex(...this.img.get(w - 1, y)));
        }
        break;
      case "down":
        for (let x = w - 1; x >= 0; x--) {
          edge.push(rgbToHex(...this.img.get(x, h - 1)));
        }
        break;
      case "left":
        for (let y = h - 1; y >= 0; y--) {
          edge.push(rgbToHex(...this.img.get(0, y)));
        }
        break;
    }

    return edge;
  }

  detectSimpleEdge(dir) {
    const w = this.img.width;
    const h = this.img.height;

    let edge = [];

    const NW = [1, 1];
    const NN = [w / 2, 1];
    const NE = [w - 1, 1];
    const EE = [w - 1, h / 2];
    const SE = [w - 1, h - 1];
    const SS = [w / 2, h - 1];
    const SW = [1, h - 1];
    const WW = [1, h / 2];

    switch (dir) {
      case "up":
        edge = [NW, NN, NE];
        break;
      case "right":
        edge = [NE, EE, SE];
        break;
      case "down":
        edge = [SE, SS, SW];
        break;
      case "left":
        edge = [SW, WW, NW];
        break;
    }

    edge = edge.map((point) => rgbToHex(...this.img.get(...point)));

    return edge;
  }

  allRotations() {
    let rotations = [];

    // All edges are the same
    const fullySymmetric =
      this.edges.left.every((pix, i) => pix == this.edges.up[i]) &&
      this.edges.left.every((pix, i) => pix == this.edges.right[i]) &&
      this.edges.left.every((pix, i) => pix == this.edges.down[i]);

    if (fullySymmetric) return [this];

    // Opposite edges are the same
    const halfSymmetric =
      this.edges.left.every((pix, i) => pix == this.edges.right[i]) &&
      this.edges.up.every((pix, i) => pix == this.edges.down[i]);

    const amount = halfSymmetric ? 2 : 4;

    for (let i = 0; i < amount; i++) {
      rotations.push(Tile.rotateImg(this.img, i));
    }

    return rotations;
  }
}

/* == CELL CLASS == */
export class Cell {
  static options = [];

  static resetCallback() {}

  static compareEdge(myEdge, relEdge) {
    const res = myEdge.every((bit, i) => bit == [...relEdge].reverse()[i]);
    return res;
  }

  static setOptions(images) {
    Cell.options = [];

    images
      .map((img) => new Tile(img))
      .forEach((tile) => {
        tile.allRotations().forEach((rot) => Cell.options.push(rot));
      });
  }

  constructor(x, y, grid) {
    this.x = x;
    this.y = y;
    this.grid = grid;

    this.options = [...Cell.options];
    this.neighbors = [];
  }

  collapse() {
    this.state = randomFrom(this.options);

    const index = this.grid.uncollapsed.indexOf(this);
    this.grid.uncollapsed.splice(index, 1);

    Object.values(this.neighbors).forEach((cell) => {
      cell.updateOptions();
    });

    return this;
  }

  reset() {
    delete this.state;
    this.options = [...Cell.options];

    Cell.resetCallback(this);
    this.grid.uncollapsed.push(this);
  }

  checkValid(option, dir) {
    const oppEdge = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };

    // If we have a neighbor in that direction...
    if (this.neighbors[dir]?.state) {
      const myEdge = option.edges[dir];
      const optEdge = this.neighbors[dir].state.edges[oppEdge[dir]];

      // Check this cell's edge against the option's revelant edge
      return Cell.compareEdge(myEdge, optEdge);
    }

    return true;
  }

  updateOptions() {
    // All available options should be filtered down to those of which...
    this.options = this.options.filter((option) => {
      // For every cardinal direction...
      for (let i = 0; i < Grid.directions.length; i++) {
        // It would be valid to place that tile in that place
        if (!this.checkValid(option, Grid.directions[i])) return false;
      }

      return true;
    });

    if (this.options.length == 0) {
      this.reset();

      Object.values(this.neighbors).forEach((cell) => cell.reset());
    }
  }
}

/* == GRID CLASS == */
export class Grid {
  static directions = ["up", "down", "left", "right"];

  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.cells = [];

    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const index = i + width * j;
        this.cells[index] = new Cell(i, j, this);
      }
    }

    this.cells.forEach((cell) => {
      cell.neighbors = this.getNeighbors(cell);
    });

    this.uncollapsed = [...this.cells];
  }

  get collapsed() {
    return this.uncollapsed.length == 0;
  }

  get next() {
    const minEntropy = this.uncollapsed.reduce((acc, val) => {
      const ops = val.options.length;

      return acc < ops ? acc : ops;
    }, Cell.options.length);

    const allMin = this.uncollapsed.filter(
      (cell) => cell.options.length == minEntropy
    );

    return randomFrom(allMin);
  }

  collapse() {
    while (!this.collapsed) this.observe();
  }

  observe() {
    return this.next?.collapse();
  }

  reset() {
    this.cells.forEach((c) => c.reset());
  }

  getNeighbors(cell) {
    const index = cell.x + cell.y * this.width;

    const nbrs = {
      up: index - this.width,
      down: index + this.width,
      right: index + 1,
      left: index - 1,
    };

    const validNbrs = {};

    Object.entries(nbrs).forEach(([dir, nbr]) => {
      if (this.validNeighbor(nbr, dir)) validNbrs[dir] = this.cells[nbr];
    });

    return validNbrs;
  }

  validNeighbor(index, dir) {
    let flagBool = true;

    switch (dir) {
      case "right":
        flagBool = index % this.width != 0;
        break;
      case "left":
        flagBool = (index + 1) % this.width != 0;
        break;
    }

    return index >= 0 && index < this.cells.length && flagBool;
  }
}
