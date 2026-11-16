(() => {
 const filters=[...document.querySelectorAll('[data-gallery-filter]')];
 const items=[...document.querySelectorAll('.work-item')];
 const more=document.querySelector('.gallery-more');const count=document.querySelector('#gallery-count');
 const dialog=document.querySelector('.work-dialog');const image=document.querySelector('#photo-full');
 let category='all',limit=9,current=0,opener=null;
 const matching=()=>items.filter(item=>category==='all'||item.dataset.category===category);
 function render(){const selected=matching();items.forEach(item=>item.hidden=true);selected.slice(0,limit).forEach(item=>item.hidden=false);more.hidden=limit>=selected.length;count.textContent=`แสดง ${Math.min(limit,selected.length)} จาก ${selected.length} ภาพ`;filters.forEach(button=>{const active=button.dataset.galleryFilter===category;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active))})}
 filters.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.galleryFilter;limit=9;render()}));
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
