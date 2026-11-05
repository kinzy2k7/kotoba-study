'use client';
import {useState,useMemo,useEffect,useRef,useCallback} from 'react';
import {ArrowRight,ArrowLeft,RotateCcw,Bookmark,Volume2,Check,Search,Shuffle,CheckCircle2,Headphones,X,Eye,EyeOff,Pause,Play,Clock,Maximize2,Minimize2,Columns2} from 'lucide-react';
import {type Word,type StudyState,type Grammar,shuffle} from './core';
import {Scope,Empty,Tracing} from './Widgets';
import {type LearningSession,type PracticeMode,type StudyPreferences,defaultPreferences,readPreferences,preferenceKey,loadSession,sessionStorageKey,isSessionComplete,checkTyped,dueLabel,quickReview,stableShuffle} from './learning';

type Props={data:Word[];lookupWords:Word[];dataKey:string;kanji?:boolean;state:StudyState;setState:React.Dispatch<React.SetStateAction<StudyState>>;record:(id:string,ok:boolean,rating?:number,eventId?:string)=>void;speak:(text:string,rate?:number)=>void;notify:(s:string)=>void;initialItems?:Word[];intent?:'resume'|'quick';onFocus:(v:boolean)=>void;examples:Grammar[]};
type Field='jp'|'kana'|'meaning';
const fieldNames:Record<Field,string>={jp:'Tiếng Nhật',kana:'Cách đọc',meaning:'Nghĩa'};

