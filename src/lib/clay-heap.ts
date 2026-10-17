/**
 * The physics of the home hero's clay heap, shared by the server and the browser.
 *
 * Everything is in stage units: the stage is a world of W x H units and CSS scales one
 * unit to the stage's real width (`--u`), so a simulation gives the same heap at any width.
 * There are two worlds: a wide band under the headline from 760px, and a narrower,
 * taller stage on phones (WORLDS). Each has its own resting heap. matter-js is passed in rather than imported, so the browser can load it
 * lazily while the server (index.astro) uses it at build time to precompute the static,
 * resting heap that no-JS and reduced-motion visitors see.
 *
 * The simulation always advances in fixed 1/60 s steps and takes its randomness from the
 * `rand` function it is given: a seeded one on the server (the static heap never changes
 * between builds), Math.random in the browser (each drop lands a little differently).
 */
type Matter = typeof import('matter-js');
type Body = import('matter-js').Body;
type Engine = import('matter-js').Engine;
type Vertex = import('matter-js').Vertex;

export const STEP_MS = 1000 / 60;

export interface World {
  W: number;
  H: number;
  /** My cutout: its height, how far it runs past the bottom edge and the right edge, its lean. */
  me: { height: number; belowFloor: number; offRight: number; angle: number };
  /** Spawn x is SPAWN_AT of the free width, plus or minus this many units. */
  spread: number;
  /** Objects' sizes (from hero-objects.ts) are multiplied by this; the wide band needs a bigger heap. */
  objectScale: number;
}

export type WorldName = 'wide' | 'narrow';

/** About 1 unit per px on a full desktop page (wide), 0.57 at 375px (narrow): a spread of
 * plus or minus 30 units is about 60px across on desktop, 22 units about 40px on a phone. */
export const WORLDS: Record<WorldName, World> = {
  wide: { W: 1000, H: 540, me: { height: 540, belowFloor: 30, offRight: 18, angle: -0.045 }, spread: 30, objectScale: 1.45 },
  narrow: { W: 600, H: 500, me: { height: 500, belowFloor: 40, offRight: 18, angle: -0.045 }, spread: 36, objectScale: 1 },
};

/** Objects drop one after another, this many steps apart. */
const DROP_EVERY = 13;
/** Spawn point: this fraction of the free width (left of me). */
const SPAWN_AT = 0.56;
const TILT = 0.3; // radians, either way
const INERTIA = 3;
const MAX_SPEED = 26; // units per step; keeps a hard throw from tunnelling through a wall
const FREEZE_AFTER = 60 * 15; // steps after the last wake-up; then everything sleeps

export type Point = [number, number];
export interface Shape {
  aspect: number; // width / height of the trimmed image
  hull: Point[]; // convex outline, 0..1 of the image box
}
export interface HeapObject extends Shape {
  size: number; // longest side, in units
}
export interface Pose {
  x: number; // image center, units
  y: number;
  a: number; // radians
}

/** An object's image box in a world, in units. */
export function box(o: HeapObject, world: World) {
  const size = o.size * world.objectScale;
  return o.aspect >= 1 ? { w: size, h: size / o.aspect } : { w: size * o.aspect, h: size };
}

/** Where my cutout stands: pinned to the right edge, cut by the bottom edge, leaning a little. */
export function mePose(me: Shape, world: World) {
  const { height: h, belowFloor, offRight, angle } = world.me;
  const w = h * me.aspect;
  return { x: world.W - w / 2 + offRight, y: world.H + belowFloor - h / 2, a: angle, w, h };
}

/** Deterministic random numbers in [0, 1) for the server's heap. */
export function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface Item {
  w: number;
  h: number;
  local: { x: number; y: number }[]; // hull around the image center, units
  centroid: { x: number; y: number }; // body position relative to the image center, unrotated
  spawnStep: number;
  spawnX: number;
  spawnA: number;
  body: Body | null;
}

export interface Sim {
  world: World;
  engine: Engine;
  items: Item[];
  steps: number;
  sinceWake: number;
}

function outline(shape: Shape, w: number, h: number) {
  return shape.hull.map(([x, y]) => ({ x: (x - 0.5) * w, y: (y - 0.5) * h }));
}

export function createSim(M: Matter, world: World, objects: HeapObject[], me: Shape, rand: () => number): Sim {
  const { W, H } = world;
  const engine = M.Engine.create({ enableSleeping: true, positionIterations: 10, velocityIterations: 8 });
  engine.gravity.y = 1;

  const t = 200;
  const wall = { isStatic: true, friction: 0.9 };
  M.Composite.add(engine.world, [
    M.Bodies.rectangle(W / 2, H + t / 2, W * 3, t, wall),
    M.Bodies.rectangle(-t / 2, 0, t, H * 6, wall),
    M.Bodies.rectangle(W + t / 2, 0, t, H * 6, wall),
  ]);

  // Me, as a static body the heap can lean on.
  const mp = mePose(me, world);
  const cos = Math.cos(mp.a);
  const sin = Math.sin(mp.a);
  const meVerts = outline(me, mp.w, mp.h).map(({ x, y }) => ({ x: mp.x + x * cos - y * sin, y: mp.y + x * sin + y * cos }));
  const meCentre = M.Vertices.centre(meVerts);
  M.Composite.add(engine.world, M.Bodies.fromVertices(meCentre.x, meCentre.y, [meVerts], { isStatic: true, friction: 0.9 }));

  // The free width is everything left of me, measured over my lower half (where the heap is).
  const freeRight = Math.min(...meVerts.filter((v) => v.y > H / 2).map((v) => v.x), W);

  const items = objects.map((o, i): Item => {
    const { w, h } = box(o, world);
    const local = outline(o, w, h);
    const half = Math.max(w, h) / 2;
    const x = freeRight * SPAWN_AT + (rand() * 2 - 1) * world.spread;
    return {
      w,
      h,
      local,
      centroid: { x: 0, y: 0 },
      spawnStep: i * DROP_EVERY,
      spawnX: Math.min(freeRight - half, Math.max(half, x)),
      // A long, thin object (the snowboard) drops lying down, so it never stands on end.
      spawnA: (o.aspect < 0.45 ? -Math.PI / 2 : 0) + (rand() * 2 - 1) * TILT,
      body: null,
    };
  });

  return { world, engine, items, steps: 0, sinceWake: 0 };
}

