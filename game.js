(()=>{'use strict';
const G=GameKit, $=id=>document.getElementById(id), store=G.create('convoy-hunt');
const SIZE=8, LIMIT=12, coord=i=>'ABCDEFGH'[i%8]+(Math.floor(i/8)+1), at=(x,y)=>y*8+x;
let screen='menu', match=null, mode='ai', second=null, orientation='h', radar=false;
let soundOn=true,musicOn=true,audioContext=null,musicTimer=null,musicStep=0;
try{soundOn=localStorage.getItem('sink-before-dawn:sound')!=='off';musicOn=localStorage.getItem('sink-before-dawn:music')!=='off'}catch{}
function audio(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;audioContext=audioContext||new Audio();audioContext.resume();return audioContext}
function chipTone(freq,when,duration,volume,type='square',end=freq){const ctx=audio();if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,when);o.frequency.exponentialRampToValueAtTime(Math.max(1,end),when+duration);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(volume,when+.012);g.gain.exponentialRampToValueAtTime(.0001,when+duration);o.connect(g);g.connect(ctx.destination);o.start(when);o.stop(when+duration+.02)}
function musicTick(){if(!soundOn||!musicOn||document.hidden)return;try{const ctx=audio();if(!ctx)return;const now=ctx.currentTime;const lead=[0,0,659,0,0,523,0,392,0,0,587,0,0,494,0,392],bass=[110,0,0,0,98,0,0,0,87.31,0,0,0,98,0,0,0];const note=lead[musicStep%16],low=bass[musicStep%16];if(note)chipTone(note,now,.18,.018,'square');if(low)chipTone(low,now,.40,.028,'triangle');if(musicStep%4===2)chipTone(90,now,.045,.008,'square',40);musicStep++}catch{stopMusic()}}
function startMusic(){if(!soundOn||!musicOn||musicTimer)return;musicTick();musicTimer=setInterval(musicTick,275)}
function stopMusic(){if(musicTimer)clearInterval(musicTimer);musicTimer=null}
function cue(kind,count=0){if(!soundOn)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audioContext=audioContext||new Audio();audioContext.resume();const now=audioContext.currentTime;function tone(freq,when,duration,volume,end=freq){const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.setValueAtTime(freq,when);o.frequency.exponentialRampToValueAtTime(Math.max(1,end),when+duration);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(volume,when+.015);g.gain.exponentialRampToValueAtTime(.0001,when+duration);o.connect(g);g.connect(audioContext.destination);o.start(when);o.stop(when+duration+.02)}if(kind==='sonar'){tone(540,now,.44,.11,850);if(count){for(let i=0;i<Math.min(count,3);i++)tone(920+i*90,now+.54+i*.18,.14,.10,720+i*80)}else tone(220,now+.55,.21,.055,170)}else if(kind==='hit'){tone(160,now,.29,.14,55);tone(600,now+.07,.18,.08,240)}else tone(300,now,.18,.08,145)}catch{/* Visual and text feedback remain available. */}}
function shell(body){
 $('app').innerHTML=`<header class="mast"><div><p class="eyebrow">A game of pursuit</p><h1 class="brand">Sink Before Dawn</h1><p class="tagline">One moving convoy. Twelve searches. Find it before the sun comes up.</p></div><div class="mast-actions"><button id="nav-home">Home</button><button id="nav-records">Records</button><button id="nav-profiles">Profiles</button><button id="sound-toggle" class="sound-toggle" type="button" aria-pressed="${soundOn}">Sound ${soundOn?'on':'off'}</button><button id="music-toggle" class="sound-toggle" type="button" aria-pressed="${musicOn}">Music ${musicOn?'on':'off'}</button></div></header>${body}<p class="footer">Sink Before Dawn · A standalone browser game · Profiles stay on this device until exported</p>`;
 const leave=()=>{if(match&&screen==='play'){if(!confirm('Leave this match? It will not be recorded.'))return false;match=null}return true};
 $('nav-home').onclick=()=>{if(!leave())return;menu()};
 $('nav-records').onclick=()=>{if(!leave())return;screen='records';shell(G.recordsHTML(store))};
 $('nav-profiles').onclick=()=>{if(leave())profiles()};
 $('sound-toggle').onclick=()=>{soundOn=!soundOn;try{localStorage.setItem('sink-before-dawn:sound',soundOn?'on':'off')}catch{}$('sound-toggle').textContent=`Sound ${soundOn?'on':'off'}`;$('sound-toggle').setAttribute('aria-pressed',String(soundOn));if(soundOn){startMusic();cue('sonar',0)}else{stopMusic();audioContext?.suspend()}};
 $('music-toggle').onclick=()=>{musicOn=!musicOn;try{localStorage.setItem('sink-before-dawn:music',musicOn?'on':'off')}catch{}$('music-toggle').textContent=`Music ${musicOn?'on':'off'}`;$('music-toggle').setAttribute('aria-pressed',String(musicOn));if(musicOn)startMusic();else stopMusic()};
}
function profiles(){screen='profiles';shell(G.profilesHTML(store));G.wireProfiles(store,profiles)}
function menu(){screen='menu';shell(`<section class="panel"><p class="eyebrow">At sea, 04:00</p><h2>The convoy must survive until dawn.</h2><p class="lead">A hunter fires and listens for echoes. A captain moves a three-section vessel one square after every search. Three direct hits win the hunt. If the ship survives twelve searches, it escapes.</p><div class="button-row"><button class="primary" id="solo">Play against the captain</button><button id="local">Local two-player</button></div></section><section class="panel"><h2>How the duel works</h2><div class="rules"><article><b>1 · Find the trail</b><p>The hunter can fire at a square or spend one of four sonar charges. Sonar reports how many intact ship sections occupy its 3 × 3 area.</p></article><article><b>2 · Change course</b><p>After each search, the captain may shift the convoy one square in any direction or hold position. Its shape and orientation stay fixed.</p></article><article><b>3 · Race the clock</b><p>Each new hit damages one section, even if the ship later moves. Hit all three before the twelfth search ends. Past shots stay marked, but the convoy keeps moving.</p></article></div></section>${G.recordsHTML(store).replace('Fight record','Recent voyages')}`);$('solo').onclick=()=>setup('ai');$('local').onclick=()=>setup('local')}
function setup(m){screen='setup';mode=m;second=null;orientation='h';const opts=store.profiles().filter(p=>p.id!==store.active().id);shell(`<div class="panel"><p class="eyebrow">New voyage</p><h2>${m==='ai'?'Hunt the computer captain':'Choose the crew'}</h2><p class="muted">${m==='ai'?'You are the hunter. The captain places the convoy and evades your searches.':'The first profile commands the convoy and places it in secret. The second profile hunts it. Pass the device at every turn.'}</p>${m==='local'?`<div class="formline"><label>Captain ${G.esc(store.active().name)}</label><label>Hunter<select id="second"><option value="">Choose a different profile</option>${opts.map(p=>`<option value="${G.esc(p.id)}">${G.esc(p.name)}</option>`).join('')}</select></label></div>${opts.length?'':'<p class="notice">Create another profile first, then return here.</p>'}`:''}<div class="button-row"><button class="primary" id="begin" ${m==='local'&&!opts.length?'disabled':''}>${m==='ai'?'Begin hunt':'Place the convoy'}</button><button id="back">Back</button></div></div>`);$('back').onclick=menu;$('begin').onclick=()=>{if(m==='local'){second=$('second').value;if(!second){alert('Select a second profile.');return}startMusic();match=newMatch();placeScreen()}else{startMusic();match=newMatch();match.ship=randomPlacement();match.phase='hunter';screen='play';play()}}}
function newMatch(){return{ship:null,damaged:[],shots:{},lastScan:null,sonar:4,turn:1,phase:'placement',log:[],result:null,captain:mode==='local'?store.active().id:null,hunter:mode==='local'?second:store.active().id,lastTarget:null}}
function cells(ship){return[0,1,2].map(n=>at(ship.x+(ship.dir==='h'?n:0),ship.y+(ship.dir==='v'?n:0)))}
function fits(x,y,dir){return x>=0&&y>=0&&x+(dir==='h'?2:0)<8&&y+(dir==='v'?2:0)<8}
function randomPlacement(){const dir=Math.random()<.5?'h':'v';return{x:Math.floor(Math.random()*(dir==='h'?6:8)),y:Math.floor(Math.random()*(dir==='v'?6:8)),dir}}
function boardHTML(kind){let html='<div class="sea" role="grid" aria-label="Sea chart">';const ship=match.ship,sc=ship?cells(ship):[];for(let i=0;i<64;i++){const marks=match.shots[i],hit=marks==='hit',miss=marks==='miss',onShip=kind==='captain'&&sc.includes(i),scan=kind==='hunter'&&match.lastScan?.square===i;const hint=kind==='placement'&&fits(i%8,Math.floor(i/8),orientation),reading=scan?match.lastScan:null;const label=`${coord(i)}${onShip?', convoy':''}${hit?', last shot hit':''}${miss?', last shot clear':''}${reading?`, sonar found ${reading.n} intact sections on search ${reading.turn}; historical reading`:''}`;html+=`<button class="cell ${onShip?'ship':''} ${hit?'hit':''} ${miss?'miss':''} ${scan?'scan':''} ${hint?'hint':''}" data-cell="${i}" aria-label="${label}" ${kind==='captain'?'disabled':''}><span class="coordinate">${coord(i)}</span><span class="shot-mark">${hit?'✕':miss?'·':onShip?'▰':''}</span>${reading?`<span class="sonar-mark ${reading.n?'contact':''}" aria-hidden="true">${reading.n}</span>`:''}</button>`}return html+'</div>'}
function placeScreen(){screen='placement';shell(`<div class="panel"><div class="spread"><div><p class="eyebrow">Captain's chart</p><h2>Place your three-section convoy</h2><p class="muted">Choose its direction, then tap the square where its bow begins.</p></div><span class="pill">${G.esc(store.active().name)}</span></div><div class="button-row"><button id="horizontal" class="${orientation==='h'?'primary':''}">Horizontal</button><button id="vertical" class="${orientation==='v'?'primary':''}">Vertical</button><button id="random">Random placement</button></div><div class="arena"><div>${boardHTML('placement')}</div><aside class="side"><div class="notice">The hunter must not see this chart. The screen will cover it before their turn.</div></aside></div></div>`);$('horizontal').onclick=()=>{orientation='h';placeScreen()};$('vertical').onclick=()=>{orientation='v';placeScreen()};$('random').onclick=()=>{match.ship=randomPlacement();beginHunt()};document.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>{const i=+b.dataset.cell,x=i%8,y=Math.floor(i/8);if(!fits(x,y,orientation))return;match.ship={x,y,dir:orientation};beginHunt()})}
function beginHunt(){match.phase='hunter';screen='play';handoff('hunter','The captain has hidden the convoy. Take the device when they have looked away.')}
function name(role){const id=match[role];return id?store.profiles().find(p=>p.id===id)?.name||role:'Computer'}
function handoff(role,subtitle){$('app').innerHTML='';G.handoff(name(role),subtitle,play)}
function play(){
 screen='play';
 const captain=match.phase==='captain',title=captain?'Set a new course':'Search the sea';
 const briefing=captain?'The hunter has searched. Shift the convoy one square or hold. Your location remains hidden.':radar?'Sonar selected. Tap a square to scan its surrounding 3 × 3 area.':'Tap a square to fire. The convoy may cross a previous shot, so a repeated square can be useful.';
 const scan=match.lastScan,stale=scan&&match.turn>scan.turn;
 const report=!captain&&scan?`<div class="sonar-report ${stale?'stale':''}" role="note"><strong>${scan.n?'Contact':'Clear water'} · ${scan.n} intact section${scan.n===1?'':'s'}</strong>Sonar at ${coord(scan.square)} on search ${scan.turn}. ${stale?'The convoy has since moved; this is a past reading.':'This is the current search.'}</div>`:'';
 shell(`<section class="panel"><div class="spread"><div><p class="eyebrow">${captain?'Captain':'Hunter'} · Search ${match.turn} of ${LIMIT}</p><h2>${title}</h2><p class="muted">${briefing}</p></div><span class="pill">${G.esc(name(captain?'captain':'hunter'))}</span></div><div class="arena"><div>${boardHTML(captain?'captain':'hunter')}<div id="action-feedback" class="action-feedback" role="status" aria-live="polite">${captain?'Choose a course for the convoy.':'Choose Fire or Sonar, then tap the chart.'}</div><div class="legend"><span>Sonar reading</span><span>Hit</span><span>Convoy (captain only)</span></div></div><aside class="side"><div class="stat"><b>${match.damaged.length}/3</b><span>Sections hit</span></div><div class="stat"><b>${match.sonar}</b><span>Sonar charges</span></div><div class="stat"><b>${LIMIT-match.turn+1}</b><span>Searches left</span></div>${report}${captain?`<div class="button-row"><button id="move-up">Move north</button><button id="move-left">Move west</button><button id="move-right">Move east</button><button id="move-down">Move south</button><button id="hold">Hold position</button></div>`:`<div class="button-row"><button id="fire" class="${!radar?'primary':''}" aria-pressed="${!radar}">Fire</button><button id="sonar" class="${radar?'primary':''}" aria-pressed="${radar}" ${!match.sonar?'disabled':''}>Sonar (${match.sonar})</button></div>`}<div class="notice small">${G.esc(match.log.at(-1)||'Listen for the wake. Choose carefully.')}</div></aside></div></section><section class="panel"><h3>Captain's log</h3><ol class="log">${match.log.slice(-8).reverse().map(x=>`<li>${G.esc(x)}</li>`).join('')}</ol></section>`);
 if(captain){const moves=[['up',0,-1],['down',0,1],['left',-1,0],['right',1,0],['hold',0,0]];for(const [label,dx,dy]of moves){const b=$('move-'+label),s=match.ship;b.disabled=!fits(s.x+dx,s.y+dy,s.dir);b.onclick=()=>move(dx,dy)}}
 else{$('fire').onclick=()=>{radar=false;play()};$('sonar').onclick=()=>{radar=true;play()};document.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>action(+b.dataset.cell))}
}
function showFeedback(i,kind,count,done){
 const board=document.querySelector('.sea'),tile=board.querySelector(`[data-cell="${i}"]`),status=$('action-feedback');
 document.querySelectorAll('[data-cell], #fire, #sonar').forEach(b=>b.disabled=true);
 const x=i%8,y=Math.floor(i/8),pulse=document.createElement('div');
 pulse.className=kind==='sonar'?'sonar-pulse':'shot-pulse '+kind;
 pulse.style.left=`${(x+.5)*12.5}%`;pulse.style.top=`${(y+.5)*12.5}%`;
 if(kind==='sonar'){
   pulse.innerHTML='<span class="sweep"></span>';
   board.querySelectorAll('.sonar-mark').forEach(mark=>mark.remove());
   for(const cell of board.querySelectorAll('[data-cell]')){const j=+cell.dataset.cell;if(Math.abs(j%8-x)<=1&&Math.abs(Math.floor(j/8)-y)<=1)cell.classList.add('scan-area')}
   status.textContent=`Sonar sweeping ${coord(i)} and the surrounding water…`;
   cue('sonar',count);
   setTimeout(()=>{if(status.isConnected){status.className='action-feedback '+(count?'contact':'clear');status.textContent=count?`Contact near ${coord(i)}: ${count} intact section${count===1?'':'s'} in the highlighted area.`:`Clear water near ${coord(i)}: no intact sections in the highlighted area.`;tile.insertAdjacentHTML('beforeend',`<span class="sonar-mark ${count?'contact':''}" aria-hidden="true">${count}</span>`)}},550);
 }else{
   tile.classList.remove('hit','miss');tile.classList.add(kind);tile.querySelector('.shot-mark').textContent=kind==='hit'?'✕':'·';
   status.className='action-feedback '+kind;
   status.textContent=kind==='hit'?`Direct hit at ${coord(i)}. ${match.damaged.length} of 3 sections damaged.`:`Open water at ${coord(i)}. The convoy may move here later.`;
   cue(kind);
 }
 board.appendChild(pulse);
 const current=match;
 setTimeout(()=>{if(match===current&&screen==='play'){pulse.remove();done()}},kind==='sonar'?1450:900);
}
function action(i){
 if(match.phase!=='hunter'||match.result)return;
 const scanning=radar;let count=0,kind='miss';
 if(scanning){
   if(!match.sonar)return;
   match.sonar--;
   const x=i%8,y=Math.floor(i/8);
   count=cells(match.ship).filter((c,j)=>!match.damaged.includes(j)&&Math.abs(c%8-x)<=1&&Math.abs(Math.floor(c/8)-y)<=1).length;
   match.lastScan={square:i,n:count,turn:match.turn};
   match.log.push(`Search ${match.turn}: sonar at ${coord(i)} found ${count} intact section${count===1?'':'s'} nearby.`);
   kind='sonar';radar=false;
 }else{
   const j=cells(match.ship).indexOf(i),hit=j!==-1&&!match.damaged.includes(j);
   match.shots[i]=hit?'hit':'miss';if(hit)match.damaged.push(j);
   match.log.push(`Search ${match.turn}: fired at ${coord(i)}. ${hit?'Hit!':'Open water.'}`);
   match.lastTarget=i;kind=hit?'hit':'miss';
 }
 match.phase='resolving';
 showFeedback(i,kind,count,()=>{
   if(match.damaged.length===3){finish('hunter');return}
   match.phase='captain';
   if(mode==='ai')aiMove();else handoff('captain','The hunter has finished a search. Review your chart and choose a course.');
 });
}
function move(dx,dy){if(match.phase!=='captain')return;const s=match.ship;if(!fits(s.x+dx,s.y+dy,s.dir))return;s.x+=dx;s.y+=dy;match.log.push(dx||dy?`Search ${match.turn}: the convoy changed course.`:`Search ${match.turn}: the convoy held its course.`);if(match.turn>=LIMIT){finish('captain');return}match.turn++;match.phase='hunter';handoff('hunter','The captain has set a course. The sea chart is yours.')}
function aiMove(){const s=match.ship,choices=[[0,0],[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>fits(s.x+dx,s.y+dy,s.dir));const target=match.lastTarget;choices.sort((a,b)=>{const score=m=>{const c=cells({x:s.x+m[0],y:s.y+m[1],dir:s.dir});return c.reduce((v,i)=>v+(match.shots[i]?-3:0)+(target!==null?Math.abs(i%8-target%8)+Math.abs(Math.floor(i/8)-Math.floor(target/8)):0),0)+Math.random()*3};return score(b)-score(a)});const [dx,dy]=choices[0];moveAI(dx,dy)}
function moveAI(dx,dy){match.ship.x+=dx;match.ship.y+=dy;match.log.push(dx||dy?`Search ${match.turn}: the convoy changed course.`:`Search ${match.turn}: the convoy held its course.`);if(match.turn>=LIMIT){finish('captain');return}match.turn++;match.phase='hunter';play()}
function finish(winner){match.result=winner;screen='result';const winId=match[winner];store.record([match.hunter,match.captain],winId,mode==='ai'?'Solo':'Local two-player',match.log,`${winner==='hunter'?'All three sections hit':'Convoy survived twelve searches'}.`);shell(`<div class="panel"><p class="eyebrow">Voyage complete</p><h2>${winner==='hunter'?'The convoy is found.':'The convoy reaches dawn.'}</h2><p class="lead">${G.esc(name(winner))} wins. ${winner==='hunter'?`The final shot landed on search ${match.turn}.`:'The captain slipped past twelve searches.'}</p><div class="button-row"><button class="primary" id="again">Play again</button><button id="home">Home</button></div></div><div class="panel"><h3>Last known position</h3>${boardHTML('captain')}<p class="muted small">Gold marks the convoy at the end of the match. Red marks successful hits.</p></div><div class="panel"><h3>Voyage record</h3><ol class="log">${match.log.map(x=>`<li>${G.esc(x)}</li>`).join('')}</ol></div>`);$('again').onclick=()=>setup(mode);$('home').onclick=menu}
menu();
})();
