import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const INPUT_PATH = path.join(DATA_DIR, '06-final.txt');
const OUTPUT_JSON_PATH = path.join(DATA_DIR, '07-translated.json');

/**
 * Konfigurasi translate batch menggunakan pemisah `\n`.
 * - `provider`: `'mymemory'` (gratis tanpa key) atau `'apps-script'` (isi `appsScriptUrl`).
 * - `email`: opsional untuk MyMemory agar kuota harian lebih besar.
 */
export const TRANSLATE_CONFIG = {
  provider: 'mymemory',
  sourceLang: 'en',
  targetLang: 'id',
  appsScriptUrl: '',
  email: '',
  batchSize: 25,
  maxBatchChars: 420,
  delayMs: 350,
};

/**
 * Menjeda eksekusi untuk menghindari rate limit API.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Memecah daftar kata menjadi beberapa batch berdasarkan jumlah kata dan batas karakter.
 * @param {string[]} words
 * @returns {string[][]}
 */
export function createBatches(words) {
  const batches = [];
  let current = [];
  let currentChars = 0;

  for (const word of words) {
    const addedChars = current.length === 0 ? word.length : word.length + 1;
    const exceedsCount = current.length >= TRANSLATE_CONFIG.batchSize;
    const exceedsChars = currentChars + addedChars > TRANSLATE_CONFIG.maxBatchChars;

    if (current.length > 0 && (exceedsCount || exceedsChars)) {
      batches.push(current);
      current = [word];
      currentChars = word.length;
    } else {
      current.push(word);
      currentChars += addedChars;
    }
  }

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
}

/**
 * Menerjemahkan teks via MyMemory API.
 * @param {string} text
 * @returns {Promise<string>}
 */
async function translateWithMyMemory(text) {
  const params = new URLSearchParams({
    q: text,
    langpair: `${TRANSLATE_CONFIG.sourceLang}|${TRANSLATE_CONFIG.targetLang}`,
  });

  if (TRANSLATE_CONFIG.email) {
    params.set('de', TRANSLATE_CONFIG.email);
  }

  const url = `https://api.mymemory.translated.net/get?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MyMemory HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || `MyMemory status ${data.responseStatus}`);
  }

  return String(data.responseData?.translatedText ?? '');
}

/**
 * Menerjemahkan teks via Google Apps Script Web App.
 * @param {string} text
 * @returns {Promise<string>}
 */
async function translateWithAppsScript(text) {
  if (!TRANSLATE_CONFIG.appsScriptUrl) {
    throw new Error('appsScriptUrl belum diisi pada TRANSLATE_CONFIG.');
  }

  const response = await fetch(TRANSLATE_CONFIG.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      source: TRANSLATE_CONFIG.sourceLang,
      target: TRANSLATE_CONFIG.targetLang,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apps Script HTTP ${response.status}`);
  }

  const data = await response.json();
  return String(data.translatedText ?? '');
}

/**
 * Mengirim teks ke provider aktif.
 * @param {string} text
 * @returns {Promise<string>}
 */
async function translateText(text) {
  if (TRANSLATE_CONFIG.provider === 'apps-script') {
    return translateWithAppsScript(text);
  }
  return translateWithMyMemory(text);
}

/**
 * Menerjemahkan satu batch kata (dipisah `\n`). Jika jumlah baris hasil tidak cocok,
 * otomatis fallback menerjemahkan kata satu per satu agar pasangan tidak bergeser.
 * @param {string[]} batch
 * @returns {Promise<Array<{ vocab: string, meaning: string }>>}
 */
async function translateBatch(batch) {
  const joined = batch.join('\n');
  const translated = await translateText(joined);
  const lines = translated.split(/\r?\n/).map((line) => line.trim());

  if (lines.length === batch.length && lines.every(Boolean)) {
    return batch.map((vocab, index) => ({
      vocab,
      meaning: lines[index].toLowerCase(),
    }));
  }

  const fallbackResults = [];
  for (const vocab of batch) {
    const single = await translateText(vocab);
    fallbackResults.push({
      vocab,
      meaning: single.trim().toLowerCase(),
    });
    await sleep(TRANSLATE_CONFIG.delayMs);
  }
  return fallbackResults;
}

/**
 * Menjalankan tahap 7: membaca `data/06-final.txt`, menerjemahkan per batch `\n`,
 * dan menyimpan array objek `{ vocab, meaning }` ke `data/07-translated.json`.
 * @returns {Promise<Array<{ vocab: string, meaning: string }>>}
 */
export async function runTranslateStep() {
  await mkdir(DATA_DIR, { recursive: true });
  const content = await readFile(INPUT_PATH, 'utf8');
  const words = content
    .split(/[,\r\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (words.length === 0) {
    console.log('[07-translate] Tidak ada kata baru di data/06-final.txt untuk diterjemahkan.');
    return [];
  }

  const batches = createBatches(words);
  const entries = [];

  for (let i = 0; i < batches.length; i += 1) {
    const batchResult = await translateBatch(batches[i]);
    entries.push(...batchResult);
    console.log(`[07-translate] Batch ${i + 1}/${batches.length} selesai (${batchResult.length} kata)`);
    if (i < batches.length - 1) {
      await sleep(TRANSLATE_CONFIG.delayMs);
    }
  }

  await writeFile(OUTPUT_JSON_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  console.log(`[07-translate] Selesai. Tersimpan ${entries.length} pasangan kata -> ${OUTPUT_JSON_PATH}`);
  return entries;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTranslateStep().catch((error) => {
    console.error(`[07-translate] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}

