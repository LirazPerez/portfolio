/**
 * The "AI lab" on the home page: a dark stage of halftone dots (two streams of dots reach
 * toward the card in the middle; the dots answer the pointer) holding a carousel of cards.
 * Each card opens a pop-up with its screens, what to notice, and a demo link. Edit the
 * wording here; the layout lives in `src/components/AiLab.astro`.
 *
 *   status: 'shipped' | 'active' | 'paused' | 'planned'
 *     The pill differs by shape AND word, never color alone:
 *     shipped = check mark, active = solid dot, paused = hollow ring, planned = dashed ring.
 *   tone: the card cover and pop-up stage gradient (`--lab-tone-*` in AiLab.astro).
 *   screens: what the pop-up shows, one at a time.
 *     { kind: 'phone', image, caption }  a real screenshot (390 x 844) in the phone frame.
 *     { kind: 'drawn', id, caption }     a screen drawn in AiLab.astro, in the browser
 *                                        window (for work that has nothing public to show).
 *   notes: what to notice, numbered. `screen` (0-based) makes a note jump to that screen.
 *   cta: optional. A demo or page that opens in a new tab.
 *   small: one gray line under the button (what the demo is, or why there isn't one).
 */
import viennaPlan from '../assets/lab/vienna/plan.webp';
import viennaCats from '../assets/lab/vienna/cats.webp';
import viennaMap from '../assets/lab/vienna/map.webp';
import viennaDriver from '../assets/lab/vienna/driver.webp';

export type LabStatus = 'shipped' | 'active' | 'paused' | 'planned';
export type LabTone = 'rose' | 'violet';
export type LabDrawn = 'agent-tracker' | 'agent-summary' | 'agent-rules';

export type LabScreen =
  | { kind: 'phone'; image: ImageMetadata; caption: string; alt: string }
  | { kind: 'drawn'; id: LabDrawn; caption: string; alt: string };

export interface LabItem {
  id: string;
  name: string;
  status: LabStatus;
  /** One sentence on the card. Written to make people curious. */
  hook: string;
  /** The pop-up's opening line: the problem it solves. */
  lead: string;
  tools: string[];
  tone: LabTone;
  /** The card cover: screenshots in small phones, or a drawn screen. */
  cover: { kind: 'phones'; images: ImageMetadata[] } | { kind: 'drawn'; id: LabDrawn };
  screens: LabScreen[];
  notes: { text: string; screen?: number }[];
  cta?: { href: string; label: string };
  small: string;
}

export const LAB_EYEBROW = 'AI lab';
export const LAB_HEADING = 'Where my life meets the machine';
export const LAB_INTRO =
  "I don't only design with AI. I use it to run parts of my own life, and I'm honest about what works.";

export const LAB_STATUS_LABEL: Record<LabStatus, string> = {
  shipped: 'Shipped',
  active: 'Active',
  paused: 'Paused',
  planned: 'Planned',
};

export const LAB: LabItem[] = [
  {
    id: 'vienna',
    name: 'Vienna, for my mom',
    status: 'shipped',
    hook: "My mom isn't great with phones, so I built her one app for a whole trip.",
    lead: 'A trip abroad my mom could find her way through on her own.',
    tools: ['Claude', 'HTML', 'Web Speech API'],
    tone: 'rose',
    cover: { kind: 'phones', images: [viennaPlan, viennaCats] },
    screens: [
      {
        kind: 'phone',
        image: viennaPlan,
        caption: 'The day plan opens on today, one calm stop at a time.',
        alt: 'The day plan in Hebrew: a green WhatsApp-style header, day tabs, and a breakfast stop with a blue "take me there" button.',
      },
      {
        kind: 'phone',
        image: viennaCats,
        caption: 'Instagram-style circles, sorted by distance from the hotel.',
        alt: 'Seven round category icons in Hebrew, with the breakfast places listed below by walking distance.',
      },
      {
        kind: 'phone',
        image: viennaMap,
        caption: 'She picks where she is and sees what is closest, in walking minutes.',
        alt: 'A drawn map of the old town with colored dots per category and a "where are you now" picker.',
      },
      {
        kind: 'phone',
        image: viennaDriver,
        caption: 'Taxis only, so every place has a big card to show the driver.',
        alt: 'A full-screen card in German with the place name and address in large type, and a walking button below.',
      },
    ],
    notes: [
      { text: 'Built from apps she already knows: a WhatsApp header, Google Maps place cards, Instagram circles.', screen: 1 },
      { text: 'Every place opens in Google Maps for walking, or as a big card for the taxi driver.', screen: 3 },
      { text: 'Hebrew read-aloud for every sight, with pause and resume.' },
    ],
    cta: { href: '/lab/vienna-guide/', label: 'Open the demo' },
    small: 'Anonymized demo: no real hotel, dates or flights.',
  },
  {
    id: 'job-agent',
    name: 'Job search agent',
    status: 'active',
    hook: "Twice a week, before I'm up, it reads the job boards so I don't have to.",
    lead: 'A scheduled agent that finds design roles in Israel and leaves a short, honest shortlist in my tracker.',
    tools: ['Claude', 'Notion', 'Chrome'],
    tone: 'violet',
    cover: { kind: 'drawn', id: 'agent-tracker' },
    screens: [
      {
        kind: 'drawn',
        id: 'agent-tracker',
        caption: 'New roles land in my Notion tracker, each with a for, an against and a bottom line.',
        alt: 'A Notion-style table titled "New from Agent" with example rows: role, company type, years asked for, and a short fit note.',
      },
      {
        kind: 'drawn',
        id: 'agent-summary',
        caption: 'Each run ends with a short summary on my phone, best fit first.',
        alt: 'An example run summary: three new roles in order of fit, and a line on what was skipped.',
      },
      {
        kind: 'drawn',
        id: 'agent-rules',
        caption: 'It only reads. Applying and reaching out stay with me.',
        alt: 'The agent’s rules as a checklist: it reads job boards and adds new rows; it never applies, messages anyone or edits my rows.',
      },
    ],
    notes: [
      { text: 'Runs on a schedule, Sunday and Wednesday morning, from my own browser.', screen: 1 },
      { text: 'Writes only new rows, with a plain for / against / bottom line note on each.' },
      { text: 'It never applies, messages or connects for me. Those stay human.', screen: 2 },
      { text: 'My first version ran daily and found nothing useful. I cut it down to a few strict rules.' },
    ],
    small: 'It runs on my private accounts, so there is no public demo. The rows shown are examples.',
  },
];
