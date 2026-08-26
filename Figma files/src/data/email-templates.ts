// Shared Email Template definitions used by Admin and Workflow configuration.
//
// The text is fixed. Nothing is pulled from the incident, so every mail is a
// prompt to sign in and look rather than a carrier of detail. There is no
// placeholder substitution anywhere: what is written here is what sends.

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  category: 'Notification' | 'Approval';
  lastModified: string;
  isDefault: boolean;
}

// IDs are assigned sequentially in alphabetical order by template name.
export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'ET-001',
    name: 'Action Required',
    description: 'Sent to the people holding the step\u2019s role when a step needs attention.',
    subject: 'Action required in the Incident Tracker',
    body: 'A workflow step in the Incident Tracker is assigned to your role and needs attention.\n\nSign in to Incidents and open your assigned incidents to see what is waiting.',
    category: 'Notification',
    lastModified: '2026-08-26',
    isDefault: true,
  },
  {
    id: 'ET-002',
    name: 'Approval Needed',
    description: 'Sent to the approver roles selected on the step.',
    subject: 'Approval needed in the Incident Tracker',
    body: 'A workflow step in the Incident Tracker is waiting for your approval.\n\nSign in to Incidents and open your assigned incidents to approve the step or send it back for revision.',
    category: 'Approval',
    lastModified: '2026-08-26',
    isDefault: true,
  },
  {
    id: 'ET-003',
    name: 'Parent or Guardian Notification',
    // No student name, date, time, incident type or severity. Mail is not a
    // private channel and often lands on a shared account, so the specifics
    // belong in the conversation that follows. Student incidents only.
    description: 'Sent to the guardians of a student named on the incident. Student incidents only, and it carries no details about what happened.',
    subject: 'Transportation incident involving your student',
    body: 'Your student was involved in an incident.\n\nSomeone from the transportation team will contact you to go through what happened. If you would like to reach us first, please call the transportation office.',
    category: 'Notification',
    lastModified: '2026-08-26',
    isDefault: true,
  },
];