function spawn(M: Matter, sim: Sim, item: Item) {
  const y = -Math.max(item.w, item.h) * 0.6;
  // Slightly rounded corners, kept convex (rounding very short edges can dent the outline).
  const verts = M.Vertices.hull(
    M.Vertices.chamfer(
      item.local.map((v) => ({ x: v.x + item.spawnX, y: v.y + y })) as Vertex[],
      4,
      -1,
      2,
      14,
    ) as Vertex[],
  );
  const c = M.Vertices.centre(verts);
  const body = M.Bodies.fromVertices(c.x, c.y, [verts], {
    friction: 0.8,
    frictionStatic: 1,
    restitution: 0.12,
    density: 0.002,
  });
  item.centroid = { x: body.position.x - item.spawnX, y: body.position.y - y };
  // Heavier to turn than a solid block: objects tumble less and land closer to upright.
  M.Body.setInertia(body, body.inertia * INERTIA);
  // Turn it about the image center (where it was placed), not about its centroid.
  const cos = Math.cos(item.spawnA);
  const sin = Math.sin(item.spawnA);
  const { x: cx, y: cy } = item.centroid;
  M.Body.setAngle(body, item.spawnA);
  M.Body.setPosition(body, { x: item.spawnX + cx * cos - cy * sin, y: y + cx * sin + cy * cos });
  M.Composite.add(sim.engine.world, body);
  item.body = body;
}

/** One fixed step. Returns true once every object has dropped and everything sleeps. */
export function step(M: Matter, sim: Sim): boolean {
  for (const item of sim.items) if (!item.body && sim.steps >= item.spawnStep) spawn(M, sim, item);
  M.Engine.update(sim.engine, STEP_MS);
  sim.steps += 1;
  sim.sinceWake += 1;

  let asleep = true;
  for (const item of sim.items) {
    const b = item.body;
    if (!b) {
      asleep = false;
      continue;
    }
    // Keep everything inside the stage: an object that has dropped in cannot leave by the
    // top, and nothing may move faster than a wall is thick.
    const v = b.velocity;
    const speed = Math.hypot(v.x, v.y);
    if (speed > MAX_SPEED) M.Body.setVelocity(b, { x: (v.x / speed) * MAX_SPEED, y: (v.y / speed) * MAX_SPEED });
    if (b.position.y > 0 && b.bounds.min.y < 0) {
      M.Body.translate(b, { x: 0, y: -b.bounds.min.y });
      if (b.velocity.y < 0) M.Body.setVelocity(b, { x: b.velocity.x, y: 0 });
    }
    const { W, H } = sim.world;
    if (b.position.x < 0 || b.position.x > W || b.position.y > H + 50) {
      M.Body.setPosition(b, { x: W * 0.3, y: 0 });
      M.Body.setVelocity(b, { x: 0, y: 0 });
    }
    if (sim.sinceWake >= FREEZE_AFTER) M.Sleeping.set(b, true);
    if (!b.isSleeping) asleep = false;
  }
  return asleep;
}

export function wake(sim: Sim) {
  sim.sinceWake = 0;
}

/** The image's pose (its center and angle) for the current state of its body. */
export function pose(item: Item): Pose | null {
  const b = item.body;
  if (!b) return null;
  const cos = Math.cos(b.angle);
  const sin = Math.sin(b.angle);
  const { x: cx, y: cy } = item.centroid;
  return { x: b.position.x - (cx * cos - cy * sin), y: b.position.y - (cx * sin + cy * cos), a: b.angle };
}

/** Runs a sim to rest instantly (all objects dropped, everything asleep). */
export function runToRest(M: Matter, sim: Sim) {
  while (!step(M, sim) && sim.steps < 60 * 30);
}

/** Runs a whole drop instantly and returns where everything comes to rest. */
export function settle(M: Matter, world: World, objects: HeapObject[], me: Shape, seed: number): Pose[] {
  // Body ids come from a process-wide counter and decide the order collisions are solved
  // in, so start it from zero: the same seed then gives the same heap on every render.
  (M.Common as unknown as { _nextId: number })._nextId = 0;
  const sim = createSim(M, world, objects, me, seeded(seed));
  runToRest(M, sim);
  return sim.items.map((item) => {
    const p = pose(item) ?? { x: 0, y: 0, a: 0 };
    return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), a: +p.a.toFixed(4) };
  });
}
