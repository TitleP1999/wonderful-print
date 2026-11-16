"""Prepare owner-supplied portfolio photos and a static, categorized gallery."""
from pathlib import Path
from PIL import Image, ImageOps
import json, html

root=Path(__file__).parent
source=Path('C:/Users/norrawit.p.JENPARKING/Desktop/img')
out=root/'dist/portfolio'
out.mkdir(exist_ok=True)
groups={
 'interior':('ผนังและกระจก', [967,970,973,975,976,981,982,983,986,987,989,995]),
 'signage':('ป้ายโฆษณาและป้ายไฟ',[971,974,985,999,1002,1005,1014,1016,1017,1021,1026]),
 'display':('บูธและดิสเพลย์',[977,978,980,984,988,991,992,993,994,997+30,1004,1013,1015,1020,1022,1024]),
 'standee':('สแตนดี้และป้ายตั้ง',[969,972,1007,1011,1025]),
 'vehicle':('สติกเกอร์ติดรถ',[997,998]),
 'installation':('งานติดตั้งหน้างาน',[996,999+1,1003,1006,1008,1009,1010,1018,1019]),
}
# Give process photographs their own home; completed work remains in its product category.
groups['display'][1].remove(1027) if 1027 in groups['display'][1] else None
groups['display'][1].append(1027)
titles={967:'กราฟิกตกแต่งห้องกิจกรรม',969:'สแตนดี้ไดคัตรูปหุ่นยนต์',970:'กราฟิกผนังธีมอวกาศ',971:'ป้ายไฟโฆษณาภายในร้าน',972:'ธงญี่ปุ่นพร้อมฐานตั้ง',973:'งานกราฟิกบนแผงตกแต่ง',974:'ป้ายประชาสัมพันธ์ภายนอกอาคาร',975:'กราฟิกตกแต่งผนังทางเดิน',976:'สติกเกอร์ติดกระจกสำนักงาน',977:'กราฟิกพื้นและเคาน์เตอร์สินค้า',978:'ดิสเพลย์และฉากหลังสินค้า',980:'ฉากหลังงานกิจกรรม',981:'กราฟิกผนังโค้งหน้าร้าน',982:'กราฟิกผนังพื้นที่การเรียนรู้',983:'สติกเกอร์กระจกหน้าร้าน',984:'กราฟิกพื้นและพื้นที่ส่งเสริมการขาย',985:'แบนเนอร์แขวนภายในศูนย์การค้า',986:'กราฟิกตกแต่งพื้นที่หน้าร้าน',987:'สติกเกอร์หน้าร้านและกระจก',988:'กราฟิกบูธจัดแสดงสินค้า',989:'สติกเกอร์กระจกพร้อมติดตั้ง',991:'ชุดดิสเพลย์ส่งเสริมการขาย',992:'เคาน์เตอร์และฉากหลังสินค้า',993:'ฉากหลังนิทรรศการ',994:'สื่อโฆษณาบนเสาภายในร้าน',995:'สติกเกอร์ประตูกระจก',996:'กราฟิกพื้นบริเวณหน้าร้าน',997:'สติกเกอร์โฆษณาบนรถบรรทุก',998:'สติกเกอร์รถขนส่งสินค้า',999:'ติดตั้งป้ายบนอาคาร',1000:'ติดตั้งกราฟิกในโชว์รูม',1002:'ป้ายหน้าร้านและสื่อส่งเสริมการขาย',1003:'งานติดตั้งกราฟิกพื้น',1004:'Backdrop งานกิจกรรม',1005:'กราฟิกโฆษณาขนาดใหญ่',1006:'ติดตั้งกราฟิกผนังหน้างาน',1007:'ป้ายลูกศรพร้อมขาตั้ง',1008:'ติดตั้งป้ายด้วยรถกระเช้า',1009:'งานติดตั้งภายในอาคาร',1010:'กราฟิกตกแต่งพื้นที่โชว์รูม',1011:'สแตนดี้ไดคัตประชาสัมพันธ์สินค้า',1013:'ดิสเพลย์และป้ายตั้งภายในร้าน',1014:'ป้ายแบรนด์ภายนอกศูนย์การค้า',1015:'ดิสเพลย์ส่งเสริมการขาย',1016:'ป้ายไฟพร้อมชั้นวางสินค้า',1017:'ป้ายหน้าร้านและป้ายยื่น',1018:'งานติดตั้งในพื้นที่สูง',1019:'ทีมติดตั้งกราฟิกขนาดใหญ่',1020:'บูธประชาสัมพันธ์สินค้า',1021:'ป้ายแบรนด์ไดคัต',1022:'ชั้นวางสินค้าและสื่อหน้าร้าน',1024:'ชั้นวางสินค้าพร้อมกราฟิก',1025:'ชิ้นงานไดคัตคาแรกเตอร์',1026:'ป้ายโฆษณาภายนอกอาคาร',1027:'กราฟิกบูธงานแสดงสินค้า'}
# Category assignment follows the visible work, without inferring production materials.
for n in [996,1003,1010]:
 groups['installation'][1].remove(n)
 groups['interior'][1].append(n)
