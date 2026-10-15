// music.js — procedural 8-bit background music for Glowbot (Web Audio, no files, no libs).
// API: Music.play(name), Music.stop(), Music.setMuted(bool), Music.isMuted(), Music.setVolume(v)
// Add scenes to TRACKS below; unknown names fall back to 'grass'.
(function(){
'use strict';
var KEY='glowbot_music_muted', VKEY='glowbot_music_volume';
var MASTER=0.15, FADE=0.8, LOOK=0.12, TICK=25;
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
// Chords are MIDI root + quality; melody rows are 16 steps (16th notes), numbers = semitones above key, null = rest.
var MAJ=[0,4,7], MIN=[0,3,7];
var _=null;
var TRACKS={
  grass:{bpm:120,key:60,lead:'square',leadVol:0.5,bassWave:'triangle',arpWave:'square',arpVol:0.12,drums:true,
    // 16 bars: A A' B B'  (I V vi IV / I IV V I ...)
    chords:[[0,MAJ],[7,MAJ],[9,MIN],[5,MAJ], [0,MAJ],[7,MAJ],[9,MIN],[5,MAJ],
            [5,MAJ],[0,MAJ],[7,MAJ],[9,MIN], [5,MAJ],[0,MAJ],[7,MAJ],[0,MAJ]],
    mel:[
     [12,_,16,_,19,_,16,_,12,_,14,_,16,_,_,_],[14,_,19,_,23,_,19,_,14,_,16,_,14,_,_,_],
     [16,_,21,_,24,_,21,_,19,_,16,_,12,_,_,_],[17,_,16,_,14,_,12,_,14,_,_,_,_,_,_,_],
     [12,_,16,_,19,_,24,_,23,_,21,_,19,_,_,_],[14,_,19,_,23,_,26,_,24,_,23,_,21,_,_,_],
     [21,_,19,_,16,_,19,_,21,_,24,_,21,_,_,_],[17,_,19,_,21,_,17,_,19,_,_,_,_,_,_,_],
     [17,17,_,21,_,24,_,21,17,_,19,_,21,_,_,_],[16,16,_,19,_,24,_,19,16,_,14,_,12,_,_,_],
     [14,14,_,19,_,23,_,19,14,_,16,_,19,_,_,_],[21,_,19,_,16,_,12,_,16,_,_,_,_,_,_,_],
     [17,_,21,_,24,_,29,_,28,_,24,_,21,_,_,_],[19,_,24,_,28,_,24,_,19,_,16,_,12,_,_,_],
     [14,_,17,_,19,_,23,_,26,_,23,_,19,_,_,_],[24,_,19,_,16,_,19,_,24,_,_,_,_,_,_,_]]},
  ice:{bpm:100,key:62,lead:'triangle',leadVol:0.7,bassWave:'triangle',arpWave:'square',arpVol:0.07,bell:true,drums:false,
    // D major-ish, airy: I iii IV I / vi IV I V ...
    chords:[[0,MAJ],[4,MIN],[5,MAJ],[0,MAJ], [0,MAJ],[4,MIN],[5,MAJ],[7,MAJ],
            [9,MIN],[5,MAJ],[0,MAJ],[7,MAJ], [9,MIN],[5,MAJ],[7,MAJ],[0,MAJ]],
    mel:[
     [24,_,_,_,28,_,_,_,31,_,28,_,26,_,_,_],[23,_,_,_,26,_,_,_,28,_,_,_,_,_,_,_],
     [29,_,_,_,28,_,26,_,24,_,_,_,21,_,_,_],[24,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
     [24,_,_,_,28,_,_,_,31,_,33,_,31,_,_,_],[28,_,_,_,31,_,_,_,35,_,_,_,_,_,_,_],
     [33,_,_,_,31,_,29,_,28,_,_,_,26,_,_,_],[26,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
     [33,_,31,_,28,_,_,_,24,_,28,_,33,_,_,_],[29,_,28,_,24,_,_,_,21,_,24,_,29,_,_,_],
     [28,_,31,_,36,_,_,_,31,_,28,_,24,_,_,_],[26,_,_,_,31,_,_,_,30,_,_,_,_,_,_,_],
     [33,_,36,_,40,_,_,_,36,_,33,_,28,_,_,_],[29,_,33,_,36,_,_,_,33,_,29,_,24,_,_,_],
     [31,_,35,_,38,_,_,_,35,_,31,_,26,_,_,_],[36,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_]]}
};
// Later scenes: add entries here (desert, forest, swamp, mine, volcano, sea, castle, sky, mirror, power, clock, factory, core).

function tone(ctx,dest,type,freq,t,dur,vol,att,rel){
  var o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);
  att=att||0.005;rel=rel||0.05;
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+att);
  g.gain.setValueAtTime(vol,t+Math.max(att,dur-rel));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+0.02);
}
var noiseBuf=null;
function noise(ctx,dest,t,dur,vol,hp){
  if(!noiseBuf||noiseBuf.sampleRate!==ctx.sampleRate){noiseBuf=ctx.createBuffer(1,ctx.sampleRate*0.3,ctx.sampleRate);var d=noiseBuf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;f.type='highpass';f.frequency.value=hp;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+0.02);
}
// Schedule one 16th-note step of a track.
function step(ctx,dest,tr,i,t){
  var sp=60/tr.bpm/4,bars=tr.chords.length,bar=Math.floor(i/16)%bars,s=i%16,ch=tr.chords[bar],root=tr.key+ch[0];
  var n=tr.mel[bar][s];
  if(n!==null){var len=1;while(s+len<16&&tr.mel[bar][s+len]===null&&len<4)len++;
    tone(ctx,dest,tr.lead,mtof(tr.key+n),t,sp*len*0.9,0.11*tr.leadVol,0.005,0.06);
    if(tr.bell)tone(ctx,dest,'sine',mtof(tr.key+n+12),t,sp*6,0.05,0.002,sp*5);}
  // bass: root on 1 and 3 (octave bounce on 2,4 for grass)
  if(s%4===0){var b=root-24+((s===4||s===12)&&tr.drums?12:0);tone(ctx,dest,tr.bassWave,mtof(b),t,sp*(tr.drums?1.8:3.6),0.22,0.005,0.05);}
  // arpeggio
  if(tr.bell? s%2===0 : true){var a=ch[1][(tr.bell?s/2:s)%3]+root+12;tone(ctx,dest,tr.arpWave,mtof(a),t,sp*0.6,tr.arpVol*0.5,0.002,0.03);}
  if(tr.drums){if(s%8===0)tone(ctx,dest,'sine',110,t,0.12,0.25,0.001,0.1);
    if(s%8===4)noise(ctx,dest,t,0.1,0.12,1500);if(s%2===0)noise(ctx,dest,t,0.03,0.04,7000);}
  else if(s%4===2)noise(ctx,dest,t,0.05,0.02,9000);
}
function trackFor(name){return TRACKS[name]?name:'grass';}

var ctx=null,master=null,cur=null,timer=null,want=null;
var muted=false,vol=MASTER;
try{muted=localStorage.getItem(KEY)==='1';var v=parseFloat(localStorage.getItem(VKEY));if(v>=0&&v<=1)vol=v;}catch(e){}
function ensure(){
  if(ctx)return ctx;var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  ctx=new AC();master=ctx.createGain();master.gain.value=muted?0:vol;master.connect(ctx.destination);return ctx;
}
function sched(){
  if(!ctx)return;var horizon=ctx.currentTime+LOOK;
  [cur].concat(cur&&cur.old?[cur.old]:[]).forEach(function(p){
    if(!p||p.dead)return;var tr=TRACKS[p.name],sp=60/tr.bpm/4;
    while(p.next<horizon){if(p.next>=ctx.currentTime-0.05)step(ctx,p.bus,tr,p.i,p.next);p.i++;p.next+=sp;}
  });
  if(cur&&cur.old&&cur.old.end<ctx.currentTime){cur.old.bus.disconnect();cur.old=null;}
}
function startTimer(){if(!timer)timer=setInterval(sched,TICK);}
function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
function begin(name){
  if(!ensure()||ctx.state!=='running')return;
  var t=ctx.currentTime,bus=ctx.createGain();bus.connect(master);
  bus.gain.setValueAtTime(0.0001,t);bus.gain.exponentialRampToValueAtTime(1,t+FADE);
  var old=cur;if(old){old.bus.gain.cancelScheduledValues(t);old.bus.gain.setValueAtTime(old.bus.gain.value||1,t);
    old.bus.gain.exponentialRampToValueAtTime(0.0001,t+FADE);old.end=t+FADE+0.1;if(old.old){old.old.bus.disconnect();}old.old=null;}
  cur={name:name,bus:bus,i:0,next:t+0.05,old:old};startTimer();sched();
}
var Music={
  play:function(name){name=trackFor(name);want=name;if(cur&&cur.name===name)return;begin(name);},
  stop:function(){want=null;if(!cur||!ctx)return;var t=ctx.currentTime,c=cur;c.bus.gain.cancelScheduledValues(t);c.bus.gain.setValueAtTime(c.bus.gain.value||1,t);
    c.bus.gain.exponentialRampToValueAtTime(0.0001,t+FADE);c.dead=true;setTimeout(function(){c.bus.disconnect();},FADE*1000+200);cur=null;},
  setMuted:function(m){muted=!!m;try{localStorage.setItem(KEY,muted?'1':'0');}catch(e){}
    if(master){var t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setTargetAtTime(muted?0:vol,t,0.05);}},
  isMuted:function(){return muted;},
  setVolume:function(v){vol=Math.max(0,Math.min(1,+v||0));try{localStorage.setItem(VKEY,String(vol));}catch(e){}if(master&&!muted)master.gain.setTargetAtTime(vol,ctx.currentTime,0.05);},
  tracks:function(){return Object.keys(TRACKS);},
  // Offline render for testing: returns Promise<AudioBuffer>
  render:function(name,secs,rate){var tr=TRACKS[trackFor(name)],r=rate||44100,oc=new OfflineAudioContext(1,Math.ceil(r*secs),r),m=oc.createGain();
    m.gain.value=MASTER;m.connect(oc.destination);var sp=60/tr.bpm/4;for(var i=0,t=0;t<secs;i++,t+=sp)step(oc,m,tr,i,t);return oc.startRendering();},
  loopSeconds:function(name){var tr=TRACKS[trackFor(name)];return tr.chords.length*16*60/tr.bpm/4;}
};
window.Music=Music;
// Unlock on first gesture (browsers require it); start any track requested before that.
function unlock(){if(!ensure())return;var p=ctx.resume&&ctx.resume();Promise.resolve(p).then(function(){if(want&&!cur)begin(want);});}
['pointerdown','keydown','touchstart'].forEach(function(ev){addEventListener(ev,unlock,{capture:true,passive:true});});
document.addEventListener('visibilitychange',function(){if(!ctx)return;
  if(document.hidden){stopTimer();ctx.suspend();}else{ctx.resume().then(function(){if(cur){cur.next=Math.max(cur.next,ctx.currentTime+0.05);}startTimer();});}});
})();
