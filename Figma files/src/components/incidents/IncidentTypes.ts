// Incident Type Categories and Definitions for Student Transportation

export const INCIDENT_CATEGORIES = {
  BEHAVIORAL: 'Behavioral',
  SAFETY: 'Safety',
  AGGRESSION: 'Aggression / Violence',
  PROPERTY: 'Property',
  PROHIBITED: 'Prohibited',
  INFORMATIONAL: 'Informational',
  EMPLOYEE_CONDUCT: 'Employee Conduct',
  LOCATION: 'Location',
  MECHANICAL: 'Mechanical',
  COLLISION: 'Collision',
} as const;

// The subject of an incident: who or what the incident is fundamentally about.
// Every incident has exactly one subject, and it drives which filing steps the
// New Incident wizard shows, which workflow is assigned, and how the record is
// labeled in the list and on the detail page.
export type IncidentSubject =
  | 'student'     // a student is involved
  | 'employee'    // employees only: driver-on-driver, aide injured, conduct
  | 'location'    // depot, garage, yard: burst pipe, vandalism, power loss
  | 'vehicle'     // bus damage or breakdown, nobody aboard
  | 'thirdParty'; // other motorist, pedestrian, parent, member of the public

export const INCIDENT_SUBJECTS: Array<{
  value: IncidentSubject;
  label: string;
  description: string;
  // Subjects that require at least one named person before the wizard advances.
  requiresParties: boolean;
}> = [
  // Order here drives the order of the cards in the New Incident chooser,
  // most common first. Access to every subject is governed the same way as
  // student incidents; there is no per-subject visibility rule.
  {
    value: 'student',
    label: 'Student',
    description: 'One or more students involved',
    requiresParties: true,
  },
  {
    value: 'vehicle',
    label: 'Vehicle',
    description: 'Damage or breakdown, nobody aboard',
    requiresParties: false,
  },
  {
    value: 'location',
    label: 'Location',
    description: 'Depot, garage, or yard problem',
    requiresParties: false,
  },
  {
    value: 'thirdParty',
    label: 'Third Party',
    description: 'Motorist, parent, or public',
    requiresParties: true,
  },
  {
    value: 'employee',
    label: 'Employee',
    description: 'Employees only, no students',
    requiresParties: true,
  },
];

export interface IncidentType {
  id: string;
  label: string;
  category: string;
  description: string;
  defaultSeverity: 'Low' | 'Medium' | 'High' | 'Critical';
  applicableTo: IncidentSubject;
}

