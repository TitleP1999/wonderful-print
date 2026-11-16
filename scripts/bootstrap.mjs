import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {db,hashPassword} from '../lib/core.js';
const text=await readFile('.env.local','utf8');for(const line of text.split(/\r?\n/)){const m=line.match(/^([A-Z_]+)="?(.*?)"?$/);if(m)process.env[m[1]]=m[2].replace(/\\n/g,'\n')}
let password='';if(process.stdin.isTTY){process.stdin.setRawMode(true);console.log('Ready for initial password on hidden stdin.');password=await new Promise(resolve=>{let input='';const onData=chunk=>{input+=chunk.toString();if(/[\r\n]/.test(input)){process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();resolve(input.trim())}};process.stdin.on('data',onData)})}else{for await(const chunk of process.stdin)password+=chunk;password=password.trim()}if(password.length<8)throw Error('Initial password required on stdin');
const sql=db();
await sql`CREATE TABLE IF NOT EXISTS wp_categories (key text PRIMARY KEY,label text NOT NULL,sort_order integer NOT NULL DEFAULT 0)`;
await sql`CREATE TABLE IF NOT EXISTS wp_photos (id text PRIMARY KEY,title text NOT NULL,category text NOT NULL REFERENCES wp_categories(key),thumb_url text NOT NULL,full_url text NOT NULL,width integer NOT NULL,height integer NOT NULL,visible boolean NOT NULL DEFAULT true,sort_order integer NOT NULL DEFAULT 0,deleted_at timestamptz,updated_at timestamptz NOT NULL DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS wp_users (id uuid PRIMARY KEY,username text UNIQUE NOT NULL,password_hash text NOT NULL)`;
await sql`CREATE TABLE IF NOT EXISTS wp_sessions (id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES wp_users(id),token_hash text UNIQUE NOT NULL,expires_at timestamptz NOT NULL)`;
await sql`CREATE TABLE IF NOT EXISTS wp_login_limits (key text PRIMARY KEY,attempts integer NOT NULL,window_start timestamptz NOT NULL)`;
await sql`CREATE TABLE IF NOT EXISTS wp_uploads (id uuid PRIMARY KEY,full_url text NOT NULL,thumb_url text NOT NULL,width integer NOT NULL,height integer NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`;
const labels={interior:'ผนังและกระจก',signage:'ป้ายโฆษณาและป้ายไฟ',display:'บูธและดิสเพลย์',standee:'สแตนดี้และป้ายตั้ง',vehicle:'สติกเกอร์ติดรถ',installation:'งานติดตั้งหน้างาน'};
let order=0;for(const [key,label] of Object.entries(labels)){await sql`INSERT INTO wp_categories (key,label,sort_order) VALUES (${key},${label},${order++}) ON CONFLICT (key) DO NOTHING`}
const photos=JSON.parse(await readFile('dist/portfolio.json','utf8'));
await sql.transaction(photos.map((p,i)=>sql`INSERT INTO wp_photos (id,title,category,thumb_url,full_url,width,height,sort_order) VALUES (${String(p.id)},${p.title},${p.category},${`/portfolio/${p.id}-thumb.webp`},${`/portfolio/${p.id}-full.webp`},${p.width},${p.height},${i}) ON CONFLICT (id) DO NOTHING`));
const hash=await hashPassword(password);await sql`INSERT INTO wp_users (id,username,password_hash) VALUES (${randomUUID()},'admin',${hash}) ON CONFLICT (username) DO NOTHING`;
const [count]=await sql`SELECT count(*) FROM wp_photos`;console.log(`Database ready; ${count.count} photos imported; admin account initialized.`);
