(() => {
'use strict';
const $=id=>document.getElementById(id), scene=$('scene'), film=$('film'), cursor=$('cursor');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'), total=works.length;
const pad=n=>String(n).padStart(2,'0'), mod=(n,m)=>((n%m)+m)%m, clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const dialogs=[...document.querySelectorAll('dialog')], frames=[],rows=[];
let position=0,target=0,active=0,velocity=0,width=0,height=0,step=0,mobile=false,motion=!reduced.matches;
let raf=0,lastTime=0,ambient=0,px=0,py=0,drag=null,ignoreUntil=0,wheelTimer,photoIndex=1,photoRequest=0,noticeTimer,wheelActive=false,wheelOrigin=0,wheelTotal=0;
const hasDialog=()=>dialogs.some(dialog=>dialog.open);
function requestFrame(){if(!raf&&!document.hidden&&!hasDialog())raf=requestAnimationFrame(render);}
function notify(text){$('notice').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').textContent='',4000);}
function resize(){const rect=scene.getBoundingClientRect();width=rect.width;height=rect.height;mobile=width<=600;step=mobile?width*.87:Math.min(width*.48,760);requestFrame();}

works.forEach((work,index)=>{
 const button=document.createElement('button');button.className='film-frame';button.dataset.work=index;button.setAttribute('aria-label',`Enter ${work.title}`);
 const top=document.createElement('span');top.className='frame-top';top.innerHTML=`<span>DDO / ${pad(index+1)}</span><span>${work.type.toUpperCase()}</span>`;
 const photo=document.createElement('span');photo.className='frame-photo';
 const image=document.createElement('img');image.className='base-photo';image.src=work.images[work.cover];image.alt=`${work.title} interior`;image.draggable=false;image.decoding='async';
 const shutter=document.createElement('span');shutter.className='shutter';shutter.setAttribute('aria-hidden','true');const slices=[];
 for(let s=0;s<7;s++){const slice=document.createElement('span');slice.className='shutter-slice';slice.style.setProperty('--slice',s);const img=document.createElement('img');img.src=image.src;img.alt='';img.draggable=false;slice.append(img);shutter.append(slice);slices.push(slice);}
 photo.append(image,shutter);const caption=document.createElement('span');caption.className='frame-caption';caption.innerHTML=`<span>${work.title}</span><span aria-hidden="true">↗</span>`;
 button.append(top,photo,caption);film.append(button);frames.push({button,shutter,slices,ratio:work.ratio});
 button.addEventListener('click',()=>{if(performance.now()<ignoreUntil)return;if(active===index)openViewer();else goTo(index);});
 button.addEventListener('focus',()=>{if(!hasDialog()&&active!==index)goTo(index);});
 const row=document.createElement('button');row.className='index-row';row.innerHTML=`<span>${pad(index+1)}</span><span>${work.title}</span><span aria-hidden="true">↗</span>`;
 row.addEventListener('pointerenter',()=>previewIndex(index));row.addEventListener('focus',()=>previewIndex(index));row.addEventListener('click',()=>{goTo(index,true);$('index-dialog').close();openViewer();});
 $('index-list').append(row);rows.push(row);
});
function updateActive(index){
 if(index===active&&$('title').textContent===works[index].title)return;
 active=index;const work=works[index];$('number').textContent=pad(index+1);$('title').textContent=work.title;$('meta').textContent=`${work.place} / ${work.type}`.toUpperCase();$('count').textContent=`${pad(index+1)} / ${pad(total)}`;$('frame-label').textContent=`FRAME ${pad(index+1)}—${pad(total)}`;
 frames.forEach((frame,i)=>frame.button.classList.toggle('is-active',i===index));rows.forEach((row,i)=>row.setAttribute('aria-current',String(i===index)));
}
function render(now){
 raf=0;if(document.hidden||hasDialog())return;
 const dt=Math.min((now-lastTime)||16.7,40);lastTime=now;if(motion)ambient+=dt;const before=position;
 position=reduced.matches?target:position+(target-position)*(1-Math.exp(-dt/95));if(Math.abs(target-position)<.00008)position=target;
 velocity+=(clamp((position-before)*1000/dt,-3,3)-velocity)*.2;updateActive(mod(Math.round(position),total));const t=ambient/1000;
 frames.forEach((frame,index)=>{
  const r=mod(index-position+total/2,total)-total/2, distance=Math.abs(r), visible=distance<2.2;
  frame.button.style.visibility=visible?'visible':'hidden';frame.button.inert=!visible;if(!visible)return;
  const scale=1-clamp(distance*.19,0,.35), ratio=mobile?clamp(frame.ratio,.8,1.18):frame.ratio;
  const angle=-7+r*10+(motion?Math.sin(t*.34+index)*.65:0), radians=angle*Math.PI/180;
  const cosine=Math.abs(Math.cos(radians)),sine=Math.abs(Math.sin(radians));
  const ph=Math.max(50,Math.min(Math.min(height*.84,mobile?405:600)*scale,(height-32-45*cosine)/(cosine+ratio*sine)));
  const fw=ph*ratio,fh=ph+45,bounds=fh*cosine+fw*sine;
  const x=width*(mobile?.52:.53)+r*step-fw/2+(motion?px*8*(1-distance*.2):0);
  const center=height*.52-Math.sin(r*1.3)*height*.09+(motion?Math.sin(t*.53+index*1.7)*5+py*7:0);
  const y=clamp(center,bounds/2+12,height-bounds/2-12)-fh/2,speed=reduced.matches?0:clamp(velocity,-2,2);
  frame.button.style.width=`${fw}px`;frame.button.style.height=`${fh}px`;frame.button.style.setProperty('--frame-width',`${fw}px`);
  frame.button.style.transform=`translate3d(${x}px,${y}px,0) rotate(${angle}deg) skewX(${speed*-2.3}deg)`;frame.button.style.zIndex=String(20-Math.round(distance*5));
  frame.shutter.style.opacity=String(clamp(Math.abs(speed)*1.8,0,1));frame.slices.forEach((slice,s)=>slice.style.transform=`translateY(${Math.sin(s*1.6+t*5)*speed*ph*.075}px)`);
 });
 document.querySelector('.poster').style.transform=`translate3d(${motion?px*-5:0}px,0,0) skewX(${reduced.matches?0:clamp(velocity*-1.1,-3,3)}deg)`;
 if(motion||Math.abs(target-position)>.00008||Math.abs(velocity)>.002)requestFrame();
}
function goTo(index,immediate=false){clearTimeout(wheelTimer);wheelActive=false;target=Math.round(target)+mod(index-mod(Math.round(target),total)+total/2,total)-total/2;if(immediate||reduced.matches){position=target;velocity=0;updateActive(mod(Math.round(target),total));}requestFrame();}
function move(direction){clearTimeout(wheelTimer);wheelActive=false;target=Math.round(target)+direction;requestFrame();}
$('previous').addEventListener('click',()=>move(-1));$('next').addEventListener('click',()=>move(1));
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();goTo(0);});$('enter').addEventListener('click',()=>{goTo(active,true);openViewer();});
scene.addEventListener('pointerdown',event=>{if(event.button!==0)return;clearTimeout(wheelTimer);wheelActive=false;target=position;drag={id:event.pointerId,x:event.clientX,start:target,moved:false};});
scene.addEventListener('pointermove',event=>{
 const rect=scene.getBoundingClientRect();px=clamp((event.clientX/width-.5)*2,-1,1);py=clamp(((event.clientY-rect.top)/height-.5)*2,-1,1);cursor.style.left=`${event.clientX-rect.left}px`;cursor.style.top=`${event.clientY-rect.top}px`;if(event.pointerType==='mouse')scene.classList.add('cursor-on');
 if(drag&&event.pointerId===drag.id){const distance=event.clientX-drag.x;if(Math.abs(distance)>6&&!drag.moved){drag.moved=true;scene.setPointerCapture(event.pointerId);scene.classList.add('dragging');}if(drag.moved){target=drag.start-distance/step;ignoreUntil=performance.now()+300;}}requestFrame();
});
function release(event){if(!drag||event.pointerId!==drag.id)return;const moved=drag.moved;drag=null;scene.classList.remove('dragging');if(scene.hasPointerCapture(event.pointerId))scene.releasePointerCapture(event.pointerId);target=Math.round(target);if(moved)ignoreUntil=performance.now()+250;requestFrame();}
scene.addEventListener('pointerup',release);scene.addEventListener('pointercancel',release);scene.addEventListener('lostpointercapture',event=>{if(drag&&event.pointerId===drag.id){drag=null;target=Math.round(target);scene.classList.remove('dragging');requestFrame();}});
scene.addEventListener('pointerleave',()=>{scene.classList.remove('cursor-on');px=0;py=0;requestFrame();});
scene.addEventListener('wheel',event=>{if(event.ctrlKey||hasDialog())return;event.preventDefault();const raw=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY,delta=raw*(event.deltaMode===1?20:event.deltaMode===2?height:1);if(!delta)return;if(reduced.matches){clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>move(Math.sign(delta)),120);return;}if(!wheelActive){wheelActive=true;wheelOrigin=Math.round(target);wheelTotal=0;}wheelTotal+=delta;target+=clamp(delta,-100,100)/(mobile?500:680);clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{const nearest=Math.round(target);target=nearest===wheelOrigin&&Math.abs(wheelTotal)>18?wheelOrigin+Math.sign(wheelTotal):nearest;wheelActive=false;requestFrame();},180);requestFrame();},{passive:false});
function setMotion(value){motion=value&&!reduced.matches;$('motion').setAttribute('aria-pressed',String(motion));$('motion').querySelector('span').textContent=motion?'MOTION ON':'MOTION OFF';requestFrame();}
$('motion').addEventListener('click',()=>{if(reduced.matches){notify('Your device has reduced motion enabled. The exhibition stays still.');return;}setMotion(!motion);});reduced.addEventListener('change',()=>setMotion(!reduced.matches));setMotion(motion);
$('lights').addEventListener('click',()=>{const enabled=document.body.classList.toggle('darkroom');$('lights').setAttribute('aria-pressed',String(enabled));document.querySelector('meta[name="theme-color"]').content=enabled?'#23251f':'#d8e86c';});
function previewIndex(index){const work=works[index];$('index-image').src=work.images[work.cover];$('index-image').alt=`${work.title} interior`;}
function showDialog(id){scene.classList.remove('cursor-on');if(drag){drag=null;target=Math.round(target);scene.classList.remove('dragging');}$('notice').textContent='';$(id).showModal();}
$('show-index').addEventListener('click',()=>{previewIndex(active);showDialog('index-dialog');});$('show-studio').addEventListener('click',()=>showDialog('studio-dialog'));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));dialogs.forEach(dialog=>dialog.addEventListener('close',()=>{lastTime=performance.now();if(dialog.id==='viewer')photoRequest++;requestFrame();}));
function openViewer(){photoIndex=works[active].cover;showDialog('viewer');buildViewer();}
function buildViewer(){
 const work=works[active];$('viewer-title').textContent=work.title;$('viewer-number').textContent=`SPACE ${pad(active+1)}`;$('viewer-meta').textContent=`${work.place} / ${work.type}`.toUpperCase();$('description').textContent=work.note;$('thumbnails').replaceChildren();
 work.images.forEach((src,index)=>{const button=document.createElement('button');button.setAttribute('aria-label',`View photograph ${index+1} of ${work.title}`);button.setAttribute('aria-pressed',String(index===photoIndex));const image=document.createElement('img');image.src=src;image.alt='';image.loading='lazy';button.append(image);button.addEventListener('click',()=>setPhoto(index));$('thumbnails').append(button);});setPhoto(photoIndex);
}
function setPhoto(index){
 const work=works[active];photoIndex=mod(index,work.images.length);const request=++photoRequest;$('photo-count').textContent=`${pad(photoIndex+1)} / ${pad(work.images.length)}`;[...$('thumbnails').children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===photoIndex)));
 const photo=$('viewer-image'),stage=document.querySelector('.viewer-photo');stage.classList.add('loading');$('photo-status').textContent='';const preload=new Image();
 preload.onload=()=>{if(request!==photoRequest)return;photo.src=preload.src;photo.alt=`${work.title} — interior photograph ${photoIndex+1}`;stage.classList.remove('loading');};preload.onerror=()=>{if(request!==photoRequest)return;stage.classList.remove('loading');$('photo-status').textContent='This photograph could not load. Choose another image.';};preload.src=work.images[photoIndex];const next=new Image();next.src=work.images[mod(photoIndex+1,work.images.length)];
}
$('previous-photo').addEventListener('click',()=>setPhoto(photoIndex-1));$('next-photo').addEventListener('click',()=>setPhoto(photoIndex+1));$('next-project').addEventListener('click',()=>{goTo(mod(active+1,total),true);photoIndex=works[active].cover;buildViewer();});
let touchX=null;$('viewer-image').addEventListener('touchstart',event=>{touchX=event.touches.length===1?event.touches[0].clientX:null;},{passive:true});$('viewer-image').addEventListener('touchend',event=>{if(touchX!==null&&Math.abs(event.changedTouches[0].clientX-touchX)>50)setPhoto(photoIndex+(event.changedTouches[0].clientX<touchX?1:-1));touchX=null;},{passive:true});
document.addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;if($('viewer').open){if(event.key==='ArrowRight'){event.preventDefault();setPhoto(photoIndex+1);}else if(event.key==='ArrowLeft'){event.preventDefault();setPhoto(photoIndex-1);}return;}if(hasDialog())return;if(event.key==='ArrowRight'){event.preventDefault();move(1);}else if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}else if(event.key==='Home'){event.preventDefault();goTo(0);}else if(event.key==='End'){event.preventDefault();goTo(total-1);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{lastTime=performance.now();requestFrame();}});new ResizeObserver(resize).observe(scene);frames[0].button.classList.add('is-active');rows[0].setAttribute('aria-current','true');resize();
})();
