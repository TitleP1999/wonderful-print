import {getContent} from '../lib/content.js';import {send,report} from '../lib/core.js';
export default async function handler(req,res){try{if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});return send(res,200,await getContent())}catch(e){return report(res,e)}}