export const INCIDENT_TYPES: IncidentType[] = [
  // ─── Student ───────────────────────────────────────────────────────────────
  {
    id: 'disruptive-behavior',
    label: 'Disruptive Behavior',
    category: INCIDENT_CATEGORIES.BEHAVIORAL,
    description: 'Offensive language, excessive noise, harassment, bullying, refusal of driver directives, or any disruptive conduct on the bus',
    defaultSeverity: 'Low',
    applicableTo: 'student',
  },
  {
    id: 'safety-violation',
    label: 'Safety Violation',
    category: INCIDENT_CATEGORIES.SAFETY,
    description: 'Seat or seatbelt refusal, unsafe movement, window misuse, emergency exit misuse, wrong stop exit, or eating/drinking on the bus',
    defaultSeverity: 'Medium',
    applicableTo: 'student',
  },
  {
    id: 'physical-altercation',
    label: 'Physical Altercation',
    category: INCIDENT_CATEGORIES.AGGRESSION,
    description: 'Fighting, physical assault, throwing objects, or verbal/physical threats directed toward another student or any person on the bus',
    defaultSeverity: 'High',
    applicableTo: 'student',
  },
  {
    id: 'property-damage',
    label: 'Property Damage',
    category: INCIDENT_CATEGORIES.PROPERTY,
    description: 'Vandalism or damage to the bus, equipment, or personal belongings requiring restitution',
    defaultSeverity: 'Medium',
    applicableTo: 'student',
  },
  {
    id: 'weapon-prohibited-items',
    label: 'Weapon / Prohibited Items',
    category: INCIDENT_CATEGORIES.PROHIBITED,
    description: 'Possession of a weapon, weapon-like object, tobacco, vaping devices, illegal substances, or any other prohibited materials on the bus',
    defaultSeverity: 'Critical',
    applicableTo: 'student',
  },
  {
    id: 'witness-bystander',
    label: 'Witness / Bystander Statement',
    category: INCIDENT_CATEGORIES.INFORMATIONAL,
    description: 'Non-disciplinary record capturing the account of a student who witnessed or tried to help during another incident. Use this instead of adding a bystander to a disciplinary incident (e.g. a fight) so their record is not flagged for behavior they were not part of.',
    defaultSeverity: 'Low',
    applicableTo: 'student',
  },

  // ─── Employee ─────────────────────────────────────────────────────────────────
  {
    id: 'employee-altercation',
    label: 'Employee Altercation',
    category: INCIDENT_CATEGORIES.EMPLOYEE_CONDUCT,
    description: 'Physical or verbal altercation between employees, such as two drivers fighting in the yard. No students involved.',
    defaultSeverity: 'High',
    applicableTo: 'employee',
  },
  {
    id: 'employee-misconduct',
    label: 'Employee Misconduct',
    category: INCIDENT_CATEGORIES.EMPLOYEE_CONDUCT,
    description: 'Policy violation, insubordination, unprofessional conduct, or failure to follow required procedure',
    defaultSeverity: 'Medium',
    applicableTo: 'employee',
  },
  {
    id: 'employee-injury',
    label: 'Employee Injury',
    category: INCIDENT_CATEGORIES.SAFETY,
    description: 'An employee injured on duty, such as an aide hurt during a wheelchair lift or a driver injured during a pre-trip inspection',
    defaultSeverity: 'High',
    applicableTo: 'employee',
  },
  {
    id: 'employee-substance-violation',
    label: 'Employee Substance Violation',
    category: INCIDENT_CATEGORIES.PROHIBITED,
    description: 'Employee suspected of being under the influence, or in possession of alcohol or illegal substances on duty',
    defaultSeverity: 'Critical',
    applicableTo: 'employee',
  },

  // ─── Third Party ───────────────────────────────────────────────────────────
  {
    id: 'third-party-collision',
    label: 'Third Party Collision',
    category: INCIDENT_CATEGORIES.COLLISION,
    description: 'Collision or near miss involving another motorist or cyclist, with no students aboard or no student involvement',
    defaultSeverity: 'High',
    applicableTo: 'thirdParty',
  },
  {
    id: 'third-party-injury',
    label: 'Third Party Injury',
    category: INCIDENT_CATEGORIES.SAFETY,
    description: 'A pedestrian, motorist, or member of the public injured in connection with a vehicle or location',
    defaultSeverity: 'High',
    applicableTo: 'thirdParty',
  },
  {
    id: 'third-party-conduct',
    label: 'Third Party Conduct',
    category: INCIDENT_CATEGORIES.AGGRESSION,
    description: 'Aggressive, threatening, or abusive behavior by a parent, guardian, or member of the public toward an employee or at a stop',
    defaultSeverity: 'High',
    applicableTo: 'thirdParty',
  },
  {
    id: 'public-complaint',
    label: 'Public Complaint',
    category: INCIDENT_CATEGORIES.INFORMATIONAL,
    description: 'Non-disciplinary record of a complaint from a parent, resident, or member of the public about a vehicle, route, or driver',
    defaultSeverity: 'Low',
    applicableTo: 'thirdParty',
  },

  // ─── Vehicle ───────────────────────────────────────────────────────────────
  {
    id: 'vehicle-damage',
    label: 'Vehicle Damage',
    category: INCIDENT_CATEGORIES.MECHANICAL,
    description: 'Damage to a vehicle with nobody aboard, such as a mirror clipped in the yard, hail damage, or vandalism while parked',
    defaultSeverity: 'Medium',
    applicableTo: 'vehicle',
  },
  {
    id: 'mechanical-failure',
    label: 'Mechanical Failure',
    category: INCIDENT_CATEGORIES.MECHANICAL,
    description: 'Breakdown or mechanical fault taking a vehicle out of service, such as a failed air brake check or an overheating engine',
    defaultSeverity: 'Medium',
    applicableTo: 'vehicle',
  },
  {
    id: 'vehicle-single-party-collision',
    label: 'Single Vehicle Collision',
    category: INCIDENT_CATEGORIES.COLLISION,
    description: 'Vehicle strikes a fixed object with nobody aboard, such as backing into a post or a gate in the yard',
    defaultSeverity: 'Medium',
    applicableTo: 'vehicle',
  },

  // ─── Location ──────────────────────────────────────────────────────────────
  {
    id: 'location-damage',
    label: 'Location Damage',
    category: INCIDENT_CATEGORIES.LOCATION,
    description: 'Damage or vandalism to a depot, garage, yard, or its equipment, such as a broken bay door or graffiti',
    defaultSeverity: 'Medium',
    applicableTo: 'location',
  },
  {
    id: 'location-utility-failure',
    label: 'Utility Failure',
    category: INCIDENT_CATEGORIES.LOCATION,
    description: 'Loss of a utility or building system, such as a burst water pipe, a power outage, or a heating failure',
    defaultSeverity: 'Medium',
    applicableTo: 'location',
  },
  {
    id: 'location-safety-hazard',
    label: 'Location Safety Hazard',
    category: INCIDENT_CATEGORIES.LOCATION,
    description: 'An unsafe condition at a location, such as a fuel spill, an icy walkway, a blocked fire exit, or exposed wiring',
    defaultSeverity: 'High',
    applicableTo: 'location',
  },
];

