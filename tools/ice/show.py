import json,sys
lv=json.load(open('lv.json'))
def T(g,k):
    for _ in range(k%4): g=[''.join(g[len(g)-1-r][c] for r in range(len(g))) for c in range(len(g[0]))]
    if k>=4: g=[row[::-1] for row in g]
    return g
for a in sys.argv[1:]:
    n,k=a.split(':');print(a);print('\n'.join(T(lv[n],int(k))))
