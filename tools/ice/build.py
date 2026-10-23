import json
lv=json.load(open(__import__('os').path.dirname(__file__)+'/lv.json'))
def T(g,k):
    for _ in range(k%4): g=[''.join(g[len(g)-1-r][c] for r in range(len(g))) for c in range(len(g[0]))]
    if k>=4: g=[row[::-1] for row in g]
    return g
H,W=30,28
G=[['#']*W for _ in range(H)]
def put(r,c,ch):G[r][c]=ch
zones=[]
def paste(name,src,r0,c0,entry,exit,sub={}):
    g=[list(x) for x in src]
    for r,row in enumerate(g):
        for c,ch in enumerate(row):
            ch=sub.get(ch,ch)
            if ch=='S':ch='.'
            if ch=='G':ch='.'
            G[r0+r][c0+c]=ch
    zones.append((name,r0,r0+7,c0,c0+6,entry,exit))
def line(a,b):
    (r1,c1),(r2,c2)=a,b
    for r in range(min(r1,r2),max(r1,r2)+1):
        for c in range(min(c1,c2),max(c1,c2)+1):G[r][c]='.'
# Z1 L7 (k2)
paste('A 初次滑冰（第 7 關）',T(lv['7'],2),20,2,(25,5),(21,7))
put(27,5,'.');put(20,7,'.')
# Z2 L8 (k2)
paste('B 冰上折返（第 8 關）',T(lv['8'],2),20,10,(25,11),(21,12)); put(25,10,'.');put(20,12,'.')
# Z3 L9 (k2)
paste('C 小心陷阱（第 9 關）',T(lv['9'],2),20,18,(23,19),(21,20)); put(23,18,'.');put(20,20,'.')
# Z4 L10 (k6)
paste('D 冰湖迷途（第 10 關）',T(lv['10'],6),11,18,(13,23),(12,21)); put(13,24,'.');put(11,21,'.')
# Z5 L3 (k7) key m
paste('E 冰面滑行・紫鑰匙（第 3 關）',T(lv['3'],7)+['#######'],11,10,(16,15),(12,10),{'c':'m','C':'M'}); put(16,16,'.')
# Z6 L11 (k6)
paste('F 冰上推箱（第 11 關）',T(lv['11'],6),11,2,(17,6),(11,7)); put(17,8,'.')
# Z7 L12 (k6) claws at exit
paste('G 冰原終章・冰爪（第 12 關）',T(lv['12'],6),2,2,(6,7),(2,4),{'G':'k'}); put(9,7,'.')
G[2][4]='k'; G[5][6]='.'   # was ice: boxes slide in big-map rules, original L12 becomes unsolvable
# Z8 patrol (new)
paste('H 雪球巡邏（新）',["###.###", "#.....#", "#.##B##", "#....P#", "###.###", "#...#.#", "#.#...#", "#######"],2,10,(3,13),(8,16)); put(8,16,'.')
# Z9 claws + hard ice bomb (new)
paste('I 強冰炸彈（新）',["#######",
                        "###b###",
                        "#IIIII#",
                        "#..####",
                        "..JJJJ%",
                        "#######",
                        "#######",
                        "#######"],2,18,(6,19),(6,24))
# corridors
line((28,1),(28,5)); put(28,1,'1'); put(27,1,'M')       # T1 + shortcut door M
line((19,7),(19,9)); line((19,9),(25,9))                 # A -> B
line((19,12),(19,17)); line((19,17),(23,17))             # B -> C
line((19,20),(19,25)); line((19,25),(13,25))             # C -> D
line((10,21),(10,17)); line((10,17),(16,17))             # D -> E
line((12,9),(17,9))                                      # E -> F
line((10,7),(10,7))                                      # F -> G
line((1,4),(1,13))                                       # G -> H
line((1,1),(1,4)); line((1,1),(26,1))                    # shortcut down to M door / T1
line((8,17),(6,17))                                      # H -> I
line((6,25),(6,26)); line((6,26),(3,26)); put(3,26,'R'); put(2,26,'2')  # I -> rune stone -> tunnel 2
G[6][24]='%'; G[6][25]='f'   # rune fragment right after zone I's exit
txt='\n'.join(''.join(r) for r in G)
print(txt)
json.dump({'grid':[''.join(r) for r in G],'zones':zones},open(__import__('os').path.dirname(__file__)+'/ice.json','w'),ensure_ascii=False)
