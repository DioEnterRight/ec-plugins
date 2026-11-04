
(function(){
  var C=window.EC_STORE||{products:{}}, REPO=C.repo, API='https://api.github.com/repos/'+REPO, TTL=(C.cacheMinutes||10)*60000;
  var $=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var fmt=function(n){try{return n.toLocaleString()}catch(e){return String(n)}};

  /* ---------- small cache (localStorage may be missing; that is fine) ---------- */
  function cget(k,stale){try{var o=JSON.parse(localStorage.getItem('ecs:'+k));if(o&&(stale||Date.now()-o.t<TTL))return o.v}catch(e){}return null}
  function cset(k,v){try{localStorage.setItem('ecs:'+k,JSON.stringify({t:Date.now(),v:v}))}catch(e){}}
  function getJSON(path,key,reduce){
    var c=cget(key);if(c)return Promise.resolve(c);
    var ctl='AbortController' in window?new AbortController():null, to=setTimeout(function(){if(ctl)ctl.abort()},9000);
    return fetch(API+path,{headers:{'Accept':'application/vnd.github+json'},signal:ctl?ctl.signal:undefined})
      .then(function(r){clearTimeout(to);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})
      .then(function(j){var v=reduce(j);cset(key,v);return v})
      .catch(function(err){clearTimeout(to);var s=cget(key,true);if(s)return s;throw err});
  }
  var releases=function(){return getJSON('/releases?per_page=100','rel',function(j){var a=[];j.forEach(function(r){(r.assets||[]).forEach(function(s){a.push({name:s.name,n:s.download_count|0,url:s.browser_download_url})})});return a})};
  var issues=function(){return getJSON('/issues?state=all&per_page=100','iss',function(j){return j.filter(function(i){return !i.pull_request}).map(function(i){var r=i.reactions||{};return {num:i.number,comments:i.comments|0,likes:(r['+1']|0)+(r.heart|0)+(r.hooray|0)+(r.rocket|0)}})})};
  var comments=function(num){return getJSON('/issues/'+num+'/comments?per_page=100','cm'+num,function(j){return j.map(function(c){return {id:c.id,login:(c.user&&c.user.login)||'ghost',avatar:(c.user&&c.user.avatar_url)||'',at:c.created_at,body:String(c.body||'').slice(0,1500)}})})};

  /* ---------- fixed links that need no API ---------- */
  Object.keys(C.products||{}).forEach(function(slug){
    var p=C.products[slug], url='https://github.com/'+REPO+'/issues/'+p.issue;
    $('[data-like="'+slug+'"]').forEach(function(a){a.href=url});
    $('[data-comment-link="'+slug+'"]').forEach(function(a){a.href=url+'#issuecomment-new'});
    $('[data-thread="'+slug+'"]').forEach(function(a){a.href=url});
  });

  /* ---------- live numbers ---------- */
  var setStat=function(slug,what,v){$('[data-stat="'+what+'"][data-product="'+slug+'"]').forEach(function(el){el.textContent=v==null?'—':fmt(v);if(v==null)el.title='Not available yet. Numbers come from GitHub.'})};
  releases().then(function(list){
    Object.keys(C.products).forEach(function(slug){
      var p=C.products[slug], hit=list.filter(function(a){return a.name===p.zip}), total=hit.reduce(function(s,a){return s+a.n},0);
      setStat(slug,'downloads',hit.length?total:null);
      if(hit.length)$('[data-dl="'+slug+'"]').forEach(function(a){a.href=hit[0].url});
    });
  }).catch(function(){Object.keys(C.products).forEach(function(s){setStat(s,'downloads',null)})});
  issues().then(function(list){
    Object.keys(C.products).forEach(function(slug){
      var p=C.products[slug], i=list.filter(function(x){return x.num===p.issue})[0];
      setStat(slug,'likes',i?i.likes:null);setStat(slug,'comments',i?i.comments:null);
    });
  }).catch(function(){Object.keys(C.products).forEach(function(s){setStat(s,'likes',null);setStat(s,'comments',null)})});

  /* ---------- comment list (read only; posting happens on GitHub) ---------- */
  $('#clist').forEach(function(box){
    var slug=box.getAttribute('data-product'), p=C.products[slug], state=document.getElementById('cstate'), ul=box;
    comments(p.issue).then(function(list){
      if(!list.length){state.textContent='No comments yet. Be the first to write one.';return}
      state.textContent=list.length+(list.length===1?' comment':' comments');
      list.slice(-30).reverse().forEach(function(c){
        var li=document.createElement('li'), img=document.createElement('img'), who=document.createElement('div'), a=document.createElement('a'), t=document.createElement('time'), b=document.createElement('p');
        if(/^https:\/\/avatars\.githubusercontent\.com\//.test(c.avatar)){img.src=c.avatar+(c.avatar.indexOf('?')<0?'?s=96':'');img.alt='';img.width=img.height=38;img.loading='lazy'}
        who.className='who';
        if(/^[A-Za-z0-9-]+$/.test(c.login)){a.href='https://github.com/'+c.login;a.textContent=c.login;a.rel='noopener'}else{a.textContent='someone'}
        t.dateTime=c.at;try{t.textContent=new Date(c.at).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}catch(e){}
        b.className='body';b.textContent=c.body;
        who.appendChild(a);who.appendChild(t);li.appendChild(img);li.appendChild(who);li.appendChild(b);ul.appendChild(li);
      });
    }).catch(function(){state.textContent='Comments could not be loaded from GitHub right now. You can read them on GitHub.'});
  });
  /* optional comment box inside the page (needs the utterances GitHub app on the repo) */
  var ub=document.getElementById('utter');
  if(ub&&C.inlineComments==='utterances'){
    var s=document.createElement('script'), slug=ub.getAttribute('data-product');
    s.src='https://utteranc.es/client.js';s.async=true;s.crossOrigin='anonymous';
    s.setAttribute('repo',REPO);s.setAttribute('issue-number',String(C.products[slug].issue));
    s.setAttribute('theme',window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'github-dark':'github-light');
    ub.appendChild(s);
  }

  /* ---------- copy buttons ---------- */
  $('.copy').forEach(function(b){
    b.addEventListener('click',function(){
      var t=b.getAttribute('data-copy');
      function done(){var o=b.textContent;b.textContent='Copied';b.setAttribute('data-done','true');setTimeout(function(){b.textContent=o;b.removeAttribute('data-done')},1600)}
      function fb(){var a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy');done()}catch(e){}document.body.removeChild(a)}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,fb)}else{fb()}
    });
  });

  /* ---------- side nav ---------- */
  var links=$('.rail a'), secs=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
  if(links.length&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){var i=secs.indexOf(en.target);links.forEach(function(l,k){if(k===i)l.setAttribute('aria-current','true');else l.removeAttribute('aria-current')})}})},{rootMargin:'-20% 0px -70% 0px'});
    secs.forEach(function(s){if(s)io.observe(s)});
  }

  /* ---------- live previews ---------- */
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible=new Map();
  function watch(el,fn){if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(en){visible.set(en.target,en.isIntersecting)})}).observe(el)}visible.set(el,true);return function(now){if(visible.get(el))fn(now)}}

  // Twitch: the word runs the plug-in's own schedule (same hash, same envelope)
  function pcg(x,y,z){x=(Math.imul(x,1664525)+1013904223)>>>0;y=(Math.imul(y,1664525)+1013904223)>>>0;z=(Math.imul(z,1664525)+1013904223)>>>0;
    x=(x+Math.imul(y,z))>>>0;y=(y+Math.imul(z,x))>>>0;z=(z+Math.imul(x,y))>>>0;x=(x^(x>>>16))>>>0;y=(y^(y>>>16))>>>0;z=(z^(z>>>16))>>>0;
    x=(x+Math.imul(y,z))>>>0;y=(y+Math.imul(z,x))>>>0;z=(z+Math.imul(x,y))>>>0;return x}
  var rnd=function(s,i,n){return pcg(s>>>0,i>>>0,n>>>0)/4294967296};
  var FPS=30,SEED=7,RMIN=.35,ATT=2/FPS,HOLD=1/FPS,REL=4/FPS,LEN=ATT+HOLD+REL,RATE=[.7,.5,1.1,.8,1.3,.6];
  var sT=pcg(SEED,0xC0FFEE,0), sV=RATE.map(function(_,k){return pcg(SEED,0,0x1000+k+1)});
  var e01=function(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
  function env(dt){if(dt<0||dt>=LEN)return 0;if(dt<ATT)return e01(dt/ATT);var r=dt-ATT-HOLD;return r<0?1:e01(1-r/REL)}
  function ev(k,t){var rate=RATE[k],T=1/rate,jm=Math.floor(t*rate),best=0,slot=0;for(var j=jm-1;j<=jm;j++){var en=env(t-(j+rnd(sT,j,0))*T);if(en<=0)continue;var v=(RMIN+(1-RMIN)*rnd(sV[k],j,1))*en;if(v>best){best=v;slot=j}}return {v:best,s:slot}}
  var tickers=[];
  $('[data-live="twitch"]').forEach(function(stage){
    var span=stage.querySelector('.word span'), pills=$('.pills li',stage), fr=stage.querySelector('[data-frame]'), cap=stage.querySelector('.cap'), last=-1, t0=performance.now();
    if(reduce){return}
    tickers.push(watch(stage,function(now){
      var f=Math.floor((now-t0)/1000*FPS);if(f===last)return;last=f;
      var t=f/FPS, E=[0,1,2,3,4,5].map(function(k){return ev(k,t)}), W=stage.clientWidth, fl=[];
      if(E[0].v>.01)fl.push('blur('+(E[0].v*8).toFixed(1)+'px)');
      if(E[1].v>.01)fl.push('hue-rotate('+((rnd(sV[1],E[1].s,2)-.5)*720*E[1].v).toFixed(0)+'deg) saturate('+(1+E[1].v*2).toFixed(2)+')');
      if(E[2].v>.01){var sg=rnd(sV[2],E[2].s,2)<.5?-1:1;fl.push('brightness('+Math.pow(2,sg*E[2].v*1.3).toFixed(2)+')')}
      var sc=1+E[3].v*.28, dx=0, sh='none';
      if(E[4].v>.01){var sd=rnd(sV[4],E[4].s,3)<.5?-1:1;dx=sd*E[4].v*W*.06;var s2=dx*.45;sh=(-s2).toFixed(1)+'px 0 0 #00B7FF,'+s2.toFixed(1)+'px 0 0 #FF3D9A'}
      span.style.transform='translateX('+dx.toFixed(1)+'px) scale('+sc.toFixed(3)+')';span.style.filter=fl.join(' ')||'none';span.style.textShadow=sh;
      var off=0;if(E[5].v>.01)off=Math.round((rnd(sV[5],E[5].s,2)<.5?-1:1)*E[5].v*.4*FPS);
      if(fr)fr.textContent=String(Math.max(0,f+off)).padStart(5,'0');
      pills.forEach(function(p,k){p.style.setProperty('--on',E[k].v.toFixed(2))});
    }));
  });

  // Deep Glow: the word breathes and the glow leans toward the pointer
  $('[data-live="glow"]').forEach(function(stage){
    if(reduce){stage.style.setProperty('--g','.85');return}
    var tx=.5,ty=.5,cx=.5,cy=.5,boost=0,tb=0;
    stage.addEventListener('pointermove',function(ev){var r=stage.getBoundingClientRect();tx=(ev.clientX-r.left)/r.width;ty=(ev.clientY-r.top)/r.height;tb=1});
    stage.addEventListener('pointerleave',function(){tx=.5;ty=.5;tb=0});
    tickers.push(watch(stage,function(now){
      cx+=(tx-cx)*.12;cy+=(ty-cy)*.12;boost+=(tb-boost)*.1;
      var g=.72+.18*Math.sin(now/900)+.1*Math.sin(now/370+1.3)+.35*boost;
      stage.style.setProperty('--g',g.toFixed(3));stage.style.setProperty('--px',(cx*100).toFixed(1)+'%');stage.style.setProperty('--py',(cy*100).toFixed(1)+'%');
    }));
  });
  // Outline Glow: cycles through the seven Glow Types
  var OGT=[{n:'Neon',c:'#08B8FF',c2:'#5A0DFF',fl:.05,j:0,h:0},{n:'Electric',c:'#A8ECFF',c2:'#2F6BFF',fl:.35,j:2.2,h:0},{n:'Water',c:'#38DCFF',c2:'#0057FF',fl:.05,j:0,w:1,h:0},
    {n:'Galaxy',c:'#C08AFF',c2:'#FF3D9A',fl:.12,j:0,h:0},{n:'Ice',c:'#D4F7FF',c2:'#6FCBFF',fl:.03,j:0,h:0},{n:'Fire',c:'#FFB020',c2:'#FF3D00',fl:.25,j:0,f:1,h:0},{n:'Plasma',c:'#FF4FD8',c2:'#5A0DFF',fl:.08,j:0,h:1}];
  $('[data-live="og"]').forEach(function(stage){
    var svg=stage.querySelector('svg'), pills=$('.pills li',stage), lab=stage.querySelector('[data-type]'), last=-1;
    if(reduce){if(pills[0])pills[0].style.setProperty('--on','1');return}
    tickers.push(watch(stage,function(now){
      var i=Math.floor(now/2400)%OGT.length, T=OGT[i], t=now/1000;
      if(i!==last){last=i;svg.style.setProperty('--c',T.c);svg.style.setProperty('--c2',T.c2);lab.textContent=T.n;pills.forEach(function(p,k){p.style.setProperty('--on',k===i?'1':'0')})}
      var g=.85+.1*Math.sin(t*2.1)-(Math.random()<T.fl?Math.random()*.6:0);
      var dx=T.j?(Math.random()-.5)*T.j:0, dy=T.j?(Math.random()-.5)*T.j:(T.f?-Math.abs(Math.sin(t*9))*1.5:0);
      var sk=T.w?Math.sin(t*2.4)*3:0;
      svg.style.setProperty('--g',Math.max(.15,g).toFixed(3));svg.style.setProperty('--h',T.h?((t*90)%360).toFixed(0)+'deg':'0deg');
      svg.style.transform='translate('+dx.toFixed(2)+'px,'+dy.toFixed(2)+'px) skewX('+sk.toFixed(2)+'deg)';
    }));
  });
  // Slizzy Neon: three-colour neon with electric flicker
  $('[data-live="sn"]').forEach(function(stage){
    var svg=stage.querySelector('svg'), drop=0;
    if(reduce){svg.style.setProperty('--g','.9');return}
    tickers.push(watch(stage,function(now){
      var t=now/1000; if(drop>0)drop-=1; else if(Math.random()<.012)drop=2+Math.floor(Math.random()*5);
      var g=(drop>0?.35+Math.random()*.25:.9+.06*Math.sin(t*7)+(Math.random()-.5)*.08);
      svg.style.setProperty('--g',g.toFixed(3));
    }));
  });
  if(tickers.length){(function loop(now){requestAnimationFrame(loop);tickers.forEach(function(f){f(now)})})(performance.now())}
  if(reduce)$('[data-live-note]').forEach(function(n){n.textContent='Motion is off because your system asks for less of it.'});
})();
