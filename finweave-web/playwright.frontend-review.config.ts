import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';

const run = process.env.FINWEAVE_REVIEW_RUN || 'diagnostic-1';
if (!/^[a-z0-9-]+$/.test(run)) throw Error('Invalid evidence run name');
const evidence = resolve('../docs/execution/evidence/frontend-review-2026-10-08', run);
if (existsSync(resolve(evidence,'browser-results.json'))) throw Error('Evidence run already exists; choose a new FINWEAVE_REVIEW_RUN');
process.env.FINWEAVE_EVIDENCE_PREFIX = 'frontend-review-2026-10-08/' + run;
process.env.FINWEAVE_ADMIN_URL = 'http://127.0.0.1:4185';
process.env.FINWEAVE_VITE_CACHE = 'node_modules/.vite-review-' + run;
export default defineConfig({
  testDir:'./tests',testMatch:'**/*.browser.test.ts',workers:1,fullyParallel:false,
  timeout:60000,expect:{timeout:10000},retries:0,
  reporter:[['list'],['json',{outputFile:resolve(evidence,'browser-results.json')}],['html',{outputFolder:resolve(evidence,'browser-report'),open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4184',channel:'chrome',viewport:{width:1440,height:900},trace:'retain-on-failure',screenshot:'only-on-failure',actionTimeout:10000},
  outputDir:resolve(evidence,'test-artifacts'),
  webServer:[
    {command:`"${process.execPath}" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4184 --strictPort`,url:'http://127.0.0.1:4184',reuseExistingServer:false,timeout:60000},
    {command:`"${process.execPath}" node_modules/vite/bin/vite.js --config vite.admin.config.ts --port 4185`,url:'http://127.0.0.1:4185',reuseExistingServer:false,timeout:60000},
  ],
});
