export class ApiError extends Error {
 constructor(message:string,public code:string,public status=0,public retryable=false,public fieldErrors:any[]=[],public retryAfterSeconds:number|null=null,public outcome:string|null=null,public resultRef:string|null=null){super(message);}
}