// Helper function to get incident types by category
export const getIncidentTypesByCategory = (category: string) => {
  return INCIDENT_TYPES.filter(type => type.category === category);
};

// Helper function to get all categories
export const getAllCategories = () => {
  return Object.values(INCIDENT_CATEGORIES);
};

// Helper function to get the categories that apply to a given incident subject
export const getCategoriesForIncidentCategory = (incidentCategory: IncidentSubject) => {
  const applicableTypes = INCIDENT_TYPES.filter(type => type.applicableTo === incidentCategory);
  const categories = Array.from(new Set(applicableTypes.map(type => type.category)));
  return categories;
};

// Helper function to get the incident types that apply to a given subject
export const getIncidentTypesForCategory = (incidentCategory: IncidentSubject) => {
  return INCIDENT_TYPES.filter(type => type.applicableTo === incidentCategory);
};

// Helper function to look up a subject's display metadata
export const getSubjectMeta = (subject: IncidentSubject) => {
  return INCIDENT_SUBJECTS.find(s => s.value === subject) ?? INCIDENT_SUBJECTS[0];
};

// Helper function to resolve a subject's display label
export const getSubjectLabel = (subject: IncidentSubject) => getSubjectMeta(subject).label;

// Whether a subject requires at least one named person before filing can advance
export const subjectRequiresParties = (subject: IncidentSubject) =>
  getSubjectMeta(subject).requiresParties;

// ─── Witness and third party contacts ────────────────────────────────────────

// One person who was present but is not the subject of the incident.
export interface PersonContact {
  name: string;
  phone: string;
  email: string;
}

export const emptyContact = (): PersonContact => ({ name: '', phone: '', email: '' });

// Accepts either the legacy string[] shape used by seeded incidents or the
// structured shape the form now produces, so both render the same way. Lives
// here rather than in the form because the detail page reads it too, and this
// module imports nothing.
export const normalizeContacts = (value: any): PersonContact[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v: any) => (typeof v === 'string' ? { name: v, phone: '', email: '' } : {
      name: v?.name ?? '',
      phone: v?.phone ?? '',
      email: v?.email ?? '',
    }))
    .filter((c: PersonContact) => c.name.trim().length > 0);
};

// ─── Terms ───────────────────────────────────────────────────────────────────

// The school year an incident falls in, which is what Student Transportation
// calls a term. Boundary is August 1, so a January incident belongs to the
// school year that began the previous August rather than to its own calendar
// year. Derived from the date so an incident can never disagree with its term.
//
// Raised repeatedly in the Aug 19 review: whether counts are term-specific,
// whether old incidents from past terms can be looked up, and whether the
// record should show the term it occurred in. This answers the third.
export const termForDate = (date?: string): string => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const [year, month] = date.split('-').map(Number);
  const start = month >= 8 ? year : year - 1;
  return start + '-' + (start + 1);
};

// The calendar year, used to group the incidents list. Separate from the term
// on purpose: the list divides on calendar year because that is what a reader
// scanning dates sees, while the record names the term.
export const yearForDate = (date?: string): string => (date ?? '').slice(0, 4);
