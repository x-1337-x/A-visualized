const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

let GRID_WIDTH = 20;
let GRID_HEIGHT = 20;

let CELL_WIDTH = CANVAS_WIDTH / GRID_WIDTH;
let CELL_HEIGHT = CANVAS_HEIGHT / GRID_HEIGHT;

let CELL_BORDER = Math.floor(CELL_WIDTH / 20);

let endNode = { x: 3, y: 3 };
let startNode = { x: 7, y: 5 };

const DIAGONAL_COST = 14;
const LINEAR_COST = 10;

const DEBUG = false;

function distance(p1, p2) {
  //   return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) * 10;
  const horizontal = Math.abs(p1.x - p2.x);
  const vertical = Math.abs(p1.y - p2.y);
  const diagonal = Math.min(horizontal, vertical);
  const linear = Math.max(horizontal, vertical) - diagonal;

  const result = diagonal * DIAGONAL_COST + linear * LINEAR_COST;
  //   console.log(p1, p2, result);

  return result;
}

class PQ {
  constructor() {
    this.items = [];
  }

  enqueue(item, priority) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => {
      return a.priority - b.priority;
    });
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

const wait = (time) => new Promise((r) => setTimeout(r, time));

class Graph {
  constructor(proximity) {
    this.nodes = new Map();
  }

  addNode(n, data) {
    this.nodes.set(n, { data, neighbors: new Set() });
  }

  async astar(start, end) {
    const open = new Set([start]);
    const closed = new Set();
    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();

    this.nodes.forEach((value, key) => {
      gScore.set(key, Infinity);
      fScore.set(key, Infinity);
    });

    gScore.set(start, 0);
    fScore.set(start, distance(startNode, endNode));

    while (open.size) {
      const nodes = Array.from(open.values());
      nodes.sort((a, b) => {
        return fScore.get(a) - fScore.get(b);
      });
      const current = nodes[0];

      if (current === end) {
        const steps = [end];
        let cur = end;
        while (cameFrom.has(cur)) {
          cur = cameFrom.get(cur);
          steps.unshift(cur);
        }

        return steps;
      }

      open.delete(current);
      closed.add(current);

      for (const neighbor of this.nodes.get(current).neighbors.values()) {
        const neighborData = this.nodes.get(neighbor).data;
        const weight = grid[neighborData.y][neighborData.x];
        const g = gScore.get(current) + weight;
        const h = distance(neighborData, endNode);
        if (g < gScore.get(neighbor)) {
          DEBUG && (await wait(25));
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, g);
          fScore.set(neighbor, g + h);
          if (!open.has(neighbor)) {
            open.add(neighbor);
          }
        }
        if (DEBUG) {
          drawGrid();
          drawStats(gScore, fScore);
        }
      }
    }

    return null;
  }
}

const WEIGHTS = {
  Road: 10,
  Grass: 50,
  Swamp: 150,
  Mountain: 1000,
};

const WEIGHT_COLORS = {
  [WEIGHTS.Mountain]: "gray",
  [WEIGHTS.Road]: "gold",
  [WEIGHTS.Grass]: "lightgreen",
  [WEIGHTS.Swamp]: "brown",
};

let graph = new Graph();

let grid = new Array(GRID_HEIGHT).fill(0);
for (let y = 0; y < GRID_HEIGHT; y++) {
  grid[y] = new Array(GRID_WIDTH).fill(0);
  for (let x = 0; x < GRID_WIDTH; x++) {
    grid[y][x] = WEIGHTS.Grass;
  }
}

const NEIGHBORS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
];

function buildGraph() {
  graph = new Graph();

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const node = `${x}-${y}`;
      graph.addNode(node, { x, y });
    }
  }

  // calculate neighbors
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const node = `${x}-${y}`;
      for (let n = 0; n < NEIGHBORS.length; n++) {
        const xx = x + NEIGHBORS[n][0];
        const yy = y + NEIGHBORS[n][1];
        if (yy < 0 || yy >= GRID_HEIGHT || xx < 0 || xx >= GRID_WIDTH) {
          continue;
        }

        const nnode = `${xx}-${yy}`;
        graph.nodes.get(node).neighbors.add(nnode);
      }
    }
  }
}

const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");

ctx.font = "normal 20px monospace";
ctx.textBaseline = "middle";

function drawGrid() {
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      ctx.fillStyle = WEIGHT_COLORS[grid[y][x]];
      ctx.fillRect(
        x * CELL_WIDTH + CELL_BORDER,
        y * CELL_HEIGHT + CELL_BORDER,
        CELL_WIDTH - CELL_BORDER * 2,
        CELL_HEIGHT - CELL_BORDER * 2
      );
    }
  }

  ctx.fillStyle = "red";
  ctx.fillRect(
    startNode.x * CELL_WIDTH + CELL_BORDER,
    startNode.y * CELL_HEIGHT + CELL_BORDER,
    CELL_WIDTH - CELL_BORDER * 2,
    CELL_HEIGHT - CELL_BORDER * 2
  );

  ctx.fillStyle = "blue";
  ctx.fillRect(
    endNode.x * CELL_WIDTH + CELL_BORDER,
    endNode.y * CELL_HEIGHT + CELL_BORDER,
    CELL_WIDTH - CELL_BORDER * 2,
    CELL_HEIGHT - CELL_BORDER * 2
  );
}

