import { useEffect, useRef, type CSSProperties } from 'react';
import { STEP_MS, WORLDS, box, createSim, restingSim, runToRest, step, wake, pose, type HeapObject, type Pose, type Shape, type Sim, type WorldName } from '../lib/clay-heap';
import './ClayHeap.css';

/**
 * The home hero's clay heap, as a React island (client:visible): my cutout standing at the
 * right of the stage, and my personal objects in a heap beside me. The stage has no box:
 * everything sits on the page, on an invisible floor between invisible walls.
 *
 * The stage is one of three worlds (src/lib/clay-heap.ts): the column beside the headline
 * from 1024px, a low band under the text from 760px, a small stage under the text on
 * phones. The server renders the resting heap of each (precomputed at build time by the
 * same simulation, see index.astro) and CSS shows the one that fits. That is what shows
 * with no JS and with prefers-reduced-motion, and it is also what hydrates.
 *
 * With motion allowed, once the stage is mostly in view: I rise in (400 ms), then the
 * objects drop one after another (from above the hero beside the headline, from the top of
 * the stage under the text) and settle under matter-js at a fixed 1/60 s step, and
 * the loop stops when everything sleeps. An object can be picked up and thrown (pointer
 * events, so mouse and touch); a touch that starts anywhere else scrolls the page as
 * usual, because only the objects' outlines take touches. If the layout changes
 * afterwards (760px, 1024px), the heap re-settles instantly in its world.
 *
 * The hint: a "Pick me up" bubble ("Drag me" on touch screens) shows 600 ms after Bobby
 * lands, or 5 s after the drop starts at the latest, pointing at Bobby (or the highest
 * object it fits over) and following it while the heap settles, and that object does one
 * small hop. It stays until the first grab, which is remembered for the session.
 *
 * With prefers-reduced-motion nothing drops: the static heap stays, the bubble shows at
 * once, and objects can still be picked up; one let go of lands at once, without a fall.
 *
 * The objects layer is aria-hidden; screen readers get the list "A few things about me".
 */

const MAX_FRAME_MS = 250; // a backgrounded tab must not trigger a burst of catch-up steps
const RISE_MS = 400;
const BUBBLE_KEY = 'lh-heap-picked'; // set on the first grab, never just for showing the bubble
const BUBBLE_AFTER_LANDING_MS = 600;
const BUBBLE_LATEST_MS = 5000; // after the drop starts
/** My face and hair in the cutout's image box (fractions): the bubble never covers them. */
const FACE = { x0: 0.2, x1: 0.64, y0: 0.02, y1: 0.42 };
const DESK_QUERY = '(min-width: 64rem)'; // lg, 1024px: matches the stage CSS
const BAND_QUERY = '(min-width: 47.5rem)'; // md, 760px

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

const PREFIX: Record<WorldName, string> = { desk: 'd', band: 'b', phone: 'p' };
const NAMES = Object.keys(PREFIX) as WorldName[];

