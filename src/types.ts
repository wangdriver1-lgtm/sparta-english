export type Word={word:string;meaning:string;pos:string;example:string;definition?:string;phonetic?:string;source:string;url?:string};
export type News={title:string;url:string;published:string};
export type Daily={day:string;updatedAt:string;words:Word[];news:News[];newsOk:boolean;dictionaryOk:boolean;officialOk:boolean;officialUrl:string;scheduled:boolean};
export type Progress={version:1;level:number;advancedWeek:string|null;attendance:string[];completions:{lesson:number;score:number;day:string}[];saved:{word:string;day:string;payload:string}[];name:string};
