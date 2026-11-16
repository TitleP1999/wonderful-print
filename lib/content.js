import {createRequire} from 'node:module';
import {db,error} from './core.js';
const require=createRequire(import.meta.url);
export const schema=require('./content-schema.json');
export async function getContent(){const [row]=await db()`SELECT data,version FROM wp_content WHERE id=1`;return {data:{...schema.defaults,...(row?.data||{})},version:row?.version||1}}
export async function updateContent(input){
 if(!schema.groups.some(group=>group.key===input.group)||!input.values||Array.isArray(input.values)||typeof input.values!=='object')error(400,'ข้อมูลส่วนเว็บไซต์ไม่ถูกต้อง');
 if(!Number.isSafeInteger(input.version))error(400,'เวอร์ชันข้อมูลไม่ถูกต้อง');
 const fields=schema.fields.filter(field=>field.group===input.group),values={};
 for(const field of fields){const raw=input.values[field.key];if(typeof raw!=='string')error(400,'กรุณาตรวจสอบ: '+field.label);const value=raw.trim();if((field.required&&!value)||value.length>field.max)error(400,'กรุณาตรวจสอบ: '+field.label);
  if(field.type==='url'){let url;try{url=new URL(value)}catch{error(400,'ลิงก์ไม่ถูกต้อง: '+field.label)}if(url.protocol!=='https:'||url.username||url.password)error(400,'กรุณาใช้ลิงก์ HTTPS: '+field.label)}
  if(field.type==='phone'&&(!/^[+0-9() .-]{5,35}$/.test(value)||value.replace(/\D/g,'').length<5))error(400,'เบอร์โทรศัพท์ไม่ถูกต้อง');
  if(field.type==='image'&&value!==schema.defaults[field.key]){const known=await db()`SELECT id FROM wp_uploads WHERE full_url=${value} OR thumb_url=${value}`;if(!known.length)error(400,'กรุณาอัปโหลดรูปผ่านระบบ: '+field.label)}
  values[field.key]=value;
 }
 const [row]=await db()`UPDATE wp_content SET data=data || ${JSON.stringify(values)}::jsonb,version=version+1,updated_at=now() WHERE id=1 AND version=${input.version} RETURNING data,version`;
 if(!row)error(409,'มีการแก้ไขข้อมูลจากที่อื่น กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก');return {data:{...schema.defaults,...row.data},version:row.version};
}
