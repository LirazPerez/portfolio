import { statSync } from 'node:fs';
import { join } from 'node:path';

export const CV_HREF = '/cv/liraz-hazala-perez-cv.pdf';

// Read the real file size at build time so the accessible name never goes stale.
const bytes = statSync(join(process.cwd(), 'public', CV_HREF)).size;
// Under 1 MB the size reads in KB, so a small file never shows as "0.0 MB".
export const CV_SIZE_LABEL =
  bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1_000))} KB`;
