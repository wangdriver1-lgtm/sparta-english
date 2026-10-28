import {bank} from './wordbank.ts';
import {taipeiDay,weekOf,canAdvance,lesson,dayIndex} from './training.ts';
import type {Progress,Daily,Word} from './types.ts';
export const progressKey='sparta-progress-v1';
const empty=():Progress=>({version:1,level:1,advancedWeek:null,attendance:[],completions:[],saved:[],name:'Learner'});
let snapshot:{sets:Record<string,Daily>}|null=null;
let loadedOn='';
export function validateProgress(input:unknown):Progress{
 if(!input||typeof input!=='object')throw Error('This file is not a SPARTA progress backup.');
 const v=input as Progress;const date=(d:unknown)=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d));
 if(v.version!==1||!Number.isInteger(v.level)||v.level<1||v.level>4||!(v.advancedWeek===null||date(v.advancedWeek))||!Array.isArray(v.attendance)||v.attendance.length>20000||!v.attendance.every(date)||new Set(v.attendance).size!==v.attendance.length||!Array.isArray(v.completions)||v.completions.length>4||!v.completions.every(c=>Number.isInteger(c.lesson)&&c.lesson>0&&c.lesson<=v.level&&Number.isInteger(c.score)&&c.score>=2&&c.score<=3&&date(c.day))||!Array.isArray(v.saved)||v.saved.length>5000||!v.saved.every(w=>typeof w.word==='string'&&w.word.length<80&&date(w.day)&&typeof w.payload==='string'&&w.payload.length<10000)||typeof v.name!=='string'||v.name.length>50)throw Error('This backup has invalid or unsupported progress data.');
 for(const s of v.saved){let w:Word;try{w=JSON.parse(s.payload);}catch{throw Error('This backup contains an invalid word.');}if(!w||w.word!==s.word||typeof w.meaning!=='string'||typeof w.example!=='string'||typeof w.pos!=='string')throw Error('This backup contains an invalid word.');}
 return {version:1,level:v.level,advancedWeek:v.advancedWeek,attendance:[...v.attendance],completions:v.completions.map(c=>({...c})),saved:v.saved.map(w=>({...w})),name:v.name};
}
export function readProgress(){const raw=localStorage.getItem(progressKey);if(!raw)return empty();try{return validateProgress(JSON.parse(raw));}catch{throw Error('Your saved progress could not be read. Export a backup from Reading preferences before making changes.');}}
function writeProgress(p:Progress){try{localStorage.setItem(progressKey,JSON.stringify(p));}catch{throw Error('Browser storage is unavailable or full. Enable storage, or export your current progress.');}}
export function importProgress(raw:string){if(raw.length>2000000)throw Error('Please choose a backup smaller than 2 MB.');let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw Error('Please choose a valid JSON backup.');}const value=validateProgress(parsed);let current:Progress;try{current=readProgress();}catch{current=empty();}const dates=[current.advancedWeek,value.advancedWeek].filter((d):d is string=>Boolean(d)).sort();const merged:Progress={version:1,name:value.name,level:Math.max(current.level,value.level),advancedWeek:dates.at(-1)||null,attendance:[...new Set([...current.attendance,...value.attendance])].sort(),completions:[...new Map([...current.completions,...value.completions].sort((a,b)=>a.score-b.score).map(c=>[c.lesson,c])).values()],saved:[...new Map([...current.saved,...value.saved].map(s=>[s.word,s])).values()]};writeProgress(merged);return merged;}
export function exportProgress(){const content=localStorage.getItem(progressKey)||JSON.stringify(empty());const blob=new Blob([content],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sparta-progress-'+taipeiDay()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function getDaily(day:string):Promise<Daily>{
 if(loadedOn!==day){try{const r=await fetch((import.meta.env?.BASE_URL||'./')+'data/daily.json',{cache:'no-cache',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('No snapshot');const s=await r.json();if(s.schemaVersion!==1||!s.sets)throw Error('Invalid snapshot');snapshot=s;loadedOn=day;}catch{loadedOn='';}}
 const value=snapshot?.sets?.[day];if(value&&Array.isArray(value.words)&&value.words.length>=6)return value;
 return {day,updatedAt:snapshot?Object.values(snapshot.sets).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt||'':'',words:Array.from({length:6},(_,i)=>{const w=bank[(dayIndex(day)*6+i)%bank.length];return {word:w[0],meaning:w[1],pos:w[2],example:w[3],source:'TOEIC-style · original example'};}),news:[],newsOk:false,dictionaryOk:false,officialOk:false,officialUrl:'https://www.ets.org/toeic/about/listening-reading.html',scheduled:false};
}
export async function localApi(body?:any,query=''):Promise<any>{
 const day=taipeiDay(),week=weekOf(day);let p=readProgress();
 if(body?.action==='checkin'){if(!p.attendance.includes(day)){p.attendance.push(day);writeProgress(p);}return p;}
 const daily=await getDaily(day);
 const getLesson=(id:number)=>{const l=lesson(id,day);if(!l)throw Error('Lesson not found.');
 // Two daily cloze exercises are created from the dated workplace word set.
 const dynamic=daily.words.slice(0,2).map((w,i)=>{const source=daily.words.slice(0,6);const shift=(dayIndex(day)+i)%4;const wrong=source.filter(x=>x.word!==w.word).slice(0,3).map(x=>x.word);const options=Array.from({length:4},(_,j)=>j===shift?w.word:wrong[j<shift?j:j-1]);return {prompt:w.example.replace(new RegExp('\\b'+w.word+'\\b','i'),'___'),options,answer:shift,explanation:w.word+' — '+w.meaning+'. '+w.example};});
 return {...l,questions:[l.questions[0],...dynamic]};};
 if(body?.action==='submit'){const id=Number(body.id);if(!Number.isInteger(id)||id<1||id>p.level)throw Error('This course is locked.');if(body.day!==day)throw Error('A new day has started. Reopen the lesson.');const l=getLesson(id);if(!Array.isArray(body.answers)||body.answers.length!==3||body.answers.some((a:any)=>!Number.isInteger(a)||a<0||a>3))throw Error('Answer every question first.');const score=l.questions.filter((q,i)=>q.answer===body.answers[i]).length;if(score>=2){const previous=p.completions.find(c=>c.lesson===id);p.completions=[...p.completions.filter(c=>c.lesson!==id),{lesson:id,score:Math.max(previous?.score||0,score),day}];writeProgress(p);}return {score,total:3,passed:score>=2,feedback:l.questions.map(q=>({answer:q.answer,explanation:q.explanation}))};}
 if(body?.action==='advance'){const count=p.attendance.filter(d=>weekOf(d)===week).length;if(!canAdvance(p.level,count,p.completions.some(c=>c.lesson===p.level),p.advancedWeek,week))throw Error('You need six different attendance days this week, a passed lesson, and no previous advancement this week.');p.level++;p.advancedWeek=week;writeProgress(p);return p;}
 if(body?.action==='saveWord'){const w=daily.words.find(w=>w.word===body.word);if(!w)throw Error('This word is not in today’s set.');if(!p.saved.some(s=>s.word===w.word)){p.saved.push({word:w.word,day,payload:JSON.stringify(w)});writeProgress(p);}return {saved:true};}
 if(body?.action==='name'){p.name=String(body.name).trim().slice(0,50)||'Learner';writeProgress(p);return p;}
 if(body)throw Error('Unknown action.');
 const id=Number(new URLSearchParams(query).get('lesson')||p.level);if(!Number.isInteger(id)||id<1||id>p.level)throw Error('This course is locked.');const l=getLesson(id);
 return {day,week,level:p.level,advancedWeek:p.advancedWeek,attendance:p.attendance.filter(d=>weekOf(d)===week),completions:p.completions,saved:p.saved,user:p.name,daily,lesson:{...l,questions:l.questions.map(({answer,explanation,...q})=>q)}};
}