export default function Vocabulary({data,lookupWords,dataKey,kanji=false,state,setState,record,speak,notify,initialItems,intent,onFocus,examples}:Props){
 const [selected,setSelected]=useState([1]),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[batch,setBatch]=useState(20);
 const [prefs,setPrefs]=useState<StudyPreferences>(defaultPreferences),[preferencesReady,setPreferencesReady]=useState(false),[revealed,setRevealed]=useState<Set<string>>(new Set());
 const [run,setRun]=useState<LearningSession|null>(null),[saved,setSaved]=useState<LearningSession|null>(null),[detail,setDetail]=useState<Word|null>(null),[compare,setCompare]=useState<string[]>([]),[showCompare,setShowCompare]=useState(false),[clock,setClock]=useState(Date.now());
 const runRef=useRef(run),prefsRef=useRef(prefs);prefsRef.current=prefs;
 const words=useMemo(()=>new Map(lookupWords.map(w=>[w.id,w])),[lookupWords]);
 const filtered=useMemo(()=>data.filter(w=>selected.includes(w.lesson)&&[w.jp,w.kana,w.meaning,w.han||''].join(' ').toLowerCase().includes(query.toLowerCase())).filter(w=>filter==='star'?state.stars.includes(w.id):filter==='due'?!!state.reviews[w.id]&&state.reviews[w.id].due<=clock:filter==='new'?!state.reviews[w.id]:filter==='wrong'?(state.reviews[w.id]?.wrong||0)>0:true),[data,selected,query,filter,state,clock]);
 const commit=useCallback((next:LearningSession|null)=>{
  runRef.current=next;setRun(next);setSaved(next&&!isSessionComplete(next)?next:null);
  try {if(next)localStorage.setItem(sessionStorageKey(dataKey),JSON.stringify(next));else localStorage.removeItem(sessionStorageKey(dataKey));}catch{notify('Chưa lưu được buổi học trên thiết bị. Hãy kiểm tra bộ nhớ trình duyệt.');}
 },[dataKey]);
 function updatePrefs(p:Partial<StudyPreferences>){setPrefs(old=>({...old,...p}));}
 function start(mode:PracticeMode,items=filtered,timed=false){
  if(!items.length){notify('Chưa có mục phù hợp. Chọn thêm bài hoặc đổi bộ lọc nhé.');return;}
  let pool=items;
  if(mode==='match'){const meanings=new Set<string>(),jps=new Set<string>();pool=items.filter(w=>{if(meanings.has(w.meaning)||jps.has(w.jp))return false;meanings.add(w.meaning);jps.add(w.jp);return true;});}
  const now=Date.now();const chosen=timed?quickReview(pool,state):shuffle(pool).slice(0,mode==='match'?6:batch);
  commit({version:1,id:crypto.randomUUID(),dataKey,cardKind:prefsRef.current.cardKind,mode,items:chosen.map(w=>w.id),at:0,flipped:false,input:'',feedback:null,picked:'',answers:[],matchDone:[],matchLeft:null,matchBad:null,startedAt:now,elapsedMs:0,deadline:timed?now+300000:null,finished:false});setClock(now);setRevealed(new Set());
 }
 function resume(candidate=saved){
  if(!candidate)return;
  if(!candidate.items.every(id=>words.has(id))){notify('Học liệu đã thay đổi. Hãy bắt đầu buổi học mới.');commit(null);return;}
  setPrefs(p=>({...p,cardKind:candidate.cardKind}));
  // Replaying stable event identities makes a restored answer safe to retry.
  candidate.answers.forEach((a,i)=>record(a.item,a.ok,a.rating,`${candidate.id}:${i}`));
  commit(candidate.deadline&&candidate.deadline<=Date.now()?{...candidate,finished:true}:candidate);
 }
 useEffect(()=>{
  const loaded=readPreferences();prefsRef.current=loaded;setPrefs(loaded);setPreferencesReady(true);
  const candidate=loadSession(dataKey);setSaved(candidate&&!isSessionComplete(candidate)?candidate:null);
  if(intent==='resume'&&candidate)resume(candidate);
  else if(initialItems?.length)start('flash',initialItems,intent==='quick');
  else if(intent==='quick')start('flash',quickReview(data,state),true);
 },[]);
 useEffect(()=>{if(preferencesReady)try{localStorage.setItem(preferenceKey,JSON.stringify(prefs));}catch{}},[prefs,preferencesReady]);
 useEffect(()=>{let previous=Date.now();const interval=setInterval(()=>{const now=Date.now(),s=runRef.current;if(s&&!isSessionComplete(s)&&document.visibilityState==='visible')commit({...s,elapsedMs:s.elapsedMs+Math.min(2000,Math.max(0,now-previous))});previous=now;setClock(now);},1000);return()=>clearInterval(interval);},[commit]);
 useEffect(()=>{
  if(!showCompare&&!detail)return;
  const previous=document.activeElement as HTMLElement|null;
  const dialog=document.querySelector<HTMLElement>('[role="dialog"]');
  const controls=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,select,[tabindex="0"]')||[]);
  controls()[0]?.focus();
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){setShowCompare(false);setDetail(null);return;}
   if(e.key!=='Tab')return;const items=controls();const first=items[0],last=items[items.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  };
  const before=document.body.style.overflow;document.body.style.overflow='hidden';document.addEventListener('keydown',key);
  return()=>{document.body.style.overflow=before;document.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus();};
 },[showCompare,detail?.id]);
 const complete=!!run&&isSessionComplete(run);
 useEffect(()=>{onFocus(!!run&&!complete&&prefs.focus);return()=>onFocus(false);},[!!run,complete,prefs.focus,onFocus]);
 useEffect(()=>{const s=runRef.current;if(s?.deadline&&clock>=s.deadline&&!isSessionComplete(s))commit({...s,finished:true});},[clock,commit]);
 const current=run?words.get(run.items[run.at]):undefined;
 const reading=(w:Word)=>w.words?.[0]?.kana||w.kana;
 const quizField=(w:Word)=>prefs.cardKind==='reading'?reading(w):prefs.cardKind==='vi-jp'?w.jp:w.meaning;
 const correct=current?quizField(current):'';
 const options=useMemo(()=>{
  if(!current||!run)return [];
  // Stable choices survive a reload without exposing a different answer set.
  const hash=(s:string)=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
  const seed=run.id+':'+run.at+':'+prefs.cardKind;
  const distractors=[...new Set(data.map(quizField).filter(x=>x&&x!==correct))].sort((a,b)=>hash(seed+a)-hash(seed+b)).slice(0,3);
  return [correct,...distractors].sort((a,b)=>hash(seed+'option'+a)-hash(seed+'option'+b));
 },[current,data,prefs.cardKind,run?.id,run?.at]);
 useEffect(()=>{if(preferencesReady&&prefs.autoSpeak&&run&&!complete&&current&&run.mode==='flash'&&prefs.cardKind!=='vi-jp')speak(reading(current),prefs.speed);},[current?.id,run?.id,run?.mode,complete,preferencesReady,prefs.autoSpeak,prefs.speed,prefs.cardKind]);
 const next=()=>{const s=runRef.current;if(s)commit({...s,at:s.at+1,flipped:false,input:'',feedback:null,picked:''});};
 function answer(ok:boolean,picked=''){
  const s=runRef.current;if(!s||s.feedback!==null||isSessionComplete(s)||!words.has(s.items[s.at]))return;
  const item=s.items[s.at];const rating=ok?2:0;
  commit({...s,feedback:ok,picked,answers:[...s.answers,{item,ok,rating}]});record(item,ok,rating,`${s.id}:${s.answers.length}`);
 }
 function rate(rating:number){
  const s=runRef.current;if(!s||!s.flipped||isSessionComplete(s))return;
  const item=s.items[s.at];commit({...s,at:s.at+1,flipped:false,input:'',feedback:null,picked:'',answers:[...s.answers,{item,ok:rating>0,rating}]});record(item,rating>0,rating,`${s.id}:${s.answers.length}`);
 }
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{const s=runRef.current;if(!s||s.mode!=='flash'||isSessionComplete(s)||['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName)||e.repeat)return;
   if(e.code==='Space'&&(e.target as HTMLElement).tagName!=='BUTTON'){e.preventDefault();commit({...s,flipped:!s.flipped});}
   if(s.flipped&&['1','2','3','4'].includes(e.key)){e.preventDefault();rate(+e.key-1);}
  };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[commit]);
 const score=run?.answers.filter(a=>a.ok).length||0;
 const wrongIds=run?[...new Set(run.answers.filter(a=>!a.ok).map(a=>a.item))]:[];
 const wrongWords=wrongIds.map(id=>words.get(id)!).filter(Boolean);
 const sessionWords=run?run.items.map(id=>words.get(id)!).filter(Boolean):[];
 function star(w:Word){setState(s=>({...s,stars:s.stars.includes(w.id)?s.stars.filter(x=>x!==w.id):[...s.stars,w.id]}));}
 function toggleCompare(w:Word){setCompare(ids=>ids.includes(w.id)?ids.filter(id=>id!==w.id):ids.length<4?[...ids,w.id]:ids);if(!compare.includes(w.id)&&compare.length>=4)notify('Chọn tối đa 4 từ để so sánh.');}
 function cell(w:Word,field:Field,className=''){
  const hidden=field==='jp'?prefs.hideJp:field==='kana'?prefs.hideKana:prefs.hideMeaning;
  const key=w.id+':'+field;const visible=!hidden||revealed.has(key);
  return <button type="button" className={'word-cell '+className+(visible?'':' masked')} aria-label={(visible?'Che ':'Hiện ')+fieldNames[field]+' của mục bài '+w.lesson} aria-pressed={visible} onClick={()=>{if(hidden)setRevealed(prev=>{const n=new Set(prev);n.has(key)?n.delete(key):n.add(key);return n;});}} disabled={!hidden}>{visible?w[field]:<><Eye size={15}/><span>Chạm để hiện</span></>}</button>;
 }
 function audio(w:Word){return <div className="audio-buttons"><button className="icon-btn" aria-label={'Nghe '+w.kana+' tốc độ thường'} title="Nghe thường" onClick={()=>speak(kanji?reading(w):w.kana,.85)}><Volume2 size={18}/></button><button className="slow-audio" aria-label={'Nghe '+w.kana+' tốc độ chậm'} onClick={()=>speak(kanji?reading(w):w.kana,.6)}>0.7×</button></div>;}
 function actions(w:Word){return <div className="word-actions">{audio(w)}<button className={'icon-btn '+(state.stars.includes(w.id)?'gold':'')} aria-label={state.stars.includes(w.id)?'Bỏ lưu từ':'Lưu từ'} aria-pressed={state.stars.includes(w.id)} onClick={()=>star(w)}><Bookmark size={17} fill={state.stars.includes(w.id)?'currentColor':'none'}/></button></div>;}
 const hasHidden=prefs.hideJp||prefs.hideKana||prefs.hideMeaning;
 const example=current?examples.flatMap(g=>g.examples).find(e=>e.jp.includes(current.jp)&&current.jp.length>=2):undefined;
 const minutes=run?.deadline?Math.max(0,Math.ceil((run.deadline-clock)/1000)):0;
 const timeSpent=run?Math.ceil(run.elapsedMs/60000):0;
 function leave(){setRun(null);runRef.current=null;setSaved(run&&!complete?run:null);}
 function match(w:Word){
  const s=runRef.current;if(!s||s.matchDone.includes(w.id))return;
  if(!s.matchLeft){notify('Chọn một từ tiếng Nhật trước nhé.');return;}
  const ok=s.matchLeft===w.id,item=s.matchLeft;commit({...s,answers:[...s.answers,{item,ok,rating:ok?2:0}],matchDone:ok?[...s.matchDone,item]:s.matchDone,matchLeft:ok?null:item,matchBad:ok?null:w.id});record(item,ok,ok?2:0,`${s.id}:${s.answers.length}`);
 }
 return <div className="vocabulary-page">
 <div className="page-heading"><div><span className="eyebrow">{kanji?'漢字 · KANJI LOOK AND LEARN':'ことば · MINNA NO NIHONGO'}</span><h1>{run?'Một thẻ, một bước tiến.':kanji?'Từng chữ, một câu chuyện.':'Nhớ từ, mở lời.'}</h1><p>{run?'Học theo nhịp của bạn. Buổi học được lưu trên thiết bị này.':kanji?'512 mục, 32 bài. Che cách đọc để thử trí nhớ của bạn.':`${data.length.toLocaleString()} từ & biểu thức. Chọn bài rồi luyện theo cách bạn thích.`}</p></div>{!run&&<Scope kanji={kanji} selected={selected} onChange={s=>{setSelected(s);setRevealed(new Set());}}/>}</div>
 {!run&&saved&&<section className="resume-banner"><div><span className="eyebrow">BUỔI HỌC ĐANG DỞ</span><strong>{saved.mode==='match'?saved.matchDone.length:saved.at}/{saved.items.length} mục · {saved.mode==='flash'?'Flashcard':saved.mode==='quiz'?'Trắc nghiệm':saved.mode==='match'?'Ghép cặp':'Gõ đáp án'}</strong><small>{saved.deadline?'Phiên 5 phút vẫn tính thời gian khi rời trang.':'Tiếp tục đúng thẻ và câu trả lời trước đó.'}</small></div><div className="row wrap"><button className="btn" onClick={()=>resume()}><Play size={16}/> Tiếp tục học</button><button className="text-btn" onClick={()=>commit(null)}>Bỏ buổi đang dở</button></div></section>}
 {!run?<>
 <div className="study-toolbar"><div className="segmented" aria-label="Chọn cách luyện">{(['flash','quiz','type','listen','match'] as PracticeMode[]).filter(m=>!kanji||['flash','quiz'].includes(m)).map(m=><button key={m} onClick={()=>start(m)}>{({flash:'Flashcard',quiz:'Trắc nghiệm',type:'Gõ đáp án',listen:'Nghe & viết',match:'Ghép cặp'})[m]}</button>)}</div><label className="small muted">Số mục <select aria-label="Số mục mỗi buổi" value={batch} onChange={e=>setBatch(+e.target.value)}>{[10,20,30,50,100].map(n=><option key={n}>{n}</option>)}</select></label></div>
 <div className="learning-tools"><div><span className="eyebrow">TỰ KIỂM TRA TRÍ NHỚ</span><p>Che phần muốn nhớ, chạm từng ô để xem đáp án.</p></div><div className="row wrap">{(['jp','kana','meaning'] as Field[]).map(f=>{const k=f==='jp'?'hideJp':f==='kana'?'hideKana':'hideMeaning';return <button key={f} className={'chip '+(prefs[k]?'on':'')} aria-pressed={prefs[k]} onClick={()=>{updatePrefs({[k]:!prefs[k]});setRevealed(new Set());}}>{prefs[k]?<EyeOff size={14}/>:<Eye size={14}/>} {fieldNames[f]}</button>;})}<button className="chip" disabled={!hasHidden} onClick={()=>setRevealed(new Set(filtered.flatMap(w=>(['jp','kana','meaning'] as Field[]).map(f=>w.id+':'+f))))}>Hiện tất cả</button><button className="chip" disabled={!hasHidden} onClick={()=>setRevealed(new Set())}>Che lại</button></div></div>
 <div className="filters"><label className="search"><Search size={17}/><input aria-label="Tìm từ vựng hoặc Kanji" placeholder="Tìm tiếng Nhật, cách đọc, nghĩa…" value={query} onChange={e=>{setQuery(e.target.value);setRevealed(new Set());}}/></label><select aria-label="Bộ lọc từ" value={filter} onChange={e=>{setFilter(e.target.value);setRevealed(new Set());}}><option value="all">Tất cả trạng thái</option><option value="new">Chưa học</option><option value="due">Đến hạn ôn</option><option value="star">Đã lưu</option><option value="wrong">Từng trả lời sai</option></select><button className="btn secondary" onClick={()=>start('flash',quickReview(filtered,state),true)}><Clock size={16}/> Ôn nhanh 5 phút</button></div>
 <div className="section-title"><span className="small muted">{filtered.length} mục · {selected.length} bài</span><button className="text-btn" disabled={compare.length<2} onClick={()=>setShowCompare(true)}><Columns2 size={16}/> So sánh ({compare.length}/4)</button></div>
 {compare.length>0&&<p className="selection-hint">Đã chọn {compare.length} từ. Chọn 2–4 từ bạn dễ nhầm để xem cạnh nhau. <button className="text-btn" onClick={()=>setCompare([])}>Bỏ chọn</button></p>}
 {!filtered.length?<Empty text="Chọn bài khác hoặc thay đổi bộ lọc để bắt đầu."/>:kanji?<div className="kanji-grid">{filtered.map(w=><article className="kanji-tile" key={w.id}><small>Bài {w.lesson} · {w.strokes} nét</small>{cell(w,'jp','kanji-char')}{cell(w,'kana','kana')}{cell(w,'meaning')}{!prefs.hideMeaning&&<strong>{w.han}</strong>}<div className="row wrap center"><button className="text-btn" onClick={()=>setDetail(w)}>Từ ghép & tập viết</button><button className={'chip '+(compare.includes(w.id)?'on':'')} aria-pressed={compare.includes(w.id)} onClick={()=>toggleCompare(w)}><Columns2 size={14}/></button></div></article>)}</div>:<div className="word-list learning-word-list"><div className="word-header"><span>TIẾNG NHẬT & CÁCH ĐỌC</span><span>NGHĨA TIẾNG VIỆT</span><span>ÔN TIẾP</span><span>THAO TÁC</span></div>{filtered.map(w=><div className="word-row" key={w.id}><div>{cell(w,'jp','jp word-jp')}{cell(w,'kana','kana')}<small>Bài {w.lesson}</small></div><div>{cell(w,'meaning')}</div><span className={'status-tag '+(state.reviews[w.id]?'known':'')}>{state.reviews[w.id]?dueLabel(state.reviews[w.id].due,clock):'Chưa học'}</span><div>{actions(w)}<button className={'compare-choice '+(compare.includes(w.id)?'selected':'')} aria-pressed={compare.includes(w.id)} onClick={()=>toggleCompare(w)}><Columns2 size={13}/> So sánh</button></div></div>)}</div>}
 </>:complete?<section className="session-card results"><CheckCircle2 size={48}/><span className="eyebrow">{run.finished?'ĐÃ KẾT THÚC PHIÊN HỌC':'BUỔI HỌC HOÀN THÀNH'}</span><h2>{wrongWords.length?'Thêm một lần để nhớ lâu hơn.':'Mỗi lượt học đều đáng giá.'}</h2><div className="session-summary"><div><strong>{run.answers.length}</strong><span>Lượt luyện</span></div><div><strong>{run.answers.length?Math.round(score/run.answers.length*100):0}%</strong><span>Chính xác</span></div><div><strong>{timeSpent}</strong><span>Phút đã học</span></div></div><p>{wrongWords.length?`${wrongWords.length} mục còn cần củng cố. Bắt đầu lượt hai chỉ với các mục này.`:'Bạn có thể tiếp tục buổi mới hoặc xem lại lịch ôn bên dưới.'}</p><div className="row wrap center">{wrongWords.length>0&&<button className="btn" onClick={()=>start(run.mode,wrongWords)}>Ôn lượt hai · {wrongWords.length} mục <RotateCcw size={16}/></button>}<button className="btn secondary" onClick={()=>start(run.mode,sessionWords)}>Buổi học mới <Shuffle size={16}/></button></div><div className="review-schedule">{sessionWords.filter(w=>run.answers.some(a=>a.item===w.id)).map(w=><div key={w.id}><span className="jp">{w.jp}<small className="kana">{w.kana}</small></span><span>{wrongIds.includes(w.id)?'Cần củng cố · ':''}{state.reviews[w.id]?dueLabel(state.reviews[w.id].due):'Đang cập nhật'}</span></div>)}</div><button className="text-btn" onClick={()=>commit(null)}>Về học liệu <ArrowRight size={15}/></button></section>:<>
 <div className="session-meta"><button className="text-btn" onClick={leave}><Pause size={15}/> Lưu & tạm dừng</button><span>{run.mode==='match'?run.matchDone.length:run.at+1} / {run.items.length}</span><div className="row"><span>{score} đúng</span>{run.deadline&&<span className="session-clock"><Clock size={14}/>{Math.floor(minutes/60)}:{String(minutes%60).padStart(2,'0')}</span>}<button className="icon-btn" title={prefs.focus?'Thoát tập trung':'Chế độ tập trung'} aria-label={prefs.focus?'Thoát tập trung':'Chế độ tập trung'} aria-pressed={prefs.focus} onClick={()=>updatePrefs({focus:!prefs.focus})}>{prefs.focus?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button></div></div>
 <div className="progress-line session-progress"><i style={{width:(run.mode==='match'?run.matchDone.length:run.at)/run.items.length*100+'%'}}/></div>
 {run.mode==='match'?<section className="matching panel"><span className="eyebrow">NHẬN DIỆN CHỦ ĐỘNG</span><h2>Tìm những cặp thuộc về nhau.</h2><p className="muted">Chọn một từ bên trái và nghĩa tương ứng bên phải.</p><div className="matching-grid"><div>{sessionWords.map(w=><button key={w.id} disabled={run.matchDone.includes(w.id)} className={'match-item jp '+(run.matchLeft===w.id?'selected':'')} onClick={()=>commit({...run,matchLeft:w.id,matchBad:null})}><span>{w.jp}<small className="kana">{prefs.showReading?w.kana:''}</small></span>{run.matchDone.includes(w.id)&&<Check size={16}/>}</button>)}</div><div>{stableShuffle(sessionWords,run.id,w=>w.id).map(w=><button key={w.id} disabled={run.matchDone.includes(w.id)} className={'match-item '+(run.matchBad===w.id?'incorrect':'')} onClick={()=>match(w)}>{w.meaning}{run.matchDone.includes(w.id)&&<Check size={16}/>}</button>)}</div></div>{run.matchBad&&<p className="match-feedback" role="status">Chưa đúng, thử nghĩa khác nhé.</p>}</section>:current&&<section className="session-card"><div className="row between wrap"><span className="tag">{kanji?'Kanji':'Minna'} · Bài {current.lesson}</span>{actions(current)}</div>
 <div className="card-settings"><label>Kiểu thẻ <select aria-label="Kiểu thẻ" disabled={run.feedback!==null} value={prefs.cardKind} onChange={e=>{updatePrefs({cardKind:e.target.value as StudyPreferences['cardKind']});commit({...run,cardKind:e.target.value as StudyPreferences['cardKind'],flipped:false});}}><option value="jp-vi">Nhật → Việt</option><option value="vi-jp">Việt → Nhật</option><option value="reading">Luyện đọc Kanji</option></select></label><button className={'chip '+(prefs.showReading?'on':'')} aria-pressed={prefs.showReading} onClick={()=>updatePrefs({showReading:!prefs.showReading})}>{prefs.showReading?<Eye size={14}/>:<EyeOff size={14}/>} Cách đọc</button><label className="auto-speak"><input type="checkbox" checked={prefs.autoSpeak} onChange={e=>updatePrefs({autoSpeak:e.target.checked})}/> Tự đọc thẻ</label><select aria-label="Tốc độ tự đọc" value={prefs.speed} onChange={e=>updatePrefs({speed:+e.target.value})}><option value={.85}>Giọng thường</option><option value={.6}>Giọng chậm</option></select></div>
 {run.mode==='flash'?<>
 <button className={'flash-surface '+(run.flipped?'flipped':'')} onClick={()=>commit({...run,flipped:!run.flipped})} aria-label={run.flipped?'Xem mặt trước thẻ':'Lật thẻ để xem đáp án'}><span className="tiny muted">{run.flipped?'ĐÁP ÁN':prefs.cardKind==='vi-jp'?'TỪ NÀY TRONG TIẾNG NHẬT LÀ GÌ?':prefs.cardKind==='reading'?'BẠN ĐỌC TỪ NÀY THẾ NÀO?':'BẠN CÓ NHỚ NGHĨA?'}</span>
 <span className={'flash-main '+(run.flipped&&prefs.cardKind==='jp-vi'||!run.flipped&&prefs.cardKind==='vi-jp'?'':'jp')}>{run.flipped?(prefs.cardKind==='jp-vi'?current.meaning:prefs.cardKind==='reading'?reading(current):current.jp):(prefs.cardKind==='vi-jp'?current.meaning:prefs.cardKind==='reading'&&kanji?current.words?.[0]?.jp||current.jp:current.jp)}</span>
 {((!run.flipped&&prefs.cardKind==='jp-vi'&&prefs.showReading)||(run.flipped&&prefs.cardKind!=='reading'))&&<span className="kana flash-reading" lang="ja">{reading(current)}</span>}
 {run.flipped&&prefs.cardKind==='reading'&&<span>{current.meaning}</span>}
 {run.flipped&&current.on&&<span className="muted small">On: {current.on} · Kun: {current.kun}</span>}
 {run.flipped&&example&&<span className="flash-example"><span className="jp">{example.jp}</span><small>{example.kana}</small><small>{example.vi}</small></span>}
 <span className="flip-hint"><RotateCcw size={14}/> Chạm để lật · phím Space</span></button>
 {run.flipped?<div className="ratings sticky-ratings">{[['Chưa nhớ','10 phút',0],['Khó','1 ngày',1],['Nhớ','Theo lịch',2],['Dễ','≥ 7 ngày',3]].map(([label,hint,r])=><button key={r} className={'rating rating-'+r} onClick={()=>rate(Number(r))}><strong>{label}</strong><small>{hint}</small><kbd>{Number(r)+1}</kbd></button>)}</div>:<button className="btn secondary full" onClick={()=>commit({...run,flipped:true})}>Hiện đáp án <Eye size={16}/></button>}
 </>:<><div className="quiz-prompt"><span className="eyebrow">{run.mode==='quiz'?'CHỌN ĐÁP ÁN ĐÚNG':run.mode==='listen'?'NGHE VÀ GÕ LẠI BẰNG KANA':'NHỚ TỪ TIẾNG NHẬT TỪ NGHĨA'}</span>{run.mode==='listen'?<div className="listen-controls"><button className="listen-button" aria-label="Nghe câu hỏi" onClick={()=>speak(current.kana,.85)}><Headphones size={38}/><span>Nghe thường</span></button><button className="chip" onClick={()=>speak(current.kana,.6)}>Nghe chậm</button></div>:<><h2 className="jp">{run.mode==='type'||prefs.cardKind==='vi-jp'?current.meaning:kanji&&prefs.cardKind==='reading'?current.words?.[0]?.jp||current.jp:current.jp}</h2>{run.mode==='quiz'&&prefs.cardKind==='jp-vi'&&prefs.showReading&&<span className="kana large">{reading(current)}</span>}</>}</div>
 {run.mode==='quiz'?<div className="quiz-options">{options.map((o,i)=><button key={o} disabled={run.feedback!==null} className={'option '+(run.feedback!==null&&o===correct?'correct':run.picked===o?'incorrect':'')} onClick={()=>answer(o===correct,o)}><span>{String.fromCharCode(65+i)}</span>{o}{run.feedback!==null&&o===correct&&<Check size={18}/>}</button>)}</div>:<form className="typing-form" onSubmit={e=>{e.preventDefault();answer(checkTyped(current,run.input));}}><input lang="ja" autoComplete="off" aria-label="Câu trả lời của bạn" autoFocus maxLength={500} placeholder="Nhập kana hoặc kanji…" value={run.input} disabled={run.feedback!==null} onChange={e=>commit({...run,input:e.target.value})}/>{run.feedback===null&&<button className="btn" disabled={!run.input.trim()}>Kiểm tra <ArrowRight size={16}/></button>}</form>}
 {run.feedback!==null&&<div className={'answer-feedback '+(run.feedback?'good':'bad')} role="status"><strong>{run.feedback?<><Check size={17}/> Chính xác!</>:<><X size={17}/> Chưa đúng, cùng ghi nhớ lại nhé.</>}</strong><p><span className="jp">{current.jp}</span> · {current.kana}<br/>{current.meaning}</p><button className="btn" onClick={next}>{run.at===run.items.length-1?'Xem kết quả':'Câu tiếp theo'} <ArrowRight size={16}/></button></div>}</>}
 </section>}
 <p className="under-card">{run.mode==='flash'?'Space để lật thẻ · phím 1–4 để đánh giá. Từ chưa nhớ được gom lại ở cuối buổi.':'Buổi học và đáp án được lưu trên thiết bị khi bạn tạm dừng.'}</p><button className="text-btn end-session" onClick={()=>commit({...run,finished:true})}>Kết thúc & xem kết quả</button>
 </>}
 {showCompare&&<div className="modal-backdrop" onClick={()=>setShowCompare(false)}><section className="comparison-modal" role="dialog" aria-modal="true" aria-label="So sánh từ dễ nhầm" onClick={e=>e.stopPropagation()}><div className="row between"><div><span className="eyebrow">NHÌN CẠNH NHAU, NHỚ RÕ HƠN</span><h2>Những từ bạn dễ nhầm</h2></div><button className="icon-btn" aria-label="Đóng so sánh" onClick={()=>setShowCompare(false)}><X/></button></div><div className="comparison-grid">{compare.map(id=>words.get(id)).filter((w):w is Word=>!!w).map(w=><article key={w.id}><span className="tag">Bài {w.lesson}</span><h3 className="jp">{w.jp}</h3><p className="kana">{w.kana}</p><p>{w.meaning}</p>{w.on&&<p className="small muted">On: {w.on}<br/>Kun: {w.kun}</p>}{audio(w)}<label className="field-label">Mẹo phân biệt của bạn<textarea value={state.notes[w.id]||''} placeholder="Khác nhau ở điểm nào?" maxLength={2000} onChange={e=>setState(s=>({...s,notes:{...s.notes,[w.id]:e.target.value}}))}/></label></article>)}</div><button className="btn" onClick={()=>{setShowCompare(false);start('flash',compare.map(id=>words.get(id)!).filter(Boolean));}}>Luyện các từ đã chọn <ArrowRight size={16}/></button></section></div>}
 {detail&&<div className="modal-backdrop" onClick={()=>setDetail(null)}><section className="kanji-modal" role="dialog" aria-modal="true" aria-label="Chi tiết Kanji" onClick={e=>e.stopPropagation()}><div className="row between"><span className="tag">Kanji Look and Learn · Bài {detail.lesson}</span><button className="icon-btn" aria-label="Đóng chi tiết" onClick={()=>setDetail(null)}><X size={22}/></button></div><div className="kanji-detail"><div>{cell(detail,'jp','kanji-char')}{cell(detail,'meaning')}{actions(detail)}</div><dl><dt>Âm On / Kun</dt><dd>{prefs.hideKana?<button className="chip" onClick={()=>updatePrefs({hideKana:false})}>Hiện âm đọc</button>:<>{detail.on||'—'}<br/>{detail.kun||'—'}</>}</dd><dt>Số nét</dt><dd>{detail.strokes}</dd></dl></div><h3>Từ ghép & cách đọc</h3><div className="compound-list">{detail.words?.map((w,i)=><div key={i}><div><strong className="jp">{prefs.hideJp?'Đang che':w.jp}</strong><span className="kana">{prefs.hideKana?'Đang che':w.kana}</span></div><span>{prefs.hideMeaning?'Đang che':w.meaning}</span><button className="icon-btn" aria-label="Nghe từ ghép" onClick={()=>speak(w.kana,prefs.speed)}><Volume2 size={16}/></button></div>)}</div>{!prefs.hideJp&&<Tracing key={detail.jp} glyph={detail.jp}/>}<p className="tiny muted">Bảng tập viết tự do, không tự chấm thứ tự nét.</p><textarea placeholder="Ghi mẹo nhớ chữ này…" aria-label="Ghi chú Kanji" maxLength={2000} value={state.notes[detail.id]||''} onChange={e=>setState(s=>({...s,notes:{...s.notes,[detail.id]:e.target.value}}))}/></section></div>}
 </div>;
}
