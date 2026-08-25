import io, json, os, re, html

SP = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(SP), 'review-2026-08-25.html')

live = json.load(io.open(os.path.join(SP, 'live-open.json'), encoding='utf-8'))
issues = {i['number']: i for i in live}

NAMES = {'jonjj7': 'Jon Jungman', 'Justin-Smith': 'Justin Smith', 'captwildguns': 'Gabe Guzman',
         'kristenmichalski': 'Kristen Michalski', 'BKCrypto1': 'Bryan Krufchinski'}


def people(num):
    it = issues.get(num)
    if not it:
        return 'closed or not found'
    who = [NAMES.get(a['login'], a['login']) for a in it['assignees']]
    return ', '.join(who) if who else 'Unassigned'


def author(num):
    it = issues.get(num)
    return NAMES.get(it['author']['login'], it['author']['login']) if it else ''


def md2html(md):
    t = (md or '').replace('\r', '')
    t = re.sub(r'<img[^>]*>', '', t)
    t = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', t)
    out, mode = [], None

    def close():
        nonlocal mode
        if mode:
            out.append('</%s>' % mode); mode = None

    def inline(s):
        s = html.escape(s)
        s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
        s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
        s = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<a href="\2" target="_blank">\1</a>', s)
        return s

    for raw in t.split('\n'):
        l = raw.rstrip()
        if not l.strip():
            close(); continue
        m = re.match(r'^#{1,6}\s+(.*)$', l)
        if m:
            close(); out.append('<h4>%s</h4>' % inline(m.group(1))); continue
        m = re.match(r'^\s*[-*]\s+(.*)$', l)
        if m:
            if mode != 'ul':
                close(); out.append('<ul>'); mode = 'ul'
            out.append('<li>%s</li>' % inline(m.group(1))); continue
        m = re.match(r'^\s*\d+[.)]\s+(.*)$', l)
        if m:
            if mode != 'ol':
                close(); out.append('<ol>'); mode = 'ol'
            out.append('<li>%s</li>' % inline(m.group(1))); continue
        close(); out.append('<p>%s</p>' % inline(l.strip()))
    close()
    return '\n'.join(out)


def first_line(num, n=300):
    it = issues.get(num)
    if not it:
        return ''
    for l in (it['body'] or '').replace('\r', '').split('\n'):
        s = l.strip(' -*#>')
        if s and not s.startswith('<img') and not s.startswith('!['):
            return s[:n]
    return 'No description on the ticket.'


# Already posted and closed, so the page stops calling them proposals.
DONE = {108: [198], 75: [201, 194], 97: [205], 77: [199],
        116: [203], 120: [203], 121: [203], 93: [203], 139: [204]}

# Proposals, not decisions. Each is ours -> the existing ticket that owns the topic.
PROPOSED = {
 194: 75, 195: 90, 198: 108, 199: 77, 201: 75,
 203: [116, 120, 121, 93], 204: 139, 206: [89, 95], 208: None,
}

# What each existing ticket would gain. Written as requirements.
ADDS = {
 70: "Charts. Four: Incidents by Subject, by Type, by Driver, by Day. Incidents by Vehicle comes out, per bus counts live on the Vehicles page where each row carries its own count and links through.\n"
     "KPIs. Four on one row: Critical Incidents, Open Incidents, Students w/ Incidents, Incidents This Week.\n"
     "Active incidents table. Same columns as the incidents grid, including Involved and Subject.\n"
     "Counts and charts follow the user's org scope.",
 75: "Subject first, then one form for all five subjects, two steps every time.\n"
     "Seventeen fields on Incident Details, twelve identical for every subject and five driven by a field map. A field the subject does not use is not rendered.\n"
     "Changing subject mid report clears type, people and asset, keeps date, time, description, location and evidence, and warns first.\n"
     "A witness or third party is kept when they have either a name or a description.\n"
     "The affected asset is stored as a reference to the vehicle or location record, not typed text.\n"
     "Selecting a run or a vehicle fills the driver.",
 77: """The incident carries the term it belongs to, taken from the default term rather than picked by the reporter.
A student has a separate record each term. The incident attaches to the record for the default term, and the records are tied to one person so history is not limited.
The incidents grid shows the default term, the same as every other grid in the product.
Opening a student shows every incident they have, whatever term it happened in, grouped under a year heading, most recent first.
An incident opened directly always opens, even when it belongs to an earlier term.
A wrong term is corrected by editing the incident after the fact.""",
 89: "Notifications are raised in the Student Transportation notification center. Nothing goes out by email or SMS from the module.\n"
     "Five triggers per step, all off by default: step starts, step completes, assignee notified, approvers notified, named groups notified.\n"
     "Recipients are whoever holds the permission the step is assigned to, plus approver permissions selected on the step, plus named recipients. A permission nobody holds raises nothing and errors nothing.\n"
     "A notification carries the incident identifier, type, severity and step name.",
 90: "An approval records who approved and when, separately from an ordinary step completion.\n"
     "An approver can reject. Rejecting returns the step to in progress, keeps the work already recorded, and notifies the assignee.",
 93: "The exported record set uses the same Involved column as the incidents list, so a location or vehicle row names the depot or the bus rather than leaving the student column empty.",
 95: "Three templates, fixed text, no variable substitution: Action required, Approval needed, Parent contact required.\n"
     "Parent contact required only exists where a student is involved and never raises on an employee, vehicle, location or third party incident.",
 108: "Incidents uses the organization selector Student Transportation already has rather than a new control.\n"
      "It is a checkbox tree, checking a district checks the schools under it, organizations outside the user's claims are disabled rather than hidden, and the selection saves behind a confirm.\n"
      "It appears only when the site is multi district and the user has more than one organization. Otherwise there is no selector and no org filtering.\n"
      "The active scope is readable without opening anything.\n"
      "School level scoping had its own ticket in 190, which is closed, so it belongs here.",
 116: "Involved replaces the Student column, naming whoever or whatever the incident is about.\n"
      "Subject is a sortable, filterable column. Status is a column.\n"
      "Every column header carries a filter that applies as it is typed or chosen.\n"
      "Incidents are listed newest first with a break between years.",
 120: "The record shows every field the form collected and nothing the subject does not use.\n"
      "Subject, Type, Occurred date and time, Term, Location, Severity, Status, Assigned To and Description, plus Vehicle, Driver and Run where the subject uses them.\n"
      "Involved Parties for student, employee and third party incidents. Affected Vehicle or Affected Location for the two without people.\n"
      "Photos and Documents carry counts.",
 121: "The other party on a conversation is derived from the incident rather than assumed to be a student's driver.\n"
      "A Subject filter on the conversation list.",
 139: """The Help content moves to DocuSource. The module keeps no copy of the guide, so a wording fix is a documentation change.
Help in the app opens the DocuSource content for incidents.
The documentation covers the five subjects and choosing the subject first, the two step form, the 20 types, the 12 workflows and the required owner, the five roles, the difference between the incident date and the reported date, how the term is set, the twelve location types, and the grid filters.
One incident record is created and each person named on it carries their own workflow.""",
}

