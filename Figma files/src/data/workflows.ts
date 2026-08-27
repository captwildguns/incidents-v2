// Workflow data and workflow assignment logic

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedRole: string;
  estimatedDuration: string;
  required: boolean;
  order: number;
  status?: 'Not Started' | 'In Progress' | 'Completed' | 'Pending Approval' | 'Approved' | 'Rejected';
  completedDate?: string;
  completedBy?: string;
  comments?: string;
  requiresApproval?: boolean;
  approvers?: string[];
  emailNotifications?: {
    notifyOnStart: boolean;
    notifyOnComplete: boolean;
    notifyAssignee: boolean;
    notifyApprovers: boolean;
    notifyGroups?: string[]; // Roles to notify
    additionalRecipients: string[]; // Email addresses for custom recipients
    emailTemplate?: string;
  };
  trigger?: {
    type: 'manual' | 'auto-complete' | 'time-delay' | 'status-change' | 'approval-granted' | 'conditional';
    delayAmount?: number;
    delayUnit?: 'minutes' | 'hours' | 'days';
    requiredStatus?: string;
    conditions?: {
      field: string;
      operator: string;
      value: string;
    }[];
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  incidentTypes: string[];
  severityLevels: string[];
  // Who owns an incident filed against this workflow, meaning who it is
  // assigned to the moment it is created. Per GH #197 the incident needs one
  // owner from creation, before any step is in progress; taking it from a step
  // would make the owner shift as the workflow advances and an "assigned to me"
  // view unstable.
  //
  // The role, not a person, so a workflow keeps working when staff change: an
  // employee injury goes to whoever holds Administrator. One of the five roles
  // #188 provisions: Administrator, Safety Coordinator, Driver, Fleet Manager,
  // School Principal.
  ownerRole?: string;
  // A named person overriding the role, for the district that wants one
  // specific individual on one workflow. Takes precedence when set.
  ownerName?: string;
  steps: WorkflowStep[];
  isActive: boolean; // Template is active/enabled in system
  active?: boolean; // Instance is actively being worked on
  createdBy: string;
  createdDate: string;
  lastModified: string;
}

// Who currently holds each incident role.
//
// Several people hold a role, which is the real shape: a district has more than
// one principal, and naming a role does not name a person. Every name here is
// invented. Replacing this with a real lookup is the only change needed when
// roles are attached to staff for real.
export const ROLE_HOLDERS: Record<string, string[]> = {
  'Administrator': ['Sarah Williams', 'Karen Taylor'],
  'Safety Coordinator': ['Sarah Williams', 'Grace Whitfield'],
  'School Principal': ['Jane Doe', 'Alan Reyes', 'Denise Ruiz'],
  'Fleet Manager': ['Mike Chen', 'Terrance Boyle'],
  'Driver': ['Lisa Anderson', 'David Park', 'John Chen'],
};

// The people holding one role, in the order they would be listed.
export function holdersOfRole(role: string | null | undefined): string[] {
  return role ? (ROLE_HOLDERS[role] ?? []) : [];
}

// The people who hold an incident role, and can therefore be assigned an
// incident. Inverted from ROLE_HOLDERS rather than listed by hand, so the
// assignable list and the resolver cannot drift apart. A person holding more
// than one role appears once, carrying both.
export interface IncidentRoleHolder {
  name: string;
  roles: string[];
}

export const INCIDENT_ROLE_HOLDERS: IncidentRoleHolder[] = Object.entries(ROLE_HOLDERS)
  .reduce<IncidentRoleHolder[]>((acc, [role, names]) => {
    names.forEach(name => {
      const existing = acc.find(h => h.name === name);
      if (existing) existing.roles.push(role);
      else acc.push({ name, roles: [role] });
    });
    return acc;
  }, [])
  .sort((a, b) => a.name.localeCompare(b.name));

// "Sarah Williams (Administrator, Safety Coordinator)", so a person picking an
// assignee can see what that person is allowed to handle.
export function roleHolderLabel(holder: IncidentRoleHolder): string {
  return holder.name + ' (' + holder.roles.join(', ') + ')';
}

