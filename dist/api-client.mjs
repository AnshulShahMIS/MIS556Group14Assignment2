export function normalizeApiBase(value){
 if(value===undefined||value==='')return '';
 if(typeof value!=='string')throw Error('Invalid AI server address.');
 const url=new URL(value);
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if((url.protocol!=='https:'&&!(local&&url.protocol==='http:'))||url.username||url.password||url.search||url.hash)throw Error('Use an HTTPS AI server address without credentials, a query or a fragment.');
 return url.origin+url.pathname.replace(/\/$/,'');
}
export function apiEndpoint(base,path){
 if(!['/api/status','/api/chat'].includes(path))throw Error('Unknown AI endpoint.');
 return normalizeApiBase(base)+path;
}
export async function readApiBase(request=fetch,hostname=globalThis.location?.hostname){
 // Downloaded copies always use their own server, even with the Pages config present.
 if(['localhost','127.0.0.1','[::1]'].includes(hostname))return '';
 const response=await request(new URL('./api-config.json',import.meta.url),{cache:'no-store'});
 if(!response.ok)throw Error('AI connection settings could not be loaded.');
 const config=await response.json();return normalizeApiBase(config.apiBaseUrl);
}
