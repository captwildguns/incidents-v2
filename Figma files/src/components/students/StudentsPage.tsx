import { ForgeButton, ForgeCard, ForgeIconButton, useForgeToast } from '@tylertech/forge-react';
import {
  defineButtonComponent,
  defineCardComponent,
  defineDialogComponent,
  defineTextFieldComponent,
  defineBadgeComponent,
  defineAvatarComponent,
  defineCheckboxComponent,
  defineAutocompleteComponent,
  defineIconComponent,
  defineIconButtonComponent,
} from '@tylertech/forge';
defineButtonComponent();
defineCardComponent();
defineDialogComponent();
defineTextFieldComponent();
defineBadgeComponent();
defineAvatarComponent();
defineCheckboxComponent();
defineAutocompleteComponent();
defineIconComponent();
defineIconButtonComponent();
import { ForgeMultiSelect } from '../ui/forge-multiselect';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ExportDropdown } from '../shared/ExportDropdown';
import type { ExportFormat } from '../shared/ExportDropdown';
import { EntitySearchField } from '../shared/EntitySearchField';
import { mockIncidents } from '../incidents/IncidentsPage';
import { yearForDate } from '../incidents/IncidentTypes';

// Photo URLs for students
const femalePhotos = [
  'https://images.unsplash.com/photo-1695313667713-7303ec9a270f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwZ2lybCUyMHBhc3Nwb3J0JTIwZGV0YWlsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzY5NTMwMTUxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1758521540968-3af0cc2074a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwZGV0YWlsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzY5NTMwMTUxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1589220286904-3dcef62c68ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBzdHVkZW50JTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzY5NTMwMTUxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1743329625541-7d9b5a21440e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnaXJsJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwc2Nob29sfGVufDF8fHx8MTc2OTUzMDE1M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1762522929454-ee9a3c765f59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGZlbWFsZSUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2OTUzMDE1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
];

const malePhotos = [
  'https://images.unsplash.com/photo-1608976988602-6c7d25ad3bbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlJTIwYm95JTIwcGFzc3BvcnQlMjBoZWFkc2hvdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3Njk1MzAxNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHN0dWRlbnQlMjBwb3J0cmFpdCUyMGhlYWRzaG90fGVufDF8fHx8MTc2OTUzMDE1Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'https://images.unsplash.com/photo-1719861915316-449b8de4b0f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3klMjBzdHVkZW50JTIwcG9ydHJhaXQlMjBzY2hvb2x8ZW58MXx8fHwxNzY5NTMwMTUzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
];

