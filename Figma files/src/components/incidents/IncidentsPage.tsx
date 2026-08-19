import { useState, useEffect, useRef, useMemo } from 'react';
import { ForgeCard, ForgeButton, ForgeIconButton, useForgeToast } from '@tylertech/forge-react';
import {
  defineCardComponent,
  defineDialogComponent,
  defineTextFieldComponent,
  defineButtonComponent,
  defineBadgeComponent,
  defineAutocompleteComponent,
  defineIconComponent,
  defineIconButtonComponent,
} from '@tylertech/forge';
defineCardComponent();
defineDialogComponent();
defineTextFieldComponent();
defineButtonComponent();
defineBadgeComponent();
defineAutocompleteComponent();
defineIconComponent();
defineIconButtonComponent();
import { ForgeMultiSelect } from '../ui/forge-multiselect';
import { EditIncidentDialog } from './EditIncidentDialog';
import { NewIncidentForm } from './NewIncidentForm';
import { hasActiveCommunication } from '../communications/communicationsData';
import { assignWorkflowToIncident, Workflow, workflows } from '../../data/workflows';
import { ExportDropdown } from '../shared/ExportDropdown';
import type { ExportFormat } from '../shared/ExportDropdown';
import { EntitySearchField } from '../shared/EntitySearchField';
import {
  INCIDENT_TYPES,
  INCIDENT_SUBJECTS,
  getSubjectLabel,
  getSubjectMeta,
  type IncidentSubject,
} from './IncidentTypes';

// Get default workflow for direct reference

const severityTheme = (severity: string): string => {
  switch (severity) {
    case 'Critical': return 'danger';
    case 'High': return 'error';
    case 'Medium': return 'warning';
    case 'Low': return 'info';
    default: return 'default';
  }
};
const statusTheme = (status: string): string => {
  switch (status) {
    case 'Open': return 'info-primary';
    case 'In Progress': return 'warning';
    case 'Closed': return 'default';
    default: return 'default';
  }
};

