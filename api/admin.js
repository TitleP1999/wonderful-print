import { randomBytes, randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import sharp from 'sharp';
import {getContent,updateContent,schema} from '../lib/content.js';
import {db,digest,hashPassword,checkPassword,send,error,body,sameOrigin,cookie,setSession,requireAdmin,photoInput,report} from '../lib/core.js';
export default async function handler(req,res){
 res.setHeader('X-Robots-Tag','noindex, nofollow');
 try{
  const action=String(req.query?.action||'session');
  if(!['GET','POST','PUT','DELETE'].includes(req.method))return send(res,405,{error:'Method not allowed'});
  if(req.method!=='GET')sameOrigin(req);
  const sql=db();
  if(action==='login'&&req.method==='POST'){
   const data=body(req);const ip=digest(String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0]);
   const [attempt]=await sql`INSERT INTO wp_login_limits (key,attempts,window_start) VALUES (${ip},1,now()) ON CONFLICT (key) DO UPDATE SET attempts=CASE WHEN wp_login_limits.window_start<now()-interval '15 minutes' THEN 1 ELSE wp_login_limits.attempts+1 END,window_start=CASE WHEN wp_login_limits.window_start<now()-interval '15 minutes' THEN now() ELSE wp_login_limits.window_start END RETURNING attempts`;
   if(attempt.attempts>8)error(429,'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที');
   const users=await sql`SELECT id,password_hash FROM wp_users WHERE username=${typeof data.username==='string'?data.username.slice(0,80):''}`;
   const valid=await checkPassword(data.password,users[0]?.password_hash||'00000000000000000000000000000000:'+ '0'.repeat(128));
   if(!users.length||!valid)error(401,'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
   const token=randomBytes(32).toString('hex');await sql`INSERT INTO wp_sessions (id,user_id,token_hash,expires_at) VALUES (${randomUUID()},${users[0].id},${digest(token)},now()+interval '8 hours')`;
   await sql`DELETE FROM wp_login_limits WHERE key=${ip}`;setSession(res,token);return send(res,200,{ok:true});
  }
  const admin=await requireAdmin(req);
  if(action==='session'&&req.method==='GET')return send(res,200,{username:admin.username});
  if(action==='content'&&req.method==='GET')return send(res,200,{...await getContent(),schema:{groups:schema.groups,fields:schema.fields}});
  if(action==='content'&&req.method==='PUT')return send(res,200,await updateContent(body(req)));
  if(action==='logout'&&req.method==='POST'){await sql`DELETE FROM wp_sessions WHERE token_hash=${digest(cookie(req))}`;setSession(res,'',true);return send(res,200,{ok:true})}
  if(action==='data'&&req.method==='GET'){
   const [photos,categories]=await Promise.all([sql`SELECT p.*,c.label AS category_label FROM wp_photos p JOIN wp_categories c ON c.key=p.category ORDER BY p.sort_order,p.id`,sql`SELECT * FROM wp_categories ORDER BY sort_order,key`]);
   return send(res,200,{photos,categories});
  }
  if(action==='upload'&&req.method==='POST'){
   const data=body(req);if(typeof data.image!=='string'||data.image.length>4200000||!/^[A-Za-z0-9+/]+={0,2}$/.test(data.image))error(400,'ไฟล์รูปไม่ถูกต้องหรือใหญ่เกินไป');
   const bytes=Buffer.from(data.image,'base64');if(bytes.length>3000000)error(400,'กรุณาใช้รูปขนาดไม่เกิน 3 MB');
   let full,thumb,meta;
   try{const input=sharp(bytes,{limitInputPixels:40000000,animated:false});meta=await input.metadata();if(!['jpeg','png','webp'].includes(meta.format))error(400,'รองรับเฉพาะ JPG, PNG และ WebP');full=await input.rotate().resize(1800,1800,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();thumb=await sharp(full).resize(760,760,{fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer()}catch(e){if(e.status)throw e;error(400,'ไฟล์นี้เปิดเป็นรูปภาพไม่ได้')}
   const id=randomUUID();const [large,small]=await Promise.all([put(`portfolio/${id}/full.webp`,full,{access:'public',contentType:'image/webp',addRandomSuffix:false}),put(`portfolio/${id}/thumb.webp`,thumb,{access:'public',contentType:'image/webp',addRandomSuffix:false})]);
   const [upload]=await sql`INSERT INTO wp_uploads (id,full_url,thumb_url,width,height) VALUES (${id},${large.url},${small.url},${meta.width},${meta.height}) RETURNING *`;
   return send(res,201,upload);
  }
  if(action==='photo'&&['POST','PUT'].includes(req.method)){
   const data=body(req);const value=photoInput(data);if(!(await sql`SELECT key FROM wp_categories WHERE key=${value.category}`).length)error(400,'ไม่พบหมวดหมู่');
   let upload=null;if(data.upload_id){[upload]=await sql`SELECT * FROM wp_uploads WHERE id=${String(data.upload_id)}`;if(!upload)error(400,'ไม่พบรูปที่อัปโหลด')}
   if(req.method==='POST'){
    if(!upload)error(400,'กรุณาอัปโหลดรูปก่อน');
    const [photo]=await sql`INSERT INTO wp_photos (id,title,category,thumb_url,full_url,width,height,visible,sort_order) VALUES (${randomUUID()},${value.title},${value.category},${upload.thumb_url},${upload.full_url},${upload.width},${upload.height},${value.visible},${value.sort}) RETURNING *`;
    return send(res,201,photo);
   }
   const [existing]=await sql`SELECT * FROM wp_photos WHERE id=${String(data.id)}`;if(!existing)error(404,'ไม่พบผลงาน');
   const [photo]=await sql`UPDATE wp_photos SET title=${value.title},category=${value.category},visible=${value.visible},sort_order=${value.sort},thumb_url=${upload?.thumb_url||existing.thumb_url},full_url=${upload?.full_url||existing.full_url},width=${upload?.width||existing.width},height=${upload?.height||existing.height},updated_at=now() WHERE id=${existing.id} RETURNING *`;
   return send(res,200,photo);
  }
  if(action==='photo'&&req.method==='DELETE'){
   const data=body(req);const [row]=await sql`UPDATE wp_photos SET deleted_at=now(),updated_at=now() WHERE id=${String(data.id)} RETURNING id`;if(!row)error(404,'ไม่พบผลงาน');return send(res,200,{ok:true});
  }
  if(action==='restore'&&req.method==='POST'){const data=body(req);await sql`UPDATE wp_photos SET deleted_at=null,updated_at=now() WHERE id=${String(data.id)}`;return send(res,200,{ok:true})}
  if(action==='category'&&['POST','PUT'].includes(req.method)){
   const data=body(req);const label=typeof data.label==='string'?data.label.trim():'';if(!label||label.length>80)error(400,'ชื่อหมวดหมู่ต้องมี 1–80 ตัวอักษร');
   if(req.method==='POST'){const [category]=await sql`INSERT INTO wp_categories (key,label,sort_order) VALUES (${`category-${randomBytes(6).toString('hex')}`},${label},100) RETURNING *`;return send(res,201,category)}
   const [category]=await sql`UPDATE wp_categories SET label=${label} WHERE key=${String(data.key)} RETURNING *`;if(!category)error(404,'ไม่พบหมวดหมู่');return send(res,200,category);
  }
  if(action==='password'&&req.method==='POST'){
   const data=body(req);if(typeof data.password!=='string'||data.password.length<8||data.password.length>128)error(400,'รหัสผ่านใหม่ต้องมี 8–128 ตัวอักษร');
   const [user]=await sql`SELECT password_hash FROM wp_users WHERE id=${admin.user_id}`;if(!await checkPassword(data.current,user.password_hash))error(400,'รหัสผ่านปัจจุบันไม่ถูกต้อง');
   const hash=await hashPassword(data.password);await sql`UPDATE wp_users SET password_hash=${hash} WHERE id=${admin.user_id}`;await sql`DELETE FROM wp_sessions WHERE user_id=${admin.user_id}`;setSession(res,'',true);return send(res,200,{ok:true});
  }
  return send(res,404,{error:'ไม่พบรายการ'});
 }catch(e){return report(res,e)}
}
