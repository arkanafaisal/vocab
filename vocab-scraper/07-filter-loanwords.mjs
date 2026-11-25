import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const INPUT_JSON_PATH = path.join(DATA_DIR, '06-translated.json');
const OUTPUT_JSON_PATH = path.join(DATA_DIR, '07-final.json');

const SIMILARITY_THRESHOLD = 0.65;
const MIN_LCS_LENGTH = 4;

/**
 * Menghitung panjang Longest Common Subsequence (kesamaan huruf berurutan
 * meskipun dipisahkan oleh huruf lain) antara dua string.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function longestCommonSubsequenceLength(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Menormalkan ejaan serapan Inggris <-> Indonesia agar perbandingan lebih akurat
 * (mis. `academy` -> `akademi`, `activity` -> `aktivitas`, `system` -> `sistem`).
 * @param {string} word
 * @returns {string}
 */
function normalizeLoanwordSpelling(word) {
  return word
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/tion$/g, 'si')
    .replace(/sion$/g, 'si')
    .replace(/ty$/g, 'tas')
    .replace(/ism$/g, 'isme')
    .replace(/ble$/g, 'bel')
    .replace(/cle$/g, 'kel')
    .replace(/que$/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/ch/g, 'k')
    .replace(/qu/g, 'k')
    .replace(/th/g, 't')
    .replace(/x/g, 'ks')
    .replace(/c/g, 'k')
    .replace(/y/g, 'i')
    .replace(/([a-z])\1+/g, '$1');
}

/**
 * Menghapus imbuhan umum bahasa Indonesia pada `meaning` satu kata.
 * @param {string} word
 * @returns {string}
 */
function stripIndonesianAffixes(word) {
  return word
    .replace(/^(?:meng|meny|men|mem|me|ber|ter|per|pe|di)/, '')
    .replace(/(?:kan|an|i)$/, '');
}

/**
 * Menghitung skor kemiripan antara dua string yang sudah dinormalkan.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function computePairSimilarity(a, b) {
  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  const minLen = Math.min(a.length, b.length);
  const maxLen = Math.max(a.length, b.length);
  if (minLen >= 3 && maxLen - minLen === 1 && (a.startsWith(b) || b.startsWith(a))) {
    return minLen / maxLen;
  }

  const lcs = longestCommonSubsequenceLength(a, b);
  if (lcs < MIN_LCS_LENGTH) {
    return 0;
  }

  return lcs / maxLen;
}

/**
 * Menghitung rasio kemiripan urutan huruf antara `vocab` dan `meaning`.
 * @param {string} vocab
 * @param {string} meaning
 * @returns {number}
 */
export function computeLoanwordSimilarity(vocab, meaning) {
  const normVocab = normalizeLoanwordSpelling(vocab);
  const normMeaning = normalizeLoanwordSpelling(meaning);
  const baseScore = computePairSimilarity(normVocab, normMeaning);

  if (meaning.trim().includes(' ')) {
    return baseScore;
  }

  const strippedMeaning = normalizeLoanwordSpelling(
    stripIndonesianAffixes(meaning.toLowerCase().replace(/[^a-z]/g, ''))
  );
  if (strippedMeaning.length < 3 || strippedMeaning === normMeaning) {
    return baseScore;
  }

  return Math.max(baseScore, computePairSimilarity(normVocab, strippedMeaning));
}

/**
 * Memindai item hasil translate untuk mendeteksi kata serapan.
 * @param {Array<{ vocab: string, meaning: string }>} items
 */
export function detectLoanwords(items) {
  const loanwords = [];
  const nonLoanwords = [];

  for (const item of items) {
    const similarity = computeLoanwordSimilarity(item.vocab, item.meaning);
    if (similarity >= SIMILARITY_THRESHOLD) {
      loanwords.push({ ...item, similarity: Number(similarity.toFixed(2)) });
    } else {
      nonLoanwords.push(item);
    }
  }

  return { loanwords, nonLoanwords };
}

/**
 * Menjalankan tahap 7: memindai kata serapan di `data/06-translated.json`,
 * menampilkan daftarnya, meminta konfirmasi hapus (`y/n`), lalu menyimpan
 * hasil ke `data/07-final.json` agar bisa dilanjutkan oleh tahap 08 (`save`).
 */
export async function runFilterLoanwordsStep() {
  await mkdir(DATA_DIR, { recursive: true });
  const raw = await readFile(INPUT_JSON_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : [];

  const { loanwords, nonLoanwords } = detectLoanwords(items);

  console.log(`\n[07-filter-loanwords] Terdeteksi ${loanwords.length} kata serapan:`);
  if (loanwords.length === 0) {
    console.log('  (tidak ada)');
  } else {
    for (const item of loanwords) {
      console.log(`  - ${item.vocab} -> ${item.meaning} (${Math.round(item.similarity * 100)}%)`);
    }
  }

  let shouldDelete = false;
  if (loanwords.length > 0) {
    if (process.argv.includes('-y') || process.argv.includes('--yes')) {
      shouldDelete = true;
    } else if (process.argv.includes('-n') || process.argv.includes('--no')) {
      shouldDelete = false;
    } else {
      const rl = readline.createInterface({ input, output });
      try {
        const answer = await rl.question('\nApakah semua kata serapan di atas ingin dihapus? (y/n): ');
        shouldDelete = ['y', 'yes'].includes(answer.trim().toLowerCase());
      } finally {
        rl.close();
      }
    }
  }

  const finalItems = shouldDelete ? nonLoanwords : items;
  await writeFile(OUTPUT_JSON_PATH, `${JSON.stringify(finalItems, null, 2)}\n`, 'utf8');

  console.log(
    shouldDelete
      ? `[07-filter-loanwords] Dihapus ${loanwords.length} kata serapan. Tersisa ${finalItems.length} kata -> ${OUTPUT_JSON_PATH}`
      : `[07-filter-loanwords] Tidak dihapus. Tersimpan ${finalItems.length} kata -> ${OUTPUT_JSON_PATH}`
  );
  return finalItems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFilterLoanwordsStep().catch((error) => {
    console.error(`[07-filter-loanwords] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}

