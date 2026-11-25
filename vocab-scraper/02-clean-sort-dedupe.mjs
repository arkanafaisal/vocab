import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const RAW_INPUT_PATH = path.join(DATA_DIR, '01-raw.txt');
const SORTED_OUTPUT_PATH = path.join(DATA_DIR, '02-sorted-unique.txt');

/**
 * Membuang token berapostrof di dalam kata (contraction/posesif seperti `couldn't`, `Martha’s`),
 * lalu mengekstrak kata berbahasa Inggris (A-Z), mengubah ke huruf kecil,
 * menghapus duplikat, dan mengurutkan secara alfabetis.
 * @param {string} rawText
 * @returns {string[]}
 */
export function cleanSortAndDedupe(rawText) {
  const withoutApostropheWords = rawText
    .split(/\s+/)
    .filter((token) => !/[a-zA-Z]['’][a-zA-Z]/.test(token))
    .join(' ');

  const englishWords = withoutApostropheWords.match(/[a-zA-Z]+/g) ?? [];
  const uniqueWords = new Set(englishWords.map((word) => word.toLowerCase()));
  return Array.from(uniqueWords).sort((a, b) => a.localeCompare(b, 'en'));
}

/**
 * Menjalankan tahap 2: membersihkan non-Inggris, deduplikasi, dan sorting.
 * @returns {Promise<string[]>}
 */
export async function runCleanSortDedupeStep() {
  await mkdir(DATA_DIR, { recursive: true });
  const rawText = await readFile(RAW_INPUT_PATH, 'utf8');
  const cleanedWords = cleanSortAndDedupe(rawText);

  await writeFile(SORTED_OUTPUT_PATH, cleanedWords.join(', '), 'utf8');
  console.log(`[02-clean-sort-dedupe] Selesai. Total kata unik: ${cleanedWords.length} -> ${SORTED_OUTPUT_PATH}`);
  return cleanedWords;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCleanSortDedupeStep().catch((error) => {
    console.error(`[02-clean-sort-dedupe] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}

