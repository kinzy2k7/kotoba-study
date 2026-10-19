import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
export const SESSION_COOKIE='kotoba_session';
const ttl=30*24*60*60;
function equal(a:string,b:string){const x=createHash('sha256').update(a).digest(),y=createHash('sha256').update(b).digest();return timingSafeEqual(x,y)}
export function authConfigured(){return !!process.env.APP_PASSWORD&&!!process.env.SESSION_SECRET&&process.env.SESSION_SECRET.length>=32;}
export function passwordMatches(value:string){return authConfigured()&&equal(value,process.env.APP_PASSWORD!)}
export function signSession(secret=process.env.SESSION_SECRET!,now=Date.now()){
 if(!secret||secret.length<32)throw Error('SESSION_SECRET cần ít nhất 32 ký tự.');
 const payload=Buffer.from(JSON.stringify({sub:'owner',exp:Math.floor(now/1000)+ttl,nonce:randomBytes(16).toString('hex')})).toString('base64url');
 return payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');
}
export function verifySession(token:string|undefined,secret=process.env.SESSION_SECRET,now=Date.now()):boolean{
 if(!secret||secret.length<32||!token||token.length>2000)return false;
 try{const parts=token.split('.');if(parts.length!==2)return false;const [payload,sig]=parts;const expected=createHmac('sha256',secret).update(payload).digest('base64url');if(!equal(sig,expected))return false;const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));return data.sub==='owner'&&Number.isFinite(data.exp)&&data.exp>Math.floor(now/1000);}catch{return false}
}
export function sameOrigin(req:Request){
 const origin=req.headers.get('origin');if(!origin)return true;
 try{const actual=new URL(origin),internal=new URL(req.url);const host=req.headers.get('host')||internal.host;const forwarded=req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();const protocol=forwarded==='https'||forwarded==='http'?forwarded+':':internal.protocol;return actual.host===host&&actual.protocol===protocol;}catch{return false;}
}
export const sessionMaxAge=ttl;
