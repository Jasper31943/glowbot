#!/usr/bin/env python3
# dev tool (not pushed): art/feel screenshots. usage: artfeel-shots.py WxH[m] tag  → shots/artfeel/<tag>_<name>.png
import asyncio,json,subprocess,time,urllib.request,base64,os,websockets,tempfile,sys
ROOT='/workspace/robot-maze';size,tag=sys.argv[1],sys.argv[2];only=sys.argv[3:] 
HELP=r"""window.__place=(kind,dists,inv,held,face)=>{const S=__world.state(),W=__world.W;const b=(S.bosses||[]).find(o=>o.m===S.m&&o.kind===kind&&o.hp>0);if(!b)return {err:'no boss '+kind,all:(S.bosses||[]).filter(o=>o.m===S.m).map(o=>o.kind+o.hp)};
 for(const r of dists)for(const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]]){let ok=true;for(let k=1;k<=r;k++){const x=b.x+dx*k,y=b.y+dy*k;const Z=WE.zoneAt(W,S.m,x,y);if(!Z||(b.zone&&Z.id!==b.zone)||WE.solid(W,S,S.m,x,y)||(S.bosses||[]).some(o=>o!==b&&o.hp>0&&o.m===S.m&&o.x===x&&o.y===y)){ok=false;break}}
  if(!ok)continue;S.x=b.x+dx*r;S.y=b.y+dy*r;S.f=dy>0?'up':dy<0?'down':dx>0?'left':'right';S.inv=inv;S.held=held||0;S.zone=WE.zoneAt(W,S.m,S.x,S.y).id;S.zoneEntry=[S.x,S.y];__world.cam.init=false;
  ['help','title','menu'].forEach(i=>{const e=document.getElementById(i);if(e)e.classList.remove('on')});return {ok:1,b:[b.x,b.y,b.hp,b.gd],r:[S.x,S.y,S.f]}}
 return {err:'no spot'}};
window.__at=(x,y,f,inv,held)=>{const S=__world.state(),W=__world.W;S.x=x;S.y=y;S.f=f;S.inv=inv;S.held=held||0;S.zone=WE.zoneAt(W,S.m,x,y).id;S.zoneEntry=[x,y];__world.cam.init=false;
 ['help','title','menu'].forEach(i=>{const e=document.getElementById(i);if(e)e.classList.remove('on')});return {zone:S.zone}};
window.__boss=k=>{const S=__world.state();const b=(S.bosses||[]).find(o=>o.m===S.m&&o.kind===k);return b&&{x:b.x,y:b.y,hp:b.hp,gd:b.gd,fr:b.fr}};"""
SC=[ # name, map, steps
 ('tree_fire',  'forest',[('js',"__at(26,27,'left','F',0)"),('js',"__world.act('act')"),('sleep',.7),('js',"__world.act('left')"),('sleep',.6),('js',"__world.act('act')"),('shots',[.06,.09,.12,.16,.22,.3]),('sleep',1.0),('shot','guard2'),('js',"__boss('tree')"),
   ('js',"__world.act('act')"),('shots',[.05,.1,.16,.24],'defl'),('sleep',.8),('shot','guard1'),('js',"__boss('tree')")]),
 ('knight_bat', 'castle',[('js',"__place('knight',[1],'Q',0)"),('js',"__world.act('act')"),('shots',[.08,.11,.15,.2,.28])]),
 ('glitch_bat', 'factory',[('js',"__place('glitch',[1],'Q',0)"),('js',"__world.act('act')"),('shots',[.08,.12,.18,.26])]),
 ('golem_bomb', 'volcano',[('js',"(()=>{const r=__place('golem',[2,3],'',0);const S=__world.state(),b=S.bosses.find(o=>o.kind==='golem'&&o.hp>0);const W=__world.W;const c=[[0,-1],[0,1],[1,0],[-1,0]].map(([dx,dy])=>[b.x+dx,b.y+dy]).find(([x,y])=>!WE.solid(W,S,S.m,x,y)&&!(Math.abs(x-S.x)+Math.abs(y-S.y)<=1)&&!((x===S.x&&Math.abs(y-S.y)<=1)||(y===S.y&&Math.abs(x-S.x)<=1)));if(!c)return {err:'no bomb tile',r};S.bombs.push({m:S.m,x:c[0],y:c[1],t:3,ms:0});r.bomb=c;return r})()"),
   ('sleep',.9),('shot','fuse'),('waitjs',"__world.state().bombs.length===0",4),('shots',[.0,.03,.07,.12,.2,.3,.4,.5,.65])]),
 ('golem_ko',   'volcano',[('js',"(()=>{const S=__world.state(),b=S.bosses.find(o=>o.kind==='golem'&&o.hp>0);b.hp=1;const r=__place('golem',[2,3],'',0);const W=__world.W;const c=[[0,-1],[0,1],[1,0],[-1,0]].map(([dx,dy])=>[b.x+dx,b.y+dy]).find(([x,y])=>!WE.solid(W,S,S.m,x,y)&&!(Math.abs(x-S.x)+Math.abs(y-S.y)<=1)&&!((x===S.x&&Math.abs(y-S.y)<=1)||(y===S.y&&Math.abs(x-S.x)<=1)));if(!c)return {err:'no bomb tile',r};S.bombs.push({m:S.m,x:c[0],y:c[1],t:3,ms:0});r.bomb=c;return r})()"),
   ('waitjs',"__world.state().bombs.length===0",5),('shots',[.0,.06,.15,.25,.35,.5])]),
]
async def run(name,m,steps):
    port=9300+(os.getpid()+hash(name))%500;ud=tempfile.mkdtemp();mob=size.endswith('m');w,h=map(int,size.rstrip('m').split('x'))
    p=subprocess.Popen(['google-chrome','--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars',f'--remote-debugging-port={port}',f'--user-data-dir={ud}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        for _ in range(80):
            try:tl=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json'));break
            except Exception:time.sleep(.1)
        ws_url=[t for t in tl if t['type']=='page'][0]['webSocketDebuggerUrl']
        async with websockets.connect(ws_url,max_size=None) as ws:
            n=[0];errs=[]
            async def call(mm,**pa):
                n[0]+=1;i=n[0];await ws.send(json.dumps({'id':i,'method':mm,'params':pa}))
                while True:
                    r=json.loads(await ws.recv())
                    if r.get('method')=='Runtime.exceptionThrown':errs.append(r['params']['exceptionDetails'].get('exception',{}).get('description') or r['params']['exceptionDetails'].get('text'))
                    if r.get('id')==i:return r.get('result',{})
            async def ev(x):r=await call('Runtime.evaluate',expression=x,returnByValue=True);return r.get('result',{}).get('value')
            async def shot(nm):r=await call('Page.captureScreenshot',format='png');fn=f'{ROOT}/shots/artfeel/{tag}_{name}_{nm}.png';open(fn,'wb').write(base64.b64decode(r['data']));return fn
            await call('Runtime.enable');await call('Emulation.setDeviceMetricsOverride',width=w,height=h,deviceScaleFactor=1,mobile=mob);await call('Page.enable')
            await call('Page.navigate',url=f'file://{ROOT}/world.html?new&noassist&at={m}&wait=1');await asyncio.sleep(2.5);await ev(HELP)
            for st in steps:
                if st[0]=='js':print(name,'js',json.dumps(await ev(st[1]),ensure_ascii=False));await asyncio.sleep(.25 if 'place' in st[1] else 0)
                elif st[0]=='sleep':await asyncio.sleep(st[1])
                elif st[0]=='shot':print(name,await shot(st[1]))
                elif st[0]=='waitjs':
                    t0=time.time()
                    while time.time()-t0<st[2] and not await ev(st[1]):await asyncio.sleep(.005)
                elif st[0]=='shots':
                    t0=time.time()
                    for k,d in enumerate(st[1]):
                        while time.time()-t0<d:await asyncio.sleep(.002)
                        print(name,round(time.time()-t0,3),await shot(f'{st[2] if len(st)>2 else "hit"}{k}'))
            print(name,'errors',errs)
    finally:p.kill()
async def main():
    for nm,m,st in SC:
        if not only or nm in only:await run(nm,m,st)
asyncio.run(main())
