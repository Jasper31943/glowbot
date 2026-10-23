# NOTE: world/ice.txt has hand edits since (fragment f, tunnel-2 text). Re-running this overwrites them.
import json
d=json.load(open('ice.json'));g=d['grid']
out=['冰原（地圖 2）  %d 欄 × %d 行'%(len(g[0]),len(g)),
'圖例：沿用 levels.js 與 grass.txt；I 普通冰（有冰爪就不滑）、J 強冰（有冰爪也會滑）、k 冰爪、m 紫鑰匙、M 紫門、P 雪球巡邏怪、R 符文石（之後的道具才移得開）','','```']+g+['```','',
'隧道口',
'| 數字 | 這一端 | 另一端 | 條件 |',
'| 1 | 冰原 第 29 行、第 2 列 | 草原 第 3 行、第 4 列 | 進來時就在這裡；正上方的紫門 M 是回程捷徑 |',
'| 2 | 冰原 第 3 行、第 27 列 | 古堡（待定） | 前面有符文石 R 擋住（第 4 行、第 27 列），要之後的道具 |','',
'謎題區（重設只恢復該長方形；行列從 1 起算）']
for (n,r1,r2,c1,c2,en,ex) in d['zones']:
    out.append('區域 %s：第 %d–%d 行、第 %d–%d 列｜入口 (%d,%d)｜出口 (%d,%d)'%(n.split()[0],r1+1,r2+1,c1+1,c2+1,en[0]+1,en[1]+1,ex[0]+1,ex[1]+1))
out+=['','| 區域 | 來源 | 內容 |']
desc={'A':'入門滑冰','B':'冰上折返','C':'尖刺 H 在冰道上','D':'冰湖迷途','E':'c/C 換成紫鑰匙 m / 紫門 M','F':'箱子推上開關開門','G':'箱子開關；出口格放冰爪 k','H':'雪球巡邏怪 P 左右來回；可用箱子擋住或炸彈炸掉','I':'冰爪才能停在冰上拿炸彈；把炸彈放在強冰上推出去，滑到裂牆前爆炸'}
for (n,*_) in d['zones']:
    k=n.split()[0];out.append('| %s | %s | %s |'%(n,'新設計' if '新' in n else '改編',desc[k]))
out+=['','回程捷徑：拿到紫鑰匙 m 後，北邊走廊（第 2 行）一路往西再往南，穿過紫門 M（第 28 行、第 2 列）直接回到隧道 1。']
open('/workspace/robot-maze/world/ice.txt','w').write('\n'.join(out)+'\n')
