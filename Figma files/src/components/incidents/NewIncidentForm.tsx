import { useState, useRef, useEffect } from 'react';
import { ForgeCard, ForgeButton } from '@tylertech/forge-react';
import { defineCardComponent, defineButtonComponent, defineTextFieldComponent, defineStepperComponent, defineIconComponent, defineDatePickerComponent, defineTimePickerComponent } from '@tylertech/forge';
defineCardComponent();
defineButtonComponent();
defineTextFieldComponent();
defineStepperComponent();
defineIconComponent();
// Registered and available if we swap the native date/time inputs for the real
// Forge pickers. Forge has no combined date-time component, only these two.
defineDatePickerComponent();
defineTimePickerComponent();
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import {
  AlertCircle, Send, Circle, CheckCircle2, Upload, X,
  Image as ImageIcon, FileText, Users, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus,
} from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import {
  INCIDENT_TYPES,
  INCIDENT_SUBJECTS,
  getIncidentTypesForCategory,
  getSubjectLabel,
  getSubjectMeta,
  subjectRequiresParties,
  emptyContact,
  normalizeContacts,
  type IncidentSubject,
  type PersonContact,
} from './IncidentTypes';
import { mockLocations } from './IncidentsPage';
import { mockVehicles } from '../vehicles/VehiclesPage';
import { IncidentLocationMap } from './IncidentLocationMap';
import { mockDrivers } from '../drivers/DriversPage';
import { mockIncidents } from './IncidentsPage';

const mockStudents = [
  { id: 'STU-2891', name: 'Sarah Mitchell', grade: '9th Grade', school: 'Lincoln Middle School', photoUrl: 'https://images.unsplash.com/photo-1729283098418-e2c849b4e2cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwZ2lybCUyMHBhc3Nwb3J0JTIwcGhvdG8lMjAxNCUyMHllYXIlMjBvbGR8ZW58MXx8fHwxNzY5NTI3Mjc4fDA&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-12', route: 'lincoln-elem-am-green' },
  { id: 'STU-3421', name: 'Marcus Johnson', grade: '10th Grade', school: 'Washington High School', photoUrl: 'https://images.unsplash.com/photo-1696219448339-ce614b610462?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwYm95JTIwcGFzc3BvcnQlMjBwaG90byUyMDE1JTIweWVhciUyMG9sZHxlbnwxfHx8fDE3Njk1MjcyNzl8MA&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-15', route: 'washington-high-pm-wolf' },
  { id: 'STU-1956', name: 'Emma Rodriguez', grade: '8th Grade', school: 'Jefferson Middle School', photoUrl: 'https://images.unsplash.com/photo-1663550910672-6cf9177ef89d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwZ2lybCUyMHBhc3Nwb3J0JTIwcGhvdG8lMjAxMyUyMHllYXIlMjBvbGQlMjBoaXNwYW5pY3xlbnwxfHx8fDE3Njk1MjcyNzl8MA&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-22', route: 'jefferson-middle-am-blue' },
  { id: 'STU-4782', name: 'James Thompson', grade: '9th Grade', school: 'Roosevelt High School', photoUrl: 'https://images.unsplash.com/photo-1696219448339-ce614b610462?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwYm95JTIwcGFzc3BvcnQlMjBwaG90byUyMDE1JTIweWVhciUyMG9sZHxlbnwxfHx8fDE3Njk1MjcyNzl8MA&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-31', route: 'roosevelt-high-pm-red' },
  { id: 'STU-5623', name: 'Olivia Davis', grade: '11th Grade', school: 'Washington High School', photoUrl: 'https://images.unsplash.com/photo-1630003941615-db6a06990434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwZ2lybCUyMHBhc3Nwb3J0JTIwcGhvdG8lMjAxNyUyMHllYXIlMjBvbGR8ZW58MXx8fHwxNzY5NTI3Mjc5fDA&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-8', route: 'washington-high-pm-wolf' },
  { id: 'STU-6891', name: 'Noah Wilson', grade: '7th Grade', school: 'Lincoln Middle School', photoUrl: 'https://images.unsplash.com/photo-1619362405573-7aeaf09ac89f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwYm95JTIwcGFzc3BvcnQlMjBwaG90byUyMDEzJTIweWVhciUyMG9sZHxlbnwxfHx8fDE3Njk1MjcyODB8MA&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-12', route: 'lincoln-elem-am-green' },
  { id: 'STU-7234', name: 'Sophia Garcia', grade: '5th Grade', school: 'Lincoln Elementary', photoUrl: 'https://images.unsplash.com/photo-1729283098418-e2c849b4e2cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZCUyMGdpcmwlMjBwYXNzcG9ydCUyMHBob3RvJTIwMTAlMjB5ZWFyJTIwb2xkfGVufDF8fHx8MTc2OTUyNzI4MHww&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-9', route: 'lincoln-elem-am-green' },
  { id: 'STU-8512', name: 'Liam Brown', grade: '7th Grade', school: 'Lincoln Middle School', photoUrl: 'https://images.unsplash.com/photo-1619362405573-7aeaf09ac89f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwYm95JTIwcGFzc3BvcnQlMjBwaG90byUyMDEyJTIweWVhciUyMG9sZHxlbnwxfHx8fDE3Njk1MjcyODF8MA&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-12', route: 'lincoln-elem-am-green' },
  { id: 'STU-9123', name: 'Ava Martinez', grade: '6th Grade', school: 'Jefferson Middle School', photoUrl: 'https://images.unsplash.com/photo-1630005500468-3dbe2aeb0b03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwZ2lybCUyMHBhc3Nwb3J0JTIwcGhvdG8lMjAxMSUyMHllYXIlMjBvbGQlMjBoaXNwYW5pY3xlbnwxfHx8fDE3Njk1MjcyODF8MA&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-22', route: 'jefferson-middle-am-blue' },
  { id: 'STU-1045', name: 'Ethan Lee', grade: '9th Grade', school: 'Washington High School', photoUrl: 'https://images.unsplash.com/photo-1655487420177-54b4d969c5a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwYm95JTIwcGFzc3BvcnQlMjBwaG90byUyMDE0JTIweWVhciUyMG9sZCUyMGFzaWFufGVufDF8fHx8MTc2OTUyNzI4MXww&ixlib=rb-4.1.0&q=80&w=1080', bus: 'bus-8', route: 'washington-high-pm-wolf' },
];


type Student = typeof mockStudents[0];
interface PerStudentData {
  role: 'instigator' | 'participant' | 'victim' | 'bystander' | '';
  severityOverride: 'shared' | 'low' | 'medium' | 'high' | 'critical';
  incidentTypeOverride: string;
  parentNotified: boolean;
  description: string;
  actionTaken: string;
  notes: string;
}

interface SharedFormData {
  // When the incident actually happened, which is not when it gets filed.
  // Reports routinely come in at the end of a run or the next morning, so this
  // is entered by the reporter rather than stamped from the clock.
  incidentDate: string;
  incidentTime: string;
  incidentType: string;
  severity: string;
  description: string;
  location: string;
  bus: string;
  route: string;
  driver: string;
  witnessPresent: boolean;
  witnesses: PersonContact[];
  // Someone outside the district who was involved or present. Distinct from the
  // thirdParty SUBJECT: the subject says what the incident is fundamentally
  // about, while these are outside people present on an incident of any subject,
  // such as a parent who intervened during a student incident.
  thirdPartyPresent: boolean;
  thirdParties: PersonContact[];
  tags: string[];
}


interface NewIncidentFormProps {
  onNavigate: (page: string) => void;
}

// Steps are identified by a stable key rather than a position, because the step
// count varies by subject. A location incident has no people to name, so its
// "Incident Details" step is step 1, where a student incident's is step 2.
// Gating render on the key keeps both correct without duplicating the markup.
type StepKey = 'parties' | 'details' | 'perParty' | 'review';

const STEP_DEFS: Record<IncidentSubject, Array<{ key: StepKey; label: string }>> = {
  student: [
    { key: 'parties', label: 'Involved Students' },
    { key: 'details', label: 'Incident Details' },
    { key: 'perParty', label: 'Per-Student Details' },
    { key: 'review', label: 'Review & Submit' },
  ],
  employee: [
    { key: 'parties', label: 'Involved Employees' },
    { key: 'details', label: 'Incident Details' },
    { key: 'perParty', label: 'Per-Person Details' },
    { key: 'review', label: 'Review & Submit' },
  ],
  thirdParty: [
    { key: 'parties', label: 'Involved People' },
    { key: 'details', label: 'Incident Details' },
    { key: 'perParty', label: 'Per-Person Details' },
    { key: 'review', label: 'Review & Submit' },
  ],
  // No people to name, so the roster and per-person steps drop out entirely.
  vehicle: [
    { key: 'details', label: 'Incident Details' },
    { key: 'review', label: 'Review & Submit' },
  ],
  location: [
    { key: 'details', label: 'Incident Details' },
    { key: 'review', label: 'Review & Submit' },
  ],
};

// A non-student person on an incident: an employee picked from the driver roster,
// or a free-text third party such as another motorist or a parent.
interface Party {
  id: string;
  partyType: 'employee' | 'thirdParty';
  partyId?: string;
  name: string;
  role: string;
  severityOverride: string;
  description: string;
  actionTaken: string;
  notes: string;
}

