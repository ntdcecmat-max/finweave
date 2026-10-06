import {defineConfig} from '@playwright/test';
import base from './playwright.step5.config';
export default defineConfig({...base,reporter:[['list'],['json',{outputFile:'../docs/execution/evidence/step5-context-browser-results.json'}]],outputDir:'../docs/execution/evidence/step5-context-artifacts'});
