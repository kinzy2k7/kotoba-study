import {getStudyUser} from '../../../lib/auth';
import {databaseConfigured,getProgressStore} from '../../../lib/db';
import {sameOrigin} from '../../../lib/auth-core';
import {validState} from '../../study/core';
import {validateSync,mergeStates} from '../../study/sync';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function missing(){return Response.json({code:'DATABASE_NOT_CONFIGURED',error:'Chưa kết nối cơ sở dữ liệu. Kết nối Neon trong Storage của Vercel rồi Redeploy.'},{status:503})}
export async function GET(){
 if(!await getStudyUser())return Response.json({error:'Cần đăng nhập.'},{status:401});
 if(!databaseConfigured())return missing();
 try{return Response.json(await getProgressStore().read(),{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({error:'Chưa đọc được tiến độ từ cơ sở dữ liệu. Các thay đổi trên máy vẫn được giữ.'},{status:503})}
}
export async function PUT(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 if(!await getStudyUser())return Response.json({error:'Cần đăng nhập.'},{status:401});
 if(!databaseConfigured())return missing();
 const raw=await req.text();if(raw.length>3000000)return Response.json({error:'Dữ liệu vượt giới hạn. Hãy xuất bản sao tiến độ.'},{status:413});
 let body;try{body=JSON.parse(raw)}catch{return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400})}
 if(!validState(body.state)||!validateSync(body.state)||!Number.isInteger(body.revision)||body.revision<0)return Response.json({error:'Dữ liệu không hợp lệ.'},{status:400});
 try{const store=getProgressStore();const canonical=mergeStates(body.state,body.state);const revision=await store.write(canonical,body.revision);if(revision===null)return Response.json({...await store.read(),error:'Có thay đổi ở thiết bị khác; ứng dụng sẽ tự gộp.'},{status:409});return Response.json({revision});}catch{return Response.json({error:'Chưa lưu được tiến độ. Ứng dụng sẽ tự thử lại.'},{status:503})}
}
