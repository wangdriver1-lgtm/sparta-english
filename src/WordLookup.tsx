import {useEffect,useState} from 'react';
import {BookOpen,X} from 'lucide-react';
import {lookupWord,type WordExplanation} from './glossary';

export function WordLookup({children,hint=false}:{children:React.ReactNode;hint?:boolean}){
 const [popup,setPopup]=useState<WordExplanation|null>(null);
 useEffect(()=>{if(!popup)return;const timer=window.setTimeout(()=>setPopup(null),3000);return()=>window.clearTimeout(timer);},[popup]);
 function show(scope:HTMLElement){
  const selection=window.getSelection();if(!selection?.rangeCount||selection.isCollapsed)return;
  const range=selection.getRangeAt(0);if(!scope.contains(range.commonAncestorContainer))return;
  const word=lookupWord(selection.toString());if(word)setPopup(word);
 }
 return <div className="word-lookup-scope" onDoubleClick={e=>{
  if((e.target as HTMLElement).closest('button,input,select,a,label,summary,.word-lookup-popup'))return;
  show(e.currentTarget);
 }} onKeyDown={e=>{
  if(e.key==='Escape'&&popup){e.preventDefault();e.stopPropagation();setPopup(null);}
  if(e.altKey&&e.key==='Enter'){e.preventDefault();show(e.currentTarget);}
 }}>
  {hint&&<p className="lookup-hint"><BookOpen size={13}/>Double-click a word for 中文 · closes after 3 seconds</p>}
  {children}
  {popup&&<aside className="word-lookup-popup" role="status" aria-live="polite" aria-atomic="true" lang="zh-Hant" aria-label="單字中文與說明">
   <div className="lookup-popup-head"><strong lang="en">{popup.word}</strong><button type="button" className="icon-btn" aria-label="關閉單字解釋" onClick={()=>setPopup(null)}><X size={16}/></button></div>
   <p className="lookup-meaning">{popup.meaning}</p><p className="lookup-explanation">{popup.explanation}</p>
   {popup.example&&<p className="lookup-example" lang="en">{popup.example}</p>}
   <small>約 3 秒後自動關閉</small>
  </aside>}
 </div>;
}