const rawIncidents = [
  {
    // Filed from the driver tablet (Tyler Drive) after the PM run — used for the
    // tablet → desktop hand-off demo. Each student's own account is captured in
    // their per-student `description` (the driver-captured student statement).
    id: 'INC-2025-0064',
    date: '2025-03-11',
    student: 'Marcus Johnson',
    studentId: 'STU-3421',
    type: 'Physical Altercation',
    description: 'Two students argued over a seat in the back row on the PM run; one shoved the other into the seat back. Separated immediately, no injuries observed. Both students held at the school until parent pickup. Report filed from the bus tablet after the route was safely completed.',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Gabe Guzman',
    severity: 'High',
    status: 'Open',
    createdBy: 'Gabe Guzman',
    assignedTo: 'Sarah Williams',
    location: 'parking-lot',
    witnessPresent: true,
    witnessNames: ['Aide D. Carter'],
    tags: ['filed-from-tablet', 'after-route', 'parent-notified'],
    involvedStudents: [
      { studentId: 'STU-3421', name: 'Marcus Johnson', role: 'Instigator', severity: 'High', parentNotified: true, description: '"He took my seat and wouldn\'t move when I asked, so I pushed him. I know I shouldn\'t have put my hands on him, but he grabbed my backpack first."', actionTaken: 'Separated and held at school pending pickup. Parent contacted same day by driver.', notes: 'Student account captured on the tablet at the scene. No prior altercations on record.' },
      { studentId: 'STU-1045', name: 'Ethan Lee', role: 'Victim', severity: 'Medium', parentNotified: true, description: '"Marcus shoved me into the seat when I sat down. I didn\'t do anything to him. My shoulder is fine, I don\'t need the nurse."', actionTaken: 'Checked for injury — none reported. Offered seat reassignment for return route. Parent notified.', notes: 'Student account captured on the tablet at the scene. Declined nurse evaluation.' },
    ],
  },
  {
    id: 'INC-2025-0063',
    date: '2025-03-05',
    student: 'Marcus Johnson',
    studentId: 'STU-3421',
    type: 'Weapon / Prohibited Items',
    description: 'Student was found in possession of a folding knife during a routine bag check at the school pick-up stop. Student refused to surrender the item and became verbally aggressive. Police were notified and responded to the scene. Student was removed from the bus and held pending parent/guardian arrival.',
    bus: 'Bus 15',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Critical',
    status: 'Open',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Sarah Williams',
    location: 'bus-stop',
    locationCoordinates: { lat: 42.7106, lng: -73.8132 },
    locationAddress: 'Wolf Rd & Central Ave, Albany, NY 12205',
    witnessPresent: true,
    witnessNames: ['Officer J. Rodriguez (ACPD)', 'Dana Lee (Bus Aide)'],
    tags: ['police-involved', 'weapon', 'parent-notified'],
    documents: [
      {
        id: 'doc-crit-1',
        name: 'Police-Report-Ref-2025-0443.pdf',
        size: '312 KB',
        type: 'application/pdf',
        uploadedBy: 'Sarah Williams',
        uploadedAt: '2025-03-05 04:10 PM'
      },
      {
        id: 'doc-crit-2',
        name: 'Witness-Statement-Driver.pdf',
        size: '88 KB',
        type: 'application/pdf',
        uploadedBy: 'Lisa Anderson',
        uploadedAt: '2025-03-05 03:55 PM'
      }
    ],
  },
  {
    id: 'INC-2025-0062',
    date: '2025-02-26',
    student: 'Justin Rivera',
    studentId: 'STU-1894',
    type: 'Safety Violation',
    description: 'Moved seats without permission',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'John Chen',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0061',
    date: '2025-02-27',
    student: 'Kayla Bailey',
    studentId: 'STU-9783',
    type: 'Disruptive Behavior',
    description: 'Spreading rumors and excluding another student',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'High',
    status: 'Open',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Sarah Williams',
    location: 'on-bus',
    witnessPresent: false,
    tags: ['harassment', 'bullying', 'repeat-offender'],
    involvedStudents: [
      { studentId: 'STU-9783', name: 'Kayla Bailey', role: 'Instigator', severity: 'High', parentNotified: true, description: 'Verbally mocked Emma\'s appearance and encouraged others to exclude her from the seating area. Incident reported by driver after observing repeated targeted comments.', actionTaken: 'Verbal warning issued. Parent contacted by phone. Written behavior contract discussed.', notes: 'Second harassment-related incident this semester. Escalation to administration recommended if behavior continues.' },
      { studentId: 'STU-1956', name: 'Emma Rodriguez', role: 'Victim', severity: 'Medium', parentNotified: true, incidentTypeOverride: 'Safety Violation', description: 'Targeted by Kayla\'s remarks about appearance and intentionally excluded from peer group seating. Visibly distressed when driver intervened.', actionTaken: 'Check-in conversation with driver. Offered seat change. Parent notified and expressed concern.', notes: 'Student requested seat reassignment for remainder of route.' },
      { studentId: 'STU-5349', name: 'Alexis Morgan', role: 'Participant', severity: 'Medium', parentNotified: false, description: 'Joined in excluding Emma from the seating group; did not initiate but laughed and participated in exclusionary behavior.', actionTaken: 'Verbal warning issued. Parent contact pending.', notes: '' },
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'Witness-Statement-Form.pdf',
        size: '245 KB',
        type: 'application/pdf',
        uploadedBy: 'Lisa Anderson',
        uploadedAt: '2025-02-27 02:45 PM'
      },
      {
        id: 'doc-2',
        name: 'Student-Behavior-Policy.pdf',
        size: '1.2 MB',
        type: 'application/pdf',
        uploadedBy: 'Sarah Williams',
        uploadedAt: '2025-02-28 09:15 AM'
      }
    ]
  },
  {
    id: 'INC-2025-0060',
    date: '2025-02-28',
    student: 'Nathan Richardson',
    studentId: 'STU-8672',
    type: 'Disruptive Behavior',
    description: 'Playing videos on phone at high volume',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'David Park',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0059',
    date: '2025-03-01',
    student: 'Brianna Cooper',
    studentId: 'STU-7561',
    type: 'Physical Altercation',
    description: 'Hit another student with backpack',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Jennifer Martinez',
    severity: 'High',
    status: 'Open',
    createdBy: 'Jennifer Martinez',
    assignedTo: 'Sarah Williams',
    location: 'on-bus',
    locationCoordinates: { lat: 42.6889, lng: -73.8009 },
    locationAddress: 'Lincoln Elementary, 200 Green St, Albany, NY 12202',
    witnessPresent: true,
    witnessNames: ['Chris Park (STU-3890)', 'Jennifer Martinez (Driver)'],
    tags: ['physical', 'bus-suspension'],
    involvedStudents: [
      { studentId: 'STU-7561', name: 'Brianna Cooper', role: 'Instigator', severity: 'High', parentNotified: true, description: 'Struck Andrew Rogers across the shoulder with her backpack after an argument over seating. Action appeared intentional based on driver\'s account.', actionTaken: 'Removed from bus pending review. Parent contacted same day. 3-day bus suspension issued.', notes: 'No prior incidents on record. Parent cooperative during contact.' },
      { studentId: 'STU-2016', name: 'Andrew Rogers', role: 'Victim', severity: 'Medium', parentNotified: true, incidentTypeOverride: 'Safety Violation', description: 'Struck on shoulder and upper back by Brianna\'s backpack. Reported minor pain but declined nurse referral.', actionTaken: 'Parent contacted and informed of incident. Offered seat change on return route.', notes: 'Student indicated incident was unprovoked.' },
      { studentId: 'STU-3890', name: 'Chris Park', role: 'Bystander', severity: 'Low', parentNotified: false, noWorkflow: true, description: 'Seated nearby when the altercation occurred. Did not participate. Appeared visibly unsettled after the incident.', actionTaken: 'Check-in conversation with driver. Offered seat reassignment for return route.', notes: 'Student mentioned feeling nervous. Counselor follow-up suggested.' },
    ],
    photos: [
      {
        id: 'photo-7',
        url: 'https://images.unsplash.com/photo-1764083029045-4c45c365b710?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1764083029045-4c45c365b710?w=200&h=150&fit=crop',
        uploadedBy: 'Jennifer Martinez',
        uploadedAt: '2025-03-01 07:42 AM',
        caption: 'Altercation location on bus'
      }
    ],
    documents: [
      {
        id: 'doc-7',
        name: 'Incident-Report-Physical.pdf',
        size: '178 KB',
        type: 'application/pdf',
        uploadedBy: 'Jennifer Martinez',
        uploadedAt: '2025-03-01 08:15 AM'
      },
      {
        id: 'doc-8',
        name: 'Student-Injury-Assessment.pdf',
        size: '92 KB',
        type: 'application/pdf',
        uploadedBy: 'Sarah Williams',
        uploadedAt: '2025-03-01 10:30 AM'
      }
    ]
  },
  {
    id: 'INC-2025-0058',
    date: '2025-03-02',
    student: 'Dylan Bell',
    studentId: 'STU-6450',
    type: 'Disruptive Behavior',
    description: 'Using inappropriate language with other students',
    bus: 'Bus 14',
    route: 'Roosevelt High AM - Red',
    driver: 'Robert Thompson',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'Robert Thompson',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0057',
    date: '2025-03-03',
    student: 'Alexis Morgan',
    studentId: 'STU-5349',
    type: 'Safety Violation',
    description: 'Eating messy food and leaving trash on floor',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Medium',
    status: 'Open',
    createdBy: 'John Chen',
    assignedTo: 'Sarah Williams',
    photos: [
      {
        id: 'photo-8',
        url: 'https://images.unsplash.com/photo-1764083029045-4c45c365b710?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1764083029045-4c45c365b710?w=200&h=150&fit=crop',
        uploadedBy: 'John Chen',
        uploadedAt: '2025-03-03 07:52 AM',
        caption: 'Food debris on floor'
      }
    ]
  },
  {
    id: 'INC-2025-0056',
    date: '2025-03-04',
    student: 'Jacob Cook',
    studentId: 'STU-4238',
    type: 'Safety Violation',
    description: 'Hanging arm out window while bus moving',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Medium',
    status: 'In Progress',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Jane Doe',
    photos: [
      {
        id: 'photo-9',
        url: 'https://images.unsplash.com/photo-1764083029047-6c9b160d3554?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1764083029047-6c9b160d3554?w=200&h=150&fit=crop',
        uploadedBy: 'Lisa Anderson',
        uploadedAt: '2025-03-04 03:15 PM',
        caption: 'Student at window'
      }
    ],
    documents: [
      {
        id: 'doc-9',
        name: 'Safety-Violation-Window.pdf',
        size: '134 KB',
        type: 'application/pdf',
        uploadedBy: 'Lisa Anderson',
        uploadedAt: '2025-03-04 03:20 PM'
      }
    ]
  },
  {
    id: 'INC-2025-0055',
    date: '2025-03-05',
    student: 'Samantha Reed',
    studentId: 'STU-3127',
    type: 'Property Damage',
    description: 'Drew on window with marker',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'Medium',
    status: 'Open',
    createdBy: 'David Park',
    assignedTo: 'Sarah Williams',
    photos: [
      {
        id: 'photo-10',
        url: 'https://images.unsplash.com/photo-1708831736377-9387cd8dec1c?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1708831736377-9387cd8dec1c?w=200&h=150&fit=crop',
        uploadedBy: 'David Park',
        uploadedAt: '2025-03-05 08:05 AM',
        caption: 'Marker vandalism on window'
      }
    ],
    documents: [
      {
        id: 'doc-10',
        name: 'Vandalism-Report.pdf',
        size: '201 KB',
        type: 'application/pdf',
        uploadedBy: 'David Park',
        uploadedAt: '2025-03-05 08:10 AM'
      },
      {
        id: 'doc-11',
        name: 'Repair-Cost-Estimate.pdf',
        size: '67 KB',
        type: 'application/pdf',
        uploadedBy: 'Sarah Williams',
        uploadedAt: '2025-03-05 11:00 AM'
      }
    ]
  },
  {
    id: 'INC-2025-0054',
    date: '2025-03-06',
    student: 'Andrew Rogers',
    studentId: 'STU-2016',
    type: 'Disruptive Behavior',
    description: 'Yelling and making loud noises',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Jennifer Martinez',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'Jennifer Martinez',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0053',
    date: '2025-03-07',
    student: 'Hannah Morris',
    studentId: 'STU-1905',
    type: 'Disruptive Behavior',
    description: 'Making fun of another student repeatedly',
    bus: 'Bus 14',
    route: 'Roosevelt High AM - Red',
    driver: 'Robert Thompson',
    severity: 'Medium',
    status: 'Open',
    createdBy: 'Robert Thompson',
    assignedTo: 'Sarah Williams',
    involvedStudents: [
      { studentId: 'STU-1905', name: 'Hannah Morris', role: 'Instigator', severity: 'Medium', parentNotified: true, description: 'Repeatedly made comments mocking Samantha\'s clothing and lunch items over multiple route days. Driver confirmed pattern of behavior.', actionTaken: 'Verbal warning issued. Parent notified by phone.', notes: 'Pattern of repeated behavior noted. Monitor closely.' },
      { studentId: 'STU-3127', name: 'Samantha Reed', role: 'Victim', severity: 'Low', parentNotified: true, description: 'Recipient of repeated mocking comments from Hannah. Did not engage or retaliate. Appeared withdrawn during final incidents.', actionTaken: 'Counselor referral suggested. Parent notified.', notes: 'Parent expressed concern about ongoing nature; requested follow-up.' },
      { studentId: 'STU-6450', name: 'Dylan Bell', role: 'Bystander', severity: 'Low', parentNotified: false, description: 'Present during multiple incidents but did not participate. Did not intervene or report.', actionTaken: 'No formal action taken. Bystander awareness discussion encouraged.', notes: '' },
    ],
  },
  {
    id: 'INC-2025-0052',
    date: '2025-03-08',
    student: 'Tyler Stewart',
    studentId: 'STU-9894',
    type: 'Physical Altercation',
    description: 'Grabbed and pushed another student in argument',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'High',
    status: 'Open',
    createdBy: 'John Chen',
    assignedTo: 'Sarah Williams',
    involvedStudents: [
      { studentId: 'STU-9894', name: 'Tyler Stewart', role: 'Instigator', severity: 'High', parentNotified: true, description: 'Grabbed Justin by the arm and pushed him into the seat during a verbal argument. Driver intervened immediately.', actionTaken: 'Removed from bus pending review. Parent contacted same day. 2-day bus suspension issued.', notes: 'Tyler stated argument was over a prior dispute from school. Administration notified.' },
      { studentId: 'STU-1894', name: 'Justin Rivera', role: 'Victim', severity: 'Medium', parentNotified: true, description: 'Grabbed and pushed by Tyler during heated argument. Sustained minor bruising on arm. Did not retaliate.', actionTaken: 'Parent notified. Minor injury documented. Nurse evaluation recommended.', notes: 'Student requested seat moved away from Tyler on all future routes.' },
    ],
    photos: [
      {
        id: 'photo-11',
        url: 'https://images.unsplash.com/photo-1764083029045-4c45c365b710?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1764083029045-4c45c365b710?w=200&h=150&fit=crop',
        uploadedBy: 'John Chen',
        uploadedAt: '2025-03-08 07:58 AM',
        caption: 'Location of incident on bus'
      },
      {
        id: 'photo-12',
        url: 'https://images.unsplash.com/photo-1764703810989-1c69e849f8f3?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1764703810989-1c69e849f8f3?w=200&h=150&fit=crop',
        uploadedBy: 'John Chen',
        uploadedAt: '2025-03-08 07:59 AM',
        caption: 'View from driver position'
      }
    ],
    documents: [
      {
        id: 'doc-12',
        name: 'Physical-Altercation-Report.pdf',
        size: '189 KB',
        type: 'application/pdf',
        uploadedBy: 'John Chen',
        uploadedAt: '2025-03-08 08:30 AM'
      },
      {
        id: 'doc-13',
        name: 'Witness-Statements.pdf',
        size: '312 KB',
        type: 'application/pdf',
        uploadedBy: 'Sarah Williams',
        uploadedAt: '2025-03-08 02:15 PM'
      }
    ]
  },
  {
    id: 'INC-2025-0051',
    date: '2025-03-09',
    student: 'Natalie Collins',
    studentId: 'STU-8783',
    type: 'Disruptive Behavior',
    description: 'Directed profanity at driver when asked to quiet down',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'High',
    status: 'Open',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0050',
    date: '2025-03-10',
    student: 'Brandon Edwards',
    studentId: 'STU-7672',
    type: 'Safety Violation',
    description: 'Touched emergency exit release without permission',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'High',
    status: 'In Progress',
    createdBy: 'David Park',
    assignedTo: 'Jane Doe',
    photos: [
      {
        id: 'photo-13',
        url: 'https://images.unsplash.com/photo-1675853628373-f079f2ff0e52?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1675853628373-f079f2ff0e52?w=200&h=150&fit=crop',
        uploadedBy: 'David Park',
        uploadedAt: '2025-03-10 08:22 AM',
        caption: 'Emergency exit door'
      }
    ],
    documents: [
      {
        id: 'doc-14',
        name: 'Emergency-Exit-Incident.pdf',
        size: '167 KB',
        type: 'application/pdf',
        uploadedBy: 'David Park',
        uploadedAt: '2025-03-10 08:30 AM'
      },
      {
        id: 'doc-15',
        name: 'Safety-Protocol-Review.pdf',
        size: '543 KB',
        type: 'application/pdf',
        uploadedBy: 'Jane Doe',
        uploadedAt: '2025-03-10 01:45 PM'
      }
    ]
  },
  {
    id: 'INC-2025-0049',
    date: '2025-03-11',
    student: 'Chloe Evans',
    studentId: 'STU-6561',
    type: 'Safety Violation',
    description: 'Spilled juice on seat and floor',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Jennifer Martinez',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'Jennifer Martinez',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0048',
    date: '2025-03-12',
    student: 'Joshua Parker',
    studentId: 'STU-5450',
    type: 'Safety Violation',
    description: 'Refused assigned seat and sat in restricted area',
    bus: 'Bus 14',
    route: 'Roosevelt High AM - Red',
    driver: 'Robert Thompson',
    severity: 'Medium',
    status: 'Open',
    createdBy: 'Robert Thompson',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0047',
    date: '2025-03-13',
    student: 'Madison Turner',
    studentId: 'STU-4349',
    type: 'Safety Violation',
    description: 'Opening and closing window repeatedly',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'John Chen',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0046',
    date: '2025-03-14',
    student: 'Ryan Campbell',
    studentId: 'STU-3238',
    type: 'Property Damage',
    description: 'Carved initials into seat back',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Medium',
    status: 'In Progress',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0045',
    date: '2025-03-15',
    student: 'Grace Phillips',
    studentId: 'STU-2127',
    type: 'Disruptive Behavior',
    description: 'Repeatedly teasing younger student about appearance',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Jennifer Martinez',
    severity: 'High',
    status: 'Open',
    createdBy: 'Jennifer Martinez',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0044',
    date: '2025-03-16',
    student: 'Christopher Adams',
    studentId: 'STU-1016',
    type: 'Physical Altercation',
    description: 'Pushed another student causing minor injury',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'High',
    status: 'Open',
    createdBy: 'David Park',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0043',
    date: '2025-03-16',
    student: 'Victoria Martinez',
    studentId: 'STU-9905',
    type: 'Disruptive Behavior',
    description: 'Playing music loudly on phone without headphones',
    bus: 'Bus 14',
    route: 'Roosevelt High AM - Red',
    driver: 'Robert Thompson',
    severity: 'Medium',
    status: 'Open',
    createdBy: 'Robert Thompson',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0042',
    date: '2025-03-15',
    student: 'Sarah Mitchell',
    studentId: 'STU-2891',
    type: 'Safety Violation',
    description: 'Student refused to remain seated during transport',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Medium',
    status: 'Open',
    createdBy: 'John Chen',
    assignedTo: 'Sarah Williams',
    photos: [
      {
        id: 'photo-1',
        url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&h=150&fit=crop',
        uploadedBy: 'John Chen',
        uploadedAt: '2025-03-15 08:15 AM',
        caption: 'Student standing in aisle'
      },
      {
        id: 'photo-2',
        url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=200&h=150&fit=crop',
        uploadedBy: 'John Chen',
        uploadedAt: '2025-03-15 08:16 AM',
        caption: 'View from driver mirror'
      }
    ],
    documents: [
      {
        id: 'doc-3',
        name: 'Safety-Violation-Report.pdf',
        size: '156 KB',
        type: 'application/pdf',
        uploadedBy: 'John Chen',
        uploadedAt: '2025-03-15 08:20 AM'
      },
      {
        id: 'doc-4',
        name: 'Bus-Camera-Footage-Transcript.pdf',
        size: '89 KB',
        type: 'application/pdf',
        uploadedBy: 'Sarah Williams',
        uploadedAt: '2025-03-15 10:30 AM'
      },
      {
        id: 'doc-5',
        name: 'Parent-Notification-Letter.pdf',
        size: '124 KB',
        type: 'application/pdf',
        uploadedBy: 'Sarah Williams',
        uploadedAt: '2025-03-15 02:45 PM'
      },
      {
        id: 'doc-6',
        name: 'Student-Seating-Chart.xlsx',
        size: '45 KB',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedBy: 'John Chen',
        uploadedAt: '2025-03-15 08:25 AM'
      }
    ]
  },
  {
    id: 'INC-2025-0041',
    date: '2025-03-15',
    student: 'Marcus Johnson',
    studentId: 'STU-3421',
    type: 'Safety Violation',
    description: 'Student attempted to open emergency exit during normal transport',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'High',
    status: 'In Progress',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Jane Doe',
    photos: [
      {
        id: 'photo-3',
        url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=200&h=150&fit=crop',
        uploadedBy: 'Lisa Anderson',
        uploadedAt: '2025-03-15 03:42 PM',
        caption: 'Emergency exit door area'
      }
    ]
  },
  {
    id: 'INC-2025-0040',
    date: '2025-03-14',
    student: 'Emma Rodriguez',
    studentId: 'STU-1956',
    type: 'Disruptive Behavior',
    description: 'Verbal altercation with another student',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'High',
    status: 'Open',
    createdBy: 'David Park',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0039',
    date: '2025-03-14',
    student: 'James Thompson',
    studentId: 'STU-4782',
    type: 'Property Damage',
    description: 'Seat cushion torn - monetary restitution required',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'John Chen',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0038',
    date: '2025-03-13',
    student: 'Olivia Davis',
    studentId: 'STU-5623',
    type: 'Disruptive Behavior',
    description: 'Using profane and offensive language toward other students',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Medium',
    status: 'In Progress',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0037',
    date: '2025-03-12',
    student: 'Noah Wilson',
    studentId: 'STU-6891',
    type: 'Physical Altercation',
    description: 'Physical fight with another student',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'High',
    status: 'Open',
    createdBy: 'David Park',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0036',
    date: '2025-03-10',
    student: 'Sophia Garcia',
    studentId: 'STU-7234',
    type: 'Safety Violation',
    description: 'Student eating snacks and spilled drink on seat',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Robert Martinez',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'Robert Martinez',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0035',
    date: '2025-03-08',
    student: 'Liam Brown',
    studentId: 'STU-8512',
    type: 'Safety Violation',
    description: 'Opening windows excessively and throwing paper outside',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'John Chen',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0034',
    date: '2025-03-07',
    student: 'Ava Martinez',
    studentId: 'STU-9123',
    type: 'Disruptive Behavior',
    description: 'Excessive noise and screaming, disturbing driver',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'David Park',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0033',
    date: '2025-03-05',
    student: 'Ethan Lee',
    studentId: 'STU-1045',
    type: 'Safety Violation',
    description: 'Refused assigned seat and moved multiple times',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0032',
    date: '2025-02-28',
    student: 'Isabella White',
    studentId: 'STU-2387',
    type: 'Disruptive Behavior',
    description: 'Continued verbal harassment of younger student',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Robert Martinez',
    severity: 'High',
    status: 'Closed',
    createdBy: 'Robert Martinez',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0031',
    date: '2025-02-26',
    student: 'Mason Taylor',
    studentId: 'STU-3498',
    type: 'Disruptive Behavior',
    description: 'Repeated use of profanity despite warnings',
    bus: 'Bus 4',
    route: 'Eastside Middle AM - Teal',
    driver: 'Marcus Washington',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'Marcus Washington',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0030',
    date: '2025-02-24',
    student: 'Charlotte Anderson',
    studentId: 'STU-4561',
    type: 'Property Damage',
    description: 'Writing on seat backs with permanent marker',
    bus: 'Bus 6',
    route: 'Oakwood Elementary AM - Bronze',
    driver: 'Angela Foster',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'Angela Foster',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0029',
    date: '2025-02-21',
    student: 'Aiden Thomas',
    studentId: 'STU-5672',
    type: 'Physical Altercation',
    description: 'Pushing and shoving with another student in aisle',
    bus: 'Bus 11',
    route: 'Hillcrest High AM - Crimson',
    driver: 'Thomas Nguyen',
    severity: 'High',
    status: 'Closed',
    createdBy: 'Thomas Nguyen',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0028',
    date: '2025-02-19',
    student: 'Mia Jackson',
    studentId: 'STU-6783',
    type: 'Disruptive Behavior',
    description: 'Playing loud music from phone speaker',
    bus: 'Bus 5',
    route: 'Riverside Elementary AM - Violet',
    driver: 'Sandra Brooks',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'Sandra Brooks',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0027',
    date: '2025-02-15',
    student: 'Lucas Harris',
    studentId: 'STU-7894',
    type: 'Safety Violation',
    description: 'Tampering with emergency exit door mechanism',
    bus: 'Bus 10',
    route: 'Parkview Middle AM - Navy',
    driver: 'Derek Coleman',
    severity: 'High',
    status: 'Closed',
    createdBy: 'Derek Coleman',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0026',
    date: '2025-02-12',
    student: 'Harper Clark',
    studentId: 'STU-8905',
    type: 'Safety Violation',
    description: 'Spilled soda creating slipping hazard',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'David Park',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0025',
    date: '2025-02-10',
    student: 'Benjamin Lewis',
    studentId: 'STU-9016',
    type: 'Safety Violation',
    description: 'Standing in aisle during transport despite warnings',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0024',
    date: '2025-02-07',
    student: 'Amelia Robinson',
    studentId: 'STU-1127',
    type: 'Safety Violation',
    description: 'Hanging objects out window while bus moving',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Robert Martinez',
    severity: 'High',
    status: 'Closed',
    createdBy: 'Robert Martinez',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0023',
    date: '2025-02-05',
    student: 'Henry Walker',
    studentId: 'STU-2238',
    type: 'Disruptive Behavior',
    description: 'Directing profanity at driver',
    bus: 'Bus 4',
    route: 'Eastside Middle AM - Teal',
    driver: 'Marcus Washington',
    severity: 'High',
    status: 'Closed',
    createdBy: 'Marcus Washington',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0022',
    date: '2025-02-03',
    student: 'Evelyn Hall',
    studentId: 'STU-3349',
    type: 'Disruptive Behavior',
    description: 'Name-calling and mocking another student',
    bus: 'Bus 6',
    route: 'Oakwood Elementary AM - Bronze',
    driver: 'Angela Foster',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'Angela Foster',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0021',
    date: '2025-01-31',
    student: 'Alexander Young',
    studentId: 'STU-4450',
    type: 'Property Damage',
    description: 'Scratching window with metal object',
    bus: 'Bus 11',
    route: 'Hillcrest High AM - Crimson',
    driver: 'Thomas Nguyen',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'Thomas Nguyen',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0020',
    date: '2025-01-28',
    student: 'Abigail King',
    studentId: 'STU-5561',
    type: 'Disruptive Behavior',
    description: 'Yelling and screaming, refusing to quiet down',
    bus: 'Bus 10',
    route: 'Parkview Middle AM - Navy',
    driver: 'Derek Coleman',
    severity: 'Medium',
    status: 'Closed',
    createdBy: 'Derek Coleman',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0019',
    date: '2025-01-24',
    student: 'Daniel Wright',
    studentId: 'STU-6672',
    type: 'Physical Altercation',
    description: 'Kicked another student during argument',
    bus: 'Bus 4',
    route: 'Eastside Middle AM - Teal',
    driver: 'Marcus Washington',
    severity: 'High',
    status: 'Closed',
    createdBy: 'Marcus Washington',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0018',
    date: '2025-01-21',
    student: 'Emily Scott',
    studentId: 'STU-7783',
    type: 'Safety Violation',
    description: 'Eating messy food and littering wrappers',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'David Park',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0017',
    date: '2025-01-17',
    student: 'Matthew Green',
    studentId: 'STU-8894',
    type: 'Safety Violation',
    description: 'Changed seats multiple times causing disruption',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Low',
    status: 'Closed',
    createdBy: 'Lisa Anderson',
    assignedTo: 'Jane Doe',
  },

  // ─── Non-student incidents ─────────────────────────────────────────────────
  // These carry an explicit `subject` and deliberately have no `student` or
  // `studentId`. They exercise the four non-student subjects end to end: the
  // Involved column, the Subject filter, the involved-parties detail section,
  // and the studentless workflow assignment path.
  {
    id: 'INC-2025-0065',
    date: '2025-03-12',
    time: '06:40',
    subject: 'employee',
    type: 'Employee Altercation',
    description: 'Two drivers argued over a fuel island position during the morning pull-out and the dispute escalated to shoving before a supervisor intervened. No injuries. Both drivers were removed from the yard for the remainder of the shift pending review.',
    bus: 'N/A',
    route: 'N/A',
    severity: 'High',
    status: 'Open',
    createdBy: 'Sarah Williams',
    assignedTo: 'Sarah Williams',
    location: 'fuel-station',
    assetRef: 'Central Service Center',
    witnessPresent: true,
    witnessNames: ['Yard Supervisor R. Mills'],
    tags: ['hr-review'],
    involvedParties: [
      { partyType: 'employee', partyId: 'DRV-007', name: 'Lisa Anderson', role: 'Participant', severity: 'High', description: 'Stated the other driver cut in front of her at the fuel island after she had already staged.', actionTaken: 'Removed from yard for remainder of shift. Referred to HR review.', notes: 'No prior conduct incidents on record.' },
      { partyType: 'employee', partyId: 'DRV-008', name: 'David Park', role: 'Participant', severity: 'High', description: 'Stated he was waved forward by the fueling attendant and did not see the other bus staged.', actionTaken: 'Removed from yard for remainder of shift. Referred to HR review.', notes: 'Second conduct report this school year.' },
    ],
  },
  {
    id: 'INC-2025-0066',
    date: '2025-03-10',
    time: '05:15',
    subject: 'location',
    type: 'Utility Failure',
    description: 'A water supply line above the maintenance bay burst overnight and flooded roughly 400 square feet of the bay floor. Two lifts were taken out of service as a precaution. Facilities contractor called out the same morning.',
    bus: 'N/A',
    route: 'N/A',
    severity: 'Medium',
    status: 'In Progress',
    createdBy: 'Mike Chen',
    assignedTo: 'Mike Chen',
    location: 'maintenance-bay',
    assetRef: 'North District Garage',
    witnessPresent: false,
    tags: ['facilities', 'out-of-service'],
  },
  {
    id: 'INC-2025-0067',
    date: '2025-03-09',
    time: '06:05',
    subject: 'vehicle',
    type: 'Vehicle Damage',
    description: 'Bus 18 was found with a cracked passenger-side mirror housing and a scraped rear quarter panel during the morning pre-trip. Nobody was aboard at the time and no collision was reported the prior evening. Yard camera review requested.',
    bus: 'Bus 18',
    route: 'N/A',
    severity: 'Medium',
    status: 'Open',
    createdBy: 'Mike Chen',
    assignedTo: 'Mike Chen',
    location: 'yard',
    assetRef: 'Bus 18',
    witnessPresent: false,
    tags: ['maintenance', 'camera-review'],
  },
  {
    id: 'INC-2025-0068',
    date: '2025-03-07',
    time: '16:20',
    subject: 'thirdParty',
    type: 'Third Party Collision',
    description: 'A passenger vehicle failed to stop for the extended stop arm and clipped the front bumper of Bus 14 while the bus was stationary with no students aboard on the deadhead leg. Police responded and cited the other motorist. No injuries.',
    bus: 'Bus 14',
    route: 'Roosevelt High PM - Red',
    driver: 'Robert Thompson',
    severity: 'High',
    status: 'In Progress',
    createdBy: 'Robert Thompson',
    assignedTo: 'Sarah Williams',
    location: 'bus-stop',
    locationCoordinates: { lat: 42.6803, lng: -73.8259 },
    locationAddress: 'Central Ave & Colvin Ave, Albany, NY 12206',
    witnessPresent: true,
    witnessNames: ['Officer M. Reyes (APD)'],
    tags: ['police-involved', 'stop-arm-violation'],
    involvedParties: [
      { partyType: 'thirdParty', name: 'Unnamed motorist (cited)', role: 'Participant', severity: 'High', description: 'Driver of a grey sedan that passed the extended stop arm and struck the bus bumper.', actionTaken: 'Cited at the scene by responding officer. Insurance information exchanged.', notes: 'Police report reference pending.' },
    ],
  },
  {
    id: 'INC-2025-0069',
    date: '2025-03-04',
    time: '13:50',
    subject: 'location',
    type: 'Location Safety Hazard',
    description: 'A diesel spill of roughly two gallons was found at the fuel island with no absorbent applied. The area was coned off and spill kit material was applied within the hour. Reported for tracking because the spill was not logged when it occurred.',
    bus: 'N/A',
    route: 'N/A',
    severity: 'High',
    status: 'Closed',
    createdBy: 'Sarah Williams',
    assignedTo: 'Mike Chen',
    location: 'fuel-station',
    assetRef: 'South District Garage',
    witnessPresent: false,
    tags: ['facilities', 'environmental'],
  },
];

