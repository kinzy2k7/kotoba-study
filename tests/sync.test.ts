import {test} from 'node:test';
import assert from 'node:assert/strict';
import {empty,validState} from '../app/study/core';
import {addReview,mergeStates,applyLocalEdit,validateSync} from '../app/study/sync';
const time=Date.parse('2026-10-19T12:00:00Z');
test('two devices merge independent reviews without losing either attempt',()=>{
 const pc=addReview(empty,{id:'pc-1',item:'v1-0',at:time,ok:true,rating:2});
 const phone=addReview(empty,{id:'phone-1',item:'v1-0',at:time+1000,ok:false,rating:0});
 const merged=mergeStates(pc,phone);
 assert.equal(merged.reviews['v1-0'].seen,2);assert.equal(merged.reviews['v1-0'].wrong,1);
 assert.equal(merged.history[0].total,2);assert.equal(merged.history[0].correct,1);
 assert.deepEqual(mergeStates(phone,pc),merged);
 assert.deepEqual(mergeStates(merged,phone),merged);
 assert(validState(merged)&&validateSync(merged));
});
test('retries do not count the same review more than once',()=>{
 const event={id:'retry',item:'k山',at:time,ok:true,rating:3};
 const state=addReview(addReview(empty,event),event);
 assert.equal(state.reviews['k山'].seen,1);assert.equal(state.history[0].total,1);
});
test('unbookmark tombstone and newest note propagate to another device',()=>{
 const pc=applyLocalEdit(empty,{...empty,stars:['v1-0'],notes:{'v1-0':'Ghi chú ban đầu'}},time);
 const phone=applyLocalEdit(pc,{...pc,stars:[],notes:{'v1-0':'Ghi chú mới trên điện thoại'}},time+2000);
 const result=mergeStates(pc,phone);assert.deepEqual(result.stars,[]);assert.equal(result.notes['v1-0'],'Ghi chú mới trên điện thoại');
});
test('importing the older backup preserves old history and adds new attempts once',()=>{
 const old={...empty,reviews:{x:{seen:3,wrong:1,interval:2,due:time}},history:[{date:'2026-10-19',total:3,correct:2}]};
 const current=addReview(old,{id:'new',item:'x',at:time+1,ok:true,rating:2});
 const merged=mergeStates(old,current);assert.equal(merged.reviews.x.seen,4);assert.equal(merged.history[0].total,4);
 assert.equal(mergeStates(merged,old).history[0].total,4);
});
test('reject invalid event payloads',()=>{
 const s=addReview(empty,{id:'1',item:'x',at:time,ok:true,rating:2});
 s.sync!.events['1'].rating=8;assert.equal(validateSync(s),false);
});
