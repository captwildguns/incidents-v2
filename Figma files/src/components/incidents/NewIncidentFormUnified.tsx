import { useState, useMemo } from 'react';
import {
  defineTextFieldComponent,
  defineButtonComponent,
  defineBadgeComponent,
  defineIconComponent,
  defineCheckboxComponent,
} from '@tylertech/forge';
defineTextFieldComponent();
defineButtonComponent();
defineBadgeComponent();
defineIconComponent();
defineCheckboxComponent();

import {
  INCIDENT_SUBJECTS,
  IncidentSubject,
  getIncidentTypesForCategory,
  subjectRequiresParties,
  getSubjectLabel,
  PersonContact,
  emptyContact,
} from './IncidentTypes';
import { mockLocations } from './IncidentsPage';
import { mockVehicles } from '../vehicles/VehiclesPage';
import { mockDrivers } from '../drivers/DriversPage';
import { mockStudents } from '../students/StudentsPage';

// ─────────────────────────────────────────────────────────────────────────────
// The container form.
//
// Built for the Aug 19 Review Incident Issues meeting, which asked whether each
// incident subject needs its own experience or whether one container with shared
// and specific fields does the job. Counted from the original form, 14 of the 15
// fields on Incident Details are identical across all five subjects, so this
// builds the container answer.
//
// Three rules, taken straight from that meeting:
//
// 1. A field never changes position between subjects. The original moved
//    Incident Type down beside Affected Location on a Location incident; here it
//    stays in the same slot on all five.
// 2. The affected asset has a permanent slot. It fills with Affected Vehicle or
//    Affected Location, or collapses, and nothing else moves when it collapses.
//    This is the MyRide container behaviour described in the meeting.
// 3. Every subject runs the same two steps, Details then Review. The original ran
//    four steps for Student, Employee and Third Party and two for Vehicle and
//    Location, which is the single largest reason clicking through all five felt
//    like five different products.
//
// People Involved is therefore a section rather than a step, with per-person
// detail as an expandable row inside it, and there is one roster implementation
// instead of the original's two.
//
// This lives beside NewIncidentForm rather than replacing it, so the group can
// click both against the same data before deciding.
// ─────────────────────────────────────────────────────────────────────────────

const SUBJECT_ICONS: Record<IncidentSubject, string> = {
  student: 'school',
  vehicle: 'directions_bus',
  location: 'warehouse',
  thirdParty: 'public',
  employee: 'badge',
};

// One roster entry, whatever the subject. The original carried students in one
// shape and employees and third parties in a parallel one that captured the same
// things; this is that single shape.
interface Person {
  id: string;
  // Where the name came from, which is the only thing that varies by subject
  sourceId?: string;
  name: string;
  role: string;
  severityOverride: string;
  description: string;
  actionTaken: string;
  notes: string;
  parentNotified: boolean;
}

