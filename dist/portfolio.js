(async () => {
 const grid=document.querySelector('.work-grid');
 try{
  const response=await fetch('/api/portfolio',{cache:'no-store'});if(!response.ok)throw Error('Portfolio unavailable');const data=await response.json();
  const labels=new Map(data.categories.map(c=>[c.key,c.label]));const filtersContainer=document.querySelector('.gallery-filters');filtersContainer.replaceChildren();
  for(const category of [{key:'all',label:'ผลงานทั้งหมด'},...data.categories]){const button=document.createElement('button');button.type='button';button.dataset.galleryFilter=category.key;button.setAttribute('aria-pressed',String(category.key==='all'));button.classList.toggle('selected',category.key==='all');button.append(document.createTextNode(category.label+' '));const amount=document.createElement('span');amount.textContent=category.key==='all'?data.photos.length:data.photos.filter(p=>p.category===category.key).length;button.append(amount);filtersContainer.append(button)}
  grid.replaceChildren();for(const photo of data.photos){const item=document.createElement('article');item.className='work-item';item.dataset.category=photo.category;const button=document.createElement('button');button.type='button';button.className='work-photo';button.dataset.full=photo.full_url;button.setAttribute('aria-label','ดูภาพใหญ่: '+photo.title);const img=document.createElement('img');img.src=photo.thumb_url;img.alt=photo.title;img.width=photo.width;img.height=photo.height;img.loading='lazy';img.decoding='async';const zoom=document.createElement('span');zoom.className='work-zoom';zoom.setAttribute('aria-hidden','true');zoom.textContent='↗';button.append(img,zoom);const meta=document.createElement('div');meta.className='work-meta';const label=document.createElement('span');label.textContent=labels.get(photo.category)||photo.category;const title=document.createElement('h3');title.textContent=photo.title;meta.append(label,title);item.append(button,meta);grid.append(item)}
 }catch{
  grid.replaceChildren();document.querySelector('.gallery-more').hidden=true;document.querySelector('#gallery-count').textContent='ยังโหลดผลงานไม่ได้ กรุณารีเฟรชหน้าเว็บอีกครั้ง';return;
 }
 const filters=[...document.querySelectorAll('[data-gallery-filter]')];
 const items=[...document.querySelectorAll('.work-item')];
 const more=document.querySelector('.gallery-more');const count=document.querySelector('#gallery-count');
 const dialog=document.querySelector('.work-dialog');const image=document.querySelector('#photo-full');
 let category='all',limit=9,current=0,opener=null;
 const matching=()=>items.filter(item=>category==='all'||item.dataset.category===category);
 function render(){const selected=matching();items.forEach(item=>item.hidden=true);selected.slice(0,limit).forEach(item=>item.hidden=false);more.hidden=limit>=selected.length;count.textContent=selected.length?`แสดง ${Math.min(limit,selected.length)} จาก ${selected.length} ภาพ`:'ยังไม่มีผลงานในหมวดนี้';filters.forEach(button=>{const active=button.dataset.galleryFilter===category;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active))})}
 filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.galleryFilter;limit=9;render()}));
 document.querySelectorAll('[data-service-filter]').forEach(link=>link.addEventListener('click',()=>{category=link.dataset.serviceFilter;limit=9;render()}));
 more.addEventListener('click',()=>{const selected=matching(),next=selected[limit];limit+=9;render();if(next)next.querySelector('button').focus({preventScroll:true})});
 function showPhoto(index){const selected=matching();current=(index+selected.length)%selected.length;const item=selected[current];image.src=item.querySelector('button').dataset.full;image.alt=item.querySelector('img').alt;document.querySelector('#photo-title').textContent=item.querySelector('h3').textContent;document.querySelector('#photo-category').textContent=item.querySelector('.work-meta>span').textContent;document.querySelector('#photo-position').textContent=`${current+1} / ${selected.length}`}
 items.forEach(item=>item.querySelector('button').addEventListener('click',event=>{opener=event.currentTarget;showPhoto(matching().indexOf(item));dialog.showModal()}));
 document.querySelector('.photo-close').addEventListener('click',()=>dialog.close());
 document.querySelector('.photo-prev').addEventListener('click',()=>showPhoto(current-1));
 document.querySelector('.photo-next').addEventListener('click',()=>showPhoto(current+1));
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(current-1)}if(event.key==='ArrowRight'){event.preventDefault();showPhoto(current+1)}});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
 dialog.addEventListener('close',()=>{image.removeAttribute('src');if(opener)opener.focus({preventScroll:true})});
 render();
})();
