import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {bank} from '../src/wordbank.ts';
import {taipeiDay,dayIndex} from '../src/training.ts';
export function clean(s){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();}
export function parseFeed(xml){return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0,6).map(m=>{const field=n=>clean(m[1].match(new RegExp('<'+n+'>([\\s\\S]*?)<\\/'+n+'>'))?.[1]||'');return {title:field('title').split(/\s+/).slice(0,22).join(' '),url:field('link'),published:field('pubDate')};}).filter(n=>n.title&&/^https:\/\/(www\.)?bbc\.(com|co\.uk)\//.test(n.url));}
export function workplaceWords(day){return Array.from({length:6},(_,i)=>{const w=bank[(dayIndex(day)*6+i)%bank.length];return {word:w[0],meaning:w[1],pos:w[2],example:w[3],source:'TOEIC-style · original example'};});}
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'SpartaEnglish/1.0 (+GitHub Pages educational reader)'}});if(!r.ok)throw Error('HTTP '+r.status);return r;}
const file=new URL('../public/data/daily.json',import.meta.url);
export async function update(){
 let old={schemaVersion:1,sets:{}};try{old=JSON.parse(await readFile(file,'utf8'));}catch{}
 const today=taipeiDay(),tomorrow=new Date(Date.parse(today+'T00:00:00Z')+86400000).toISOString().slice(0,10);
 let news=[],newsOk=false,officialOk=false;
 await Promise.allSettled([(async()=>{const r=await get('https://feeds.bbci.co.uk/news/business/rss.xml');news=parseFeed(await r.text());newsOk=news.length>0;})(),(async()=>{await get('https://www.ets.org/toeic/about/listening-reading.html');officialOk=true;})()]);
 const stop=new Set('about after again against among before being could first government into latest their there these those under until where which while would people more over from have that this with will says said been business companies company million billion'.split(' '));
 const candidates=[...new Set(news.flatMap(n=>n.title.toLowerCase().match(/\b[a-z]{6,14}\b/g)||[]))].filter(w=>!stop.has(w)).slice(0,14);
 const dictionary=(await Promise.all(candidates.map(async word=>{try{const data=await(await get('https://api.dictionaryapi.dev/api/v2/entries/en/'+word)).json();const entry=data[0],m=entry?.meanings?.[0],d=m?.definitions?.[0];if(!d?.definition)return null;const n=news.find(n=>n.title.toLowerCase().includes(word));return {word,meaning:'時事單字 · English definition below',pos:m.partOfSpeech,definition:d.definition,example:d.example||'Context: '+n?.title,phonetic:entry.phonetic||'',source:'BBC headline + Free Dictionary API',url:n?.url};}catch{return null;}}))).filter(Boolean);
 for(const day of [today,tomorrow]){const words=workplaceWords(day),eligible=dictionary.filter(w=>!words.some(x=>x.word===w.word));const offset=eligible.length?dayIndex(day)*2%eligible.length:0;const extras=Array.from({length:Math.min(2,eligible.length)},(_,i)=>eligible[(offset+i)%eligible.length]);const prior=old.sets[day];
 // Preserve a richer same-date snapshot if a provider fails on a retry.
 if(prior?.newsOk&&!newsOk){console.warn('Keeping previous news snapshot for '+day);continue;}
 old.sets[day]={day,updatedAt:new Date().toISOString(),words:[...words,...extras],news,newsOk,dictionaryOk:extras.length>0,officialOk,officialUrl:'https://www.ets.org/toeic/about/listening-reading.html',scheduled:true};
 }
 old.schemaVersion=1;old.updatedAt=new Date().toISOString();old.sets=Object.fromEntries(Object.entries(old.sets).sort(([a],[b])=>b.localeCompare(a)).slice(0,32));await mkdir(new URL('../public/data/',import.meta.url),{recursive:true});await writeFile(file,JSON.stringify(old,null,2)+'\n');console.log(`Updated ${today} and ${tomorrow}: ${news.length} news headlines, ${dictionary.length} verified headline words. Workplace vocabulary always available.`);if(!newsOk)console.warn('BBC RSS unavailable. Snapshot marks news as unavailable.');if(dictionary.length<2)console.warn('Dictionary yielded fewer than two verified words.');
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)await update();
