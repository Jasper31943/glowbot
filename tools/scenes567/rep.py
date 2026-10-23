import re,sys,json
# usage: python3 rep.py ID row1 row2 ...
p='spec.js';s=open(p).read();id=sys.argv[1];rows=sys.argv[2:]
m=re.search(r"(Z\('%s',[^\n]*\n)((?:\s*'[^']*',?\)?,?\n)+)"%re.escape(id),s)
body=''.join("  '%s'%s\n"%(r.replace('\\','\\\\'),',' if i<len(rows)-1 else '),') for i,r in enumerate(rows))
s=s[:m.start(2)]+body+s[m.end(2):];open(p,'w').write(s)
