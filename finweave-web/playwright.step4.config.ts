import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,testMatch:'**/*.browser.test.ts',reporter:[['list'],['json',{outputFile:'../docs/execution/evidence/step4-browser-results.json'}],['html',{outputFolder:'../docs/execution/evidence/step4-browser-report',open:'never'}]],outputDir:'../docs/execution/evidence/step4-test-artifacts',use:{...base.use,baseURL:'http://127.0.0.1:4181'}});
