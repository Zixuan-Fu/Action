(function(){
  const defaultPapers=[
    {id:'001',title:'Attention Is All You Need',meta:'Vaswani et al. · 2017',url:'https://arxiv.org/abs/1706.03762',tags:['transformer','foundation'],summary:'以注意力机制替代循环结构，重新定义序列建模的基本单位。',status:'done'},
    {id:'002',title:'The Bitter Lesson',meta:'Rich Sutton · 2019',url:'http://www.incompleteideas.net/IncIdeas/BitterLesson.html',tags:['reinforcement learning','scaling'],summary:'关于通用方法、计算规模和研究直觉之间关系的一则短文。',status:'reading'},
    {id:'003',title:'A Survey on Large Language Model based Autonomous Agents',meta:'Wang et al. · 2023',url:'https://arxiv.org/abs/2308.11432',tags:['agents','survey'],summary:'建立智能体研究的地图：记忆、规划、工具使用与反馈闭环。',status:'queued'}
  ];
  const getPapers=()=>{try{return JSON.parse(localStorage.getItem('xing-paper-library'))||defaultPapers}catch(e){return defaultPapers}};
  const savePapers=p=>localStorage.setItem('xing-paper-library',JSON.stringify(p));
  const list=document.querySelector('#paperList');
  function statusLabel(s){return s==='reading'?'● 在读':s==='done'?'✓ 已读':'○ 待读'}
  function renderPapers(){if(!list)return;const q=(document.querySelector('#searchInput')?.value||'').toLowerCase();const active=document.querySelector('.filter-tab.active')?.dataset.filter||'all';const papers=getPapers().filter(p=>(active==='all'||p.status===active)&&[p.title,p.meta,p.summary,...p.tags].join(' ').toLowerCase().includes(q));document.querySelector('#paperCount').textContent=String(getPapers().length).padStart(2,'0');list.innerHTML=papers.length?papers.map((p,i)=>`<article class="paper-card"><div class="paper-index">${p.id||String(i+1).padStart(3,'0')}</div><div><h2 class="paper-title">${escapeHtml(p.title)}</h2><p class="paper-meta">${escapeHtml(p.meta||'')}</p><p class="paper-summary">${escapeHtml(p.summary||'')}</p><div class="paper-tags">${(p.tags||[]).map(t=>`<span class="paper-tag">${escapeHtml(t)}</span>`).join('')}</div>${p.url?`<a class="paper-open" href="${escapeAttr(p.url)}" target="_blank" rel="noreferrer">打开来源 ↗</a>`:''}</div><div class="paper-status ${p.status}">${statusLabel(p.status)}</div></article>`).join(''):'<div class="empty-state">还没有匹配的阅读条目。试试换一个关键词。</div>'}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}function escapeAttr(s){return escapeHtml(s)}
  if(list){renderPapers();document.querySelector('#searchInput').addEventListener('input',renderPapers);document.querySelectorAll('.filter-tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderPapers()}));
    const modal=document.querySelector('#paperModal');const open=()=>{modal.hidden=false;document.body.style.overflow='hidden';setTimeout(()=>modal.querySelector('input')?.focus(),20)};const close=()=>{modal.hidden=true;document.body.style.overflow=''};document.querySelector('#openModal').addEventListener('click',open);document.querySelector('#closeModal').addEventListener('click',close);document.querySelector('#cancelModal').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close()});document.querySelector('#paperForm').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.target);const papers=getPapers();papers.unshift({id:String(Date.now()).slice(-3),title:d.get('title'),meta:d.get('meta'),url:d.get('url'),tags:String(d.get('tags')||'').split(',').map(t=>t.trim()).filter(Boolean),summary:d.get('summary'),status:'queued'});savePapers(papers);e.target.reset();close();renderPapers()});}
  const board=document.querySelector('[data-ink-canvas]');
  if(board){
    const notes=[...board.querySelectorAll('.ink-note')];
    notes.forEach(note=>{
      const delay=Number(note.dataset.delay||0);
      const tilt=Number(note.dataset.tilt||0);
      note.style.setProperty('--note-delay',`${delay}ms`);
      note.style.setProperty('--tilt',`${tilt}deg`);
    });
    const reveal=()=>board.closest('.knowledge-board')?.classList.add('is-written');
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) reveal();
    else if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){reveal();observer.disconnect()}},{threshold:.28});
      observer.observe(board);
    }else reveal();
  }
  const canvas=document.querySelector('#particleField');if(canvas){const ctx=canvas.getContext('2d');let w,h,pts=[];function resize(){w=canvas.width=innerWidth*devicePixelRatio;h=canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';pts=Array.from({length:Math.min(100,Math.floor(innerWidth/14))},()=>({x:Math.random()*w,y:Math.random()*h,r:(Math.random()*1.4+.25)*devicePixelRatio,vx:(Math.random()-.5)*.18*devicePixelRatio,vy:(Math.random()-.5)*.12*devicePixelRatio,a:Math.random()*.55+.1}))}function draw(){ctx.clearRect(0,0,w,h);for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;ctx.beginPath();ctx.fillStyle=`rgba(218,243,185,${p.a})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}requestAnimationFrame(draw)}addEventListener('resize',resize);resize();draw()}
})();
