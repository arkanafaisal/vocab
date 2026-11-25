import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { runScrapeStep } from './01-scrape.mjs';
import { runCleanSortDedupeStep } from './02-clean-sort-dedupe.mjs';
import { runFilterLengthStep } from './03-filter-length.mjs';
import { runNormalizeFormsStep } from './04-normalize-forms.mjs';
import { runFilterManualStep } from './05-filter-manual.mjs';
import { runTranslateStep } from './06-translate.mjs';
import { runFilterLoanwordsStep } from './07-filter-loanwords.mjs';
import { runSaveStep } from './08-save.mjs';
import { runUploadStep } from './09-upload.mjs';

/**
 * Meminta konfirmasi user sebelum melanjutkan ke tahap berikutnya.
 * @param {string} nextStepLabel
 * @returns {Promise<boolean>}
 */
async function askContinue(nextStepLabel) {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`\nLanjut ke ${nextStepLabel}? (y/n): `);
    return ['y', 'yes'].includes(answer.trim().toLowerCase());
  } finally {
    rl.close();
  }
}

/**
 * Menjalankan seluruh pipeline 01-09 secara bertahap dengan konfirmasi di setiap jeda.
 */
export async function runMasterPipeline() {
  console.log('[run-master] Memulai tahap 1-3 (scrape, clean, filter length)...');
  await runScrapeStep();
  await runCleanSortDedupeStep();
  await runFilterLengthStep();

  const stages = [
    ['tahap 4 (normalize)', runNormalizeFormsStep],
    ['tahap 5 (filter manual & dedupe data.txt)', runFilterManualStep],
    ['tahap 6 (translate)', runTranslateStep],
    ['tahap 7 (filter kata serapan)', runFilterLoanwordsStep],
    ['tahap 8 (save ke data.txt)', runSaveStep],
    ['tahap 9 (upload ke backend)', runUploadStep],
  ];

  for (const [label, stepFn] of stages) {
    const proceed = await askContinue(label);
    if (!proceed) {
      console.log(`[run-master] Berhenti sebelum ${label}.`);
      return;
    }
    await stepFn();
  }

  console.log('\n[run-master] Seluruh tahap 01-09 selesai.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMasterPipeline().catch((error) => {
    console.error(`[run-master] Gagal: ${error.message}`);
    process.exitCode = 1;
  });
}

