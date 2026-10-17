/**
 * The clay objects that fall into a heap next to me in the home hero.
 * Edit the wording here; no code changes needed.
 *
 * - `label`: shown next to the object on hover or grab, and read by screen readers in the
 *   list "A few things about me".
 * - `size`: the object's longest side, before each world's `objectScale` (src/lib/clay-heap.ts),
 *   which keeps the objects the same size next to me everywhere: about 1.07 CSS px per unit
 *   beside the headline on a full desktop page.
 * - Order is drop order: the first object falls first and ends up lowest in the heap;
 *   Bobby goes last, so he sits on top.
 *
 * Images live in src/assets/hero/ (see the README there). Replacing an image means
 * re-running `node scripts/export-hero-objects.mjs`, which also redraws its outline.
 */
import bobby from '../assets/hero/obj-bobby.webp';
import statue from '../assets/hero/obj-statue-of-liberty.webp';
import beret from '../assets/hero/obj-beret.webp';
import gradCap from '../assets/hero/obj-grad-cap.webp';
import laptop from '../assets/hero/obj-laptop.webp';
import shoe from '../assets/hero/obj-running-shoe.webp';
import snowboard from '../assets/hero/obj-snowboard.webp';
import passport from '../assets/hero/obj-passport.webp';

export const HERO_OBJECTS = [
  { id: 'obj-snowboard', image: snowboard, label: 'Snowboarding', size: 176 },
  { id: 'obj-laptop', image: laptop, label: 'I build what I design', size: 138 },
  { id: 'obj-statue-of-liberty', image: statue, label: '5.5 years in New York', size: 150 },
  { id: 'obj-running-shoe', image: shoe, label: 'Training for a half marathon', size: 122 },
  { id: 'obj-beret', image: beret, label: 'IDF observation officer', size: 112 },
  { id: 'obj-grad-cap', image: gradCap, label: 'FIT', size: 110 },
  { id: 'obj-passport', image: passport, label: 'Always planning the next trip', size: 92 },
  { id: 'obj-bobby', image: bobby, label: 'Bobby, my dog', size: 172 },
] as const;

export const ME_ALT = 'Liraz Hazala Perez';
