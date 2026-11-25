import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const INPUT_PATH = path.join(DATA_DIR, '05-filtered.txt');
const FINAL_NEW_PATH = path.join(DATA_DIR, '06-final.txt');
const MASTER_DATA_PATH = path.join(__dirname, 'data.txt');

/**
 * Memecah string daftar kata yang dipisahkan koma/baris baru menjadi array kata unik terurut.
 * @param {string} content
 * @returns {string[]}
 */
function parseWordList(content) {
  return content
    .split(/[,\r\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Membaca `data.txt` utama jika sudah ada; jika belum ada, mengembalikan array kosong.
 * @returns {Promise<string[]>}
 */
async function readMasterWords() {
  try {
    const content = await readFile(MASTER_DATA_PATH, 'utf8');
    return parseWordList(content);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Menjalankan tahap 6: membandingkan `data/05-filtered.txt` dengan `data.txt`,
 * menampilkan kata baru non-duplikat, menggabungkan & mengurutkan ke `data.txt`,
 * serta menyimpan kata baru saja ke `data/06-final.txt`.
 * @returns {Promise<{ newWords: string[], mergedWords: string[] }>}
 */
export async function runSaveStep() {
  await mkdir(DATA_DIR, { recursive: true });

  const filteredContent = await readFile(INPUT_PATH, 'utf8');
  const incomingWords = Array.from(new Set(parseWordList(filteredContent)));
  const existingWords = await readMasterWords();
  const existingSet = new Set(existingWords);

  const newWords = incomingWords
    .filter((word) => !existingSet.has(word))
    .sort((a, b) => a.localeCompare(b, 'en'));

  console.log(
    `[06-save] Kata baru non-duplikat (${newWords.length}): ${newWords.length > 0 ? newWords.join(', ') : '(tidak ada)'}`
  );

  const mergedWords = Array.from(new Set([...existingWords, ...newWords])).sort((a, b) =>
    a.localeCompare(b, 'en')
  );

  await writeFile(MASTER_DATA_PATH, mergedWords.join(', '), 'utf8');
  await writeFile(FINAL_NEW_PATH, newWords.join(', '), 'utf8');

  console.log(`[06-save] Tersimpan ${mergedWords.length} total kata -> ${MASTER_DATA_PATH}`);
  console.log(`[06-save] Tersimpan ${newWords.length} kata baru -> ${FINAL_NEW_PATH}`);

  return { newWords, mergedWords };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSaveStep().catch((error) => {
    console.error(`[06-save] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}

