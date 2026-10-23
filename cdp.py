#!/usr/bin/env python3
"""(EVAL=js env: evaluate after load, print result, then screenshot)
Headless Chrome via CDP with true viewport emulation (plain --window-size can't go below 500px wide).
usage: cdp.py WxH[m] URLQUERY [screenshot.png] [wait_s]   ('m' suffix = mobile/touch emulation)"""
import asyncio,json,subprocess,sys,time,urllib.request,base64,os,websockets,tempfile
async def main():
    size,q=sys.argv[1],sys.argv[2];shot=sys.argv[3] if len(sys.argv)>3 and sys.argv[3]!='-' else None;wait=float(sys.argv[4]) if len(sys.argv)>4 else 4
    mob=size.endswith('m');w,h=map(int,size.rstrip('m').split('x'))
    port=9300+os.getpid()%500;ud=tempfile.mkdtemp()
    p=subprocess.Popen(['google-chrome','--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars',f'--remote-debugging-port={port}',f'--user-data-dir={ud}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:tl=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json'));break
            except Exception:time.sleep(.1)
        ws_url=[t for t in tl if t['type']=='page'][0]['webSocketDebuggerUrl']
        async with websockets.connect(ws_url,max_size=None) as ws:
            n=[0];errs=[]
            async def call(m,**pa):
                n[0]+=1;i=n[0];await ws.send(json.dumps({'id':i,'method':m,'params':pa}))
                while True:
                    r=json.loads(await ws.recv())
                    if r.get('method')=='Runtime.exceptionThrown':errs.append(r['params']['exceptionDetails'].get('text'))
                    if r.get('method')=='Runtime.consoleAPICalled' and r['params']['type']=='error':errs.append(str(r['params']['args']))
                    if r.get('id')==i:return r.get('result',{})
            await call('Runtime.enable')
            await call('Emulation.setDeviceMetricsOverride',width=w,height=h,deviceScaleFactor=1,mobile=mob)
            if mob:await call('Emulation.setTouchEmulationEnabled',enabled=True,maxTouchPoints=5);await call('Emulation.setEmitTouchEventsForMouse',enabled=True)
            await call('Page.enable')
            await call('Page.navigate',url='file://'+os.path.dirname(os.path.abspath(__file__))+'/'+(q if '.html' in q else 'index.html?'+q))
            t0=time.time()
            while time.time()-t0<wait:
                r=await call('Runtime.evaluate',expression="(document.getElementById('testout')||{}).textContent||''",returnByValue=True)
                v=r['result'].get('value')
                if v:break
                await asyncio.sleep(.1)
            ex=os.environ.get('EVAL')
            if ex:
                r=await call('Runtime.evaluate',expression=ex,returnByValue=True,awaitPromise=True);print('EVAL',json.dumps(r.get('result',{}).get('value'),ensure_ascii=False),(r.get('exceptionDetails') or {}).get('text',''))
                await asyncio.sleep(float(os.environ.get('EVAL_WAIT','1')))
            if shot:
                r=await call('Page.captureScreenshot',format='png');open(shot,'wb').write(base64.b64decode(r['data']))
            out=json.loads(v) if v else {}
            out['cdpErrors']=errs;print(json.dumps(out,ensure_ascii=False))
    finally:p.kill()
asyncio.run(main())
