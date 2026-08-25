"""Refresh the visible titles in ticket links after a ticket gets renamed.

Links are written as [Some Ticket Title #123](.../issues/123). Renaming a ticket
never breaks the link, but the title typed inside it goes stale. This rewrites
those titles from the live ones.

Only touches bodies and comments written by the account running it, never anyone
else's. Dry run by default.

    python scripts/refresh-ticket-links.py           # show what would change
    python scripts/refresh-ticket-links.py --apply   # make the changes
"""
import json, re, subprocess, sys

REPO = 'tyler-technologies/transportation-incidents'
LINK = re.compile(r'\[([^\]\[]{3,200}) #(\d+)\]\((https://github\.com/[^)]*?/issues/(\d+))\)')
APPLY = '--apply' in sys.argv


def gh(*args):
    out = subprocess.run(['gh', *args], capture_output=True, text=True)
    if out.returncode:
        raise SystemExit('gh failed: %s' % out.stderr.strip())
    return out.stdout


def api(path, *extra):
    return json.loads(gh('api', path, '--paginate', *extra))


me = json.loads(gh('api', 'user', '--jq', '{login:.login}'))['login']
issues = {}
for state in ('open', 'closed'):
    for i in json.loads(gh('issue', 'list', '--repo', REPO, '--state', state,
                           '--limit', '400', '--json', 'number,title')):
        issues[i['number']] = i['title']
print('%d tickets, acting as %s' % (len(issues), me))


def fix(text):
    changed = []

    def sub(m):
        shown, num_text, url, num_url = m.group(1), m.group(2), m.group(3), m.group(4)
        if num_text != num_url:
            return m.group(0)
        live = issues.get(int(num_url))
        if not live or live == shown:
            return m.group(0)
        changed.append((num_url, shown, live))
        return '[%s #%s](%s)' % (live, num_text, url)

    return LINK.sub(sub, text), changed


targets = []
for n in sorted(issues):
    d = json.loads(gh('issue', 'view', str(n), '--repo', REPO,
                      '--json', 'body,author,number'))
    if d['author']['login'] == me and d.get('body'):
        new, ch = fix(d['body'])
        if ch:
            targets.append(('body', n, new, ch))
    for c in api('repos/%s/issues/%d/comments' % (REPO, n)):
        if c['user']['login'] != me or not c.get('body'):
            continue
        new, ch = fix(c['body'])
        if ch:
            targets.append(('comment:%d' % c['id'], n, new, ch))

for kind, n, new, ch in targets:
    for num, shown, live in ch:
        print('%s on #%d: #%s "%s" -> "%s"' % (kind.split(':')[0], n, num, shown[:50], live[:50]))

if not targets:
    print('nothing stale')
elif not APPLY:
    print('\n%d place(s) would change. Re-run with --apply.' % len(targets))
else:
    for kind, n, new, _ in targets:
        if kind == 'body':
            p = subprocess.run(['gh', 'issue', 'edit', str(n), '--repo', REPO,
                                '--body-file', '-'], input=new, text=True,
                               capture_output=True)
        else:
            cid = kind.split(':')[1]
            p = subprocess.run(['gh', 'api', '--method', 'PATCH',
                                'repos/%s/issues/comments/%s' % (REPO, cid),
                                '-F', 'body=@-'], input=new, text=True,
                               capture_output=True)
        print(('updated ' if not p.returncode else 'FAILED ') + kind + ' on #%d' % n)
