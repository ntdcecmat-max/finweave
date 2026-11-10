import {defineConfig} from '@playwright/test';
const evidence=process.env.FW_BE19_EVIDENCE_DIR??'../docs/execution/evidence/be19';
export default defineConfig({testDir:'./tests',testMatch:'be19.integration.test.ts',workers:1,fullyParallel:false,timeout:90000,reporter:[['list'],['json',{outputFile:evidence+'/integration-results.json'}]],use:{baseURL:'http://127.0.0.1:5173',channel:'msedge',trace:'retain-on-failure',screenshot:'only-on-failure'},outputDir:evidence+'/browser-artifacts'});
