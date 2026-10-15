/**
 * The cards in "AI that works for me" on the home page. Edit the wording here.
 *
 *   status: 'active' | 'paused' | 'planned'
 *     The pill differs by shape AND word, never color alone:
 *     active = solid dot, paused = hollow ring, planned = dashed ring.
 *   tools: shown on one line at the bottom of the card, joined with " · ".
 */
export type LabStatus = 'active' | 'paused' | 'planned';

export interface LabItem {
  name: string;
  status: LabStatus;
  problem: string;
  body: string;
  tools: string[];
}

export const LAB_HEADING = 'AI that works for me';
export const LAB_INTRO =
  "I don't only design with AI. I use it to run parts of my own life, and I'm honest about what works.";

export const LAB_STATUS_LABEL: Record<LabStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  planned: 'Planned',
};

export const LAB: LabItem[] = [
  {
    name: 'Job search agent',
    status: 'paused',
    problem: 'Finding roles before everyone else does.',
    body: "A daily agent that scanned openings and logged them in Notion. It wasn't finding what I needed, so I stopped it instead of polishing it.",
    tools: ['GitHub Actions', 'Notion', 'Claude'],
  },
  {
    name: 'Money',
    status: 'planned',
    problem: 'One clear picture of where my money goes.',
    body: 'A personal finance app, built around how I actually manage spending and saving.',
    tools: ['In design'],
  },
];
