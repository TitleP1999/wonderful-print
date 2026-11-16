import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { neon } from '@neondatabase/serverless';
const scrypt=promisify(derive);
export const db=()=>neon(process.env.DATABASE_URL);
export const digest=value=>createHash('sha256').update(value).digest('hex');
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64);return `${salt}:${hash.toString('hex')}`}
export async function checkPassword(password,stored){if(typeof password!=='string'||password.length>200||!stored)return false;const [salt,hash]=stored.split(':');if(!salt||!hash)return false;const expected=Buffer.from(hash,'hex');const actual=await scrypt(password,salt,64);return actual.length===expected.length&&timingSafeEqual(actual,expected)}
export function send(res,status,data){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(data)}
export function error(status,message){const e=new Error(message);e.status=status;throw e}
export function body(req){if(!String(req.headers['content-type']||'').startsWith('application/json'))error(415,'กรุณาส่งข้อมูล JSON');let value;try{value=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{error(400,'ข้อมูล JSON ไม่ถูกต้อง')};if(!value||typeof value!=='object'||Array.isArray(value))error(400,'ข้อมูลไม่ถูกต้อง');return value}
export function sameOrigin(req){let origin;try{origin=new URL(req.headers.origin)}catch{error(403,'กรุณาทำรายการจากเว็บไซต์นี้')};if(origin.host!==req.headers.host||!['https:','http:'].includes(origin.protocol))error(403,'กรุณาทำรายการจากเว็บไซต์นี้')}
export function cookie(req){const value=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('wp_session='));return value?.slice(11)||''}
export function setSession(res,token,clear=false){res.setHeader('Set-Cookie',`wp_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${clear?0:28800}`)}
export async function requireAdmin(req){const token=cookie(req);if(!/^[a-f0-9]{64}$/.test(token))error(401,'กรุณาเข้าสู่ระบบ');const rows=await db()`SELECT s.id,s.user_id,u.username FROM wp_sessions s JOIN wp_users u ON u.id=s.user_id WHERE s.token_hash=${digest(token)} AND s.expires_at>now()`;if(!rows.length)error(401,'กรุณาเข้าสู่ระบบอีกครั้ง');return rows[0]}
export function photoInput(data){const title=typeof data.title==='string'?data.title.trim():'';const category=typeof data.category==='string'?data.category:'';if(!title||title.length>160)error(400,'กรุณาระบุชื่อผลงานไม่เกิน 160 ตัวอักษร');if(!/^[a-z][a-z0-9-]{0,49}$/.test(category))error(400,'หมวดหมู่ไม่ถูกต้อง');if(typeof data.visible!=='boolean')error(400,'สถานะเผยแพร่ไม่ถูกต้อง');const sort=Number(data.sort_order);if(!Number.isSafeInteger(sort)||sort<0||sort>100000)error(400,'ลำดับต้องเป็นเลข 0–100000');return {title,category,visible:data.visible,sort}}
export function report(res,e){if(!e.status)console.error('Admin operation failed:',e.code||e.name);return send(res,e.status||500,{error:e.status?e.message:'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง'})}
