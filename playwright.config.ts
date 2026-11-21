import {defineConfig} from '@playwright/test';
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '/enriques-writing-adventure';
export default defineConfig({testDir:'./tests/e2e',use:{baseURL:`http://127.0.0.1:4173${base}/`,browserName:'chromium',viewport:{width:768,height:1024}},webServer:{command:`NEXT_PUBLIC_BASE_PATH=${base} npm run build && NEXT_PUBLIC_BASE_PATH=${base} node scripts/serve-export.mjs`,url:`http://127.0.0.1:4173${base}/`,reuseExistingServer:false,timeout:120000}});