// The incidents array, incidentCount, and lastIncident fields on each record are
// no longer read anywhere. This page derives all three from mockIncidents, which
// is the single source of truth. They are left in place only because other seed
// data in this repo is shaped around them; do not add to them and do not read
// them, or the students grid will disagree with the incidents grid again.
export const mockStudents = [
  {
    id: 'STU-3890',
    name: 'Chris Park',
    photoUrl: malePhotos[3],
    grade: '5th Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    // Legacy fields, no longer read. Both pages derive from mockIncidents.
    incidentCount: 1,
    lastIncident: '2025-03-01',
    incidents: [],
  },
  {
    id: 'STU-2891',
    name: 'Sarah Mitchell',
    photoUrl: femalePhotos[0],
    grade: '8th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 4,
    lastIncident: '2025-03-15',
    incidents: [
      {
        id: 'INC-2025-0042',
        date: '2025-03-15',
        type: 'Seat Refusal',
        severity: 'Medium',
        status: 'Open',
        role: 'Instigator',
        description: 'Student refused to remain seated during transport',
      },
      {
        id: 'INC-2025-0027',
        date: '2025-02-21',
        type: 'Disruptive Volume',
        severity: 'Low',
        status: 'Closed',
        role: 'Instigator',
        description: 'Talking loudly and disturbing other students during the afternoon run',
      },
      {
        id: 'INC-2025-0014',
        date: '2025-01-30',
        type: 'Offensive Language',
        severity: 'Medium',
        status: 'Closed',
        role: 'Participant',
        description: 'Used inappropriate language toward another student; verbal warning issued',
      },
      {
        id: 'INC-2024-0388',
        date: '2024-12-05',
        type: 'Disruptive Behavior',
        severity: 'High',
        status: 'In Progress',
        role: 'Victim',
        description: 'Repeatedly taunted a younger student; parent conference scheduled, follow-up pending',
      },
    ],
  },
  {
    id: 'STU-3421',
    name: 'Marcus Johnson',
    photoUrl: malePhotos[0],
    grade: '10th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-03-15',
    incidents: [
      {
        id: 'INC-2025-0041',
        date: '2025-03-15',
        type: 'Emergency Exit Misuse',
        severity: 'High',
        status: 'In Progress',
        description: 'Student attempted to open emergency exit during normal transport',
      },
    ],
  },
  {
    id: 'STU-1956',
    name: 'Emma Rodriguez',
    photoUrl: femalePhotos[1],
    grade: '7th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-03-14',
    incidents: [
      {
        id: 'INC-2025-0040',
        date: '2025-03-14',
        type: 'Disruptive Behavior',
        severity: 'High',
        status: 'Open',
        description: 'Verbal altercation with another student',
      },
    ],
  },
  {
    id: 'STU-4782',
    name: 'James Thompson',
    photoUrl: malePhotos[1],
    grade: '9th Grade',
    school: 'Roosevelt High School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 1,
    lastIncident: '2025-03-14',
    incidents: [
      {
        id: 'INC-2025-0039',
        date: '2025-03-14',
        type: 'Property Damage',
        severity: 'Low',
        status: 'Closed',
        description: 'Seat cushion torn - monetary restitution required',
      },
    ],
  },
  {
    id: 'STU-5623',
    name: 'Olivia Davis',
    photoUrl: femalePhotos[2],
    grade: '11th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-03-13',
    incidents: [
      {
        id: 'INC-2025-0038',
        date: '2025-03-13',
        type: 'Offensive Language',
        severity: 'Medium',
        status: 'In Progress',
        description: 'Using profane and offensive language toward other students',
      },
    ],
  },
  {
    id: 'STU-6891',
    name: 'Noah Wilson',
    photoUrl: malePhotos[2],
    grade: '8th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-03-12',
    incidents: [
      {
        id: 'INC-2025-0037',
        date: '2025-03-12',
        type: 'Physical Altercation',
        severity: 'High',
        status: 'Closed',
        description: 'Physical fight with another student',
      },
    ],
  },
  {
    id: 'STU-7234',
    name: 'Sophia Garcia',
    photoUrl: femalePhotos[3],
    grade: '5th Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    incidentCount: 1,
    lastIncident: '2025-03-10',
    incidents: [
      {
        id: 'INC-2025-0036',
        date: '2025-03-10',
        type: 'Eating/Drinking Violation',
        severity: 'Low',
        status: 'Closed',
        description: 'Student eating snacks and spilled drink on seat',
      },
    ],
  },
  {
    id: 'STU-8512',
    name: 'Liam Brown',
    photoUrl: malePhotos[0],
    grade: '7th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 1,
    lastIncident: '2025-03-08',
    incidents: [
      {
        id: 'INC-2025-0035',
        date: '2025-03-08',
        type: 'Window Misuse',
        severity: 'Medium',
        status: 'Closed',
        description: 'Opening windows excessively and throwing paper outside',
      },
    ],
  },
  {
    id: 'STU-9123',
    name: 'Ava Martinez',
    photoUrl: femalePhotos[4],
    grade: '6th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-03-07',
    incidents: [
      {
        id: 'INC-2025-0034',
        date: '2025-03-07',
        type: 'Disruptive Volume',
        severity: 'Medium',
        status: 'Closed',
        description: 'Excessive noise and screaming, disturbing driver',
      },
    ],
  },
  {
    id: 'STU-1045',
    name: 'Ethan Lee',
    photoUrl: malePhotos[1],
    grade: '9th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-03-05',
    incidents: [
      {
        id: 'INC-2025-0033',
        date: '2025-03-05',
        type: 'Seat Refusal',
        severity: 'Low',
        status: 'Closed',
        description: 'Refused assigned seat and moved multiple times',
      },
    ],
  },
  {
    id: 'STU-2387',
    name: 'Isabella White',
    photoUrl: femalePhotos[0],
    grade: '4th Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    incidentCount: 1,
    lastIncident: '2025-02-28',
    incidents: [
      {
        id: 'INC-2025-0032',
        date: '2025-02-28',
        type: 'Disruptive Behavior',
        severity: 'High',
        status: 'Closed',
        description: 'Continued verbal harassment of younger student',
      },
    ],
  },
  {
    id: 'STU-3498',
    name: 'Mason Taylor',
    photoUrl: malePhotos[2],
    grade: '8th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 1,
    lastIncident: '2025-02-26',
    incidents: [
      {
        id: 'INC-2025-0031',
        date: '2025-02-26',
        type: 'Offensive Language',
        severity: 'Medium',
        status: 'Closed',
        description: 'Repeated use of profanity despite warnings',
      },
    ],
  },
  {
    id: 'STU-4561',
    name: 'Charlotte Anderson',
    photoUrl: femalePhotos[1],
    grade: '7th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-02-24',
    incidents: [
      {
        id: 'INC-2025-0030',
        date: '2025-02-24',
        type: 'Property Damage',
        severity: 'Medium',
        status: 'Closed',
        description: 'Writing on seat backs with permanent marker',
      },
    ],
  },
  {
    id: 'STU-5672',
    name: 'Aiden Thomas',
    photoUrl: malePhotos[0],
    grade: '11th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-02-21',
    incidents: [
      {
        id: 'INC-2025-0029',
        date: '2025-02-21',
        type: 'Physical Altercation',
        severity: 'High',
        status: 'Closed',
        description: 'Pushing and shoving with another student in aisle',
      },
    ],
  },
  {
    id: 'STU-6783',
    name: 'Mia Jackson',
    photoUrl: femalePhotos[2],
    grade: '3rd Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    incidentCount: 1,
    lastIncident: '2025-02-19',
    incidents: [
      {
        id: 'INC-2025-0028',
        date: '2025-02-19',
        type: 'Disruptive Volume',
        severity: 'Low',
        status: 'Closed',
        description: 'Playing loud music from phone speaker',
      },
    ],
  },
  {
    id: 'STU-7894',
    name: 'Lucas Harris',
    photoUrl: malePhotos[1],
    grade: '6th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 1,
    lastIncident: '2025-02-15',
    incidents: [
      {
        id: 'INC-2025-0027',
        date: '2025-02-15',
        type: 'Emergency Exit Misuse',
        severity: 'High',
        status: 'Closed',
        description: 'Tampering with emergency exit door mechanism',
      },
    ],
  },
  {
    id: 'STU-8905',
    name: 'Harper Clark',
    photoUrl: femalePhotos[3],
    grade: '8th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-02-12',
    incidents: [
      {
        id: 'INC-2024-0026',
        date: '2025-02-12',
        type: 'Eating/Drinking Violation',
        severity: 'Medium',
        status: 'Closed',
        description: 'Spilled soda creating slipping hazard',
      },
    ],
  },
  {
    id: 'STU-9016',
    name: 'Benjamin Lewis',
    photoUrl: malePhotos[2],
    grade: '12th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-02-10',
    incidents: [
      {
        id: 'INC-2024-0025',
        date: '2025-02-10',
        type: 'Seat Refusal',
        severity: 'Medium',
        status: 'Closed',
        description: 'Standing in aisle during transport despite warnings',
      },
    ],
  },
  {
    id: 'STU-1127',
    name: 'Amelia Robinson',
    photoUrl: femalePhotos[4],
    grade: '5th Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    incidentCount: 1,
    lastIncident: '2025-02-07',
    incidents: [
      {
        id: 'INC-2024-0024',
        date: '2025-02-07',
        type: 'Window Misuse',
        severity: 'High',
        status: 'Closed',
        description: 'Hanging objects out window while bus moving',
      },
    ],
  },
  {
    id: 'STU-2238',
    name: 'Henry Walker',
    photoUrl: malePhotos[0],
    grade: '7th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 1,
    lastIncident: '2025-02-05',
    incidents: [
      {
        id: 'INC-2024-0023',
        date: '2025-02-05',
        type: 'Offensive Language',
        severity: 'High',
        status: 'Closed',
        description: 'Directing profanity at driver',
      },
    ],
  },
  {
    id: 'STU-3349',
    name: 'Evelyn Hall',
    photoUrl: femalePhotos[0],
    grade: '6th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-02-03',
    incidents: [
      {
        id: 'INC-2024-0022',
        date: '2025-02-03',
        type: 'Disruptive Behavior',
        severity: 'Medium',
        status: 'Closed',
        description: 'Name-calling and mocking another student',
      },
    ],
  },
  {
    id: 'STU-4450',
    name: 'Alexander Young',
    photoUrl: malePhotos[1],
    grade: '10th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-01-31',
    incidents: [
      {
        id: 'INC-2024-0021',
        date: '2025-01-31',
        type: 'Property Damage',
        severity: 'Medium',
        status: 'Closed',
        description: 'Scratching window with metal object',
      },
    ],
  },
  {
    id: 'STU-5561',
    name: 'Abigail King',
    photoUrl: femalePhotos[1],
    grade: '4th Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    incidentCount: 1,
    lastIncident: '2025-01-28',
    incidents: [
      {
        id: 'INC-2024-0020',
        date: '2025-01-28',
        type: 'Disruptive Volume',
        severity: 'Medium',
        status: 'Closed',
        description: 'Yelling and screaming, refusing to quiet down',
      },
    ],
  },
  {
    id: 'STU-6672',
    name: 'Daniel Wright',
    photoUrl: malePhotos[2],
    grade: '8th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 1,
    lastIncident: '2025-01-24',
    incidents: [
      {
        id: 'INC-2024-0019',
        date: '2025-01-24',
        type: 'Physical Altercation',
        severity: 'High',
        status: 'Closed',
        description: 'Kicked another student during argument',
      },
    ],
  },
  {
    id: 'STU-7783',
    name: 'Emily Scott',
    photoUrl: femalePhotos[2],
    grade: '7th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-01-21',
    incidents: [
      {
        id: 'INC-2024-0018',
        date: '2025-01-21',
        type: 'Eating/Drinking Violation',
        severity: 'Low',
        status: 'Closed',
        description: 'Eating messy food and littering wrappers',
      },
    ],
  },
  {
    id: 'STU-8894',
    name: 'Matthew Green',
    photoUrl: malePhotos[0],
    grade: '9th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-01-17',
    incidents: [
      {
        id: 'INC-2024-0017',
        date: '2025-01-17',
        type: 'Seat Refusal',
        severity: 'Low',
        status: 'Closed',
        description: 'Changed seats multiple times causing disruption',
      },
    ],
  },
  {
    id: 'STU-9905',
    name: 'Victoria Martinez',
    photoUrl: femalePhotos[3],
    grade: '10th Grade',
    school: 'Roosevelt High School',
    bus: 'Bus 14',
    route: 'Roosevelt High AM - Red',
    incidentCount: 3,
    lastIncident: '2025-03-16',
    incidents: [
      {
        id: 'INC-2025-0043',
        date: '2025-03-16',
        type: 'Disruptive Volume',
        severity: 'Medium',
        status: 'Open',
        description: 'Playing music loudly on phone without headphones',
      },
      {
        id: 'INC-2025-0016',
        date: '2025-01-15',
        type: 'Offensive Language',
        severity: 'Medium',
        status: 'Closed',
        description: 'Used inappropriate language with peers',
      },
      {
        id: 'INC-2025-0012',
        date: '2025-01-05',
        type: 'Seat Refusal',
        severity: 'Low',
        status: 'Closed',
        description: 'Refused assigned seat',
      },
    ],
  },
  {
    id: 'STU-1016',
    name: 'Christopher Adams',
    photoUrl: malePhotos[1],
    grade: '6th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-03-16',
    incidents: [
      {
        id: 'INC-2025-0044',
        date: '2025-03-16',
        type: 'Physical Altercation',
        severity: 'High',
        status: 'Open',
        description: 'Pushed another student causing minor injury',
      },
    ],
  },
  {
    id: 'STU-2127',
    name: 'Grace Phillips',
    photoUrl: femalePhotos[4],
    grade: '4th Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    incidentCount: 1,
    lastIncident: '2025-03-15',
    incidents: [
      {
        id: 'INC-2025-0045',
        date: '2025-03-15',
        type: 'Disruptive Behavior',
        severity: 'High',
        status: 'In Progress',
        description: 'Repeatedly teasing younger student about appearance',
      },
    ],
  },
  {
    id: 'STU-3238',
    name: 'Ryan Campbell',
    photoUrl: malePhotos[2],
    grade: '11th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-03-14',
    incidents: [
      {
        id: 'INC-2025-0046',
        date: '2025-03-14',
        type: 'Property Damage',
        severity: 'Medium',
        status: 'In Progress',
        description: 'Carved initials into seat back',
      },
    ],
  },
  {
    id: 'STU-4349',
    name: 'Madison Turner',
    photoUrl: femalePhotos[0],
    grade: '7th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 1,
    lastIncident: '2025-03-13',
    incidents: [
      {
        id: 'INC-2025-0047',
        date: '2025-03-13',
        type: 'Window Misuse',
        severity: 'Low',
        status: 'Closed',
        description: 'Opening and closing window repeatedly',
      },
    ],
  },
  {
    id: 'STU-5450',
    name: 'Joshua Parker',
    photoUrl: malePhotos[0],
    grade: '9th Grade',
    school: 'Roosevelt High School',
    bus: 'Bus 14',
    route: 'Roosevelt High AM - Red',
    incidentCount: 2,
    lastIncident: '2025-03-12',
    incidents: [
      {
        id: 'INC-2025-0048',
        date: '2025-03-12',
        type: 'Seat Refusal',
        severity: 'Medium',
        status: 'Open',
        description: 'Refused assigned seat and sat in restricted area',
      },
      {
        id: 'INC-2025-0015',
        date: '2025-01-12',
        type: 'Disruptive Volume',
        severity: 'Low',
        status: 'Closed',
        description: 'Loud talking during morning route',
      },
    ],
  },
  {
    id: 'STU-6561',
    name: 'Chloe Evans',
    photoUrl: femalePhotos[1],
    grade: '5th Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    incidentCount: 1,
    lastIncident: '2025-03-11',
    incidents: [
      {
        id: 'INC-2025-0049',
        date: '2025-03-11',
        type: 'Eating/Drinking Violation',
        severity: 'Low',
        status: 'Closed',
        description: 'Spilled juice on seat and floor',
      },
    ],
  },
  {
    id: 'STU-7672',
    name: 'Brandon Edwards',
    photoUrl: malePhotos[1],
    grade: '8th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-03-10',
    incidents: [
      {
        id: 'INC-2025-0050',
        date: '2025-03-10',
        type: 'Emergency Exit Misuse',
        severity: 'High',
        status: 'In Progress',
        description: 'Touched emergency exit release without permission',
      },
    ],
  },
  {
    id: 'STU-8783',
    name: 'Natalie Collins',
    photoUrl: femalePhotos[2],
    grade: '10th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-03-09',
    incidents: [
      {
        id: 'INC-2025-0051',
        date: '2025-03-09',
        type: 'Offensive Language',
        severity: 'High',
        status: 'Open',
        description: 'Directed profanity at driver when asked to quiet down',
      },
    ],
  },
  {
    id: 'STU-9894',
    name: 'Tyler Stewart',
    photoUrl: malePhotos[2],
    grade: '6th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 1,
    lastIncident: '2025-03-08',
    incidents: [
      {
        id: 'INC-2025-0052',
        date: '2025-03-08',
        type: 'Physical Altercation',
        severity: 'High',
        status: 'Open',
        description: 'Grabbed and pushed another student in argument',
      },
    ],
  },
  {
    id: 'STU-1905',
    name: 'Hannah Morris',
    photoUrl: femalePhotos[3],
    grade: '12th Grade',
    school: 'Roosevelt High School',
    bus: 'Bus 14',
    route: 'Roosevelt High AM - Red',
    incidentCount: 1,
    lastIncident: '2025-03-07',
    incidents: [
      {
        id: 'INC-2025-0053',
        date: '2025-03-07',
        type: 'Disruptive Behavior',
        severity: 'Medium',
        status: 'In Progress',
        description: 'Making fun of another student repeatedly',
      },
    ],
  },
  {
    id: 'STU-2016',
    name: 'Andrew Rogers',
    photoUrl: malePhotos[0],
    grade: '3rd Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    incidentCount: 1,
    lastIncident: '2025-03-06',
    incidents: [
      {
        id: 'INC-2025-0054',
        date: '2025-03-06',
        type: 'Disruptive Volume',
        severity: 'Low',
        status: 'Closed',
        description: 'Yelling and making loud noises',
      },
    ],
  },
  {
    id: 'STU-3127',
    name: 'Samantha Reed',
    photoUrl: femalePhotos[4],
    grade: '7th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 3,
    lastIncident: '2025-03-05',
    incidents: [
      {
        id: 'INC-2025-0055',
        date: '2025-03-05',
        type: 'Property Damage',
        severity: 'Medium',
        status: 'Open',
        description: 'Drew on window with marker',
      },
      {
        id: 'INC-2025-0014',
        date: '2025-01-10',
        type: 'Seat Refusal',
        severity: 'Low',
        status: 'Closed',
        description: 'Refused to sit in assigned seat',
      },
      {
        id: 'INC-2025-0011',
        date: '2024-12-20',
        type: 'Disruptive Volume',
        severity: 'Low',
        status: 'Closed',
        description: 'Talking loudly on bus',
      },
    ],
  },
  {
    id: 'STU-4238',
    name: 'Jacob Cook',
    photoUrl: malePhotos[1],
    grade: '9th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 1,
    lastIncident: '2025-03-04',
    incidents: [
      {
        id: 'INC-2025-0056',
        date: '2025-03-04',
        type: 'Window Misuse',
        severity: 'Medium',
        status: 'In Progress',
        description: 'Hanging arm out window while bus moving',
      },
    ],
  },
  {
    id: 'STU-5349',
    name: 'Alexis Morgan',
    photoUrl: femalePhotos[0],
    grade: '8th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 1,
    lastIncident: '2025-03-03',
    incidents: [
      {
        id: 'INC-2025-0057',
        date: '2025-03-03',
        type: 'Eating/Drinking Violation',
        severity: 'Medium',
        status: 'Open',
        description: 'Eating messy food and leaving trash on floor',
      },
    ],
  },
  {
    id: 'STU-6450',
    name: 'Dylan Bell',
    photoUrl: malePhotos[2],
    grade: '11th Grade',
    school: 'Roosevelt High School',
    bus: 'Bus 14',
    route: 'Roosevelt High AM - Red',
    incidentCount: 1,
    lastIncident: '2025-03-02',
    incidents: [
      {
        id: 'INC-2025-0058',
        date: '2025-03-02',
        type: 'Offensive Language',
        severity: 'Medium',
        status: 'Closed',
        description: 'Using inappropriate language with other students',
      },
    ],
  },
  {
    id: 'STU-7561',
    name: 'Brianna Cooper',
    photoUrl: femalePhotos[1],
    grade: '4th Grade',
    school: 'Lincoln Elementary',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    incidentCount: 1,
    lastIncident: '2025-03-01',
    incidents: [
      {
        id: 'INC-2025-0059',
        date: '2025-03-01',
        type: 'Physical Altercation',
        severity: 'High',
        status: 'In Progress',
        description: 'Hit another student with backpack',
      },
    ],
  },
  {
    id: 'STU-8672',
    name: 'Nathan Richardson',
    photoUrl: malePhotos[0],
    grade: '6th Grade',
    school: 'Jefferson Middle School',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    incidentCount: 1,
    lastIncident: '2025-02-28',
    incidents: [
      {
        id: 'INC-2025-0060',
        date: '2025-02-28',
        type: 'Disruptive Volume',
        severity: 'Medium',
        status: 'Closed',
        description: 'Playing videos on phone at high volume',
      },
    ],
  },
  {
    id: 'STU-9783',
    name: 'Kayla Bailey',
    photoUrl: femalePhotos[2],
    grade: '10th Grade',
    school: 'Washington High School',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    incidentCount: 4,
    lastIncident: '2025-02-27',
    incidents: [
      {
        id: 'INC-2025-0061',
        date: '2025-02-27',
        type: 'Disruptive Behavior',
        severity: 'High',
        status: 'Open',
        description: 'Spreading rumors and excluding another student',
      },
      {
        id: 'INC-2025-0013',
        date: '2025-01-08',
        type: 'Offensive Language',
        severity: 'Medium',
        status: 'Closed',
        description: 'Used profanity in conversation',
      },
      {
        id: 'INC-2025-0010',
        date: '2024-12-15',
        type: 'Physical Altercation',
        severity: 'High',
        status: 'Closed',
        description: 'Altercation with another student',
      },
      {
        id: 'INC-2025-0009',
        date: '2024-12-01',
        type: 'Disruptive Volume',
        severity: 'Low',
        status: 'Closed',
        description: 'Loud and disruptive behavior',
      },
    ],
  },
  {
    id: 'STU-1894',
    name: 'Justin Rivera',
    photoUrl: malePhotos[1],
    grade: '7th Grade',
    school: 'Lincoln Middle School',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    incidentCount: 5,
    lastIncident: '2025-02-26',
    incidents: [
      {
        id: 'INC-2025-0062',
        date: '2025-02-26',
        type: 'Seat Refusal',
        severity: 'Low',
        status: 'Closed',
        description: 'Moved seats without permission',
      },
      {
        id: 'INC-2025-0008',
        date: '2024-11-20',
        type: 'Property Damage',
        severity: 'Medium',
        status: 'Closed',
        description: 'Damage to bus seat',
      },
      {
        id: 'INC-2025-0007',
        date: '2024-11-05',
        type: 'Offensive Language',
        severity: 'Medium',
        status: 'Closed',
        description: 'Inappropriate language',
      },
      {
        id: 'INC-2025-0006',
        date: '2024-10-15',
        type: 'Physical Altercation',
        severity: 'High',
        status: 'Closed',
        description: 'Fighting with another student',
      },
      {
        id: 'INC-2025-0005',
        date: '2024-10-01',
        type: 'Disruptive Volume',
        severity: 'Low',
        status: 'Closed',
        description: 'Excessive noise on bus',
      },
    ],
  },
];

