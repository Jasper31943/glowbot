# Lays out the 1x panels from tools/clock-mech-preview.js into shots/t5/clock_mech_design.png with Traditional Chinese labels.
import sys,os
from PIL import Image,ImageDraw,ImageFont
D,OUT=sys.argv[1],sys.argv[2]
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FN='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';FB='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
f=ImageFont.truetype(FN,15);fs=ImageFont.truetype(FN,13);fh=ImageFont.truetype(FB,22);ft=ImageFont.truetype(FB,28)
P=lambda n:Image.open(os.path.join(D,n+'.png')).convert('RGB')
S=3;W=1500;BG=(24,20,37);FG=(234,212,170);HI=(254,231,97);MUTE=(139,155,180)
im=Image.new('RGB',(W,3000),BG);d=ImageDraw.Draw(im)
y=[16]
def head(t,sub=None):
    y[0]+=10;d.text((24,y[0]),t,font=fh,fill=HI);y[0]+=34
    if sub:d.text((24,y[0]),sub,font=fs,fill=MUTE);y[0]+=24
def tw(t,fo):b=d.textbbox((0,0),t,font=fo);return b[2]-b[0]
def row(items,sc=S,gap=22,x0=24,one=True):
    # items: (panel, label lines). big = sc x, 1x copy under it on the left. column width = max(panel, label)
    x=x0;h=0
    for n,lab in items:
        p=P(n);big=p.resize((p.width*sc,p.height*sc),Image.NEAREST);ls=lab.split('\n')
        cw=max(big.width,max(tw(l,f if i==0 else fs) for i,l in enumerate(ls)))
        if x+cw>W-20:y[0]+=h+14;x=x0;h=0
        bx=x+(cw-big.width)//2;im.paste(big,(bx,y[0]))
        if one:im.paste(p,(bx,y[0]+big.height+4))
        ly=y[0]+big.height+(p.height+10 if one else 6)
        for i,l in enumerate(ls):d.text((x,ly+i*19),l,font=f if i==0 else fs,fill=FG if i==0 else MUTE)
        x+=cw+gap;h=max(h,ly-y[0]+19*len(ls))
    y[0]+=h+14
d.text((24,y[0]),'鐘塔機關 v2 設計稿：齒輪門 ＋ 鐘擺',font=ft,fill=(255,255,255));y[0]+=40
d.text((24,y[0]),'每格 16×16、Endesga 32。大圖 = 3 倍（手機約 50px 一格），大圖下方的小圖 = 1 倍實際大小。每個狀態都用「形狀＋顏色」區分，色弱也看得出來。',font=fs,fill=MUTE);y[0]+=26
head('① 齒輪門：四種狀態','上方黃銅橫樑有 4 顆節奏燈：空心圈 = 那一步是開的，實心橫槓 = 那一步是關的；黃色框 = 現在這一步。柵欄上的齒輪每走一步轉一格（中間的小亮點會換位置）。')
row([('gate_open','開著\n柵欄收在頂上，看得到地板 = 可以走'),('gate_closing','快關了（警告）\n柵欄降到一半、紅色尖齒＋▼'),('gate_closing_b','快關了（閃爍第二格）\n門柱黑黃斜紋閃紅'),('gate_closed','關著\n柵欄插到地板、後面是暗的'),('gate_opening','關著但下一步會開\n柵欄抬起一點、露出地板縫＋綠色▲')])
head('② 齒輪門節奏：連續 4 步（每走一步，時鐘走一格）','這扇門在第 0、1 步開，第 2、3 步關。小光在門左邊等。站在門裡時看到「快關了」就要馬上走出去，不然會被夾。')
row([('gcyc_0','第 0 步：開著\n燈：◯◯■■，框在第 1 顆'),('gcyc_1','第 1 步：快關了！\n框在第 2 顆，下一顆是實心'),('gcyc_2','第 2 步：關著\n框在第 3 顆'),('gcyc_3','第 3 步：下一步會開\n框在第 4 顆，下一顆是空心'),('gcyc_4','第 4 步 = 第 0 步：開著\n又回到第 1 顆')])
head('③ 鐘擺：狀態與擺動動畫','鐘擺掃的是它掛著的這一格。紅色斜紋框＋大 X = 這格下一步會被打到（紅色看不出來也看得到 X 和斜紋）。')
row([('pend_ready','準備打（危險）\n舉在一邊、刀口紅、白色虛線＝要掃過來'),('pend_dangerB','危險（閃爍第二格）\n刀口和虛線閃'),('pend_s1','擺動中 1\n往下衝'),('pend_hit','擺動中 2：打到\n經過正中間、地上火花'),('pend_s3','擺動中 3\n往另一邊甩上去'),('pend_safe','安全\n收在上角、被小勾扣住、地板乾淨'),('pend_back','擺回來\n準備從另一邊打'),('pend_ready2','準備打（另一邊）\n鏡像'),('pend_mark','地上危險標記\n（只有地板）')],gap=22)
head('④ 鐘擺節奏：連續 4 步','這個鐘擺在單數步打。看到紅框就等一步（按動作），變成「安全」再走上去，走上去之後要繼續往前走，不要停在上面。')
row([('pcyc_0','第 0 步：危險\n小光在左邊等'),('pcyc_1','第 1 步：安全\n現在可以走上去'),('pcyc_2','第 2 步：小光在鐘擺格\n又變危險 → 繼續走'),('pcyc_3','第 3 步：安全\n小光已經走過去')])
# comparison
head('⑤ 舊版 → 暫時版 → 新版','舊版的黃色太陽像裝飾、黑色門縫看起來像關著；新版改成黃銅柵欄門＋齒輪，開＝看得到地板，關＝柵欄插到底。')
old=Image.open(os.path.join(ROOT,'shots/t5/jasper_t5_old.png')).convert('RGB')
def crop(b):c=old.crop(b);return c.resize((144,144),Image.NEAREST) if c.width>60 else c.resize((48,144),Image.NEAREST)
oc=[('舊：關著（黃太陽）',old.crop((47,507,125,585)).resize((144,144),Image.NEAREST)),('舊：開著（黑門縫）',old.crop((47,347,125,425)).resize((144,144),Image.NEAREST)),('舊：鐘擺（掛鉤＋小方塊）',old.crop((1030,498,1110,578)).resize((144,144),Image.NEAREST))]
items=[(c,lab) for lab,c in oc]+[None]
for n,lab in [('tmp_gate_closed','暫時：關'),('tmp_gate_open','暫時：開'),('tmp_pend_d','暫時：鐘擺危險'),('tmp_pend_s','暫時：鐘擺安全')]:
    q=P(n);q=q.resize((q.width*S,q.height*S),Image.NEAREST);items.append((q.crop((0,0,q.width,144)),lab))
