import re, sys
def split_args(s, i):
    # s[i] is the char after 'smoothstep(' ; returns (args, endIndexAfterParen)
    depth = 0; args = []; cur = ''
    while True:
        ch = s[i]
        if ch == '(': depth += 1
        elif ch == ')':
            if depth == 0: args.append(cur); return args, i + 1
            depth -= 1
        elif ch == ',' and depth == 0: args.append(cur); cur = ''; i += 1; continue
        cur += ch; i += 1
def num(x):
    try: return float(x)
    except ValueError: return None
total = 0
for f in sys.argv[1:]:
    s = open(f, encoding='utf8').read(); out = ''; pos = 0; n = 0
    for m in re.finditer(r'smoothstep\(', s):
        if m.start() < pos: continue
        args, end = split_args(s, m.end())
        assert len(args) == 3, (f, args)
        a, b, x = [t.strip() for t in args]
        na, nb = num(a), num(b)
        rev = (na is not None and nb is not None and na >= nb) or (a == 'lim' and b == 'lim * 0.72')
        if rev:
            assert na is None or na > nb
            out += s[pos:m.start()] + f'(1.0 - smoothstep({b}, {a}, {x}))'; pos = end; n += 1
    out += s[pos:]; open(f, 'w', encoding='utf8').write(out); print(f, 'rewrote', n); total += n
print('total', total)
