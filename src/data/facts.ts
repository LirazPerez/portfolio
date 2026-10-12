/**
 * The facts that fall onto the home-page portrait. Edit the wording here; no code changes needed.
 *
 *   kind: 'ops'   = purple pill, from the operations background
 *   kind: 'build' = neutral pill, about building
 *
 * Order matters a little: facts drop in this order, and each one gets a fixed starting
 * column from its position in the list, so the same list always lands the same way.
 * On narrow screens the 'build' pills are hidden to keep the pile off the portrait.
 */
export type FactKind = 'ops' | 'build';

export interface Fact {
  text: string;
  kind: FactKind;
}

export const FACTS: Fact[] = [
  { text: 'Former IDF war-room commander', kind: 'ops' },
  { text: 'Led 150 soldiers', kind: 'ops' },
  { text: 'Budgets in the hundreds of millions', kind: 'ops' },
  { text: '30% cost reduction', kind: 'ops' },
  { text: '15+ international vendors', kind: 'ops' },
  { text: 'Partnered with the U.S. Armed Forces', kind: 'ops' },
  { text: 'Research to React', kind: 'build' },
  { text: 'Ships with Claude Code', kind: 'build' },
];
