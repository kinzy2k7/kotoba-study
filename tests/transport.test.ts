import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {randomUUID} from 'node:crypto';
import {empty,validState} from '../app/study/core';
import {upgradeState,validateSync} from '../app/study/sync';
import {readProgressBody,progressResponse,TransferError,maxTransferBytes} from '../lib/progress-transport';
test('malformed progress is rejected without throwing',()=>{
 for(const x of [null,[],{...empty,reviews:{a:null}},{...empty,history:[null]},{...empty,reviews:[]},{...empty,dark:'yes'},{...empty,history:[{date:'2026-11-01',total:1,correct:2}]}])assert.equal(validState(x),false);
 assert.equal(validateSync({...empty,sync:null as never}),false);
});
test('large review history passes compressed transport and preserves every event',async()=>{
 const state=upgradeState(structuredClone(empty));for(let i=0;i<22000;i++){const id=randomUUID();state.sync!.events[id]={id,item:'v1-0',at:Date.now()-i,ok:true,rating:2};}
 const text=JSON.stringify({state,revision:3});assert(Buffer.byteLength(text)>maxTransferBytes);
 const compressed=gzipSync(text);assert(compressed.length<maxTransferBytes);
 const req=new Request('http://localhost/api/progress',{method:'PUT',headers:{'Content-Encoding':'gzip'},body:compressed});
 assert.deepEqual(await readProgressBody(req),JSON.parse(text));
 const response=progressResponse({state},200,true);assert.equal(response.headers.get('content-encoding'),'gzip');assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(await response.arrayBuffer())).toString()),{state});
});
test('transport handles ordinary clients and rejects invalid compressed bodies',async()=>{
 const request=(body:string,encoding?:string)=>new Request('http://localhost/api/progress',{method:'PUT',headers:encoding?{'Content-Encoding':encoding}:{},body});
 assert.deepEqual(await readProgressBody(request('{"revision":0}')),{revision:0});
 await assert.rejects(readProgressBody(request('bad','gzip')),TransferError);
 await assert.rejects(readProgressBody(request('{}','br')),TransferError);
 await assert.rejects(readProgressBody(request('not json')),TransferError);
 await assert.rejects(readProgressBody(request('x'.repeat(maxTransferBytes+1))),e=>e instanceof TransferError&&e.status===413);
});
