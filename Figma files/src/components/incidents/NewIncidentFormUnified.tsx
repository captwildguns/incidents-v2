import { useState, useMemo, useRef } from 'react';
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
  subjectHasField,
  PersonContact,
  emptyContact,
} from './IncidentTypes';
import { mockLocations } from '../../data/locations';
import { mockVehicles } from '../vehicles/VehiclesPage';
import { mockDrivers, allEmployees } from '../../data/employees';
import { mockStudents } from '../students/StudentsPage';
import { IncidentLocationMap } from './IncidentLocationMap';
import { assignWorkflowToIncident, resolveWorkflowOwner, INCIDENT_ROLE_HOLDERS, roleHolderLabel } from '../../data/workflows';

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
// 2. Fields are one ordered list flowed into a grid. A field the subject does
//    not need is not rendered and the ones after it close up, so the grid is
//    always fully packed. This is the MyRide container behaviour described in
//    the meeting: if one disappears it does not change the entire UI, that field
//    is just no longer there.
// 3. Every subject runs the same two steps, Details then Review. The original ran
//    four steps for Student, Employee and Third Party and two for Vehicle and
//    Location, which is the single largest reason clicking through all five felt
//    like five different products.
//
// People Involved is therefore a section rather than a step, with per-person
// detail as an expandable row inside it, and there is one roster implementation
// instead of the original's two.
//
// NewIncidentForm.tsx is the previous multi-step design. It is kept in the
// repository, unreferenced, so it can be diffed or brought back.
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
  severity: string;
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
const ROSTER: Partial<Record<IncidentSubject, {
  label: string;
  noun: string;
  // Full wording rather than an article glued onto noun, which produced
  // "Add a employee".
  addPrompt: string;
  freeText: boolean;
}>> = {
  student: { label: 'Involved Students', noun: 'student', addPrompt: 'Add a student...', freeText: false },
  employee: { label: 'Involved Employees', noun: 'employee', addPrompt: 'Add an employee...', freeText: false },
  thirdParty: { label: 'Involved People', noun: 'person', addPrompt: 'Type a name and press Enter...', freeText: true },
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
      className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
      style={{ padding: 'var(--forge-spacing-small)', border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', borderRadius: 'var(--forge-shape-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}
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
        {/* For the person who cannot or will not give a name. */}
        <label style={labelStyle}>Description</label>
        {/* @ts-ignore */}
        <forge-text-field>
          <input
            value={contact.description}
            onChange={(e) => onChange({ ...contact, description: e.target.value })}
            placeholder="If unnamed, describe them"
          />
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
  // True while severity still holds the value the incident type set. Cleared
  // the moment the reporter picks a different one.
  const [severityFromType, setSeverityFromType] = useState(false);
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driver, setDriver] = useState('');
  const [run, setRun] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  // Empty means follow the workflow owner. Set means this incident goes to a
  // named person regardless of what the workflow routes to.
  const [assignee, setAssignee] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [witnessPresent, setWitnessPresent] = useState(false);
  const [witnesses, setWitnesses] = useState<PersonContact[]>([]);
  const [thirdPartyPresent, setThirdPartyPresent] = useState(false);
  const [thirdParties, setThirdParties] = useState<PersonContact[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; name: string; url: string; size: string }>>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ id: string; name: string; size: string; type: string }>>([]);
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // The one subject-specific field
  const [assetRef, setAssetRef] = useState('');
  // The one subject-specific section
  const [people, setPeople] = useState<Person[]>([]);
  const [personDraft, setPersonDraft] = useState('');
  // Subject the reporter picked while subject-specific answers were already filled
  const [pendingSubject, setPendingSubject] = useState<IncidentSubject | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Drivers are employees whose job is driving, so the picker offers everyone.
  const employeeOptions = allEmployees;

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
    setSeverityFromType(false);
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
      id, sourceId, name: trimmed, role: '', severity: '',
      description: '', actionTaken: '', notes: '', parentNotified: false,
    }]);
    setExpanded(e => new Set([...e, id]));
    setPersonDraft('');
  };

  const updatePerson = (id: string, patch: Partial<Person>) =>
    setPeople(p => p.map(x => (x.id === id ? { ...x, ...patch } : x)));

  const removePerson = (id: string) => setPeople(p => p.filter(x => x.id !== id));

  const readableSize = (bytes: number) =>
    bytes > 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadedPhotos(p => [...p, ...Array.from(files).map((f, i) => ({
      id: `photo-${Date.now()}-${i}`, name: f.name, url: URL.createObjectURL(f), size: readableSize(f.size),
    }))]);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadedDocuments(d => [...d, ...Array.from(files).map((f, i) => ({
      id: `doc-${Date.now()}-${i}`, name: f.name, type: f.type, size: readableSize(f.size),
    }))]);
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

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

  // Workflow selection already keys off type and severity, so as soon as both
  // are set the routing is known. Showing it on review means the reporter sees
  // who picks this up rather than finding out afterwards.
  const routed = useMemo(() => {
    if (!incidentType || !severity) return null;
    const wf = assignWorkflowToIncident(incidentType, severity);
    if (!wf) return null;
    return { workflow: wf.name, owner: resolveWorkflowOwner(wf), ownerRole: wf.ownerRole };
  }, [incidentType, severity]);

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
              borderRadius: 'var(--forge-shape-medium)',
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

        {/* One equal column per subject, filling the dialog rather than a row of
            fixed-width cards that left most of a 1240px dialog empty. Each card
            is its own column flex so the icon and label line up across all five
            regardless of how many lines the description runs to; a native button
            centres its content vertically, which was pushing Vehicle out of line
            with the rest. */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          style={{ gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-small)' }}
        >
          {INCIDENT_SUBJECTS.map(s => (
            <button
              key={s.value}
              onClick={() => chooseSubject(s.value)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-blue-dark)';
                e.currentTarget.style.background = 'var(--forge-theme-primary-container-minimum)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--forge-theme-outline, rgba(0,0,0,0.12))';
                e.currentTarget.style.background = 'var(--forge-theme-surface)';
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'flex-start',
                padding: 'var(--forge-spacing-medium) var(--forge-spacing-small)',
                // --forge-color-border-default is not defined anywhere, so the
                // border silently resolved to "0px none" and these read as plain
                // text rather than as the choices they are.
                border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
                borderRadius: 'var(--forge-shape-medium)',
                background: 'var(--forge-theme-surface)', cursor: 'pointer', textAlign: 'center',
                fontFamily: 'var(--forge-font-family)',
                transition: 'background-color 0.15s, border-color 0.15s',
              }}
            >
              <div style={{
                width: '40px', height: '40px', marginBottom: 'var(--forge-spacing-xsmall)',
                borderRadius: '50%', background: 'var(--forge-theme-primary-container-minimum)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
              border: step === s.n ? 'none' : '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
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
  // The roster, held here so the WHO section below can place it. Absent on
  // Vehicle and Location, which have nobody to name.
  const rosterSection = roster ? (
      <div>
        <label style={labelStyle}>
          {roster.label}
          {peopleRequired && <Req />}
        </label>
        <p style={{ margin: '0 0 8px', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
          Name each {roster.noun} involved, then expand a row to record their role and what was done.
        </p>
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
                  placeholder={roster.addPrompt}
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
                  <option value="">{roster.addPrompt}</option>
                  {subject === 'student'
                    ? mockStudents
                        .filter((s: any) => !people.some(p => p.sourceId === s.id))
                        .map((s: any) => (
                          <option key={s.id} value={`${s.id}|${s.name}`}>{s.name} ({s.id})</option>
                        ))
                    : employeeOptions
                        .filter(e => !people.some(p => p.sourceId === e.id))
                        .map(e => (
                          <option key={e.id} value={`${e.id}|${e.fullName}`}>{e.fullName} ({e.jobRole})</option>
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
            style={{ border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', borderRadius: 'var(--forge-shape-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}
          >
            <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)', padding: 'var(--forge-spacing-small)' }}>
              <button
                onClick={() => toggleExpanded(person.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, textAlign: 'left', fontFamily: 'var(--forge-font-family)' }}
              >
                <forge-icon name={expanded.has(person.id) ? 'expand_less' : 'expand_more'} style={{ fontSize: '18px' }}></forge-icon>
                <span style={{ fontWeight: 500 }}>{person.name}</span>
                {person.role && <forge-badge theme="default">{person.role}</forge-badge>}
                {person.severity && <forge-badge theme="info">{person.severity}</forge-badge>}
              </button>
              {/* @ts-ignore */}
              <forge-button variant="flat" onClick={() => removePerson(person.id)}>Remove</forge-button>
            </div>

            {/* Per-person detail, inline. This is what lets all five subjects
                run the same two steps instead of three needing a third. */}
            {expanded.has(person.id) && (
              <div style={{ padding: '0 var(--forge-spacing-small) var(--forge-spacing-small)', borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', paddingTop: 'var(--forge-spacing-small)' }}>
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
                      <select value={person.severity} onChange={(e) => updatePerson(person.id, { severity: e.target.value })} style={selectStyle}>
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
                {/* No per-person description. Decided with Jon on Aug 20 (#75):
                    Additional Notes already covers what is specific to a person,
                    so a second free-text field is not worth an
                    IncidentEventStudent column. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 'var(--forge-spacing-small)' }}>
                  <div>
                    <label style={labelStyle}>Action taken</label>
                    {/* @ts-ignore */}
                    <forge-text-field>
                      <textarea rows={2} value={person.actionTaken} onChange={(e) => updatePerson(person.id, { actionTaken: e.target.value })} style={{ width: '100%', fontFamily: 'var(--forge-font-family)' }} />
                    </forge-text-field>
                  </div>
                  {/* The detail page renders Additional Notes per person, and
                      seeded incidents use it for coordinator context. Without an
                      input here it could only ever appear on seeded data. */}
                  <div className="sm:col-span-2">
                    <label style={labelStyle}>Additional notes</label>
                    {/* @ts-ignore */}
                    <forge-text-field>
                      <textarea rows={2} value={person.notes} onChange={(e) => updatePerson(person.id, { notes: e.target.value })} style={{ width: '100%', fontFamily: 'var(--forge-font-family)' }} />
                    </forge-text-field>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      ) : null;

  const detailsStep = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>

      {/* One continuous set of fields, sequenced who, then what, then when and
          where. The order is about the order a reporter thinks in, not about
          carving the form into labelled sections, so there are no section
          headings: the roster leads because it is who the incident is about,
          then the account of what happened, then the operational context.

          A field the subject does not need is not rendered and the ones after it
          close up, so the grid is always fully packed. */}

      {rosterSection}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          // WHO, on the two subjects with no people to name. The roster above is
          // the same slot for the three that have them.
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

          // WHAT
          {
            key: 'type',
            node: (
              <>
                <label style={labelStyle}>Incident Type<Req /></label>
                {/* @ts-ignore */}
                <forge-text-field>
                  <select
                    value={incidentType}
                    onChange={(e) => {
                      const label = e.target.value;
                      setIncidentType(label);
                      // Every type in the catalogue carries a defaultSeverity, so
                      // picking one sets severity rather than leaving the
                      // reporter to guess. Overridable below.
                      const picked = typeOptions.find(ty => ty.label === label);
                      if (picked) {
                        setSeverity(picked.defaultSeverity);
                        setSeverityFromType(true);
                      }
                    }}
                    style={selectStyle}
                  >
                    <option value="">Select type...</option>
                    {typeOptions.map(ty => (
                      <option key={ty.id} value={ty.label} title={ty.description}>{ty.label}</option>
                    ))}
                  </select>
                </forge-text-field>
              </>
            ),
          },
          {
            key: 'severity',
            // Spans the rest of the row so all four options are visible at once.
            // A radio group rather than a select because the value is usually
            // already correct from the type, and a closed select hides both what
            // it is and that it can be changed.
            spanTwo: true,
            node: (
              <>
                <label style={labelStyle}>
                  Severity<Req />
                  {severityFromType && (
                    <span style={{ fontWeight: 400, color: 'var(--forge-theme-text-medium)' }}>
                      {'  '}set from incident type, change if needed
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap" style={{ gap: '8px', paddingTop: '2px' }}>
                  {SEVERITIES.map(s => (
                    <label
                      key={s}
                      className="flex items-center"
                      style={{
                        gap: '6px',
                        padding: '7px 12px',
                        border: `1px solid ${severity === s ? 'var(--forge-theme-primary)' : 'var(--forge-theme-outline, rgba(0,0,0,0.12))'}`,
                        borderRadius: 'var(--forge-shape-medium)',
                        background: severity === s ? 'var(--forge-theme-primary-container-minimum)' : 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'var(--forge-font-family)',
                      }}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={s}
                        checked={severity === s}
                        onChange={() => { setSeverity(s); setSeverityFromType(false); }}
                      />
                      <forge-badge theme={s === 'Critical' ? 'danger' : s === 'High' ? 'error' : s === 'Medium' ? 'warning' : 'info'}>
                        {s}
                      </forge-badge>
                    </label>
                  ))}
                </div>
              </>
            ),
          },
          {
            key: 'description',
            // Spans the row in place rather than sitting in its own block, so it
            // stays in sequence without breaking the flow into sections.
            span: true,
            node: (
              <>
                <label style={labelStyle}>Incident Description<Req /></label>
                {/* @ts-ignore */}
                <forge-text-field>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What happened, including any relevant context..."
                    style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
                  />
                </forge-text-field>
              </>
            ),
          },

          // WHEN AND WHERE
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
          // Which of these three apply is now one shared map, read by the
          // detail page too, so the form and the record cannot disagree about
          // what a subject needs. Vehicle drops this because Affected Vehicle
          // already names the bus; Location drops all three.
          subjectHasField(subject, 'vehicleNumber') && {
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
          subjectHasField(subject, 'driver') && {
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
          subjectHasField(subject, 'run') && {
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
        ]
          .filter(Boolean)
          .map((f: any) => (
            <div key={f.key} className={f.span ? 'sm:col-span-3' : f.spanTwo ? 'sm:col-span-2' : undefined}>{f.node}</div>
          ))}
      </div>

      {/* The map component supplies its own heading. */}
      <IncidentLocationMap
        location={locationCoordinates}
        onLocationChange={setLocationCoordinates}
        address={locationAddress}
        onAddressChange={setLocationAddress}
      />

      {/* Still the same run of fields, just the optional ones. */}
      <div>

        {/* Witnesses, third parties and tags share one row. Each of the three is
            small on its own, and tags on its own line pushed the evidence
            buttons below the fold for no reason. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start" style={{ marginBottom: 'var(--forge-spacing-small)' }}>
          {/* Label above a bordered control, the same shape as every other
              field. As bare inline checkboxes these two sat at a different
              height to their neighbours and had no field box, which made the
              row look unfinished. */}
          <div>
            <label style={labelStyle}>Witnesses</label>
            {/* @ts-ignore */}
            <forge-text-field>
              <select
                value={witnessPresent ? 'yes' : 'no'}
                onChange={(e) => {
                  const on = e.target.value === 'yes';
                  setWitnessPresent(on);
                  if (on && witnesses.length === 0) setWitnesses([emptyContact()]);
                }}
                style={selectStyle}
              >
                <option value="no">None</option>
                <option value="yes">One or more present</option>
              </select>
            </forge-text-field>
          </div>

          <div>
            <label style={labelStyle}>Third parties</label>
            {/* @ts-ignore */}
            <forge-text-field>
              <select
                value={thirdPartyPresent ? 'yes' : 'no'}
                onChange={(e) => {
                  const on = e.target.value === 'yes';
                  setThirdPartyPresent(on);
                  if (on && thirdParties.length === 0) setThirdParties([emptyContact()]);
                }}
                style={selectStyle}
              >
                <option value="no">None</option>
                <option value="yes">One or more involved</option>
              </select>
            </forge-text-field>
          </div>

          <div>
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

          <div>
            <label style={labelStyle}>Assigned To</label>
            {/* @ts-ignore */}
            <forge-text-field>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                style={selectStyle}
              >
                <option value="">
                  {routed?.owner ? `Workflow default (${routed.owner})` : 'Workflow default'}
                </option>
                {INCIDENT_ROLE_HOLDERS.map(h => (
                  <option key={h.name} value={h.name}>{roleHolderLabel(h)}</option>
                ))}
              </select>
            </forge-text-field>
            <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)', marginTop: '4px' }}>
              {assignee
                ? 'Overrides the workflow for this incident only.'
                : routed
                  ? 'Follows the ' + routed.workflow + ' workflow.'
                  : 'Set by the workflow once incident type and severity are chosen.'}
            </div>
          </div>
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


        {/* Both uploads share a row, since each is only a button until
            something is attached. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 'var(--forge-spacing-medium)' }}>
          <div>
            <label style={labelStyle}>Photo evidence</label>
            <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
            {/* @ts-ignore */}
            <forge-button variant="outlined" onClick={() => photoInputRef.current?.click()}>
              <forge-icon slot="start" name="upload"></forge-icon>
              Upload photos
            </forge-button>
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-3" style={{ marginTop: 'var(--forge-spacing-small)' }}>
                {uploadedPhotos.map(photo => (
                  <div
                    key={photo.id}
                    style={{ border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', borderRadius: 'var(--forge-shape-medium)', overflow: 'hidden' }}
                  >
                    <img src={photo.url} alt={photo.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    <div className="flex items-center" style={{ gap: '4px', padding: '4px' }}>
                      <span
                        title={`${photo.name} (${photo.size})`}
                        style={{ fontSize: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {photo.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedPhotos(ps => ps.filter(x => x.id !== photo.id))}
                        aria-label={`Remove ${photo.name}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forge-theme-text-medium)', lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Document evidence</label>
            <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx" multiple onChange={handleDocumentUpload} style={{ display: 'none' }} />
            {/* @ts-ignore */}
            <forge-button variant="outlined" onClick={() => documentInputRef.current?.click()}>
              <forge-icon slot="start" name="upload"></forge-icon>
              Upload documents
            </forge-button>
            {uploadedDocuments.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: 'var(--forge-spacing-xsmall)', marginTop: 'var(--forge-spacing-small)' }}>
                {uploadedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center"
                    style={{ gap: '6px', padding: '6px 10px', border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', borderRadius: 'var(--forge-shape-medium)' }}
                  >
                    <forge-icon name="description" style={{ fontSize: '16px', color: 'var(--forge-theme-text-medium)' }}></forge-icon>
                    <span style={{ fontSize: '0.75rem' }} title={`${doc.name} (${doc.size})`}>{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedDocuments(ds => ds.filter(x => x.id !== doc.id))}
                      aria-label={`Remove ${doc.name}`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forge-theme-text-medium)', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Where on the map, as distinct from Location Type, which is the kind
            of place. Same on every subject. */}
      </div>
    </div>
  );

  // ── Step 2: Review ────────────────────────────────────────────────────────
  const reviewRows: Array<[string, string]> = [
    ['Subject', getSubjectLabel(subject)],
    ['Incident Type', incidentType || '-'],
    ['Date', incidentDate || '-'],
    ['Time', incidentTime || '-'],
    ['Severity', severity || '-'],
    ['Location Type', locationType || '-'],
    ...(assetKind ? [[assetKind === 'location' ? 'Affected Location' : 'Affected Vehicle', assetRef || '-'] as [string, string]] : []),
    ['Vehicle Number', (assetKind === 'vehicle' ? assetRef : vehicleNumber) || '-'],
    ['Driver', driver || '-'],
    ['Run', run || '-'],
    ...(roster ? [[roster.label, people.length ? people.map(p => p.name).join(', ') : '-'] as [string, string]] : []),
    ['Witnesses', witnesses.filter(w => w.name.trim() || w.description.trim()).map(w => w.name.trim() || w.description.trim()).join(', ') || '-'],
    ['Third parties', thirdParties.filter(t => t.name.trim() || t.description.trim()).map(t => t.name.trim() || t.description.trim()).join(', ') || '-'],
    ['Tags', tags.join(', ') || '-'],
    ['Workflow', routed ? routed.workflow : 'None matches this type and severity'],
    // Unassigned is a real outcome per #197: a workflow with no owner creates
    // the incident unassigned and it lands in the triage queue.
    ['Assigned to', assignee
      ? `${assignee}, chosen on this incident`
      : routed
        ? (routed.owner
            ? `${routed.owner}${routed.ownerRole ? ` (${routed.ownerRole})` : ''}`
            : 'Unassigned, goes to triage')
        : '-'],
    ['Photos', uploadedPhotos.length ? `${uploadedPhotos.length} attached` : '-'],
    ['Documents', uploadedDocuments.length ? `${uploadedDocuments.length} attached` : '-'],
    ['Location pin', locationAddress || (locationCoordinates ? `${locationCoordinates.lat.toFixed(4)}, ${locationCoordinates.lng.toFixed(4)}` : '-')],
  ];

  const reviewStep = (
    <div>
      <SectionHeading hint="Check the details before submitting.">
        Review &amp; Submit
      </SectionHeading>
      <div style={{ border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', borderRadius: 'var(--forge-shape-medium)', padding: 'var(--forge-spacing-medium)' }}>
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
        <div style={{ marginTop: 'var(--forge-spacing-small)', paddingTop: 'var(--forge-spacing-small)', borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>
          <div style={{ color: 'var(--forge-theme-text-medium)', marginBottom: '2px' }}>Description</div>
          <div>{description || '-'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--forge-font-family)' }}>
      {header}
      {step === 1 ? detailsStep : reviewStep}

      <div className="flex items-center justify-between" style={{ marginTop: 'var(--forge-spacing-large)', paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))' }}>
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
