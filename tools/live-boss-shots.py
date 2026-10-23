#!/usr/bin/env python3
# phone-size (390x844, dpr 1, mobile) boss-room shots from local http server
import asyncio,json,subprocess,time,urllib.request,base64,os,websockets,tempfile,sys
SC=[('volcano','volcano','golem','lavaGiant'),('mine','mine','mole','moleKing'),('power','power','spark','sparkKing'),('clock','clock','guard','clockGuard'),('mirror','mirror','phantom','mirrorKing')]
PLACE=r"""(()=>{const kind=%r,fn=%r;window.__calls=0;const orig=window[fn];if(typeof orig!=='function')return {err:'no fn '+fn};
window[fn]=function(){window.__calls++;return orig.apply(this,arguments)};
const bs=(S.bosses||[]).filter(o=>o.m===S.m&&o.kind===kind&&o.hp>0);if(!bs.length)return {err:'no boss',all:(S.bosses||[]).filter(o=>o.m===S.m).map(o=>o.kind)};
const b=bs[0];let best=null;for(const r of [2,3,1])for(const [dx,dy] of [[0,r],[-r,0],[r,0],[0,-r]]){const x=b.x+dx,y=b.y+dy;
 if(best)break;const Z=WE.zoneAt(W,S.m,x,y);if(!Z||Z.id!==b.zone&&b.zone)continue;if(WE.solid(W,S,S.m,x,y))continue;if(WE.bossBodyAt&&0)continue;best=[x,y]}
if(!best)return {err:'no spot',b};S.x=best[0];S.y=best[1];S.f=best[1]>b.y?'up':best[1]<b.y?'down':best[0]>b.x?'left':'right';
S.zone=(WE.zoneAt(W,S.m,S.x,S.y)||{}).id||null;cam.init=false;resize();hud();
['help','title'].forEach(i=>{const e=document.getElementById(i);if(e)e.classList.remove('on')});
return {boss:{x:b.x,y:b.y,zone:b.zone,kind:b.kind,hp:b.hp},robot:best,zone:S.zone,m:S.m}})()"""
async def shot(name,m,kind,fn):
    port=9300+os.getpid()%400+len(name);ud=tempfile.mkdtemp()
    p=subprocess.Popen(['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars',f'--remote-debugging-port={port}',f'--user-data-dir={ud}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
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
                    if r.get('method')=='Runtime.exceptionThrown':errs.append(r['params']['exceptionDetails'].get('text'))
                    if r.get('method')=='Runtime.consoleAPICalled' and r['params']['type']=='error':errs.append(str(r['params']['args'])[:200])
                    if r.get('id')==i:return r.get('result',{})
            await call('Runtime.enable')
            await call('Emulation.setDeviceMetricsOverride',width=390,height=844,deviceScaleFactor=1,mobile=True)
            await call('Emulation.setTouchEmulationEnabled',enabled=True,maxTouchPoints=5)
            await call('Page.enable')
            await call('Page.navigate',url=f'http://127.0.0.1:8765/world.html?at={m}&noassist')
            await asyncio.sleep(4)
            r=await call('Runtime.evaluate',expression=PLACE%(kind,fn),returnByValue=True)
            info=r.get('result',{}).get('value')
            await asyncio.sleep(2.5)
            r=await call('Runtime.evaluate',expression="JSON.stringify({calls:window.__calls,errs:window.__errs,ov:[...document.querySelectorAll('.on')].map(e=>e.id||e.className),m:S.m,x:S.x,y:S.y})",returnByValue=True)
            after=r['result'].get('value')
            r=await call('Page.captureScreenshot',format='png');open(f'shots/live-check/{name}_boss_390.png','wb').write(base64.b64decode(r['data']))
            print(name,json.dumps(info),after,'cdpErrs',errs)
    finally:p.kill()
async def main():
    for s in SC:
        if len(sys.argv)>1 and s[0] not in sys.argv[1:]:continue
        await shot(*s)
asyncio.run(main())
