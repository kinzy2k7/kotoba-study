import 'server-only';
import {cookies} from 'next/headers';
import {SESSION_COOKIE,verifySession} from './auth-core';
export async function getStudyUser(){const jar=await cookies();return verifySession(jar.get(SESSION_COOKIE)?.value)?{userId:'owner'}:null;}