interface StudentsPageProps {
  onNavigate: (page: string) => void;
  initialActiveIncidentsFilter?: boolean;
  onNavigateToIncidentDetail?: (incident: any) => void;
}

// Converts YYYY-MM-DD to MM-DD-YYYY for display
const fmtDate = (d: string) => d ? d.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2-$3-$1') : d;

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];
const MONTH_ABBREVS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

/** Match a search term against multiple representations of a YYYY-MM-DD date */
function matchesDate(dateStr: string | undefined, term: string): boolean {
  if (!dateStr) return false;
  const lower = term.toLowerCase();

  // Direct substring on raw ISO date
  if (dateStr.toLowerCase().includes(lower)) return true;

  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const [yyyy, mm, dd] = parts;
  const monthIdx = parseInt(mm, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return false;

  const monthFull = MONTH_NAMES[monthIdx];
  const monthAbbr = MONTH_ABBREVS[monthIdx];
  const day = parseInt(dd, 10).toString();
  const year = yyyy;

  const variants = [
    `${monthFull} ${day}, ${year}`,
    `${monthFull} ${dd}, ${year}`,
    `${monthFull} ${day}`,
    `${monthAbbr} ${day}, ${year}`,
    `${monthAbbr} ${day}`,
    `${mm}/${dd}/${yyyy}`,
    `${parseInt(mm, 10)}/${day}/${yyyy}`,
    `${mm}/${dd}`,
    `${parseInt(mm, 10)}/${day}`,
    `${mm}-${dd}-${yyyy}`,
    monthFull,
    monthAbbr,
  ];

  return variants.some(v => v.includes(lower));
}

export function StudentsPage({ onNavigate, initialActiveIncidentsFilter = false, onNavigateToIncidentDetail }: StudentsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [incidentSearchTerm, setIncidentSearchTerm] = useState('');
  const dialogRef = useRef<HTMLElement>(null);
  const toastHelper = useForgeToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<string[]>([]);
  const [schoolFilter, setSchoolFilter] = useState<string[]>([]);
  const [activeIncidentsFilter, setActiveIncidentsFilter] = useState<boolean>(initialActiveIncidentsFilter);
  
  // Sorting state - default sort by name, then school
  const [sortColumn, setSortColumn] = useState<'id' | 'name' | 'grade' | 'school' | 'incidents' | 'lastIncident'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Every student's incidents, derived from mockIncidents rather than from the
  // per-student incidents array and the incidentCount and lastIncident scalars
  // that sat beside it. Those were a parallel history: 13 of their 59 entries
  // existed nowhere in mockIncidents and used retired type names such as "Seat
  // Refusal", so twelve students showed a different count here than the
  // incidents grid showed for the same person.
  //
  // A record is the real incident row plus the student's role on it, which only
  // multi-student incidents carry. Severity and description stay at incident
  // level so this page and the incidents grid always say the same thing.
  //
  // This must stay inside the component. StudentsPage and IncidentsPage sit in
  // an import cycle (IncidentsPage -> NewIncidentForm -> StudentsPage), so at
  // this module's top level mockIncidents is still in its temporal dead zone.
  const incidentsByStudent = useMemo(() => {
    const byStudent = new Map<string, any[]>();
    for (const inc of mockIncidents as any[]) {
      for (const involved of (inc.involvedStudents ?? [])) {
        const id = involved?.studentId;
        if (!id) continue;
        const list = byStudent.get(id) ?? [];
        list.push({ ...inc, role: involved.role });
        byStudent.set(id, list);
      }
    }
    // Newest first, matching how the removed arrays were ordered
    for (const list of byStudent.values()) {
      list.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    }
    return byStudent;
  }, []);

  const incidentsFor = (student: any): any[] => incidentsByStudent.get(student.id) ?? [];
  const incidentCountFor = (student: any) => incidentsFor(student).length;
  // The list is already newest first, so the first entry is the most recent.
  const lastIncidentFor = (student: any) => incidentsFor(student)[0]?.date ?? '';

  // Typeahead groups, limited to the fields the filter below actually matches.
  // Student IDs are searchable but not suggested; a partial ID is not something
  // anyone browses for, and listing 46 of them would bury the useful options.
  const searchSuggestionGroups = useMemo(() => [
    { kind: 'Student', values: mockStudents.map(s => s.name) },
    { kind: 'School', values: mockStudents.map(s => s.school) },
    { kind: 'Vehicle', values: mockStudents.map(s => s.bus) },
    { kind: 'Run', values: mockStudents.map(s => s.route) },
  ], []);

  // Get unique grades and schools for filters
  const uniqueGrades = Array.from(new Set(mockStudents.map(s => s.grade))).sort();
  const uniqueSchools = Array.from(new Set(mockStudents.map(s => s.school))).sort();

  // Sync dialogOpen state to forge-dialog element
  useEffect(() => {
    if (dialogRef.current) {
      (dialogRef.current as any).open = dialogOpen;
    }
  }, [dialogOpen]);

  // Listen for forge-dialog-close event
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handleClose = () => {
      setDialogOpen(false);
      setSelectedStudent(null);
    };
    el.addEventListener('forge-dialog-close', handleClose);
    return () => el.removeEventListener('forge-dialog-close', handleClose);
  }, []);

  const filteredStudents = mockStudents.filter((student) => {
    // Search filter. Bus and run are matched so a student can be found the way
    // the incidents grid finds one, from the vehicle or the run rather than only
    // from their name.
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = q === '' || [
      student.name,
      student.id,
      student.school,
      student.bus,
      student.route,
    ].some((field: any) => (field ?? '').toLowerCase().includes(q));

    // Grade filter (empty array = all)
    const matchesGrade = gradeFilter.length === 0 || gradeFilter.includes(student.grade);
    
    // School filter (empty array = all)
    const matchesSchool = schoolFilter.length === 0 || schoolFilter.includes(student.school);
    
    // Active incidents filter
    const hasActiveIncidents = incidentsFor(student).some((incident: any) => incident.status !== 'Closed');
    const matchesActiveFilter = !activeIncidentsFilter || hasActiveIncidents;
    
    return matchesSearch && matchesGrade && matchesSchool && matchesActiveFilter;
  });
  
  // Function to handle column header clicks
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with ascending direction
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Sort the filtered students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let compareResult = 0;
    
    switch (sortColumn) {
      case 'id':
        compareResult = a.id.localeCompare(b.id);
        break;
      case 'name':
        compareResult = a.name.localeCompare(b.name);
        // Secondary sort by school if names are equal
        if (compareResult === 0) {
          compareResult = a.school.localeCompare(b.school);
        }
        break;
      case 'grade':
        compareResult = a.grade.localeCompare(b.grade);
        break;
      case 'school':
        compareResult = a.school.localeCompare(b.school);
        break;
      case 'incidents':
        compareResult = incidentCountFor(a) - incidentCountFor(b);
        break;
      case 'lastIncident':
        // String compare on YYYY-MM-DD rather than Date parsing, so a student
        // with no incidents sorts as empty instead of Invalid Date.
        compareResult = lastIncidentFor(a).localeCompare(lastIncidentFor(b));
        break;
    }
    
    return sortDirection === 'asc' ? compareResult : -compareResult;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedStudents.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + rowsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradeFilter, schoolFilter, activeIncidentsFilter, rowsPerPage]);
  
  // Render sort icon for column header
  const SortIcon = ({ column }: { column: typeof sortColumn }) => {
    if (sortColumn !== column) {
      return <forge-icon name="unfold_more" style={{ fontSize: '14px', marginLeft: '4px', opacity: 0.5 }}></forge-icon>;
    }
    return sortDirection === 'asc' 
      ? <forge-icon name="arrow_upward" style={{ fontSize: '14px', marginLeft: '4px' }}></forge-icon>
      : <forge-icon name="arrow_downward" style={{ fontSize: '14px', marginLeft: '4px' }}></forge-icon>;
  };

  const activeFilterCount = [
    gradeFilter.length > 0,
    schoolFilter.length > 0,
    activeIncidentsFilter
  ].filter(Boolean).length;

  const clearFilters = () => {
    setGradeFilter([]);
    setSchoolFilter([]);
    setActiveIncidentsFilter(false);
  };

  const handleExport = (format: ExportFormat) => {
    const formatLabels: Record<ExportFormat, string> = {
      excel: 'Excel Spreadsheet', csv: 'CSV',
    };
    toastHelper[0]({
      message: `Export started — preparing ${formatLabels[format]} for students data.`,
      theme: 'success',
      duration: 3000,
    } as any);
  };

  // KPI calculations
  // Derived rather than the roster length, so the number keeps matching the
  // label. Every student on the roster happens to have an incident today, so the
  // two agree, but a student added without one would make a roster count wrong.
  const studentsWithIncidents = mockStudents.filter(s => incidentCountFor(s) > 0).length;
  const studentsWithActiveIncidents = mockStudents.filter(s => incidentsFor(s).some((i: any) => i.status !== 'Closed')).length;
  const totalStudentIncidents = mockStudents.reduce((sum, s) => sum + incidentCountFor(s), 0);
  const repeatOffenders = mockStudents.filter(s => incidentCountFor(s) >= 3).length;

  return (
    <div style={{ padding: 'var(--forge-spacing-xlarge)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '8px', fontFamily: 'Roboto, sans-serif' }}>Students</h1>
          <p className="text-muted-foreground" style={{ margin: 0, fontFamily: 'Roboto, sans-serif' }}>
            View student records and associated incidents
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{studentsWithIncidents}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Students With Incidents</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ea580c', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{studentsWithActiveIncidents}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Active Incidents</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#dc2626', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{totalStudentIncidents}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Total Incidents</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-olive-medium)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{repeatOffenders}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Repeat Offenders</h3>
          </div>
        </ForgeCard>
      </div>

      {/* Search and Filters */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)', marginBottom: 'var(--forge-spacing-large)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)', paddingTop: 'var(--forge-spacing-large)' }}>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <EntitySearchField
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by student name, ID, school, bus, or run..."
                groups={searchSuggestionGroups}
              />
            </div>

            {/* Filters Section */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <forge-icon name="filter_list" style={{ fontSize: '16px', color: 'var(--forge-theme-text-medium)' }}></forge-icon>
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>

              {/* Grade Filter - Forge MultiSelect */}
              <ForgeMultiSelect
                options={uniqueGrades.map(g => ({ value: g, label: g }))}
                selected={gradeFilter}
                onChange={setGradeFilter}
                placeholder="Grade"
                allLabel="All Grades"
                width="180px"
              />

              {/* School Filter - Forge MultiSelect */}
              <ForgeMultiSelect
                options={uniqueSchools.map(s => ({ value: s, label: s }))}
                selected={schoolFilter}
                onChange={setSchoolFilter}
                placeholder="School"
                allLabel="All Schools"
                width="220px"
              />

              {/* Active Incidents Filter */}
              <forge-checkbox
                ref={(el: any) => {
                  if (!el) return;
                  el.checked = activeIncidentsFilter;
                  const handler = (e: any) => setActiveIncidentsFilter(!!e.target.checked);
                  el.removeEventListener('change', handler);
                  el.addEventListener('change', handler);
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                Active Incidents Only
              </forge-checkbox>

              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <ForgeButton variant="outlined" size="sm" onClick={clearFilters}>
                  Clear Filters
                </ForgeButton>
              )}
            </div>
          </div>
        </div>
      </ForgeCard>

      {/* Active Filter Banner */}
      {activeIncidentsFilter && (
        <div className="flex items-center gap-3 p-3 rounded-md mb-4" style={{ backgroundColor: 'var(--forge-color-surface-info, #f5f3ff)', border: '1px solid var(--forge-color-border-info, #c4b5fd)', borderRadius: 'var(--forge-shape-medium)', fontFamily: 'var(--forge-font-family)' }}>
          <forge-icon name="error" style={{ fontSize: '16px', flexShrink: 0, color: 'var(--forge-color-text-info, #7c3aed)' }}></forge-icon>
          <span style={{ fontSize: 'var(--forge-font-size-sm)', color: 'var(--forge-color-text-info, #5b21b6)', fontFamily: 'var(--forge-font-family)' }}>
            Filtered view: Showing only students with active (non-closed) incidents
          </span>
          <ForgeButton
            variant="flat"
            size="sm"
            className="ml-auto h-7"
            style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}
            onClick={clearFilters}
          >
            Clear Filters
          </ForgeButton>
        </div>
      )}

      {/* Students Table */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }} className="flex flex-row items-center justify-between">
          <h3 className="forge-typography--heading4">
            All Students <span className="text-muted-foreground">({filteredStudents.length})</span>
          </h3>
          <div className="flex gap-2">
            <ExportDropdown onExport={handleExport} />
          </div>
        </div>
        <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
          <div className="overflow-x-auto">
            <table className="forge-table">
              <thead>
                <tr>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('id')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Student ID
                      <SortIcon column="id" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Name
                      <SortIcon column="name" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('grade')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Grade
                      <SortIcon column="grade" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('school')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      School
                      <SortIcon column="school" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('incidents')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Total Incidents
                      <SortIcon column="incidents" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('lastIncident')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Last Incident
                      <SortIcon column="lastIncident" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => {
                  const activeIncidents = incidentsFor(student).filter((incident: any) => incident.status !== 'Closed');
                  const hasActiveIncidents = activeIncidents.length > 0;
                  const highestActiveSeverity = hasActiveIncidents
                    ? (activeIncidents.some((i: any) => i.severity === 'High') ? 'High'
                      : activeIncidents.some((i: any) => i.severity === 'Medium') ? 'Medium'
                      : 'Low')
                    : null;
                  
                  return (
                        <tr
                          key={student.id}
                          className="forge-table-row cursor-pointer"
                          style={{ transition: 'background-color 0.15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--forge-theme-primary-container-minimum)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          onClick={() => { setSelectedStudent(student); setIncidentSearchTerm(''); setDialogOpen(true); }}
                        >
                        <td className="forge-table-cell">
                          <div style={{ fontWeight: 500, fontFamily: 'Roboto, sans-serif' }}>
                            {student.id}
                          </div>
                        </td>
                        <td className="forge-table-cell">
                          <div>
                            <div style={{ fontWeight: 500, fontFamily: 'var(--forge-font-family)' }}>{student.name}</div>
                            {hasActiveIncidents && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <forge-badge
                                  theme={highestActiveSeverity === 'High' ? 'error' : highestActiveSeverity === 'Medium' ? 'warning' : 'default'}
                                  strong
                                >
                                  Active Incident
                                </forge-badge>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="forge-table-cell">
                          <span>{student.grade}</span>
                        </td>
                        <td className="forge-table-cell">
                          <span>{student.school}</span>
                        </td>
                        <td className="forge-table-cell">
                          {/* Incident count badge with color coding:
                              1-2 incidents: yellow
                              3 incidents: orange
                              4+ incidents: red */}
                          <forge-badge
                            theme={incidentCountFor(student) >= 4 ? 'error' : incidentCountFor(student) === 3 ? 'warning' : 'default'}
                          >
                            {incidentCountFor(student)} {incidentCountFor(student) === 1 ? 'incident' : 'incidents'}
                          </forge-badge>
                        </td>
                        <td className="forge-table-cell">
                          <div className="flex items-center gap-2">
                            <forge-icon name="calendar_today" style={{ fontSize: '16px', color: 'var(--forge-theme-text-medium)' }}></forge-icon>
                            <span>{lastIncidentFor(student) ? fmtDate(lastIncidentFor(student)) : '—'}</span>
                          </div>
                        </td>
                        </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between" style={{ paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', marginTop: 'var(--forge-spacing-medium)' }}>
            <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, sortedStudents.length)} of {sortedStudents.length} students
              </span>
              {rowsPerPage === 5 && sortedStudents.length > 5 && (
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
                <ForgeButton
                  variant="outlined"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: 'var(--forge-spacing-xxsmall) var(--forge-spacing-xsmall)' }}
                >
                  <forge-icon name="chevron_left" style={{ fontSize: '18px' }}></forge-icon>
                </ForgeButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <ForgeButton
                    key={page}
                    variant={page === currentPage ? 'raised' : 'outlined'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      ['--forge-button-min-width' as any]: '24px',
                      ['--forge-button-padding-inline' as any]: '6px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {page}
                  </ForgeButton>
                ))}
                <ForgeButton
                  variant="outlined"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: 'var(--forge-spacing-xxsmall) var(--forge-spacing-xsmall)' }}
                >
                  <forge-icon name="chevron_right" style={{ fontSize: '18px' }}></forge-icon>
                </ForgeButton>
              </div>
            )}
          </div>
        </div>
      </ForgeCard>

      {/* @ts-ignore */}
      <forge-dialog ref={dialogRef} aria-label={`Student Profile - ${selectedStudent?.name || ''}`}>
        <div style={{ padding: 'var(--forge-spacing-large)', minWidth: '500px', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
          {selectedStudent && (
            <>
              {/* Header: 2-column split — name+grade/school left, last incident+ID right */}
              <div className="flex items-start justify-between gap-4" style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
                <div>
                  <h2 style={{ margin: 0, marginBottom: 'var(--forge-spacing-xxsmall)', fontFamily: 'var(--forge-font-family)', fontWeight: 700, fontSize: 'var(--forge-font-size-xl)' }}>
                    Student Profile - {selectedStudent.name}
                  </h2>
                  <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>
                    {selectedStudent.grade}
                    <span style={{ margin: '0 var(--forge-spacing-xsmall)' }}>·</span>
                    {selectedStudent.school}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>
                  <div className="flex items-center justify-end" style={{ gap: 'var(--forge-spacing-xsmall)', marginBottom: 'var(--forge-spacing-xxsmall)' }}>
                    <forge-icon name="calendar_today" style={{ fontSize: '14px' }}></forge-icon>
                    <span>Last Incident: {lastIncidentFor(selectedStudent) ? fmtDate(lastIncidentFor(selectedStudent)) : 'None'}</span>
                  </div>
                  <div>{selectedStudent.id}</div>
                </div>
              </div>

              <div>
                {/* Incident Search/Filter */}
                <div className="relative" style={{ marginBottom: 'var(--forge-spacing-xsmall)' }}>
                  <forge-icon name="search" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--forge-theme-text-medium)', pointerEvents: 'none' }}></forge-icon>
                  <input
                    type="text"
                    placeholder="Search incidents by ID, type, status, or description..."
                    value={incidentSearchTerm}
                    onChange={(e) => setIncidentSearchTerm(e.target.value)}
                    className="w-full border rounded pl-7 pr-7 py-1.5 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    style={{
                      fontFamily: 'var(--forge-font-family)',
                      fontSize: 'var(--forge-font-size-xs)',
                      borderColor: 'var(--forge-theme-outline, rgba(0,0,0,0.12))',
                      borderRadius: 'var(--forge-shape-medium)',
                    }}
                  />
                  {incidentSearchTerm && (
                    <button
                      onClick={() => setIncidentSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-none p-0 cursor-pointer"
                    >
                      <forge-icon name="close" style={{ fontSize: '14px' }}></forge-icon>
                    </button>
                  )}
                </div>

                {/* Incidents List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-small)' }}>
                  {incidentsFor(selectedStudent)
                    .filter((incident: any) => {
                      if (!incidentSearchTerm.trim()) return true;
                      const term = incidentSearchTerm.toLowerCase();
                      return (
                        incident.id?.toLowerCase().includes(term) ||
                        incident.type?.toLowerCase().includes(term) ||
                        incident.status?.toLowerCase().includes(term) ||
                        incident.severity?.toLowerCase().includes(term) ||
                        incident.description?.toLowerCase().includes(term) ||
                        matchesDate(incident.date, incidentSearchTerm)
                      );
                    })
                    .map((incident: any, idx: number, list: any[]) => {
                      const borderColor = incident.severity === 'Critical' ? '#dc2626'
                        : incident.severity === 'High' ? '#ea580c'
                        : incident.severity === 'Medium' ? '#f59e0b'
                        : '#94a3b8';
                      // Year divider, same rule as the incidents grid: the list
                      // is newest first, so a heading appears each time the year
                      // changes. This is where a district actually reads a
                      // student's history, so prior-year incidents need to be
                      // visibly separated from the current year's.
                      const showYearDivider =
                        yearForDate(incident.date) !== yearForDate(list[idx - 1]?.date);
                      return (
                      <React.Fragment key={incident.id}>
                      {showYearDivider && (
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)',
                            marginTop: idx === 0 ? 0 : 'var(--forge-spacing-xsmall)',
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.5px',
                            color: 'var(--forge-theme-text-medium)',
                          }}
                        >
                          <span>{yearForDate(incident.date)}</span>
                          <span style={{ flex: 1, height: 1, background: 'var(--forge-theme-outline, rgba(0,0,0,0.12))' }} />
                        </div>
                      )}
                      {/* Compact row, matching the Forge build's student
                          profile rather than the tall card this used to be. The
                          type leads, severity and status sit on the same line,
                          and the description is one clamped line. Four incidents
                          now fit where one used to. */}
                      <div
                        className="cursor-pointer"
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 'var(--forge-spacing-small)',
                          padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
                          borderBottom: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))',
                          borderLeft: `3px solid ${borderColor}`,
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--forge-theme-primary-container-minimum)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        onClick={() => {
                          // A real mockIncidents row, so it already carries the
                          // bus, run, driver and assignee.
                          if (onNavigateToIncidentDetail) onNavigateToIncidentDetail(incident);
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center justify-between gap-2">
                            <span style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.3 }}>
                              {incident.type}
                            </span>
                            <span className="text-muted-foreground" style={{ fontSize: '0.75rem', flexShrink: 0 }}>
                              {fmtDate(incident.date)}
                            </span>
                          </div>

                          <div className="flex items-center flex-wrap" style={{ gap: '6px', marginTop: '3px' }}>
                            {/* @ts-ignore */}
                            <forge-badge
                              theme={incident.severity === 'Critical' ? 'danger' : incident.severity === 'High' ? 'error' : incident.severity === 'Medium' ? 'warning' : 'info'}
                              strong
                            >
                              {incident.severity}
                            </forge-badge>
                            {/* @ts-ignore */}
                            <forge-badge theme={incident.status === 'Open' ? 'info-primary' : incident.status === 'In Progress' ? 'warning' : 'default'}>
                              {incident.status}
                            </forge-badge>
                            {incident.role && (
                              /* @ts-ignore */
                              <forge-badge theme="default">{incident.role}</forge-badge>
                            )}
                            <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                              {/* The incident's own bus, not the student's current
                                  assignment; a student may have been on another. */}
                              {incident.bus ?? selectedStudent.bus} &nbsp;&middot;&nbsp; {incident.id}
                            </span>
                          </div>

                          {incident.description && (
                            <div
                              className="text-muted-foreground"
                              style={{
                                fontSize: '0.8125rem', marginTop: '4px',
                                display: '-webkit-box', WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                              }}
                            >
                              {incident.description}
                            </div>
                          )}
                        </div>
                      </div>
                      </React.Fragment>
                      );
                    })}
                  {incidentSearchTerm.trim() && incidentsFor(selectedStudent).filter((inc: any) => {
                    const t = incidentSearchTerm.toLowerCase();
                    return inc.id?.toLowerCase().includes(t) || inc.type?.toLowerCase().includes(t) || inc.status?.toLowerCase().includes(t) || inc.severity?.toLowerCase().includes(t) || inc.description?.toLowerCase().includes(t) || matchesDate(inc.date, incidentSearchTerm);
                  }).length === 0 && (
                    <div className="text-center" style={{ padding: 'var(--forge-spacing-medium)', color: 'var(--muted-foreground)', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>
                      No incidents match &ldquo;{incidentSearchTerm}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </forge-dialog>
    </div>
  );
}