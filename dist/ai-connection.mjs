// A configured local server owns the credential; the browser never accepts one.
export function localAIEnabled(config,hostname=globalThis.location?.hostname){
 return ['localhost','127.0.0.1','[::1]'].includes(hostname)&&config?.configured===true;
}
