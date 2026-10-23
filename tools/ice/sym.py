import json
lv=json.load(open('lv.json'))
def T(g,k):
    for _ in range(k%4): g=[''.join(g[len(g)-1-r][c] for r in range(len(g))) for c in range(len(g[0]))]
    if k>=4: g=[row[::-1] for row in g]
    return g
for n,g in lv.items():
    for k in range(8):
        t=T(g,k)
        if len(t[0])!=7: continue
        S=[(r,c) for r,row in enumerate(t) for c,ch in enumerate(row) if ch=='S'][0]
        G=[(r,c) for r,row in enumerate(t) for c,ch in enumerate(row) if ch=='G'][0]
        print(n,k,'S',S,'G',G,'h',len(t))