const PARTY_ROLES = ['Participant', 'Witness', 'Reporter', 'Injured'];

// Tyler Forge icon names, registered in AppLayout's IconRegistry.define call.
// Rendered monotone in the brand blue rather than one hue per subject, so the
// cards read as one set of options instead of five unrelated categories.
const SUBJECT_ICONS: Record<IncidentSubject, string> = {
  student: 'school',
  vehicle: 'directions_bus',
  location: 'warehouse',
  thirdParty: 'public',
  employee: 'badge',
};

const LOCATION_OPTIONS = [
  { category: 'ON ROUTE', items: [
    { value: 'on-bus', label: 'On Vehicle' },
    { value: 'bus-stop', label: 'At Vehicle Stop' },
    { value: 'loading', label: 'Loading/Unloading' },
  ]},
  { category: 'SCHOOL/LOCATION', items: [
    { value: 'school-campus', label: 'School Campus' },
    { value: 'parking-lot', label: 'Parking Lot' },
    { value: 'layover-location', label: 'Layover Location' },
  ]},
  { category: 'OTHER', items: [{ value: 'other', label: 'Other' }] },
];

const ROUTE_LABELS: Record<string, string> = {
  'colonie-high-am-purple': 'Colonie High AM - Purple',
  'jefferson-middle-am-blue': 'Jefferson Middle AM - Blue',
  'lincoln-elem-am-green': 'Lincoln Elementary AM - Green',
  'meyers-middle-am-yellow': 'Meyers Middle AM - Yellow',
  'roosevelt-high-pm-red': 'Roosevelt High PM - Red',
  'washington-high-pm-wolf': 'Washington High PM - Wolf Rd',
};

const DRIVER_LOCATION_OPTIONS = [
  ...LOCATION_OPTIONS.slice(0, 1),
  // Named for its contents rather than 'LOCATION', which would sit confusingly
  // beside the SCHOOL/LOCATION group now that the subject is called Location.
  // These category strings group the source only; the picker renders flat.
  { category: 'GARAGE/DEPOT', items: [
    { value: 'garage', label: 'Garage' },
    { value: 'yard', label: 'Yard' },
    { value: 'maintenance-bay', label: 'Maintenance Bay' },
    { value: 'fuel-station', label: 'Fuel Station' },
    { value: 'wash-bay', label: 'Wash Bay' },
  ]},
  ...LOCATION_OPTIONS.slice(1),
];

// One contact per person: who they were and how to reach them. Used for both
// witnesses and third parties, which capture the same thing (who else was
// there) and so should look and behave identically.
function PersonContactFields({
  people,
  onChange,
  personLabel = 'Witness',
  addLabel = 'Add Witness',
  removeLabel = 'Remove witness',
}: {
  people: PersonContact[];
  onChange: (people: PersonContact[]) => void;
  personLabel?: string;
  addLabel?: string;
  removeLabel?: string;
}) {
  const update = (idx: number, field: keyof PersonContact, value: string) => {
    const next = people.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
    onChange(next);
  };

  const fieldStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #C5D2E8',
    borderRadius: '4px',
    background: '#fff',
    outline: 'none',
    fontFamily: 'Roboto, sans-serif',
    fontSize: 'var(--text-sm)',
  } as const;

  const microLabel = {
    fontFamily: 'Roboto, sans-serif',
    fontSize: '11px',
    color: 'var(--forge-theme-text-medium)',
    marginBottom: 2,
    display: 'block',
  } as const;

  return (
    <div>
      {people.length > 0 && (
        <div className="space-y-3 mb-3">
          {people.map((p, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #C5D2E8',
                borderRadius: '6px',
                padding: '10px 12px',
                background: '#fff',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--forge-theme-text-medium)' }}>
                  {personLabel} {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(people.filter((_, i) => i !== idx))}
                  aria-label={removeLabel}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--forge-theme-text-medium)', lineHeight: 1 }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-2">
                <label style={microLabel}>Name</label>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => update(idx, 'name', e.target.value)}
                  placeholder="Full name"
                  style={fieldStyle}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label style={microLabel}>Phone</label>
                  <input
                    type="tel"
                    value={p.phone}
                    onChange={(e) => update(idx, 'phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label style={microLabel}>Email</label>
                  <input
                    type="email"
                    value={p.email}
                    onChange={(e) => update(idx, 'email', e.target.value)}
                    placeholder="name@example.com"
                    style={fieldStyle}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange([...people, emptyContact()])}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 20px', borderRadius: '6px',
          border: '1px solid #4A6FA5', background: '#fff',
          fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)',
          color: '#4A6FA5', fontWeight: 500, cursor: 'pointer',
        }}
      >
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}

