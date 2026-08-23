import { useState } from 'react';
import {
  Search, Camera, MapPin, Check, ChevronLeft, ChevronRight,
  AlertTriangle, MessageSquare, FileText, Map, ClipboardCheck, Timer, LogOut, Flashlight,
  Home, Mail, ArrowLeft, ArrowUp,
} from 'lucide-react';
import tylerLogo from '../../assets/tyler-logo.png';
import { getIncidentTypesForCategory, type IncidentSubject } from '../incidents/IncidentTypes';

/* ============================================================
   Tyler Drive, working driver tablet mockup
   Visual language taken from tyler-drive-maui + TYD screencaps:
   • Home: white bar + Tyler logo + welcome, grey tile grid.
   • In-app: navy toolbar (logo chip → desktop, home, mail, clock).
   • Lists: light-grey cards with green action buttons (My Runs / bus search).
   • Data entry: TYD's own on-screen keyboard (grey #AFB0B4 panel,
     #5F5F5F key text), shown inline, never the OS keyboard.
   ============================================================ */

interface TabletViewProps {
  onExit: () => void; // tapping the Tyler logo returns to the desktop view
}

const C = {
  black: '#000000',
  navy: '#27348C',
  navyBtn: '#33429A',
  blueGrad: 'linear-gradient(to top,#29448F,#364E96 55%,#586CA7)',
  greenGrad: 'linear-gradient(to top,#117922,#1E8431 55%,#469F5A)',
  orangeGrad: 'linear-gradient(to top,#E0801A,#F2A33E)',
  grey: '#C2C2C2',
  stroke: '#959595',
  cyanSel: '#B3FFFF',
  flatGreen: '#3FB152',
  red: '#D83333',
  redDark: '#840A00',
  kbdPanel: '#AFB0B4',
  kbdKey: '#ECECEC',
  kbdKeyText: '#5F5F5F',
  kbdSpecial: '#949BA3',
  card: '#D9D9D9',
};

const ROSTER = [
  { id: 'STU-3421', name: 'Marcus Johnson', grade: '10th', seat: 14, color: '#b91c1c', initials: 'MJ' },
  { id: 'STU-1045', name: 'Ethan Lee', grade: '9th', seat: 15, color: '#1d4ed8', initials: 'EL' },
  { id: 'STU-5623', name: 'Olivia Davis', grade: '11th', seat: 9, color: '#7c3aed', initials: 'OD' },
  { id: 'STU-4782', name: 'James Thompson', grade: '9th', seat: 22, color: '#0f766e', initials: 'JT' },
  { id: 'STU-6891', name: 'Noah Wilson', grade: '7th', seat: 6, color: '#b45309', initials: 'NW' },
];

const TYPES = [
  { label: 'Physical Altercation', desc: 'shoving, hitting, fighting', def: 'high' },
  { label: 'Disruptive Behavior', desc: 'language, noise, defiance, bullying', def: 'medium' },
  { label: 'Safety Violation', desc: 'seatbelt, standing, window, exit', def: 'medium' },
  { label: 'Property Damage', desc: 'vandalism, bus or personal property', def: 'medium' },
  { label: 'Weapon / Prohibited Items', desc: 'contact dispatch immediately', def: 'critical' },
  { label: 'Witness / Bystander Statement', desc: 'record a helper or witness, no fault assigned', def: 'low' },
];

const ROLES = ['instigator', 'participant', 'victim', 'bystander'] as const;
const SEVS = ['low', 'medium', 'high', 'critical'] as const;
const sevColor: Record<string, string> = { low: '#3a5a3f', medium: '#7a5a1e', high: '#CC504F', critical: C.redDark };

const SEED_INCIDENTS = [
  { id: 'INC-2025-0059', date: '2025-03-01', title: 'Brianna Cooper +2 · Physical Altercation', sub: 'Bus 8 · Mar 1 · with safety coordinator', status: 'review', students: [] as any[], driverDesc: '', type: 'Physical Altercation' },
  { id: 'INC-2025-0051', date: '2025-03-09', title: 'Natalie Collins · Disruptive Behavior', sub: 'Bus 8 · Mar 9 · awaiting your note', status: 'action', students: [], driverDesc: '', type: 'Disruptive Behavior' },
  { id: 'INC-2025-0042', date: '2025-02-18', title: 'Dylan Bell · Safety Violation', sub: 'Bus 8 · Feb 18 · resolved & closed', status: 'closed', students: [], driverDesc: '', type: 'Safety Violation' },
];

type PerStudent = { role: string; severity: string; statement: string };

// "Where it stands", status flow shown on the incident detail, keyed to status.
const STATUS_FLOW: Record<string, { t: string; sub: string; state: string }[]> = {
  open: [
    { t: 'Reported by driver', sub: 'you · 3:56 PM', state: 'done' },
    { t: 'With safety coordinator', sub: 'S. Williams · reviewing now', state: 'now' },
    { t: 'Parents notified', sub: 'pending', state: '' },
    { t: 'Resolved & closed', sub: 'pending', state: '' },
  ],
  action: [
    { t: 'Reported by driver', sub: 'you · 3:56 PM', state: 'done' },
    { t: 'With safety coordinator', sub: 'awaiting your follow-up note', state: 'now' },
    { t: 'Parents notified', sub: 'pending', state: '' },
    { t: 'Resolved & closed', sub: 'pending', state: '' },
  ],
  review: [
    { t: 'Reported by driver', sub: 'you', state: 'done' },
    { t: 'Safety coordinator review', sub: 'S. Williams', state: 'done' },
    { t: 'Parents notified', sub: 'in progress', state: 'now' },
    { t: 'Resolved & closed', sub: 'pending', state: '' },
  ],
  closed: [
    { t: 'Reported by driver', sub: 'you', state: 'done' },
    { t: 'Safety coordinator review', sub: 'S. Williams', state: 'done' },
    { t: 'Parents notified', sub: 'both parents contacted', state: 'done' },
    { t: 'Resolved & closed', sub: 'no further action needed', state: 'done' },
  ],
};

