'use client';
import {useState,useEffect,useRef,useCallback} from 'react';
import {type StudyState,empty,validState} from './core';
import {mergeStates,upgradeState,applyLocalEdit,addReview,validateSync} from './sync';
const localKey='kotoba-study-v2';
export function useProgress(){
 const [state,rawSet]=useState<StudyState>(empty),[ready,setReady]=useState(false),[sync,setSync]=useState('Đang đồng bộ'),[dbReady,setDbReady]=useState(true);
 const latest=useRef(state),lock=useRef(false),alive=useRef(false),acknowledged=useRef(''),generation=useRef(0);
 const publish=useCallback((next:StudyState,pending=true)=>{
  latest.current=next;rawSet(next);
  try{localStorage.setItem(localKey,JSON.stringify(next));}catch{setSync('Bộ nhớ trình duyệt đầy · hãy xuất bản sao tiến độ');return;}
  if(pending)setSync('Đã lưu trên máy · chờ đồng bộ');
 },[]);
 const setState:React.Dispatch<React.SetStateAction<StudyState>>=useCallback(action=>{const prev=latest.current;publish(applyLocalEdit(prev,typeof action==='function'?action(prev):action));},[publish]);
 const record=useCallback((id:string,ok:boolean,rating=ok?2:0,eventId=crypto.randomUUID())=>{
  if(latest.current.sync?.events[eventId])return;
  publish(addReview(latest.current,{id:eventId,item:id,at:Date.now(),ok,rating}));
 },[publish]);
 const restore=useCallback((s:StudyState)=>{if(!validState(s)||!validateSync(s))throw Error('Tệp sao lưu không hợp lệ.');publish(mergeStates(latest.current,s));},[publish]);
 const syncNow=useCallback(async()=>{
  if(lock.current||!alive.current)return;lock.current=true;const epoch=generation.current;
  const current=()=>alive.current&&generation.current===epoch;
  try{
   setSync('Đang đồng bộ…');
   for(let attempt=0;attempt<3;attempt++){
    const get=await fetch('/api/progress',{cache:'no-store',signal:AbortSignal.timeout(15000)});const remote=await get.json();if(!current())return;
    if(!get.ok){if(get.status===401){location.assign('/login');return;}setDbReady(remote.code!=='DATABASE_NOT_CONFIGURED');throw Error(remote.error||'Chưa kết nối được máy chủ.');}
    if(remote.state&&(!validState(remote.state)||!validateSync(remote.state)))throw Error('Tiến độ trên máy chủ không hợp lệ · hãy giữ bản sao trên thiết bị.');
    setDbReady(true);
    const cloud=upgradeState(remote.state||empty);const combined=mergeStates(latest.current,cloud);const sent=JSON.stringify(combined);
    if(remote.state&&sent===JSON.stringify(cloud)){
     acknowledged.current=sent;publish(combined,false);setSync('Đã đồng bộ · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}));return;
    }
    const text=JSON.stringify({state:combined,revision:remote.revision});let body:BodyInit=text;
    const headers:Record<string,string>={'Content-Type':'application/json'};
    if(text.length>128000&&typeof CompressionStream!=='undefined'){
     const compressed=new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
     body=await new Response(compressed).blob();headers['Content-Encoding']='gzip';
    }
    const put=await fetch('/api/progress',{method:'PUT',headers,body,signal:AbortSignal.timeout(15000)});const result=await put.json();if(!current())return;
    if(put.status===409){if(result.state&&validState(result.state)&&validateSync(result.state))publish(mergeStates(latest.current,result.state));continue;}
    if(!put.ok)throw Error(result.error||'Chưa lưu được lên máy chủ.');
    acknowledged.current=sent;
    const after=mergeStates(latest.current,combined);publish(after,false);
    if(JSON.stringify(after)!==sent){setSync('Đã lưu trên máy · đang gửi lượt học mới');continue;}
    setSync('Đã đồng bộ · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}));return;
   }
   setSync('Đã lưu trên máy · còn thay đổi chờ đồng bộ');
  }catch(e){if(current()){const message=e instanceof Error?e.message:'';setSync(message.includes('vượt giới hạn')||message.includes('không hợp lệ')?message+' · dữ liệu trên máy được giữ':message.includes('Chưa kết nối cơ sở dữ liệu')?'Chưa kết nối cơ sở dữ liệu · dữ liệu lưu trên máy':'Lưu trên thiết bị · sẽ tự đồng bộ khi có mạng');}}
  finally{lock.current=false;}
 },[publish]);
 useEffect(()=>{
  alive.current=true;generation.current++;
  try{const raw=localStorage.getItem(localKey)||localStorage.getItem('kotoba-study-v1');if(raw){const s=JSON.parse(raw);if(validState(s)&&validateSync(s)){const next=upgradeState(s);latest.current=next;rawSet(next);}}}catch{}
  setReady(true);void syncNow();const interval=setInterval(syncNow,5000);
  const focus=()=>{if(document.visibilityState==='visible')void syncNow();};
  const storage=(e:StorageEvent)=>{if(e.key!==localKey||!e.newValue)return;try{const incoming=JSON.parse(e.newValue);if(validState(incoming)&&validateSync(incoming)){const merged=mergeStates(latest.current,incoming);if(JSON.stringify(merged)!==JSON.stringify(latest.current))publish(merged);}}catch{}};
  window.addEventListener('focus',focus);window.addEventListener('online',focus);window.addEventListener('storage',storage);document.addEventListener('visibilitychange',focus);
  return()=>{alive.current=false;generation.current++;clearInterval(interval);window.removeEventListener('focus',focus);window.removeEventListener('online',focus);window.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',focus);};
 },[syncNow,publish]);
 useEffect(()=>{
  if(!ready)return;document.documentElement.dataset.theme=state.dark?'dark':'light';
  if(JSON.stringify(state)===acknowledged.current)return;
  const timer=setTimeout(()=>void syncNow(),900);return()=>clearTimeout(timer);
 },[state,ready,syncNow]);
 return {state,setState,record,restore,ready,sync,dbReady,syncNow};
}
