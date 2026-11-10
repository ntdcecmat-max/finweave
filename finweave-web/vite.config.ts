import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({build:{target:'chrome120'},cacheDir:process.env.FINWEAVE_VITE_CACHE||'node_modules/.vite',plugins:[react()], server:{port:5173,strictPort:true,watch:{ignored:['**/android/**','**/dist*/**','**/.local/**']},proxy:{'/v2':{target:'http://127.0.0.1:4310',changeOrigin:true,configure:proxy=>proxy.on('proxyReq',(outgoing,request)=>{if(request.headers.origin==='http://127.0.0.1:5173')outgoing.setHeader('Origin','http://127.0.0.1:4310');})}}}, test:{include:['tests/**/*.unit.test.ts']}});