// The only location identifiers that exist elsewhere in the app are the
// defaultGarage and midDayGarage values on mockDrivers and mockVehicles.
// Seeded here as a small list rather than building a Facilities page.
export const mockLocations = [
  { id: 'LOC-001', name: 'Central Service Center' },
  { id: 'LOC-002', name: 'East Service Center' },
  { id: 'LOC-003', name: 'North District Garage' },
  { id: 'LOC-004', name: 'South District Garage' },
];

// Normalize to a single model. Two passes:
//
// 1. Every incident carries an explicit `subject`. Seed rows written before
//    non-student incidents existed have none, so they default to 'student'.
//    Defaulting here rather than editing every seed row means a new row can
//    never silently miss the field.
//
// 2. Every STUDENT incident carries an involvedStudents array. Single-student
//    incidents become a 1-element array derived from the top-level student
//    fields (no role, role only applies to multi-student conflicts). Incidents
//    that already define involvedStudents are left as-is.
//
//    Non-student incidents are skipped by this back-fill. Without the subject
//    guard a location incident would gain a phantom student with an undefined
//    name, which then renders as a blank cell in every student column.
export const mockIncidents = rawIncidents.map((raw: any) => {
  const inc = { ...raw, subject: (raw.subject ?? 'student') as IncidentSubject };

  return inc.subject !== 'student' || (inc.involvedStudents && inc.involvedStudents.length > 0)
    ? inc
    : {
        ...inc,
        involvedStudents: [
          {
            studentId: inc.studentId,
            name: inc.student,
            severity: inc.severity,
            parentNotified: inc.parentNotified ?? false,
            description: '',
            actionTaken: inc.actionTaken ?? '',
            notes: '',
          },
        ],
      };
});

