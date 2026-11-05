import {colSnapshot,colMetros} from './offer-col.mjs';
export const notListed='Not listed';
export const offerFields=['company','role','location','baseSalary','annualBonusTargetPct','annualBonus','signingBonus','relocation','equityTotalValue','vestingYears','cliffYears','retirementMatchPct','retirementMatchCapPct','ptoDays','remotePolicy','startDate','expiresOn','notes'];
const numeric=new Set(['baseSalary','annualBonusTargetPct','annualBonus','signingBonus','relocation','equityTotalValue','vestingYears','cliffYears','retirementMatchPct','retirementMatchCapPct','ptoDays']);
const missing=v=>v===undefined||v===null||v===''||v===notListed;
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export const wantsOfferHelp=text=>/\b(offers?|compensation|negotia(?:te|tion|ting)|vesting|signing bonus|salary package)\b/i.test(text)&&!/\b(?:job postings?|find jobs|job search)\b/i.test(text);
export function validateOffers(input){
 if(!Array.isArray(input)||input.length<1||input.length>4)throw Error('Enter between 1 and 4 offers.');
 return input.map((raw,i)=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Offer '+(i+1)+' must be an object.');
  if(Object.keys(raw).some(k=>!offerFields.includes(k)))throw Error('Offer '+(i+1)+' contains an unknown field.');
  const out={};for(const key of offerFields){const value=raw[key];if(missing(value)){out[key]=notListed;continue;}
   if(numeric.has(key)){
    if((typeof value!=='number'&&typeof value!=='string')||!/^\d+(?:\.\d+)?$/.test(String(value).trim())||!Number.isFinite(Number(value)))throw Error(key+' must be a non-negative number without currency symbols.');
    const n=Number(value);if(n<0||n>1e9)throw Error(key+' is outside the supported range.');if(key==='baseSalary'&&n>2000000)throw Error('Base salary cannot exceed $2M.');
    if(key.endsWith('Pct')&&n>100)throw Error(key+' cannot exceed 100%.');if(key==='vestingYears'&&(n<=0||n>50))throw Error('vestingYears must be greater than 0 and at most 50.');if(key==='cliffYears'&&n>50)throw Error('cliffYears cannot exceed 50.');if(key==='ptoDays'&&n>366)throw Error('ptoDays cannot exceed 366.');out[key]=n;
   }else {if(typeof value!=='string'||value.length>(key==='notes'?4000:240))throw Error('Invalid '+key+'.');out[key]=value.trim()||notListed;}
   if(['startDate','expiresOn'].includes(key)&&out[key]!==notListed&&(!/^\d{4}-\d{2}-\d{2}$/.test(out[key])||!Number.isFinite(Date.parse(out[key]+'T00:00:00Z'))||new Date(out[key]+'T00:00:00Z').toISOString().slice(0,10)!==out[key]))throw Error(key+' must be a valid YYYY-MM-DD date.');
  }
  if(out.cliffYears!==notListed&&out.cliffYears>(out.vestingYears===notListed?4:out.vestingYears))throw Error('cliffYears cannot exceed vestingYears.');
  if(out.annualBonus!==notListed&&out.annualBonusTargetPct!==notListed)throw Error('Supply annualBonus OR annualBonusTargetPct, not both.');
  return out;
 });
}
export function offersFromMessage(message){
 // Explicit JSON is the chat interchange format. Natural-language figures are never guessed.
 const clean=String(message).trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 if(!clean.startsWith('{')&&!clean.startsWith('['))return null;
 let data;try{data=JSON.parse(clean);}catch{return null;}
 if(!Array.isArray(data)&&!Array.isArray(data?.offers))return null;
 return validateOffers(Array.isArray(data)?data:data.offers);
}
export function compareOffers(input,{now=new Date()}={}){
 const offers=validateOffers(input).map((o,index)=>{
  const missingFields=offerFields.filter(k=>o[k]===notListed),flags=[],assumptions=['USD; gross nominal amounts, before taxes and deductions.','Four full service years at unchanged base salary and target bonus; targets are not guaranteed.','Unknown amounts are excluded only from disclosed subtotals; complete totals remain Not listed.'];
  const base=o.baseSalary,bonus=o.annualBonus!==notListed?o.annualBonus:o.annualBonusTargetPct!==notListed&&base!==notListed?base*o.annualBonusTargetPct/100:notListed;
  const vesting=o.vestingYears===notListed?4:o.vestingYears;if(o.vestingYears===notListed)assumptions.push('Default vestingYears = 4; verify the actual schedule.');
  let equity1=notListed,equity4=notListed;
  if(o.equityTotalValue===0){equity1=equity4=0;}else if(o.equityTotalValue!==notListed&&o.cliffYears!==notListed){
   const vested=t=>t<o.cliffYears?0:o.equityTotalValue*Math.min(1,t/vesting);equity1=vested(1);equity4=vested(4);assumptions.push('Equity vests linearly with catch-up at the cliff; verify actual grant terms, valuation, liquidity and continued service. Equity value held constant, not guaranteed cash.');
  }
  if(o.equityTotalValue>0&&(o.vestingYears===notListed||o.cliffYears===notListed))flags.push('Equity vesting information missing: verify schedule and cliff.');
  let retirement=notListed;if(o.retirementMatchPct===0||o.retirementMatchCapPct===0)retirement=0;
  else if(base!==notListed&&o.retirementMatchPct!==notListed&&o.retirementMatchCapPct!==notListed){retirement=base*o.retirementMatchPct/100*o.retirementMatchCapPct/100;assumptions.push('Match rate applies to employee contributions up to the stated percent of base. Assumes the employee contributes that cap; verify plan limits, eligibility and employer vesting.');}
  const components=[base,bonus,o.signingBonus,o.relocation,equity1,retirement],four=[base===notListed?notListed:4*base,bonus===notListed?notListed:4*bonus,o.signingBonus,o.relocation,equity4,retirement===notListed?notListed:4*retirement];
  const sum=values=>round(values.filter(v=>typeof v==='number').reduce((a,b)=>a+b,0)),total=values=>values.includes(notListed)?notListed:sum(values);
  const yearOneTotal=total(components),fourYearTotal=total(four),knownYearOneTotal=sum(components),knownFourYearTotal=sum(four);
  assumptions.push('Signing bonus and relocation are counted once; no future raises, promotions or tax estimates.');
  const key=o.location.toLowerCase().replace(/\s+/g,' ').trim(),metro=colMetros.find(m=>m.aliases.some(a=>a.toLowerCase()===key));
  const costOfLivingIndex=metro?.index??'unknown location',adjust=n=>metro&&typeof n==='number'?round(n*100/metro.index):notListed;
  if(metro?.name==='Remote (US)')assumptions.push('Remote (US) uses national reference 100, not the price level at the worker’s residence.');
  if(o.signingBonus>0)flags.push('Signing bonus: verify repayment / clawback conditions.');if(o.ptoDays===notListed)flags.push('PTO not listed.');if(bonus===notListed)flags.push('Bonus details not listed.');
  if(o.expiresOn!==notListed){const days=(Date.parse(o.expiresOn+'T00:00:00Z')-Date.parse(new Date(now).toISOString().slice(0,10)+'T00:00:00Z'))/86400000;if(days<0)flags.push('Offer deadline has passed: verify current availability.');else if(days<=7)flags.push('Offer expires within 7 days: confirm the deadline and ask about time to review.');}
  flags.push('Verify relocation terms, written expiry, employment / at-will clauses and benefit eligibility; seek qualified advice for legal questions.');
  return {...o,index:index+1,missing:missingFields,yearOneTotal,fourYearTotal,knownYearOneTotal,knownFourYearTotal,components:{bonus:typeof bonus==='number'?round(bonus):bonus,yearOneEquity:typeof equity1==='number'?round(equity1):equity1,fourYearEquity:typeof equity4==='number'?round(equity4):equity4,annualRetirement:typeof retirement==='number'?round(retirement):retirement},costOfLivingIndex,metro:metro?.name||'unknown location',colAdjustedBase:adjust(base),colAdjustedYearOne:adjust(yearOneTotal),flags,assumptions};
 });
 const ranking=key=>{const sorted=offers.filter(o=>typeof o[key]==='number').sort((a,b)=>b[key]-a[key]);return sorted.map((o,i)=>({rank:i+1,index:o.index,company:o.company,value:o[key],differenceDollars:round(sorted[0][key]-o[key]),differencePercent:o[key]===0?notListed:round((sorted[0][key]-o[key])/o[key]*100)}));};
 return {offers,comparison:{byYearOne:ranking('yearOneTotal'),byColAdjustedYearOne:ranking('colAdjustedYearOne'),basis:'Complete disclosed totals only. Difference is leader minus this offer; percent uses this offer as denominator. Incomplete offers are unranked.'},colSource:colSnapshot,notice:'Comparison aid, not financial or legal advice. COL is approximate and dated; personal costs and priorities differ. The tool does not choose an offer.'};
}
export function draftNegotiation({offers,offer='1',reasons='',ask=''},suppliedText=''){
 const report=compareOffers(offers),chosen=report.offers[Number(offer)-1];if(!chosen)throw Error('Choose an offer number from 1 to '+report.offers.length+'.');
 const clean=(value,placeholder)=>{if(typeof value!=='string'||value.length>2000)throw Error('Negotiation text must be under 2000 characters.');const v=value.trim();return v&&String(suppliedText).includes(v)?v:placeholder;};
 // Allow reasons / asks verbatim only when present in original student text, never a coordinator task or model output.
 const reason=clean(reasons,'[your stated, supportable reason]'),request=clean(ask,'[your requested compensation or benefit change]');
 return {text:'Subject: Discussion of '+chosen.company+' offer\n\nHello [recruiter name],\n\nThank you for the '+(chosen.role===notListed?'[role]':chosen.role)+' offer at '+chosen.company+'. I appreciate the opportunity. Based on '+reason+', would you be open to discussing '+request+'?\n\nI would welcome a conversation about what is possible. Thank you for considering my request.\n\nBest,\n[your name]',notice:'Review every claim and placeholder before sending. No market salary estimate is supplied. Nothing is sent automatically.'};
}
