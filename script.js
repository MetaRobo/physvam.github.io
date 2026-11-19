'use strict';
const asset = (name, ext) => `assets/${ext === 'mp4' ? 'videos' : 'images'}/${name}.${ext}${['rolling-bottle-dynamicvla','rolling-bottle-ours'].includes(name) ? '?v=7' : ''}`;
const demoVideo = document.getElementById('demo-video');
const demoStart = document.getElementById('demo-start');
const demoCover = document.getElementById('demo-cover');
function showDemoCover() {
  demoVideo.controls = false;
  demoCover.hidden = false;
  demoStart.hidden = false;
  demoStart.disabled = false;
  demoStart.removeAttribute('aria-busy');
}
showDemoCover();
demoStart.addEventListener('click', async () => {
  demoStart.disabled = true;
  demoStart.setAttribute('aria-busy', 'true');
  if (demoVideo.ended) demoVideo.currentTime = 0;
  try { await demoVideo.play(); }
  catch (_) { showDemoCover(); }
});
demoVideo.addEventListener('playing', () => {
  demoCover.hidden = true;
  demoStart.hidden = true;
  demoStart.disabled = false;
  demoStart.removeAttribute('aria-busy');
  demoVideo.controls = true;
});
demoVideo.addEventListener('ended', showDemoCover);
demoVideo.addEventListener('error', showDemoCover);
window.addEventListener('pageshow', () => {
  if (demoVideo.paused && (demoVideo.currentTime === 0 || demoVideo.ended)) showDemoCover();
});
const cases = {
  'conveyor-cube': {name:'Conveyor · Cube',prompt:'Transfer the moving cube into the basket.',ours:'Grasp and place',dynamicvla:'Missed grasp',puma:'Unstable grasp'},
  'conveyor-orange': {name:'Conveyor · Orange',prompt:'Put the moving orange in the basket.',ours:'Grasp and place',dynamicvla:'Missed grasp',puma:'Missed grasp'},
  'turntable-cup': {name:'Turntable · Cup',prompt:'Move the moving cup into the open-top box.',ours:'Grasp and place',dynamicvla:'Missed interception',puma:'Tracking / grasp failure'},
  'turntable-bread': {name:'Turntable · Bread',prompt:'Place the moving bread on the plate.',clips:[
    {asset:'turntable-bread-dynamicvla',label:'DynamicVLA',caption:'Missed placement',outcome:'failure'},
    {asset:'turntable-bread-puma',label:'PUMA',caption:'Missed interception',outcome:'failure'},
    {asset:'turntable-bread-ours',label:'PhysVAM',caption:'Grasp and place',outcome:'success'}
  ]},
  'rolling-bottle': {name:'Rolling · Bottle',prompt:'Pick up the rolling white bottle and place it in the basket.',ours:'Grasp and place',dynamicvla:'Missed grasp',puma:'Missed grasp'}
};
const valueCases = {
  'future-values': {name:'Future Values',caption:'Simulation rollouts with predicted values at h = 4, 8, 16, and 32 steps.'},
  'miss-recover': {name:'Miss & Recover',caption:'A missed grasp and a subsequent re-approach, shown with h = 4 predictions.'},
  'lift-miss': {name:'Lift vs. Miss',caption:'Simulation interactions aligned to gripper closure. Displayed horizon: h = 4.'}
};
function setupTabs(id, key, panelId, callback) {
  const tabs = [...document.querySelectorAll(`#${id} [role="tab"]`)];
  function select(tab) {
    tabs.forEach(t => { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
    document.getElementById(panelId).setAttribute('aria-labelledby', tab.id);
    callback(tab.dataset[key]);
  }
  tabs.forEach((tab,i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      const target = e.key === 'ArrowRight' ? (i+1)%tabs.length : e.key === 'ArrowLeft' ? (i-1+tabs.length)%tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length-1 : -1;
      if(target < 0) return;
      e.preventDefault(); tabs[target].focus(); select(tabs[target]);
    });
  });
}
const valueVideo = document.getElementById('value-video');
setupTabs('value-tabs','value','value-panel', id => {
  valueVideo.pause(); valueVideo.src = asset(id,'mp4'); valueVideo.poster = asset(id,'jpg');
  valueVideo.setAttribute('aria-label',valueCases[id].name); valueVideo.load();
  document.getElementById('value-caption').textContent = valueCases[id].caption;
});
let playbackGeneration = 0;
const taskCards = [...document.querySelectorAll('.task-comparison')];
taskCards.forEach(card => {
  const videos = [...card.querySelectorAll('video')];
  const button = card.querySelector('.compare-toggle');
  const status = card.querySelector('.task-play-status');
  button.addEventListener('click', async () => {
    if (videos.some(v => !v.paused)) {
      videos.forEach(v => v.pause());button.textContent='Play';return;
    }
    document.querySelectorAll('video').forEach(v => v.pause());
    taskCards.forEach(c => c.querySelector('.compare-toggle').textContent='Play');
    status.textContent='Loading…';
    videos.forEach(v => {v.currentTime=0;v.playbackRate=1;});
    try {await Promise.all(videos.map(v=>v.play()));button.textContent='Pause';status.textContent='';}
    catch (_) {status.textContent='Use individual play controls.';}
  });
  videos.forEach(v => v.addEventListener('ended', () => {if(videos.every(v=>v.paused))button.textContent='Play';}));
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){playbackGeneration++;document.querySelectorAll('video').forEach(v=>v.pause());}});
const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting) entry.target.pause();}),{threshold:0});
document.querySelectorAll('video').forEach(v=>observer.observe(v));
const config = window.PHYSVAM_CONFIG || {};
for (const key of ['arxiv', 'code', 'dataset', 'model']) {
  const link = document.getElementById(`${key}-link`);
  const url = config[`${key}Url`];
  if (url) {
    link.href = url;
    link.removeAttribute('aria-disabled');
    link.removeAttribute('aria-label');
    link.removeAttribute('title');
    link.target = '_blank';
    link.rel = 'noopener';
  }
}
if(config.authors?.length){
  const wrap=document.getElementById('authors');
  wrap.replaceChildren();
  let row;
  config.authors.forEach((author,index)=>{
    if(index===0 || author.newRow){row=document.createElement('p');row.className='author-row';wrap.append(row);}
    const person=document.createElement('span');person.className='author-name';
    const el=document.createElement(author.url?'a':'span');el.textContent=author.name;
    if(author.url){el.href=author.url;el.target='_blank';el.rel='noopener';}
    person.append(el);
    if(author.affiliation){const s=document.createElement('sup');s.textContent=author.affiliation;person.append(s);}
    row.append(person);
  });
  if(Array.isArray(config.affiliations)){
    const institutions=document.createElement('div');institutions.className='affiliations';
    let affiliationRow;
    config.affiliations.forEach((item,index)=>{
      if(index===0 || item.newRow){affiliationRow=document.createElement('p');affiliationRow.className='affiliation-row';institutions.append(affiliationRow);}
      const institution=document.createElement('span');institution.className='affiliation-name';
      const number=document.createElement('sup');number.textContent=item.number;
      institution.append(number,document.createTextNode(item.name));affiliationRow.append(institution);
    });
    wrap.append(institutions);
  } else if(config.affiliations){const p=document.createElement('p');p.className='affiliations';p.textContent=config.affiliations;wrap.append(p);}
  wrap.hidden=false;
}
if(config.bibtex && document.getElementById('citation')){document.getElementById('citation').hidden=false;document.getElementById('bibtex').textContent=config.bibtex;}
document.getElementById('copy-citation')?.addEventListener('click',async()=>{const out=document.getElementById('copy-status');try{await navigator.clipboard.writeText(config.bibtex);out.textContent=' Copied.';}catch(_){out.textContent=' Select and copy the citation above.';}});
const initialCase = new URLSearchParams(window.location.search).get('case');
if(initialCase && Object.hasOwn(cases,initialCase)) document.getElementById(`task-${initialCase}`)?.scrollIntoView();

