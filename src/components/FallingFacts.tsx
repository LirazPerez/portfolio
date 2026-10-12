import { useEffect, useRef } from 'react';
import type { Fact } from '../data/facts';
import './FallingFacts.css';

/**
 * The falling facts, as a React island (client:visible).
 *
 * The server renders the resting layout: a plain list, in its final position. That is
 * what shows with no JS and with prefers-reduced-motion, and it is also what hydrates,
 * so nothing here can disagree with the static markup.
 *
 * With motion allowed, once the portrait is mostly in view the facts drop once, collide
 * and rest just below the photo's bottom edge, then the animation loop stops.
 *
 * Determinism: the physics always advances in fixed 1/60 s steps (an accumulator turns
 * real frame time into whole steps), so a 60 Hz and a 144 Hz screen run the same
 * sequence of simulation states. matter-js is loaded only at the moment of the drop,
 * so visitors who never drop never download it.
 *
 * Keeping the face clear: the portrait's face and hair fill roughly the top three
 * quarters of the frame, so the pile must stay in the bottom quarter. Each pill starts
 * above its slot in a row packed like the static layout (bottom rows drop first), and
 * before animating, the settle is simulated off-screen with progressively tidier tuning
 * until the pile sits below that line. The same wording therefore always lands the same
 * way, and edited wording is checked the same way.
 */

const STEP_MS = 1000 / 60;
const MAX_FRAME_MS = 250; // a backgrounded tab must not trigger a burst of catch-up steps
const MAX_DROP_STEPS = 60 * 20; // safety net: freeze whatever has not settled after 20 s
const GAP = 6; // matches the static layout's gap
const SIDE = 8; // keep pills this far from the field's side walls
// Top of the pile must not rise above this fraction of the photo's height. The portrait's
// face and hair end at about 74% down, so 76% leaves a margin.
const KEEP_CLEAR_FRACTION = 0.76;

type Matter = typeof import('matter-js');
type Body = import('matter-js').Body;
type Engine = import('matter-js').Engine;

interface Tuning {
  jitter: number; // px of sideways offset from the pill's row slot
  tilt: number; // starting angle in radians
}

// Loosest (most natural) first; each next one is tidier.
const TUNINGS: Tuning[] = [
  { jitter: 6, tilt: 0.12 },
  { jitter: 2, tilt: 0.05 },
  { jitter: 0, tilt: 0 },
];

interface Piece {
  el: HTMLElement;
  w: number;
  h: number;
  body: Body;
}

interface Sim {
  engine: Engine;
  pieces: Piece[];
  steps: number;
}

// Greedy row packing in list order, rows centered, the same way the static layout wraps.
function planSlots(widths: number[], W: number) {
  const rows: number[][] = [];
  let row: number[] = [];
  let rowW = 0;
  widths.forEach((w, i) => {
    const next = rowW + (row.length ? GAP : 0) + w;
    if (row.length && next > W - SIDE * 2) {
      rows.push(row);
      row = [];
      rowW = 0;
    }
    rowW += (row.length ? GAP : 0) + w;
    row.push(i);
  });
  if (row.length) rows.push(row);

  const slots: { x: number; order: number }[] = new Array(widths.length);
  let order = 0;
  for (const r of rows) {
    const total = r.reduce((sum, i) => sum + (widths[i] ?? 0), 0) + GAP * (r.length - 1);
    let x = (W - total) / 2;
    for (const i of r) {
      const w = widths[i] ?? 0;
      slots[i] = { x: x + w / 2, order: order++ };
      x += w + GAP;
    }
  }
  return slots;
}

function createSim(M: Matter, items: HTMLElement[], W: number, H: number, tuning: Tuning): Sim {
  const engine = M.Engine.create({ enableSleeping: true });
  engine.gravity.y = 1.1;

  const t = 60;
  const wall = { isStatic: true };
  M.Composite.add(engine.world, [
    // The floor sits 10px above the field's bottom edge, which is below the photo.
    M.Bodies.rectangle(W / 2, H + t / 2 - 10, W * 2, t, wall),
    M.Bodies.rectangle(-t / 2, H / 2, t, H * 3, wall),
    M.Bodies.rectangle(W + t / 2, H / 2, t, H * 3, wall),
  ]);

  const sizes = items.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
  const slots = planSlots(
    sizes.map((s) => s.w),
    W,
  );

  const pieces = items.map((el, i): Piece => {
    const { w, h } = sizes[i] ?? { w: 0, h: 0 };
    const slot = slots[i] ?? { x: W / 2, order: i };
    const x = Math.min(W - w / 2 - SIDE, Math.max(w / 2 + SIDE, slot.x + ((i % 3) - 1) * tuning.jitter));
    // Bottom rows drop first (lower order), so upper rows land on top of settled ones.
    const body = M.Bodies.rectangle(x, -40 - slot.order * 70, w, h, {
      chamfer: { radius: h / 2 },
      restitution: 0.25,
      friction: 0.6,
      angle: ((i % 3) - 1) * tuning.tilt,
    });
    M.Composite.add(engine.world, body);
    return { el, w, h, body };
  });

  return { engine, pieces, steps: 0 };
}