// Resolve the human-readable subject of an incident, whatever its kind.
// Student incidents keep their existing single and multi-student wording.
// Non-student incidents fall back through their involved parties, then the
// affected asset, then the location, so a row is never blank.
//
// Examples: "Marcus Chen", "M. Chen +2", "Two drivers", "Transportation Depot",
// "Bus 214".
export function getIncidentSubjectLabel(incident: any): string {
  const subject: IncidentSubject = incident?.subject ?? 'student';

  if (subject === 'student') {
    const students = incident?.involvedStudents;
    if (students && students.length > 1) {
      return `${students[0].name} +${students.length - 1}`;
    }
    return incident?.student ?? students?.[0]?.name ?? 'Unknown student';
  }

  const parties = incident?.involvedParties;
  if (parties && parties.length > 0) {
    if (parties.length === 1) return parties[0].name;
    return `${parties[0].name} +${parties.length - 1}`;
  }

  // location and vehicle incidents may have no people at all
  return incident?.assetRef ?? incident?.bus ?? incident?.location ?? getSubjectLabel(subject);
}

// Secondary line under the subject label in the list, mirroring the student ID
// slot. Returns an empty string when there is nothing useful to add.
export function getIncidentSubjectSubLabel(incident: any): string {
  const subject: IncidentSubject = incident?.subject ?? 'student';

  if (subject === 'student') {
    const students = incident?.involvedStudents;
    if (students && students.length > 1) return `${students.length} students involved`;
    return incident?.studentId ?? '';
  }

  const parties = incident?.involvedParties;
  if (parties && parties.length > 1) return `${parties.length} people involved`;
  if (parties && parties.length === 1) return parties[0].role ?? '';

  // Location and vehicle rows have no people. The subject chip already names the
  // kind, so repeating it here would just say "Vehicle" twice in one cell.
  return '';
}

