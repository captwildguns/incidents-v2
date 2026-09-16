import { useState, useMemo, useRef } from 'react';
import {
  defineTextFieldComponent,
  defineButtonComponent,
  defineBadgeComponent,
  defineIconComponent,
  defineIconButtonComponent,
  defineCheckboxComponent,
} from '@tylertech/forge';
defineTextFieldComponent();
defineButtonComponent();
defineBadgeComponent();
defineIconComponent();
defineIconButtonComponent();
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
  InvolvedVehicle,
  VEHICLE_ROLES,
  VEHICLE_DAMAGE_LEVELS,
} from './IncidentTypes';
import { mockLocations } from '../../data/locations';
import { mockVehicles } from '../vehicles/VehiclesPage';
import { mockDrivers, allEmployees } from '../../data/employees';
import { mockStudents } from '../students/StudentsPage';
import { IncidentLocationMap } from './IncidentLocationMap';
import { assignWorkflowToIncident, resolveWorkflowOwner, ROLE_HOLDERS, holdersOfRole } from '../../data/workflows';

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
  // Which roster the name came from. An outside person is the only one typed by
  // hand, because a motorist or a parent at a stop is in no district list.
  kind: 'employee' | 'student' | 'outside';
  // Whether the child was hurt. Only asked of a student on board a bus
  // incident, never on a student incident, where the child is the subject.
  condition: string;
}

// A student who was on board when something happened to the bus. Carries the
// same condition as a student on a student incident, plus which bus, because a
// two bus collision has children on both.
interface StudentAboard {
  id: string;
  sourceId: string;
  name: string;
  bus: string;
  condition: string;
}

const CONDITIONS = ['Uninjured', 'Injured', 'Transported for treatment'];