const COORD = 'S. Williams · Safety Coordinator';
const DEFAULT_THREADS: Record<string, any[]> = {
  'INC-2025-0064': [
    { me: true, text: 'Reported the back-row altercation, Marcus & Ethan. Photo attached. Both held at school for pickup.', t: '3:56 PM' },
    { me: false, who: COORD, text: 'Got it, thanks Gabe. Did either student report an injury?', t: '3:58 PM' },
    { me: true, text: 'No injuries. Ethan said his shoulder was fine, declined the nurse.', t: '3:59 PM' },
    { me: false, who: COORD, text: "Perfect. I'm contacting both parents now. I'll take it from here.", t: '4:01 PM' },
  ],
  'INC-2025-0059': [
    { me: true, text: 'Filed the back-row altercation involving Brianna and two other students from the Mar 1 run.', t: 'Mar 1 · 4:10 PM' },
    { me: false, who: COORD, text: "Thanks Gabe. I've reviewed it and I'm notifying all three families now. Disciplinary review is in progress.", t: 'Mar 1 · 4:40 PM' },
    { me: true, text: 'Understood, let me know if you need anything else from me.', t: 'Mar 1 · 4:42 PM' },
    { me: false, who: COORD, text: "Will do. This one is still in review on my end, I'll update you when it's resolved.", t: 'Mar 2 · 8:15 AM' },
  ],
  'INC-2025-0051': [
    { me: false, who: COORD, text: "Gabe, I'm working the Natalie Collins incident from the 9th. Before I can contact her parent, can you add a quick note on exactly what she said when you spoke with her?", t: 'Mar 9 · 3:30 PM' },
    { me: false, who: COORD, text: "Following up, I still need your follow-up note on this one when you get a chance. It's holding up the parent call.", t: 'Mar 10 · 9:05 AM' },
  ],
  'INC-2025-0042': [
    { me: true, text: 'Reported Dylan standing up while the bus was moving on the Feb 18 run.', t: 'Feb 18 · 3:20 PM' },
    { me: false, who: COORD, text: 'Thanks. I spoke with Dylan and the parent and reinforced the stay-seated rule. Closing this out, no further action needed.', t: 'Feb 18 · 5:00 PM' },
    { me: true, text: '👍 understood', t: 'Feb 18 · 5:02 PM' },
  ],
};

const statusMap: Record<string, { lbl: string; bg: string; fg: string }> = {
  open: { lbl: 'OPEN', bg: '#7a5a1e', fg: '#ffe6b0' },
  review: { lbl: 'IN REVIEW', bg: '#1d3a6b', fg: '#cfe0ff' },
  action: { lbl: 'ACTION NEEDED', bg: C.redDark, fg: '#ffd2cd' },
  closed: { lbl: 'CLOSED', bg: '#2f4030', fg: '#bfe3c4' },
};

// ── TYD on-screen keyboard ─────────────────────────────────────────────
const ABC = [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['z', 'x', 'c', 'v', 'b', 'n', 'm']];
const NUM = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], ['-', '/', ':', ';', '(', ')', '$', '&', '@'], ['.', ',', '?', '!', "'"]];

