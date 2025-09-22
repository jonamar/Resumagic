#!/usr/bin/env node
/*
  Compile-only orchestrator for keyword analysis.
  Usage: node dist/services/keyword-orchestrator.js <appName>
*/
import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const exec = promisify(execCb);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runKeywordAnalysis(appName: string): Promise<void> {
  if (!appName || appName.trim() === '') {
    throw new Error('Missing application name. Usage: npm run keywords:run -- <appName>');
  }

  const projectRoot = path.resolve(__dirname, '..', '..');
  const dataAppPath = path.join(projectRoot, '..', 'data', 'applications', appName);

  const jobPosting = path.join(dataAppPath, 'inputs', 'job-posting.md');
  const keywordsJson = path.join(dataAppPath, 'inputs', 'keywords.json');

  const extractorJs = path.join(projectRoot, 'dist', 'services', 'keyword-extraction.js');
  const analyzerPy = path.join(projectRoot, 'services', 'keyword-analysis', 'kw_rank_modular.py');

  console.info(`Keywords orchestrator: ${appName}`);
  console.info('Paths:');
  console.info(`  jobPosting:     ${jobPosting}`);
  console.info(`  keywordsJson:   ${keywordsJson}`);
  console.info(`  extractorJs:    ${extractorJs}`);
  console.info(`  analyzerPy:     ${analyzerPy}`);

  console.info('Step 1/2: extracting keywords...');
  await exec(`node ${extractorJs} ${jobPosting} ${keywordsJson}`);

  console.info('Step 2/2: analyzing keywords...');
  // kw_rank_modular.py expects: keywords_file job_file (in that order)
  await exec(`python3 ${analyzerPy} ${keywordsJson} ${jobPosting}`);

  console.info('✅ Keyword analysis completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const appNameArg = process.argv[2];
  runKeywordAnalysis(String(appNameArg || '')).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Keyword analysis failed:', message);
    process.exit(1);
  });
}

export default runKeywordAnalysis;