groups['signage'][1].remove(999)
groups['installation'][1].append(999)
files=sorted(source.glob('S__*_0.jpg'))
records=[]
for path in files:
 n=int(path.stem.split('_')[2])-249896000
 category=next((k for k,(_,ids) in groups.items() if n in ids),None)
 if not category: raise ValueError(f'Uncategorized supplied photo: {path.name}')
 photo=ImageOps.exif_transpose(Image.open(path)).convert('RGB')
 for suffix,size,quality in [('thumb',760,78),('full',1800,85)]:
  resized=photo.copy();resized.thumbnail((size,size))
  resized.save(out/f'{n}-{suffix}.webp','WEBP',quality=quality,method=6)
 records.append({'id':n,'category':category,'title':titles[n],'width':photo.width,'height':photo.height})
assert len(records)==55 and len({r['id'] for r in records})==55
# Lead with a balanced selection, then retain every supplied photograph in the gallery.
featured=[967,978,1017,997,969,1004,987,1013,1008]
records.sort(key=lambda r:(featured.index(r['id']) if r['id'] in featured else 99,r['id']))
(root/'dist/portfolio.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
buttons='<button type="button" data-gallery-filter="all" aria-pressed="true" class="selected">ผลงานทั้งหมด <span>55</span></button>'
for key,(label,_) in groups.items():
 count=sum(r['category']==key for r in records)
 buttons+=f'<button type="button" data-gallery-filter="{key}" aria-pressed="false">{label} <span>{count}</span></button>'
cards=''
for i,r in enumerate(records):
 label=groups[r['category']][0];title=html.escape(r['title'])
 cards+=f'<article class="work-item" data-category="{r["category"]}"><button type="button" class="work-photo" data-full="portfolio/{r["id"]}-full.webp" aria-label="ดูภาพใหญ่: {title}"><img src="portfolio/{r["id"]}-thumb.webp" alt="{title}" width="{r["width"]}" height="{r["height"]}" loading="lazy" decoding="async"><span class="work-zoom" aria-hidden="true">↗</span></button><div class="work-meta"><span>{label}</span><h3>{title}</h3></div></article>'
section=f'<section class="section wrap portfolio-section" id="portfolio"><div class="sectionhead"><div><div class="eyebrow">SELECTED WORK / ผลงานและงานติดตั้ง</div><h2>Ideas made real.<br>Details that matter.</h2></div><p>ชมผลงานจริง ตั้งแต่งานพิมพ์และสื่อหน้าร้าน ไปจนถึงการติดตั้งหน้างาน เลือกประเภทงานที่คุณสนใจ แล้วคลิกภาพเพื่อดูรายละเอียด</p></div><div class="gallery-filters" role="group" aria-label="เลือกหมวดผลงาน">{buttons}</div><div class="gallery-summary"><p id="gallery-count" role="status">ผลงานทั้งหมด 55 ภาพ</p><span>PRINTED. CRAFTED. INSTALLED.</span></div><div class="work-grid">{cards}</div><button class="gallery-more" type="button" hidden>ดูผลงานเพิ่มเติม <span>↓</span></button></section>'
dialog='<dialog class="work-dialog" aria-labelledby="photo-title"><div class="lightbox-top"><div><span id="photo-category"></span><h2 id="photo-title"></h2></div><button type="button" class="photo-close" aria-label="ปิดภาพใหญ่">×</button></div><div class="photo-stage"><button type="button" class="photo-prev" aria-label="ภาพก่อนหน้า">←</button><img id="photo-full" alt=""><button type="button" class="photo-next" aria-label="ภาพถัดไป">→</button></div><p id="photo-position" aria-live="polite"></p></dialog>'
index=root/'dist/index.html';s=index.read_text(encoding='utf-8')
assert 'id="portfolio"' not in s
s=s.replace('<section class="section about"',section+'<section class="section about"')
s=s.replace('<a href="#about">เกี่ยวกับเรา</a>','<a href="#portfolio">ผลงาน</a><a href="#about">เกี่ยวกับเรา</a>')
old='<div class="pending">ข้อมูลช่องทางติดต่อและภาพผลงาน<br>จะอัปเดตเพิ่มเติมเร็ว ๆ นี้</div>'
contact='<div class="company-contact"><span class="contact-kicker">VISIT OUR STUDIO / ที่อยู่บริษัท</span><h3>บริษัท วันเดอร์ฟูล ปริ้น จำกัด</h3><address>52/80 ซ.ประชาอุทิศ 72<br>แขวงทุ่งครุ เขตทุ่งครุ<br>กรุงเทพมหานคร 10140</address><a class="map-link" href="https://maps.app.goo.gl/kxzQrbXobM6NofU8A?g_st=il" target="_blank" rel="noopener noreferrer">เปิดแผนที่บริษัทใน Google Maps <span>↗</span></a></div>'
assert old in s;s=s.replace(old,contact)
s=s.replace('</head>','<link rel="stylesheet" href="portfolio.css"></head>')
s=s.replace('</body>',dialog+'<script src="portfolio.js"></script></body>')
index.write_text(s,encoding='utf-8')
print(f'Prepared {len(records)} categorized photos. Web images: {sum(p.stat().st_size for p in out.glob("*.webp"))//1024} KB')
