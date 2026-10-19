'use client';
import {useState,useEffect,useRef,useCallback} from 'react';
import {StudyState,empty,validState} from './core';
import {mergeStates,upgradeState,applyLocalEdit,addReview,validateSync} from './sync';
export function useProgress(){
 const [state,rawSet]=useState<StudyState>(empty),[ready,setReady]=useState(false),[sync,setSync]=useState('Đang đồng bộ'),[dbReady,setDbReady]=useState(true);
 const latest=useRef(state),lock=useRef(false),alive=useRef(false);latest.current=state;
 const setState:React.Dispatch<React.SetStateAction<StudyState>>=useCallback(action=>{const at=Date.now();rawSet(prev=>applyLocalEdit(prev,typeof action==='function'?action(prev):action,at));},[]);
 const record=useCallback((id:string,ok:boolean,rating=ok?2:0)=>{const event={id:crypto.randomUUID(),item:id,at:Date.now(),ok,rating};rawSet(s=>addReview(s,event))},[]);
 const restore=useCallback((s:StudyState)=>{if(!validState(s)||!validateSync(s))throw Error('Tệp sao lưu không hợp lệ.');rawSet(prev=>mergeStates(prev,s))},[]);
 const syncNow=useCallback(async()=>{
  if(lock.current||!alive.current)return;lock.current=true;
  try{
   for(let attempt=0;attempt<3;attempt++){
    const get=await fetch('/api/progress',{cache:'no-store'});const remote=await get.json();
    if(!get.ok){if(get.status===401){location.assign('/login');return;}setDbReady(remote.code!=='DATABASE_NOT_CONFIGURED');throw Error(remote.error||'Chưa kết nối được máy chủ.');}
    setDbReady(true);
    const cloud=remote.state&&validState(remote.state)&&validateSync(remote.state)?upgradeState(remote.state):upgradeState(empty);
    const combined=mergeStates(latest.current,cloud);
    if(JSON.stringify(combined)===JSON.stringify(cloud)&&remote.state){rawSet(prev=>mergeStates(prev,cloud));setSync('Đã đồng bộ · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}));return;}
    const put=await fetch('/api/progress',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:combined,revision:remote.revision})});const result=await put.json();
    if(put.status===409){if(result.state&&validState(result.state)&&validateSync(result.state)){latest.current=mergeStates(latest.current,result.state);rawSet(prev=>mergeStates(prev,result.state));}continue;}
    if(!put.ok)throw Error(result.error||'Chưa lưu được lên máy chủ.');
    rawSet(prev=>mergeStates(prev,combined));setSync('Đã đồng bộ · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}));return;
   }
   setSync('Đang gộp thay đổi từ thiết bị khác · sẽ thử lại');
  }catch(e){if(alive.current)setSync((e as Error).message.includes('Chưa kết nối cơ sở dữ liệu')?'Chưa kết nối cơ sở dữ liệu · dữ liệu lưu trên máy':'Lưu trên thiết bị · sẽ tự đồng bộ khi có mạng');}
  finally{lock.current=false;}
 },[]);
 useEffect(()=>{alive.current=true;try{const raw=localStorage.getItem('kotoba-study-v2')||localStorage.getItem('kotoba-study-v1');if(raw){const s=JSON.parse(raw);if(validState(s)&&validateSync(s)){latest.current=upgradeState(s);rawSet(upgradeState(s));}}}catch{}setReady(true);void syncNow();const interval=setInterval(syncNow,5000);const focus=()=>{if(document.visibilityState==='visible')void syncNow()};window.addEventListener('focus',focus);window.addEventListener('online',focus);document.addEventListener('visibilitychange',focus);return()=>{alive.current=false;clearInterval(interval);window.removeEventListener('focus',focus);window.removeEventListener('online',focus);document.removeEventListener('visibilitychange',focus)}},[syncNow]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem('kotoba-study-v2',JSON.stringify(state))}catch{setSync('Bộ nhớ trình duyệt đầy · hãy xuất bản sao tiến độ')}document.documentElement.dataset.theme=state.dark?'dark':'light'},[state,ready]);
 return {state,setState,record,restore,ready,sync,dbReady,syncNow};
}
