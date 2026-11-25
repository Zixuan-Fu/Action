(function(){
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