function TydKeyboard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [shift, setShift] = useState(false);
  const [num, setNum] = useState(false);
  const rows = num ? NUM : ABC;
  const tap = (k: string) => {
    const ch = !num && shift ? k.toUpperCase() : k;
    onChange(value + ch);
    if (shift) setShift(false);
  };
  const key = (label: string, onClick: () => void, opts: { flex?: number; special?: boolean; green?: boolean } = {}) => (
    <button key={label} onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        flex: opts.flex ?? 1, minWidth: 0, height: 52, margin: 3, borderRadius: 5, border: 'none', cursor: 'pointer',
        background: opts.green ? C.flatGreen : opts.special ? C.kbdSpecial : C.kbdKey,
        color: opts.green ? '#fff' : opts.special ? '#fff' : C.kbdKeyText,
        fontSize: 22, fontWeight: 500, fontFamily: 'inherit',
      }}>{label}</button>
  );
  return (
    <div style={{ background: C.kbdPanel, padding: '6px 10px 10px', flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>{rows[0].map(k => key(!num && shift ? k.toUpperCase() : k, () => tap(k)))}</div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px' }}>{rows[1].map(k => key(!num && shift ? k.toUpperCase() : k, () => tap(k)))}</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {!num && key('⇧', () => setShift(s => !s), { flex: 1.5, special: true })}
        {rows[2].map(k => key(!num && shift ? k.toUpperCase() : k, () => tap(k)))}
        {key('⌫', () => onChange(value.slice(0, -1)), { flex: 1.5, special: true })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {key(num ? 'ABC' : '?123', () => { setNum(n => !n); setShift(false); }, { flex: 1.6, special: true })}
        {key('space', () => onChange(value + ' '), { flex: 5, special: true })}
        {key('return', () => onChange(value + '\n'), { flex: 1.8, green: true })}
      </div>
    </div>
  );
}

// Subjects a driver can file from the tablet. Vehicle and location are the
// valuable additions here: a driver in the yard mostly reports those, and both
// skip the roster and per-student steps entirely.
const TABLET_SUBJECTS: Array<{ value: string; label: string; hint: string }> = [
  { value: 'student', label: 'student', hint: 'one or more students on your run' },
  { value: 'vehicle', label: 'vehicle', hint: 'bus damage or a mechanical problem, nobody aboard' },
  { value: 'location', label: 'location', hint: 'a garage, yard, or depot problem' },
  { value: 'thirdParty', label: 'third party', hint: 'another motorist, a parent, or the public' },
];

export function TabletView({ onExit }: TabletViewProps) {
  const [screen, setScreen] = useState<'home' | 'report' | 'list' | 'detail' | 'messages'>('home');
  // Step 0 is the subject chooser. The student path then runs 1 through 6
  // exactly as before; non-student paths skip the roster and per-student steps.
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState('student');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('');
  const [per, setPer] = useState<Record<string, PerStudent>>({});
  const [stmtIdx, setStmtIdx] = useState(0);
  const [driverDesc, setDriverDesc] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [incidents, setIncidents] = useState<any[]>(SEED_INCIDENTS);
  const [active, setActive] = useState<any>(SEED_INCIDENTS[0]);
  const [submittedId, setSubmittedId] = useState('');
  const [filter, setFilter] = useState('all');
  const [threads, setThreads] = useState<Record<string, any[]>>(DEFAULT_THREADS);
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);

  const selStudents = ROSTER.filter(s => selected.includes(s.id));
  const activeThread = (active && threads[active.id]) || [];

  const resetReport = () => {
    setStep(0); setSubject('student'); setSelected([]); setSearch(''); setType(''); setSeverity('');
    setPer({}); setStmtIdx(0); setDriverDesc(''); setHasPhoto(false); setPinned(false); setSubmittedId('');
  };

  // Non-student subjects have no roster and no per-student statements, so they
  // jump straight from the chooser to the type step and from type to description.
  const isStudentReport = subject === 'student';
  const chooseSubject = (s: string) => {
    setSubject(s);
    setSelected([]); setPer({}); setType(''); setSeverity('');
    setStep(s === 'student' ? 1 : 2);
  };
  // Types offered for the chosen subject. Student keeps the original hand-written
  // TABLET list (its wording is tuned for a driver at the wheel); non-student
  // subjects derive from the shared catalog so the tablet and the desktop form
  // can never drift apart.
  const activeTypes = isStudentReport
    ? TYPES
    : getIncidentTypesForCategory(subject as IncidentSubject).map(t => ({
        label: t.label,
        desc: t.description.length > 60 ? `${t.description.slice(0, 57)}...` : t.description,
        def: t.defaultSeverity.toLowerCase(),
      }));

  const stepTotal = isStudentReport ? 6 : 3;
  // Display number for the current step, so a location report reads 1..3
  const stepLabel = (n: number) => {
    if (isStudentReport) return `step ${n} of 6`;
    const order: Record<number, number> = { 2: 1, 5: 2, 6: 3 };
    return `step ${order[n] ?? n} of ${stepTotal}`;
  };
  const startReport = () => { resetReport(); setScreen('report'); };
  const toggleStudent = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const goStep2to3 = () => {
    const next: Record<string, PerStudent> = { ...per };
    selected.forEach(id => { if (!next[id]) next[id] = { role: 'participant', severity: 'shared', statement: '' }; });
    Object.keys(next).forEach(id => { if (!selected.includes(id)) delete next[id]; });
    setPer(next);
  };
  const setRole = (id: string, role: string) => setPer(p => ({ ...p, [id]: { ...p[id], role } }));
  const setStmt = (id: string, v: string) => setPer(p => ({ ...p, [id]: { ...p[id], statement: v } }));

  const submit = () => {
    const maxNum = incidents.reduce((m, i) => Math.max(m, parseInt(String(i.id).split('-')[2] || '0', 10) || 0), 63);
    const id = `INC-2025-${String(maxNum + 1).padStart(4, '0')}`;
    const first = selStudents[0];
    // Non-student reports have no roster, so the title comes from the subject
    // and the type rather than from a student's name.
    const title = isStudentReport
      ? `${first?.name}${selStudents.length > 1 ? ` +${selStudents.length - 1}` : ''} · ${type}`
      : `${subject === 'thirdParty' ? 'Third party' : subject.charAt(0).toUpperCase() + subject.slice(1)} · ${type}`;
    const rec = {
      id, date: '2025-03-15', subject, title,
      sub: `Bus 8 · today · you reported this`, status: 'open', type, severity, driverDesc, hasPhoto, pinned,
      students: isStudentReport
        ? selStudents.map(s => ({ ...s, ...per[s.id], severity: per[s.id]?.severity === 'shared' ? severity : per[s.id]?.severity }))
        : [],
    };
    setIncidents(prev => [rec, ...prev]);
    setSubmittedId(id); setActive(rec); setStep(7);
  };

  const sendMsg = (text: string) => {
    if (!text.trim() || !active) return;
    setThreads(prev => ({ ...prev, [active.id]: [...(prev[active.id] || []), { me: true, text, t: 'now' }] }));
    setDraft(''); setComposing(false);
  };

  // ── chrome ──────────────────────────────────────────────
  // White home bar (matches the real TYD home screen)
  const HomeBar = () => (
    <div style={st.homeBar}>
      <button onClick={onExit} title="Back to desktop view" style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer' }}>
        <img src={tylerLogo} alt="Tyler Technologies" style={{ height: 44, display: 'block' }} />
      </button>
      <div style={st.welcome}>Welcome to Tyler Drive, <b>Gabe Guzman</b></div>
    </div>
  );
  // Navy in-app toolbar, matches the real TYD nav bar (back, up, mail, timekeeping, clock, more)
  const NavBar = ({ onBack }: { onBack?: () => void }) => (
    <div style={st.navbar}>
      <button onClick={onBack || onExit} title="Back" style={st.nbCell}><ArrowLeft size={32} strokeWidth={2.5} /></button>
      <button onClick={() => setScreen('home')} title="Home" style={st.nbCell}><ArrowUp size={32} strokeWidth={2.5} /></button>
      <button onClick={() => { if (!active) setActive(incidents[0]); setComposing(false); setScreen('messages'); }} title="Messages" style={st.nbCell}><Mail size={30} /></button>
      <button style={st.nbCellText}>timekeeping</button>
      <div style={st.nbClock}>3:54 PM</div>
      <button style={st.nbCellText}>more…</button>
    </div>
  );
  const Footer = ({ children }: { children: React.ReactNode }) => <div style={st.footbar}>{children}</div>;
  const Btn = ({ kind, children, onClick, disabled, wide }: any) => {
    const bg = kind === 'green' ? C.greenGrad : kind === 'orange' ? C.orangeGrad : kind === 'grey' ? C.grey : C.blueGrad;
    return (
      <button onClick={disabled ? undefined : onClick} disabled={disabled}
        style={{ ...st.btn, background: bg, color: kind === 'grey' ? '#2a2a2a' : '#fff', minWidth: wide ? 260 : 120, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'default' : 'pointer' }}>
        {children}
      </button>
    );
  };
  const NoteField = ({ value, placeholder, height = 150 }: { value: string; placeholder: string; height?: number }) => (
    <div style={{ ...st.noteField, height }}>
      {value ? <span style={{ whiteSpace: 'pre-wrap' }}>{value}</span> : <span style={{ color: '#6b6b6b' }}>{placeholder}</span>}
      <span style={st.caret}>▏</span>
    </div>
  );

  // ============================================================
  //  HOME
  // ============================================================
  const TILE_GRAD: Record<string, string> = {
    green: 'linear-gradient(to bottom,#4FA85C,#1E7B34)',
    purple: 'linear-gradient(to bottom,#6E5AAE,#463B86)',
    orange: 'linear-gradient(to bottom,#EFA24E,#D77E2A)',
    red: 'linear-gradient(to bottom,#C24A3E,#8E2820)',
  };
  const HomeTile = ({ color, icon, label, badge, onClick }: any) => (
    <button onClick={onClick} style={{ ...st.homeTile, backgroundImage: TILE_GRAD[color], cursor: onClick ? 'pointer' : 'default' }}>
      {badge ? <span style={st.badge}>{badge}</span> : null}
      <span style={st.homeTileLabel}>{label}</span>
      <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{icon}</span>
    </button>
  );
  const renderHome = () => (
    <>
      <HomeBar />
      <div style={st.homeBg}>
        <div style={st.tileRow}>
          <HomeTile color="green" icon={<Map size={64} strokeWidth={1.5} />} label="My Runs" />
          <HomeTile color="purple" icon={<ClipboardCheck size={64} strokeWidth={1.5} />} label="Inspections" />
          <HomeTile color="orange" icon={<Timer size={64} strokeWidth={1.5} />} label="Timekeeping" />
          <HomeTile color="red" icon={<AlertTriangle size={64} strokeWidth={1.5} />} label="Incidents" badge={1} onClick={() => setScreen('list')} />
        </div>
        <div style={st.homeBottom}>
          <button onClick={onExit} style={st.logoutBtn}><LogOut size={30} /> logout</button>
          <button style={st.flashBtn}><Flashlight size={30} /></button>
        </div>
      </div>
    </>
  );

  // ============================================================
  //  REPORT WIZARD
  // ============================================================
  const renderReport = () => {
    if (step === 7) return renderConfirm();
    return (
      <>
        <NavBar onBack={() => setScreen('home')} />
        <div style={st.screen}>
          {step === 0 && renderSubject()}
          {step === 1 && renderSelect()}
          {step === 2 && renderType()}
          {step === 3 && renderRoles()}
          {step === 4 && renderStatements()}
          {step === 5 && renderDescription()}
          {step === 6 && renderReview()}
        </div>
      </>
    );
  };

  // Step 0, what kind of incident is this?
  const renderSubject = () => (
    <>
      <div style={st.pad}>
        <div style={st.titleRow}><span style={st.title}>Report incident, what happened?</span></div>
        <div style={st.sub}>Pick what this report is about. That decides what we ask you for.</div>
        <div style={st.list}>
          {TABLET_SUBJECTS.map(s => {
            const on = subject === s.value;
            return (
              <button
                key={s.value}
                onClick={() => chooseSubject(s.value)}
                style={{ ...st.row, background: on ? C.cyanSel : '#fff', borderColor: on ? '#3a9aa8' : '#cfcfcf' }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ fontSize: 26, fontWeight: 600, textTransform: 'capitalize' }}>{s.label}</span>
                  <span style={{ display: 'block', fontSize: 18, color: '#5b6673', marginTop: 2 }}>{s.hint}</span>
                </span>
                <ChevronRight size={26} color="#7c8aa0" />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  const renderSelect = () => {
    const list = ROSTER.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()));
    return (
      <>
        <div style={st.pad}>
          <div style={st.titleRow}><span style={st.title}>Report incident, involved students</span><span style={st.opt}>step 1 of 6</span></div>
          <div style={st.sub}>Select everyone involved. They are all associated with this one incident.</div>
          <div style={st.search}><Search size={22} color="#7c8aa0" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="search this run by name or ID…" style={st.searchInput} /></div>
          <div style={st.list}>
            {list.map(s => {
              const on = selected.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggleStudent(s.id)} style={{ ...st.row, background: on ? C.cyanSel : '#fff', borderColor: on ? '#3a9aa8' : '#cfcfcf' }}>
                  <span style={{ ...st.chk, background: on ? '#1E8431' : 'transparent', borderColor: on ? '#1E8431' : '#8a8a8a' }}>{on ? <Check size={20} strokeWidth={3} color="#fff" /> : null}</span>
                  <span style={{ ...st.av, background: s.color }}>{s.initials}</span>
                  <span style={st.rowName}>{s.name}</span>
                  <span style={st.rowMeta}>{s.id} · {s.grade} · Seat {s.seat}</span>
                </button>
              );
            })}
          </div>
        </div>
        <Footer>
          <Btn kind="orange" onClick={() => setStep(0)}>back</Btn>
          <Btn kind="orange" onClick={() => setSelected([])}>clear</Btn>
          <Btn kind="green" disabled={selected.length === 0} onClick={() => { goStep2to3(); setStep(2); }}>continue{selected.length ? ` · ${selected.length} selected` : ''}</Btn>
        </Footer>
      </>
    );
  };

  const renderType = () => (
    <>
      <div style={st.pad}>
        <div style={st.titleRow}><span style={st.title}>Incident type</span><span style={st.opt}>{stepLabel(2)}</span></div>
        <div style={st.list}>
          {activeTypes.map(t => {
            const on = type === t.label;
            return (
              <button key={t.label} onClick={() => { setType(t.label); setSeverity(t.def); }} style={{ ...st.row, background: on ? C.cyanSel : '#fff', borderColor: on ? '#3a9aa8' : '#cfcfcf' }}>
                <span style={{ ...st.chk, background: on ? '#1E8431' : 'transparent', borderColor: on ? '#1E8431' : '#8a8a8a' }}>{on ? <Check size={20} strokeWidth={3} color="#fff" /> : null}</span>
                <span style={st.rowName}>{t.label}</span><span style={st.rowMeta}>{t.desc}</span>
              </button>
            );
          })}
        </div>
        {type && (
          <>
            <div style={{ fontSize: 15, color: '#cbd5e1', margin: '14px 0 6px' }}>Severity <span style={{ color: '#8b97a8' }}>(auto-set from type, adjust if needed)</span></div>
            <div style={{ display: 'flex', gap: 12 }}>{SEVS.map(sv => (<button key={sv} onClick={() => setSeverity(sv)} style={{ ...st.sev, background: sevColor[sv], outline: severity === sv ? '3px solid #fff' : 'none', outlineOffset: 1 }}>{sv}</button>))}</div>
          </>
        )}
      </div>
      <Footer>
        <Btn kind="orange" onClick={() => setStep(isStudentReport ? 1 : 0)}>back</Btn>
        <Btn kind="orange" onClick={() => { setType(''); setSeverity(''); }}>clear</Btn>
        <Btn kind="green" disabled={!type} onClick={() => setStep(isStudentReport ? 3 : 5)}>continue</Btn>
      </Footer>
    </>
  );

  const renderRoles = () => (
    <>
      <div style={st.pad}>
        <div style={st.titleRow}><span style={st.title}>Role of each student</span><span style={st.opt}>step 3 of 6</span></div>
        <div style={st.sub}>{type}{isStudentReport ? ` · ${selStudents.length} student${selStudents.length !== 1 ? 's' : ''} associated` : ''}</div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {selStudents.map(s => {
            const d = per[s.id];
            return (
              <div key={s.id} style={st.pcard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                  <span style={{ ...st.av, width: 48, height: 48, background: s.color, fontSize: 19 }}>{s.initials}</span>
                  <div><div style={{ fontSize: 23, fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 15, color: '#9aa6b6' }}>{s.id} · {s.grade} Grade</div></div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {ROLES.map(r => {
                    const on = d?.role === r;
                    const tint = r === 'instigator' ? '#ffd0d0' : r === 'victim' ? '#cfe0ff' : '#fff';
                    const tcol = r === 'instigator' ? '#7a1010' : r === 'victim' ? '#0b2a66' : '#13203a';
                    return (<button key={r} onClick={() => setRole(s.id, r)} style={{ ...st.role, background: on ? tint : 'transparent', color: on ? tcol : '#cdd6e4', borderColor: on ? tint : '#46506a', fontWeight: on ? 600 : 400 }}>{r}</button>);
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer>
        <Btn kind="orange" onClick={() => setStep(2)}>back</Btn>
        <Btn kind="green" onClick={() => { setStmtIdx(0); setStep(4); }}>continue</Btn>
      </Footer>
    </>
  );

  // STUDENT STATEMENTS, TYD on-screen keyboard shown inline
  const renderStatements = () => {
    const s = selStudents[stmtIdx];
    if (!s) return null;
    const d = per[s.id];
    const captured = selStudents.filter(x => (per[x.id]?.statement || '').trim()).length;
    return (
      <>
        <div style={{ ...st.pad, paddingBottom: 8 }}>
          <div style={st.titleRow}><span style={st.title}>Student's account of what happened</span><span style={st.opt}>step 4 of 6 · {captured}/{selStudents.length} · * optional</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 10px' }}>
            <button onClick={() => setStmtIdx(i => Math.max(0, i - 1))} disabled={stmtIdx === 0} style={{ ...st.navIcon, opacity: stmtIdx === 0 ? 0.4 : 1 }}><ChevronLeft size={26} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, background: '#11161f', border: '1px solid #2a3342', borderRadius: 8, padding: '8px 14px' }}>
              <span style={{ ...st.av, width: 42, height: 42, background: s.color }}>{s.initials}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 21, fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 14, color: '#9aa6b6' }}>{s.id} · {d?.role} · student {stmtIdx + 1} of {selStudents.length}</div></div>
            </div>
            <button onClick={() => setStmtIdx(i => Math.min(selStudents.length - 1, i + 1))} disabled={stmtIdx === selStudents.length - 1} style={{ ...st.navIcon, opacity: stmtIdx === selStudents.length - 1 ? 0.4 : 1 }}><ChevronRight size={26} /></button>
          </div>
          <div style={{ fontSize: 15, color: '#8b97a8', marginBottom: 6 }}>“In your own words, what happened?”, as told by {s.name.split(' ')[0]}</div>
          <NoteField value={d?.statement || ''} placeholder={`Type ${s.name.split(' ')[0]}'s account…`} height={120} />
        </div>
        <Footer>
          <Btn kind="orange" onClick={() => setStep(3)}>back</Btn>
          {stmtIdx < selStudents.length - 1 ? <Btn kind="blue" onClick={() => setStmtIdx(i => i + 1)}>next student</Btn> : <Btn kind="green" onClick={() => setStep(5)}>continue</Btn>}
        </Footer>
        <TydKeyboard value={d?.statement || ''} onChange={v => setStmt(s.id, v)} />
      </>
    );
  };

  // DRIVER ACCOUNT, TYD keyboard inline
  const renderDescription = () => (
    <>
      <div style={{ ...st.pad, paddingBottom: 8 }}>
        <div style={st.titleRow}><span style={st.title}>Your account & evidence</span><span style={st.opt}>{stepLabel(5)} · * optional</span></div>
        <NoteField value={driverDesc} placeholder="Describe what you observed…" height={120} />
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setHasPhoto(true)} style={{ ...st.attach, color: hasPhoto ? '#1E7B34' : '#5F5F5F', borderColor: hasPhoto ? '#3FB152' : '#8a8a8a' }}><Camera size={20} /> {hasPhoto ? 'photo added ✓' : 'take photo'}</button>
          <button onClick={() => setPinned(true)} style={{ ...st.attach, color: pinned ? '#1E7B34' : '#5F5F5F', borderColor: pinned ? '#3FB152' : '#8a8a8a' }}><MapPin size={20} /> {pinned ? 'location pinned, Lot B ✓' : 'pin location'}</button>
        </div>
      </div>
      <Footer>
        <Btn kind="orange" onClick={() => setStep(isStudentReport ? 4 : 2)}>back</Btn>
        <Btn kind="green" onClick={() => setStep(6)}>review</Btn>
      </Footer>
      <TydKeyboard value={driverDesc} onChange={setDriverDesc} />
    </>
  );

  const renderReview = () => (
    <>
      <div style={st.pad}>
        <div style={st.titleRow}><span style={st.title}>Review & submit</span><span style={st.opt}>{stepLabel(6)}</span></div>
        <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1 }}>
            <h4 style={st.sumH}>Incident</h4>
            <div style={st.sumLn}>{type} · <b style={{ color: '#ff9a8d' }}>{severity}</b></div>
            <div style={st.sumDim}>
              {isStudentReport
                ? `one incident · ${selStudents.length} student${selStudents.length !== 1 ? 's' : ''} associated`
                : `${subject === 'thirdParty' ? 'third party' : subject} incident · 1 record · no students involved`}
            </div>
            <h4 style={{ ...st.sumH, marginTop: 14 }}>Transportation</h4>
            <div style={st.sumLn}>Run: Washington High PM, Wolf Rd</div>
            <div style={st.sumLn}>Bus 8{pinned ? ' · Lot B (pinned)' : ''}</div>
            <div style={st.sumDim}>Reported by G. Guzman · today</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h4 style={st.sumH}>Captured</h4>
            <div style={st.sumList}>
              {selStudents.map(s => {
                const d = per[s.id]; const hasStmt = (d?.statement || '').trim().length > 0;
                return (
                  <div key={s.id} style={st.sumItem}>
                    <b style={{ color: '#ffd479' }}>{s.name}</b>, {d?.role}<span style={{ fontSize: 16, color: '#9aa6b6' }}> · {d?.severity === 'shared' ? severity : d?.severity}</span>
                    <div style={{ fontSize: 16, color: hasStmt ? '#bfe3c4' : '#8b97a8', marginTop: 2 }}>{hasStmt ? '“' + (d!.statement.length > 60 ? d!.statement.slice(0, 60) + '…' : d!.statement) + '”' : 'no student statement'}</div>
                  </div>
                );
              })}
              {!isStudentReport && !driverDesc.trim() && !hasPhoto && (
                <div style={{ ...st.sumItem, color: '#8b97a8' }}>Nothing captured yet, your account and a photo are both optional.</div>
              )}
              {driverDesc.trim() && <div style={st.sumItem}>Driver description <span style={{ fontSize: 16, color: '#9aa6b6' }}>· captured</span></div>}
              {hasPhoto && <div style={st.sumItem}>📷 Photo evidence <span style={{ fontSize: 16, color: '#9aa6b6' }}>· 1 file</span></div>}
            </div>
          </div>
        </div>
      </div>
      <Footer>
        <Btn kind="orange" onClick={() => setStep(5)}>back</Btn>
        <Btn kind="green" wide onClick={submit}>submit incident</Btn>
      </Footer>
    </>
  );

  const renderConfirm = () => (
    <>
      <NavBar onBack={() => setScreen('home')} />
      <div style={st.screen}><div style={{ ...st.pad, alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 18, display: 'flex', flexDirection: 'column' }}>
        <div style={st.ring}><Check size={78} color={C.flatGreen} strokeWidth={2.5} /></div>
        <h2 style={{ fontSize: 38, margin: 0 }}>Incident submitted</h2>
        <p style={{ fontSize: 22, color: '#aeb9c9', margin: 0 }}>{isStudentReport && selStudents.length ? `incident created · ${selStudents.length} student${selStudents.length !== 1 ? 's' : ''} associated` : 'incident created'} · your safety coordinator has been notified</p>
        <div style={{ fontSize: 20, color: '#ffd479', fontFamily: 'monospace' }}>{submittedId}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <Btn kind="grey" onClick={() => { resetReport(); setScreen('home'); }}>done</Btn>
          <Btn kind="blue" onClick={() => setScreen('detail')}>view incident</Btn>
        </div>
      </div></div>
    </>
  );

  // ============================================================
  //  MY INCIDENTS, TYD list (light bg, grey cards, green action)
  // ============================================================
  const renderList = () => {
    const shown = incidents
      .filter(i => filter === 'all' ? true : filter === 'open' ? (i.status === 'open' || i.status === 'action') : filter === 'review' ? i.status === 'review' : i.status === 'closed')
      .slice()
      .sort((a, b) => {
        // "action needed" first; within any tier, older incidents appear first
        const rank = (x: any) => (x.status === 'action' ? 0 : 1);
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        return (a.date || '').localeCompare(b.date || '');
      });
    return (
      <>
        <NavBar onBack={() => setScreen('home')} />
        <div style={st.listScreen}>
          <div style={st.pageHead}>
            <span style={st.pageTitle}>My Incidents</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'open', 'review', 'closed'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ ...st.filterBtn, background: filter === f ? C.navy : '#fff', color: filter === f ? '#fff' : '#4f4f4f', borderColor: filter === f ? C.navy : '#bcbcbc' }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={st.cardWrap}>
            {shown.map(i => {
              const s = statusMap[i.status];
              return (
                <div key={i.id} style={st.tydCard}>
                  <div style={st.tydCardId}>{i.id}</div>
                  <div style={st.tydCardTitle}>{i.title}</div>
                  <div style={st.tydCardSub}>{i.sub}</div>
                  <div style={{ ...st.statPill, background: s.bg, color: s.fg }}>{s.lbl}</div>
                  <button style={st.tydOpen} onClick={() => { setActive(i); setScreen('detail'); }}>open</button>
                </div>
              );
            })}
          </div>
        </div>
        <div style={st.navFooter}>
          <button style={st.navFootBtn} onClick={startReport}><AlertTriangle size={26} /><span>report incident</span></button>
          <button style={st.navFootBtn} onClick={() => setScreen('home')}><Home size={26} /><span>home</span></button>
        </div>
      </>
    );
  };

  // ============================================================
  //  INCIDENT DETAIL
  // ============================================================
  const renderDetail = () => {
    const i = active || incidents[0];
    const s = statusMap[i.status] || statusMap.open;
    return (
      <>
        <NavBar onBack={() => setScreen('list')} />
        <div style={st.detailScreen}>
          <div style={st.pageHead}>
            <span style={st.pageTitle}>{i.title}</span>
            <span style={{ ...st.statPill, background: s.bg, color: s.fg, fontSize: 14 }}>{s.lbl}</span>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 18, minHeight: 0, padding: 18, overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              <div style={st.card2}>
                <h4 style={st.cardH}>Your report</h4>
                <div style={st.kvd}><span style={st.kvLbl}>Reported</span> today · Bus 8{i.pinned ? ' · Lot B' : ''}</div>
                {i.driverDesc ? <div style={st.kvd}><span style={st.kvLbl}>Description</span> {i.driverDesc}</div> : null}
                {i.hasPhoto ? <div style={st.kvd}><span style={st.kvLbl}>Evidence</span> 1 photo{i.pinned ? ' · location pinned' : ''}</div> : null}
              </div>
              {i.students && i.students.length > 0 && (
                <div style={st.card2}>
                  <h4 style={st.cardH}>Involved students & statements</h4>
                  {i.students.map((stu: any) => (
                    <div key={stu.id} style={{ padding: '8px 0', borderBottom: '1px solid #e2e2e2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ ...st.av, width: 36, height: 36, fontSize: 15, background: stu.color || '#46506a' }}>{stu.initials || stu.name?.[0]}</span>
                        <span style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>{stu.name}</span><span style={{ fontSize: 16, color: '#666' }}>· {stu.role} · {stu.severity}</span>
                      </div>
                      <div style={{ fontSize: 18, color: stu.statement ? '#333' : '#999', fontStyle: stu.statement ? 'italic' : 'normal', marginTop: 4, paddingLeft: 46 }}>{stu.statement ? '“' + stu.statement + '”' : 'no student statement recorded'}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ ...st.card2, flex: 1 }}>
                <h4 style={st.cardH}>Where it stands</h4>
                {(STATUS_FLOW[i.status] || STATUS_FLOW.open).map((x, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 3, background: x.state === 'done' ? C.flatGreen : x.state === 'now' ? '#2E3F8F' : '#fff', border: `2px solid ${x.state === 'done' ? C.flatGreen : x.state === 'now' ? '#2E3F8F' : '#bcbcbc'}`, boxShadow: x.state === 'now' ? '0 0 0 4px rgba(46,63,143,.18)' : 'none' }} />
                    <span style={{ fontSize: 20, fontWeight: x.state === 'now' ? 700 : 400, color: x.state === 'now' ? '#2E3F8F' : x.state === 'done' ? '#1a1a1a' : '#888' }}>{x.t}<small style={{ display: 'block', fontSize: 14, color: '#888', fontWeight: 400 }}>{x.sub}</small></span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 290, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ ...st.cardH, marginBottom: 4 }}>You can</h4>
              <button style={st.act}><FileText size={24} /> add a note</button>
              <button style={st.act} onClick={() => setHasPhoto(true)}><Camera size={24} /> add a photo</button>
              <button style={st.act} onClick={() => { setComposing(false); setScreen('messages'); }}><MessageSquare size={24} /> message coordinator</button>
              <button style={st.actGhost}><FileText size={24} /> view office response</button>
            </div>
          </div>
          <div style={st.navFooter}>
            <button style={st.navFootBtn} onClick={() => setScreen('list')}><ChevronLeft size={26} /><span>my incidents</span></button>
            <button style={st.navFootBtn} onClick={() => setScreen('home')}><Home size={26} /><span>home</span></button>
          </div>
        </div>
      </>
    );
  };

  // ============================================================
  //  MESSAGES
  // ============================================================
  const renderMessages = () => (
    <>
      <NavBar onBack={() => setScreen('detail')} />
      <div style={st.detailScreen}>
        <div style={st.msgHead}>
          <div style={st.pageTitle}>{active?.title || 'Messages'}</div>
          <div style={st.msgHeadId}>{active?.id || ''} · Messages</div>
        </div>
        <div style={{ ...st.pad, paddingBottom: composing ? 0 : 14 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', padding: '4px 2px' }}>
            {activeThread.map((m, i) => (
              <div key={i} style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '74%', padding: '13px 18px', borderRadius: 12, fontSize: 21, lineHeight: 1.4, color: m.me ? '#fff' : '#16202e', background: m.me ? C.blueGrad : '#fff', border: m.me ? 'none' : '1px solid #d6d6d6', borderBottomRightRadius: m.me ? 3 : 12, borderBottomLeftRadius: m.me ? 12 : 3 }}>
                {m.who && <div style={{ fontSize: 14, color: '#667', marginBottom: 3 }}>{m.who}</div>}
                <div>{m.text}</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{m.t}{m.me ? ' ✓✓' : ''}</div>
              </div>
            ))}
          </div>
          {!composing && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0 4px' }}>
              {['👍 understood', 'no injuries', 'photo attached', 'will follow up'].map(c => (<button key={c} onClick={() => sendMsg(c)} style={st.canned}>{c}</button>))}
              <button onClick={() => { setComposing(true); setDraft(''); }} style={{ ...st.canned, background: C.blueGrad, color: '#fff', borderColor: 'transparent' }}>✎ write a reply</button>
            </div>
          )}
        </div>
        {composing ? (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '0 18px 8px' }}>
              <NoteField value={draft} placeholder="type a reply…" height={56} />
              <Btn kind="grey" onClick={() => setComposing(false)}>cancel</Btn>
              <Btn kind="green" onClick={() => sendMsg(draft)}>send</Btn>
            </div>
            <TydKeyboard value={draft} onChange={setDraft} />
          </>
        ) : (
          <div style={st.navFooter}>
            <button style={st.navFootBtn} onClick={() => setScreen('detail')}><ChevronLeft size={26} /><span>back</span></button>
            <button style={st.navFootBtn} onClick={() => setScreen('home')}><Home size={26} /><span>home</span></button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div style={st.viewport}>
      <div style={st.device}>
        {screen === 'home' && renderHome()}
        {screen === 'report' && renderReport()}
        {screen === 'list' && renderList()}
        {screen === 'detail' && renderDetail()}
        {screen === 'messages' && renderMessages()}
      </div>
    </div>
  );
}

// ============================================================
//  STYLES
// ============================================================
const st: Record<string, React.CSSProperties> = {
  viewport: { position: 'fixed', inset: 0, background: '#0d0d0f', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: 'Roboto, "Segoe UI", system-ui, sans-serif' },
  device: { width: '100%', maxWidth: 1280, height: '100%', maxHeight: 800, background: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  // home bar
  homeBar: { height: 72, flexShrink: 0, background: '#fff', borderBottom: '1px solid #E4E4E4', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 18 },
  welcome: { flex: 1, textAlign: 'center', color: '#333', fontSize: 30, fontWeight: 400 },
  // navy in-app toolbar, matches the TYD nav bar
  navbar: { height: 64, flexShrink: 0, background: '#2E3F8F', display: 'flex', alignItems: 'stretch', color: '#fff' },
  nbCell: { flex: 1, background: 'none', border: 'none', borderRight: '1px solid rgba(255,255,255,.16)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nbCellText: { flex: 1, background: 'none', border: 'none', borderRight: '1px solid rgba(255,255,255,.16)', color: '#fff', cursor: 'pointer', fontSize: 19, textTransform: 'lowercase', fontFamily: 'inherit' },
  nbClock: { flex: 1, background: '#000', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,.16)' },
  runChip: { display: 'inline-block', background: '#00BFD8', color: '#04323a', fontWeight: 700, fontSize: 13, padding: '3px 12px', borderRadius: 14, marginRight: 8 },
  // screens
  screen: { flex: 1, background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  pad: { flex: 1, padding: '18px 26px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 },
  titleRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 30, color: '#fff', fontWeight: 500 },
  opt: { fontSize: 17, color: '#cbd5e1' },
  sub: { fontSize: 16, color: '#9aa6b6', marginTop: -2, marginBottom: 10 },
  footbar: { flexShrink: 0, display: 'flex', justifyContent: 'center', gap: 18, padding: 14, background: '#000' },
  btn: { border: '1px solid #959595', borderRadius: 5, fontSize: 24, fontWeight: 500, padding: '12px 30px', textTransform: 'lowercase', textAlign: 'center' },
  // navy footer action bar (add run / add trip style)
  navFooter: { flexShrink: 0, height: 84, background: '#27348C', display: 'flex', alignItems: 'stretch' },
  navFootBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 150, padding: '0 24px', background: 'none', border: 'none', borderRight: '1px solid rgba(255,255,255,.18)', color: '#fff', fontSize: 18, cursor: 'pointer', textTransform: 'lowercase' },
  // home tiles
  homeBg: { flex: 1, background: '#C2C2C2', display: 'flex', flexDirection: 'column', padding: '26px 30px', overflow: 'hidden' },
  tileRow: { flex: 1, display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center' },
  homeTile: { width: 240, height: 360, border: 'none', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,.28)', position: 'relative', paddingTop: 34 },
  homeTileLabel: { fontSize: 28, fontWeight: 700 },
  homeBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 22 },
  logoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, backgroundImage: 'linear-gradient(to bottom,#3A57A0,#28407C)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 34px', height: 80, fontSize: 26, cursor: 'pointer', minWidth: 240, textTransform: 'lowercase' },
  flashBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(to bottom,#3A57A0,#28407C)', color: '#fff', border: 'none', borderRadius: 10, width: 130, height: 80, cursor: 'pointer' },
  badge: { position: 'absolute', top: 14, right: 16, background: '#D83333', color: '#fff', fontSize: 18, fontWeight: 700, minWidth: 34, height: 34, borderRadius: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' },
  // choice lists
  search: { display: 'flex', alignItems: 'center', gap: 12, background: '#1a212c', border: '1px solid #38445a', borderRadius: 6, padding: '12px 16px', marginBottom: 12 },
  searchInput: { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 21 },
  list: { display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' },
  row: { display: 'flex', alignItems: 'center', gap: 16, color: '#212121', borderRadius: 4, padding: '14px 18px', border: '1px solid #cfcfcf', cursor: 'pointer', textAlign: 'left', width: '100%' },
  chk: { width: 30, height: 30, border: '3px solid #8a8a8a', borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  av: { width: 46, height: 46, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, flexShrink: 0 },
  rowName: { fontSize: 25, fontWeight: 500, flex: 1 },
  rowMeta: { fontSize: 16, color: '#5a5a5a' },
  sev: { padding: '10px 22px', borderRadius: 6, fontSize: 21, fontWeight: 600, border: 'none', color: '#fff', cursor: 'pointer', textTransform: 'lowercase' },
  pcard: { background: '#11161f', border: '1px solid #2a3342', borderRadius: 8, padding: '14px 16px', marginBottom: 12 },
  role: { padding: '9px 18px', borderRadius: 6, border: '2px solid #46506a', fontSize: 19, color: '#cdd6e4', cursor: 'pointer', textTransform: 'lowercase' },
  navIcon: { width: 52, height: 52, borderRadius: 8, border: '1px solid #38445a', background: '#141a23', color: '#cdd6e4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  // notes field (paired with on-screen keyboard)
  noteField: { flex: 1, width: '100%', background: '#BDBDBD', color: '#1a1a1a', borderRadius: 6, padding: 16, fontSize: 22, lineHeight: 1.4, overflow: 'auto' },
  caret: { color: '#333', fontWeight: 700 },
  attach: { display: 'flex', alignItems: 'center', gap: 10, background: '#BDBDBD', border: '1px solid #8a8a8a', borderRadius: 6, padding: '10px 18px', fontSize: 18, cursor: 'pointer' },
  // summary
  sumH: { fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' },
  sumLn: { fontSize: 22, color: '#e2e8f0', margin: '2px 0' },
  sumDim: { fontSize: 18, color: '#9aa6b6', margin: '2px 0' },
  sumList: { flex: 1, background: '#0c1016', border: '1px solid #232c3a', borderRadius: 8, overflow: 'auto' },
  sumItem: { color: '#fff', fontSize: 21, padding: '12px 16px', borderBottom: '1px solid #1c2430' },
  ring: { width: 140, height: 140, borderRadius: '50%', background: 'rgba(63,177,82,.15)', border: '5px solid #3FB152', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  // my incidents (TYD list)
  listScreen: { flex: 1, background: '#ECECEC', color: '#1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  pageHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px', background: '#fff', borderBottom: '1px solid #d6d6d6' },
  pageTitle: { fontSize: 30, fontWeight: 500, color: '#3a3a3a' },
  filterBtn: { padding: '7px 16px', borderRadius: 4, border: '1px solid #bcbcbc', fontSize: 16, cursor: 'pointer', textTransform: 'lowercase' },
  subbar: { background: '#000', color: '#fff', fontSize: 18, padding: '8px 22px', flexShrink: 0 },
  msgHead: { background: '#fff', borderBottom: '1px solid #d6d6d6', padding: '14px 22px', flexShrink: 0 },
  msgHeadId: { fontFamily: 'monospace', fontSize: 16, color: '#888', marginTop: 3 },
  cardWrap: { flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 14, padding: 18, alignContent: 'flex-start' },
  tydCard: { width: 'calc(33.333% - 10px)', minWidth: 300, background: '#D9D9D9', border: '1px solid #c4c4c4', borderRadius: 4, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 },
  tydCardId: { fontFamily: 'monospace', fontSize: 15, color: '#5a6678' },
  tydCardTitle: { fontSize: 22, fontWeight: 600, color: '#1a1a1a' },
  tydCardSub: { fontSize: 15, color: '#555', flex: 1 },
  statPill: { alignSelf: 'flex-start', fontSize: 14, fontWeight: 700, padding: '5px 12px', borderRadius: 14, whiteSpace: 'nowrap' },
  tydOpen: { marginTop: 6, background: 'linear-gradient(to top,#117922,#1E8431 55%,#469F5A)', color: '#fff', border: '1px solid #5A955D', borderRadius: 5, fontSize: 20, padding: '10px 0', cursor: 'pointer', textTransform: 'lowercase' },
  // detail, light TYD theme (light bg, white cards, dark text)
  detailScreen: { flex: 1, background: '#ECECEC', color: '#1a1a1a', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  card2: { background: '#fff', border: '1px solid #d6d6d6', borderRadius: 6, padding: '16px 18px' },
  cardH: { margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#3a3a3a' },
  kvd: { fontSize: 20, margin: '4px 0', color: '#222' },
  kvLbl: { color: '#888' },
  act: { display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #2c4a86', borderRadius: 6, padding: '16px 18px', fontSize: 21, color: '#fff', cursor: 'pointer', textAlign: 'left', background: C.blueGrad },
  actGhost: { display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #bcbcbc', borderRadius: 6, padding: '16px 18px', fontSize: 21, color: '#3a3a3a', cursor: 'pointer', textAlign: 'left', background: '#fff' },
  // messages
  canned: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 18, border: '1px solid #bcbcbc', fontSize: 18, cursor: 'pointer', background: '#fff', color: '#2c4a86' },
};