/** One world's pose as prefixed custom properties (--d-x for desk, --b-x band, --p-x phone). */
function vars(world: WorldName, p: Pose & { w?: number; h?: number }): Record<string, string> {
  const prefix = PREFIX[world];
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
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const deskMq = window.matchMedia(DESK_QUERY);
    const bandMq = window.matchMedia(BAND_QUERY);
    const worldName = (): WorldName => (deskMq.matches ? 'desk' : bandMq.matches ? 'band' : 'phone');
    const last = objects.length - 1; // Bobby: drops last, sits on top, drawn over everything

    let cancelled = false;
    let raf = 0;
    let M: Matter | null = null;
    let sim: Sim | null = null;
    let current = worldName();
    let running = false;
    let hovered = -1;
    let grab: { i: number; id: number; c: Constraint } | null = null;
    let picked = readFlag();
    let target = -1; // the object the bubble points at, once shown
    let bubbleTop = 0; // its top edge, units
    let stillSteps = 0;
    let landed = false;
    const timers: number[] = [];

    bubble.textContent = touch ? 'Drag me' : 'Pick me up';

    const world = () => WORLDS[current];

    const toWorld = (e: PointerEvent) => {
      const { W, H, ceiling } = world();
      const r = stage.getBoundingClientRect();
      return {
        x: Math.min(W, Math.max(0, ((e.clientX - r.left) / r.width) * W)),
        y: Math.min(H, Math.max(ceiling, ((e.clientY - r.top) / r.width) * W)),
      };
    };

    // An object's outline box, in units: from its body, or from the resting heap before the
    // physics has loaded.
    const boundsOf = (i: number) => {
      const b = sim?.items[i]?.body;
      if (b) return b.bounds;
      const p = rest[current][i] ?? { x: 0, y: 0, a: 0 };
      const o = objects[i];
      if (!o) return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
      const { w, h } = box(o, world());
      const cos = Math.cos(p.a);
      const sin = Math.sin(p.a);
      const pts = o.hull.map(([hx, hy]) => {
        const x = (hx - 0.5) * w;
        const y = (hy - 0.5) * h;
        return { x: p.x + x * cos - y * sin, y: p.y + x * sin + y * cos };
      });
      const xs = pts.map((q) => q.x);
      const ys = pts.map((q) => q.y);
      return { min: { x: Math.min(...xs), y: Math.min(...ys) }, max: { x: Math.max(...xs), y: Math.max(...ys) } };
    };

    // A small label above the object, kept between the walls and under the ceiling.
    const placeTag = () => {
      const i = grab?.i ?? hovered;
      const label = objects[i]?.label;
      if (!label) {
        tag.dataset.on = 'false';
        return;
      }
      if (tag.textContent !== label) tag.textContent = label;
      const { W, ceiling } = world();
      const u = stage.clientWidth / W;
      const halfW = tag.offsetWidth / u / 2;
      const h = tag.offsetHeight / u;
      const b = boundsOf(i);
      const x = (b.min.x + b.max.x) / 2;
      // Over the object the bubble points at, the label sits above the bubble.
      const y = bubble.dataset.on === 'true' && i === target ? bubbleTop : b.min.y;
      const tx = Math.min(W - halfW - 8, Math.max(halfW + 8, x));
      const ty = y - 10 - h < ceiling + 8 ? y + 16 + h : y - 10;
      tag.style.setProperty('--x', String(tx));
      tag.style.setProperty('--y', String(ty));
      tag.dataset.on = 'true';
    };

    // Where the bubble goes for object i: centered over its top, its tail touching it. It
    // stays between the walls (never over the text), inside the window and below the nav,
    // and steps left off my face.
    const bubbleAt = (i: number) => {
      const { W } = world();
      const r = stage.getBoundingClientRect();
      const u = r.width / W;
      const hw = bubble.offsetWidth / u / 2;
      const h = bubble.offsetHeight / u;
      const tail = 9 / u;
      // Its top stays inside the window, below the nav when the nav floats at the top, and
      // below the text when the stage is under it.
      let minPx = 8;
      const nav = document.querySelector('.capsule')?.getBoundingClientRect();
      if (nav && nav.top < window.innerHeight / 2) minPx = Math.max(minPx, nav.bottom + 8);
      const text = stage.closest('.hero')?.firstElementChild?.getBoundingClientRect();
      if (text && text.bottom <= r.top + 1) minPx = Math.max(minPx, text.bottom + 8);
      const minY = (minPx - r.top) / u;
      const b = boundsOf(i);
      const ax = (b.min.x + b.max.x) / 2;
      const tipY = b.min.y - 2 / u;
      const top = tipY - tail - h;
      let cx = Math.min(W - hw, Math.max(hw, ax));
      const mp = me.poses[current];
      const fx0 = mp.x - mp.w / 2 + mp.w * FACE.x0;
      const fx1 = mp.x - mp.w / 2 + mp.w * FACE.x1;
      const fy0 = mp.y - mp.h / 2 + mp.h * FACE.y0;
      const fy1 = mp.y - mp.h / 2 + mp.h * FACE.y1;
      const margin = 12 / u; // my lean moves the face a little; keep well clear of it
      if (cx + hw > fx0 - margin && cx - hw < fx1 + margin && top < fy1 && tipY > fy0) cx = fx0 - margin - hw;
      const reach = hw - 16 / u; // the tail stays on the bubble's body
      const fits = top >= minY && cx >= hw && Math.abs(ax - cx) <= reach;
      return { cx, tipY, top, tail: Math.max(-reach, Math.min(reach, ax - cx)) * u, fits };
    };

    // Bobby if the bubble fits over him, otherwise the highest object it fits over.
    const pickTarget = () => {
      const order = objects.map((_, i) => i).filter((i) => i !== last);
      order.sort((a, b) => boundsOf(a).min.y - boundsOf(b).min.y);
      return [last, ...order].find((i) => bubbleAt(i).fits) ?? last;
    };

    const placeBubble = () => {
      if (target < 0) return;
      const p = bubbleAt(target);
      bubbleTop = p.top;
      bubble.style.setProperty('--x', String(p.cx));
      bubble.style.setProperty('--y', String(p.tipY));
      bubble.style.setProperty('--tail', `${p.tail.toFixed(1)}px`);
    };

    const clearTimers = () => {
      for (const t of timers) window.clearTimeout(t);
      timers.length = 0;
    };

    // Shown once, and only until the first grab (which is what the session remembers).
    const showBubble = () => {
      clearTimers();
      if (picked || target >= 0 || cancelled) return;
      target = pickTarget();
      placeBubble();
      bubble.dataset.on = 'true';
      // One small hop of the object it points at (CSS skips it under reduced motion).
      const el = els[target];
      if (el && !still) {
        el.classList.add('is-nudged');
        el.addEventListener('animationend', () => el.classList.remove('is-nudged'), { once: true });
      }
    };
    const hideBubble = () => {
      clearTimers();
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
      if (bubble.dataset.on === 'true') placeBubble();
      if (grab || hovered >= 0) placeTag();
    };

    // While the heap is dropping: 600 ms after Bobby (the last object) lands, the bubble
    // shows. He has landed once he has been falling a while and has barely moved for 6 steps.
    const watchBobby = () => {
      if (!sim || picked || target >= 0 || landed) return;
      const item = sim.items[last];
      const b = item?.body;
      if (!item || !b) return;
      const calm = sim.steps - item.spawnStep > 20 && Math.hypot(b.velocity.x, b.velocity.y) < 0.3 && Math.abs(b.angularVelocity) < 0.01;
      stillSteps = calm ? stillSteps + 1 : 0;
      if (stillSteps < 6) return;
      landed = true;
      timers.push(window.setTimeout(showBubble, BUBBLE_AFTER_LANDING_MS));
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
          watchBobby();
          acc -= STEP_MS;
          if (asleep && !grab) break;
        }
        paint();
        if (asleep && !grab) {
          // Everything sleeps: stop the loop until the next grab.
          running = false;
          showBubble();
          return;
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    // Hover labels work in every mode once hydrated.
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
      if (!grab || e.pointerId !== grab.id || !sim || !M) return;
      release();
      if (e.pointerType !== 'mouse') hovered = -1;
      if (still) {
        // Reduced motion: whatever was let go of lands at once, with no fall to watch.
        cancelAnimationFrame(raf);
        running = false;
        runToRest(M, sim);
        paint();
        placeTag();
        return;
      }
      placeTag();
      wake(sim);
      loop();
    };

    // Crossing 760px or 1024px: re-settle instantly in the new world.
    const onWorldChange = () => {
      current = worldName();
      if (M && sim) {
        release();
        cancelAnimationFrame(raf);
        running = false;
        if (still) {
          sim = restingSim(M, world(), objects, me, rest[current]);
        } else {
          sim = createSim(M, world(), objects, me, Math.random);
          runToRest(M, sim);
        }
        paint();
      }
      if (bubble.dataset.on === 'true') {
        target = pickTarget();
        placeBubble();
      } else if (sim) {
        showBubble();
      }
    };

    const hits = Array.from(stage.querySelectorAll<HTMLElement>('.clay-hit'));
    const grabbable = () => {
      stage.classList.add('can-grab');
      for (const h of hits) {
        h.addEventListener('pointerdown', onDown);
        h.addEventListener('pointermove', onMove);
        h.addEventListener('pointerup', onUp);
        h.addEventListener('pointercancel', onUp);
      }
    };
    for (const h of hits) {
      h.addEventListener('pointerenter', onEnter);
      h.addEventListener('pointerleave', onLeave);
    }
    deskMq.addEventListener('change', onWorldChange);
    bandMq.addEventListener('change', onWorldChange);

    const loadMatter = async () => {
      const mod = await import('matter-js');
      return ('default' in mod ? mod.default : mod) as Matter;
    };

    let io: IntersectionObserver | null = null;
    if (still) {
      // Reduced motion: the static heap stays as it is, the bubble shows right away, and
      // the physics loads in the background so the objects can still be picked up.
      stage.classList.add('is-static');
      showBubble();
      void loadMatter().then((m) => {
        if (cancelled) return;
        M = m;
        sim = restingSim(M, world(), objects, me, rest[current]);
        grabbable();
      });
    } else {
      const drop = async () => {
        const m = await loadMatter();
        if (cancelled) return;
        M = m;
        sim = createSim(M, world(), objects, me, Math.random);

        for (const el of els) if (el) el.dataset.on = 'false';
        stage.classList.add('is-live');
        requestAnimationFrame(() => stage.classList.add('me-in'));
        grabbable();
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            loop();
            // At most this long after the drop starts, whatever Bobby is doing.
            timers.push(window.setTimeout(showBubble, BUBBLE_LATEST_MS));
          }, RISE_MS),
        );
      };

      // Observe the stage itself: the island's own wrapper is display:contents and has no box.
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            io?.disconnect();
            void drop();
          }
        },
        { threshold: 0.4 },
      );
      io.observe(stage);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimers();
      io?.disconnect();
      deskMq.removeEventListener('change', onWorldChange);
      bandMq.removeEventListener('change', onWorldChange);
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
        width={Math.round(me.poses.desk.w * 2)}
        height={Math.round(me.poses.desk.h * 2)}
        loading="eager"
        decoding="async"
        draggable={false}
        style={Object.assign({}, ...NAMES.map((n) => vars(n, me.poses[n]))) as CSSProperties}
      />
      <div className="clay-heap" aria-hidden="true">
        {objects.map((o, i) => {
          const style = Object.assign({}, ...NAMES.map((n) => vars(n, { ...(rest[n][i] ?? { x: 0, y: 0, a: 0 }), ...box(o, WORLDS[n]) })));
          const w = box(o, WORLDS.desk);
          return (
            <div
              key={o.id}
              ref={(el) => {
                objRefs.current[i] = el;
              }}
              className="clay-obj"
              style={style as CSSProperties}
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
