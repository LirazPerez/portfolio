import { useEffect, useRef, type CSSProperties } from 'react';
import { STEP_MS, WORLDS, box, createSim, runToRest, step, wake, pose, type HeapObject, type Pose, type Shape, type Sim, type WorldName } from '../lib/clay-heap';
import './ClayHeap.css';

/**
 * The home hero's clay heap, as a React island (client:visible): my cutout pinned to the
 * right of the stage, and my personal objects in a heap beside me.
 *
 * The stage is one of two worlds (src/lib/clay-heap.ts): a wide band under the headline
 * from 760px, a narrower, taller stage on phones. The server renders the resting heap of
 * both (precomputed at build time by the same simulation, see index.astro) and CSS shows
 * the one that fits. That is what shows with no JS and with prefers-reduced-motion, and
 * it is also what hydrates.
 *
 * With motion allowed, once the stage is mostly in view: I rise in (400 ms), then the
 * objects drop one after another and settle under matter-js at a fixed 1/60 s step, and
 * the loop stops when everything sleeps. An object can then be picked up and thrown
 * (pointer events, so mouse and touch); a touch that starts anywhere else scrolls the
 * page as usual, because only the objects' outlines take touches. A "Pick me up" bubble
 * appears once the heap settles, until the first grab (remembered for the session). If
 * the width crosses 760px afterwards, the heap re-settles instantly in the other world.
 *
 * The objects layer is aria-hidden; screen readers get the list "A few things about me".
 */

const MAX_FRAME_MS = 250; // a backgrounded tab must not trigger a burst of catch-up steps
const RISE_MS = 400;
const BUBBLE_KEY = 'lh-heap-picked';
const WIDE_QUERY = '(min-width: 47.5rem)'; // md, 760px: matches the stage CSS

type Matter = typeof import('matter-js');
type Constraint = import('matter-js').Constraint;
type MePose = Pose & { w: number; h: number };

export interface ClayObject extends HeapObject {
  id: string;
  src: string;
  label: string;
}

interface Props {
  me: Shape & { src: string; alt: string; poses: Record<WorldName, MePose> };
  objects: ClayObject[];
  rest: Record<WorldName, Pose[]>;
}

/** One world's pose as prefixed custom properties (--n-x for narrow, --w-x for wide). */
function vars(prefix: 'n' | 'w', p: Pose & { w?: number; h?: number }): Record<string, string> {
  const v: Record<string, string> = { [`--${prefix}-x`]: String(p.x), [`--${prefix}-y`]: String(p.y), [`--${prefix}-a`]: `${p.a}rad` };
  if (p.w !== undefined) v[`--${prefix}-w`] = String(p.w);
  if (p.h !== undefined) v[`--${prefix}-h`] = String(p.h);
  return v;
}

function readFlag() {
  try {
    return sessionStorage.getItem(BUBBLE_KEY) === '1';
  } catch {
    return false;
  }
}
function writeFlag() {
  try {
    sessionStorage.setItem(BUBBLE_KEY, '1');
  } catch {
    /* storage blocked: the bubble just hides for this page view */
  }
}

