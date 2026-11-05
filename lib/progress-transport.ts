import {gzipSync,gunzipSync} from 'node:zlib';
export const maxTransferBytes=3000000;
export const maxDecodedBytes=50*1024*1024;
export class TransferError extends Error {constructor(message:string,public status:number){super(message)}}
export async function readProgressBody(req:Request):Promise<unknown>{
 const reader=req.body?.getReader();if(!reader)throw new TransferError('Thiếu dữ liệu.',400);
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>maxTransferBytes){await reader.cancel();throw new TransferError('Dữ liệu truyền vượt giới hạn. Hãy xuất bản sao tiến độ.',413);}chunks.push(part.value);}
 let raw=Buffer.concat(chunks);
 const encoding=req.headers.get('content-encoding');
 if(encoding&&encoding!=='gzip'&&encoding!=='identity')throw new TransferError('Định dạng truyền không hỗ trợ.',415);
 if(encoding==='gzip')try{raw=gunzipSync(raw,{maxOutputLength:maxDecodedBytes});}catch{throw new TransferError('Dữ liệu nén không hợp lệ hoặc quá lớn.',400);}
 try{return JSON.parse(raw.toString('utf8'));}catch{throw new TransferError('Dữ liệu không hợp lệ.',400);}
}
export function progressResponse(data:unknown,status=200,acceptGzip=false){
 const text=JSON.stringify(data);const headers:Record<string,string>={'Cache-Control':'private, no-store','Content-Type':'application/json','Vary':'Accept-Encoding'};
 if(acceptGzip&&Buffer.byteLength(text)>128000){headers['Content-Encoding']='gzip';return new Response(new Uint8Array(gzipSync(text)),{status,headers});}
 return new Response(text,{status,headers});
}
