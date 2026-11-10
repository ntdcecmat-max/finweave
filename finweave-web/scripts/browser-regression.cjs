const {spawnSync}=require('node:child_process');
const path=require('node:path');
for(const scope of ['mockbuild','mockbrowser']){
 const result=spawnSync(process.execPath,[path.join(__dirname,'be19-check.cjs'),scope],{cwd:path.resolve(__dirname,'..'),stdio:'inherit',windowsHide:true});
 if(result.status!==0)process.exit(result.status??1);
}
