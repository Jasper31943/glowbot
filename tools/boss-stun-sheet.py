# Lays out tools/boss-stun-preview.js panels into shots/t9/boss_stun_design.png (Traditional Chinese) + 2x crops.
import sys,os
from PIL import Image,ImageDraw,ImageFont
D,OUT,CROPS=sys.argv[1:4]
FN='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';FB='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
f=ImageFont.truetype(FN,15);fs=ImageFont.truetype(FN,13);fh=ImageFont.truetype(FB,22);ft=ImageFont.truetype(FB,28)
P=lambda n:Image.open(os.path.join(D,n+'.png')).convert('RGB')
W=1500;BG=(24,20,37);FG=(234,212,170);HI=(254,231,97);MUTE=(139,155,180)
os.makedirs(CROPS,exist_ok=True)
for fn in os.listdir(D):
    if fn.endswith('.png'):
        q=Image.open(os.path.join(D,fn)).convert('RGB');q.resize((q.width*2,q.height*2),Image.NEAREST).save(os.path.join(CROPS,fn[:-4]+'_2x.png'))
im=Image.new('RGB',(W,8000),BG);d=ImageDraw.Draw(im);y=[16]
def tw(t,fo):b=d.textbbox((0,0),t,font=fo);return b[2]-b[0]
def head(t,sub=None):
    y[0]+=10;d.text((24,y[0]),t,font=fh,fill=HI);y[0]+=34
    if sub:
        for l in sub.split('\n'):d.text((24,y[0]),l,font=fs,fill=MUTE);y[0]+=20
        y[0]+=6
def row(items,sc=2,gap=14,x0=24,gray=False,crop=None):
    x=x0;h=0
    for n,lab in items:
        p=P(n)
        if crop:p=p.crop(crop)
        if gray:p=p.convert('L').convert('RGB')
        big=p.resize((p.width*sc,p.height*sc),Image.NEAREST);ls=lab.split('\n')
        cw=max(big.width,max(tw(l,f if i==0 else fs) for i,l in enumerate(ls)))
        if x+cw>W-20:y[0]+=h+14;x=x0;h=0
        im.paste(big,(x+(cw-big.width)//2,y[0]));ly=y[0]+big.height+6
        for i,l in enumerate(ls):d.text((x,ly+i*19),l,font=f if i==0 else fs,fill=FG if i==0 else MUTE)
        x+=cw+gap;h=max(h,ly-y[0]+19*len(ls))
    y[0]+=h+14
d.text((24,y[0]),'設計稿 T9：王被球棒打昏 ＝ 炸彈的時機',font=ft,fill=(255,255,255));y[0]+=42
for l in ['新規則：古堡（騎士王 knight）、發電廠（電火花王 spark）的王，只有被球棒打昏的時候炸彈才炸得痛。昏幾步先定 3 步，之後可以改（支援 1～N 步）。',
          '畫法：原本的王圖不改、照原樣呼叫（往下沉 1px＝癱軟），再疊上：頭上轉圈的星星（跟礦坑蝙蝠被打昏一樣）、暈眩的漩渦眼、每隻王自己的樣子，',
          '頭上還有「小炸彈＋剩幾步」的小格子：亮的格子＝還剩幾步。最後一步：只剩一顆慢慢垂下來的琥珀色星星，最後一格變橘色、每秒換一次顏色（1Hz）。',
          '不用白色、不加紅色；星星和眼睛是「轉」的，不是閃。每個房間：小光在左邊、炸彈和黃色炸彈範圍在王的右邊（範圍蓋到王）。大圖 3 倍。']:
    d.text((24,y[0]),l,font=fs,fill=MUTE);y[0]+=20
y[0]+=8
NM={'knight':('A 騎士王 knight（古堡）','頭盔被打歪（左低右高）、面罩滑下來、兩個漩渦眼，面罩兩角冒出小小的琥珀色火花。'),
    'spark':('B 電火花王 spark（發電廠）','電被打散：球體蓋一層深藍、中心的電核在琥珀色和暗藍之間每秒換一次（1Hz），頭上的電花往下掉、慢慢熄掉。眼睛變漩渦。'),
    'glitch':('C 故障機器人 glitch（夜間工廠，也是 STUNBOSS）','螢幕熄掉，只剩一個掃描點在跑；煙囪冒灰煙。現在工廠的炸彈規則沒變，所以只是同一套樣子，給之後用。')}
for k,(t,sub) in NM.items():
    head(t,sub)
    row([(k+'_normal','正常\n（沒有昏）'),(k+'_now','目前引擎\n原圖＋stunStars'),(k+'_s3','昏了・剩 3 步\n小炸彈＝現在炸得痛'),(k+'_s2','剩 2 步'),(k+'_s1','剩 1 步（最後一步）\n星星 1 顆、格子變橘'),(k+'_s1b','剩 1 步・另一拍\n橘↔琥珀，1Hz'),(k+'_end','醒來那一格\n往上彈 1px、星星甩開')],sc=3,gap=10,crop=(0,0,112,80))
head('D 其他情況','火吐昏或騎士王撞牆昏（炸彈「不」算數的話）：傳 bombOk:false → 不畫小炸彈，只畫星星和步數。昏的步數改長：≤5 步用格子，>5 步改用數字。')
row([('knight_nobomb','騎士王・火吐昏\nbombOk:false，沒有小炸彈'),('spark_nobomb','電火花王・火吐昏'),('knight_max5','昏 5 步・剩 4'),('knight_max8','昏 8 步・剩 7\n（改用數字）'),('knight_dir3','騎士王面向右'),('spark_dir3','電火花王面向右')],sc=3,gap=10,crop=(0,0,112,80))
head('E 灰階檢查','轉成灰階後：星星、步數格子、小炸彈都還看得出來；最後一步靠「只剩一格＋格子外框」而不是靠顏色分辨。')
row([(k+s,lab) for k in ['knight','spark'] for s,lab in [('_s3','剩 3'),('_s1','剩 1'),('_end','醒來')]],sc=2,gap=10,gray=True,crop=(0,0,112,80))
im=im.crop((0,0,W,y[0]));im.save(OUT);print('wrote',OUT,im.size)
