import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const INPUT_PATH = path.join(DATA_DIR, '03-filtered-length.txt');
const OUTPUT_PATH = path.join(DATA_DIR, '04-normalized.txt');

/**
 * Memuat map irregular verbs dari `irregular-verbs.mjs`.
 * Jika file tidak ada atau gagal dibaca, mengembalikan objek kosong.
 * @returns {Promise<Record<string, string>>}
 */
export async function loadIrregularPastMap() {
  try {
    const mod = await import('./irregular-verbs.mjs');
    const map = mod.IRREGULAR_PAST_MAP;
    return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  } catch {
    console.log('[04-normalize-forms] irregular-verbs.mjs tidak ditemukan, lanjut dengan map kosong.');
    return {};
  }
}

/**
 * Menentukan apakah `stem` (setelah buang `-ed`/`-ing`) perlu dikembalikan akhiran `-e`
 * berdasarkan pola fonologis/ejaan bahasa Inggris (Magic-E, akhiran `c/v/dg/at/it/ut`, dll.).
 * @param {string} stem
 * @param {Set<string>} wordSet
 * @returns {boolean}
 */
function shouldRestoreSilentE(stem, wordSet) {
  if (wordSet.has(`${stem}e`)) {
    return true;
  }
  if (wordSet.has(stem)) {
    return false;
  }

  if (/(?:c|v|dg|z)$/.test(stem)) {
    return true;
  }

  if (/[^aeiou](?:at|it|ut)$/.test(stem) && stem.length >= 4) {
    return true;
  }

  if (/[^aeiou][aeiou][^aeiouwxyrnl]$/.test(stem)) {
    return true;
  }

  if (/[^aeiou][aeiou][r]$/.test(stem) && !/(?:er|or)$/.test(stem)) {
    return true;
  }

  return false;
}

/**
 * Normalisasi `-ed` berbasis pola ejaan bahasa Inggris.
 * @param {string} word
 * @param {Set<string>} wordSet
 * @returns {string | null}
 */
function normalizePastEdPattern(word, wordSet) {
  if (!word.endsWith('ed') || word.length <= 4) {
    return null;
  }

  if (word.endsWith('ied')) {
    return `${word.slice(0, -3)}y`;
  }

  const stem = word.slice(0, -2);
  if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2] && !/[aeioulsz]$/.test(stem.slice(0, -1))) {
    return stem.slice(0, -1);
  }

  return shouldRestoreSilentE(stem, wordSet) ? `${stem}e` : stem;
}

/**
 * Normalisasi `-ing` berbasis pola ejaan bahasa Inggris.
 * @param {string} word
 * @param {Set<string>} wordSet
 * @returns {string | null}
 */
function normalizeVerbIngPattern(word, wordSet) {
  if (!word.endsWith('ing') || word.length <= 5) {
    return null;
  }

  if (word === 'being') {
    return 'be';
  }

  if (word.endsWith('ying') && word.length > 5) {
    return `${word.slice(0, -4)}ie`;
  }

  const stem = word.slice(0, -3);
  if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2] && !/[lsz]$/.test(stem.slice(0, -1))) {
    return stem.slice(0, -1);
  }

  return shouldRestoreSilentE(stem, wordSet) ? `${stem}e` : stem;
}

/**
 * Normalisasi `-ly` berbasis pola ejaan bahasa Inggris.
 * @param {string} word
 * @returns {string | null}
 */
function normalizeAdverbLyPattern(word) {
  if (!word.endsWith('ly') || word.length <= 4) {
    return null;
  }

  if (word.endsWith('ically') && word.length > 7) {
    return word.slice(0, -4);
  }

  if (word.endsWith('ily') && word.length > 5) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith('bly') && word.length > 5) {
    return `${word.slice(0, -1)}e`;
  }

  return word.slice(0, -2);
}

/**
 * Normalisasi jamak berbasis pola ejaan bahasa Inggris.
 * @param {string} word
 * @returns {string | null}
 */
function normalizePluralPattern(word) {
  if (
    word.length <= 3 ||
    !word.endsWith('s') ||
    /(?:ss|us|is|ous|ics)$/.test(word)
  ) {
    return null;
  }

  if (word.endsWith('ies') && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }

  if (/(?:ches|shes|xes|zes|sses)$/.test(word) && word.length > 4) {
    return word.slice(0, -2);
  }

  return word.slice(0, -1);
}

/**
 * Memindai daftar kata dan mengelompokkan kandidat jamak, verb-ing, verb lampau, dan adverb -ly.
 * @param {string[]} words
 * @param {Record<string, string>} [irregularPastMap]
 */
export function scanWordForms(words, irregularPastMap = {}) {
  const wordSet = new Set(words);
  const detected = {
    plural: [],
    verbIng: [],
    pastVerb: [],
    adverbLy: [],
  };

  for (const word of words) {
    if (irregularPastMap[word]) {
      detected.pastVerb.push({ original: word, base: irregularPastMap[word] });
      continue;
    }

    const pastBase = normalizePastEdPattern(word, wordSet);
    if (pastBase) {
      detected.pastVerb.push({ original: word, base: pastBase });
      continue;
    }

    const ingBase = normalizeVerbIngPattern(word, wordSet);
    if (ingBase) {
      detected.verbIng.push({ original: word, base: ingBase });
      continue;
    }

    const adverbBase = normalizeAdverbLyPattern(word);
    if (adverbBase) {
      detected.adverbLy.push({ original: word, base: adverbBase });
      continue;
    }

    const pluralBase = normalizePluralPattern(word);
    if (pluralBase) {
      detected.plural.push({ original: word, base: pluralBase });
    }
  }

  return detected;
}

