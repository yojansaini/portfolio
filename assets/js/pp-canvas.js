/* Milestone acceptance loop: merchant trigger, customer accept or dispute,
   two-cycle loop, then mediation. Palette follows the system theme. */
const PP_THEMES={
  dark:{
    bg:'rgba(80,20,160,.09)',
    line:'rgba(90,159,212,.20)', lineAlt:'rgba(155,116,232,.24)',
    pMain:'rgba(111,163,200,', pAlt:'rgba(170,120,255,',
    ringMain:'#5a9fd4', ringAlt:'#9b74e8', ringWarn:'#e8a020',
    glowMain:'rgba(90,159,212,.18)', glowAlt:'rgba(155,116,232,.26)',
    core:'rgba(26,51,82,.7)', coreAlt:'rgba(100,40,200,.45)',
    label:'rgba(240,240,237,.92)', sub:'rgba(138,154,176,.78)'
  },
  light:{
    bg:'rgba(107,63,196,.06)',
    line:'rgba(31,107,158,.30)', lineAlt:'rgba(107,63,196,.32)',
    pMain:'rgba(31,107,158,', pAlt:'rgba(107,63,196,',
    ringMain:'#1f6b9e', ringAlt:'#6b3fc4', ringWarn:'#b7791f',
    glowMain:'rgba(31,107,158,.14)', glowAlt:'rgba(107,63,196,.16)',
    core:'rgba(31,107,158,.12)', coreAlt:'rgba(107,63,196,.16)',
    label:'rgba(12,23,37,.92)', sub:'rgba(74,91,110,.85)'
  }
};
const ppMq=window.matchMedia('(prefers-color-scheme: light)');
let PP=ppMq.matches?PP_THEMES.light:PP_THEMES.dark;
ppMq.addEventListener('change',e=>{PP=e.matches?PP_THEMES.light:PP_THEMES.dark;});

let ppDone=false;
function startPpCanvas(){
  if(ppDone)return; ppDone=true;
  const cv=document.getElementById('ppCanvas');
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

  /* Nodes in normalised space. alt = dispute/mediation path. */
  const N=[
    {id:'mark',  l:'Milestone',  s:'marked done', x:.08, y:.50, alt:false},
    {id:'notif', l:'Notified',   s:'customer',    x:.26, y:.50, alt:false},
    {id:'accept',l:'Accepts',    s:'payment collected', x:.52, y:.22, alt:false},
    {id:'disp',  l:'Disputes',   s:'merchant resubmits', x:.52, y:.78, alt:true},
    {id:'loop',  l:'Loop',       s:'max 2 cycles', x:.72, y:.78, alt:true, pulse:true},
    {id:'med',   l:'Mediation',  s:'void / refund / settle', x:.90, y:.78, alt:true}
  ];
  const I={}; N.forEach((n,i)=>I[n.id]=i);

  /* [from, to, isAlt, curve] — curve bends the path for the loop-back */
  const E=[
    [I.mark,  I.notif,  false, 0],
    [I.notif, I.accept, false, 0],
    [I.notif, I.disp,   true,  0],
    [I.disp,  I.loop,   true,  0],
    [I.loop,  I.med,    true,  0],
    [I.loop,  I.notif,  true, -0.42]   // loop < 2: back to customer
  ];

  const parts=[];
  E.forEach((e,i)=>{
    const n=e[2]?2:3;
    for(let k=0;k<n;k++) parts.push({ei:i,t:k/n+Math.random()*.1,spd:.0032+Math.random()*.0016});
  });

  /* Quadratic point along an edge, honouring its curve offset. */
  function ptOn(e,p){
    const a=N[e[0]], b=N[e[1]], c=e[3];
    const ax=W*a.x, ay=H*a.y, bx=W*b.x, by=H*b.y;
    if(!c) return {x:ax+(bx-ax)*p, y:ay+(by-ay)*p};
    const mx=(ax+bx)/2, my=(ay+by)/2+H*c;
    const u=1-p;
    return {x:u*u*ax+2*u*p*mx+p*p*bx, y:u*u*ay+2*u*p*my+p*p*by};
  }

  function drawEdge(e){
    const a=N[e[0]], b=N[e[1]], c=e[3];
    ctx.beginPath();
    ctx.moveTo(W*a.x,H*a.y);
    if(c) ctx.quadraticCurveTo((W*a.x+W*b.x)/2,(H*a.y+H*b.y)/2+H*c,W*b.x,H*b.y);
    else  ctx.lineTo(W*b.x,H*b.y);
    ctx.strokeStyle=e[2]?PP.lineAlt:PP.line;
    ctx.lineWidth=1.4*R;
    if(c) ctx.setLineDash([4*R,5*R]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);

    const bg=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.42);
    bg.addColorStop(0,PP.bg); bg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    E.forEach(drawEdge);

    parts.forEach(p=>{
      p.t+=p.spd; if(p.t>1)p.t=0;
      const e=E[p.ei], pos=ptOn(e,p.t);
      const pc=e[2]?PP.pAlt:PP.pMain;
      const g=ctx.createRadialGradient(pos.x,pos.y,0,pos.x,pos.y,5*R);
      g.addColorStop(0,pc+'.9)'); g.addColorStop(1,pc+'0)');
      ctx.beginPath(); ctx.arc(pos.x,pos.y,4*R,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();
    });

    N.forEach((n,i)=>{
      const nx=W*n.x, ny=H*n.y;
      const beat=n.pulse?Math.sin(t*.07)*.18+1:Math.sin(t*.04+i*1.1)*.08+.96;
      const r=12*R*beat;

      const g=ctx.createRadialGradient(nx,ny,0,nx,ny,r*3);
      g.addColorStop(0,n.alt?PP.glowAlt:PP.glowMain);
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(nx,ny,r*3,0,Math.PI*2);
      ctx.fillStyle=g; ctx.fill();

      ctx.beginPath(); ctx.arc(nx,ny,r,0,Math.PI*2);
      ctx.strokeStyle=n.pulse?PP.ringWarn:(n.alt?PP.ringAlt:PP.ringMain);
      ctx.lineWidth=1.5*R; ctx.stroke();

      ctx.beginPath(); ctx.arc(nx,ny,r*.5,0,Math.PI*2);
      ctx.fillStyle=n.alt?PP.coreAlt:PP.core; ctx.fill();

      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=`600 ${9*R}px 'General Sans',Inter,sans-serif`;
      ctx.fillStyle=PP.label;
      ctx.fillText(n.l,nx,ny-r*2.3);
      ctx.font=`${7.5*R}px 'General Sans',Inter,sans-serif`;
      ctx.fillStyle=PP.sub;
      ctx.fillText(n.s,nx,ny-r*2.3+11*R);
    });

    /* branch labels on the fork out of "Notified" */
    ctx.font=`${7.5*R}px 'General Sans',Inter,sans-serif`;
    ctx.textAlign='center';
    ctx.fillStyle=PP.sub;
    ctx.fillText('accepts',W*.38,H*.30);
    ctx.fillText('disputes',W*.38,H*.70);
    ctx.fillText('loop < 2',W*.49,H*.57);

    t++;
    requestAnimationFrame(draw);
  }
  draw();
}

document.addEventListener('DOMContentLoaded',startPpCanvas);
