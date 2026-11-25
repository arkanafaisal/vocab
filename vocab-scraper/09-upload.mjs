import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const INPUT_JSON_PATH = path.join(DATA_DIR, '07-final.json');

export const UPLOAD_CONFIG = {
  endpointUrl: process.env.VOCAB_INSERT_URL || 'http://localhost:3000/api/data/insert',
  dataAccessToken: process.env.DATA_ACCESS_TOKEN || '',
  minVocabLength: 2,
  maxVocabLength: 12,
  minMeaningLength: 3,
  maxMeaningLength: 16,
};

/**
 * Memvalidasi daftar item `{ vocab, meaning }` terhadap batas panjang schema backend.
 * Spasi di dalam `meaning` tetap diperbolehkan (hanya di-trim di awal/akhir).
 * @param {Array<{ vocab?: string, meaning?: string }>} items
 */
export function partitionBySchemaLength(items) {
  const valid = [];
  const excluded = [];

  for (const item of items) {
    const vocab = String(item?.vocab ?? '').trim();
    const meaning = String(item?.meaning ?? '').trim();
    const reasons = [];

    if (vocab.length < UPLOAD_CONFIG.minVocabLength || vocab.length > UPLOAD_CONFIG.maxVocabLength) {
      reasons.push(`vocab(${vocab.length})`);
    }
    if (meaning.length < UPLOAD_CONFIG.minMeaningLength || meaning.length > UPLOAD_CONFIG.maxMeaningLength) {
      reasons.push(`meaning(${meaning.length})`);
    }

    if (reasons.length > 0) {
      excluded.push({ vocab, meaning, reason: reasons.join(', ') });
    } else {
      valid.push({ vocab, meaning });
    }
  }

  return { valid, excluded };
}

/**
 * Menjalankan tahap 9: menyaring item yang melebihi batas panjang, menampilkan daftar
 * yang di-exclude, lalu langsung mengirim item valid ke endpoint `/api/data/insert`.
 */
export async function runUploadStep() {
  const raw = await readFile(INPUT_JSON_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : [];

  if (items.length === 0) {
    console.log('[09-upload] Tidak ada data di data/07-final.json.');
    return;
  }

  const { valid, excluded } = partitionBySchemaLength(items);

  console.log(`[09-upload] Total input: ${items.length}, valid: ${valid.length}, di-exclude: ${excluded.length}`);
  if (excluded.length > 0) {
    console.log('[09-upload] Daftar di-exclude (batas panjang):');
    for (const item of excluded) {
      console.log(`  - "${item.vocab}" -> "${item.meaning}" [${item.reason}]`);
    }
  }

  if (valid.length === 0) {
    console.log('[09-upload] Tidak ada item valid untuk dikirim.');
    return;
  }

  if (!UPLOAD_CONFIG.dataAccessToken) {
    throw new Error(
      'DATA_ACCESS_TOKEN belum diset. Isi UPLOAD_CONFIG.dataAccessToken atau env DATA_ACCESS_TOKEN sebelum upload.'
    );
  }

  const response = await fetch(UPLOAD_CONFIG.endpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data_access_token: UPLOAD_CONFIG.dataAccessToken,
      datas: valid,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `HTTP ${response.status} saat upload ke ${UPLOAD_CONFIG.endpointUrl}`);
  }

  console.log(`[09-upload] Selesai. Server response: ${result.message ?? 'OK'} (inserted: ${result.data ?? valid.length})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runUploadStep().catch((error) => {
    console.error(`[09-upload] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}

