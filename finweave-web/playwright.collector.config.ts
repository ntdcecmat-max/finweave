import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import pilot from './playwright.native-pilot.config';
export default defineConfig({
  ...pilot,
  reporter: [['list'], ['json', { outputFile: resolve('../docs/execution/evidence/android-collector-2026-10-12/browser-results.json') }]],
  outputDir: resolve('../docs/execution/evidence/android-collector-2026-10-12/browser-artifacts-final'),
});