// The person an incident on this workflow is assigned to at creation.
// Incident Owner is required in the workflow builder, so a saved workflow always
// names one. The null return covers a workflow that predates the field.
export function resolveWorkflowOwner(workflow: Pick<Workflow, 'ownerRole' | 'ownerName'> | null | undefined): string | null {
  if (!workflow) return null;
  if (workflow.ownerName) return workflow.ownerName;
  // A role with exactly one holder resolves to that person. A role several
  // people hold does not resolve to anybody, and callers show the role instead
  // of picking a name that nothing entitles them to pick.
  const holders = holdersOfRole(workflow.ownerRole);
  return holders.length === 1 ? holders[0] : null;
}

// Pre-configured workflows for different incident types
// Every incident type defined in IncidentTypes.ts is covered by exactly one workflow below.
export const workflows: Workflow[] = [
  // ─────────────────────────────────────────────
  // AGGRESSION / VIOLENCE
  // ─────────────────────────────────────────────
  {
    id: 'WF-002',
    name: 'Physical Altercation Response',
    ownerRole: 'School Principal',
    description: 'Workflow for handling physical altercations and threatening behavior between students requiring immediate intervention and parent notification',
    incidentTypes: ['Physical Altercation'],
    severityLevels: ['High'],
    isActive: true,
    createdBy: 'Sarah Williams',
    createdDate: '2025-01-15',
    lastModified: '2026-05-19',
    steps: [
      {
        id: 'step-1',
        name: 'Immediate Driver Response',
        description: 'Safely stop bus, assess threat level, separate involved students, and contact dispatch/911 if there is imminent danger or a weapon',
        assignedRole: 'Driver',
        estimatedDuration: '15 minutes',
        required: true,
        order: 1,
        status: 'Completed',
        completedDate: '2025-03-14 7:50 AM',
        completedBy: 'Robert Martinez',
        comments: 'Bus stopped safely, students separated. No injuries observed.',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Submit Incident Report',
        description: 'Driver submits the incident details, what occurred, injuries, and any threatening behavior, through the tablet app. Submitting the report notifies the safety coordinator.',
        assignedRole: 'Driver',
        estimatedDuration: '15 minutes',
        required: true,
        order: 2,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-3',
        name: 'Parent Notification',
        description: 'Contact parents of all students involved and explain incident',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '30 minutes',
        required: true,
        order: 3,
        status: 'Not Started',
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: false,
          additionalRecipients: [],
        },
      },
      {
        id: 'step-4',
        name: 'Disciplinary Action Review',
        description: 'Administrator reviews incident and determines appropriate disciplinary measures',
        assignedRole: 'Administrator',
        estimatedDuration: '1 hour',
        required: true,
        order: 4,
        status: 'Not Started',
        requiresApproval: true,
        approvers: ['Administrator'],
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: true,
          notifyGroups: ['Safety Coordinator'],
          additionalRecipients: [],
          emailTemplate: 'Action Required',
        },
      },
      {
        id: 'step-5',
        name: 'Documentation & Close',
        description: 'Complete incident documentation and close case',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '20 minutes',
        required: true,
        order: 5,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // BEHAVIORAL
  // ─────────────────────────────────────────────
  {
    id: 'WF-001',
    name: 'Disruptive Behavior Response',
    ownerRole: 'School Principal',
    description: 'Workflow for all disruptive behavior incidents including offensive language, excessive noise, bullying, harassment, defiance toward the driver, and unauthorized device usage',
    incidentTypes: ['Disruptive Behavior'],
    severityLevels: ['Low'],
    isActive: true,
    createdBy: 'Jane Doe',
    createdDate: '2025-02-10',
    lastModified: '2026-05-19',
    steps: [
      {
        id: 'step-1',
        name: 'Driver Warning & Documentation',
        description: 'Driver issues warning, logs incident details, and contacts dispatch if situation cannot be de-escalated',
        assignedRole: 'Driver',
        estimatedDuration: '15 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Parent Notification',
        description: 'Notify parent/guardian of the incident and expected behavior standards',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '10 minutes',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: false,
          additionalRecipients: [],
        },
      },
      {
        id: 'step-3',
        name: 'Close Incident',
        description: 'Review and close incident if no further action needed',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '5 minutes',
        required: true,
        order: 3,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // SAFETY VIOLATIONS
  // ─────────────────────────────────────────────
  {
    id: 'WF-005',
    name: 'Safety Violation Response',
    ownerRole: 'Safety Coordinator',
    description: 'Workflow for all student safety violations on the bus including seat/seatbelt refusal, unsafe movement, window misuse, emergency exit misuse, wrong stop exit, and eating/drinking',
    incidentTypes: ['Safety Violation'],
    severityLevels: ['Medium'],
    isActive: true,
    createdBy: 'Jane Doe',
    createdDate: '2025-02-01',
    lastModified: '2025-03-16',
    steps: [
      {
        id: 'step-1',
        name: 'Immediate Safety Response',
        description: 'Driver addresses the safety issue, secures the situation, and documents the incident',
        assignedRole: 'Driver',
        estimatedDuration: '15 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Submit Incident Report',
        description: 'Driver submits the incident details, what occurred, the safety violation involved, and any action taken to secure the situation, through the tablet app. Submitting the report notifies the safety coordinator.',
        assignedRole: 'Driver',
        estimatedDuration: '15 minutes',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-3',
        name: 'Parent Notification',
        description: 'Contact parent/guardian to inform them of the safety violation and reinforce bus safety expectations',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '15 minutes',
        required: true,
        order: 3,
        status: 'Not Started',
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: false,
          additionalRecipients: [],
        },
      },
      {
        id: 'step-4',
        name: 'Disciplinary Action Review',
        description: 'Administrator reviews incident and determines appropriate disciplinary measures',
        assignedRole: 'Administrator',
        estimatedDuration: '1 hour',
        required: true,
        order: 4,
        status: 'Not Started',
        requiresApproval: true,
        approvers: ['Administrator'],
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: true,
          notifyGroups: ['Safety Coordinator'],
          additionalRecipients: [],
          emailTemplate: 'Action Required',
        },
      },
      {
        id: 'step-5',
        name: 'Documentation & Close',
        description: 'Complete all documentation and close the incident',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '10 minutes',
        required: true,
        order: 5,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },


  // ─────────────────────────────────────────────
  // PROPERTY DAMAGE
  // ─────────────────────────────────────────────
  {
    id: 'WF-004',
    name: 'Property Damage Investigation',
    ownerRole: 'Administrator',
    description: 'Workflow for investigating and resolving vandalism and property damage incidents',
    incidentTypes: ['Property Damage'],
    severityLevels: ['Medium'],
    isActive: true,
    createdBy: 'Sarah Williams',
    createdDate: '2025-02-15',
    lastModified: '2025-03-08',
    steps: [
      {
        id: 'step-1',
        name: 'Damage Assessment & Photo Documentation',
        description: 'Driver photographs damage',
        assignedRole: 'Driver',
        estimatedDuration: '15 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Fleet Manager Review',
        description: 'Fleet manager assesses damage and provides repair estimate',
        assignedRole: 'Fleet Manager',
        estimatedDuration: '30 minutes',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: false,
          notifyGroups: ['Safety Coordinator'],
          additionalRecipients: [],
          emailTemplate: 'Action Required',
        },
      },
      {
        id: 'step-3',
        name: 'Parent Notification & Restitution',
        description: 'Contact parents and discuss restitution for damages',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '45 minutes',
        required: true,
        order: 3,
        status: 'Not Started',
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: false,
          additionalRecipients: [],
        },
      },
      {
        id: 'step-4',
        name: 'Disciplinary Action',
        description: 'Implement disciplinary measures per district policy',
        assignedRole: 'School Principal',
        estimatedDuration: '20 minutes',
        required: true,
        order: 4,
        status: 'Not Started',
        requiresApproval: true,
        approvers: ['Administrator'],
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: true,
          notifyGroups: ['Safety Coordinator'],
          additionalRecipients: [],
          emailTemplate: 'Action Required',
        },
      },
      {
        id: 'step-5',
        name: 'Repair Scheduling',
        description: 'Schedule and complete vehicle repairs',
        assignedRole: 'Fleet Manager',
        estimatedDuration: '2 hours',
        required: true,
        order: 5,
        status: 'Not Started',
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: false,
          notifyGroups: ['Safety Coordinator'],
          additionalRecipients: [],
          emailTemplate: 'Action Required',
        },
      },
      {
        id: 'step-6',
        name: 'Documentation & Close',
        description: 'Complete incident documentation and close case',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '20 minutes',
        required: true,
        order: 6,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // PROHIBITED ITEMS
  // ─────────────────────────────────────────────
  {
    id: 'WF-003',
    name: 'Prohibited Items Response',
    ownerRole: 'Administrator',
    description: 'Workflow for handling possession of prohibited items including tobacco, harmful items, illegal substances, and inappropriate materials',
    incidentTypes: ['Weapon / Prohibited Items'],
    severityLevels: ['Critical'],
    isActive: true,
    createdBy: 'Sarah Williams',
    createdDate: '2025-02-28',
    lastModified: '2025-03-16',
    steps: [
      {
        id: 'step-1',
        name: 'Confiscation & Secure',
        description: 'Driver safely confiscates item (if possible) and secures it; do not handle weapons or suspected drugs directly-contact dispatch',
        assignedRole: 'Driver',
        estimatedDuration: '15 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Submit Incident Report',
        description: 'Driver submits the incident details, what occurred, the prohibited item involved, and how it was confiscated or secured, through the tablet app. Submitting the report notifies the safety coordinator.',
        assignedRole: 'Driver',
        estimatedDuration: '15 minutes',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-3',
        name: 'Parent Notification',
        description: 'Contact parent/guardian to inform them of the prohibited item and policy violation',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '20 minutes',
        required: true,
        order: 3,
        status: 'Not Started',
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: false,
          additionalRecipients: [],
        },
      },
      {
        id: 'step-4',
        name: 'Disciplinary & Legal Action Review',
        description: 'Determine appropriate disciplinary action per district policy; coordinate with law enforcement if applicable',
        assignedRole: 'Administrator',
        estimatedDuration: '45 minutes',
        required: true,
        order: 4,
        status: 'Not Started',
        requiresApproval: true,
        approvers: ['Administrator'],
        trigger: { type: 'manual' },
        emailNotifications: {
          notifyOnStart: false,
          notifyOnComplete: true,
          notifyAssignee: true,
          notifyApprovers: true,
          notifyGroups: ['Safety Coordinator'],
          additionalRecipients: [],
          emailTemplate: 'Action Required',
        },
      },
      {
        id: 'step-5',
        name: 'Documentation & Close',
        description: 'Complete all documentation including evidence chain of custody if applicable, and close case',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '20 minutes',
        required: true,
        order: 5,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // INFORMATIONAL, WITNESS / BYSTANDER
  // ─────────────────────────────────────────────
  {
    id: 'WF-006',
    name: 'Witness / Bystander Statement',
    ownerRole: 'Safety Coordinator',
    description: 'Non-disciplinary workflow for capturing the account of a student who witnessed or tried to help during another incident. No disciplinary action is taken; the statement is recorded and linked to the related incident.',
    incidentTypes: ['Witness / Bystander Statement'],
    severityLevels: ['Low'],
    isActive: true,
    createdBy: 'Sarah Williams',
    createdDate: '2026-06-18',
    lastModified: '2026-06-18',
    steps: [
      {
        id: 'step-1',
        name: 'Record Witness Statement',
        description: 'Driver or staff records the witness/bystander account of what they saw or how they helped. No fault is assigned to this student.',
        assignedRole: 'Driver',
        estimatedDuration: '10 minutes',
        required: false,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // EMPLOYEE, CONDUCT AND INJURY
  // Routed to the administrator rather than a school principal,
  // since there is no student and no parent to notify.
  // ─────────────────────────────────────────────
  {
    id: 'WF-007',
    name: 'Employee Conduct Review',
    ownerRole: 'Administrator',
    description: 'Workflow for incidents between employees, such as an altercation or a policy violation. Routed to the administrator rather than a school, with no parent notification and no student discipline.',
    incidentTypes: ['Employee Altercation', 'Employee Misconduct', 'Employee Substance Violation'],
    severityLevels: ['Critical', 'High', 'Medium'],
    isActive: true,
    createdBy: 'Sarah Williams',
    createdDate: '2026-08-11',
    lastModified: '2026-08-11',
    steps: [
      {
        id: 'step-1',
        name: 'Separate and Secure',
        description: 'Supervisor separates the employees involved, removes them from duty if needed, and confirms nobody requires medical attention.',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '15 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Statement Collection',
        description: 'Collect a written account from each employee involved and from any witnesses. Statements are kept with the incident record.',
        assignedRole: 'Administrator',
        estimatedDuration: '45 minutes',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-3',
        name: 'Administrative Review',
        description: 'The administrator reviews the statements, determines whether policy was violated, and decides on any corrective action.',
        assignedRole: 'Administrator',
        estimatedDuration: '3 business days',
        required: true,
        order: 3,
        status: 'Not Started',
        requiresApproval: true,
        trigger: { type: 'manual' },
      },
      {
        id: 'step-4',
        name: 'Outcome and Return to Duty',
        description: 'Record the outcome, communicate it to the employees involved, and confirm return-to-duty status.',
        assignedRole: 'Administrator',
        estimatedDuration: '1 business day',
        required: true,
        order: 4,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },
  {
    id: 'WF-008',
    name: 'Employee Injury Report',
    ownerRole: 'Administrator',
    description: 'Workflow for an employee injured on duty. Covers first aid, incident reporting, and the workers compensation hand-off.',
    incidentTypes: ['Employee Injury'],
    severityLevels: ['Critical', 'High', 'Medium'],
    isActive: true,
    createdBy: 'Sarah Williams',
    createdDate: '2026-08-11',
    lastModified: '2026-08-11',
    steps: [
      {
        id: 'step-1',
        name: 'First Aid and Medical Attention',
        description: 'Provide first aid and arrange medical evaluation. Record whether the employee declined treatment.',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '30 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Injury Report Filed',
        description: 'Complete the injury report with the mechanism of injury, location, and any equipment involved.',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '45 minutes',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-3',
        name: 'Workers Compensation Hand-off',
        description: 'The administrator opens the workers compensation claim and tracks any lost time.',
        assignedRole: 'Administrator',
        estimatedDuration: '1 business day',
        required: true,
        order: 3,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // LOCATION
  // Routed to the administrator. Deliberately NOT reusing WF-004 Property Damage,
  // whose later steps are parent restitution and principal discipline.
  // ─────────────────────────────────────────────
  {
    id: 'WF-009',
    name: 'Location Issue Response',
    ownerRole: 'Administrator',
    description: 'Workflow for a depot, garage, or yard problem such as a burst pipe, power loss, or damage. Routed to the administrator, with no student or parent involvement.',
    incidentTypes: ['Location Damage', 'Utility Failure', 'Location Safety Hazard'],
    severityLevels: ['Critical', 'High', 'Medium', 'Low'],
    isActive: true,
    createdBy: 'Mike Chen',
    createdDate: '2026-08-11',
    lastModified: '2026-08-11',
    steps: [
      {
        id: 'step-1',
        name: 'Make Area Safe',
        description: 'Cone off or otherwise isolate the affected area and take any equipment out of service. Confirm nobody is at risk.',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '20 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Site Assessment',
        description: 'The administrator inspects the issue, records the extent, and determines whether an outside contractor is needed.',
        assignedRole: 'Administrator',
        estimatedDuration: '4 hours',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-3',
        name: 'Repair Scheduled',
        description: 'Schedule the repair, either in house or with a contractor, and record the expected completion date.',
        assignedRole: 'Administrator',
        estimatedDuration: '1 business day',
        required: true,
        order: 3,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-4',
        name: 'Verify and Return to Service',
        description: 'Confirm the repair is complete and return the affected area or equipment to service.',
        assignedRole: 'Administrator',
        estimatedDuration: '30 minutes',
        required: true,
        order: 4,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // VEHICLE
  // Routed to the fleet manager. Nobody aboard, so no statements to collect.
  // ─────────────────────────────────────────────
  {
    id: 'WF-010',
    name: 'Vehicle Damage and Mechanical Response',
    ownerRole: 'Fleet Manager',
    description: 'Workflow for vehicle damage or a mechanical fault with nobody aboard. Routed to the fleet manager, with the mechanic performing inspection and repair.',
    incidentTypes: ['Vehicle Damage', 'Mechanical Failure', 'Single Vehicle Collision'],
    severityLevels: ['Critical', 'High', 'Medium', 'Low'],
    isActive: true,
    createdBy: 'Mike Chen',
    createdDate: '2026-08-11',
    lastModified: '2026-08-11',
    steps: [
      {
        id: 'step-1',
        name: 'Take Out of Service and Document',
        description: 'Remove the vehicle from service and photograph the damage or record the fault found during inspection.',
        assignedRole: 'Fleet Manager',
        estimatedDuration: '30 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Maintenance Inspection and Estimate',
        description: 'Inspect the vehicle, determine the cause where possible, and produce a repair estimate.',
        assignedRole: 'Fleet Manager',
        estimatedDuration: '1 business day',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-3',
        name: 'Cause Review',
        description: 'Review yard camera footage or driver logs where the cause is unknown, to establish whether the damage is attributable.',
        assignedRole: 'Fleet Manager',
        estimatedDuration: '2 business days',
        required: false,
        order: 3,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-4',
        name: 'Repair and Return to Service',
        description: 'Complete the repair, pass inspection, and return the vehicle to service.',
        assignedRole: 'Fleet Manager',
        estimatedDuration: '3 business days',
        required: true,
        order: 4,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },

  // ─────────────────────────────────────────────
  // THIRD PARTY
  // Collision or conduct involving someone outside the district. Carries an
  // insurance and claims path a student workflow has no need for.
  // ─────────────────────────────────────────────
  {
    id: 'WF-011',
    name: 'Third Party Incident Response',
    ownerRole: 'Safety Coordinator',
    description: 'Workflow for a collision, injury, or conduct incident involving someone outside the district. Covers scene safety, information exchange, and the insurance claim.',
    incidentTypes: ['Third Party Collision', 'Third Party Injury', 'Third Party Conduct'],
    severityLevels: ['Critical', 'High', 'Medium'],
    isActive: true,
    createdBy: 'Sarah Williams',
    createdDate: '2026-08-11',
    lastModified: '2026-08-11',
    steps: [
      {
        id: 'step-1',
        name: 'Scene Safety and Emergency Services',
        description: 'Secure the scene, check for injuries, and contact police or emergency services if required.',
        assignedRole: 'Driver',
        estimatedDuration: '20 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Information Exchange and Documentation',
        description: 'Exchange insurance and contact information, photograph the scene, and record the police report reference.',
        assignedRole: 'Driver',
        estimatedDuration: '30 minutes',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-3',
        name: 'Safety Review',
        description: 'The safety coordinator reviews the account and documentation and determines whether the driver is cleared to continue.',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '4 hours',
        required: true,
        order: 3,
        status: 'Not Started',
        requiresApproval: true,
        trigger: { type: 'manual' },
      },
      {
        id: 'step-4',
        name: 'Insurance Claim Filed',
        description: 'File the claim with the district insurer and track it to resolution.',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '2 business days',
        required: true,
        order: 4,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },
  {
    id: 'WF-012',
    name: 'Public Complaint Review',
    ownerRole: 'Safety Coordinator',
    description: 'Non-disciplinary workflow for logging and responding to a complaint from a parent, resident, or member of the public.',
    incidentTypes: ['Public Complaint'],
    severityLevels: ['Low', 'Medium'],
    isActive: true,
    createdBy: 'Sarah Williams',
    createdDate: '2026-08-11',
    lastModified: '2026-08-11',
    steps: [
      {
        id: 'step-1',
        name: 'Log Complaint',
        description: 'Record the complaint, who raised it, and what they are asking for.',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '15 minutes',
        required: true,
        order: 1,
        status: 'In Progress',
        trigger: { type: 'manual' },
      },
      {
        id: 'step-2',
        name: 'Investigate and Respond',
        description: 'Review the route, vehicle, or driver as relevant and respond to the complainant with the outcome.',
        assignedRole: 'Safety Coordinator',
        estimatedDuration: '2 business days',
        required: true,
        order: 2,
        status: 'Not Started',
        trigger: { type: 'manual' },
      },
    ],
  },

];

// ─────────────────────────────────────────────
// WORKFLOW ASSIGNMENT & HELPER FUNCTIONS
// ─────────────────────────────────────────────

// Maps legacy/pre-consolidation incident type labels to the current 5 canonical types
const LEGACY_TYPE_MAP: Record<string, string> = {
  'Harassment / Bullying': 'Disruptive Behavior',
  'Offensive Language': 'Disruptive Behavior',
  'Excessive Noise / Disruption': 'Disruptive Behavior',
  'Defiance of Driver': 'Disruptive Behavior',
  'Unauthorized Device Usage': 'Disruptive Behavior',
  'Seat / Seatbelt Refusal': 'Safety Violation',
  'Unsafe Movement': 'Safety Violation',
  'Window Misuse': 'Safety Violation',
  'Emergency Exit Misuse': 'Safety Violation',
  'Wrong Stop Exit': 'Safety Violation',
  'Eating / Drinking': 'Safety Violation',
  'Physical Assault': 'Physical Altercation',
  'Fighting': 'Physical Altercation',
  'Throwing Objects': 'Physical Altercation',
  'Verbal Threats': 'Physical Altercation',
  'Vandalism': 'Property Damage',
  'Bus Damage': 'Property Damage',
  'Personal Property Damage': 'Property Damage',
  'Weapon Possession': 'Weapon / Prohibited Items',
  'Prohibited Items': 'Weapon / Prohibited Items',
  'Tobacco / Vaping': 'Weapon / Prohibited Items',
  'Illegal Substances': 'Weapon / Prohibited Items',
};

// Function to automatically assign workflow based on incident type and severity
export function assignWorkflowToIncident(incidentType: string, severity: string): Workflow | null {
  // Normalise severity to title-case so callers can pass "low", "Low", "LOW", etc.
  const normSeverity = severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();

  // Normalise legacy type names to the current canonical 5
  const normType = LEGACY_TYPE_MAP[incidentType] ?? incidentType;

  // 1. Try exact match on type AND severity (ideal path)
  let matchingWorkflow = workflows.find(
    (workflow) =>
      workflow.isActive &&
      workflow.incidentTypes.includes(normType) &&
      workflow.severityLevels.includes(normSeverity)
  );

  // 2. If the severity didn't match but the type DID, still use that workflow.
  //    The workflow is determined by the incident type; severity is informational.
  if (!matchingWorkflow) {
    matchingWorkflow = workflows.find(
      (workflow) =>
        workflow.isActive &&
        workflow.incidentTypes.includes(normType)
    );
  }

  if (!matchingWorkflow) return null;

  return {
    ...matchingWorkflow,
    active: true,
    steps: matchingWorkflow.steps.map((step) => ({
      ...step,
      status: 'Not Started',
      completedDate: undefined,
      completedBy: undefined,
      comments: undefined,
    })),
  };
}

// Give every step a status and make sure an incomplete workflow has an actionable step.
// Only the Physical Altercation template seeds statuses in this file, so without this the
// other workflows arrive with status undefined, nothing reads as 'In Progress', and the
// detail page has no step to work.
export function normalizeStepStatuses(steps: WorkflowStep[]): WorkflowStep[] {
  const withStatus = steps.map((step) => ({
    ...step,
    status: step.status ?? ('Not Started' as const),
  }));

  const hasActionableStep = withStatus.some(
    (step) => step.status === 'In Progress' || step.status === 'Pending Approval'
  );
  if (hasActionableStep) return withStatus;

  const firstOpenIndex = withStatus.findIndex((step) => step.status !== 'Completed');
  if (firstOpenIndex === -1) return withStatus;

  return withStatus.map((step, index) =>
    index === firstOpenIndex ? { ...step, status: 'In Progress' as const } : step
  );
}

// Same workflow with its step statuses normalized
export function withNormalizedSteps(workflow: Workflow | null): Workflow | null {
  if (!workflow) return null;
  return { ...workflow, steps: normalizeStepStatuses(workflow.steps) };
}

// Check if a workflow instance is currently active
export function isWorkflowActive(workflow: Workflow | null): boolean {
  if (!workflow) return false;
  
  // Check if explicitly set to active
  if (workflow.active !== undefined) {
    return workflow.active;
  }
  
  // Fallback: workflow is active if it has steps in progress or pending
  const hasActiveSteps = workflow.steps.some(
    (step) => step.status === 'In Progress' || step.status === 'Pending Approval'
  );
  
  // Not active if all steps are completed
  const allCompleted = workflow.steps.every((step) => step.status === 'Completed');
  
  return hasActiveSteps || !allCompleted;
}

// Mark workflow as completed (inactive)
export function completeWorkflow(workflow: Workflow): Workflow {
  return {
    ...workflow,
    active: false,
  };
}

// Get workflow progress percentage
export function getWorkflowProgress(steps: WorkflowStep[]): number {
  const completedSteps = steps.filter((step) => step.status === 'Completed').length;
  return Math.round((completedSteps / steps.length) * 100);
}

// Get current active step
export function getCurrentStep(steps: WorkflowStep[]): WorkflowStep | null {
  // Find first step that's not completed
  return steps.find((step) => step.status !== 'Completed') || null;
}

// Helper: get the workflow that covers a given incident type label
export function getWorkflowForIncidentType(incidentTypeLabel: string): Workflow | undefined {
  return workflows.find(
    (wf) => wf.incidentTypes.includes(incidentTypeLabel)
  );
}

// Helper: list all incident type labels that have NO dedicated workflow (should be empty if coverage is complete)
export function getUncoveredIncidentTypes(allTypeLabels: string[]): string[] {
  return allTypeLabels.filter(
    (label) => !workflows.some((wf) => wf.incidentTypes.includes(label))
  );
}
