import {defineConfig,mergeConfig} from 'vitest/config';
import base from './vite.config';
export default mergeConfig(base,defineConfig({server:{port:15173,proxy:{'/v2':{target:'http://127.0.0.1:14310',changeOrigin:true,configure:proxy=>proxy.on('proxyReq',(outgoing,request)=>{if(request.headers.origin==='http://127.0.0.1:15173')outgoing.setHeader('Origin','http://127.0.0.1:14310');})}}}}));
