(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.links');
  function closeMenu(){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','เปิดเมนู');toggle.textContent='☰';links.classList.remove('open')}
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'ปิดเมนู':'เปิดเมนู');toggle.textContent=open?'×':'☰';links.classList.toggle('open',open)});
  links.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){closeMenu();toggle.focus()}});
  matchMedia('(min-width: 801px)').addEventListener('change',e=>{if(e.matches)closeMenu()});
  document.querySelectorAll('.hero-inner>div:first-child>*').forEach(el=>el.classList.add('hero-enter'));
  const revealTargets=document.querySelectorAll('.sectionhead,.card,.aboutgrid>div,.visiongrid>div,.promise>div,.contact .wrap>div');
  if('IntersectionObserver' in window && !reduced.matches){
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}})},{threshold:.08});
    revealTargets.forEach((el,i)=>{el.classList.add('reveal');if(el.classList.contains('card'))el.style.setProperty('--delay',`${(i%4)*85}ms`);observer.observe(el)});
    document.documentElement.classList.add('motion-ready');
  }
  const progress=document.querySelector('.progress-bar');const top=document.querySelector('.back-top');let scheduled=false;
  function update(){const y=window.scrollY;const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?Math.min(y/max,1):0})`;nav.classList.toggle('scrolled',y>30);top.classList.toggle('shown',y>650);scheduled=false}
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});addEventListener('resize',update,{passive:true});update();
  const art=document.querySelector('.art');
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){art.addEventListener('pointermove',e=>{if(reduced.matches)return;const r=art.getBoundingClientRect();art.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5)*2);art.style.setProperty('--my',((e.clientY-r.top)/r.height-.5)*2)});art.addEventListener('pointerleave',()=>{art.style.setProperty('--mx',0);art.style.setProperty('--my',0)})}
})();