targets = sorted(ADDS.keys())
ours = sorted(n for n in issues if n >= 191 and issues[n]['author']['login'] == 'captwildguns')

items = []

closing = [n for n in ours if n in PROPOSED]
keeping = [n for n in ours if n not in PROPOSED]

items.append({
 'g': 'Start here', 'n': 'Overview', 't': 'What this review covers', 'st': 'Read first',
 'kind': '', 'owner': '', 'closes': '', 'adds': '',
 'sum': 'Everything here is live from GitHub. The closures are proposals, nothing has been closed yet.',
 'body': md2html(
   "Counts, as they stand right now.\n\n"
   "- %d of our tickets are open.\n"
   "- %d of those are proposed to close, with their content moving onto the ticket that already owns the topic.\n"
   "- %d of ours would stay open, because nothing open covers them.\n"
   "- %d existing tickets would receive detail. One of those, 70, gains detail with nothing of ours closing into it.\n\n"
   "205 already closed into 97 the same way, which is the pattern the rest would follow."
   % (len(ours), len(closing), len(keeping), len(targets))),
 'ac': '', 'a': ''})

for n in keeping:
    items.append({
      'g': 'Ours, would stay open', 'n': '#%d' % n, 't': issues[n]['title'],
      'st': 'Open', 'kind': 'Ours', 'owner': people(n), 'closes': '', 'adds': '',
      'sum': first_line(n), 'body': md2html(issues[n]['body']), 'ac': '', 'a': ''})

for n in closing:
    tgt = PROPOSED[n]
    if tgt is None:
        note = 'Proposed: close this. The flag goes on each ticket it gates rather than one ticket listing them all.'
    elif isinstance(tgt, list):
        note = 'Proposed: close this, content splits onto ' + ', '.join(str(x) for x in tgt) + '.'
    else:
        note = 'Proposed: close this, content moves onto ' + str(tgt) + '.'
    items.append({
      'g': 'Ours, proposed to close', 'n': '#%d' % n, 't': issues[n]['title'],
      'st': 'Open', 'kind': 'Proposal', 'owner': people(n), 'closes': note, 'adds': '',
      'sum': first_line(n), 'body': md2html(issues[n]['body']), 'ac': '', 'a': ''})

for n in targets:
    done = DONE.get(n, [])
    incoming = [str(k) for k, v in PROPOSED.items()
                if (v == n or (isinstance(v, list) and n in v)) and k not in done]
    if done:
        note = 'Posted. ' + ', '.join(str(d) for d in done) + ' closed into this.'
        if incoming:
            note += ' Still proposed: ' + ', '.join(incoming) + '.'
    else:
        note = ('Proposed: receives ' + ', '.join(incoming) + '.') if incoming else 'Proposed: gains detail, nothing of ours closes into it.'
    items.append({
      'g': 'Existing, would receive detail', 'n': '#%d' % n, 't': issues[n]['title'],
      'st': 'Open', 'kind': 'Existing', 'owner': people(n) + ', opened by ' + author(n),
      'closes': note, 'adds': md2html(ADDS[n]),
      'sum': first_line(n), 'body': '', 'ac': '', 'a': ''})

GROUPS = ['Start here', 'Ours, would stay open', 'Ours, proposed to close', 'Existing, would receive detail']

tpl = io.open(os.path.join(SP, 'review-shell.html'), encoding='utf-8').read()
tpl = tpl.replace('/*DATA*/', 'const items = ' + json.dumps(items, ensure_ascii=False) +
                  ';\nconst groups = ' + json.dumps(GROUPS, ensure_ascii=False) + ';')
io.open(OUT, 'w', encoding='utf-8', newline='').write(tpl)
print('panels %d | ours open %d | proposed to close %d | staying %d | targets %d'
      % (len(items), len(ours), len(closing), len(keeping), len(targets)))
