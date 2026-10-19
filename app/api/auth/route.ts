import {NextResponse} from 'next/server';
import {getStudyUser} from '../../../lib/auth';
import {authConfigured,passwordMatches,SESSION_COOKIE,signSession,sessionMaxAge,sameOrigin} from '../../../lib/auth-core';
export const runtime='nodejs';
const attempts=new Map<string,{count:number,since:number}>();
export async function GET(){return NextResponse.json({configured:authConfigured(),authenticated:!!await getStudyUser()},{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});
 if(!authConfigured())return NextResponse.json({error:'Chưa cấu hình mật khẩu máy chủ. Nhập file VERCEL_ENV_IMPORT.env ở phần Environment Variables rồi Redeploy.'},{status:503});
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]||'local';const now=Date.now(),prev=attempts.get(ip);
 if(prev&&now-prev.since<15*60000&&prev.count>=10)return NextResponse.json({error:'Bạn đã thử quá nhiều lần. Hãy chờ 15 phút rồi thử lại.'},{status:429});
 const raw=await req.text();if(raw.length>2000)return NextResponse.json({error:'Mật khẩu không hợp lệ.'},{status:400});
 let password;try{password=JSON.parse(raw).password}catch{return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:400})}
 if(typeof password!=='string'||!passwordMatches(password)){attempts.set(ip,!prev||now-prev.since>=15*60000?{since:now,count:1}:{...prev,count:prev.count+1});return NextResponse.json({error:'Mật khẩu chưa đúng.'},{status:401});}
 attempts.delete(ip);const response=NextResponse.json({ok:true});response.cookies.set(SESSION_COOKIE,signSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:sessionMaxAge});return response;
}
export async function DELETE(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Yêu cầu không hợp lệ.'},{status:403});const response=NextResponse.json({ok:true});response.cookies.set(SESSION_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});return response;}