/**
 * Menerapkan aksi per kategori (`normalize`, `delete`, atau `skip`) ke daftar kata,
 * lalu sort dan deduplikasi ulang.
 * @param {string[]} words
 * @param {ReturnType<typeof scanWordForms>} detected
 * @param {{ plural: 'normalize' | 'delete' | 'skip', verbIng: 'normalize' | 'delete' | 'skip', pastVerb: 'normalize' | 'delete' | 'skip', adverbLy: 'normalize' | 'delete' | 'skip' }} actions
 * @returns {string[]}
 */
export function applyCategoryActions(words, detected, actions) {
  const replaceMap = new Map();
  const deleteSet = new Set();

  const categories = [
    ['plural', detected.plural],
    ['verbIng', detected.verbIng],
    ['pastVerb', detected.pastVerb],
    ['adverbLy', detected.adverbLy],
  ];

  for (const [key, items] of categories) {
    const action = actions[key] ?? 'skip';
    for (const item of items ?? []) {
      if (action === 'normalize') {
        replaceMap.set(item.original, item.base);
      } else if (action === 'delete') {
        deleteSet.add(item.original);
      }
    }
  }

  const resultSet = new Set();
  for (const word of words) {
    if (deleteSet.has(word)) {
      continue;
    }
    resultSet.add(replaceMap.get(word) ?? word);
  }

  return Array.from(resultSet).sort((a, b) => a.localeCompare(b, 'en'));
}

/**
 * Mengubah input teks user menjadi aksi kategori.
 * @param {string} answer
 * @returns {'normalize' | 'delete' | 'skip'}
 */
function parseCategoryAction(answer) {
  const value = answer.trim().toLowerCase();
  if (['n', 'normalisasi', 'normalize', '1'].includes(value)) {
    return 'normalize';
  }
  if (['h', 'hapus', 'delete', '2'].includes(value)) {
    return 'delete';
  }
  return 'skip';
}

/**
 * Menformat daftar deteksi agar rapi ditampilkan di console.
 * @param {Array<{ original: string, base: string }>} items
 * @returns {string}
 */
function formatDetectedList(items) {
  if (items.length === 0) {
    return '(tidak ada)';
  }
  return items.map((item) => `${item.original} -> ${item.base}`).join(', ');
}

/**
 * Menjalankan tahap 4: scan jamak, verb-ing, verb lampau, dan adverb -ly berbasis pola,
 * lalu minta aksi terpisah untuk setiap kategori (atau `--yes` untuk menormalkan semua).
 * @returns {Promise<string[]>}
 */
export async function runNormalizeFormsStep() {
  await mkdir(DATA_DIR, { recursive: true });
  const content = await readFile(INPUT_PATH, 'utf8');
  const words = content
    .split(/[,\r\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const irregularPastMap = await loadIrregularPastMap();
  const detected = scanWordForms(words, irregularPastMap);

  console.log('\n[04-normalize-forms] Hasil Scan:');
  console.log(`- Jamak (${detected.plural.length}): ${formatDetectedList(detected.plural)}`);
  console.log(`- Verb -ing (${detected.verbIng.length}): ${formatDetectedList(detected.verbIng)}`);
  console.log(`- Verb lampau (${detected.pastVerb.length}): ${formatDetectedList(detected.pastVerb)}`);
  console.log(`- Adverb -ly (${detected.adverbLy.length}): ${formatDetectedList(detected.adverbLy)}\n`);

  const normalizeAll = process.argv.includes('--yes');
  const actions = {
    plural: normalizeAll ? 'normalize' : 'skip',
    verbIng: normalizeAll ? 'normalize' : 'skip',
    pastVerb: normalizeAll ? 'normalize' : 'skip',
    adverbLy: normalizeAll ? 'normalize' : 'skip',
  };

  if (!normalizeAll) {
    const rl = readline.createInterface({ input, output });
    try {
      const prompts = [
        ['plural', 'Jamak', detected.plural],
        ['verbIng', 'Verb -ing', detected.verbIng],
        ['pastVerb', 'Verb lampau', detected.pastVerb],
        ['adverbLy', 'Adverb -ly', detected.adverbLy],
      ];

      for (const [key, label, items] of prompts) {
        if (items.length === 0) {
          continue;
        }
        const answer = await rl.question(
          `Aksi untuk ${label} (${items.length}) — [n]ormalisasi / [h]apus / [l]ewati (default l): `
        );
        actions[key] = parseCategoryAction(answer);
      }
    } finally {
      rl.close();
    }
  }

  const resultWords = applyCategoryActions(words, detected, actions);
  await writeFile(OUTPUT_PATH, resultWords.join(', '), 'utf8');

  console.log(
    `[04-normalize-forms] Selesai (jamak=${actions.plural}, ing=${actions.verbIng}, lampau=${actions.pastVerb}, adverbLy=${actions.adverbLy}). Tersimpan ${resultWords.length} kata -> ${OUTPUT_PATH}`
  );
  return resultWords;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runNormalizeFormsStep().catch((error) => {
    console.error(`[04-normalize-forms] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}
