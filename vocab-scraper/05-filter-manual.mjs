import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const INPUT_PATH = path.join(DATA_DIR, '04-normalized.txt');
const OUTPUT_PATH = path.join(DATA_DIR, '05-filtered.txt');
const MASTER_DATA_PATH = path.join(__dirname, 'data.txt');

/**
 * Membaca daftar kata yang sudah ada di `data.txt` untuk deduplikasi di akhir tahap 05.
 * @returns {Promise<Set<string>>}
 */
async function loadMasterWordSet() {
  try {
    const content = await readFile(MASTER_DATA_PATH, 'utf8');
    const words = content
      .split(/[,\r\n]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    return new Set(words);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return new Set();
    }
    throw error;
  }
}

/**
 * Memuat daftar kata pengecualian dari `manual-exclude.mjs`.
 * Jika file tidak ada atau gagal dibaca, mengembalikan Set kosong (dari array kosong).
 * @returns {Promise<Set<string>>}
 */
export async function loadExcludeWordSet() {
  try {
    const mod = await import('./manual-exclude.mjs');
    if (typeof mod.getExcludeWordSet === 'function') {
      return mod.getExcludeWordSet();
    }
    const list = Array.isArray(mod.MANUAL_EXCLUDE_WORDS) ? mod.MANUAL_EXCLUDE_WORDS : [];
    return new Set(list.map((word) => String(word).trim().toLowerCase()).filter(Boolean));
  } catch {
    console.log('[05-filter-manual] manual-exclude.mjs tidak ditemukan, lanjut dengan array kosong.');
    return new Set();
  }
}

export const MIN_WORD_LENGTH = 4;
export const MAX_WORD_LENGTH = 12;

/**
 * Menghapus kata-kata yang masuk daftar pengecualian manual atau di luar batas panjang (4-12).
 * @param {string[]} words
 * @param {Set<string>} excludeSet
 * @returns {string[]}
 */
export function filterManualWords(words, excludeSet) {
  return words.filter(
    (word) =>
      word.length >= MIN_WORD_LENGTH &&
      word.length <= MAX_WORD_LENGTH &&
      !excludeSet.has(word.toLowerCase())
  );
}

/**
 * Menjalankan tahap 5: pembersihan manual dan penyimpanan ke file tampung lokal.
 * @returns {Promise<string[]>}
 */
export async function runFilterManualStep() {
  await mkdir(DATA_DIR, { recursive: true });
  const content = await readFile(INPUT_PATH, 'utf8');
  const words = content
    .split(/[,\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const excludeSet = await loadExcludeWordSet();
  const masterSet = await loadMasterWordSet();
  const afterManual = filterManualWords(words, excludeSet);
  const finalWords = afterManual.filter((word) => !masterSet.has(word.toLowerCase()));
  const excludedCount = words.length - afterManual.length;
  const duplicateCount = afterManual.length - finalWords.length;

  await writeFile(OUTPUT_PATH, finalWords.join(', '), 'utf8');

  console.log(
    `[05-filter-manual] Selesai. Tersimpan ${finalWords.length} kata baru (dibuang manual/panjang: ${excludedCount}, duplikat data.txt: ${duplicateCount}) -> ${OUTPUT_PATH}`
  );
  return finalWords;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFilterManualStep().catch((error) => {
    console.error(`[05-filter-manual] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}