function TagFields({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {tags.map((tag, idx) => (
            <div key={idx} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '999px',
              background: '#EEF2F9', border: '1px solid #C5D2E8',
              fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: '#4A6FA5',
            }}>
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((_, i) => i !== idx))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#4A6FA5' }}
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1px solid ${focused ? '#4A6FA5' : '#C5D2E8'}`,
        borderRadius: '6px', padding: '8px 12px', background: '#fff',
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (inputValue.trim()) addTag(inputValue); }}
          placeholder="Type a tag and press Enter..."
          style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', background: 'transparent' }}
        />
      </div>
      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', color: 'var(--forge-theme-text-medium)', marginTop: '4px' }}>
        Press Enter or comma to add a tag
      </div>
    </div>
  );
}

export function NewIncidentForm({ onNavigate }: NewIncidentFormProps) {
  // null until the reporter picks a subject
  const [incidentCategory, setIncidentCategory] = useState<IncidentSubject | null>(null);
  // Whether the chooser is on screen. Deliberately separate from
  // incidentCategory: going back to the chooser must NOT clear the current
  // subject, otherwise re-picking the same one looks like a no-op to the
  // reporter but silently wipes what they had already entered.
  const [showChooser, setShowChooser] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  // Steps for the chosen subject. Empty while the chooser is up, which makes
  // every step gate below false and leaves only the chooser rendered.
  const steps = incidentCategory && !showChooser ? STEP_DEFS[incidentCategory] : [];
  const stepKey = steps[currentStep - 1]?.key;
  const isLastStep = currentStep >= steps.length;

  const goNext = () => setCurrentStep(s => Math.min(s + 1, steps.length));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 1));
  const goToStep = (key: StepKey) => {
    const idx = steps.findIndex(s => s.key === key);
    if (idx >= 0) setCurrentStep(idx + 1);
  };

  const chooseSubject = (subject: IncidentSubject) => {
    // Re-picking the current subject is a pure cancel: keep everything.
    if (subject === incidentCategory) {
      setShowChooser(false);
      return;
    }
    setIncidentCategory(subject);
    setShowChooser(false);
    setCurrentStep(1);
    // Switching to a DIFFERENT subject invalidates the subject-specific answers,
    // because the incident types, the people, and the asset all differ per
    // subject. Shared answers (date, time, description, location, evidence) are
    // deliberately kept.
    setInvolvedStudents([]);
    setPerStudentData({});
    setExpandedStudents(new Set());
    setInvolvedParties([]);
    setSharedData(prev => ({ ...prev, incidentType: '', severity: '' }));
    setAssetRef('');
  };

  // Step 1: involved students
  const [involvedStudents, setInvolvedStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const studentSearchRef = useRef<HTMLDivElement>(null);
  const studentInputRef = useRef<HTMLInputElement>(null);

  // Step 2: shared incident data
  const [sharedData, setSharedData] = useState<SharedFormData>({
    // Date defaults to today, since most reports are filed the same day. Time is
    // deliberately left blank rather than defaulted, so the reporter states when
    // it happened instead of accepting a clock reading they never looked at. A
    // prefilled clock time on a report filed the next morning is wrong data that
    // passes validation, which is worse than no value at all.
    incidentDate: new Date().toISOString().slice(0, 10),
    incidentTime: '',
    incidentType: '', severity: '', description: '', location: '',
    bus: '', route: '', driver: '',
    witnessPresent: false, witnesses: [],
    thirdPartyPresent: false, thirdParties: [],
    tags: [],
  });
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; name: string; url: string; size: string }>>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ id: string; name: string; size: string; type: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Step 3: per-student data
  const [perStudentData, setPerStudentData] = useState<Record<string, PerStudentData>>({});
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  // Non-student subjects: the people involved (employee and thirdParty), and the
  // affected location or vehicle (location and vehicle, which have no people).

  const [involvedParties, setInvolvedParties] = useState<Party[]>([]);
  const [newPartyName, setNewPartyName] = useState('');
  const [assetRef, setAssetRef] = useState('');

  const addParty = (partyType: 'employee' | 'thirdParty', name: string, partyId?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (involvedParties.some(p => p.name === trimmed)) return;
    setInvolvedParties(prev => [...prev, {
      id: `party-${prev.length}-${trimmed}`,
      partyType,
      partyId,
      name: trimmed,
      role: 'Participant',
      severityOverride: 'shared',
      description: '',
      actionTaken: '',
      notes: '',
    }]);
    setNewPartyName('');
  };

  const removeParty = (id: string) => setInvolvedParties(prev => prev.filter(p => p.id !== id));

  const updateParty = (id: string, field: keyof Party, value: string) =>
    setInvolvedParties(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (studentSearchRef.current && !studentSearchRef.current.contains(e.target as Node)) setStudentSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const addStudent = (student: Student) => {
    if (!involvedStudents.find(s => s.id === student.id)) {
      setInvolvedStudents(prev => [...prev, student]);
      setPerStudentData(prev => ({
        ...prev,
        [student.id]: { role: 'participant', severityOverride: 'shared', incidentTypeOverride: '', parentNotified: false, description: '', actionTaken: '', notes: '' },
      }));
      setExpandedStudents(prev => new Set([...prev, student.id]));
    }
    setStudentSearch('');
    setStudentSearchOpen(false);
    studentInputRef.current?.blur();
  };

  const removeStudent = (studentId: string) => {
    setInvolvedStudents(prev => prev.filter(s => s.id !== studentId));
    setPerStudentData(prev => { const n = { ...prev }; delete n[studentId]; return n; });
    setExpandedStudents(prev => { const n = new Set(prev); n.delete(studentId); return n; });
  };

  const updatePerStudent = (studentId: string, field: keyof PerStudentData, value: string | boolean) => {
    setPerStudentData(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).map((f, i) => ({
      id: `${Date.now()}-${i}`, name: f.name, url: URL.createObjectURL(f),
      size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(2)} MB` : `${(f.size / 1024).toFixed(1)} KB`,
    }));
    setUploadedPhotos(p => [...p, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newDocs = Array.from(files).map((f, i) => ({
      id: `${Date.now()}-${i}`, name: f.name, type: f.type,
      size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(2)} MB` : `${(f.size / 1024).toFixed(1)} KB`,
    }));
    setUploadedDocuments(d => [...d, ...newDocs]);
    if (documentInputRef.current) documentInputRef.current.value = '';
  };

  const handleStudentSubmit = () => {
    const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
    const typeLabel = getIncidentTypeLabel(sharedData.incidentType);
    const sharedSeverity = cap(sharedData.severity);
    const today = new Date().toISOString().slice(0, 10);
    const createdBy = sharedData.driver || 'Current User';
    // The occurrence date and time come from the reporter. `today` is only the
    // filing stamp, kept separately so the two are never conflated.
    const occurredDate = sharedData.incidentDate || today;

    const subject: IncidentSubject = incidentCategory ?? 'student';
    const isStudent = subject === 'student';

    // Build the per-party records for non-student incidents. Deliberately the
    // same shape as involvedStudents so the detail page renders both with one
    // pattern.
    const parties = involvedParties.map(p => ({
      partyType: p.partyType,
      ...(p.partyId ? { partyId: p.partyId } : {}),
      name: p.name,
      role: p.role,
      severity: p.severityOverride !== 'shared' ? p.severityOverride : sharedSeverity,
      description: p.description || '',
      actionTaken: p.actionTaken || '',
      notes: p.notes || '',
    }));

    // Build the per-student records (role / severity / type override / notes)
    const involved = involvedStudents.map(stu => {
      const d = perStudentData[stu.id] || ({} as PerStudentData);
      const sev = d.severityOverride && d.severityOverride !== 'shared' ? cap(d.severityOverride) : sharedSeverity;
      const typeOv = d.incidentTypeOverride ? getIncidentTypeLabel(d.incidentTypeOverride) : '';
      return {
        studentId: stu.id,
        name: stu.name,
        role: cap(d.role || 'participant'),
        severity: sev,
        parentNotified: !!d.parentNotified,
        description: d.description || '',
        actionTaken: d.actionTaken || '',
        notes: d.notes || '',
        ...(typeOv ? { incidentTypeOverride: typeOv } : {}),
        ...(d.role === 'bystander' ? { noWorkflow: true } : {}),
      };
    });

    // Next sequential incident ID (INC-YYYY-NNNN)
    const maxNum = mockIncidents.reduce((m, i: any) => {
      const n = parseInt(String(i.id).split('-')[2] || '0', 10);
      return Math.max(m, isNaN(n) ? 0 : n);
    }, 0);
    const newId = `INC-${new Date().getFullYear()}-${String(maxNum + 1).padStart(4, '0')}`;

    const first = involvedStudents[0];
    const newIncident: any = {
      id: newId,
      date: occurredDate,
      time: sharedData.incidentTime,
      // When the report was filed, as distinct from when the incident happened
      reportedDate: today,
      subject,
      // Only student incidents carry the denormalized student fields. Emitting
      // them as empty strings on a location incident is what produces blank
      // cells in every student column downstream.
      ...(isStudent ? { student: first?.name || '', studentId: first?.id || '' } : {}),
      type: typeLabel,
      description: sharedData.description,
      bus: sharedData.bus ? `Bus ${sharedData.bus.replace('bus-', '')}` : (assetRequired && incidentCategory === 'vehicle' ? assetRef : ''),
      route: ROUTE_LABELS[sharedData.route] || sharedData.route || '',
      driver: sharedData.driver,
      severity: sharedSeverity,
      status: 'Open',
      createdBy,
      assignedTo: 'Sarah Williams',
      location: sharedData.location,
      ...(assetRef ? { assetRef } : {}),
      ...(locationCoordinates ? { locationCoordinates } : {}),
      ...(locationAddress ? { locationAddress } : {}),
      witnessPresent: sharedData.witnessPresent,
      witnessNames: normalizeContacts(sharedData.witnesses).map(c => c.name),
      witnesses: normalizeContacts(sharedData.witnesses),
      thirdPartyPresent: sharedData.thirdPartyPresent,
      thirdPartyNames: normalizeContacts(sharedData.thirdParties).map(c => c.name),
      thirdParties: normalizeContacts(sharedData.thirdParties),
      tags: sharedData.tags,
      ...(isStudent ? { involvedStudents: involved } : {}),
      ...(parties.length ? { involvedParties: parties } : {}),
      ...(uploadedPhotos.length
        ? { photos: uploadedPhotos.map(p => ({ id: p.id, url: p.url, thumbnail: p.url, uploadedBy: createdBy, uploadedAt: today, caption: p.name })) }
        : {}),
      ...(uploadedDocuments.length
        ? { documents: uploadedDocuments.map(doc => ({ id: doc.id, name: doc.name, size: doc.size, type: doc.type, uploadedBy: createdBy, uploadedAt: today })) }
        : {}),
    };

    // Persist into the shared incidents list (in-memory for the session)
    mockIncidents.unshift(newIncident);

    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); onNavigate('incidents'); }, 3000);
  };


  const filteredStudents = mockStudents.filter(
    s => (studentSearch === '' || s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.id.toLowerCase().includes(studentSearch.toLowerCase()))
      && !involvedStudents.find(added => added.id === s.id)
  );

  // Incident types for the chosen subject, flat and alphabetical. Categories
  // still exist on the type records and are used elsewhere (Admin, reporting),
  // they are just not used to group this dropdown.
  const sortedTypesForSubject = incidentCategory
    ? getIncidentTypesForCategory(incidentCategory)
        .slice()
        .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  // Non-student incidents happen in places a student incident never does, so
  // they get the wider list that includes the LOCATION group.
  const activeLocationOptions =
    incidentCategory && incidentCategory !== 'student' ? DRIVER_LOCATION_OPTIONS : LOCATION_OPTIONS;

  // Incident Type is defined once and placed in one of two spots depending on
  // subject: in the top row with date and time normally, or beside Affected
  // Location on a location incident. Defined here so the two placements cannot
  // drift apart.
  const incidentTypeField = (
    <div>
      <Label style={{ fontFamily: 'Roboto, sans-serif' }}>
        Incident Type <span style={{ color: 'var(--forge-theme-error)' }}>*</span>
      </Label>
      {/* @ts-ignore */}
      <forge-text-field>
        <select
          value={sharedData.incidentType}
          onChange={(e) => {
            const t = INCIDENT_TYPES.find(t => t.id === e.target.value);
            setSharedData(s => ({ ...s, incidentType: e.target.value, severity: t?.defaultSeverity.toLowerCase() || '' }));
          }}
          required
          /* The full type description is a tooltip rather than visible copy.
             Rendered inline it wrapped to five lines in a narrow column and
             shoved the rest of the row down. */
          title={INCIDENT_TYPES.find(t => t.id === sharedData.incidentType)?.description || undefined}
          style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
        >
          <option value="">Select type...</option>
          {/* Flat alphabetical: already filtered to the subject, so category
              headers only added rows to scan. */}
          {sortedTypesForSubject.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </forge-text-field>
    </div>
  );

  const dateField = (
    <div>
      <Label style={{ fontFamily: 'Roboto, sans-serif' }}>
        Date <span style={{ color: 'var(--forge-theme-error)' }}>*</span>
      </Label>
      {/* @ts-ignore */}
      <forge-text-field>
        <input
          type="date"
          value={sharedData.incidentDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setSharedData(s => ({ ...s, incidentDate: e.target.value }))}
          required
          style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
        />
      </forge-text-field>
      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', marginTop: 4 }}>
        When the incident occurred, not when you are filing it.
      </p>
    </div>
  );

  const timeField = (
    <div>
      <Label style={{ fontFamily: 'Roboto, sans-serif' }}>
        Time <span style={{ color: 'var(--forge-theme-error)' }}>*</span>
      </Label>
      {/* @ts-ignore */}
      <forge-text-field>
        <input
          type="time"
          value={sharedData.incidentTime}
          onChange={(e) => setSharedData(s => ({ ...s, incidentTime: e.target.value }))}
          required
          style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
        />
      </forge-text-field>
      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', marginTop: 4 }}>
        Approximate is fine if the exact time is unknown.
      </p>
    </div>
  );

  // Flattened and alphabetised for the Location Type dropdown. The grouped
  // structure above is still what defines which locations apply per subject.
  const sortedLocationOptions = activeLocationOptions
    .flatMap(g => g.items)
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));

  // Location and vehicle incidents must name the affected asset, since they may
  // carry no people at all and would otherwise be unidentifiable in the list.
  const assetRequired = incidentCategory === 'location' || incidentCategory === 'vehicle';
  const detailsIncomplete =
    !sharedData.incidentDate ||
    !sharedData.incidentTime ||
    !sharedData.incidentType ||
    !sharedData.severity ||
    !sharedData.description ||
    !sharedData.location ||
    (assetRequired && !assetRef);

  // Render a 24-hour time value as 12-hour for display, e.g. "14:05" to "2:05 PM"
  const formatTime = (value: string) => {
    if (!value) return '';
    const [h, m] = value.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return value;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const getLocationLabel = (value: string) => {
    for (const group of DRIVER_LOCATION_OPTIONS) {
      const item = group.items.find(i => i.value === value);
      if (item) return item.label;
    }
    return value;
  };

  const getIncidentTypeLabel = (id: string) => INCIDENT_TYPES.find(t => t.id === id)?.label || id;

  // Whether the reporter has actually put anything in yet. Used to decide
  // whether changing the subject is worth warning about.
  const hasEnteredData =
    involvedStudents.length > 0 ||
    involvedParties.length > 0 ||
    !!sharedData.incidentType ||
    !!sharedData.severity ||
    !!sharedData.incidentTime ||
    !!sharedData.description ||
    !!sharedData.location ||
    !!sharedData.bus ||
    !!sharedData.route ||
    !!sharedData.driver ||
    !!assetRef ||
    normalizeContacts(sharedData.witnesses).length > 0 ||
    normalizeContacts(sharedData.thirdParties).length > 0 ||
    sharedData.tags.length > 0 ||
    uploadedPhotos.length > 0 ||
    uploadedDocuments.length > 0;

  // How many records the success banner should claim. Student and employee/third
  // party incidents create one per person; location and vehicle create one.
  // Submitting always creates exactly ONE incident record. The people are
   // associated to it; they are not separate incidents. This phrase describes
   // who is attached, for the success message.
  const associatedSummary = incidentCategory === 'student'
    ? (involvedStudents.length
        ? `${involvedStudents.length} student${involvedStudents.length !== 1 ? 's' : ''} associated`
        : '')
    : (involvedParties.length
        ? `${involvedParties.length} ${involvedParties.length === 1 ? 'person' : 'people'} associated`
        : '');

  // ── Subject chooser, then a step count derived from the chosen subject ──────

  return (
    <div>
      {showSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Incident created successfully{associatedSummary ? ` with ${associatedSummary}` : ''}. Supervisor has been notified.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Subject chooser: which kind of incident is this? ── */}
      {showChooser && (
        <ForgeCard style={{ border: 'none', boxShadow: 'none' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif' }}>What kind of incident is this?</h3>
                <p className="forge-typography--body2" style={{ color: 'var(--forge-theme-text-medium)', fontFamily: 'Roboto, sans-serif' }}>
                  Choose the subject of the incident. This determines which details you are asked for.
                </p>
              </div>
              {/* Escape hatch. Without this, opening the chooser by accident
                  strands the reporter with no way back to what they had. */}
              {incidentCategory && (
                <ForgeButton
                  type="button"
                  variant="outlined"
                  onClick={() => setShowChooser(false)}
                  style={{ fontFamily: 'Roboto, sans-serif', flexShrink: 0 }}
                >
                  <ChevronLeft className="h-4 w-4" /> Keep {getSubjectLabel(incidentCategory)}
                </ForgeButton>
              )}
            </div>

            {incidentCategory && hasEnteredData && (
              <Alert className="mt-4 bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800" style={{ fontFamily: 'Roboto, sans-serif' }}>
                  You have already started this report. Picking a <strong>different</strong> subject clears the incident
                  type, the people involved, and the affected asset, because those differ by subject. Your date, time,
                  description, location, and attachments are kept.
                  {' '}Choosing <strong>{getSubjectLabel(incidentCategory)}</strong> again, or using Keep {getSubjectLabel(incidentCategory)},
                  leaves everything exactly as it is.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
            {/* All five subjects on one row so the whole choice is visible at
                once without scanning a wrapped grid. Five columns hold from
                640px up, rather than dropping to two, because two columns made
                each card enormously wide for two words of copy. The pixel cap
                keeps cards from stretching on a wide dialog; font sizes are
                unchanged, only the card width. */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-[820px] mx-auto">
              {INCIDENT_SUBJECTS.map(subject => {
                const iconName = SUBJECT_ICONS[subject.value];
                const isCurrent = subject.value === incidentCategory;
                return (
                  <button
                    key={subject.value}
                    type="button"
                    onClick={() => chooseSubject(subject.value)}
                    className="group relative p-4 border-2 rounded-lg hover:border-primary transition-all bg-white hover:bg-primary/5 h-full"
                    style={{
                      borderColor: isCurrent ? '#4A6FA5' : 'var(--forge-color-border-default)',
                      background: isCurrent ? '#F4F7FB' : '#fff',
                      borderRadius: 'var(--forge-radius-large)',
                    }}
                  >
                    {isCurrent && (
                      <span
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)',
                          fontWeight: 500, color: '#4A6FA5',
                        }}
                      >
                        Current
                      </span>
                    )}
                    <div className="flex flex-col items-center text-center gap-2">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ background: '#EEF2F8' }}
                      >
                        {/* @ts-ignore */}
                        <forge-icon name={iconName} style={{ fontSize: '28px', color: '#4A6FA5' }}></forge-icon>
                      </div>
                      <div>
                        <h3
                          className="font-semibold mb-1"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                          }}
                        >
                          {subject.label}
                        </h3>
                        <p
                          className="text-muted-foreground"
                          style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', lineHeight: 1.4 }}
                        >
                          {subject.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </ForgeCard>
      )}

      {/* Forge Stepper */}
      {incidentCategory && !showChooser && (
      <div className="mb-6">
        {/* pt-4 so this row clears the dialog header's bottom border rather than
            sitting right on top of it. The change control sits immediately after
            the chip, not floated to the far right, so it reads as belonging to
            the subject it changes. */}
        <div className="flex items-center gap-2 pt-4 mb-4">
          <span className="forge-typography--body2" style={{ color: 'var(--forge-theme-text-medium)', fontFamily: 'Roboto, sans-serif' }}>
            Subject:
          </span>
          <Badge variant="secondary" style={{ fontFamily: 'Roboto, sans-serif' }}>
            {getSubjectLabel(incidentCategory)}
          </Badge>
          <button
            type="button"
            onClick={() => setShowChooser(true)}
            title="Go back to the subject chooser. Nothing is lost unless you pick a different subject."
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginLeft: 4, padding: '2px 8px',
              background: 'none', border: '1px solid var(--forge-color-border-default)',
              borderRadius: 'var(--forge-radius-medium)', cursor: 'pointer',
              fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)',
              color: 'var(--forge-theme-text-medium)',
            }}
          >
            <ChevronLeft className="h-3 w-3" /> Change
          </button>
        </div>
        {/* @ts-ignore */}
        <forge-stepper
          selected-index={currentStep - 1}
          linear="true"
          layout-mode="fixed"
          style={{ width: '100%' }}
        >
          {steps.map((step, idx) => {
            const number = idx + 1;
            const isDone = currentStep > number;
            const isActive = currentStep === number;
            return (
              // @ts-ignore
              <forge-step
                key={step.key}
                completed={isDone ? 'true' : undefined}
                editable={isDone ? 'true' : undefined}
                selected={isActive ? 'true' : undefined}
              >
                {step.label}
              </forge-step>
            );
          })}
        {/* @ts-ignore */}
        </forge-stepper>
      </div>
      )}

      {/* ── Step 1: Involved Students ── */}
      {stepKey === 'parties' && incidentCategory === 'student' && (
        <ForgeCard style={{ border: 'none', boxShadow: 'none' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <div className="flex items-start gap-3 mb-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2F8' }}>
                <Users className="w-5 h-5" style={{ color: '#4A6FA5' }} />
              </div>
              <div>
                <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', marginBottom: 2 }}>Involved Students</h3>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)' }}>
                  Add all students involved. They are all associated with this one incident, each with their own role and details.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-4" ref={studentSearchRef}>
              {/* @ts-ignore */}
              <forge-text-field>
                <input
                  ref={studentInputRef}
                  type="text"
                  placeholder="+ Search students by name or ID to add..."
                  value={studentSearch}
                  onChange={(e) => { setStudentSearch(e.target.value); setStudentSearchOpen(true); }}
                  onFocus={() => setStudentSearchOpen(true)}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                />
              </forge-text-field>
              {studentSearchOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[280px] overflow-auto" style={{ borderColor: 'var(--forge-color-border-default)' }}>
                  {filteredStudents.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)' }}>
                      No students found.
                    </div>
                  ) : (
                    filteredStudents.map(student => (
                      <button
                        key={student.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); addStudent(student); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--forge-color-border-subtle)', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F4F7FB')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <div className="flex flex-col">
                          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', fontWeight: 500 }}>{student.name}</span>
                          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)' }}>
                            {student.id} · {student.grade} · {student.school}
                          </span>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Student list or empty state */}
            <div className="mt-4">
              {involvedStudents.length === 0 ? (
                <div
                  className="border-2 border-dashed rounded-lg py-12 text-center"
                  style={{ borderColor: 'var(--forge-color-border-subtle)', borderRadius: 'var(--forge-radius-medium)' }}
                >
                  <Users className="mx-auto mb-3" style={{ width: 40, height: 40, color: 'var(--forge-theme-text-medium)', opacity: 0.5 }} />
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)' }}>
                    No students added yet. Search above to add involved students.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {involvedStudents.length} student{involvedStudents.length !== 1 ? 's' : ''} selected
                    </span>
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)' }}>
                      {involvedStudents.length} individual incident{involvedStudents.length !== 1 ? 's' : ''} will be created
                    </span>
                  </div>
                  <div className="space-y-2">
                    {involvedStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                        style={{ borderColor: 'var(--forge-color-border-default)', borderRadius: 'var(--forge-radius-medium)', background: '#F8F9FA' }}
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', fontWeight: 500 }}>{student.name}</span>
                          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)' }}>
                            {student.id} · {student.grade}
                          </span>
                          <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)' }}>
                            {student.school}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStudent(student.id)}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:text-red-500 transition-colors"
                          style={{ color: 'var(--forge-theme-text-medium)', background: 'none', border: 'none', cursor: 'pointer' }}
                          aria-label={`Remove ${student.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t" style={{ borderColor: 'var(--forge-color-border-subtle)' }}>
            <button
              type="button"
              disabled={involvedStudents.length === 0}
              onClick={goNext}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '0 20px', height: '38px',
                background: involvedStudents.length === 0 ? '#9BAEC8' : '#4A6FA5',
                color: '#fff', border: 'none', borderRadius: '4px',
                fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                cursor: involvedStudents.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Next: Incident Details <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </ForgeCard>
      )}

      {/* ── Step: Involved People (employee and third party) ── */}
      {stepKey === 'parties' && incidentCategory && incidentCategory !== 'student' && (
        <ForgeCard style={{ border: 'none', boxShadow: 'none' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <div className="flex items-start gap-3 mb-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2F8' }}>
                <Users className="w-5 h-5" style={{ color: '#4A6FA5' }} />
              </div>
              <div>
                <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', marginBottom: 4 }}>
                  {incidentCategory === 'employee' ? 'Involved Employees' : 'Involved People'}
                </h3>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)' }}>
                  {incidentCategory === 'employee'
                    ? 'Add each employee involved. Their individual account and any action taken is captured on the next step.'
                    : 'Add each person outside the district involved, such as another motorist, a parent, or a member of the public.'}
                </p>
              </div>
            </div>

            {/* Add a person */}
            <div className="mt-5">
              {incidentCategory === 'employee' ? (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Employee</Label>
                    <select
                      value=""
                      onChange={(e) => {
                        const drv = mockDrivers.find((d: any) => d.id === e.target.value);
                        if (drv) addParty('employee', drv.fullName, drv.id);
                      }}
                      style={{
                        fontFamily: 'var(--forge-font-family)',
                        fontSize: 'var(--forge-font-size-base)',
                        width: '100%',
                        padding: 'var(--forge-spacing-small)',
                        borderRadius: 'var(--forge-radius-medium)',
                        border: '1px solid var(--border)',
                        background: 'var(--input-background)',
                      }}
                    >
                      <option value="">Select an employee to add...</option>
                      {mockDrivers
                        .filter((d: any) => !involvedParties.some(p => p.partyId === d.id))
                        .map((d: any) => (
                          <option key={d.id} value={d.id}>{d.fullName} ({d.employeeId})</option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Name or description</Label>
                    <input
                      type="text"
                      value={newPartyName}
                      onChange={(e) => setNewPartyName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addParty('thirdParty', newPartyName); } }}
                      placeholder="e.g. Unnamed motorist (grey sedan), or a parent's name"
                      style={{
                        fontFamily: 'var(--forge-font-family)',
                        fontSize: 'var(--forge-font-size-base)',
                        width: '100%',
                        padding: 'var(--forge-spacing-small)',
                        borderRadius: 'var(--forge-radius-medium)',
                        border: '1px solid var(--border)',
                        background: 'var(--input-background)',
                      }}
                    />
                  </div>
                  <ForgeButton
                    type="button"
                    variant="outlined"
                    onClick={() => addParty('thirdParty', newPartyName)}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    <Plus className="h-4 w-4" /> Add
                  </ForgeButton>
                </div>
              )}
            </div>

            {/* Current roster */}
            <div className="mt-5 space-y-2">
              {involvedParties.length === 0 ? (
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)' }}>
                  No one added yet. Add at least one person to continue.
                </p>
              ) : (
                involvedParties.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{ borderColor: 'var(--forge-color-border-default)', borderRadius: 'var(--forge-radius-medium)' }}
                  >
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', minWidth: 20, textAlign: 'center' }}>{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', fontWeight: 500 }}>{p.name}</p>
                      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)' }}>
                        {p.partyType === 'employee' ? 'Employee' : 'Third party'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeParty(p.id)}
                      aria-label={`Remove ${p.name}`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forge-theme-text-medium)' }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end p-4 border-t" style={{ borderColor: 'var(--forge-color-border-subtle)' }}>
            <button
              type="button"
              disabled={involvedParties.length === 0}
              onClick={goNext}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '0 20px', height: '38px',
                background: involvedParties.length === 0 ? '#9BAEC8' : '#4A6FA5',
                color: '#fff', border: 'none', borderRadius: '4px',
                fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                cursor: involvedParties.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Next: Incident Details <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </ForgeCard>
      )}

      {/* ── Step: Incident Details ── */}
      {stepKey === 'details' && (
        <ForgeCard style={{ border: 'none', boxShadow: 'none' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', marginBottom: 4 }}>Incident Details</h3>
            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)', marginBottom: 'var(--forge-spacing-medium)' }}>
              {incidentCategory === 'student' && (
                <>These details apply to all {involvedStudents.length} student{involvedStudents.length !== 1 ? 's' : ''}. You can customize per-student details in the next step.</>
              )}
              {(incidentCategory === 'employee' || incidentCategory === 'thirdParty') && (
                <>These details apply to all {involvedParties.length} {involvedParties.length === 1 ? 'person' : 'people'}. You can customize per-person details in the next step.</>
              )}
              {incidentCategory === 'location' && 'Describe what happened and name the location affected.'}
              {incidentCategory === 'vehicle' && 'Describe what happened and name the vehicle affected.'}
            </p>

            {/* ── Page split in two ────────────────────────────────────────
                Left half is the factual record, laid out in three columns.
                Right half is the assessment and the location: severity, the
                location type, and the pinned map. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4 items-start">

              {/* ── LEFT 50%: three-column field grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">

                {/* First row of fields. Location incidents move Incident Type
                    down beside Affected Location, which would leave a third
                    column empty here, so date and time split the row 50/50
                    instead of sitting in two thirds of a three-column grid. */}
                {incidentCategory === 'location' ? (
                  <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    {dateField}
                    {timeField}
                  </div>
                ) : (
                  <>
                    {dateField}
                    {timeField}
                    {incidentTypeField}
                  </>
                )}

                {/* The affected asset, the vehicle, and the driver share one
                    row group. On a vehicle incident the Vehicle Number field is
                    omitted entirely: Affected Vehicle already captures it, so
                    asking twice invites the two to disagree. That leaves
                    Affected Vehicle and Driver side by side. */}
                <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  {/* Location incidents get Incident Type here, immediately to
                      the left of the location it applies to. */}
                  {incidentCategory === 'location' && incidentTypeField}

                  {(incidentCategory === 'location' || incidentCategory === 'vehicle') && (
                    <div>
                      <Label style={{ fontFamily: 'Roboto, sans-serif' }}>
                        {incidentCategory === 'location' ? 'Affected Location' : 'Affected Vehicle'} <span style={{ color: 'var(--forge-theme-error)' }}>*</span>
                      </Label>
                      {/* @ts-ignore */}
                      <forge-text-field>
                        <select
                          value={assetRef}
                          onChange={(e) => setAssetRef(e.target.value)}
                          required
                          style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
                        >
                          <option value="">
                            {incidentCategory === 'location' ? 'Select location...' : 'Select vehicle...'}
                          </option>
                          {incidentCategory === 'location'
                            ? mockLocations.map(f => <option key={f.id} value={f.name}>{f.name}</option>)
                            : mockVehicles.map((v: any) => <option key={v.id} value={v.name}>{v.name}</option>)}
                        </select>
                      </forge-text-field>
                    </div>
                  )}

                  {incidentCategory !== 'vehicle' && (
                    <div>
                      <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Vehicle Number</Label>
                      {/* @ts-ignore */}
                      <forge-text-field>
                        <select value={sharedData.bus} onChange={(e) => setSharedData(s => ({ ...s, bus: e.target.value }))} style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}>
                          <option value="">Optional...</option>
                          {['bus-12', 'bus-15', 'bus-22', 'bus-31', 'bus-8'].map(b => <option key={b} value={b}>Vehicle {b.replace('bus-', '')}</option>)}
                        </select>
                      </forge-text-field>
                    </div>
                  )}

                  <div>
                    <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Driver</Label>
                    {/* @ts-ignore */}
                    <forge-text-field>
                      <select
                        value={sharedData.driver}
                        onChange={(e) => setSharedData(s => ({ ...s, driver: e.target.value }))}
                        style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
                      >
                        <option value="">Optional...</option>
                        {mockDrivers
                          .filter(d => d.status === 'Active')
                          .sort((a, b) => a.fullName.localeCompare(b.fullName))
                          .map(d => (
                            <option key={d.id} value={d.fullName}>{d.fullName}</option>
                          ))}
                      </select>
                    </forge-text-field>
                  </div>
                </div>

                {/* Run and Location Type share the next row. Location Type lives
                    here with the other record fields rather than out beside the
                    map, so the map can stand on its own. */}
                <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Run</Label>
                    {/* @ts-ignore */}
                    <forge-text-field>
                      <select value={sharedData.route} onChange={(e) => setSharedData(s => ({ ...s, route: e.target.value }))} style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}>
                        <option value="">Optional...</option>
                        <option value="colonie-high-am-purple">Colonie High AM - Purple</option>
                        <option value="jefferson-middle-am-blue">Jefferson Middle AM - Blue</option>
                        <option value="lincoln-elem-am-green">Lincoln Elementary AM - Green</option>
                        <option value="meyers-middle-am-yellow">Meyers Middle AM - Yellow</option>
                        <option value="roosevelt-high-pm-red">Roosevelt High PM - Red</option>
                        <option value="washington-high-pm-wolf">Washington High PM - Wolf Rd</option>
                      </select>
                    </forge-text-field>
                  </div>

                  <div>
                    <Label style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Location Type <span style={{ color: 'var(--forge-theme-error)' }}>*</span>
                    </Label>
                    {/* @ts-ignore */}
                    <forge-text-field>
                      <select
                        value={sharedData.location}
                        onChange={(e) => setSharedData(s => ({ ...s, location: e.target.value }))}
                        required
                        style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
                      >
                        {/* "location type", not "location". On a Location
                            incident this dropdown sits beside Affected Location,
                            and two neighbours both reading "Select location..."
                            would be indistinguishable. */}
                        <option value="">Select location type...</option>
                        {/* Flat alphabetical. The category headers (ON ROUTE,
                            GARAGE/DEPOT, ...) added rows to scan without
                            narrowing anything down, same as the type list. */}
                        {sortedLocationOptions.map(i => (
                          <option key={i.value} value={i.value}>{i.label}</option>
                        ))}
                      </select>
                    </forge-text-field>
                  </div>
                </div>

                {/* Description spans all three columns. */}
                <div className="sm:col-span-3">
                  <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Incident Description <span style={{ color: 'var(--forge-theme-error)' }}>*</span></Label>
                  <Textarea
                    placeholder="Provide a detailed description of what occurred. Include time, specific behaviors, and any relevant context..."
                    rows={12}
                    value={sharedData.description}
                    onChange={(e) => setSharedData(s => ({ ...s, description: e.target.value }))}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  />
                </div>

                {/* Who else was there. Two across rather than three, because the
                    contact cards need the width. */}
                <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="witnessPresent" checked={sharedData.witnessPresent} onCheckedChange={(v) => setSharedData(s => ({ ...s, witnessPresent: v as boolean }))} />
                      <Label htmlFor="witnessPresent" className="cursor-pointer" style={{ fontFamily: 'Roboto, sans-serif' }}>Witness(es) present</Label>
                    </div>
                    {sharedData.witnessPresent && (
                      <div className="mt-3">
                        <PersonContactFields
                          people={sharedData.witnesses}
                          onChange={(witnesses) => setSharedData(s => ({ ...s, witnesses }))}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="thirdPartyPresent" checked={sharedData.thirdPartyPresent} onCheckedChange={(v) => setSharedData(s => ({ ...s, thirdPartyPresent: v as boolean }))} />
                      <Label htmlFor="thirdPartyPresent" className="cursor-pointer" style={{ fontFamily: 'Roboto, sans-serif' }}>Third part(ies) involved</Label>
                    </div>
                    {sharedData.thirdPartyPresent && (
                      <div className="mt-2">
                        <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', marginBottom: 8 }}>
                          Anyone outside the district who was involved, such as another motorist, a parent or guardian, a pedestrian, or a member of the public.
                        </p>
                        <PersonContactFields
                          people={sharedData.thirdParties}
                          onChange={(thirdParties) => setSharedData(s => ({ ...s, thirdParties }))}
                          personLabel="Third Party"
                          addLabel="Add Third Party"
                          removeLabel="Remove third party"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags spans the row: the chips wrap and need the width. */}
                <div className="sm:col-span-3">
                  <Label style={{ fontFamily: 'Roboto, sans-serif', display: 'block', marginBottom: '8px' }}>Tags</Label>
                  <TagFields
                    tags={sharedData.tags}
                    onChange={(tags) => setSharedData(s => ({ ...s, tags }))}
                  />
                </div>

                {/* Both evidence uploads share a row, since each is just a
                    button until something is attached. */}
                <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <h4 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: 8 }}>Photo Evidence <span style={{ fontWeight: 400, color: 'var(--forge-theme-text-medium)', fontSize: 'var(--text-sm)' }}>(optional)</span></h4>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    <ForgeButton type="button" variant="outlined" onClick={() => fileInputRef.current?.click()} style={{ fontFamily: 'Roboto, sans-serif' }}>
                      <Upload className="mr-2 h-4 w-4" /> Upload Photos
                    </ForgeButton>
                    {uploadedPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        {uploadedPhotos.map(p => (
                          <div key={p.id} className="relative group border rounded-lg overflow-hidden" style={{ borderColor: 'var(--forge-color-border-default)' }}>
                            <div className="aspect-square"><img src={p.url} alt={p.name} className="w-full h-full object-cover" /></div>
                            <button type="button" onClick={() => setUploadedPhotos(photos => photos.filter(x => x.id !== p.id))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3 text-white" />
                            </button>
                            <div className="p-1"><p className="text-xs truncate" style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)' }} title={p.name}>{p.name}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: 8 }}>Document Evidence <span style={{ fontWeight: 400, color: 'var(--forge-theme-text-medium)', fontSize: 'var(--text-sm)' }}>(optional)</span></h4>
                    <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx" multiple onChange={handleDocumentUpload} className="hidden" />
                    <ForgeButton type="button" variant="outlined" onClick={() => documentInputRef.current?.click()} style={{ fontFamily: 'Roboto, sans-serif' }}>
                      <Upload className="mr-2 h-4 w-4" /> Upload Documents
                    </ForgeButton>
                    {uploadedDocuments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {uploadedDocuments.map(d => (
                          <div key={d.id} className="flex items-center gap-2 px-3 py-2 border rounded-md" style={{ borderColor: 'var(--forge-color-border-default)' }}>
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)' }}>{d.name}</span>
                            <button type="button" onClick={() => setUploadedDocuments(docs => docs.filter(x => x.id !== d.id))}><X className="h-3 w-3 text-muted-foreground" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── RIGHT 50%: severity, location type, location pin ── */}
              <div className="space-y-4">

                <div>
                  <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Severity Level <span style={{ color: 'var(--forge-theme-error)' }}>*</span></Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {(['low', 'medium', 'high', 'critical'] as const).map(level => (
                      <button key={level} type="button" onClick={() => setSharedData(s => ({ ...s, severity: level }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md border-2 transition-all ${sharedData.severity === level ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-muted'}`}>
                        {sharedData.severity === level ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                        <Badge
                          variant={level === 'critical' || level === 'high' ? 'destructive' : level === 'medium' ? 'secondary' : 'outline'}
                          style={level === 'critical' ? { background: 'var(--forge-theme-critical)', color: '#fff', borderColor: 'var(--forge-theme-critical)' } : undefined}
                          className="pointer-events-none"
                        >{level.charAt(0).toUpperCase() + level.slice(1)}</Badge>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map only, no surrounding border. The pin card already
                    reads as its own block; wrapping it made it look nested. */}
                <IncidentLocationMap
                  location={locationCoordinates}
                  onLocationChange={setLocationCoordinates}
                  address={locationAddress}
                  onAddressChange={setLocationAddress}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between p-4 border-t" style={{ borderColor: 'var(--forge-color-border-subtle)' }}>
            {currentStep > 1 ? (
              <ForgeButton type="button" variant="outlined" onClick={goBack} style={{ fontFamily: 'Roboto, sans-serif' }}>
                ← Back
              </ForgeButton>
            ) : <span />}
            <button
              type="button"
              disabled={detailsIncomplete}
              onClick={goNext}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '0 20px', height: '38px',
                background: detailsIncomplete ? '#9BAEC8' : '#4A6FA5',
                color: '#fff', border: 'none', borderRadius: '4px',
                fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                cursor: detailsIncomplete ? 'not-allowed' : 'pointer',
              }}
            >
              Next: {steps[currentStep]?.label ?? 'Review'} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </ForgeCard>
      )}

      {/* ── Step: Per-Student Details ── */}
      {stepKey === 'perParty' && incidentCategory === 'student' && (
        <ForgeCard style={{ border: 'none', boxShadow: 'none' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', marginBottom: 4 }}>Per-Student Details</h3>
            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)', marginBottom: 'var(--forge-spacing-medium)' }}>
              Customize details for each individual student. Parent notification and specific actions can differ per student.
            </p>

            <div className="space-y-3">
              {involvedStudents.map((student, idx) => {
                const data = perStudentData[student.id] || { parentNotified: false, actionTaken: '', notes: '' };
                const isExpanded = expandedStudents.has(student.id);
                return (
                  <div key={student.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--forge-color-border-default)', borderRadius: 'var(--forge-radius-medium)' }}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => {
                        setExpandedStudents(prev => {
                          const n = new Set(prev);
                          if (n.has(student.id)) n.delete(student.id); else n.add(student.id);
                          return n;
                        });
                      }}
                    >
                      <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', minWidth: 20, textAlign: 'center' }}>{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', fontWeight: 500 }}>{student.name}</p>
                        <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)' }}>
                          {student.grade} · {student.school}
                          {data.parentNotified && <span className="ml-2 text-green-600">· Parent notified</span>}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'var(--forge-color-border-subtle)' }}>
                        <div className="pt-4">

                          {/* Role in Incident */}
                          <div className="mb-4">
                            <Label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>
                              Role in Incident <span style={{ color: '#c0392b' }}>*</span>
                            </Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {([
                                { value: 'instigator', label: 'Instigator' },
                                { value: 'participant', label: 'Participant' },
                                { value: 'victim', label: 'Victim' },
                                { value: 'bystander', label: 'Bystander/Witness' },
                              ] as const).map(option => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => updatePerStudent(student.id, 'role', option.value)}
                                  style={{
                                    padding: '6px 16px',
                                    minWidth: 72,
                                    borderRadius: '4px',
                                    border: data.role === option.value ? '2px solid #4A6FA5' : '1px solid var(--forge-color-border-default)',
                                    background: data.role === option.value ? '#EEF2F8' : '#fff',
                                    color: data.role === option.value ? '#4A6FA5' : 'inherit',
                                    fontFamily: 'Roboto, sans-serif',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: data.role === option.value ? 500 : 400,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                  }}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Severity Override */}
                          <div className="mb-4">
                            <Label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>Severity Override</Label>
                            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', margin: '2px 0 8px' }}>
                              Leave as "Use Shared" to use the default severity ({sharedData.severity || 'not set'}). Override only if this student's involvement warrants a different level.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {([
                                { value: 'shared', label: `Use Shared\n(${sharedData.severity || 'not set'})` },
                                { value: 'low', label: 'Low' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'high', label: 'High' },
                                { value: 'critical', label: 'Critical' },
                              ] as const).map(option => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => updatePerStudent(student.id, 'severityOverride', option.value)}
                                  style={{
                                    padding: '6px 16px',
                                    minWidth: 72,
                                    borderRadius: '4px',
                                    border: data.severityOverride === option.value ? '2px solid #4A6FA5' : '1px solid var(--forge-color-border-default)',
                                    background: data.severityOverride === option.value ? '#EEF2F8' : '#fff',
                                    color: data.severityOverride === option.value ? '#4A6FA5' : 'inherit',
                                    fontFamily: 'Roboto, sans-serif',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: data.severityOverride === option.value ? 500 : 400,
                                    cursor: 'pointer',
                                    whiteSpace: 'pre-line',
                                    lineHeight: 1.3,
                                    textAlign: 'center',
                                  }}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Incident Type Override */}
                          <div className="mb-4">
                            <Label style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>Incident Type Override</Label>
                            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', margin: '2px 0 8px' }}>
                              Leave as "Use Shared" to assign the default incident type and workflow ({sharedData.incidentType ? getIncidentTypeLabel(sharedData.incidentType) : 'not set'}). Override to assign a different workflow for this student — e.g. a bystander may need a recap workflow instead of a disciplinary one.
                            </p>
                            {/* @ts-ignore */}
                            <forge-text-field>
                              <select
                                value={data.incidentTypeOverride}
                                onChange={(e) => updatePerStudent(student.id, 'incidentTypeOverride', e.target.value)}
                                style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
                              >
                                <option value="">Use Shared ({sharedData.incidentType ? getIncidentTypeLabel(sharedData.incidentType) : 'not set'})</option>
                                {/* Flat alphabetical, matching the shared type
                                    picker on the previous step. */}
                                {sortedTypesForSubject.map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t.label}{t.id === sharedData.incidentType ? ' (shared)' : ''}
                                  </option>
                                ))}
                              </select>
                            </forge-text-field>
                            {data.incidentTypeOverride && (
                              <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: '#4A6FA5', marginTop: 4 }}>
                                Overrides the shared type for this student.
                              </p>
                            )}
                          </div>

                          <div className="mb-4">
                            <Label htmlFor={`desc-${student.id}`} style={{ fontFamily: 'Roboto, sans-serif' }}>Description of Involvement</Label>
                            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', margin: '2px 0 8px' }}>
                              Describe what this student specifically did or experienced during the incident.
                            </p>
                            <Textarea
                              id={`desc-${student.id}`}
                              placeholder="e.g. Verbally confronted another student, threw backpack, was struck by..."
                              rows={3}
                              value={data.description}
                              onChange={(e) => updatePerStudent(student.id, 'description', e.target.value)}
                              style={{ fontFamily: 'Roboto, sans-serif', marginTop: 6 }}
                            />
                          </div>

                          <div className="flex items-center space-x-2 mb-4">
                            <Checkbox
                              id={`parent-${student.id}`}
                              checked={data.parentNotified}
                              onCheckedChange={(v) => updatePerStudent(student.id, 'parentNotified', v as boolean)}
                            />
                            <Label htmlFor={`parent-${student.id}`} className="cursor-pointer" style={{ fontFamily: 'Roboto, sans-serif' }}>
                              Parent/Guardian has been notified
                            </Label>
                          </div>
                          <div className="mb-4">
                            <Label htmlFor={`action-${student.id}`} style={{ fontFamily: 'Roboto, sans-serif' }}>Immediate Action Taken</Label>
                            <Textarea
                              id={`action-${student.id}`}
                              placeholder="Describe any immediate actions taken for this student (e.g., student moved seats, verbal warning given)..."
                              rows={3}
                              value={data.actionTaken}
                              onChange={(e) => updatePerStudent(student.id, 'actionTaken', e.target.value)}
                              style={{ fontFamily: 'Roboto, sans-serif', marginTop: 6 }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`notes-${student.id}`} style={{ fontFamily: 'Roboto, sans-serif' }}>Additional Notes</Label>
                            <Textarea
                              id={`notes-${student.id}`}
                              placeholder="Any additional notes specific to this student's involvement..."
                              rows={2}
                              value={data.notes}
                              onChange={(e) => updatePerStudent(student.id, 'notes', e.target.value)}
                              style={{ fontFamily: 'Roboto, sans-serif', marginTop: 6 }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between p-4 border-t" style={{ borderColor: 'var(--forge-color-border-subtle)' }}>
            <ForgeButton type="button" variant="outlined" onClick={goBack} style={{ fontFamily: 'Roboto, sans-serif' }}>
              ← Back
            </ForgeButton>
            <button
              type="button"
              onClick={goNext}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '0 20px', height: '38px',
                background: '#4A6FA5', color: '#fff', border: 'none', borderRadius: '4px',
                fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Next: Review & Submit <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </ForgeCard>
      )}

      {/* ── Step: Per-Person Details (employee and third party) ── */}
      {stepKey === 'perParty' && incidentCategory && incidentCategory !== 'student' && (
        <ForgeCard style={{ border: 'none', boxShadow: 'none' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', marginBottom: 4 }}>Per-Person Details</h3>
            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)', marginBottom: 'var(--forge-spacing-medium)' }}>
              Record each person's role, their own account, and any action taken. Severity can differ per person.
            </p>

            <div className="space-y-4">
              {involvedParties.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-4 rounded-lg border"
                  style={{ borderColor: 'var(--forge-color-border-default)', borderRadius: 'var(--forge-radius-medium)' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', minWidth: 20, textAlign: 'center' }}>{idx + 1}</span>
                    <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', fontWeight: 500, flex: 1 }}>{p.name}</p>
                    <Badge variant="outline" style={{ fontSize: 'var(--text-xs)' }}>
                      {p.partyType === 'employee' ? 'Employee' : 'Third party'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Role</Label>
                      <select
                        value={p.role}
                        onChange={(e) => updateParty(p.id, 'role', e.target.value)}
                        style={{
                          fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)',
                          width: '100%', padding: 'var(--forge-spacing-small)',
                          borderRadius: 'var(--forge-radius-medium)', border: '1px solid var(--border)',
                          background: 'var(--input-background)',
                        }}
                      >
                        {PARTY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Severity</Label>
                      <select
                        value={p.severityOverride}
                        onChange={(e) => updateParty(p.id, 'severityOverride', e.target.value)}
                        style={{
                          fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)',
                          width: '100%', padding: 'var(--forge-spacing-small)',
                          borderRadius: 'var(--forge-radius-medium)', border: '1px solid var(--border)',
                          background: 'var(--input-background)',
                        }}
                      >
                        <option value="shared">Use shared ({sharedData.severity || 'not set'})</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Their account</Label>
                    <Textarea
                      value={p.description}
                      onChange={(e) => updateParty(p.id, 'description', e.target.value)}
                      placeholder="What this person said happened, in their words where possible"
                      rows={2}
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    />
                  </div>
                  <div className="mt-3">
                    <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Action taken</Label>
                    <Textarea
                      value={p.actionTaken}
                      onChange={(e) => updateParty(p.id, 'actionTaken', e.target.value)}
                      placeholder="What was done at the scene or immediately after"
                      rows={2}
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    />
                  </div>
                  <div className="mt-3">
                    <Label style={{ fontFamily: 'Roboto, sans-serif' }}>Notes</Label>
                    <Textarea
                      value={p.notes}
                      onChange={(e) => updateParty(p.id, 'notes', e.target.value)}
                      placeholder="Anything else a reviewer should know"
                      rows={2}
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between p-4 border-t" style={{ borderColor: 'var(--forge-color-border-subtle)' }}>
            <ForgeButton type="button" variant="outlined" onClick={goBack} style={{ fontFamily: 'Roboto, sans-serif' }}>
              ← Back
            </ForgeButton>
            <button
              type="button"
              onClick={goNext}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '0 20px', height: '38px',
                background: '#4A6FA5', color: '#fff', border: 'none', borderRadius: '4px',
                fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Next: Review &amp; Submit <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </ForgeCard>
      )}

      {/* ── Step: Review & Submit ── */}
      {stepKey === 'review' && (
        <ForgeCard style={{ border: 'none', boxShadow: 'none' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', marginBottom: 4 }}>Review & Submit</h3>
            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--forge-theme-text-medium)', marginBottom: 'var(--forge-spacing-medium)' }}>
              {incidentCategory === 'student' && (
                <>Submitting will create <strong>one incident</strong> with the {involvedStudents.length} student{involvedStudents.length !== 1 ? 's' : ''} below associated to it.</>
              )}
              {(incidentCategory === 'employee' || incidentCategory === 'thirdParty') && (
                <>Submitting will create <strong>one incident</strong> with the {involvedParties.length} {involvedParties.length === 1 ? 'person' : 'people'} below associated to it.</>
              )}
              {(incidentCategory === 'location' || incidentCategory === 'vehicle') && (
                <>Submitting will create <strong>one incident</strong> for <strong>{assetRef || 'the selected asset'}</strong>.</>
              )}
            </p>

            {/* Shared summary */}
            <div className="rounded-lg p-4 mb-4" style={{ background: '#F4F7FB', border: '1px solid #D4DFF0', borderRadius: 'var(--forge-radius-medium)' }}>
              <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--forge-theme-text-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Shared Incident Details</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  { label: 'Occurred', value: `${sharedData.incidentDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2-$3-$1')}${sharedData.incidentTime ? ` at ${formatTime(sharedData.incidentTime)}` : ''}` },
                  { label: 'Type', value: getIncidentTypeLabel(sharedData.incidentType) },
                  { label: 'Severity', value: sharedData.severity.charAt(0).toUpperCase() + sharedData.severity.slice(1) },
                  { label: 'Location', value: getLocationLabel(sharedData.location) },
                  ...(assetRef ? [{ label: incidentCategory === 'location' ? 'Location' : 'Asset', value: assetRef }] : []),
                  ...(sharedData.bus ? [{ label: 'Vehicle', value: `Vehicle ${sharedData.bus.replace('bus-', '')}` }] : []),
                  ...(sharedData.route ? [{ label: 'Run', value: sharedData.route }] : []),
                  ...(sharedData.driver ? [{ label: 'Driver', value: sharedData.driver }] : []),
                  ...(sharedData.witnessPresent && normalizeContacts(sharedData.witnesses).length
                    ? [{ label: 'Witnesses', value: normalizeContacts(sharedData.witnesses).map(c => c.name).join(', ') }]
                    : []),
                  ...(sharedData.thirdPartyPresent && normalizeContacts(sharedData.thirdParties).length
                    ? [{ label: 'Third Parties', value: normalizeContacts(sharedData.thirdParties).map(c => c.name).join(', ') }]
                    : []),
                  ...(uploadedPhotos.length ? [{ label: 'Photos', value: `${uploadedPhotos.length} attached` }] : []),
                  ...(uploadedDocuments.length ? [{ label: 'Documents', value: `${uploadedDocuments.length} attached` }] : []),
                ].map(item => (
                  <div key={item.label}>
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)' }}>{item.label}: </span>
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              {sharedData.description && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: '#D4DFF0' }}>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', marginBottom: 4 }}>Description:</p>
                  <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>{sharedData.description}</p>
                </div>
              )}
            </div>

            {/* Per-person summary for non-student subjects */}
            {incidentCategory !== 'student' && involvedParties.length > 0 && (
              <>
                <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--forge-theme-text-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  {incidentCategory === 'employee' ? 'Employees' : 'People'} ({involvedParties.length})
                </p>
                <div className="space-y-2 mb-4">
                  {involvedParties.map((p, idx) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--forge-color-border-default)', borderRadius: 'var(--forge-radius-medium)' }}>
                      <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', minWidth: 20, textAlign: 'center', paddingTop: 2 }}>{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', fontWeight: 500 }}>{p.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" style={{ fontSize: 'var(--text-xs)' }}>{p.role}</Badge>
                          {p.severityOverride !== 'shared' && <Badge variant="outline" style={{ fontSize: 'var(--text-xs)' }}>Severity: {p.severityOverride}</Badge>}
                          {p.description && <Badge variant="outline" style={{ fontSize: 'var(--text-xs)' }}>Account added</Badge>}
                          {p.actionTaken && <Badge variant="outline" style={{ fontSize: 'var(--text-xs)' }}>Action documented</Badge>}
                          {p.notes && <Badge variant="outline" style={{ fontSize: 'var(--text-xs)' }}>Notes added</Badge>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToStep('perParty')}
                        style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: '#4A6FA5', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', flexShrink: 0 }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Per-student summary */}
            {incidentCategory === 'student' && (
            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--forge-theme-text-medium)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Students ({involvedStudents.length})
            </p>
            )}
            <div className="space-y-2 mb-4">
              {involvedStudents.map((student, idx) => {
                const data = perStudentData[student.id];
                return (
                  <div key={student.id} className="flex items-start gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--forge-color-border-default)', borderRadius: 'var(--forge-radius-medium)' }}>
                    <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)', minWidth: 20, textAlign: 'center', paddingTop: 2 }}>{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', fontWeight: 500 }}>{student.name}</p>
                      <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--forge-theme-text-medium)' }}>
                        {student.id} · {student.grade} · {student.school}
                      </p>
                      {data && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {data.role && <Badge variant="outline" style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>{data.role}</Badge>}
                          {data.incidentTypeOverride && <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50" style={{ fontSize: 'var(--text-xs)' }}>Type: {getIncidentTypeLabel(data.incidentTypeOverride)}</Badge>}
                          {data.severityOverride !== 'shared' && <Badge variant="outline" style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>Severity: {data.severityOverride}</Badge>}
                          {data.parentNotified && <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50" style={{ fontSize: 'var(--text-xs)' }}>Parent notified</Badge>}
                          {data.description && <Badge variant="outline" style={{ fontSize: 'var(--text-xs)' }}>Description added</Badge>}
                          {data.actionTaken && <Badge variant="outline" style={{ fontSize: 'var(--text-xs)' }}>Action documented</Badge>}
                          {data.notes && <Badge variant="outline" style={{ fontSize: 'var(--text-xs)' }}>Notes added</Badge>}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => goToStep('perParty')}
                      style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: '#4A6FA5', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', flexShrink: 0 }}
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between p-4 border-t" style={{ borderColor: 'var(--forge-color-border-subtle)' }}>
            <ForgeButton type="button" variant="outlined" onClick={goBack} style={{ fontFamily: 'Roboto, sans-serif' }}>
              ← Back
            </ForgeButton>
            <div className="flex gap-3">
              <ForgeButton type="button" variant="outlined" onClick={() => onNavigate('incidents')} style={{ fontFamily: 'Roboto, sans-serif' }}>Cancel</ForgeButton>
              <button
                type="button"
                onClick={handleStudentSubmit}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '0 20px', height: '38px',
                  background: '#4A6FA5', color: '#fff', border: 'none', borderRadius: '4px',
                  fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                }}
              >
                <Send className="h-4 w-4" />
                Submit Incident
              </button>
            </div>
          </div>
        </ForgeCard>
      )}
    </div>
  );
}
