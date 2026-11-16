import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {db,digest} from '../lib/core.js';import {del} from '@vercel/blob';
const env=await readFile('.env.local','utf8');for(const line of env.split(/\r?\n/)){const m=line.match(/^([A-Z_]+)="?(.*?)"?$/);if(m)process.env[m[1]]=m[2].replace(/\\n/g,'\n')}
const base=process.argv[2]||'http://127.0.0.1:4173';let password='';process.stdin.setRawMode(true);console.log('Ready for test password on hidden stdin.');password=await new Promise(resolve=>{let value='';const onData=chunk=>{value+=chunk.toString();if(/[\r\n]/.test(value)){process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();resolve(value.trim())}};process.stdin.on('data',onData)});
let session='',photo=null,upload=null;const sql=db();
async function call(action,method='GET',data,withSession=true,origin=base){const response=await fetch(`${base}/api/admin?action=${action}`,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),Origin:origin,...(withSession&&session?{Cookie:session}:{})},body:data?JSON.stringify(data):undefined});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')}}
try{
 assert.equal((await call('data')).status,401);
 assert.equal((await call('login','POST',{username:'admin',password},false,'https://invalid.example')).status,403);
 assert.equal((await call('login','POST',{username:'admin',password:'wrong-password'})).status,401);
 const login=await call('login','POST',{username:'admin',password});assert.equal(login.status,200);assert.match(login.cookie,/HttpOnly/);assert.match(login.cookie,/Secure/);session=login.cookie.split(';')[0];
 const initial=await call('data');assert.equal(initial.status,200);assert.equal(initial.data.photos.filter(p=>!p.deleted_at).length,63);
 const file=(await readFile('dist/company-icon.png')).toString('base64');const up=await call('upload','POST',{image:file});assert.equal(up.status,201,up.data.error);upload=up.data;
 const created=await call('photo','POST',{title:'Temporary verification photo',category:'interior',visible:false,sort_order:99999,upload_id:upload.id});assert.equal(created.status,201,created.data.error);photo=created.data;
 let publicData=await fetch(`${base}/api/portfolio`).then(r=>r.json());assert(!publicData.photos.some(p=>p.id===photo.id));
 assert.equal((await call('photo','PUT',{id:photo.id,title:'Edited verification photo',category:'signage',visible:true,sort_order:99998})).status,200);
 publicData=await fetch(`${base}/api/portfolio`).then(r=>r.json());assert(publicData.photos.some(p=>p.id===photo.id&&p.title==='Edited verification photo'&&p.category==='signage'));
 assert.equal((await call('photo','DELETE',{id:photo.id})).status,200);publicData=await fetch(`${base}/api/portfolio`).then(r=>r.json());assert(!publicData.photos.some(p=>p.id===photo.id));
 assert.equal((await call('restore','POST',{id:photo.id})).status,200);publicData=await fetch(`${base}/api/portfolio`).then(r=>r.json());assert(publicData.photos.some(p=>p.id===photo.id));
 assert.equal((await call('logout','POST',{})).status,200);assert.equal((await call('data')).status,401);
 console.log('PASS: login, cookie, unauthorized access, cross-origin rejection, upload, create, edit, category, publish, hide, delete, restore, logout.');
}finally{
 if(photo)await sql`DELETE FROM wp_photos WHERE id=${photo.id}`;
 if(upload){await del([upload.full_url,upload.thumb_url]);await sql`DELETE FROM wp_uploads WHERE id=${upload.id}`}
 if(session)await sql`DELETE FROM wp_sessions WHERE token_hash=${digest(session.slice(11))}`;
 console.log('Temporary verification records and files cleaned up.');
}