function paint(sim: Sim) {
  for (const { el, w, h, body } of sim.pieces) {
    const { x, y } = body.position;
    el.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px) rotate(${body.angle}rad)`;
  }
}

function step(M: Matter, sim: Sim): boolean {
  M.Engine.update(sim.engine, STEP_MS);
  sim.steps += 1;
  if (sim.steps >= MAX_DROP_STEPS) {
    for (const { body } of sim.pieces) M.Sleeping.set(body, true);
  }
  return sim.pieces.every(({ body }) => body.isSleeping);
}

function runToRest(M: Matter, sim: Sim) {
  let asleep = false;
  while (!asleep && sim.steps < MAX_DROP_STEPS) asleep = step(M, sim);
}

function pileTop(sim: Sim) {
  return Math.min(...sim.pieces.map(({ body }) => body.bounds.min.y));
}

// Simulates the settle off-screen and returns the loosest tuning that keeps the pile
// below the face-and-hair line (or the tidiest one tried, if none can).
function chooseTuning(M: Matter, items: HTMLElement[], W: number, H: number, photoH: number): Tuning {
  const limit = photoH * KEEP_CLEAR_FRACTION;
  let best = TUNINGS[0] as Tuning;
  let bestTop = -Infinity;
  for (const tuning of TUNINGS) {
    const probe = createSim(M, items, W, H, tuning);
    runToRest(M, probe);
    const top = pileTop(probe);
    if (top >= limit) return tuning;
    if (top > bestTop) {
      bestTop = top;
      best = tuning;
    }
  }
  return best;
}

export default function FallingFacts({ facts }: { facts: Fact[] }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    let raf = 0;
    let M: Matter | null = null;
    let resting = false;
    let restW = 0;
    let ro: ResizeObserver | null = null;

    const visibleItems = () =>
      Array.from(list.children).filter((el): el is HTMLElement => el instanceof HTMLElement && el.offsetWidth > 0);

    // The field extends below the photo by its negative `bottom`; the photo is the rest.
    const photoHeight = () => list.clientHeight + (parseFloat(getComputedStyle(list).bottom) || 0);

    // Re-lay-out at a new width by running the same simulation to rest instantly.
    const settleInstantly = () => {
      if (!M) return;
      const items = visibleItems();
      const W = list.clientWidth;
      const H = list.clientHeight;
      const tuning = chooseTuning(M, items, W, H, photoHeight());
      const next = createSim(M, items, W, H, tuning);
      runToRest(M, next);
      paint(next);
      restW = W;
    };

    const drop = async () => {
      const mod = await import('matter-js');
      if (cancelled) return;
      const Mod = ('default' in mod ? mod.default : mod) as Matter;
      M = Mod;

      // Measure in the static layout first, then switch to absolute positioning.
      const items = visibleItems();
      const W = list.clientWidth;
      const H = list.clientHeight;
      const tuning = chooseTuning(Mod, items, W, H, photoHeight());
      const sim = createSim(Mod, items, W, H, tuning);
      list.classList.add('is-physics');
      paint(sim); // first frame: pieces already above the field, no flash of stacked pills

      let acc = 0;
      let prev = performance.now();
      const frame = (now: number) => {
        if (cancelled) return;
        acc += Math.max(0, Math.min(now - prev, MAX_FRAME_MS));
        prev = now;
        let asleep = false;
        while (acc >= STEP_MS && !asleep) {
          asleep = step(Mod, sim);
          acc -= STEP_MS;
        }
        paint(sim);
        if (asleep) {
          // Every body sleeps: stop the loop. Nothing runs again until the width changes.
          resting = true;
          restW = list.clientWidth;
          return;
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      ro = new ResizeObserver(() => {
        if (resting && Math.abs(list.clientWidth - restW) > 1) settleInstantly();
      });
      ro.observe(list);
    };

    // Observe the field itself: its parent is Astro's display:contents island wrapper, which
    // has no box and would never intersect. The field covers the portrait, so this is
    // "the portrait scrolled into view".
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          io.disconnect();
          void drop();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(list);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro?.disconnect();
    };
  }, []);

  return (
    <ul ref={listRef} className="facts" role="list" aria-label="What I bring">
      {facts.map((f) => (
        <li key={f.text} className={`fact ${f.kind}`}>
          {f.text}
        </li>
      ))}
    </ul>
  );
}
