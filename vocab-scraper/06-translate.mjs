import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const INPUT_PATH = path.join(DATA_DIR, '05-filtered.txt');
const MASTER_DATA_PATH = path.join(__dirname, 'data.txt');
const OUTPUT_JSON_PATH = path.join(DATA_DIR, '06-translated.json');

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
 * Membaca daftar kata dari file teks; jika file belum ada, mengembalikan array kosong.
 * @param {string} filePath
 * @returns {Promise<string[]>}
 */
async function readWordListIfExists(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    return content
      .split(/[,\r\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Menentukan sumber kata: utamakan `data/05-filtered.txt`, atau tawarkan ambil utuh dari `data.txt`
 * jika `data/05-filtered.txt` tidak ada/kosong.
 * @returns {Promise<string[]>}
 */
async function resolveInputWords() {
  if (!process.argv.includes('--from-master')) {
    const filteredWords = await readWordListIfExists(INPUT_PATH);
    if (filteredWords.length > 0) {
      return filteredWords;
    }
  }

  const masterWords = await readWordListIfExists(MASTER_DATA_PATH);
  if (masterWords.length === 0) {
    console.log('[06-translate] Tidak ada kata di data/05-filtered.txt maupun data.txt.');
    return [];
  }

  if (process.argv.includes('--from-master') || process.argv.includes('-y') || process.argv.includes('--yes')) {
    console.log(`[06-translate] Mengambil ${masterWords.length} kata utuh dari data.txt.`);
    return masterWords;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(
      `[06-translate] data/05-filtered.txt tidak ada/kosong. Ambil seluruh kata dari data.txt (${masterWords.length} kata)? (y/n): `
    );
    if (['y', 'yes'].includes(answer.trim().toLowerCase())) {
      return masterWords;
    }
    return [];
  } finally {
    rl.close();
  }
}

/**
 * Menjalankan tahap 6: membaca `data/05-filtered.txt` (atau `data.txt` utuh jika dipilih),
 * menerjemahkan per batch `\n`, dan menyimpan array objek `{ vocab, meaning }` ke `data/06-translated.json`.
 * @returns {Promise<Array<{ vocab: string, meaning: string }>>}
 */
export async function runTranslateStep() {
  await mkdir(DATA_DIR, { recursive: true });
  const words = await resolveInputWords();

  if (words.length === 0) {
    console.log('[06-translate] Tidak ada kata untuk diterjemahkan.');
    await writeFile(OUTPUT_JSON_PATH, '[]\n', 'utf8');
    return [];
  }

  const batches = createBatches(words);
  const entries = [];

  for (let i = 0; i < batches.length; i += 1) {
    const batchResult = await translateBatch(batches[i]);
    entries.push(...batchResult);
    console.log(`[06-translate] Batch ${i + 1}/${batches.length} selesai (${batchResult.length} kata)`);
    if (i < batches.length - 1) {
      await sleep(TRANSLATE_CONFIG.delayMs);
    }
  }

  await writeFile(OUTPUT_JSON_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  console.log(`[06-translate] Selesai. Tersimpan ${entries.length} pasangan kata -> ${OUTPUT_JSON_PATH}`);
  return entries;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTranslateStep().catch((error) => {
    console.error(`[06-translate] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}

