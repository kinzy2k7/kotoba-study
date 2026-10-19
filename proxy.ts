import {NextResponse,type NextRequest} from 'next/server';
import {SESSION_COOKIE,verifySession} from './lib/auth-core';
export function proxy(req:NextRequest){if(!verifySession(req.cookies.get(SESSION_COOKIE)?.value))return NextResponse.json({error:'Cần đăng nhập để mở học liệu.'},{status:401});return NextResponse.next();}
export const config={matcher:['/data/:path*']};
