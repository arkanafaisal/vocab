import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const INPUT_PATH = path.join(DATA_DIR, '02-sorted-unique.txt');
const OUTPUT_PATH = path.join(DATA_DIR, '03-filtered-length.txt');

export const MIN_WORD_LENGTH = 4;

/**
 * Menyaring kata agar hanya menyisakan panjang minimal 4 karakter.
 * Filter panjang maksimal dilakukan setelah tahap normalisasi.
 * @param {string[]} words
 * @returns {string[]}
 */
export function filterByLength(words) {
  return words.filter((word) => word.length >= MIN_WORD_LENGTH);
}

/**
 * Menjalankan tahap 3: filter panjang kata minimal (< 4 dibuang).
 * @returns {Promise<string[]>}
 */
export async function runFilterLengthStep() {
  await mkdir(DATA_DIR, { recursive: true });
  const content = await readFile(INPUT_PATH, 'utf8');
  const words = content
    .split(/[,\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const filtered = filterByLength(words);
  await writeFile(OUTPUT_PATH, filtered.join(', '), 'utf8');

  console.log(
    `[03-filter-length] Selesai. Tersisa ${filtered.length} dari ${words.length} kata (panjang >= ${MIN_WORD_LENGTH}) -> ${OUTPUT_PATH}`
  );
  return filtered;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFilterLengthStep().catch((error) => {
    console.error(`[03-filter-length] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}

