import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signSession,verifySession,sameOrigin} from '../lib/auth-core';
const secret='test-secret-long-enough-for-a-signature-123';const time=Date.parse('2026-10-19T12:00:00Z');
test('sessions work across independent clients and expire',()=>{const token=signSession(secret,time);assert(verifySession(token,secret,time+1000));assert.equal(verifySession(token,secret,time+31*86400000),false)});
test('forged cookies and a different signing secret are rejected',()=>{const token=signSession(secret,time);assert.equal(verifySession(token+'x',secret,time),false);assert.equal(verifySession(token,'another-secret-that-is-over-32-characters',time),false);assert.equal(verifySession('junk',secret,time),false)});
test('cross-origin writes are not accepted',()=>{assert(sameOrigin(new Request('https://kotoba.example/api/auth',{headers:{Origin:'https://kotoba.example'}})));assert.equal(sameOrigin(new Request('https://kotoba.example/api/auth',{headers:{Origin:'https://evil.example'}})),false)});
test('same-origin works behind Next.js and an HTTPS forwarding proxy',()=>{assert(sameOrigin(new Request('http://localhost:5190/api/auth',{headers:{host:'127.0.0.1:5190',origin:'http://127.0.0.1:5190'}})));assert(sameOrigin(new Request('http://internal/api/auth',{headers:{host:'kotoba.vercel.app','x-forwarded-proto':'https',origin:'https://kotoba.vercel.app'}})));assert.equal(sameOrigin(new Request('http://internal/api/auth',{headers:{host:'kotoba.vercel.app','x-forwarded-proto':'https',origin:'https://evil.example'}})),false)});
