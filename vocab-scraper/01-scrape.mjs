import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const TARGET_HTML_PATH = path.join(__dirname, 'target.html');
const RAW_OUTPUT_PATH = path.join(DATA_DIR, '01-raw.txt');

const ARTICLE_START_PATTERN = /<div\b[^>]*\bid=["']article["'][^>]*>/i;

/**
 * Mengubah entitas HTML umum menjadi karakter teks biasa.
 * @param {string} text
 * @returns {string}
 */
function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

/**
 * Mengambil isi elemen `<div id="article">...</div>` secara akurat dengan menghitung
 * kedalaman tag `<div>` agar elemen bersarang di dalamnya tidak memotong hasil lebih awal.
 * @param {string} html
 * @returns {string}
 */
export function extractArticleBlock(html) {
  const startMatch = ARTICLE_START_PATTERN.exec(html);
  if (!startMatch) {
    return html;
  }

  const contentStart = startMatch.index + startMatch[0].length;
  const divTagPattern = /<\/?div\b[^>]*>/gi;
  divTagPattern.lastIndex = contentStart;

  let depth = 1;
  let match;
  while ((match = divTagPattern.exec(html)) !== null) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) {
        return html.slice(contentStart, match.index);
      }
    } else {
      depth += 1;
    }
  }

  return html.slice(contentStart);
}

/**
 * Memfokuskan ekstraksi pada `<div id="article">`, membuang iklan, script, style,
 * dan iframe, lalu mengambil seluruh innerText-nya.
 * @param {string} html
 * @returns {string}
 */
export function extractTextFromHtml(html) {
  const articleHtml = extractArticleBlock(html);

  const cleanedHtml = articleHtml
    .replace(/<!--fnw-reader-ad-start-->[\s\S]*?<!--fnw-reader-ad-end-->/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  return decodeHtmlEntities(cleanedHtml.replace(/<[^>]+>/g, ' '));
}

/**
 * Menormalkan teks mentah agar hanya dipisahkan oleh 1 spasi tanpa baris baru (enter).
 * @param {string} text
 * @returns {string}
 */
export function normalizeSingleSpace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Menjalankan tahap 1: membaca file lokal `target.html`, mengekstrak `#article`,
 * lalu menormalkan teks ke `data/01-raw.txt`.
 * @returns {Promise<string>}
 */
export async function runScrapeStep() {
  await mkdir(DATA_DIR, { recursive: true });

  let html = '';
  try {
    html = await readFile(TARGET_HTML_PATH, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(
        `File target.html belum ada di ${TARGET_HTML_PATH}. Simpan HTML chapter ke file tersebut terlebih dahulu.`
      );
    }
    throw error;
  }

  const normalizedText = normalizeSingleSpace(extractTextFromHtml(html));
  await writeFile(RAW_OUTPUT_PATH, normalizedText, 'utf8');

  console.log(`[01-scrape] Selesai. Panjang teks raw: ${normalizedText.length} karakter -> ${RAW_OUTPUT_PATH}`);
  return RAW_OUTPUT_PATH;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runScrapeStep().catch((error) => {
    console.error(`[01-scrape] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}
