import {getStudyUser} from '../../../lib/auth';
import {databaseConfigured,getProgressStore} from '../../../lib/db';
import {sameOrigin} from '../../../lib/auth-core';
import {readProgressBody,progressResponse,TransferError} from '../../../lib/progress-transport';
import {validState,isRecord} from '../../study/core';
import {validateSync,mergeStates} from '../../study/sync';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function missing(){return Response.json({code:'DATABASE_NOT_CONFIGURED',error:'Chưa kết nối cơ sở dữ liệu. Kết nối Neon trong Storage của Vercel rồi Redeploy.'},{status:503})}
export async function GET(req:Request){
 if(!await getStudyUser())return Response.json({error:'Cần đăng nhập.'},{status:401});
 if(!databaseConfigured())return missing();
 try{return progressResponse(await getProgressStore().read(),200,/\bgzip\b/.test(req.headers.get('accept-encoding')||''))}catch{return Response.json({error:'Chưa đọc được tiến độ từ cơ sở dữ liệu. Các thay đổi trên máy vẫn được giữ.'},{status:503})}
}
export async function PUT(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 if(!await getStudyUser())return Response.json({error:'Cần đăng nhập.'},{status:401});
 if(!databaseConfigured())return missing();
 let body;try{body=await readProgressBody(req)}catch(e){return Response.json({error:e instanceof Error?e.message:'Dữ liệu không hợp lệ.'},{status:e instanceof TransferError?e.status:400})}
 if(!isRecord(body))return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400});
 if(!validState(body.state)||!validateSync(body.state)||!Number.isSafeInteger(body.revision)||Number(body.revision)<0)return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400});
 try{const store=getProgressStore();const canonical=mergeStates(body.state,body.state);const revision=await store.write(canonical,Number(body.revision));if(revision===null)return progressResponse({...await store.read(),error:'Có thay đổi ở thiết bị khác; ứng dụng sẽ tự gộp.'},409,/\bgzip\b/.test(req.headers.get('accept-encoding')||''));return Response.json({revision});}catch{return Response.json({error:'Chưa lưu được tiến độ. Ứng dụng sẽ tự thử lại.'},{status:503})}
}
