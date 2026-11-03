import {loadServerEnv} from './server-env.mjs';
import {createCoachServer} from './server-http.mjs';
loadServerEnv();
const port=Number(process.env.PORT||process.env.CAREER_COMPASS_PORT||4177);
const bindHost=process.env.PORT?'0.0.0.0':'127.0.0.1';
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('CAREER_COMPASS_PORT must be an integer from 1024 to 65535.');
createCoachServer().on('error',error=>{
 if(error.code==='EADDRINUSE'){console.error(`Port ${port} is already in use. If Career Compass is already running, open http://127.0.0.1:${port}. Otherwise choose another CAREER_COMPASS_PORT.`);}
 else console.error('Could not start the local server:',error.message);
 process.exitCode=1;
}).listen(port,bindHost,()=>console.log(`Career Compass listening on ${bindHost}:${port}.\n${process.env.OPENAI_API_KEY?'AI configured. Requests use the server-side key.':'Offline practice mode. Run Setup-API-Key.cmd to configure AI.'}`));