interface IncidentsPageProps {
  onNavigate: (page: string) => void;
  onNavigateToCommunication: (incidentId: string, incidentData?: any) => void;
  onNavigateToIncidentDetail: (incident: any) => void;
  initialAssignedToFilter?: string | null;
  initialStatusFilter?: string | null;
  initialSeverityFilter?: string | null;
  initialDateAfterFilter?: string | null;
  // Pre-fills the search box, so another page can hand off a vehicle name or a
  // driver name and land the user on an already scoped list.
  initialSearchTerm?: string | null;
  onSortedFilteredIncidentsChange?: (incidents: any[]) => void;
}

type SortField = 'id' | 'date' | 'student' | 'subject' | 'type' | 'severity' | 'status' | 'workflow';
type SortDirection = 'asc' | 'desc' | null;

export function IncidentsPage({ onNavigate, onNavigateToCommunication, onNavigateToIncidentDetail, initialAssignedToFilter = null, initialStatusFilter = null, initialSeverityFilter = null, initialDateAfterFilter = null, initialSearchTerm = null, onSortedFilteredIncidentsChange }: IncidentsPageProps) {
  // Active (committed) filter values — used to actually filter the table
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  const [statusFilter, setStatusFilter] = useState<string[]>(initialStatusFilter ? [initialStatusFilter] : []);
  // Filters on the subject label ("Student", "Location", ...) rather than the
  // raw value, so the committed value matches what the chip displays.
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [assignedToFilter, setAssignedToFilter] = useState<string[]>(initialAssignedToFilter ? [initialAssignedToFilter] : []);
  const [severityFilter, setSeverityFilter] = useState<string[]>(initialSeverityFilter ? [initialSeverityFilter] : []);
  const [dateAfterFilter, setDateAfterFilter] = useState(initialDateAfterFilter || '');

  // Pending (uncommitted) filter values — updated by inputs, applied on Search click
  const [pendingSearchTerm, setPendingSearchTerm] = useState(initialSearchTerm || '');
  const [pendingStatusFilter, setPendingStatusFilter] = useState<string[]>(initialStatusFilter ? [initialStatusFilter] : []);
  const [pendingSubjectFilter, setPendingSubjectFilter] = useState<string[]>([]);
  const [pendingTypeFilter, setPendingTypeFilter] = useState<string[]>([]);
  const [pendingAssignedToFilter, setPendingAssignedToFilter] = useState<string[]>(initialAssignedToFilter ? [initialAssignedToFilter] : []);
  const [pendingSeverityFilter, setPendingSeverityFilter] = useState<string[]>(initialSeverityFilter ? [initialSeverityFilter] : []);
  const [pendingDateAfterFilter, setPendingDateAfterFilter] = useState(initialDateAfterFilter || '');

  const [isNewIncidentDialogOpen, setIsNewIncidentDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const toastHelper = useForgeToast();
  const newIncidentDialogRef = useRef<HTMLElement>(null);
  const photoDialogRef = useRef<HTMLElement>(null);

  // Enrich incidents with workflow data
  const incidentsWithWorkflows = mockIncidents.map((incident) => {
    const workflow = assignWorkflowToIncident(incident.type, incident.severity);
    
    // For open incidents with workflows, set appropriate step statuses
    if (workflow && incident.status === 'Open') {
      // Mark first step as completed and second step as in progress
      const updatedSteps = workflow.steps.map((step, index) => {
        if (index === 0) {
          return { 
            ...step, 
            status: 'Completed' as const,
            completedDate: `${incident.date} 7:50 AM`,
            completedBy: incident.driver,
            comments: 'Immediate action taken as per protocol',
          };
        } else if (index === 1) {
          // For high severity incidents, second step might need approval
          if (step.requiresApproval) {
            return { ...step, status: 'Pending Approval' as const };
          }
          return { ...step, status: 'In Progress' as const };
        }
        return step;
      });
      
      return {
        ...incident,
        workflow: { ...workflow, steps: updatedSteps },
      };
    }
    
    return {
      ...incident,
      workflow: workflow,
    };
  });

  // Get unique students from incidents for lookup. Restricted to student
  // incidents, otherwise a location row contributes an { undefined, undefined }
  // entry that renders as a blank option.
  const uniqueStudents = Array.from(
    new Map(
      mockIncidents
        .filter((inc: any) => (inc.subject ?? 'student') === 'student' && inc.studentId)
        .map((inc: any) => [inc.studentId, { id: inc.studentId, name: inc.student }])
    ).values()
  );

  // Get unique assigned users
  const uniqueAssignedUsers = Array.from(
    new Set(mockIncidents.map(inc => inc.assignedTo))
  ).sort();

  // Type filter options, grouped by subject so a long flat list of every type
  // across all five subjects stays navigable. Derived from INCIDENT_TYPES, plus
  // any type present on a seeded incident but missing from the catalog, so no
  // existing row becomes unfilterable.
  const typeFilterOptions = useMemo(() => {
    const catalogLabels = INCIDENT_TYPES.map(t => t.label);
    const seededLabels = mockIncidents.map((inc: any) => inc.type);
    return Array.from(new Set([...catalogLabels, ...seededLabels]))
      .sort((a, b) => a.localeCompare(b))
      .map(label => ({ value: label, label }));
  }, []);

  // Typeahead groups for the search box. Every group is a field the filter below
  // actually matches, so a suggestion can never point at rows the grid discards.
  const searchSuggestionGroups = useMemo(() => {
    const partyNames = mockIncidents.flatMap((inc: any) =>
      (inc.involvedParties ?? []).map((p: any) => p?.name)
    );
    return [
      { kind: 'Student', values: uniqueStudents.map(s => s.name) },
      { kind: 'Person', values: partyNames },
      { kind: 'Driver', values: mockIncidents.map((inc: any) => inc.driver) },
      { kind: 'Vehicle', values: mockIncidents.map((inc: any) => inc.bus) },
      { kind: 'Run', values: mockIncidents.map((inc: any) => inc.route) },
      { kind: 'Location', values: mockLocations.map(f => f.name) },
    ];
  }, []);

  // Sync New Incident Dialog open state to forge-dialog
  useEffect(() => {
    const el = newIncidentDialogRef.current as any;
    if (!el) return;
    el.open = isNewIncidentDialogOpen;
  }, [isNewIncidentDialogOpen]);

  useEffect(() => {
    const el = newIncidentDialogRef.current as any;
    if (!el) return;
    const handler = () => setIsNewIncidentDialogOpen(false);
    el.addEventListener('forge-dialog-close', handler);
    return () => el.removeEventListener('forge-dialog-close', handler);
  }, []);

  // Sync Photo Lightbox open state to forge-dialog
  useEffect(() => {
    const el = photoDialogRef.current as any;
    if (!el) return;
    el.open = !!selectedPhoto;
  }, [selectedPhoto]);

  useEffect(() => {
    const el = photoDialogRef.current as any;
    if (!el) return;
    const handler = () => setSelectedPhoto(null);
    el.addEventListener('forge-dialog-close', handler);
    return () => el.removeEventListener('forge-dialog-close', handler);
  }, []);

  // Apply pending filters to active filters
  const handleSearch = () => {
    setSearchTerm(pendingSearchTerm);
    setStatusFilter(pendingStatusFilter);
    setSubjectFilter(pendingSubjectFilter);
    setTypeFilter(pendingTypeFilter);
    setAssignedToFilter(pendingAssignedToFilter);
    setSeverityFilter(pendingSeverityFilter);
    setDateAfterFilter(pendingDateAfterFilter);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction: desc -> asc -> null -> desc
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection(null);
        setSortField('date'); // Reset to default
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = (format: ExportFormat) => {
    const formatLabels: Record<ExportFormat, string> = {
      excel: 'Excel Spreadsheet',
      csv: 'CSV',
    };
    const formatExtensions: Record<ExportFormat, string> = {
      excel: 'xlsx',
      csv: 'csv',
    };

    toastHelper[0]({
      message: `Export started — your ${formatLabels[format]} is being prepared and will download shortly.`,
      theme: 'success',
      duration: 3000,
    } as any);

    // Simulate export delay
    setTimeout(() => {
      // Create CSV content
      // "Involved" rather than "Student", since a row may be a location or a
      // vehicle. Subject is exported so the two are distinguishable downstream.
      const headers = ['Incident ID', 'Date', 'Time', 'Subject', 'Involved', 'Student ID', 'Type', 'Vehicle', 'Run', 'Driver', 'Severity', 'Status', 'Description'];
      const rows = filteredIncidents.map(inc => [
        inc.id,
        inc.date,
        inc.time ?? '',
        getSubjectLabel(inc.subject ?? 'student'),
        `"${getIncidentSubjectLabel(inc)}"`,
        inc.studentId ?? '',
        `"${inc.type}"`,
        inc.bus ?? '',
        `"${inc.route ?? ''}"`,
        `"${inc.driver ?? ''}"`,
        inc.severity,
        inc.status,
        `"${inc.description}"`
      ].join(','));

      const csvContent = format === 'csv-no-header'
        ? rows.join('\\n')
        : [headers.join(','), ...rows].join('\\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents-export-${new Date().toISOString().split('T')[0]}.${formatExtensions[format]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toastHelper[0]({
        message: `Export complete — your ${formatLabels[format]} has been downloaded.`,
        theme: 'success',
        duration: 3000,
      } as any);
    }, 1500);
  };

  const filteredIncidents = useMemo(() => incidentsWithWorkflows.filter((incident) => {
    // Driver and every involved party name are matched, not just the subject
    // label. The label collapses a multi-party incident to "First Name +1", so
    // without this the second person named on a employee incident is unfindable,
    // and a driver count handed over from the drivers grid lands on nothing.
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      getIncidentSubjectLabel(incident).toLowerCase().includes(q) ||
      (incident.bus ?? '').toLowerCase().includes(q) ||
      (incident.route ?? '').toLowerCase().includes(q) ||
      (incident.driver ?? '').toLowerCase().includes(q) ||
      (incident.assetRef ?? '').toLowerCase().includes(q) ||
      (incident.involvedParties ?? []).some((p: any) => (p?.name ?? '').toLowerCase().includes(q)) ||
      (incident.involvedStudents ?? []).some((s: any) => (s?.name ?? '').toLowerCase().includes(q));

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(incident.status);
    const matchesSubject = subjectFilter.length === 0 || subjectFilter.includes(getSubjectLabel(incident.subject ?? 'student'));
    const matchesType = typeFilter.length === 0 || typeFilter.includes(incident.type);
    const matchesAssignedTo = assignedToFilter.length === 0 || assignedToFilter.includes(incident.assignedTo);
    const matchesSeverity = severityFilter.length === 0 || severityFilter.includes(incident.severity);
    const matchesDateAfter = !dateAfterFilter || incident.date >= dateAfterFilter;

    return matchesSearch && matchesStatus && matchesSubject && matchesType && matchesAssignedTo && matchesSeverity && matchesDateAfter;
  }), [incidentsWithWorkflows, searchTerm, statusFilter, subjectFilter, typeFilter, assignedToFilter, severityFilter, dateAfterFilter]);

  // Sort incidents
  const sortedIncidents = useMemo(() => [...filteredIncidents].sort((a, b) => {
    if (!sortDirection) return 0;

    let comparison = 0;
    
    switch (sortField) {
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'student':
        comparison = getIncidentSubjectLabel(a).localeCompare(getIncidentSubjectLabel(b));
        break;
      case 'subject':
        comparison = getSubjectLabel(a.subject ?? 'student').localeCompare(getSubjectLabel(b.subject ?? 'student'));
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'severity': {
        const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        comparison = (severityOrder[a.severity as keyof typeof severityOrder] || 0) -
                     (severityOrder[b.severity as keyof typeof severityOrder] || 0);
        break;
      }
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'workflow': {
        // Sort by workflow presence and progress
        const aProgress = a.workflow ? a.workflow.steps.filter(s => s.status === 'Completed').length : -1;
        const bProgress = b.workflow ? b.workflow.steps.filter(s => s.status === 'Completed').length : -1;
        comparison = aProgress - bProgress;
        break;
      }
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  }), [filteredIncidents, sortField, sortDirection]);

  // Reset to first page when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, assignedToFilter, severityFilter, dateAfterFilter, sortField, sortDirection, rowsPerPage]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedIncidents.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayedIncidents = sortedIncidents.slice(startIndex, startIndex + rowsPerPage);

  // Notify parent component of sorted and filtered incidents using ref-based ID comparison
  const prevSortedIdsRef = useRef<string>('');
  useEffect(() => {
    if (onSortedFilteredIncidentsChange) {
      const currentIds = sortedIncidents.map(i => i.id).join(',');
      if (currentIds !== prevSortedIdsRef.current) {
        prevSortedIdsRef.current = currentIds;
        onSortedFilteredIncidentsChange(sortedIncidents);
      }
    }
  }, [sortedIncidents, onSortedFilteredIncidentsChange]);

  // KPI calculations
  const totalIncidents = mockIncidents.length;
  const openIncidents = mockIncidents.filter(i => i.status === 'Open').length;
  const criticalIncidents = mockIncidents.filter(i => i.severity === 'Critical').length;
  const closedIncidents = mockIncidents.filter(i => i.status === 'Closed').length;

  return (
    <div style={{ padding: 'var(--forge-spacing-xlarge)' }}>
      {/* Page Header */}
      <div className="flex items-start justify-between" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 'var(--forge-spacing-xxsmall)', fontFamily: 'Roboto, sans-serif' }}>Incidents</h1>
          <p className="text-muted-foreground" style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--forge-font-size-base)' }}>
            Track and manage all incidents
          </p>
        </div>
        <button
          onClick={() => setIsNewIncidentDialogOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: 'var(--forge-shape-medium)',
            backgroundColor: 'var(--forge-theme-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <forge-icon name="add" style={{ fontSize: '16px' }}></forge-icon>
          New Incident
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#dc2626', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{criticalIncidents}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Critical Incidents</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ea580c', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{openIncidents}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Open Incidents</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{totalIncidents}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Total Incidents</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-olive-medium)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{closedIncidents}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Closed Incidents</h3>
          </div>
        </ForgeCard>
      </div>

      {/* Filters Card */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)', marginBottom: 'var(--forge-spacing-large)', borderRadius: 'var(--forge-radius-large)', borderColor: 'var(--forge-color-border-default)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }}>
          <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)' }}>
            {/* Search */}
            <div className="flex-1 min-w-0">
              <EntitySearchField
                value={pendingSearchTerm}
                onChange={setPendingSearchTerm}
                onSubmit={handleSearch}
                placeholder="Search by person, vehicle, run, or location..."
                groups={searchSuggestionGroups}
              />
            </div>

            {/* Status Filter */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={[
                  { value: 'Open', label: 'Open' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Closed', label: 'Closed' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
                selected={pendingStatusFilter}
                onChange={setPendingStatusFilter}
                placeholder="Status"
                allLabel="All Statuses"
                width="160px"
              />
            </div>

            {/* Subject Filter */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={INCIDENT_SUBJECTS.map(s => ({ value: s.label, label: s.label }))}
                selected={pendingSubjectFilter}
                onChange={setPendingSubjectFilter}
                placeholder="Subject"
                allLabel="All Subjects"
                width="160px"
              />
            </div>

            {/* Type Filter. Derived from INCIDENT_TYPES rather than a hardcoded
                list, otherwise any newly added type is silently unfilterable. */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={typeFilterOptions}
                selected={pendingTypeFilter}
                onChange={setPendingTypeFilter}
                placeholder="Type"
                allLabel="All Types"
                width="180px"
              />
            </div>

            {/* Assigned To Filter */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={uniqueAssignedUsers.map(user => ({ value: user, label: user }))}
                selected={pendingAssignedToFilter}
                onChange={setPendingAssignedToFilter}
                placeholder="Assigned To"
                allLabel="All Assigned To"
                width="180px"
              />
            </div>

            {/* Severity Filter */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={[
                  { value: 'Critical', label: 'Critical' },
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]}
                selected={pendingSeverityFilter}
                onChange={setPendingSeverityFilter}
                placeholder="Severity"
                allLabel="All Severities"
                width="160px"
              />
            </div>

            {/* Search Button */}
            <ForgeButton
              variant="outlined"
              className="shrink-0"
              onClick={handleSearch}
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: 'var(--forge-font-size-base)',
                fontWeight: 'var(--forge-font-weight-medium)',
                borderRadius: 'var(--forge-radius-medium)',
                borderColor: 'var(--forge-color-border-default)',
              }}
            >
              <forge-icon slot="start" name="search"></forge-icon>
              Search
            </ForgeButton>
          </div>
        </div>
      </ForgeCard>

      {/* Active Filter Banner */}
      {(severityFilter.length > 0 || statusFilter.length > 0 || subjectFilter.length > 0 || dateAfterFilter || searchTerm.trim()) && (
        <div className="flex items-center gap-3 p-3 rounded-md mb-4" style={{ backgroundColor: 'var(--forge-color-surface-info, #eff6ff)', border: '1px solid var(--forge-color-border-info, #bfdbfe)', borderRadius: 'var(--forge-radius-medium)', fontFamily: 'var(--forge-font-family)' }}>
          <forge-icon name="error" style={{ fontSize: '16px', flexShrink: 0, color: 'var(--forge-color-text-info, #2563eb)' }}></forge-icon>
          <span style={{ fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-color-text-info, #1e40af)' }}>
            {/* Joined rather than each line prefixing its own separator, which
                left a dangling bullet whenever the first filter was unset. */}
            Filtered view: {[
              // Search first, since it is what an incoming link from the drivers
              // or vehicles grid sets, and the user did not type it themselves.
              searchTerm.trim() && `Matching "${searchTerm.trim()}"`,
              severityFilter.length > 0 && `Severity = ${severityFilter.join(', ')}`,
              statusFilter.length > 0 && `Status = ${statusFilter.join(', ')}`,
              subjectFilter.length > 0 && `Subject = ${subjectFilter.join(', ')}`,
              dateAfterFilter && `Created after ${dateAfterFilter}`,
            ].filter(Boolean).join(' • ')}
          </span>
          <ForgeButton
            variant="flat"
            size="sm"
            className="ml-auto h-7"
            style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}
            onClick={() => {
              setStatusFilter([]);
              setSeverityFilter([]);
              setDateAfterFilter('');
              setAssignedToFilter([]);
              setSubjectFilter([]);
              setTypeFilter([]);
              setSearchTerm('');
              setPendingStatusFilter([]);
              setPendingSeverityFilter([]);
              setPendingDateAfterFilter('');
              setPendingAssignedToFilter([]);
              setPendingSubjectFilter([]);
              setPendingTypeFilter([]);
              setPendingSearchTerm('');
            }}
          >
            Clear Filters
          </ForgeButton>
        </div>
      )}

      {/* Incidents Table */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }} className="flex flex-row items-center justify-between">
          <h3 className="forge-typography--heading4">
            All Incidents <span className="text-muted-foreground">({filteredIncidents.length})</span>
          </h3>
          <div className="flex gap-2">
            <ExportDropdown onExport={handleExport} />
          </div>
        </div>
        <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
          <div className="overflow-x-auto">
            <table className="forge-table" style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'calc(var(--forge-font-size-base) + 4px)', minWidth: '1400px', width: '100%' }}>
              <thead>
                <tr>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '130px' }}>
                    <button
                      onClick={() => handleSort('id')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      Incident ID
                      {sortField === 'id' && sortDirection === 'desc' && <forge-icon name="arrow_downward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField === 'id' && sortDirection === 'asc' && <forge-icon name="arrow_upward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField !== 'id' && <forge-icon name="unfold_more" style={{ fontSize: '14px', opacity: 0.3 }}></forge-icon>}
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '110px' }}>
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      Date
                      {sortField === 'date' && sortDirection === 'desc' && <forge-icon name="arrow_downward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField === 'date' && sortDirection === 'asc' && <forge-icon name="arrow_upward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField !== 'date' && <forge-icon name="unfold_more" style={{ fontSize: '14px', opacity: 0.3 }}></forge-icon>}
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '180px' }}>
                    <button
                      onClick={() => handleSort('student')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      Involved
                      {sortField === 'student' && sortDirection === 'desc' && <forge-icon name="arrow_downward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField === 'student' && sortDirection === 'asc' && <forge-icon name="arrow_upward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField !== 'student' && <forge-icon name="unfold_more" style={{ fontSize: '14px', opacity: 0.3 }}></forge-icon>}
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '120px' }}>
                    <button
                      onClick={() => handleSort('subject')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      Subject
                      {sortField === 'subject' && sortDirection === 'desc' && <forge-icon name="arrow_downward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField === 'subject' && sortDirection === 'asc' && <forge-icon name="arrow_upward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField !== 'subject' && <forge-icon name="unfold_more" style={{ fontSize: '14px', opacity: 0.3 }}></forge-icon>}
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '180px' }}>
                    <button
                      onClick={() => handleSort('type')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      Type
                      {sortField === 'type' && sortDirection === 'desc' && <forge-icon name="arrow_downward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField === 'type' && sortDirection === 'asc' && <forge-icon name="arrow_upward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField !== 'type' && <forge-icon name="unfold_more" style={{ fontSize: '14px', opacity: 0.3 }}></forge-icon>}
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '220px' }}>Vehicle/Run</th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '110px' }}>
                    <button
                      onClick={() => handleSort('severity')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      Severity
                      {sortField === 'severity' && sortDirection === 'desc' && <forge-icon name="arrow_downward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField === 'severity' && sortDirection === 'asc' && <forge-icon name="arrow_upward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField !== 'severity' && <forge-icon name="unfold_more" style={{ fontSize: '14px', opacity: 0.3 }}></forge-icon>}
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '130px' }}>
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      Status
                      {sortField === 'status' && sortDirection === 'desc' && <forge-icon name="arrow_downward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField === 'status' && sortDirection === 'asc' && <forge-icon name="arrow_upward" style={{ fontSize: '14px' }}></forge-icon>}
                      {sortField !== 'status' && <forge-icon name="unfold_more" style={{ fontSize: '14px', opacity: 0.3 }}></forge-icon>}
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '150px' }}>Assigned To</th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '100px' }}>Messages</th>
                </tr>
              </thead>
              <tbody>
                {displayedIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="forge-table-row cursor-pointer"
                    onClick={() => onNavigateToIncidentDetail(incident)}
                    style={{ transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--forge-theme-primary-container-minimum)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                  >
                      <td className="forge-table-cell">
                        {incident.id}
                      </td>
                      <td className="forge-table-cell">{incident.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2-$3-$1')}</td>
                      <td className="forge-table-cell">
                        {/* Multi-student rows keep their existing "+N more"
                            treatment. Everything else, student or not, goes
                            through the subject label helper so no row is blank. */}
                        {incident.involvedStudents && incident.involvedStudents.length > 1 ? (
                          <>
                            <div title={incident.involvedStudents.map((s: any) => `${s.name} (${s.role})`).join(', ')}>
                              {incident.involvedStudents[0].name}
                              <span style={{ marginLeft: '4px', color: 'var(--forge-theme-text-low)' }}>
                                +{incident.involvedStudents.length - 1} more
                              </span>
                            </div>
                            <div style={{ fontSize: 'calc(var(--forge-font-size-sm) - 2px)', color: 'var(--forge-theme-text-low)' }}>
                              {incident.involvedStudents.length} students involved
                            </div>
                          </>
                        ) : (
                          <>
                            <div>{getIncidentSubjectLabel(incident)}</div>
                            <div style={{ fontSize: 'calc(var(--forge-font-size-sm) - 2px)', color: 'var(--forge-theme-text-low)' }}>
                              {getIncidentSubjectSubLabel(incident)}
                            </div>
                          </>
                        )}
                      </td>
                      {/* Subject is its own column now, shown on every row.
                          It used to be a chip tucked inside the Involved cell
                          and only on non-student rows, which made it easy to
                          miss and impossible to sort on. */}
                      <td className="forge-table-cell">
                        <forge-badge theme={(incident.subject ?? 'student') === 'student' ? 'default' : 'info-primary'}>
                          {getSubjectLabel(incident.subject ?? 'student')}
                        </forge-badge>
                      </td>
                      <td className="forge-table-cell">
                        <forge-badge theme="default">{incident.type}</forge-badge>
                      </td>
                      <td className="forge-table-cell">
                        <div>{incident.bus}</div>
                        <div style={{ fontSize: 'calc(var(--forge-font-size-sm) - 2px)', color: 'var(--forge-theme-text-low)' }}>
                          {incident.route}
                        </div>
                      </td>
                      <td className="forge-table-cell">
                        <forge-badge theme={severityTheme(incident.severity)} strong>
                          {incident.severity}
                        </forge-badge>
                      </td>
                      <td className="forge-table-cell">
                        <forge-badge theme={statusTheme(incident.status)}>
                          {incident.status}
                        </forge-badge>
                      </td>
                      <td className="forge-table-cell">
                        {incident.assignedTo}
                      </td>
                      <td className="forge-table-cell">
                        {hasActiveCommunication(incident.id) && (
                          <ForgeButton
                            variant="flat"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToCommunication(incident.id);
                            }}
                          >
                            <forge-icon name="chat" style={{ fontSize: '16px' }}></forge-icon>
                          </ForgeButton>
                        )}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between" style={{ paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--forge-color-border-subtle)', marginTop: 'var(--forge-spacing-medium)' }}>
            <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                Showing {sortedIncidents.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + rowsPerPage, sortedIncidents.length)} of {sortedIncidents.length} incidents
              </span>
              {rowsPerPage === 5 && sortedIncidents.length > 5 && (
                <ForgeButton
                  variant="outlined"
                  dense
                  onClick={() => { setRowsPerPage(25); setCurrentPage(1); }}
                  style={{ fontSize: '0.75rem' }}
                >
                  Show 25
                </ForgeButton>
              )}
              {rowsPerPage === 25 && (
                <ForgeButton
                  variant="outlined"
                  dense
                  onClick={() => { setRowsPerPage(5); setCurrentPage(1); }}
                  style={{ fontSize: '0.75rem' }}
                >
                  Show 5
                </ForgeButton>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)' }}>
                <ForgeIconButton
                  aria-label="Previous page"
                  dense
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <button type="button">
                    <forge-icon name="chevron_left"></forge-icon>
                  </button>
                </ForgeIconButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <ForgeButton
                    key={page}
                    variant={page === currentPage ? 'raised' : 'outlined'}
                    dense
                    onClick={() => setCurrentPage(page)}
                    className="pagination-page-btn"
                    style={{
                      ['--forge-button-min-width' as any]: '24px',
                      ['--forge-button-padding-inline' as any]: '6px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {page}
                  </ForgeButton>
                ))}
                <ForgeIconButton
                  aria-label="Next page"
                  dense
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <button type="button">
                    <forge-icon name="chevron_right"></forge-icon>
                  </button>
                </ForgeIconButton>
              </div>
            )}
          </div>
        </div>
      </ForgeCard>

      {/* New Incident Dialog */}
      {/* @ts-ignore */}
      <forge-dialog ref={newIncidentDialogRef} aria-label="Report New Incident">
        {/* Capped rather than a flat 95vw. On a wide monitor 95vw produced a
            very large mostly-empty dialog; 1240px is enough for the two-column
            details step and still collapses on smaller screens. */}
        <div style={{ width: 'min(1240px, 95vw)', maxWidth: '95vw', maxHeight: '95vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white z-10 border-b px-6 py-4">
            <h2 style={{ margin: 0, fontFamily: 'var(--forge-font-family)', fontWeight: 'var(--forge-font-weight-medium)', fontSize: 'var(--forge-font-size-xl)' }}>
              Report New Incident
            </h2>
            <p style={{ margin: 0, marginTop: 'var(--forge-spacing-xxsmall)', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>
              Choose what the incident is about, then fill out the details
            </p>
          </div>
          <div className="px-6 pb-6">
            <NewIncidentForm onNavigate={(page) => {
              setIsNewIncidentDialogOpen(false);
              if (page === 'incidents') {
                toastHelper[0]({ message: 'Incident reported successfully!', theme: 'success', duration: 3000 } as any);
              }
            }} />
          </div>
        </div>
      </forge-dialog>

      {/* Photo Lightbox */}
      {/* @ts-ignore */}
      <forge-dialog ref={photoDialogRef} aria-label={selectedPhoto?.caption || 'Photo'}>
        <div style={{ padding: 'var(--forge-spacing-large)', maxWidth: '900px' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--forge-font-family)', fontWeight: 'var(--forge-font-weight-medium)', fontSize: 'var(--forge-font-size-xl)' }}>
            {selectedPhoto?.caption}
          </h2>
          <p style={{ margin: 0, marginTop: 'var(--forge-spacing-xxsmall)', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>
            Submitted by {selectedPhoto?.uploadedBy} on {selectedPhoto?.uploadedAt}
          </p>
          {selectedPhoto && (
            <div className="relative" style={{ marginTop: 'var(--forge-spacing-medium)' }}>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      </forge-dialog>
    </div>
  );
}