// The four roles a person can hold in an incident, in this order, matching the
// Forge build. One list for every incident type.
const ROLES = ['Instigator', 'Participant', 'Victim', 'Witness'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

// Nine, ordered from where a route runs out to where a bus is kept, with Other
// last. Says where the incident happened, not which site: the site is already on
// the record, so a bay or a fuel island inside a garage earns nothing.
const LOCATION_TYPES = [
  'Vehicle (on board)', 'Vehicle Stop', 'Loading/Unloading', 'School', 'Parking Lot',
  'Layover Location', 'Garage', 'Yard', 'Other',
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
  // A typed name, offered only where the person cannot be in a district list.
  freeText: boolean;
  pickEmployees: boolean;
  pickStudents: boolean;
}>> = {
  student: { label: 'Involved Students', noun: 'student', addPrompt: '', freeText: false, pickEmployees: false, pickStudents: true },
  employee: { label: 'Involved Employees', noun: 'employee', addPrompt: '', freeText: false, pickEmployees: true, pickStudents: false },
  // A third party incident is about somebody outside the district, and district
  // people are usually in it too: the driver who was struck, the children who
  // were on the bus. All three get their own selector.
  thirdParty: { label: 'Involved People', noun: 'person', addPrompt: 'Type a name and press Enter...', freeText: true, pickEmployees: true, pickStudents: true },
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

function StudentSearch({
  taken, onPick, placeholder,
}: {
  taken: (id: string) => boolean;
  onPick: (id: string, name: string) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const matches = term
    ? (mockStudents as any[])
        .filter(st => !taken(st.id))
        .filter(st => st.name.toLowerCase().includes(term) || String(st.id).toLowerCase().includes(term))
        .slice(0, 8)
    : [];

  return (
    <div style={{ position: 'relative' }}>
      {/* @ts-ignore */}
      <forge-text-field>
        <forge-icon slot="start" name="search"></forge-icon>
        <input
          value={q}
          placeholder={placeholder}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQ('');
            if (e.key === 'Enter' && matches.length) {
              onPick(matches[0].id, matches[0].name);
              setQ('');
            }
          }}
        />
      </forge-text-field>

      {term && (
        <div
          style={{
            position: 'absolute', zIndex: 20, left: 0, right: 0, top: 'calc(100% + 2px)',
            background: '#fff',
            border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
            borderRadius: 'var(--forge-shape-medium)',
            boxShadow: 'var(--forge-elevation-4)',
            maxHeight: '260px', overflowY: 'auto',
          }}
        >
          {matches.length === 0 && (
            <div style={{ padding: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
              No student matches "{q.trim()}"
            </div>
          )}
          {matches.map(st => (
            <button
              key={st.id}
              type="button"
              onClick={() => { onPick(st.id, st.name); setQ(''); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                background: 'none', border: 'none',
                padding: '8px var(--forge-spacing-small)',
                fontFamily: 'var(--forge-font-family)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--forge-theme-primary-container-minimum)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ fontWeight: 500, fontSize: 'var(--forge-font-size-base)' }}>{st.name}</div>
              <div style={{ fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
                {st.id} · {st.grade} · {st.school}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Segmented({
  options, value, onChange, ariaLabel,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex" style={{ width: 'fit-content' }}>
      {options.map((o, i) => {
        const on = value === o;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on ? '' : o)}
            style={{
              fontFamily: 'var(--forge-font-family)',
              fontSize: 'var(--forge-font-size-sm)',
              fontWeight: on ? 500 : 400,
              padding: '7px 14px',
              cursor: 'pointer',
              background: on ? 'var(--forge-theme-primary-container-minimum)' : '#fff',
              color: on ? 'var(--forge-theme-text-high)' : 'var(--forge-theme-text-medium)',
              border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
              borderLeftWidth: i === 0 ? '1px' : '0',
              borderTopLeftRadius: i === 0 ? 'var(--forge-shape-medium)' : '0',
              borderBottomLeftRadius: i === 0 ? 'var(--forge-shape-medium)' : '0',
              borderTopRightRadius: i === options.length - 1 ? 'var(--forge-shape-medium)' : '0',
              borderBottomRightRadius: i === options.length - 1 ? 'var(--forge-shape-medium)' : '0',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeading({ children, hint, block }: { children: any; hint?: string; block?: boolean }) {
  return (
    <div style={{
      marginBottom: 'var(--forge-spacing-small)',
      marginTop: block ? 'var(--forge-spacing-large)' : undefined,
    }}>
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

// A contact counts as filled in once it carries either a name or a description,
// which is the same rule the record uses. Done on an untouched card discards it
// rather than leaving a blank line behind.
const contactIsEmpty = (c: PersonContact) => !c.name.trim() && !c.description.trim();

// What a finished contact reads as on its one line. The description stands in
// for the name when nobody could give one.
const contactSummary = (c: PersonContact) => c.name.trim() || c.description.trim();

function ContactSummaryRow({
  contact, onEdit, onRemove,
}: { contact: PersonContact; onEdit: () => void; onRemove: () => void }) {
  const contactLine = [contact.phone.trim(), contact.email.trim()].filter(Boolean).join(' · ');
  const unnamed = !contact.name.trim();
  // The description only repeats the line above when there is no name to show,
  // so it is listed separately whenever a name was given.
  const describedToo = !unnamed && !!contact.description.trim();
  return (
    <div
      className="flex items-center"
      style={{
        gap: 'var(--forge-spacing-small)',
        padding: 'var(--forge-spacing-small)',
        border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))',
        borderRadius: 'var(--forge-shape-medium)',
        marginBottom: 'var(--forge-spacing-xsmall)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--forge-font-family)' }}>
        <div
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: unnamed ? 'var(--forge-font-weight-regular)' : 'var(--forge-font-weight-medium)',
            fontStyle: unnamed ? 'italic' : 'normal',
            // A name is one line and clips; a description of an unnamed person
            // is a sentence and has to be readable in full.
            overflow: unnamed ? undefined : 'hidden',
            textOverflow: unnamed ? undefined : 'ellipsis',
            whiteSpace: unnamed ? 'normal' : 'nowrap',
          }}
        >
          {contactSummary(contact)}
        </div>
        {contactLine && (
          <div style={{ fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
            {contactLine}
          </div>
        )}
        {describedToo && (
          <div style={{ fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
            {contact.description.trim()}
          </div>
        )}
      </div>
      {/* @ts-ignore */}
      <forge-button variant="outlined" onClick={onEdit}>Edit</forge-button>
      {/* @ts-ignore */}
      <forge-button variant="outlined" onClick={onRemove}>Remove</forge-button>
    </div>
  );
}

function ContactFields({
  contact, onChange, onRemove, onDone, noun,
}: { contact: PersonContact; onChange: (c: PersonContact) => void; onRemove: () => void; onDone: () => void; noun: string }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
      style={{ padding: 'var(--forge-spacing-small)', border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', borderRadius: 'var(--forge-shape-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}
    >
      <div>
        {/* @ts-ignore */}
        <forge-text-field float-label>
          <label slot="label">Name</label>

          <input value={contact.name} onChange={(e) => onChange({ ...contact, name: e.target.value })} />
        </forge-text-field>
      </div>
      <div>
        {/* For the person who cannot or will not give a name. */}
        {/* @ts-ignore */}
        <forge-text-field float-label>
          <label slot="label">Description</label>

          <input
            value={contact.description}
            onChange={(e) => onChange({ ...contact, description: e.target.value })}

          />
        </forge-text-field>
      </div>
      <div>
        {/* @ts-ignore */}
        <forge-text-field float-label>
          <label slot="label">Phone</label>

          <input value={contact.phone} onChange={(e) => onChange({ ...contact, phone: e.target.value })} />
        </forge-text-field>
      </div>
      <div>
        {/* @ts-ignore */}
        <forge-text-field float-label>
          <label slot="label">Email</label>

          <input value={contact.email} onChange={(e) => onChange({ ...contact, email: e.target.value })} />
        </forge-text-field>
      </div>
      <div className="flex" style={{ gap: 'var(--forge-spacing-xsmall)' }}>
        {/* @ts-ignore */}
        <forge-button variant="raised" onClick={onDone} style={{ flex: 1 }}>
          Done
        </forge-button>
        {/* @ts-ignore */}
        <forge-button variant="outlined" onClick={onRemove} style={{ flex: 1 }}>
          Remove
        </forge-button>
      </div>
    </div>
  );
}

// One list of people: each entry is either open for editing or collapsed to a
// line. Used for witnesses and for third parties, which behave identically.
function ContactList({
  contacts, setContacts, editing, setEditing, noun, addLabel,
}: {
  contacts: PersonContact[];
  setContacts: (fn: (cs: PersonContact[]) => PersonContact[]) => void;
  editing: boolean[];
  setEditing: (fn: (es: boolean[]) => boolean[]) => void;
  noun: string;
  addLabel: string;
}) {
  const removeAt = (i: number) => {
    setContacts(cs => cs.filter((_, j) => j !== i));
    setEditing(es => es.filter((_, j) => j !== i));
  };

  const doneAt = (i: number) => {
    if (contactIsEmpty(contacts[i])) {
      removeAt(i);
      return;
    }
    setEditing(es => es.map((e, j) => (j === i ? false : e)));
  };

  return (
    <div style={{ marginBottom: 'var(--forge-spacing-small)' }}>
      {contacts.map((c, i) =>
        editing[i] === false ? (
          <ContactSummaryRow
            key={i}
            contact={c}
            onEdit={() => setEditing(es => es.map((e, j) => (j === i ? true : e)))}
            onRemove={() => removeAt(i)}
          />
        ) : (
          <ContactFields
            key={i}
            contact={c}
            noun={noun}
            onChange={(next) => setContacts(cs => cs.map((x, j) => (j === i ? next : x)))}
            onRemove={() => removeAt(i)}
            onDone={() => doneAt(i)}
          />
        ),
      )}
      {/* @ts-ignore */}
      <forge-button
        variant="outlined"
        onClick={() => {
          setContacts(cs => [...cs, emptyContact()]);
          setEditing(es => [...es, true]);
        }}
      >
        {/* @ts-ignore */}
        <forge-icon slot="start" name="add"></forge-icon>
        {addLabel}
      </forge-button>
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
  // Empty means follow the role the workflow assigns. Set means this incident
  // goes to that role instead.
  const [assigneeRole, setAssigneeRole] = useState('');
  // Empty means whoever holds the role. Set means this one person owns the
  // incident, overriding whatever the workflow would have done.
  const [assignee, setAssignee] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [witnessPresent, setWitnessPresent] = useState(false);
  const [witnesses, setWitnesses] = useState<PersonContact[]>([]);
  // Runs alongside the list above: true while that entry is open for editing,
  // false once Done has collapsed it to a line.
  const [witnessEditing, setWitnessEditing] = useState<boolean[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; name: string; url: string; size: string }>>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ id: string; name: string; size: string; type: string }>>([]);
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // The one subject-specific field. Location only now: a vehicle incident takes
  // a list of vehicles rather than a single one, so it uses the list below.
  const [assetRef, setAssetRef] = useState('');
  // The one subject-specific section
  const [people, setPeople] = useState<Person[]>([]);
  const [personDraft, setPersonDraft] = useState('');
  // Vehicles named on a vehicle incident. More than one, because two of our own
  // buses striking each other is a single event and belongs on one record.
  const [involvedVehicles, setInvolvedVehicles] = useState<InvolvedVehicle[]>([]);
  const [studentsAboard, setStudentsAboard] = useState<StudentAboard[]>([]);
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
    // Changing subject starts the report over. Carrying the shared answers
    // across a switch was descoped on Aug 25, so nothing survives it.
    setIncidentType('');
    setSeverity('');
    setSeverityFromType(false);
    setAssetRef('');
    setPeople([]);
    setStudentsAboard([]);
    setInvolvedVehicles([]);
    setExpanded(new Set());
    setDescription('');
    setIncidentDate(new Date().toISOString().slice(0, 10));
    setIncidentTime('');
    setLocationType('');
    setLocationCoordinates(null);
    setLocationAddress('');
    setVehicleNumber('');
    setDriver('');
    setRun('');
    setTags([]);
    setTagDraft('');
    setAssignee('');
    setWitnessPresent(false);
    setWitnesses([]);
    setWitnessEditing([]);
    setThirdPartyPresent(false);
    setThirdParties([]);
    setThirdPartyEditing([]);
    setUploadedPhotos([]);
    setUploadedDocuments([]);
  };

  const chooseSubject = (next: IncidentSubject) => {
    // Picking the subject already set just closes the chooser again.
    if (subject === next) {
      setChoosing(false);
      setPendingSubject(null);
      return;
    }
    // Warn before clearing, confirmed in place rather than in a browser
    // dialog. Only when there is something to lose.
    if (subject && anythingEntered) {
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

  const addPerson = (name: string, sourceId?: string, kind: Person['kind'] = 'outside') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `${sourceId ?? 'p'}-${people.length}-${trimmed.length}`;
    setPeople(p => [...p, {
      id, sourceId, name: trimmed, role: '', severity,
      description: '', actionTaken: '', notes: '', parentNotified: false,
      kind,
      condition: '',
    }]);
    setExpanded(e => new Set([...e, id]));
    setPersonDraft('');
  };

  const updatePerson = (id: string, patch: Partial<Person>) =>
    setPeople(p => p.map(x => (x.id === id ? { ...x, ...patch } : x)));

  const removePerson = (id: string) => setPeople(p => p.filter(x => x.id !== id));

  // Adding a vehicle fills its driver from the vehicle record, the same courtesy
  // the single Driver field used to do, only now per vehicle so a two bus
  // collision carries both drivers instead of one of them.
  const addVehicle = (sourceId: string, name: string) => {
    if (!name) return;
    const known: any = mockVehicles.find((v: any) => v.id === sourceId);
    const id = `veh-${sourceId}-${involvedVehicles.length}`;
    setInvolvedVehicles(v => [...v, {
      id, sourceId, name,
      role: '', driver: known?.driver ?? '', damage: '', notes: '',
    }]);
    setExpanded(e => new Set([...e, id]));
  };

  const updateVehicle = (id: string, patch: Partial<InvolvedVehicle>) =>
    setInvolvedVehicles(v => v.map(x => (x.id === id ? { ...x, ...patch } : x)));

  const removeVehicle = (id: string) =>
    setInvolvedVehicles(v => v.filter(x => x.id !== id));

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

  // Anything at all typed, chosen or attached. Used to decide whether a switch
  // needs warning about, now that a switch discards the whole report.
  const anythingEntered =
    !!incidentType || !!severity || !!assetRef ||
    people.length > 0 || involvedVehicles.length > 0 || studentsAboard.length > 0 ||
    !!description.trim() || !!incidentTime || !!locationType ||
    !!locationCoordinates || !!locationAddress.trim() ||
    !!vehicleNumber || !!driver || !!run || tags.length > 0 || !!assignee ||
    witnessPresent ||
    uploadedPhotos.length > 0 || uploadedDocuments.length > 0;

  // Workflow selection already keys off type and severity, so as soon as both
  // are set the routing is known. Showing it on review means the reporter sees
  // who picks this up rather than finding out afterwards.
  const routed = useMemo(() => {
    if (!incidentType || !severity) return null;
    const wf = assignWorkflowToIncident(incidentType, severity);
    if (!wf) return null;
    return { workflow: wf.name, owner: resolveWorkflowOwner(wf), ownerRole: wf.ownerRole };
  }, [incidentType, severity]);

  // The role the incident is heading to: whatever was chosen, otherwise whatever
  // the matched workflow assigns. Drives which employees can be named.
  const effectiveAssigneeRole = assigneeRole || routed?.ownerRole || '';

  const peopleRequired = subject ? subjectRequiresParties(subject) : false;
  // A vehicle incident needs at least one vehicle named, the same way the people
  // subjects need at least one person.
  const vehiclesRequired = subject === 'vehicle';

  const detailsComplete =
    !!subject &&
    !!incidentDate &&
    !!incidentTime &&
    !!incidentType &&
    !!severity &&
    !!description.trim() &&
    !!locationType &&
    (assetKind !== 'location' || !!assetRef) &&
    (!vehiclesRequired || involvedVehicles.length > 0) &&
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
          {involvedVehicles.length > 0 && `, ${involvedVehicles.map(v => v.name).join(' and ')}`}
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
        <SectionHeading hint="Choose the type of incident. This determines which details you are asked for.">
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
              Switching to {getSubjectLabel(pendingSubject)} starts the report over.
              Everything entered so far is cleared.
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
          Type:
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
  // Labels above each selector only earn their space when there is more than
  // one, otherwise the section heading has already said it.
  const rosterWays = roster
    ? [roster.pickEmployees, roster.pickStudents, roster.freeText].filter(Boolean).length
    : 0;

  const rosterSection = roster ? (
      <div>
        <SectionHeading block>
          {roster.label}
          {peopleRequired && <Req />}
        </SectionHeading>
        {/* Employees and students come out of the district's own lists, so a
            name on the incident is a record and not a guess at a spelling. The
            typed field is kept for the one person who cannot be in a list, the
            motorist or the parent the incident is actually about. */}
        <div
          className="grid grid-cols-1 gap-4"
          style={{ marginBottom: 'var(--forge-spacing-small)' }}
        >
          {roster.pickEmployees && (
            <div>
              {rosterWays > 1 && <label style={labelStyle}>Employee</label>}
              {/* @ts-ignore */}
              <forge-text-field>
                <forge-icon slot="start" name="search"></forge-icon>
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [id, ...rest] = e.target.value.split('|');
                    addPerson(rest.join('|'), id, 'employee');
                  }}
                  style={selectStyle}
                >
                  <option value="">Add an employee...</option>
                  {employeeOptions
                    .filter(e => !people.some(p => p.sourceId === e.id))
                    .map(e => (
                      <option key={e.id} value={`${e.id}|${e.fullName}`}>{e.fullName} ({e.jobRole})</option>
                    ))}
                </select>
              </forge-text-field>
            </div>
          )}

          {roster.pickStudents && (
            <div>
              {rosterWays > 1 && <label style={labelStyle}>Student</label>}
              <StudentSearch
                placeholder="Add a student..."
                taken={(id) => people.some(p => p.sourceId === id)}
                onPick={(id, name) => addPerson(name, id, 'student')}
              />
            </div>
          )}

          {roster.freeText && (
            <div>
              {rosterWays > 1 && <label style={labelStyle}>Someone outside the district</label>}
              <div className="flex" style={{ gap: 'var(--forge-spacing-small)' }}>
                <div style={{ flex: 1 }}>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input
                      value={personDraft}
                      onChange={(e) => setPersonDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addPerson(personDraft, undefined, 'outside'); }}
                      placeholder={roster.addPrompt}
                    />
                  </forge-text-field>
                </div>
                {/* @ts-ignore */}
                <forge-button variant="outlined" onClick={() => addPerson(personDraft, undefined, 'outside')}>Add</forge-button>
              </div>
            </div>
          )}
        </div>

        {people.length === 0 && (
          <p style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)', margin: 0 }}>
            No {roster.noun}s added yet.
          </p>
        )}

        {people.map((person, i) => {
          const open = expanded.has(person.id);
          const job = person.kind === 'employee'
            ? (employeeOptions.find(e => e.id === person.sourceId)?.jobRole ?? '')
            : '';
          // A student is identified by their id, an employee by what they do.
          // A person from outside the district has neither.
          const subline = person.kind === 'student' ? (person.sourceId ?? '') : job;
          return (
            <div
              key={person.id}
              style={{ border: '1px solid var(--forge-theme-outline-low)', borderRadius: 'var(--forge-shape-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}
            >
              <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)', padding: 'var(--forge-spacing-small)' }}>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--forge-theme-primary)', color: '#fff',
                  fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--forge-font-family)',
                }}>
                  {i + 1}
                </span>
                {/* @ts-ignore */}
                <forge-icon name="person" style={{ fontSize: '20px', color: 'var(--forge-theme-text-medium)', flexShrink: 0 }}></forge-icon>
                <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--forge-font-family)' }}>
                  <div style={{ fontWeight: 500 }}>{person.name}</div>
                  {subline && (
                    <div style={{ fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
                      {subline}
                    </div>
                  )}
                </div>
                {/* Only worth saying where the list holds more than one kind of
                    person. On a student or employee incident every row is the
                    same kind. */}
                {subject === 'thirdParty' && (
                  /* @ts-ignore */
                  <forge-badge theme="default">
                    {person.kind === 'employee' ? 'Employee' : person.kind === 'student' ? 'Student' : 'Outside the district'}
                  </forge-badge>
                )}
                {/* Collapsed, the badges are the only summary of what was set. */}
                {!open && person.role && <forge-badge theme="default">{person.role}</forge-badge>}
                {!open && person.severity && <forge-badge theme="info">{person.severity}</forge-badge>}
                {/* @ts-ignore */}
                <forge-icon-button aria-label={`Remove ${person.name}`} onClick={() => removePerson(person.id)}>
                  {/* @ts-ignore */}
                  <forge-icon name="close"></forge-icon>
                </forge-icon-button>
                {/* @ts-ignore */}
                <forge-icon-button aria-label={open ? `Collapse ${person.name}` : `Expand ${person.name}`} onClick={() => toggleExpanded(person.id)}>
                  {/* @ts-ignore */}
                  <forge-icon name={open ? 'chevron_up' : 'chevron_down'}></forge-icon>
                </forge-icon-button>
              </div>

              {open && (
                <div style={{ padding: '0 var(--forge-spacing-small) var(--forge-spacing-small)' }}>
            <div className="flex flex-col" style={{ gap: 'var(--forge-spacing-small)' }}>
              <div>
                <label style={labelStyle}>Role In Incident<Req /></label>
                <Segmented
                  ariaLabel="Role in incident"
                  options={ROLES}
                  value={person.role}
                  onChange={(v) => updatePerson(person.id, { role: v })}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Severity for this person
                  {!person.severity && (
                    <span style={{ fontWeight: 400, color: 'var(--forge-theme-text-medium)' }}>
                      {'  '}same as incident{severity ? ` (${severity})` : ''}
                    </span>
                  )}
                </label>
                <Segmented
                  ariaLabel="Severity for this person"
                  options={SEVERITIES}
                  value={person.severity}
                  onChange={(v) => updatePerson(person.id, { severity: v })}
                />
              </div>
            </div>
            {/* No per-person description. Decided with Jon on Aug 20 (#75):
                Additional Notes already covers what is specific to a person,
                so a second free-text field is not worth an
                IncidentEventStudent column. */}
            <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
              {/* @ts-ignore */}
              <forge-text-field float-label>
                <label slot="label">Action taken</label>

                <textarea rows={2} value={person.actionTaken} onChange={(e) => updatePerson(person.id, { actionTaken: e.target.value })} style={{ width: '100%', fontFamily: 'var(--forge-font-family)' }} />
              </forge-text-field>
            </div>
            {/* The detail page renders Additional Notes per person, and seeded
                incidents use it for coordinator context. Without an input here
                it could only ever appear on seeded data. */}
            <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
              {/* @ts-ignore */}
              <forge-text-field float-label>
                <label slot="label">Additional notes</label>

                <textarea rows={2} value={person.notes} onChange={(e) => updatePerson(person.id, { notes: e.target.value })} style={{ width: '100%', fontFamily: 'var(--forge-font-family)' }} />
              </forge-text-field>
            </div>
            {/* Last thing on the card, after everything it depends on. */}
            {(subject === 'student' || person.kind === 'student') && (
              <label
                className="flex items-center"
                style={{ gap: '6px', marginTop: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', cursor: 'pointer' }}
              >
                <input type="checkbox" checked={person.parentNotified} onChange={(e) => updatePerson(person.id, { parentNotified: e.target.checked })} />
                Parent notified
              </label>
            )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      ) : null;

  // Incident Type and Severity. Held here so the subjects with people to
  // name can place them between the roster and the per-person detail, and
  // the two without people can keep them in the packed run of fields.
  const typeField = (
        <>
          {/* @ts-ignore */}
          <forge-text-field required float-label>
            <label slot="label">Event</label>

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
                  // Every person named carries the event's severity too. Change
                  // one person's severity afterwards and it holds until the
                  // event changes again.
                  setPeople(ps => ps.map(x => ({ ...x, severity: picked.defaultSeverity })));
                }
              }}
              style={selectStyle}
            >
              <option value=""></option>
              {typeOptions.map(ty => (
                <option key={ty.id} value={ty.label} title={ty.description}>{ty.label}</option>
              ))}
            </select>
          </forge-text-field>
        </>
  );

  const severityField = (
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
  );

  // Involved Vehicles, the vehicle subject's answer to the roster. Same shape as
  // the people list on purpose: add as many as were in it, each row collapses to
  // a line, and expanding one opens its detail below the list.
  const vehicleRosterSection = subject === 'vehicle' ? (
    <div>
      <SectionHeading block>
        Involved Vehicles<Req />
      </SectionHeading>
      <div className="flex" style={{ gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-small)' }}>
        <div style={{ flex: 1 }}>
          {/* @ts-ignore */}
          <forge-text-field>
            <forge-icon slot="start" name="search"></forge-icon>
            <select
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                const [id, ...rest] = e.target.value.split('|');
                addVehicle(id, rest.join('|'));
              }}
              style={selectStyle}
            >
              <option value="">Search by vehicle number...</option>
              {mockVehicles
                .filter((v: any) => !involvedVehicles.some(iv => iv.sourceId === v.id))
                .map((v: any) => (
                  <option key={v.id} value={`${v.id}|${v.name}`}>
                    {v.name} ({v.id})
                  </option>
                ))}
            </select>
          </forge-text-field>
        </div>
      </div>

      {involvedVehicles.length === 0 && (
        <p style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)', margin: 0 }}>
          No vehicles added yet.
        </p>
      )}

      {involvedVehicles.map(v => (
        <div
          key={v.id}
          style={{ border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', borderRadius: 'var(--forge-shape-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}
        >
          <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)', padding: 'var(--forge-spacing-small)' }}>
            <button
              onClick={() => toggleExpanded(v.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, textAlign: 'left', fontFamily: 'var(--forge-font-family)' }}
            >
              <forge-icon name={expanded.has(v.id) ? 'expand_less' : 'expand_more'} style={{ fontSize: '18px' }}></forge-icon>
              <span style={{ fontWeight: 500 }}>{v.name}</span>
              {v.role && <forge-badge theme="default">{v.role}</forge-badge>}
              {v.damage && <forge-badge theme={v.damage === 'Severe' ? 'error' : v.damage === 'None' ? 'info' : 'warning'}>{v.damage} damage</forge-badge>}
              {v.driver && (
                <span style={{ fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)' }}>
                  {v.driver}
                </span>
              )}
            </button>
            {/* @ts-ignore */}
            <forge-button variant="flat" onClick={() => removeVehicle(v.id)}>Remove</forge-button>
          </div>
        </div>
      ))}
    </div>
  ) : null;

  // Per-vehicle detail, below the list, matching how per-person detail works.
  const vehicleDetailsSection =
    subject === 'vehicle' && involvedVehicles.some(v => expanded.has(v.id)) ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-small)' }}>
        {involvedVehicles.filter(v => expanded.has(v.id)).map(v => (
          <div
            key={v.id}
            style={{ border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', borderRadius: 'var(--forge-shape-medium)', padding: 'var(--forge-spacing-small)' }}
          >
            <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)', marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)' }}>
              <span style={{ fontWeight: 500 }}>{v.name}</span>
              {/* @ts-ignore */}
              <forge-button variant="flat" onClick={() => toggleExpanded(v.id)}>Collapse</forge-button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                {/* @ts-ignore */}
                <forge-text-field float-label>
                  <label slot="label">Part in the incident</label>

                  <select value={v.role} onChange={(e) => updateVehicle(v.id, { role: e.target.value })} style={selectStyle}>
                    <option value=""></option>
                    {VEHICLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </forge-text-field>
              </div>
              <div>
                {/* @ts-ignore */}
                <forge-text-field float-label>
                  <label slot="label">Driver</label>

                  <select value={v.driver} onChange={(e) => updateVehicle(v.id, { driver: e.target.value })} style={selectStyle}>
                    <option value=""></option>
                    {mockDrivers
                      .filter(d => d.status === 'Active')
                      .sort((a, b) => a.fullName.localeCompare(b.fullName))
                      .map(d => <option key={d.id} value={d.fullName}>{d.fullName}</option>)}
                  </select>
                </forge-text-field>
              </div>
              <div>
                {/* @ts-ignore */}
                <forge-text-field float-label>
                  <label slot="label">Damage</label>

                  <select value={v.damage} onChange={(e) => updateVehicle(v.id, { damage: e.target.value })} style={selectStyle}>
                    <option value=""></option>
                    {VEHICLE_DAMAGE_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </forge-text-field>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4" style={{ marginTop: 'var(--forge-spacing-small)' }}>
              <div>
                {/* @ts-ignore */}
                <forge-text-field float-label>
                  <label slot="label">Notes for this vehicle</label>

                  <textarea rows={2} value={v.notes} onChange={(e) => updateVehicle(v.id, { notes: e.target.value })} style={{ width: '100%', fontFamily: 'var(--forge-font-family)' }} />
                </forge-text-field>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : null;

  // Both the people subjects and the vehicle subject now lead with a list, so
  // Incident Type and Severity sit above it. Location is the only subject left
  // that keeps them in the packed run of fields.
  // Which district buses this incident names. A vehicle incident names them in
  // the Involved Vehicles list, and an employee or third party incident names
  // the one bus in Vehicle Number.
  const busesNamed = subject === 'vehicle'
    ? involvedVehicles.map(v => v.name)
    : vehicleNumber ? [vehicleNumber] : [];

  // Students on board. Shown wherever a district bus is named and the children
  // are not already the subject: a student incident lists them in its own
  // roster, and a location incident never has a bus.
  const showStudentsAboard = subject !== 'student' && subject !== 'location' && busesNamed.length > 0;

  const addStudentAboard = (sourceId: string, name: string) => {
    setStudentsAboard(list => [...list, {
      id: `sa-${sourceId}-${list.length}`,
      sourceId,
      name,
      bus: busesNamed.length === 1 ? busesNamed[0] : '',
      condition: '',
    }]);
  };
  const updateStudentAboard = (id: string, patch: Partial<StudentAboard>) =>
    setStudentsAboard(list => list.map(x => (x.id === id ? { ...x, ...patch } : x)));
  const removeStudentAboard = (id: string) =>
    setStudentsAboard(list => list.filter(x => x.id !== id));

  const studentsAboardSection = showStudentsAboard ? (
    <div>
      <SectionHeading block hint="Every child who was on board. Adding anyone here puts parent notification on the workflow.">
        Students On Board
      </SectionHeading>
      <div style={{ marginBottom: 'var(--forge-spacing-small)' }}>
        <StudentSearch
          placeholder="Add a student..."
          taken={(id) => studentsAboard.some(sa => sa.sourceId === id)}
          onPick={(id, name) => addStudentAboard(id, name)}
        />
      </div>

      {studentsAboard.length === 0 && (
        <p style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)', margin: 0 }}>
          No students on board.
        </p>
      )}

      {/* One line per child: who, which bus where that is a question, and what
          condition they were in. The condition sits beside the name rather than
          under it, because a coordinator reads down a column of children and
          their conditions, not down a stack of cards. */}
      {studentsAboard.map(sa => (
        <div
          key={sa.id}
          className="flex items-center"
          style={{ border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', borderRadius: 'var(--forge-shape-medium)', padding: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-xsmall)', gap: 'var(--forge-spacing-small)', flexWrap: 'wrap' }}
        >
          <span style={{ fontFamily: 'var(--forge-font-family)', fontWeight: 500, flex: 1, minWidth: '160px' }}>{sa.name}</span>

          {/* Asked only when there is a choice to make. One bus named means the
              child was on that bus. */}
          {busesNamed.length > 1 && (
            <div style={{ width: '180px' }}>
              {/* @ts-ignore */}
              <forge-text-field>
                <select value={sa.bus} onChange={(e) => updateStudentAboard(sa.id, { bus: e.target.value })} style={selectStyle}>
                  <option value="">Bus...</option>
                  {busesNamed.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </forge-text-field>
            </div>
          )}

          <div style={{ width: '230px' }}>
            {/* @ts-ignore */}
            <forge-text-field>
              <select value={sa.condition} onChange={(e) => updateStudentAboard(sa.id, { condition: e.target.value })} style={selectStyle}>
                <option value="">Condition...</option>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </forge-text-field>
          </div>

          {/* @ts-ignore */}
          <forge-button variant="flat" onClick={() => removeStudentAboard(sa.id)}>Remove</forge-button>
        </div>
      ))}
    </div>
  ) : null;

  const hasPartyList = !!roster || subject === 'vehicle';

  const detailsStep = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>

      {/* One continuous set of fields, sequenced who, then what, then when and
          where. The order is about the order a reporter thinks in, not about
          carving the form into labelled sections, so there are no section
          headings: what happened leads, then who it was about, then the
          operational context.

          A field the subject does not need is not rendered and the ones after it
          close up, so the grid is always fully packed. */}

      {/* Incident Type and Severity lead, because what happened frames every
          answer after it, and because a person's severity offers "same as
          incident", which means nothing until the incident's own severity is
          set. On Vehicle and Location there is nobody to name, so both stay in
          the run of fields below rather than opening the form. */}
      {hasPartyList && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>{typeField}</div>
          <div className="sm:col-span-2">{severityField}</div>
        </div>
      )}

      {rosterSection}

      {vehicleRosterSection}

      {vehicleDetailsSection}

      {studentsAboardSection}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          // WHO, on Location, the one subject with neither people nor vehicles
          // to name. The lists above are the same slot for the other four.
          assetKind === 'location' && {
            key: 'asset',
            node: (
              <>
                {/* @ts-ignore */}
                <forge-text-field required float-label>
                  <label slot="label">Affected Location</label>

                  <select value={assetRef} onChange={(e) => setAssetRef(e.target.value)} style={selectStyle}>
                    <option value=""></option>
                    {mockLocations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </forge-text-field>
              </>
            ),
          },

          // WHAT. Only here on Location, which has no list to sit above it.
          // See typeField and severityField.
          !hasPartyList && { key: 'type', node: typeField },
          !hasPartyList && { key: 'severity', spanTwo: true, node: severityField },
          {
            key: 'description',
            // Spans the row in place rather than sitting in its own block, so it
            // stays in sequence without breaking the flow into sections.
            span: true,
            node: (
              <>
                {/* @ts-ignore */}
                <forge-text-field required float-label>
                  <label slot="label">Incident Description</label>

                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}

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
                {/* @ts-ignore */}
                <forge-text-field required float-label>
                  <label slot="label">Date</label>

                  <input type="date" max={new Date().toISOString().slice(0, 10)} value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
                </forge-text-field>
              </>
            ),
          },
          {
            key: 'time',
            node: (
              <>
                {/* @ts-ignore */}
                <forge-text-field required float-label>
                  <label slot="label">Time</label>

                  <input type="time" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} />
                </forge-text-field>
              </>
            ),
          },
          {
            key: 'locationType',
            node: (
              <>
                {/* @ts-ignore */}
                <forge-text-field required float-label>
                  <label slot="label">Location Type</label>

                  <select value={locationType} onChange={(e) => setLocationType(e.target.value)} style={selectStyle}>
                    <option value=""></option>
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
                {/* @ts-ignore */}
                <forge-text-field float-label>
                  <label slot="label">Vehicle Number</label>

                  <select value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} style={selectStyle}>
                    <option value=""></option>
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
                {/* @ts-ignore */}
                <forge-text-field float-label>
                  <label slot="label">Driver</label>

                  <select value={driver} onChange={(e) => setDriver(e.target.value)} style={selectStyle}>
                    <option value=""></option>
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
                {/* @ts-ignore */}
                <forge-text-field float-label>
                  <label slot="label">Run</label>

                  <select value={run} onChange={(e) => setRun(e.target.value)} style={selectStyle}>
                    <option value=""></option>
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

        {/* Witnesses and third parties share a row, and the fields for whichever
            one you turn on appear directly beneath that row. They used to sit in
            a three-across row with tags, which pushed their fields below
            Assigned To, so turning on witnesses made fields appear a long way
            from the thing that asked for them. */}
        <label
          className="flex items-center"
          style={{ gap: '6px', marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={witnessPresent}
            onChange={(e) => {
              const on = e.target.checked;
              setWitnessPresent(on);
              if (on && witnesses.length === 0) {
                setWitnesses([emptyContact()]);
                setWitnessEditing([true]);
              }
            }}
          />
          Witness(es) present
        </label>

        {witnessPresent && (
          <ContactList
            contacts={witnesses}
            setContacts={setWitnesses}
            editing={witnessEditing}
            setEditing={setWitnessEditing}
            noun="Witness"
            addLabel="Add witness"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start" style={{ marginBottom: 'var(--forge-spacing-small)' }}>
          <div>
              <SectionHeading block>Tags</SectionHeading>
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

          {/* Assignment in two parts. The role is what the workflow decides and
              can be redirected. Naming a person is the override: several people
              hold a role, so a role on its own does not name anybody. */}
          <div>
            {/* @ts-ignore */}
            <forge-text-field float-label>
              <label slot="label">Assigned To</label>

              <select
                value={assigneeRole}
                onChange={(e) => { setAssigneeRole(e.target.value); setAssignee(''); }}
                style={selectStyle}
              >
                <option value=""></option>
                {Object.keys(ROLE_HOLDERS).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </forge-text-field>
            <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)', marginTop: '4px' }}>
              {assigneeRole
                ? 'Sends this incident to ' + assigneeRole + ' instead of the workflow.'
                : routed
                  ? 'Follows the ' + routed.workflow + ' workflow.'
                  : 'Set by the workflow once incident type and severity are chosen.'}
            </div>
          </div>

          <div>
            {/* @ts-ignore */}
            <forge-text-field float-label>
              <label slot="label">Assign to a specific employee</label>

              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                style={selectStyle}
                disabled={effectiveAssigneeRole === ''}
              >
                <option value=""></option>
                {holdersOfRole(effectiveAssigneeRole).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </forge-text-field>
            <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-theme-text-medium)', marginTop: '4px' }}>
              {assignee
                ? assignee + ' owns this incident, whatever the workflow would have done.'
                : effectiveAssigneeRole
                  ? holdersOfRole(effectiveAssigneeRole).length + ' people hold ' + effectiveAssigneeRole + '. Optional, and only for this incident.'
                  : 'Available once the incident type and severity pick a workflow.'}
            </div>
          </div>
        </div>


        {/* Both uploads share a row, since each is only a button until
            something is attached. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginTop: 'var(--forge-spacing-medium)' }}>
          <div>
            <SectionHeading block>Photo Evidence</SectionHeading>
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
            <SectionHeading block>Document Evidence</SectionHeading>
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
    ['Type', getSubjectLabel(subject)],
    ['Event', incidentType || '-'],
    ['Date', incidentDate || '-'],
    ['Time', incidentTime || '-'],
    ['Severity', severity || '-'],
    ['Location Type', locationType || '-'],
    ...(assetKind === 'location' ? [['Affected Location', assetRef || '-'] as [string, string]] : []),
    // Every vehicle named, each with its driver and what it came away with, so
    // a two bus collision reviews as two lines rather than collapsing to one.
    ...(subject === 'vehicle'
      ? [[
          involvedVehicles.length === 1 ? 'Involved Vehicle' : 'Involved Vehicles',
          involvedVehicles.length
            ? involvedVehicles
                .map(v => {
                  const bits = [v.role, v.driver || 'no driver', v.damage ? `${v.damage.toLowerCase()} damage` : null]
                    .filter(Boolean)
                    .join(', ');
                  return bits ? `${v.name} (${bits})` : v.name;
                })
                .join('  |  ')
            : '-',
        ] as [string, string]]
      : []),
    ...(subjectHasField(subject, 'vehicleNumber') ? [['Vehicle Number', vehicleNumber || '-'] as [string, string]] : []),
    ...(subjectHasField(subject, 'driver') ? [['Driver', driver || '-'] as [string, string]] : []),
    ...(subjectHasField(subject, 'run') ? [['Run', run || '-'] as [string, string]] : []),
    ...(roster ? [[roster.label, people.length ? people.map(p => p.name).join(', ') : '-'] as [string, string]] : []),
    ...(showStudentsAboard
      ? [[
          'Students On Board',
          studentsAboard.length
            ? studentsAboard
                .map(sa => {
                  const bits = [busesNamed.length > 1 ? sa.bus : null, sa.condition ? sa.condition.toLowerCase() : null]
                    .filter(Boolean)
                    .join(', ');
                  return bits ? `${sa.name} (${bits})` : sa.name;
                })
                .join('  |  ')
            : 'None',
        ] as [string, string]]
      : []),
    ['Witnesses', witnesses.filter(w => w.name.trim() || w.description.trim()).map(w => w.name.trim() || w.description.trim()).join(', ') || '-'],
    ['Tags', tags.join(', ') || '-'],
    ['Workflow', routed ? routed.workflow : 'None matches this type and severity'],
    // Unassigned is a real outcome per #197: a workflow with no owner creates
    // the incident unassigned and it lands in the triage queue.
    ['Assigned to', assignee
      ? `${assignee}${effectiveAssigneeRole ? ` (${effectiveAssigneeRole})` : ''}, chosen on this incident`
      : assigneeRole
        ? `${assigneeRole}, chosen on this incident`
        : routed
          ? (routed.owner
              ? `${routed.owner}${routed.ownerRole ? ` (${routed.ownerRole})` : ''}`
              : routed.ownerRole
                ? `${routed.ownerRole}, whoever holds it`
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
                : vehiclesRequired && involvedVehicles.length === 0
                  ? 'Add at least one vehicle to continue'
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
