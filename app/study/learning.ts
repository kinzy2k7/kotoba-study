import {norm, type Word, type StudyState} from './core';

export type CardKind = 'jp-vi' | 'vi-jp' | 'reading';
export type PracticeMode = 'flash' | 'quiz' | 'type' | 'listen' | 'match';
export type StudyPreferences = {hideJp:boolean; hideKana:boolean; hideMeaning:boolean; cardKind:CardKind; showReading:boolean; autoSpeak:boolean; speed:number; focus:boolean};
export const defaultPreferences:StudyPreferences = {hideJp:false,hideKana:false,hideMeaning:false,cardKind:'jp-vi',showReading:true,autoSpeak:false,speed:.85,focus:true};
export const preferenceKey = 'kotoba-learning-preferences-v1';
export function readPreferences():StudyPreferences {
 try {const p=JSON.parse(localStorage.getItem(preferenceKey)||'null');return {...defaultPreferences,...Object.fromEntries(Object.entries(p||{}).filter(([k,v])=>k==='cardKind'?['jp-vi','vi-jp','reading'].includes(String(v)):k==='speed'?[.6,.85].includes(Number(v)):k in defaultPreferences&&typeof v==='boolean'))};} catch {return {...defaultPreferences};}
}
export type Attempt = {item:string;ok:boolean;rating:number};
export type LearningSession = {version:1;id:string;dataKey:string;cardKind:CardKind;mode:PracticeMode;items:string[];at:number;flipped:boolean;input:string;feedback:boolean|null;picked:string;answers:Attempt[];matchDone:string[];matchLeft:string|null;matchBad:string|null;startedAt:number;elapsedMs:number;deadline:number|null;finished:boolean};
export const sessionStorageKey=(dataKey:string)=>'kotoba-session-v1:'+dataKey;
export function validSession(x:unknown):x is LearningSession {
 if(!x||typeof x!=='object')return false; const s=x as LearningSession;
 return s.version===1&&typeof s.id==='string'&&s.id.length<100&&typeof s.dataKey==='string'&&['jp-vi','vi-jp','reading'].includes(s.cardKind)&&['flash','quiz','type','listen','match'].includes(s.mode)&&Array.isArray(s.items)&&s.items.length>0&&s.items.length<=100&&s.items.every(id=>typeof id==='string')&&new Set(s.items).size===s.items.length&&Number.isInteger(s.at)&&s.at>=0&&s.at<=s.items.length&&typeof s.flipped==='boolean'&&typeof s.input==='string'&&(s.feedback===null||typeof s.feedback==='boolean')&&typeof s.picked==='string'&&Array.isArray(s.answers)&&s.answers.every(a=>a&&s.items.includes(a.item)&&typeof a.ok==='boolean'&&[0,1,2,3].includes(a.rating)&&a.ok===(a.rating>0))&&Array.isArray(s.matchDone)&&s.matchDone.every(id=>s.items.includes(id))&&(s.matchLeft===null||s.items.includes(s.matchLeft))&&(s.matchBad===null||s.items.includes(s.matchBad))&&Number.isFinite(s.startedAt)&&Number.isFinite(s.elapsedMs)&&s.elapsedMs>=0&&(s.deadline===null||Number.isFinite(s.deadline))&&typeof s.finished==='boolean';
}
export function loadSession(dataKey:string):LearningSession|null {
 try {const s=JSON.parse(localStorage.getItem(sessionStorageKey(dataKey))||'null');return validSession(s)&&s.dataKey===dataKey?s:null;} catch {return null;}
}
export const isSessionComplete=(s:LearningSession)=>s.finished||(s.mode==='match'?s.matchDone.length===s.items.length:s.at>=s.items.length);
export function quickReview(words:Word[],state:StudyState,now=Date.now(),limit=20):Word[] {
 const priority=(w:Word)=>{const r=state.reviews[w.id];return r&&r.due<=now?0:r&&r.wrong>0?1:!r?2:3;};
 return [...words].sort((a,b)=>priority(a)-priority(b)||(state.reviews[a.id]?.due||0)-(state.reviews[b.id]?.due||0)||a.id.localeCompare(b.id)).slice(0,limit);
}
export function typedAnswers(w:Word):string[] {
 const variants=[w.jp,w.kana,...w.kana.split(/[、,／/]/),...Array.from(w.kana.matchAll(/[（(]([^）)]+)[）)]/g),m=>m[1])];
 return [...new Set(variants.flatMap(s=>[s,s.replace(/[（(].*?[）)]/g,''),s.replace(/[［\[].*?[］\]]/g,'')]).map(norm).filter(Boolean))];
}
export function checkTyped(w:Word,input:string){return !!input.trim()&&typedAnswers(w).includes(norm(input));}
export function dueLabel(due:number,now=Date.now()):string {
 const minutes=Math.ceil((due-now)/60000);
 if(minutes<=0)return 'Đến hạn'; if(minutes<60)return `${minutes} phút nữa`;if(minutes<1440)return `${Math.ceil(minutes/60)} giờ nữa`;return `${Math.ceil(minutes/1440)} ngày nữa`;
}

export function stableShuffle<T>(items:T[],seed:string,key:(item:T)=>string):T[] {
 const hash=(s:string)=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
 return [...items].sort((a,b)=>hash(seed+key(a))-hash(seed+key(b))||key(a).localeCompare(key(b)));
}
