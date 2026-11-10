export class ApiError extends Error {
  code:string; status:number; outcome:'not_committed'|'committed'|'unknown'; resultRef:string|null;
  itemErrors?:{eventKey:string;revision:number;errorCode:string}[];
  constructor(code: string, status = 400, outcome: 'not_committed'|'committed'|'unknown' = 'not_committed', resultRef: string|null = null) { super(code); this.code=code;this.status=status;this.outcome=outcome;this.resultRef=resultRef; }
}
export function fail(code: string, status = 400): never { throw new ApiError(code, status); }
