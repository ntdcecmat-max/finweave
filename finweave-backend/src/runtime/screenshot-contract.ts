// Additive local extension; historical API005 remains pinned.
export const screenshotRevision='FW-SCREENSHOT-001';
export const screenshotOperations=['scanScreenshot','saveScreenshot'];
export function extendScreenshotContract(c:any) {
 const s=c.components.schemas,ref=(n:string)=>({'$ref':'#/components/schemas/'+n}),obj=(p:any)=>({type:'object',properties:p,required:Object.keys(p),additionalProperties:false});
 const str=(max=500)=>({type:'string',maxLength:max}),id={type:'string',pattern:'^[A-Za-z0-9_-]{1,80}$'};
 const row=obj({index:{type:'integer',minimum:0,maximum:19},amount:str(18),kind:{enum:['income','expense','unknown']},date:str(10),time:str(8),description:str(),reference:str(80),bankAccount:str(24),bank:str(32),warnings:{type:'array',items:str(),maxItems:20}});
 s.ScreenshotRow=row;
 s.scanScreenshotInput=obj({accountId:id,mimeType:{enum:['image/png','image/jpeg']},imageBase64:{type:'string',minLength:40,maxLength:218456}});
 s.scanScreenshotOutput=obj({id,accountId:id,engine:str(32),language:str(32),imageDigest:str(64),rawText:str(30000),expiresAt:{type:'string',format:'date-time'},rows:{type:'array',items:ref('ScreenshotRow'),minItems:1,maxItems:20}});
 const fields=structuredClone(row.properties);delete fields.warnings;fields.kind={enum:['income','expense']};fields.category={type:'string',minLength:1,maxLength:80};
 fields.time={type:'string',pattern:'^(?:|(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?)$'};
 s.saveScreenshotInput=obj({scanId:id,mode:{enum:['auto','reviewed']},rows:{type:'array',items:obj(fields),minItems:1,maxItems:20}});
 s.saveScreenshotInput.properties.confirmSimilar={type:'boolean'};
 s.saveScreenshotOutput=obj({scanId:id,saved:{type:'array',items:obj({index:{type:'integer'},eventId:id})},duplicates:{type:'array',items:obj({index:{type:'integer'},eventId:id})}});
 s.Error.properties.code.enum.push('SCREENSHOT_INVALID','OCR_UNAVAILABLE','SCREENSHOT_REVIEW_REQUIRED','SCREENSHOT_ACCOUNT_MISMATCH','SCREENSHOT_POSSIBLE_DUPLICATE');
 for(const op of screenshotOperations){const mutation=op==='saveScreenshot';s[op+'Request']=structuredClone(s[mutation?'archiveGoalRequest':'getGoalProgressRequest']);s[op+'Request'].properties.operationId={const:op};s[op+'Request'].properties.input=ref(op+'Input');s[op+'Reply']=structuredClone(s.getGoalProgressReply);s[op+'Reply'].properties.data=ref(op+'Output');const post=structuredClone(c.paths['/v2/operations/'+(mutation?'archiveGoal':'getGoalProgress')].post);post.operationId=op;post.summary=op;post.requestBody.content['application/json'].schema=ref(op+'Request');post.responses['200'].content['application/json'].schema=ref(op+'Reply');post['x-finweave']={actor:'owner',kind:mutation?'mutation':'query',availability:'LOCAL_WINDOWS_OCR',contractRevision:screenshotRevision};c.paths['/v2/screenshots/'+op]={post};}
 return c;
}
