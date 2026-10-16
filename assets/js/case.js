/* Scroll-spy for the case study side rail */
(function(){
  const items=[...document.querySelectorAll('.cs-rail-item')];
  if(!items.length)return;
  const secs=items.map(i=>i.getAttribute('href').slice(1));
  function spy(){
    let cur=secs[0];
    secs.forEach(id=>{const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<140)cur=id;});
    items.forEach((item,i)=>item.classList.toggle('act',secs[i]===cur));
  }
  window.addEventListener('scroll',spy,{passive:true});
  spy();
})();
