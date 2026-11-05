import test from 'node:test';import assert from 'node:assert/strict';
import {appendJobLinks} from '../dist/job-links.mjs';
import {encodeNode,decodeNode} from '../dist/chat-store.mjs';
function fakeDocument(){const document={baseURI:'https://example.com/',createTextNode(text){return {nodeType:3,textContent:text};},createElement(tag){return {nodeType:1,localName:tag,ownerDocument:document,attributes:{},childNodes:[],append(...nodes){this.childNodes.push(...nodes);},setAttribute(k,v){this.attributes[k]=v;},hasAttribute(k){return k in this.attributes;},getAttribute(k){return k==='href'?this.href:this.attributes[k];}};}};return document;}
test('posting URLs are clickable without interpreting generated HTML or script URLs',()=>{
 const d=fakeDocument(),p=d.createElement('p');appendJobLinks(p,'Apply: https://jobs.lever.co/example/123. <script>bad()</script> javascript:alert(1)',d);
 const links=p.childNodes.filter(n=>n.localName==='a');assert.equal(links.length,1);assert.equal(links[0].href,'https://jobs.lever.co/example/123');assert.equal(links[0].rel,'noopener noreferrer');assert.equal(p.childNodes.some(n=>n.localName==='script'),false);
 const restored=decodeNode(encodeNode(p),d);const a=restored.childNodes.find(n=>n.localName==='a');assert.equal(a.href,links[0].href);assert.equal(a.target,'_blank');
});
