export function manualRequirementKey(value){
 return String(value).normalize('NFKC').toLowerCase().replace(/^[\s•*\-–—]+/u,'').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim().replace(/[.!?;:]+$/u,'').trim();
}
export function uniqueManualRequirements(lines){
 const seen=new Set();return lines.filter(line=>{const key=manualRequirementKey(line);if(!key||seen.has(key))return false;seen.add(key);return true;});
}