function drawStats(gScore, fScore) {
  ctx.fillStyle = "#000";
  for (const node of Array.from(fScore.keys())) {
    const [x, y] = node.split("-");

    const f = fScore.get(node);
    const g = gScore.get(node);
    const h = f - g;

    if (f === Infinity) {
      continue;
    }

    ctx.font = "normal 20px monospace";

    ctx.textAlign = "left";
    ctx.fillText(
      h === Infinity ? "∞" : h,
      x * CELL_WIDTH + 2,
      y * CELL_HEIGHT + 2 + CELL_HEIGHT / 4
    );

    ctx.textAlign = "right";
    ctx.fillText(
      g === Infinity ? "∞" : g,
      x * CELL_WIDTH + CELL_WIDTH - 2,
      y * CELL_HEIGHT + 2 + CELL_HEIGHT / 4
    );

    ctx.textAlign = "center";
    ctx.font = "normal 30px monospace";
    ctx.fillText(
      f === Infinity ? "∞" : f,
      x * CELL_WIDTH + CELL_WIDTH / 2,
      y * CELL_HEIGHT + 2 + (CELL_HEIGHT / 4) * 3
    );
  }
}

let mode = null;
let mouseDown = false;
let currentWeight = "Grass";

function getGridCoord(pageX, pageY) {
  const rect = canvas.getBoundingClientRect();

  const xx = pageX - rect.x;
  const yy = pageY - rect.y;

  const x = Math.floor(xx / CELL_WIDTH);
  const y = Math.floor(yy / CELL_HEIGHT);

  return { x, y };
}

function draw(e) {
  const { pageX, pageY } = e;

  const { x, y } = getGridCoord(pageX, pageY);

  if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
    if (mode === "drawing") {
      grid[y][x] = WEIGHTS[currentWeight];
    } else if (mode === "start") {
      startNode.x = x;
      startNode.y = y;
    } else if (mode === "end") {
      endNode.x = x;
      endNode.y = y;
    }

    drawGrid();

    save();
  }
}

document.addEventListener("mousedown", function (e) {
  e.stopPropagation();

  draw(e);

  mouseDown = true;

  drawing = true;
});

document.addEventListener("mouseup", function (e) {
  e.stopPropagation();

  mouseDown = false;
});

canvas.addEventListener("mousemove", function (e) {
  e.stopPropagation();

  if (mouseDown) {
    draw(e);
  }
});

document.getElementById("solve").addEventListener("click", function (e) {
  buildGraph();
  solve();
});

document.getElementById("Road").addEventListener("click", function (e) {
  mode = "drawing";
  currentWeight = "Road";
});

document.getElementById("Grass").addEventListener("click", function (e) {
  mode = "drawing";
  currentWeight = "Grass";
});

document.getElementById("Swamp").addEventListener("click", function (e) {
  mode = "drawing";
  currentWeight = "Swamp";
});

document.getElementById("Mountain").addEventListener("click", function (e) {
  mode = "drawing";
  currentWeight = "Mountain";
});

document.getElementById("Start").addEventListener("click", function (e) {
  mode = "start";
});

document.getElementById("End").addEventListener("click", function (e) {
  mode = "end";
});

document.getElementById("Reset").addEventListener("click", function (e) {
  reset();
});

drawGrid();

async function solve() {
  const shortestPath = await graph.astar(
    `${startNode.x}-${startNode.y}`,
    `${endNode.x}-${endNode.y}`
  );

  if (shortestPath) {
    ctx.fillStyle = "#4c88ff";
    for (const n of shortestPath) {
      const node = graph.nodes.get(n);

      ctx.fillRect(
        node.data.x * CELL_WIDTH + 5,
        node.data.y * CELL_HEIGHT + 5,
        CELL_WIDTH - 10,
        CELL_HEIGHT - 10
      );
    }
  }
}

function reset() {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      grid[y][x] = WEIGHTS.Grass;
      endNode = { x: 3, y: 3 };
      startNode = { x: 7, y: 5 };
    }
  }

  drawGrid();

  save();
}

const storageKey = "astar";
const VERSION = 1;

function save() {
  const payload = {
    version: VERSION,
    startNode,
    endNode,
    grid,
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));
  console.log("saving..", payload);
}

function load() {
  const value = localStorage.getItem(storageKey);
  if (!value) {
    return;
  }

  try {
    const data = JSON.parse(value);
    if (data?.version !== VERSION) {
      localStorage.removeItem(storageKey);
      return;
    }
    console.log("loaded", data);
    grid = data.grid;
    startNode = data.startNode;
    endNode = data.endNode;

    GRID_HEIGHT = data.grid.length;
    GRID_WIDTH = data.grid[0].length;
    CELL_WIDTH = CANVAS_WIDTH / GRID_WIDTH;
    CELL_HEIGHT = CANVAS_HEIGHT / GRID_HEIGHT;
    CELL_BORDER = Math.floor(CELL_WIDTH / 20);

    drawGrid();
  } catch (e) {
    localStorage.removeItem(storageKey);
  }
}

load();
