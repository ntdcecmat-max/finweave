import {defineConfig} from '@playwright/test';
import base from './playwright.step5.config';
export default defineConfig({...base,reporter:[['list'],['json',{outputFile:'../docs/execution/evidence/step5-addon-browser-results.json'}]],outputDir:'../docs/execution/evidence/step5-addon-artifacts'});
