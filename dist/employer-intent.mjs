export function wantsEmployerResearch(message){
 const value=String(message||'');if(/\b(?:do not|don.t|stop)\s+(?:research|look up)/i.test(value))return false;
 return /\bresearch (?:an? |the |this )?(?:employer|company)\b|\bemployer research\b|\b(?:research|look up|company briefing (?:on|for)|tell me about the company|learn about)\b.{1,140}/i.test(value);
}