items.append(None)
for n,lab in [('new_gate_closed','新：關'),('new_gate_open','新：開'),('new_pend_d','新：鐘擺危險'),('new_pend_s','新：鐘擺安全')]:
    q=P(n);q=q.resize((q.width*S,q.height*S),Image.NEAREST);items.append((q.crop((0,0,q.width,144)),lab))
x=24
for it in items:
    if it is None:
        sep=sep+1 if 'sep' in globals() else 1
        if sep==2:y[0]+=186;x=24;continue
        d.line((x,y[0],x,y[0]+170),fill=MUTE);x+=14;continue
    c,lab=it;cw=max(c.width,tw(lab,fs))
    if x+cw>W-20:y[0]+=186;x=24
    im.paste(c,(x+(cw-c.width)//2,y[0]+(144-c.height)//2 if c.height<144 else y[0]));d.text((x,y[0]+152),lab,font=fs,fill=FG);x+=cw+14
y[0]+=186
head('⑥ 手機實際大小示意：T5 類型走廊（左：第 0 步，右：第 1 步）','上門 ¤（第 0、1 步開）：第 0 步「開著」→ 第 1 步「快關了」。下門 ¢（第 2、3 步開）：「關著」→「下一步會開」。左鐘擺 n 第 0 步紅框、第 1 步收起；右鐘擺 s 相反。小光仍是畫面上最亮的。')
x=24
for n in ['corridor0','corridor1']:
    c=P(n);big=c.resize((c.width*S,c.height*S),Image.NEAREST);im.paste(big,(x,y[0]));im.paste(c,(x,y[0]+big.height+6));x+=big.width+30
lx=x;ly=y[0]
for t,cl in [('看圖說明：',HI),('◯ 空心燈 = 那一步門開',FG),('■ 實心橫槓 = 那一步門關',FG),('黃框 = 現在走到第幾步',FG),('柵欄在頂上、看到地板 = 能走',FG),('柵欄降一半＋黑黃斜紋＋紅▼',FG),('　= 下一步關，快離開',FG),('柵欄插到底＋齒輪 = 關著',FG),('抬起一點＋綠▲ = 下一步開',FG),('地上紅斜紋框＋大 X',FG),('　= 下一步被鐘擺打',FG),('鐘擺收在上角 = 安全',FG)]:
    d.text((lx,ly),t,font=f,fill=cl);ly+=26
y[0]+=max(big.height+c.height+20,ly-y[0])+10
head('⑦ 色弱／灰階檢查','全部轉成灰階後，每個狀態仍靠形狀分得出來：柵欄高度、▲▼、斜紋、X、燈的空心／實心。')
gs=[]
for n,lab in [('gate_open','開著'),('gate_closing','快關了'),('gate_closed','關著'),('gate_opening','下一步會開'),('pend_ready','鐘擺危險'),('pend_safe','鐘擺安全')]:
    q=P(n).convert('L').convert('RGB');q.save(os.path.join(D,'g_'+n+'.png'));gs.append(('g_'+n,lab))
row(gs,one=False)
im=im.crop((0,0,W,y[0]));im.save(OUT);print('wrote',OUT,im.size)
