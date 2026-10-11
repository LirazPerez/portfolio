import { statSync } from 'node:fs';
import { join } from 'node:path';

export const CV_HREF = '/cv/liraz-hazala-perez-cv.pdf';

// Read the real file size at build time so the accessible name never goes stale.
const bytes = statSync(join(process.cwd(), 'public', CV_HREF)).size;
export const CV_SIZE_LABEL = `${(bytes / 1_000_000).toFixed(1)} MB`;
