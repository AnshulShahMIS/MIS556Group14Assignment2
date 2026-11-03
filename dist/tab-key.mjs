export function normalizeVisitorKey(value){
 const key=String(value||'').trim();
 if(key.length>512||!/^sk-[A-Za-z0-9_-]{20,}$/.test(key))throw Error('Enter an OpenAI API key beginning with sk-.');
 return key;
}
// Per-tab closure only. No browser storage, chat state or exported key getter.
export function createTabKey(){
 let key='';
 return Object.freeze({
  set(value){key=normalizeVisitorKey(value);},
  clear(){key='';},
  has(){return Boolean(key);},
  headers(){return key?{Authorization:'Bearer '+key}:{};}
 });
}