export default function ClayHeap({ me, objects, rest }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const objRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const bubbleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const tag = tagRef.current;
    const bubble = bubbleRef.current;
    if (!stage || !tag || !bubble) return;
    const els = objRefs.current;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wideMq = window.matchMedia(WIDE_QUERY);
    const worldName = (): WorldName => (wideMq.matches ? 'wide' : 'narrow');

    let cancelled = false;
    let raf = 0;
    let M: Matter | null = null;
    let sim: Sim | null = null;
    let running = false;
    let settledOnce = false;
    let hovered = -1;
    let grab: { i: number; id: number; c: Constraint } | null = null;
    let picked = readFlag();

    const world = () => sim?.world ?? WORLDS[worldName()];

    const toWorld = (e: PointerEvent) => {
      const { W, H } = world();
      const r = stage.getBoundingClientRect();
      return {
        x: Math.min(W, Math.max(0, ((e.clientX - r.left) / r.width) * W)),
        y: Math.min(H, Math.max(0, ((e.clientY - r.top) / r.width) * W)),
      };
    };

    // The top of an object's outline and its horizontal middle, in units.
    const topOf = (i: number) => {
      const b = sim?.items[i]?.body;
      if (b) return { x: (b.bounds.min.x + b.bounds.max.x) / 2, y: b.bounds.min.y };
      const p = rest[worldName()][i];
      const o = objects[i];
      if (!p || !o) return { x: 0, y: 0 };
      const { w, h } = box(o, WORLDS[worldName()]);
      return { x: p.x, y: p.y - Math.max(w, h) * 0.45 };
    };

    // A small label above the object, kept inside the stage.
    const placeTag = () => {
      const i = grab?.i ?? hovered;
      const label = objects[i]?.label;
      // The bubble steps aside while a label shows: both sit above the heap.
      bubble.classList.toggle('is-muted', Boolean(label));
      if (!label) {
        tag.dataset.on = 'false';
        return;
      }
      if (tag.textContent !== label) tag.textContent = label;
      const { W } = world();
      const u = stage.clientWidth / W;
      const halfW = tag.offsetWidth / u / 2;
      const h = tag.offsetHeight / u;
      const { x, y } = topOf(i);
      const tx = Math.min(W - halfW - 8, Math.max(halfW + 8, x));
      const ty = y - 10 - h < 8 ? y + 16 + h : y - 10;
      tag.style.setProperty('--x', String(tx));
      tag.style.setProperty('--y', String(ty));
      tag.dataset.on = 'true';
    };

    const showBubble = () => {
      if (picked || !sim) return;
      // Above the highest object in the heap.
      const { W } = sim.world;
      let top: { x: number; y: number } = { x: W / 2, y: sim.world.H };
      sim.items.forEach((_, i) => {
        const t = topOf(i);
        if (t.y < top.y) top = t;
      });
      bubble.style.setProperty('--x', String(Math.min(W - 70, Math.max(70, top.x))));
      bubble.style.setProperty('--y', String(Math.max(40, top.y - 12)));
      bubble.dataset.on = 'true';
    };
    const hideBubble = () => {
      bubble.dataset.on = 'false';
      if (!picked) {
        picked = true;
        writeFlag();
      }
    };

    const paint = () => {
      if (!sim) return;
      sim.items.forEach((item, i) => {
        const el = els[i];
        const p = pose(item);
        if (!el || !p) return;
        el.style.setProperty('--x', p.x.toFixed(2));
        el.style.setProperty('--y', p.y.toFixed(2));
        el.style.setProperty('--a', `${p.a.toFixed(4)}rad`);
        el.dataset.on = 'true';
      });
      if (grab || hovered >= 0) placeTag();
    };

    const loop = () => {
      if (running || !M || !sim) return;
      running = true;
      let acc = 0;
      let prev = performance.now();
      const frame = (now: number) => {
        if (cancelled || !M || !sim) return;
        acc += Math.max(0, Math.min(now - prev, MAX_FRAME_MS));
        prev = now;
        let asleep = false;
        while (acc >= STEP_MS) {
          asleep = step(M, sim);
          acc -= STEP_MS;
          if (asleep && !grab) break;
        }
        paint();
        if (asleep && !grab) {
          // Everything sleeps: stop the loop until the next grab.
          running = false;
          if (!settledOnce) {
            settledOnce = true;
            showBubble();
          }
          return;
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    // Hover labels work in every mode once hydrated; grabbing only with motion allowed.
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      hovered = Number((e.currentTarget as HTMLElement).dataset.i);
      placeTag();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      hovered = -1;
      if (!grab) placeTag();
    };
    const onDown = (e: PointerEvent) => {
      if (!M || !sim || grab || e.button > 0) return;
      const el = e.currentTarget as HTMLElement;
      const i = Number(el.dataset.i);
      const body = sim.items[i]?.body;
      if (!body) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const p = toWorld(e);
      const c = M.Constraint.create({
        pointA: p,
        bodyB: body,
        pointB: { x: p.x - body.position.x, y: p.y - body.position.y },
        stiffness: 0.18,
        damping: 0.08,
        length: 0,
      });
      M.Composite.add(sim.engine.world, c);
      M.Sleeping.set(body, false);
      wake(sim);
      grab = { i, id: e.pointerId, c };
      stage.classList.add('is-grabbing');
      hideBubble();
      placeTag();
      loop();
    };
    const onMove = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id || !sim || !M) return;
      grab.c.pointA = toWorld(e);
      const body = sim.items[grab.i]?.body;
      if (body) M.Sleeping.set(body, false);
      wake(sim);
    };
    const release = () => {
      if (!grab || !sim || !M) return;
      M.Composite.remove(sim.engine.world, grab.c);
      grab = null;
      stage.classList.remove('is-grabbing');
    };
    const onUp = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id || !sim) return;
      release();
      if (e.pointerType !== 'mouse') hovered = -1;
      placeTag();
      wake(sim);
      loop();
    };

    // Crossing 760px after the drop: re-settle instantly in the other world.
    const onWorldChange = () => {
      if (!M || !sim) return;
      release();
      cancelAnimationFrame(raf);
      running = false;
      sim = createSim(M, WORLDS[worldName()], objects, me, Math.random);
      runToRest(M, sim);
      paint();
      settledOnce = true;
      showBubble();
    };

    const hits = Array.from(stage.querySelectorAll<HTMLElement>('.clay-hit'));
    for (const h of hits) {
      h.addEventListener('pointerenter', onEnter);
      h.addEventListener('pointerleave', onLeave);
    }

    if (still) {
      stage.classList.add('is-static');
      return () => {
        for (const h of hits) {
          h.removeEventListener('pointerenter', onEnter);
          h.removeEventListener('pointerleave', onLeave);
        }
      };
    }

    const drop = async () => {
      const mod = await import('matter-js');
      if (cancelled) return;
      M = ('default' in mod ? mod.default : mod) as Matter;
      sim = createSim(M, WORLDS[worldName()], objects, me, Math.random);

      for (const el of els) if (el) el.dataset.on = 'false';
      stage.classList.add('is-live');
      requestAnimationFrame(() => stage.classList.add('me-in'));
      for (const h of hits) {
        h.addEventListener('pointerdown', onDown);
        h.addEventListener('pointermove', onMove);
        h.addEventListener('pointerup', onUp);
        h.addEventListener('pointercancel', onUp);
      }
      wideMq.addEventListener('change', onWorldChange);
      window.setTimeout(() => {
        if (!cancelled) loop();
      }, RISE_MS);
    };

    // Observe the stage itself: the island's own wrapper is display:contents and has no box.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          io.disconnect();
          void drop();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(stage);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      wideMq.removeEventListener('change', onWorldChange);
      for (const h of hits) {
        h.removeEventListener('pointerenter', onEnter);
        h.removeEventListener('pointerleave', onLeave);
        h.removeEventListener('pointerdown', onDown);
        h.removeEventListener('pointermove', onMove);
        h.removeEventListener('pointerup', onUp);
        h.removeEventListener('pointercancel', onUp);
      }
    };
  }, [me, objects, rest]);

  return (
    <div ref={stageRef} className="clay">
      <img
        className="clay-me"
        src={me.src}
        alt={me.alt}
        width={Math.round(me.poses.wide.w * 2)}
        height={Math.round(me.poses.wide.h * 2)}
        loading="eager"
        decoding="async"
        draggable={false}
        style={{ ...vars('n', me.poses.narrow), ...vars('w', me.poses.wide) } as CSSProperties}
      />
      <div className="clay-heap" aria-hidden="true">
        {objects.map((o, i) => {
          const n = box(o, WORLDS.narrow);
          const w = box(o, WORLDS.wide);
          const pn = rest.narrow[i] ?? { x: 0, y: 0, a: 0 };
          const pw = rest.wide[i] ?? { x: 0, y: 0, a: 0 };
          return (
            <div
              key={o.id}
              ref={(el) => {
                objRefs.current[i] = el;
              }}
              className="clay-obj"
              style={{ ...vars('n', { ...pn, ...n }), ...vars('w', { ...pw, ...w }) } as CSSProperties}
            >
              <img src={o.src} alt="" width={Math.round(w.w * 2)} height={Math.round(w.h * 2)} loading="eager" decoding="async" draggable={false} />
              <span
                className="clay-hit"
                data-i={i}
                style={{ clipPath: `polygon(${o.hull.map(([x, y]) => `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`).join(', ')})` }}
              />
            </div>
          );
        })}
        <p ref={tagRef} className="clay-tag" data-on="false" />
        <p ref={bubbleRef} className="clay-bubble" data-on="false">
          Pick me up
        </p>
      </div>
      <ul className="sr-only-text" aria-label="A few things about me">
        {objects.map((o) => (
          <li key={o.id}>{o.label}</li>
        ))}
      </ul>
    </div>
  );
}
