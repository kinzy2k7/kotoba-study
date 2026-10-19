import type {StudyState,Review,ReviewEvent,SyncMetadata} from './core';
const sorted=<T,>(o:Record<string,T>)=>Object.fromEntries(Object.entries(o).sort(([a],[b])=>a.localeCompare(b))) as Record<string,T>;
const choose=<T extends {at:number}>(a:T|undefined,b:T|undefined):T=>!a?b!:!b?a:a.at>b.at?a:b.at>a.at?b:JSON.stringify(a)>=JSON.stringify(b)?a:b;
function mergeMap<T extends {at:number}>(a:Record<string,T>,b:Record<string,T>){const out={...a};for(const [k,v]of Object.entries(b))out[k]=choose(out[k],v);return sorted(out)}
export function upgradeState(s:StudyState):StudyState{
 if(s.sync?.version===2)return s;
 const sync:SyncMetadata={version:2,events:{},stars:Object.fromEntries(s.stars.map(id=>[id,{value:true,at:0}])),notes:Object.fromEntries(Object.entries(s.notes).map(([id,value])=>[id,{value,at:0}])),settings:{goal:s.goal,dark:s.dark,at:0},baseline:{reviews:{...s.reviews},history:s.history.map(h=>({...h}))}};
 return {...s,sync};
}
function project(sync:SyncMetadata):StudyState{
 const reviews:Record<string,Review>=structuredClone(sync.baseline.reviews);
 const history=new Map(sync.baseline.history.map(h=>[h.date,{...h}]));
 for(const e of Object.values(sync.events).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))){
  const prev=reviews[e.item];
  const interval=e.rating===0?10/1440:e.rating===1?1:e.rating===3?Math.max(7,(prev?.interval||1)*2.5):Math.max(1,(prev?.interval||0)*2);
  reviews[e.item]={due:e.at+interval*86400000,interval,seen:(prev?.seen||0)+1,wrong:(prev?.wrong||0)+(e.ok?0:1)};
  const date=new Date(e.at).toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});const h=history.get(date)||{date,total:0,correct:0};history.set(date,{...h,total:h.total+1,correct:h.correct+(e.ok?1:0)});
 }
 return {reviews:sorted(reviews),stars:Object.keys(sync.stars).filter(k=>sync.stars[k].value).sort(),history:[...history.values()].sort((a,b)=>a.date.localeCompare(b.date)),notes:sorted(Object.fromEntries(Object.entries(sync.notes).map(([k,v])=>[k,v.value]))),goal:sync.settings.goal,dark:sync.settings.dark,sync:{...sync,events:sorted(sync.events),stars:sorted(sync.stars),notes:sorted(sync.notes),baseline:{reviews:sorted(sync.baseline.reviews),history:[...sync.baseline.history].sort((a,b)=>a.date.localeCompare(b.date))}}};
}
export function mergeStates(left:StudyState,right:StudyState):StudyState{
 const a=upgradeState(left).sync!,b=upgradeState(right).sync!;
 const baselineReviews={...a.baseline.reviews};for(const [id,r]of Object.entries(b.baseline.reviews)){const prev=baselineReviews[id];if(!prev||r.seen>prev.seen||(r.seen===prev.seen&&r.due>prev.due))baselineReviews[id]=r;}
 const baselineHistory=new Map(a.baseline.history.map(h=>[h.date,{...h}]));for(const h of b.baseline.history){const prev=baselineHistory.get(h.date);baselineHistory.set(h.date,{...h,total:Math.max(h.total,prev?.total||0),correct:Math.max(h.correct,prev?.correct||0)})}
 return project({version:2,events:mergeMap(a.events,b.events),stars:mergeMap(a.stars,b.stars),notes:mergeMap(a.notes,b.notes),settings:choose(a.settings,b.settings),baseline:{reviews:baselineReviews,history:[...baselineHistory.values()]}});
}
export function applyLocalEdit(prev:StudyState,next:StudyState,at=Date.now()):StudyState{
 const s=upgradeState(prev);let result=next.sync?next:mergeStates(s,upgradeState(next));const meta=structuredClone(result.sync!);
 for(const id of new Set([...prev.stars,...next.stars]))if(prev.stars.includes(id)!==next.stars.includes(id))meta.stars[id]={value:next.stars.includes(id),at};
 for(const id of new Set([...Object.keys(prev.notes),...Object.keys(next.notes)]))if(prev.notes[id]!==next.notes[id])meta.notes[id]={value:next.notes[id]||'',at};
 if(prev.goal!==next.goal||prev.dark!==next.dark)meta.settings={goal:next.goal,dark:next.dark,at};
 return project(meta);
}
export function addReview(s:StudyState,event:ReviewEvent):StudyState{const meta=structuredClone(upgradeState(s).sync!);meta.events[event.id]=event;return project(meta)}
export function validateSync(s:StudyState):boolean{
 const m=s.sync;if(!m)return true;
 if(m.version!==2||!m.events||!m.stars||!m.notes||!m.settings||!m.baseline||!m.baseline.reviews||!Array.isArray(m.baseline.history))return false;
 const validAt=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=Date.now()+86400000;
 return Object.entries(m.events).every(([id,e])=>e&&e.id===id&&id.length<120&&typeof e.item==='string'&&e.item.length<160&&validAt(e.at)&&typeof e.ok==='boolean'&&[0,1,2,3].includes(e.rating)&&e.ok===(e.rating>0))&&Object.values(m.stars).every(x=>x&&typeof x.value==='boolean'&&validAt(x.at))&&Object.values(m.notes).every(x=>x&&typeof x.value==='string'&&x.value.length<=10000&&validAt(x.at))&&validAt(m.settings.at)&&typeof m.settings.dark==='boolean'&&Number.isFinite(m.settings.goal)&&m.settings.goal>0&&m.settings.goal<=500&&Object.values(m.baseline.reviews).every(r=>r&&Number.isFinite(r.due)&&Number.isFinite(r.interval)&&Number.isFinite(r.seen)&&Number.isFinite(r.wrong))&&m.baseline.history.every(h=>h&&typeof h.date==='string'&&Number.isFinite(h.total)&&Number.isFinite(h.correct));
}
