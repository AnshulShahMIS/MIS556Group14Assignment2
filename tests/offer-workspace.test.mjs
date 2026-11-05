import test from 'node:test';
import assert from 'node:assert/strict';
import {createOffersPanel} from '../dist/offer-workspace.mjs';
import {createWorkspaceStore,workspaceKey} from '../dist/workspace-store.mjs';
import {mountWorkspace} from '../dist/workspace-ui.mjs';
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.listeners={};this.dataset={};this.value='';this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join(' ');}
 append(...children){this.children.push(...children);}replaceChildren(...children){this._text='';this.children=[...children];}setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,fn){this.listeners[k]=fn;}focus(){}after(){}
 querySelector(selector){return all(this).find(n=>selector.startsWith('#')&&n.id===selector.slice(1))||null;}
 fire(name){return this.listeners[name]?.({preventDefault(){}});}
}
const all=node=>[node,...node.children.flatMap(all)];
const find=(node,tag,text)=>all(node).find(n=>n.tagName===tag&&n.textContent===text);
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
test('Offers form renders, validates, saves, compares, edits and deletes offline with no fetch or key',()=>{
 const storage=memory(),store=createWorkspaceStore(storage),panel=new Element('section'),document={createElement:tag=>new Element(tag)},notices=[];let sent;
 const ui=createOffersPanel({document,panel,store,notify:text=>notices.push(text),discuss:offers=>{sent=offers;},now:()=>new Date('2026-11-05')});ui.render();assert.match(panel.textContent,/without an API key/);
 find(panel,'button','Add an offer').fire('click');let form=find(panel,'form',undefined)||all(panel).find(n=>n.tagName==='form');form.fire('submit');assert.equal(store.read().offers.length,0);assert.match(panel.textContent,/Enter Company/);
 const fill=(name,value)=>{const input=all(panel).find(n=>n.name===name);input.value=String(value);input.fire('input');};
 fill('company','Fictional Alpha');fill('baseSalary',100000);fill('location','Remote (US)');for(const key of ['annualBonus','signingBonus','relocation','equityTotalValue','retirementMatchPct'])fill(key,0);form.fire('submit');assert.equal(store.read().offers.length,1);assert.match(panel.textContent,/\$100,000/);assert.ok(all(panel).some(n=>n.tagName==='table'));
 find(panel,'button','Discuss with coach').fire('click');assert.equal(sent[0].baseSalary,100000);assert.equal(sent[0].id,undefined);
 find(panel,'button','Edit Fictional Alpha').fire('click');fill('baseSalary',110000);all(panel).find(n=>n.tagName==='form').fire('submit');assert.equal(store.read().offers[0].baseSalary,110000);ui.render();assert.match(panel.textContent,/\$110,000/);assert.ok(storage.getItem(workspaceKey));
 find(panel,'button','Delete Fictional Alpha').fire('click');assert.equal(store.read().offers.length,0);assert.match(panel.textContent,/No offers yet/);
});
test('actual Offers tab mounts in practice mode and opens the offline comparison panel',()=>{
 const workspace=new Element('main'),header=new Element('header'),chat=new Element('div'),composer=new Element('div');const nodes={'.workspace':workspace,'.workspace > header':header,'#chat-scroll':chat,'.composer-area':composer};const previous={document:globalThis.document,window:globalThis.window};
 globalThis.document={createElement:tag=>new Element(tag),querySelector:selector=>nodes[selector]};globalThis.window={addEventListener(){}};
 try{const ui=mountWorkspace({storage:memory(),isAIEnabled:()=>false,getChatId:()=>'',notify:()=>{},ask:()=>{throw Error('Offline tab must not request AI.');}});ui.showOffers();const panel=workspace.children.find(n=>n.id==='workspace-offers');assert.equal(panel.hidden,false);assert.match(panel.textContent,/Add an offer/);assert.match(panel.textContent,/no API key is needed/);}finally{Object.assign(globalThis,previous);}
});
test('offer limit and corrupt saved offers never overwrite existing work',()=>{const storage=memory(),s=createWorkspaceStore(storage);for(let i=0;i<4;i++)s.saveOffer({company:'Fictional '+i,baseSalary:80000,location:'Remote (US)'});assert.throws(()=>s.saveOffer({company:'Fifth',baseSalary:90000,location:'Remote (US)'}),/up to 4/);assert.equal(s.read().offers.length,4);const previous=storage.getItem(workspaceKey);assert.throws(()=>s.saveOffer({company:'bad',baseSalary:-1}));assert.equal(storage.getItem(workspaceKey),previous);});
