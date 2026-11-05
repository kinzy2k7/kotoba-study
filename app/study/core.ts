export type Word={id:string,lesson:number,jp:string,kana:string,meaning:string,han?:string,on?:string,kun?:string,strokes?:string,words?:{jp:string,kana:string,meaning:string}[],edition?:number,source?:string};
export type Grammar={id:string,lesson:number,title:string,pattern:string,explanation:string,pitfall:string,examples:{jp:string,kana:string,vi:string,tokens:string[]}[],quiz:{question:string,options:string[],answer:number,explanation:string}};
export type Review={due:number,interval:number,seen:number,wrong:number};
export type ReviewEvent={id:string,item:string,at:number,ok:boolean,rating:number};
export type SyncMetadata={version:2,events:Record<string,ReviewEvent>,stars:Record<string,{value:boolean,at:number}>,notes:Record<string,{value:string,at:number}>,settings:{goal:number,dark:boolean,at:number},baseline:{reviews:Record<string,Review>,history:{date:string,total:number,correct:number}[]}};
export type StudyState={reviews:Record<string,Review>,stars:string[],history:{date:string,total:number,correct:number}[],notes:Record<string,string>,goal:number,dark:boolean,sync?:SyncMetadata};
export type Answer={title?:string,text?:string,jp?:string,kana?:string,vi?:string,pattern?:string,score?:number,corrections?:string[]};
export const empty:StudyState={reviews:{},stars:[],history:[],notes:{},goal:20,dark:false};
export const titles=['','Làm quen','Đồ vật quanh ta','Nơi chốn','Thời gian','Đi lại','Sinh hoạt hằng ngày','Trao và nhận','Tính từ','Sở thích','Sự tồn tại','Số lượng','So sánh','Mong muốn','Thể て','Cho phép & trạng thái','Nối câu','Thể ない','Khả năng & sở thích','Kinh nghiệm','Thể thông thường','Ý kiến & trích dẫn','Bổ nghĩa danh từ','Khi & điều kiện','Cho nhận hành động','Điều kiện たら','Giải thích với んです','Thể khả năng','Vừa làm vừa…','Trạng thái & hoàn tất','Chuẩn bị sẵn','Ý định & kế hoạch','Lời khuyên & dự đoán','Mệnh lệnh & truyền đạt','Theo như & sau khi','Điều kiện ば','Thay đổi & thói quen','Thể bị động','Danh từ hóa với の','Nguyên nhân & lý do','Câu hỏi lồng','Cho nhận lịch sự','Mục đích','Có vẻ & đi rồi về','Quá mức & dễ khó','Trường hợp & mặc dù','Thời điểm hành động','Truyền đạt & suy đoán','Thể sai khiến','Kính ngữ','Khiêm nhường ngữ'];
export const day=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
export function shuffle<T>(a:T[]){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b;}
export const norm=(s:string)=>s.normalize('NFKC').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96)).replace(/[\s。、「」！!？?\[\]［］（）()～〜~・－—―-]/g,'').toLowerCase();
export function isRecord(x:unknown):x is Record<string,unknown>{return !!x&&typeof x==='object'&&!Array.isArray(x);}
export function validReview(x:unknown):x is Review {
 if(!isRecord(x))return false;
 return typeof x.due==='number'&&Number.isFinite(x.due)&&typeof x.interval==='number'&&Number.isFinite(x.interval)&&x.interval>=0&&Number.isInteger(x.seen)&&Number(x.seen)>=0&&Number.isInteger(x.wrong)&&Number(x.wrong)>=0&&Number(x.wrong)<=Number(x.seen);
}
export function validHistory(x:unknown):boolean {
 return Array.isArray(x)&&x.every(h=>isRecord(h)&&typeof h.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(h.date)&&Number.isInteger(h.total)&&Number(h.total)>=0&&Number.isInteger(h.correct)&&Number(h.correct)>=0&&Number(h.correct)<=Number(h.total))&&new Set(x.map(h=>h.date)).size===x.length;
}
export function validState(x:unknown):x is StudyState {
 if(!isRecord(x))return false;
 return isRecord(x.reviews)&&Object.values(x.reviews).every(validReview)&&Array.isArray(x.stars)&&x.stars.every(v=>typeof v==='string'&&v.length<160)&&new Set(x.stars).size===x.stars.length&&validHistory(x.history)&&isRecord(x.notes)&&Object.values(x.notes).every(n=>typeof n==='string'&&n.length<=10000)&&typeof x.goal==='number'&&Number.isFinite(x.goal)&&x.goal>0&&x.goal<=500&&typeof x.dark==='boolean';
}