const ROLES = ['Participant', 'Witness', 'Reporter', 'Injured', 'Instigator', 'Victim', 'Bystander'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

// Flat and alphabetical. Category headers added rows to scan without narrowing
// anything down.
const LOCATION_TYPES = [
  'At Vehicle Stop', 'Fuel Station', 'Garage', 'Layover Location', 'Loading/Unloading',
  'Maintenance Bay', 'On Vehicle', 'Other', 'Parking Lot', 'School Campus', 'Wash Bay', 'Yard',
];

const RUNS = [
  'Colonie High AM - Purple', 'Jefferson Middle AM - Blue', 'Lincoln Elementary AM - Green',
  'Meyers Middle AM - Yellow', 'Roosevelt High PM - Red', 'Washington High PM - Wolf Rd',
];

// What the People Involved section is called, and where its names come from.
const ROSTER: Partial<Record<IncidentSubject, { label: string; noun: string; freeText: boolean }>> = {
  student: { label: 'Involved Students', noun: 'student', freeText: false },
  employee: { label: 'Involved Employees', noun: 'employee', freeText: false },
  thirdParty: { label: 'Involved People', noun: 'person', freeText: true },
};

interface NewIncidentFormUnifiedProps {
  onNavigate: (page: string) => void;
}

const labelStyle: any = {
  fontFamily: 'var(--forge-font-family)',
  fontSize: 'var(--forge-font-size-sm)',
  fontWeight: 500,
  display: 'block',
  marginBottom: '4px',
};

const selectStyle: any = {
  fontFamily: 'var(--forge-font-family)',
  fontSize: 'var(--forge-font-size-base)',
  width: '100%',
};

function Req() {
  return <span style={{ color: 'var(--forge-theme-error)' }}> *</span>;
}

function SectionHeading({ children, hint }: { children: any; hint?: string }) {
  return (
    <div style={{ marginBottom: 'var(--forge-spacing-small)' }}>
      <h3
        className="forge-typography--heading4"
        style={{ margin: 0, fontFamily: 'var(--forge-font-family)', fontSize: '1rem', fontWeight: 500 }}
      >
        {children}
      </h3>
      {hint && (
        <p style={{ margin: '2px 0 0', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function ContactFields({
  contact, onChange, onRemove, noun,
}: { contact: PersonContact; onChange: (c: PersonContact) => void; onRemove: () => void; noun: string }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
      style={{ padding: 'var(--forge-spacing-small)', border: '1px solid var(--forge-color-border-subtle)', borderRadius: 'var(--forge-radius-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}
    >
      <div>
        <label style={labelStyle}>Name</label>
        {/* @ts-ignore */}
        <forge-text-field>
          <input value={contact.name} onChange={(e) => onChange({ ...contact, name: e.target.value })} placeholder={`${noun} name`} />
        </forge-text-field>
      </div>
      <div>
        <label style={labelStyle}>Phone</label>
        {/* @ts-ignore */}
        <forge-text-field>
          <input value={contact.phone} onChange={(e) => onChange({ ...contact, phone: e.target.value })} placeholder="Optional" />
        </forge-text-field>
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        {/* @ts-ignore */}
        <forge-text-field>
          <input value={contact.email} onChange={(e) => onChange({ ...contact, email: e.target.value })} placeholder="Optional" />
        </forge-text-field>
      </div>
      <div>
        {/* @ts-ignore */}
        <forge-button variant="outlined" onClick={onRemove} style={{ width: '100%' }}>
          Remove
        </forge-button>
      </div>
    </div>
  );
}

export function NewIncidentFormUnified({ onNavigate }: NewIncidentFormUnifiedProps) {
  const [subject, setSubject] = useState<IncidentSubject | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  // Reporter is back on the subject chooser with a subject already picked
  const [choosing, setChoosing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Shared across every subject
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driver, setDriver] = useState('');
  const [run, setRun] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [witnessPresent, setWitnessPresent] = useState(false);
  const [witnesses, setWitnesses] = useState<PersonContact[]>([]);
  const [thirdPartyPresent, setThirdPartyPresent] = useState(false);
  const [thirdParties, setThirdParties] = useState<PersonContact[]>([]);

  // The one subject-specific field
  const [assetRef, setAssetRef] = useState('');
  // The one subject-specific section
  const [people, setPeople] = useState<Person[]>([]);
  const [personDraft, setPersonDraft] = useState('');
  // Subject the reporter picked while subject-specific answers were already filled
  const [pendingSubject, setPendingSubject] = useState<IncidentSubject | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const roster = subject ? ROSTER[subject] : undefined;
  const assetKind: 'vehicle' | 'location' | null =
    subject === 'vehicle' ? 'vehicle' : subject === 'location' ? 'location' : null;

  const typeOptions = useMemo(
    () => (subject ? getIncidentTypesForCategory(subject) : []),
    [subject]
  );

  const resetSubjectSpecific = () => {
    // Changing subject clears only what is subject-specific: the type, the
    // people, and the asset. Date, time, description, location and evidence are
    // kept, because they are true regardless of what the incident turns out to
    // be about.
    setIncidentType('');
    setAssetRef('');
    setPeople([]);
    setExpanded(new Set());
  };

  const chooseSubject = (next: IncidentSubject) => {
    // Picking the subject already set just closes the chooser again.
    if (subject === next) {
      setChoosing(false);
      setPendingSubject(null);
      return;
    }
    // Warn before clearing, per #191, confirmed in place rather than in a
    // browser dialog. Only when there is something to lose.
    if (subject && (incidentType || assetRef || people.length > 0)) {
      setPendingSubject(next);
      return;
    }
    if (subject) resetSubjectSpecific();
    setSubject(next);
    setChoosing(false);
    setStep(1);
  };

  const confirmSubjectChange = () => {
    if (!pendingSubject) return;
    resetSubjectSpecific();
    setSubject(pendingSubject);
    setPendingSubject(null);
    setChoosing(false);
    setStep(1);
  };

  const addPerson = (name: string, sourceId?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `${sourceId ?? 'p'}-${people.length}-${trimmed.length}`;
    setPeople(p => [...p, {
      id, sourceId, name: trimmed, role: '', severityOverride: '',
      description: '', actionTaken: '', notes: '', parentNotified: false,
    }]);
    setExpanded(e => new Set([...e, id]));
    setPersonDraft('');
  };

  const updatePerson = (id: string, patch: Partial<Person>) =>
    setPeople(p => p.map(x => (x.id === id ? { ...x, ...patch } : x)));

  const removePerson = (id: string) => setPeople(p => p.filter(x => x.id !== id));

  const toggleExpanded = (id: string) =>
    setExpanded(e => {
      const next = new Set(e);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearedBySwitch = (() => {
    const parts: string[] = [];
    if (incidentType) parts.push('the incident type');
    if (assetRef) parts.push('the affected asset');
    if (people.length === 1) parts.push('the person named');
    else if (people.length > 1) parts.push(`the ${people.length} people named`);
    if (parts.length <= 1) return parts[0] ?? 'nothing';
    return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  })();

  const peopleRequired = subject ? subjectRequiresParties(subject) : false;

  const detailsComplete =
    !!subject &&
    !!incidentDate &&
    !!incidentTime &&
    !!incidentType &&
    !!severity &&
    !!description.trim() &&
    !!locationType &&
    (!assetKind || !!assetRef) &&
    (!peopleRequired || people.length > 0);

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ padding: 'var(--forge-spacing-large)', textAlign: 'center', fontFamily: 'var(--forge-font-family)' }}>
        <forge-icon name="check_circle" style={{ fontSize: '48px', color: 'var(--forge-theme-success)' }}></forge-icon>
        <h2 className="forge-typography--heading3" style={{ marginTop: 'var(--forge-spacing-small)' }}>
          Incident reported
        </h2>
        <p style={{ color: 'var(--forge-theme-text-medium)' }}>
          {getSubjectLabel(subject!)} incident, {incidentType}
          {people.length > 0 && `, ${people.length} ${people.length === 1 ? 'person' : 'people'} named`}
          {assetRef && `, ${assetRef}`}
        </p>
        {/* @ts-ignore */}
        <forge-button variant="raised" onClick={() => onNavigate('incidents')} style={{ marginTop: 'var(--forge-spacing-medium)' }}>
          Back to incidents
        </forge-button>
      </div>
    );
  }

  // ── Subject chooser ───────────────────────────────────────────────────────
  if (!subject || choosing) {
    return (
      <div style={{ fontFamily: 'var(--forge-font-family)' }}>
        <SectionHeading hint="Choose the subject of the incident. This determines which details you are asked for.">
          What kind of incident is this?
        </SectionHeading>
        {pendingSubject && (
          <div
            className="flex items-center"
            style={{
              gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-medium)',
              padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
              borderRadius: 'var(--forge-radius-medium)',
              background: 'var(--forge-color-surface-warning, #fffbeb)',
              border: '1px solid var(--forge-color-border-warning, #fde68a)',
            }}
          >
            <forge-icon name="warning" style={{ fontSize: '18px', flexShrink: 0, color: 'var(--forge-theme-warning, #b45309)' }}></forge-icon>
            <span style={{ fontSize: 'var(--forge-font-size-sm)', flex: 1 }}>
              Switching to {getSubjectLabel(pendingSubject)} clears {clearedBySwitch}. Date,
              time, description, location and evidence are kept.
            </span>
            {/* @ts-ignore */}
            <forge-button variant="flat" onClick={() => setPendingSubject(null)}>Keep {getSubjectLabel(subject!)}</forge-button>
            {/* @ts-ignore */}
            <forge-button variant="raised" onClick={confirmSubjectChange}>
              Switch to {getSubjectLabel(pendingSubject)}
            </forge-button>
          </div>
        )}

        <div className="flex flex-wrap" style={{ gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-medium)' }}>
          {INCIDENT_SUBJECTS.map(s => (
            <button
              key={s.value}
              onClick={() => chooseSubject(s.value)}
              style={{
                width: '136px', padding: 'var(--forge-spacing-medium)',
                border: '1px solid var(--forge-color-border-default)',
                borderRadius: 'var(--forge-radius-medium)',
                background: 'var(--forge-theme-surface)', cursor: 'pointer', textAlign: 'center',
                fontFamily: 'var(--forge-font-family)',
              }}
            >
              <div style={{
                width: '40px', height: '40px', margin: '0 auto var(--forge-spacing-xsmall)',
                borderRadius: '50%', background: 'var(--forge-theme-primary-container-minimum)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <forge-icon name={SUBJECT_ICONS[s.value]} style={{ fontSize: '20px', color: 'var(--brand-blue-dark)' }}></forge-icon>
              </div>
              <div style={{ fontWeight: 500, fontSize: 'var(--forge-font-size-base)' }}>{s.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--forge-theme-text-medium)', marginTop: '2px' }}>
                {s.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Header: subject chip, Change, and the same two steps for every subject ──
  const header = (
    <>
      <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-medium)' }}>
        <span style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
          Subject:
        </span>
        <forge-badge theme="warning">{getSubjectLabel(subject)}</forge-badge>
        {/* @ts-ignore */}
        <forge-button variant="flat" onClick={() => setChoosing(true)}>
          <forge-icon slot="start" name="chevron_left"></forge-icon>
          Change
        </forge-button>
      </div>

      {/* Two steps, identical for all five subjects. */}
      <div className="flex items-center" style={{ gap: 'var(--forge-spacing-medium)', marginBottom: 'var(--forge-spacing-large)' }}>
        {[{ n: 1, label: 'Incident Details' }, { n: 2, label: 'Review & Submit' }].map(s => (
          <div key={s.n} className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)' }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 600,
              background: step === s.n ? 'var(--forge-theme-primary)' : 'transparent',
              color: step === s.n ? '#fff' : 'var(--forge-theme-text-medium)',
              border: step === s.n ? 'none' : '1px solid var(--forge-color-border-default)',
            }}>
              {s.n}
            </span>
            <span style={{
              fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)',
              fontWeight: step === s.n ? 500 : 400,
              color: step === s.n ? 'var(--forge-theme-text-high)' : 'var(--forge-theme-text-medium)',
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </>
  );

  // ── Step 1: Incident Details ──────────────────────────────────────────────
  const detailsStep = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-large)' }}>
      <div>
        <SectionHeading hint="When it happened and what happened.">
          Incident Details
        </SectionHeading>

        {/* One ordered list of fields flowed into a three-column grid, rather
            than three hand-built rows.

            The order is the same on every subject, which is what the meeting
            asked for. A field the subject does not need is simply not rendered,
            and the ones after it close up: "if one disappears, it doesn't change
            the entire UI, it's just now that field's no longer there." An earlier
            version reserved the empty slot to keep neighbours in place, which
            left a visible hole. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              key: 'date',
              node: (
                <>
                  <label style={labelStyle}>Date<Req /></label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input type="date" max={new Date().toISOString().slice(0, 10)} value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
                  </forge-text-field>
                </>
              ),
            },
            {
              key: 'time',
              node: (
                <>
                  <label style={labelStyle}>Time<Req /></label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input type="time" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} />
                  </forge-text-field>
                </>
              ),
            },
            {
              key: 'type',
              node: (
                <>
                  <label style={labelStyle}>Incident Type<Req /></label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} style={selectStyle}>
                      <option value="">Select type...</option>
                      {typeOptions.map(t => (
                        <option key={t.id} value={t.label} title={t.description}>{t.label}</option>
                      ))}
                    </select>
                  </forge-text-field>
                </>
              ),
            },
            // The one subject-specific field. Absent on the three subjects that
            // name no asset.
            assetKind && {
              key: 'asset',
              node: (
                <>
                  <label style={labelStyle}>
                    {assetKind === 'location' ? 'Affected Location' : 'Affected Vehicle'}<Req />
                  </label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <select value={assetRef} onChange={(e) => setAssetRef(e.target.value)} style={selectStyle}>
                      <option value="">{assetKind === 'location' ? 'Select location...' : 'Select vehicle...'}</option>
                      {assetKind === 'location'
                        ? mockLocations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)
                        : mockVehicles.map((v: any) => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </forge-text-field>
                </>
              ),
            },
            // Dropped on a Vehicle incident, where Affected Vehicle above already
            // names the vehicle. Asking twice invites the two to disagree.
            assetKind !== 'vehicle' && {
              key: 'vehicleNumber',
              node: (
                <>
                  <label style={labelStyle}>Vehicle Number</label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <select value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} style={selectStyle}>
                      <option value="">Optional...</option>
                      {mockVehicles.map((v: any) => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                  </forge-text-field>
                </>
              ),
            },
            {
              key: 'driver',
              node: (
                <>
                  <label style={labelStyle}>Driver</label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <select value={driver} onChange={(e) => setDriver(e.target.value)} style={selectStyle}>
                      <option value="">Optional...</option>
                      {mockDrivers
                        .filter(d => d.status === 'Active')
                        .sort((a, b) => a.fullName.localeCompare(b.fullName))
                        .map(d => <option key={d.id} value={d.fullName}>{d.fullName}</option>)}
                    </select>
                  </forge-text-field>
                </>
              ),
            },
            {
              key: 'run',
              node: (
                <>
                  <label style={labelStyle}>Run</label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <select value={run} onChange={(e) => setRun(e.target.value)} style={selectStyle}>
                      <option value="">Optional...</option>
                      {RUNS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </forge-text-field>
                </>
              ),
            },
            {
              key: 'locationType',
              node: (
                <>
                  <label style={labelStyle}>Location Type<Req /></label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <select value={locationType} onChange={(e) => setLocationType(e.target.value)} style={selectStyle}>
                      <option value="">Select location type...</option>
                      {LOCATION_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </forge-text-field>
                </>
              ),
            },
            {
              key: 'severity',
              node: (
                <>
                  <label style={labelStyle}>Severity<Req /></label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={selectStyle}>
                      <option value="">Select severity...</option>
                      {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </forge-text-field>
                </>
              ),
            },
          ]
            .filter(Boolean)
            .map((f: any) => <div key={f.key}>{f.node}</div>)}
        </div>

        <div style={{ marginTop: 'var(--forge-spacing-medium)' }}>
          <label style={labelStyle}>Incident Description<Req /></label>
          {/* @ts-ignore */}
          <forge-text-field>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened, including any relevant context..."
              style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
            />
          </forge-text-field>
        </div>
      </div>

      {/* People Involved: a section in a fixed position, not a step. Hidden
          entirely for Vehicle and Location, which have nobody to name. */}
      {roster && (
        <div>
          <SectionHeading hint={`Name each ${roster.noun} involved, then expand a row to record their role and what was done.`}>
            {roster.label}
            {peopleRequired && <Req />}
          </SectionHeading>

          <div className="flex" style={{ gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-small)' }}>
            <div style={{ flex: 1 }}>
              {/* @ts-ignore */}
              <forge-text-field>
                <forge-icon slot="start" name="search"></forge-icon>
                {roster.freeText ? (
                  <input
                    value={personDraft}
                    onChange={(e) => setPersonDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addPerson(personDraft); }}
                    placeholder={`Type a ${roster.noun} name and press Enter...`}
                  />
                ) : (
                  <select
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [id, ...rest] = e.target.value.split('|');
                      addPerson(rest.join('|'), id);
                    }}
                    style={selectStyle}
                  >
                    <option value="">{`Add a ${roster.noun}...`}</option>
                    {subject === 'student'
                      ? mockStudents
                          .filter((s: any) => !people.some(p => p.sourceId === s.id))
                          .map((s: any) => (
                            <option key={s.id} value={`${s.id}|${s.name}`}>{s.name} ({s.id})</option>
                          ))
                      : mockDrivers
                          .filter(d => !people.some(p => p.sourceId === d.id))
                          .map(d => (
                            <option key={d.id} value={`${d.id}|${d.fullName}`}>{d.fullName} ({d.employeeId})</option>
                          ))}
                  </select>
                )}
              </forge-text-field>
            </div>
            {roster.freeText && (
              /* @ts-ignore */
              <forge-button variant="outlined" onClick={() => addPerson(personDraft)}>Add</forge-button>
            )}
          </div>

          {people.length === 0 && (
            <p style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)', margin: 0 }}>
              No {roster.noun}s added yet.
            </p>
          )}

          {people.map(person => (
            <div
              key={person.id}
              style={{ border: '1px solid var(--forge-color-border-subtle)', borderRadius: 'var(--forge-radius-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}
            >
              <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)', padding: 'var(--forge-spacing-small)' }}>
                <button
                  onClick={() => toggleExpanded(person.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, textAlign: 'left', fontFamily: 'var(--forge-font-family)' }}
                >
                  <forge-icon name={expanded.has(person.id) ? 'expand_less' : 'expand_more'} style={{ fontSize: '18px' }}></forge-icon>
                  <span style={{ fontWeight: 500 }}>{person.name}</span>
                  {person.role && <forge-badge theme="default">{person.role}</forge-badge>}
                  {person.severityOverride && <forge-badge theme="info">{person.severityOverride}</forge-badge>}
                </button>
                {/* @ts-ignore */}
                <forge-button variant="flat" onClick={() => removePerson(person.id)}>Remove</forge-button>
              </div>

              {/* Per-person detail, inline. This is what lets all five subjects
                  run the same two steps instead of three needing a third. */}
              {expanded.has(person.id) && (
                <div style={{ padding: '0 var(--forge-spacing-small) var(--forge-spacing-small)', borderTop: '1px solid var(--forge-color-border-subtle)', paddingTop: 'var(--forge-spacing-small)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label style={labelStyle}>Role</label>
                      {/* @ts-ignore */}
                      <forge-text-field>
                        <select value={person.role} onChange={(e) => updatePerson(person.id, { role: e.target.value })} style={selectStyle}>
                          <option value="">Select role...</option>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </forge-text-field>
                    </div>
                    <div>
                      <label style={labelStyle}>Severity for this person</label>
                      {/* @ts-ignore */}
                      <forge-text-field>
                        <select value={person.severityOverride} onChange={(e) => updatePerson(person.id, { severityOverride: e.target.value })} style={selectStyle}>
                          <option value="">Same as incident{severity ? ` (${severity})` : ''}</option>
                          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </forge-text-field>
                    </div>
                    {subject === 'student' && (
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <label className="flex items-center" style={{ gap: '6px', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={person.parentNotified} onChange={(e) => updatePerson(person.id, { parentNotified: e.target.checked })} />
                          Parent notified
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 'var(--forge-spacing-small)' }}>
                    <div>
                      <label style={labelStyle}>What this person did</label>
                      {/* @ts-ignore */}
                      <forge-text-field>
                        <textarea rows={2} value={person.description} onChange={(e) => updatePerson(person.id, { description: e.target.value })} style={{ width: '100%', fontFamily: 'var(--forge-font-family)' }} />
                      </forge-text-field>
                    </div>
                    <div>
                      <label style={labelStyle}>Action taken</label>
                      {/* @ts-ignore */}
                      <forge-text-field>
                        <textarea rows={2} value={person.actionTaken} onChange={(e) => updatePerson(person.id, { actionTaken: e.target.value })} style={{ width: '100%', fontFamily: 'var(--forge-font-family)' }} />
                      </forge-text-field>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Context and evidence, identical for all five */}
      <div>
        <SectionHeading hint="Anyone else present, and anything to attach.">
          Context and Evidence
        </SectionHeading>

        <div className="flex flex-wrap" style={{ gap: 'var(--forge-spacing-large)', marginBottom: 'var(--forge-spacing-small)' }}>
          <label className="flex items-center" style={{ gap: '6px', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={witnessPresent}
              onChange={(e) => {
                setWitnessPresent(e.target.checked);
                if (e.target.checked && witnesses.length === 0) setWitnesses([emptyContact()]);
              }}
            />
            Witness(es) present
          </label>
          <label className="flex items-center" style={{ gap: '6px', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={thirdPartyPresent}
              onChange={(e) => {
                setThirdPartyPresent(e.target.checked);
                if (e.target.checked && thirdParties.length === 0) setThirdParties([emptyContact()]);
              }}
            />
            Third part(ies) involved
          </label>
        </div>

        {witnessPresent && (
          <div style={{ marginBottom: 'var(--forge-spacing-small)' }}>
            {witnesses.map((w, i) => (
              <ContactFields
                key={i}
                contact={w}
                noun="Witness"
                onChange={(c) => setWitnesses(ws => ws.map((x, j) => (j === i ? c : x)))}
                onRemove={() => setWitnesses(ws => ws.filter((_, j) => j !== i))}
              />
            ))}
            {/* @ts-ignore */}
            <forge-button variant="outlined" onClick={() => setWitnesses(ws => [...ws, emptyContact()])}>
              <forge-icon slot="start" name="add"></forge-icon>
              Add witness
            </forge-button>
          </div>
        )}

        {thirdPartyPresent && (
          <div style={{ marginBottom: 'var(--forge-spacing-small)' }}>
            {thirdParties.map((t, i) => (
              <ContactFields
                key={i}
                contact={t}
                noun="Third party"
                onChange={(c) => setThirdParties(ts => ts.map((x, j) => (j === i ? c : x)))}
                onRemove={() => setThirdParties(ts => ts.filter((_, j) => j !== i))}
              />
            ))}
            {/* @ts-ignore */}
            <forge-button variant="outlined" onClick={() => setThirdParties(ts => [...ts, emptyContact()])}>
              <forge-icon slot="start" name="add"></forge-icon>
              Add third party
            </forge-button>
          </div>
        )}

        <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
          <label style={labelStyle}>Tags</label>
          <div className="flex flex-wrap items-center" style={{ gap: '6px' }}>
            {tags.map(t => (
              <forge-badge key={t} theme="default">
                {t}
                <button
                  onClick={() => setTags(ts => ts.filter(x => x !== t))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px', color: 'inherit' }}
                >
                  ×
                </button>
              </forge-badge>
            ))}
          </div>
          {/* @ts-ignore */}
          <forge-text-field style={{ marginTop: '6px' }}>
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagDraft.trim()) {
                  setTags(ts => Array.from(new Set([...ts, tagDraft.trim()])));
                  setTagDraft('');
                }
              }}
              placeholder="Type a tag and press Enter..."
            />
          </forge-text-field>
        </div>
      </div>
    </div>
  );

  // ── Step 2: Review ────────────────────────────────────────────────────────
  const reviewRows: Array<[string, string]> = [
    ['Subject', getSubjectLabel(subject)],
    ['Incident Type', incidentType || '—'],
    ['Date', incidentDate || '—'],
    ['Time', incidentTime || '—'],
    ['Severity', severity || '—'],
    ['Location Type', locationType || '—'],
    ...(assetKind ? [[assetKind === 'location' ? 'Affected Location' : 'Affected Vehicle', assetRef || '—'] as [string, string]] : []),
    ['Vehicle Number', (assetKind === 'vehicle' ? assetRef : vehicleNumber) || '—'],
    ['Driver', driver || '—'],
    ['Run', run || '—'],
    ...(roster ? [[roster.label, people.length ? people.map(p => p.name).join(', ') : '—'] as [string, string]] : []),
    ['Witnesses', witnesses.filter(w => w.name.trim()).map(w => w.name).join(', ') || '—'],
    ['Third parties', thirdParties.filter(t => t.name.trim()).map(t => t.name).join(', ') || '—'],
    ['Tags', tags.join(', ') || '—'],
  ];

  const reviewStep = (
    <div>
      <SectionHeading hint="Check the details before submitting.">
        Review &amp; Submit
      </SectionHeading>
      <div style={{ border: '1px solid var(--forge-color-border-subtle)', borderRadius: 'var(--forge-radius-medium)', padding: 'var(--forge-spacing-medium)' }}>
        {reviewRows.map(([label, value]) => (
          <div
            key={label}
            className="flex"
            style={{ gap: 'var(--forge-spacing-small)', padding: '4px 0', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}
          >
            <span style={{ width: '180px', flexShrink: 0, color: 'var(--forge-theme-text-medium)' }}>{label}</span>
            <span style={{ fontWeight: 500 }}>{value}</span>
          </div>
        ))}
        <div style={{ marginTop: 'var(--forge-spacing-small)', paddingTop: 'var(--forge-spacing-small)', borderTop: '1px solid var(--forge-color-border-subtle)', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>
          <div style={{ color: 'var(--forge-theme-text-medium)', marginBottom: '2px' }}>Description</div>
          <div>{description || '—'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--forge-font-family)' }}>
      {header}
      {step === 1 ? detailsStep : reviewStep}

      <div className="flex items-center justify-between" style={{ marginTop: 'var(--forge-spacing-large)', paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--forge-color-border-subtle)' }}>
        {/* @ts-ignore */}
        <forge-button variant="outlined" onClick={() => (step === 1 ? onNavigate('incidents') : setStep(1))}>
          {step === 1 ? 'Cancel' : 'Back'}
        </forge-button>

        <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)' }}>
          {step === 1 && !detailsComplete && (
            <span style={{ fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
              {peopleRequired && people.length === 0
                ? `Add at least one ${roster?.noun ?? 'person'} to continue`
                : 'Complete the required fields to continue'}
            </span>
          )}
          {/* @ts-ignore */}
          <forge-button
            variant="raised"
            disabled={step === 1 && !detailsComplete}
            onClick={() => (step === 1 ? setStep(2) : setSubmitted(true))}
          >
            {step === 1 ? 'Review' : 'Submit Incident'}
          </forge-button>
        </div>
      </div>
    </div>
  );
}
