let rwRaf=null,rwDone=false;
function startRwCanvas(){
  if(rwDone)return; rwDone=true;
  const cv=document.getElementById('rwCanvas');
  if(!cv)return;
  const ctx=cv.getContext('2d');
  let W,H,t=0;
  const R=window.devicePixelRatio||1;

  function resize(){
    const r=cv.parentElement.getBoundingClientRect();
    W=cv.width=r.width*R; H=cv.height=r.height*R;
    cv.style.width=r.width+'px'; cv.style.height=r.height+'px';
  }
  window.addEventListener('resize',resize); resize();

  // Named pipeline stages with fixed x positions
  const ST=[
    {id:'rbi',   label:'RBI',      sub:'source',        x:.09, col:'#4a7fa5', ai:false},
    {id:'npci',  label:'NPCI',     sub:'source',        x:.20, col:'#4a7fa5', ai:false},
    {id:'crawl', label:'Crawl',    sub:'+ queue',       x:.35, col:'#6a5acd', ai:false},
    {id:'rag',   label:'RAG',      sub:'pipeline',      x:.50, col:'#7b4fd4', ai:true},
    {id:'llm',   label:'LLM',      sub:'self-hosted',   x:.64, col:'#9040e0', ai:true},
    {id:'alerts',label:'Alerts',   sub:'+ digests',     x:.79, col:'#4a7fa5', ai:false},
    {id:'fb',    label:'Feedback', sub:'↺ loop',        x:.91, col:'#6a40b0', ai:true},
  ];

  // Directed pipes: [from_idx, to_idx, isFeedback]
  const PIPES=[
    [0,2,false],[1,2,false],
    [2,3,false],[3,4,false],
    [4,5,false],[5,6,false],
    [6,3,true]  // feedback back to RAG
  ];

  // Particles per pipe
  const parts=[];
  PIPES.forEach((p,i)=>{
    const n=p[2]?2:3;
    for(let k=0;k<n;k++) parts.push({pi:i,t:Math.random(),spd:.0035+Math.random()*.002});
  });

  // Floating doc shapes on left
  const docs=[];
  for(let i=0;i<5;i++) docs.push({
    x:.03+Math.random()*.14, y:.1+Math.random()*.7,
    vx:.00025+Math.random()*.0002, vy:-.0006-Math.random()*.0003,
    sz:.022+Math.random()*.01, ph:Math.random()*6.28
  });

  // Severity bars on right
  const BARS=[{h:.55,c:'#e04040',l:'High'},{h:.35,c:'#e8a020',l:'Med'},{h:.18,c:'#4a7fa5',l:'Low'}];

  function draw(){
    ctx.clearRect(0,0,W,H);
    const cy=H*.5;

    // Subtle center glow
    const bg=ctx.createRadialGradient(W*.5,cy,0,W*.5,cy,W*.38);
    bg.addColorStop(0,'rgba(80,20,160,.1)'); bg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // Spine line
    ctx.beginPath(); ctx.moveTo(W*.06,cy); ctx.lineTo(W*.84,cy);
    ctx.strokeStyle='rgba(74,127,165,.12)'; ctx.lineWidth=1.5*R; ctx.stroke();

    // Feedback arc (below spine)
    const arcY=H*.82;
    ctx.beginPath();
    ctx.moveTo(W*ST[6].x,cy);
    ctx.quadraticCurveTo(W*.72,arcY,W*.5,arcY);
    ctx.quadraticCurveTo(W*.28,arcY,W*ST[3].x,cy);
    ctx.strokeStyle='rgba(123,79,212,.18)';
    ctx.lineWidth=1.5*R; ctx.setLineDash([4*R,5*R]); ctx.stroke(); ctx.setLineDash([]);

    // Floating docs
    docs.forEach(d=>{
      d.x+=d.vx; d.y+=d.vy;
      if(d.y<-.05) d.y=.95;
      if(d.x>.26){d.x=.02; d.y=.1+Math.random()*.7;}
      const dx=W*d.x, dy=H*d.y, dw=W*d.sz, dh=dw*1.3;
      const fl=.55+.35*Math.sin(t*.03+d.ph);
      ctx.save(); ctx.globalAlpha=fl*.65;
      ctx.strokeStyle='rgba(74,127,165,.85)'; ctx.lineWidth=R;
      ctx.beginPath();
      ctx.moveTo(dx,dy); ctx.lineTo(dx+dw*.76,dy);
      ctx.lineTo(dx+dw,dy+dh*.22); ctx.lineTo(dx+dw,dy+dh);
      ctx.lineTo(dx,dy+dh); ctx.closePath(); ctx.stroke();
      for(let l=1;l<=3;l++){
        ctx.beginPath();
        ctx.moveTo(dx+dw*.18,dy+dh*(.28+l*.17));
        ctx.lineTo(dx+dw*.82,dy+dh*(.28+l*.17));
        ctx.stroke();
      }
      ctx.restore();
    });

    // Particles
    parts.forEach(p=>{
      p.t+=p.spd; if(p.t>1)p.t=0;
      const pipe=PIPES[p.pi];
      const sa=ST[pipe[0]], sb=ST[pipe[1]];
      let px,py;
      if(pipe[2]){
        // Follow the feedback arc
        const ax=W*sa.x,bx=W*sb.x,arcY2=H*.82;
        if(p.t<.5){
          const tt=p.t*2;
          const mx=W*.72,my=arcY2;
          px=(1-tt)*(1-tt)*ax+2*(1-tt)*tt*mx+tt*tt*W*.5;
          py=(1-tt)*(1-tt)*cy+2*(1-tt)*tt*my+tt*tt*arcY2;
        } else {
          const tt=(p.t-.5)*2;
          const mx=W*.28,my=arcY2;
          px=(1-tt)*(1-tt)*W*.5+2*(1-tt)*tt*mx+tt*tt*bx;
          py=(1-tt)*(1-tt)*arcY2+2*(1-tt)*tt*my+tt*tt*cy;
        }
      } else {
        px=W*sa.x+(W*sb.x-W*sa.x)*p.t; py=cy;
      }
      const isP=pipe[2]||ST[pipe[1]].ai;
      const pc=isP?'rgba(160,80,255,':'rgba(111,163,200,';
      const g=ctx.createRadialGradient(px,py,0,px,py,5*R);
      g.addColorStop(0,pc+'.9)'); g.addColorStop(1,pc+'0)');
      ctx.beginPath(); ctx.arc(px,py,4*R,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
    });

    // Stage nodes
    ST.forEach((s,i)=>{
      const nx=W*s.x, ny=cy;
      const pulse=Math.sin(t*.04+i*1.1)*.1+.9;
      const r=13*R*pulse;

      // Glow
      const g=ctx.createRadialGradient(nx,ny,0,nx,ny,r*3);
      g.addColorStop(0,s.ai?'rgba(140,60,240,.28)':'rgba(74,127,165,.18)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(nx,ny,r*3,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();

      // Ring
      ctx.beginPath(); ctx.arc(nx,ny,r,0,Math.PI*2);
      ctx.strokeStyle=s.col; ctx.lineWidth=1.5*R; ctx.stroke();

      // Core
      ctx.beginPath(); ctx.arc(nx,ny,r*.5,0,Math.PI*2);
      ctx.fillStyle=s.ai?'rgba(100,40,200,.5)':'rgba(26,51,82,.7)'; ctx.fill();

      // Labels above node
      ctx.font=`500 ${8.5*R}px 'General Sans',Inter,sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='rgba(240,240,237,.92)';
      ctx.fillText(s.label,nx,ny-r*2.2);
      ctx.font=`${7.5*R}px 'General Sans',Inter,sans-serif`;
      ctx.fillStyle='rgba(138,154,176,.75)';
      ctx.fillText(s.sub,nx,ny-r*2.2+11*R);
    });

    // Severity bars
    const bx0=W*.73, by0=H*.18, bW=9*R, gap=13*R;
    BARS.forEach((b,i)=>{
      const bh=H*b.h*(1+.04*Math.sin(t*.05+i));
      const bx=bx0+i*gap, by=by0+(H*.42-bh);
      ctx.fillStyle=b.c; ctx.fillRect(bx,by,bW,bh);
      ctx.font=`${7.5*R}px 'General Sans',Inter,sans-serif`;
      ctx.fillStyle='rgba(138,154,176,.7)';
      ctx.textAlign='center';
      ctx.fillText(b.l,bx+bW/2,by0+H*.45);
    });

    t++;
    rwRaf=requestAnimationFrame(draw);
  }
  draw();
}

document.addEventListener('DOMContentLoaded',startRwCanvas);