// Three visible demonstrations, grouped by scene and object; zero-shot is last.
const galleryItems = window.PHYSVAM_GALLERY || [];
const galleryCarousel = document.querySelector('.gallery-carousel');
const galleryTiles = [...document.querySelectorAll('.gallery-tile')];
let galleryStart = 0;
function showGallery(start, announce=true) {
  const total = galleryItems.length;
  galleryStart = total ? ((start % total) + total) % total : 0;
  document.getElementById('gallery-count').textContent = `${total ? galleryStart + 1 : 0} / ${total}`;
  const visibleItems = [];
  galleryTiles.forEach((tile,slot) => {
    const item=slot < total ? galleryItems[(galleryStart+slot)%total] : null;const video=tile.querySelector('video');
    video.pause();tile.hidden=!item;if(!item)return;
    visibleItems.push(item);
    video.src=item.src+'?v=21';video.poster=item.poster+'?v=21';
    video.setAttribute('aria-label','PhysVAM: '+item.title);
    tile.querySelector('.zero-shot-label').hidden=!item.zeroShot;
    video.load();
  });
  if(announce) document.getElementById('gallery-announcement').textContent=visibleItems.map(v=>v.title).join('; ');
}
document.getElementById('gallery-prev').addEventListener('click',()=>showGallery(galleryStart-1));
document.getElementById('gallery-next').addEventListener('click',()=>showGallery(galleryStart+1));
galleryCarousel.addEventListener('keydown',event=>{
  if(event.target.tagName==='VIDEO')return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showGallery(galleryStart+(event.key==='ArrowRight'?1:-1));}
});
galleryTiles.forEach(tile=>{
  const video=tile.querySelector('video');let startX=null;
  video.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;},{passive:true});
  video.addEventListener('touchend',e=>{if(startX===null)return;const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>60)showGallery(galleryStart+(dx<0?1:-1));startX=null;},{passive:true});
  video.addEventListener('play',()=>{document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();});});
  video.addEventListener('ended',()=>{
    if(!galleryItems.length)return;
    const slot=galleryTiles.indexOf(tile);
    const nextIndex = (galleryStart + slot + 1) % galleryItems.length;
    if(slot + 1 < Math.min(galleryTiles.length, galleryItems.length)) {
      galleryTiles[slot + 1].querySelector('video').play().catch(()=>{});
    } else {
      showGallery(nextIndex);
      galleryTiles[0].querySelector('video').play().catch(()=>{});
    }
  });
});
showGallery(0,false);
