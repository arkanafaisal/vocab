import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const INPUT_JSON_PATH = path.join(DATA_DIR, '07-final.json');
const MASTER_DATA_PATH = path.join(__dirname, 'data.txt');

/**
 * Membaca `data.txt` utama jika sudah ada; jika belum ada, mengembalikan array kosong.
 * @returns {Promise<string[]>}
 */
async function readMasterWords() {
  try {
    const content = await readFile(MASTER_DATA_PATH, 'utf8');
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
 * Menjalankan tahap 8: membaca `data/07-final.json`, menampilkan kata baru non-duplikat,
 * lalu menggabungkan & mengurutkan seluruh vocab Inggris ke `data.txt`.
 * @returns {Promise<{ newWords: string[], mergedWords: string[] }>}
 */
export async function runSaveStep() {
  const raw = await readFile(INPUT_JSON_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : [];
  const incomingWords = Array.from(
    new Set(items.map((item) => String(item?.vocab ?? '').trim()).filter(Boolean))
  );

  const existingWords = await readMasterWords();
  const existingSet = new Set(existingWords);

  const newWords = incomingWords
    .filter((word) => !existingSet.has(word))
    .sort((a, b) => a.localeCompare(b, 'en'));

  console.log(
    `[08-save] Kata baru non-duplikat (${newWords.length}): ${newWords.length > 0 ? newWords.join(', ') : '(tidak ada)'}`
  );

  const mergedWords = Array.from(new Set([...existingWords, ...newWords])).sort((a, b) =>
    a.localeCompare(b, 'en')
  );

  await writeFile(MASTER_DATA_PATH, mergedWords.join(', '), 'utf8');
  console.log(`[08-save] Tersimpan ${mergedWords.length} total kata -> ${MASTER_DATA_PATH}`);

  return { newWords, mergedWords };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSaveStep().catch((error) => {
    console.error(`[08-save] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}

