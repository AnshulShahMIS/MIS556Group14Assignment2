// Render citations as text and HTTPS anchors; no generated HTML is evaluated.
export function appendJobLinks(target,text,document=target.ownerDocument){
 const value=String(text||'');let from=0;
 for(const match of value.matchAll(/https:\/\/[^\s<>"\]\)]+/g)){
  const url=match[0].replace(/[.,;!?]+$/,'');
  target.append(document.createTextNode(value.slice(from,match.index)));
  const a=document.createElement('a');a.textContent=url;a.href=url;a.target='_blank';a.rel='noopener noreferrer';target.append(a);
  from=match.index+url.length;
 }
 target.append(document.createTextNode(value.slice(from)));
}
