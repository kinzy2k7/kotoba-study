import {test} from 'node:test';
import assert from 'node:assert/strict';
import {empty,type Word} from '../app/study/core';
import {checkTyped,quickReview,validSession,isSessionComplete,dueLabel,type LearningSession} from '../app/study/learning';
import {addReview,mergeStates} from '../app/study/sync';
const now=Date.now();
const word=(id:string):Word=>({id,jp:'食べます',kana:'たべます',meaning:'Ăn',lesson:1});
const session:LearningSession={version:1,id:'session-a',dataKey:'vocab-3',cardKind:'jp-vi',mode:'quiz',items:['a','b'],at:0,flipped:false,input:'たべます',feedback:true,picked:'Ăn',answers:[{item:'a',ok:true,rating:2}],matchDone:[],matchLeft:null,matchBad:null,startedAt:now,elapsedMs:0,deadline:null,finished:false};
test('restore preserves an answered card and does not finish the session early',()=>{
 const restored=JSON.parse(JSON.stringify(session));assert(validSession(restored));assert.equal(restored.feedback,true);assert.equal(restored.picked,'Ăn');assert.equal(isSessionComplete(restored),false);assert(isSessionComplete({...restored,at:2}));
});
test('reject broken snapshots instead of showing an undefined card',()=>{
 for(const broken of [null,{}, {...session,items:['a','a']},{...session,at:3},{...session,answers:[null]},{...session,matchDone:['missing']},{...session,mode:'unknown'}])assert.equal(validSession(broken),false);
});
test('matching sessions finish only once every pair is matched or the timer ends',()=>{
 const s={...session,mode:'match' as const,matchDone:['a']};assert.equal(isSessionComplete(s),false);assert(isSessionComplete({...s,matchDone:['a','b']}));assert(isSessionComplete({...s,finished:true}));
});
test('quick practice prioritizes due words, then mistakes, then new words',()=>{
 const state={...empty,reviews:{due:{due:now-1,seen:1,wrong:0,interval:1},wrong:{due:now+86400000,seen:2,wrong:1,interval:1},known:{due:now+86400000,seen:1,wrong:0,interval:1}}};
 assert.deepEqual(quickReview(['known','new','wrong','due'].map(word),state,now).map(w=>w.id),['due','wrong','new','known']);
 assert.equal(quickReview(Array.from({length:50},(_,i)=>word('x'+i)),empty,now).length,20);
});
test('typing accepts kana, kanji and full-width equivalents, rejects blank and wrong words',()=>{
 const w=word('a');assert(checkTyped(w,'たべます'));assert(checkTyped(w,'食べます'));assert(checkTyped(w,'タベマス'));assert(!checkTyped(w,''));assert(!checkTyped(w,'のみます'));
 assert(checkTyped({...w,jp:'［お］水',kana:'［お］みず'},'みず'));
});
test('resuming the same saved answer cannot count it twice across sync',()=>{
 const event={id:'session-a:0',item:'a',at:now,ok:true,rating:2};
 const cloud=addReview(empty,event);const restored=addReview(cloud,event);assert.equal(mergeStates(cloud,restored).reviews.a.seen,1);
});
test('review summaries show the real upcoming interval',()=>{
 assert.equal(dueLabel(now-1,now),'Đến hạn');assert.equal(dueLabel(now+600000,now),'10 phút nữa');assert.equal(dueLabel(now+86400000,now),'1 ngày nữa');
});
