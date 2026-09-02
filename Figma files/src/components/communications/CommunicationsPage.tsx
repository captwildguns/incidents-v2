import { useState, useRef, useEffect } from 'react';
import { ForgeCard, ForgeButton } from '@tylertech/forge-react';
import {
  defineCardComponent,
  defineButtonComponent,
  defineTextFieldComponent,
  defineBadgeComponent,
  defineIconComponent,
} from '@tylertech/forge';
defineCardComponent();
defineButtonComponent();
defineTextFieldComponent();
defineBadgeComponent();
defineIconComponent();
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription } from '../ui/alert';
import { ForgeMultiSelect } from '../ui/forge-multiselect';

import { mockIncidents, getIncidentSubjectLabel } from '../incidents/IncidentsPage';
import { getSubjectLabel, INCIDENT_SUBJECTS } from '../incidents/IncidentTypes';
import { counterpartyFor } from '../../data/incident-counterparty';

interface Message {
  id: string;
  sender: string;
  // 'driver' predates non-student subjects and now means "the other party in
  // this thread", whoever counterpartyFor resolves that to. Left as the stored
  // value so the 26 seeded threads did not have to be rewritten; the UI reads
  // it as coordinator or not.
  senderRole: 'coordinator' | 'driver';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface IncidentCommunication {
  incidentId: string;
  incidentDate: string;
  // Optional: a location or vehicle incident has no student
  student?: string;
  studentId?: string;
  incidentType: string;
  driver: string;
  bus: string;
  route: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'in-progress' | 'resolved';
  lastMessageTime: string;
  unreadMessages: number;
  assignedTo: string; // Added to track who is assigned to this incident
  messages: Message[];
}

// Mock data
const mockCommunications: IncidentCommunication[] = [
  // ─── Non-student subjects ──────────────────────────────────────────────────
  // No student on any of these. The counterparty is derived from the incident,
  // so the thread is with the location manager, the fleet manager or the
  // employee rather than with a driver who was never involved.
  {
    incidentId: 'INC-2025-0066',
    incidentDate: '2025-03-10',
    incidentType: 'Utility Failure',
    driver: 'Robert Mills',
    bus: 'N/A',
    route: 'N/A',
    severity: 'Medium',
    status: 'in-progress',
    lastMessageTime: '7:15 AM',
    unreadMessages: 1,
    assignedTo: 'Mike Chen',
    messages: [
      {
        id: 'MSG-0066-1',
        sender: 'Robert Mills',
        senderRole: 'driver',
        content: 'Water line above the maintenance bay let go overnight. Roughly 400 square feet of standing water. I have coned it off and both lifts are tagged out of service.',
        timestamp: '2025-03-10 05:40 AM',
        status: 'read',
      },
      {
        id: 'MSG-0066-2',
        sender: 'Mike Chen',
        senderRole: 'coordinator',
        content: 'Understood. Contractor is called out for this morning. Keep the bay closed until they clear it, and move any pull-out scheduled from those lifts to South District.',
        timestamp: '2025-03-10 06:05 AM',
        status: 'read',
      },
      {
        id: 'MSG-0066-3',
        sender: 'Robert Mills',
        senderRole: 'driver',
        content: 'Reassigned the two buses. Contractor on site now, says the line is replaceable but the floor needs to dry before the lifts can be certified again.',
        timestamp: '2025-03-10 07:15 AM',
        status: 'delivered',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0067',
    incidentDate: '2025-03-09',
    incidentType: 'Vehicle Damage',
    driver: 'Terrance Boyle',
    bus: 'Bus 18',
    route: 'N/A',
    severity: 'Medium',
    status: 'in-progress',
    lastMessageTime: '8:20 AM',
    unreadMessages: 0,
    assignedTo: 'Mike Chen',
    messages: [
      {
        id: 'MSG-0067-1',
        sender: 'Mike Chen',
        senderRole: 'coordinator',
        content: 'Bus 18 came up on the pre-trip with a cracked mirror housing and a scraped rear quarter. Nobody was aboard and nothing was reported last night. Can you pull the yard camera for the overnight window?',
        timestamp: '2025-03-09 06:30 AM',
        status: 'read',
      },
      {
        id: 'MSG-0067-2',
        sender: 'Terrance Boyle',
        senderRole: 'driver',
        content: 'Footage requested. Bus 18 is unassigned so it sat on the far row all night. I will have the mirror on order either way, that is a same-day part.',
        timestamp: '2025-03-09 08:20 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0070',
    incidentDate: '2025-03-14',
    incidentType: 'Employee Injury',
    driver: 'Denise Okafor',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    severity: 'High',
    status: 'in-progress',
    lastMessageTime: '11:30 AM',
    unreadMessages: 2,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'MSG-0070-1',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'I have your injury report from this morning. Before anything else, how are you doing? Occupational health has you on the list for today.',
        timestamp: '2025-03-14 09:10 AM',
        status: 'read',
      },
      {
        id: 'MSG-0070-2',
        sender: 'Denise Okafor',
        senderRole: 'driver',
        content: 'Sore but walking. I finished the run because there was nobody else on the bus to secure the chair. Seen at 10:30, they have me on light duty for now.',
        timestamp: '2025-03-14 11:05 AM',
        status: 'read',
      },
      {
        id: 'MSG-0070-3',
        sender: 'Denise Okafor',
        senderRole: 'driver',
        content: 'One thing worth flagging: this is the second lift strain out of this garage this year. The forward bay clearance is tight and you end up lifting at an angle.',
        timestamp: '2025-03-14 11:30 AM',
        status: 'delivered',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0042',
    incidentDate: '2025-03-15',
    student: 'Sarah Mitchell',
    studentId: 'STU-2891',
    incidentType: 'Safety Violation',
    driver: 'John Chen',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    severity: 'Medium',
    status: 'in-progress',
    lastMessageTime: '10:45 AM',
    unreadMessages: 1,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-1',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Student Sarah Mitchell refused to stay seated during the route. This happened multiple times between stops 3 and 7. I gave her two verbal warnings.',
        timestamp: '2025-03-15 08:30 AM',
        status: 'read',
      },
      {
        id: 'msg-2',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'Thanks for the report, Michael. Can you provide more details about what triggered this behavior? Was there any interaction with other students?',
        timestamp: '2025-03-15 09:15 AM',
        status: 'read',
      },
      {
        id: 'msg-3',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'She was trying to talk to friends in the back. When I asked her to sit down, she complied briefly but stood up again after a few minutes.',
        timestamp: '2025-03-15 10:45 AM',
        status: 'delivered',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0041',
    incidentDate: '2025-03-15',
    student: 'Marcus Johnson',
    studentId: 'STU-3421',
    incidentType: 'Safety Violation',
    driver: 'Lisa Anderson',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    severity: 'High',
    status: 'in-progress',
    lastMessageTime: '9:20 AM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-4',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'URGENT: Marcus attempted to open the emergency exit while we were in motion on Washington High PM - Wolf Rd. I had to pull over immediately. This is a serious safety concern.',
        timestamp: '2025-03-15 08:45 AM',
        status: 'read',
      },
      {
        id: 'msg-5',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Thank you for the immediate report, Lisa. This is very serious. I\'m contacting the parents and school administration right away. Are you and the other students okay?',
        timestamp: '2025-03-15 09:00 AM',
        status: 'read',
      },
      {
        id: 'msg-6',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'Yes, everyone is safe. I explained the danger to Marcus and he seemed to understand the severity. No other incidents for the rest of the route.',
        timestamp: '2025-03-15 09:20 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0040',
    incidentDate: '2025-03-14',
    student: 'Emma Rodriguez',
    studentId: 'STU-1956',
    incidentType: 'Disruptive Behavior',
    driver: 'David Park',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    severity: 'High',
    status: 'in-progress',
    lastMessageTime: '3:45 PM',
    unreadMessages: 2,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-7',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Emma was verbally taunting another student (Jennifer Lee) throughout the afternoon route. The victim appeared upset and distressed.',
        timestamp: '2025-03-14 3:45 PM',
        status: 'read',
      },
      {
        id: 'msg-8',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'Thanks David. Did you intervene? What was Emma\'s response?',
        timestamp: '2025-03-14 4:10 PM',
        status: 'delivered',
      },
      {
        id: 'msg-9',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Yes, I separated them and had Emma sit closer to the front. She stopped the verbal taunting but gave dirty looks. I think this needs parent involvement.',
        timestamp: '2025-03-14 4:30 PM',
        status: 'sent',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0039',
    incidentDate: '2025-03-14',
    student: 'James Thompson',
    studentId: 'STU-4782',
    incidentType: 'Property Damage',
    driver: 'John Chen',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    severity: 'Low',
    status: 'resolved',
    lastMessageTime: '2:15 PM',
    unreadMessages: 0,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-10',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Found a torn seat cushion in row 5. James was sitting there and admitted to picking at it. The damage requires replacement.',
        timestamp: '2025-03-14 2:15 PM',
        status: 'read',
      },
      {
        id: 'msg-11',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'Thanks for catching this. I\'ll contact the parents about restitution. Can you estimate the repair cost?',
        timestamp: '2025-03-14 2:45 PM',
        status: 'read',
      },
      {
        id: 'msg-12',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Maintenance said approximately $75 for the seat cushion replacement. James was apologetic.',
        timestamp: '2025-03-14 3:00 PM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0038',
    incidentDate: '2025-03-14',
    student: 'Tyler Washington',
    studentId: 'STU-5123',
    incidentType: 'Weapon / Prohibited Items',
    driver: 'Jennifer Martinez',
    bus: 'Bus 22',
    route: 'Lincoln High AM - Red',
    severity: 'High',
    status: 'in-progress',
    lastMessageTime: '11:30 AM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-13',
        sender: 'Jennifer Martinez',
        senderRole: 'driver',
        content: 'CRITICAL: I discovered Tyler had a pocket knife during routine observation. I immediately secured it and moved him to the front seat. Police have been notified per protocol.',
        timestamp: '2025-03-14 8:15 AM',
        status: 'read',
      },
      {
        id: 'msg-14',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Thank you for following protocol, Jennifer. This is being handled at the highest level. Did Tyler indicate why he brought the weapon?',
        timestamp: '2025-03-14 9:00 AM',
        status: 'read',
      },
      {
        id: 'msg-15',
        sender: 'Jennifer Martinez',
        senderRole: 'driver',
        content: 'He said it was from his camping trip and he forgot it was in his backpack. He was cooperative when I asked for it. No threatening behavior.',
        timestamp: '2025-03-14 9:30 AM',
        status: 'read',
      },
      {
        id: 'msg-16',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Understood. We\'re coordinating with school admin and parents. You handled this perfectly. Will update you on the outcome.',
        timestamp: '2025-03-14 11:30 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0037',
    incidentDate: '2025-03-13',
    student: 'Olivia Chen',
    studentId: 'STU-6891',
    incidentType: 'Physical Altercation',
    driver: 'Robert Williams',
    bus: 'Bus 5',
    route: 'Roosevelt Elementary PM - Green',
    severity: 'High',
    status: 'in-progress',
    lastMessageTime: '4:50 PM',
    unreadMessages: 1,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-17',
        sender: 'Robert Williams',
        senderRole: 'driver',
        content: 'Physical altercation between Olivia Chen and another student (Mason Turner). Olivia pushed Mason after verbal argument. I stopped the bus and separated them immediately.',
        timestamp: '2025-03-13 3:20 PM',
        status: 'read',
      },
      {
        id: 'msg-18',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'Are both students okay? Any injuries? What led to the argument?',
        timestamp: '2025-03-13 3:45 PM',
        status: 'read',
      },
      {
        id: 'msg-19',
        sender: 'Robert Williams',
        senderRole: 'driver',
        content: 'No visible injuries, but both were upset. From what I heard, it started over a disagreement about a school project. Mason said something that triggered Olivia.',
        timestamp: '2025-03-13 4:10 PM',
        status: 'read',
      },
      {
        id: 'msg-20',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'Thanks Robert. I\'ll need statements from both students. Can you provide a written incident report by end of day?',
        timestamp: '2025-03-13 4:30 PM',
        status: 'read',
      },
      {
        id: 'msg-21',
        sender: 'Robert Williams',
        senderRole: 'driver',
        content: 'Incident report submitted. Also talked to a few other students who witnessed it. They confirmed Olivia started the physical contact but Mason was verbally provoking her.',
        timestamp: '2025-03-13 4:50 PM',
        status: 'delivered',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0035',
    incidentDate: '2025-03-12',
    student: 'James Patterson',
    studentId: 'STU-3567',
    incidentType: 'Disruptive Behavior',
    driver: 'Susan Kim',
    bus: 'Bus 12',
    route: 'Adams Middle PM - Orange',
    severity: 'Medium',
    status: 'in-progress',
    lastMessageTime: 'Yesterday 2:30 PM',
    unreadMessages: 1,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-22',
        sender: 'Susan Kim',
        senderRole: 'driver',
        content: 'James Patterson used profanity and disrespectful language when I asked him to lower his voice. He said "You can\'t tell me what to do" and continued being disruptive.',
        timestamp: '2025-03-12 3:15 PM',
        status: 'read',
      },
      {
        id: 'msg-23',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'I\'m sorry you had to deal with that, Susan. Did this behavior continue after your warning?',
        timestamp: '2025-03-12 3:45 PM',
        status: 'read',
      },
      {
        id: 'msg-24',
        sender: 'Susan Kim',
        senderRole: 'driver',
        content: 'Yes, he quieted down a bit but was still muttering under his breath. Other students looked uncomfortable. This isn\'t the first time he\'s been disrespectful, but today was worse.',
        timestamp: '2025-03-12 4:00 PM',
        status: 'delivered',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0036',
    incidentDate: '2025-03-13',
    student: 'Aiden Brooks',
    studentId: 'STU-4219',
    incidentType: 'Safety Violation',
    driver: 'Carlos Rodriguez',
    bus: 'Bus 18',
    route: 'Kennedy Elementary AM - Purple',
    severity: 'Low',
    status: 'resolved',
    lastMessageTime: 'Yesterday 9:45 AM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-25',
        sender: 'Carlos Rodriguez',
        senderRole: 'driver',
        content: 'Aiden was eating chips and spilled them all over the floor. When I asked him to clean it up, he refused and said he\'d do it later.',
        timestamp: '2025-03-13 8:20 AM',
        status: 'read',
      },
      {
        id: 'msg-26',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Did he eventually clean it up? We need to remind parents about the no food policy.',
        timestamp: '2025-03-13 9:00 AM',
        status: 'read',
      },
      {
        id: 'msg-27',
        sender: 'Carlos Rodriguez',
        senderRole: 'driver',
        content: 'I made him clean it before getting off. He did, but with an attitude. I reminded him of the rules. Will send a note to parents.',
        timestamp: '2025-03-13 9:45 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0034',
    incidentDate: '2025-03-11',
    student: 'Sophia Martinez',
    studentId: 'STU-7824',
    incidentType: 'Electronic Device Misuse',
    driver: 'David Park',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    severity: 'Low',
    status: 'resolved',
    lastMessageTime: 'Mar 11, 4:15 PM',
    unreadMessages: 0,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-28',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Sophia was playing music loudly on her phone without headphones. Multiple students complained. I asked her three times to turn it off or use headphones.',
        timestamp: '2025-03-11 3:30 PM',
        status: 'read',
      },
      {
        id: 'msg-29',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'Did she comply eventually?',
        timestamp: '2025-03-11 3:50 PM',
        status: 'read',
      },
      {
        id: 'msg-30',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Yes, after the third request she finally turned it off. She was not happy about it but complied. Issue resolved.',
        timestamp: '2025-03-11 4:15 PM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0033',
    incidentDate: '2025-03-11',
    student: 'Ethan Murphy',
    studentId: 'STU-8901',
    incidentType: 'Physical Altercation',
    driver: 'Lisa Anderson',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    severity: 'Medium',
    status: 'resolved',
    lastMessageTime: 'Mar 11, 2:20 PM',
    unreadMessages: 0,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-31',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'Ethan was throwing paper balls at other students. One hit a student in the eye causing minor irritation. I moved Ethan to the front seat immediately.',
        timestamp: '2025-03-11 1:45 PM',
        status: 'read',
      },
      {
        id: 'msg-32',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'Is the other student okay? Do we need to contact their parents about the eye incident?',
        timestamp: '2025-03-11 2:00 PM',
        status: 'read',
      },
      {
        id: 'msg-33',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'The student is fine, just minor redness. They didn\'t want to make a big deal. I documented it and Ethan apologized. Parents have been notified.',
        timestamp: '2025-03-11 2:20 PM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0032',
    incidentDate: '2025-03-10',
    student: 'Mia Thompson',
    studentId: 'STU-5634',
    incidentType: 'Inappropriate Language',
    driver: 'John Chen',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    severity: 'Low',
    status: 'resolved',
    lastMessageTime: 'Mar 10, 3:45 PM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-34',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Mia used inappropriate language (curse words) in conversation with friends. Loud enough that younger students could hear.',
        timestamp: '2025-03-10 3:10 PM',
        status: 'read',
      },
      {
        id: 'msg-35',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Did you give her a warning about the language?',
        timestamp: '2025-03-10 3:30 PM',
        status: 'read',
      },
      {
        id: 'msg-36',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Yes, I reminded her this is a school environment and that language is not acceptable. She apologized and watched her language for the rest of the route.',
        timestamp: '2025-03-10 3:45 PM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0031',
    incidentDate: '2025-03-09',
    student: 'Noah Williams',
    studentId: 'STU-2347',
    incidentType: 'Unauthorized Stop Request',
    driver: 'Jennifer Martinez',
    bus: 'Bus 22',
    route: 'Lincoln High AM - Red',
    severity: 'Low',
    status: 'resolved',
    lastMessageTime: 'Mar 9, 11:20 AM',
    unreadMessages: 0,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-37',
        sender: 'Jennifer Martinez',
        senderRole: 'driver',
        content: 'Noah repeatedly pulled the stop cord to request stops that weren\'t his. This delayed the route by approximately 5 minutes.',
        timestamp: '2025-03-09 10:45 AM',
        status: 'read',
      },
      {
        id: 'msg-38',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'How many times did this happen? Did you explain the consequences to him?',
        timestamp: '2025-03-09 11:00 AM',
        status: 'read',
      },
      {
        id: 'msg-39',
        sender: 'Jennifer Martinez',
        senderRole: 'driver',
        content: 'Four times total. After the second time, I explained this is misuse of safety equipment and could result in suspension from the bus. He stopped after that conversation.',
        timestamp: '2025-03-09 11:20 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0030',
    incidentDate: '2025-02-24',
    student: 'Charlotte Anderson',
    studentId: 'STU-4561',
    incidentType: 'Property Damage',
    driver: 'David Park',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    severity: 'Medium',
    status: 'resolved',
    lastMessageTime: 'Feb 24, 2:15 PM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-40',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Found permanent marker writing on seat backs. Charlotte was sitting in that area and has marker stains on her hands.',
        timestamp: '2025-02-24 1:30 PM',
        status: 'read',
      },
      {
        id: 'msg-41',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Did you take photos of the damage? We\'ll need to document this for restitution.',
        timestamp: '2025-02-24 1:45 PM',
        status: 'read',
      },
      {
        id: 'msg-42',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Yes, photos taken and uploaded. Parent has been contacted and agreed to cleaning costs. Restitution completed.',
        timestamp: '2025-02-24 2:15 PM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0029',
    incidentDate: '2025-02-21',
    student: 'Aiden Thomas',
    studentId: 'STU-5672',
    incidentType: 'Physical Altercation',
    driver: 'Lisa Anderson',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    severity: 'High',
    status: 'resolved',
    lastMessageTime: 'Feb 21, 4:30 PM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-43',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'Aiden was pushing and shoving another student in the aisle during boarding. I had to stop the bus and separate them.',
        timestamp: '2025-02-21 3:45 PM',
        status: 'read',
      },
      {
        id: 'msg-44',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Were there any injuries? Did you get the other student\'s information?',
        timestamp: '2025-02-21 4:00 PM',
        status: 'read',
      },
      {
        id: 'msg-45',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'No injuries. Other student was Jacob Martinez, STU-5680. Both students were kept after and counseled. Parents notified. Both students suspended from bus for 3 days.',
        timestamp: '2025-02-21 4:30 PM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0028',
    incidentDate: '2025-02-19',
    student: 'Mia Jackson',
    studentId: 'STU-6783',
    incidentType: 'Disruptive Behavior',
    driver: 'Robert Martinez',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    severity: 'Low',
    status: 'resolved',
    lastMessageTime: 'Feb 19, 9:00 AM',
    unreadMessages: 0,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-46',
        sender: 'Robert Martinez',
        senderRole: 'driver',
        content: 'Mia was playing loud music from her phone speaker. Asked her three times to turn it off before she complied.',
        timestamp: '2025-02-19 8:30 AM',
        status: 'read',
      },
      {
        id: 'msg-47',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'Thanks Robert. Parent contacted and phone privileges on bus revoked for one week.',
        timestamp: '2025-02-19 9:00 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2025-0027',
    incidentDate: '2025-02-15',
    student: 'Lucas Harris',
    studentId: 'STU-7894',
    incidentType: 'Safety Violation',
    driver: 'John Chen',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    severity: 'High',
    status: 'resolved',
    lastMessageTime: 'Feb 15, 10:30 AM',
    unreadMessages: 0,
    assignedTo: 'Mike Johnson',
    messages: [
      {
        id: 'msg-48',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Lucas was tampering with emergency exit door mechanism. Caught him trying to flip the release handle. This is extremely dangerous.',
        timestamp: '2025-02-15 9:15 AM',
        status: 'read',
      },
      {
        id: 'msg-49',
        sender: 'Mike Johnson',
        senderRole: 'coordinator',
        content: 'This is a serious safety violation. Moving to immediate suspension pending parent meeting. Can you provide written statement?',
        timestamp: '2025-02-15 9:45 AM',
        status: 'read',
      },
      {
        id: 'msg-50',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Written statement submitted. Parent meeting held, student suspended for 5 days. Student must attend safety training before returning.',
        timestamp: '2025-02-15 10:30 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0026',
    incidentDate: '2025-02-12',
    student: 'Harper Clark',
    studentId: 'STU-8905',
    incidentType: 'Safety Violation',
    driver: 'David Park',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    severity: 'Medium',
    status: 'resolved',
    lastMessageTime: 'Feb 12, 8:45 AM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-51',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Harper spilled soda all over the floor creating a slipping hazard. Bus had to be taken out of service for cleaning.',
        timestamp: '2025-02-12 8:15 AM',
        status: 'read',
      },
      {
        id: 'msg-52',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'How long was the bus out of service? Did this affect other routes?',
        timestamp: '2025-02-12 8:30 AM',
        status: 'read',
      },
      {
        id: 'msg-53',
        sender: 'David Park',
        senderRole: 'driver',
        content: '45 minutes for deep cleaning. Had to use backup bus for afternoon route. Parent has paid cleaning fee.',
        timestamp: '2025-02-12 8:45 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0025',
    incidentDate: '2025-02-10',
    student: 'Benjamin Lewis',
    studentId: 'STU-9016',
    incidentType: 'Safety Violation',
    driver: 'Lisa Anderson',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    severity: 'Medium',
    status: 'resolved',
    lastMessageTime: 'Feb 10, 3:45 PM',
    unreadMessages: 0,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-54',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'Benjamin was standing in the aisle during transport despite multiple warnings. Safety hazard during turns.',
        timestamp: '2025-02-10 3:15 PM',
        status: 'read',
      },
      {
        id: 'msg-55',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'This is a repeated violation for this student. Escalating to written warning and parent conference.',
        timestamp: '2025-02-10 3:45 PM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0024',
    incidentDate: '2025-02-07',
    student: 'Amelia Robinson',
    studentId: 'STU-1127',
    incidentType: 'Safety Violation',
    driver: 'Robert Martinez',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    severity: 'High',
    status: 'resolved',
    lastMessageTime: 'Feb 7, 9:15 AM',
    unreadMessages: 0,
    assignedTo: 'Mike Johnson',
    messages: [
      {
        id: 'msg-56',
        sender: 'Robert Martinez',
        senderRole: 'driver',
        content: 'Amelia was hanging objects out the window while bus was moving at highway speed. Extremely dangerous.',
        timestamp: '2025-02-07 8:30 AM',
        status: 'read',
      },
      {
        id: 'msg-57',
        sender: 'Mike Johnson',
        senderRole: 'coordinator',
        content: 'This is unacceptable. Immediate suspension and mandatory parent meeting before return.',
        timestamp: '2025-02-07 8:50 AM',
        status: 'read',
      },
      {
        id: 'msg-58',
        sender: 'Robert Martinez',
        senderRole: 'driver',
        content: 'Parent meeting completed. Student suspended for 3 days and must complete safety training. Student understands severity.',
        timestamp: '2025-02-07 9:15 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0023',
    incidentDate: '2025-02-05',
    student: 'Henry Walker',
    studentId: 'STU-2238',
    incidentType: 'Disruptive Behavior',
    driver: 'John Chen',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    severity: 'High',
    status: 'resolved',
    lastMessageTime: 'Feb 5, 10:00 AM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-59',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Henry was directing profanity directly at me when I asked him to sit down. This is disrespectful and creates hostile environment.',
        timestamp: '2025-02-05 9:15 AM',
        status: 'read',
      },
      {
        id: 'msg-60',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Absolutely unacceptable behavior toward staff. Immediate suspension and parent conference required.',
        timestamp: '2025-02-05 9:45 AM',
        status: 'read',
      },
      {
        id: 'msg-61',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Parent conference held. Student issued formal apology and suspended for 5 days. Student seems to understand the gravity of the situation.',
        timestamp: '2025-02-05 10:00 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0022',
    incidentDate: '2025-02-03',
    student: 'Evelyn Hall',
    studentId: 'STU-3349',
    incidentType: 'Disruptive Behavior',
    driver: 'David Park',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    severity: 'Medium',
    status: 'resolved',
    lastMessageTime: 'Feb 3, 11:30 AM',
    unreadMessages: 0,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-62',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Evelyn was name-calling and mocking another student. Victim was visibly upset. This continued even after warning.',
        timestamp: '2025-02-03 10:45 AM',
        status: 'read',
      },
      {
        id: 'msg-63',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'We take bullying very seriously. Moving this to principal for review. Please document victim information.',
        timestamp: '2025-02-03 11:15 AM',
        status: 'read',
      },
      {
        id: 'msg-64',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Victim info provided to principal. Both families contacted. Counseling arranged and seating reassigned. Situation resolved.',
        timestamp: '2025-02-03 11:30 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0021',
    incidentDate: '2025-01-31',
    student: 'Alexander Young',
    studentId: 'STU-4450',
    incidentType: 'Property Damage',
    driver: 'Lisa Anderson',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    severity: 'Medium',
    status: 'resolved',
    lastMessageTime: 'Jan 31, 4:00 PM',
    unreadMessages: 0,
    assignedTo: 'Mike Johnson',
    messages: [
      {
        id: 'msg-65',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'Alexander was using a metal object to scratch the window. Permanent damage to window requiring replacement.',
        timestamp: '2025-01-31 3:15 PM',
        status: 'read',
      },
      {
        id: 'msg-66',
        sender: 'Mike Johnson',
        senderRole: 'coordinator',
        content: 'Window replacement cost is $450. Parent will be invoiced. Student suspended until payment arranged.',
        timestamp: '2025-01-31 3:45 PM',
        status: 'read',
      },
      {
        id: 'msg-67',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'Payment plan established with parent. Student returned after 2-day suspension. No further incidents.',
        timestamp: '2025-01-31 4:00 PM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0020',
    incidentDate: '2025-01-28',
    student: 'Abigail King',
    studentId: 'STU-5561',
    incidentType: 'Disruptive Behavior',
    driver: 'Robert Martinez',
    bus: 'Bus 9',
    route: 'Lincoln Elementary AM - Green',
    severity: 'Medium',
    status: 'resolved',
    lastMessageTime: 'Jan 28, 9:00 AM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-68',
        sender: 'Robert Martinez',
        senderRole: 'driver',
        content: 'Abigail was yelling and screaming continuously. Refused to quiet down after multiple requests. Disrupting other students.',
        timestamp: '2025-01-28 8:20 AM',
        status: 'read',
      },
      {
        id: 'msg-69',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Has this been an ongoing issue? Contacting parent for behavioral intervention.',
        timestamp: '2025-01-28 8:45 AM',
        status: 'read',
      },
      {
        id: 'msg-70',
        sender: 'Robert Martinez',
        senderRole: 'driver',
        content: 'Parent very cooperative. Behavior plan established. Student behavior has improved significantly since parent conversation.',
        timestamp: '2025-01-28 9:00 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0019',
    incidentDate: '2025-01-24',
    student: 'Daniel Wright',
    studentId: 'STU-6672',
    incidentType: 'Physical Altercation',
    driver: 'John Chen',
    bus: 'Bus 12',
    route: 'Meyers Middle AM - Yellow',
    severity: 'High',
    status: 'resolved',
    lastMessageTime: 'Jan 24, 10:15 AM',
    unreadMessages: 0,
    assignedTo: 'Sarah Williams',
    messages: [
      {
        id: 'msg-71',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Daniel kicked another student during an argument. Had to stop bus immediately. Victim has bruising.',
        timestamp: '2025-01-24 9:00 AM',
        status: 'read',
      },
      {
        id: 'msg-72',
        sender: 'Sarah Williams',
        senderRole: 'coordinator',
        content: 'Physical violence is zero tolerance. Immediate suspension pending investigation. Contact victim\'s parents.',
        timestamp: '2025-01-24 9:30 AM',
        status: 'read',
      },
      {
        id: 'msg-73',
        sender: 'John Chen',
        senderRole: 'driver',
        content: 'Both families met with principal. Daniel suspended for 10 days. Victim\'s family satisfied with resolution. Both students counseled.',
        timestamp: '2025-01-24 10:15 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0018',
    incidentDate: '2025-01-21',
    student: 'Emily Scott',
    studentId: 'STU-7783',
    incidentType: 'Safety Violation',
    driver: 'David Park',
    bus: 'Bus 15',
    route: 'Jefferson Middle AM - Blue',
    severity: 'Low',
    status: 'resolved',
    lastMessageTime: 'Jan 21, 8:30 AM',
    unreadMessages: 0,
    assignedTo: 'Mike Johnson',
    messages: [
      {
        id: 'msg-74',
        sender: 'David Park',
        senderRole: 'driver',
        content: 'Emily was eating messy food and left wrappers all over the floor. Asked her to clean up but she refused.',
        timestamp: '2025-01-21 8:00 AM',
        status: 'read',
      },
      {
        id: 'msg-75',
        sender: 'Mike Johnson',
        senderRole: 'coordinator',
        content: 'Student will be required to help with bus cleaning as consequence. Parent contacted.',
        timestamp: '2025-01-21 8:30 AM',
        status: 'read',
      },
    ],
  },
  {
    incidentId: 'INC-2024-0017',
    incidentDate: '2025-01-17',
    student: 'Matthew Green',
    studentId: 'STU-8894',
    incidentType: 'Safety Violation',
    driver: 'Lisa Anderson',
    bus: 'Bus 8',
    route: 'Washington High PM - Wolf Rd',
    severity: 'Low',
    status: 'resolved',
    lastMessageTime: 'Jan 17, 3:30 PM',
    unreadMessages: 0,
    assignedTo: 'Jane Doe',
    messages: [
      {
        id: 'msg-76',
        sender: 'Lisa Anderson',
        senderRole: 'driver',
        content: 'Matthew changed seats multiple times causing disruption. Other students had to keep moving.',
        timestamp: '2025-01-17 3:00 PM',
        status: 'read',
      },
      {
        id: 'msg-77',
        sender: 'Jane Doe',
        senderRole: 'coordinator',
        content: 'Assigning Matthew to specific seat. Will monitor for next week. Thanks for the report.',
        timestamp: '2025-01-17 3:30 PM',
        status: 'read',
      },
    ],
  },
];

// Export function to get communications for a specific incident
export function getCommunicationsByIncidentId(incidentId: string): Message[] | null {
  const comm = mockCommunications.find(c => c.incidentId === incidentId);
  return comm ? comm.messages : null;
}

// Export Message type for use in other components
export type { Message };

// Everything about a thread that depends on the incident behind it. Looked up
// by id, so a thread never carries a stale copy of the incident's own fields.
function threadContext(incidentId: string) {
  const inc = (mockIncidents as any[]).find(i => i.id === incidentId);
  const subject = inc?.subject ?? 'student';
  return {
    incident: inc,
    subjectLabel: getSubjectLabel(subject),
    // "Involved" rather than "Student", the same wording the incidents grid
    // uses, because a row may be a location or a vehicle.
    involved: inc ? getIncidentSubjectLabel(inc) : 'Unknown',
    counterparty: counterpartyFor(inc),
  };
}

interface CommunicationsPageProps {
  initialIncidentId?: string | null;
  initialIncidentData?: any | null;
}

// Map bus numbers to known drivers for new conversations
const busDriverMap: Record<string, string> = {
  'Bus 12': 'John Chen',
  'Bus 15': 'David Park',
  'Bus 14': 'Robert Thompson',
  'Bus 8': 'Lisa Anderson',
  'Bus 9': 'Jennifer Martinez',
  'Bus 5': 'Robert Williams',
  'Bus 22': 'Daniel Kim',
};

export function CommunicationsPage({ initialIncidentId, initialIncidentData }: CommunicationsPageProps) {
  // Build the list of communications, potentially including a new one
  const [communications, setCommunications] = useState<IncidentCommunication[]>(() => {
    if (initialIncidentId && initialIncidentData) {
      const existingComm = mockCommunications.find(comm => comm.incidentId === initialIncidentId);
      if (!existingComm) {
        // Create a new conversation for this incident
        const driverName = busDriverMap[initialIncidentData.bus] || 'Assigned Driver';
        const severityMap: Record<string, 'Low' | 'Medium' | 'High'> = {
          critical: 'High',
          high: 'High',
          medium: 'Medium',
          low: 'Low',
        };
        const newComm: IncidentCommunication = {
          incidentId: initialIncidentId,
          incidentDate: new Date().toISOString().split('T')[0],
          student: initialIncidentData.student || 'Unknown Student',
          studentId: initialIncidentData.studentId || '',
          incidentType: initialIncidentData.type || 'Unknown',
          driver: driverName,
          bus: initialIncidentData.bus || '',
          route: initialIncidentData.route || `${initialIncidentData.bus} Route`,
          severity: severityMap[initialIncidentData.priority] || 'Medium',
          status: 'in-progress',
          lastMessageTime: 'Just now',
          unreadMessages: 0,
          assignedTo: initialIncidentData.assignedTo || 'Sarah Williams',
          messages: [],
        };
        return [newComm, ...mockCommunications];
      }
    }
    return mockCommunications;
  });

  // Find the initial incident if an ID was provided
  const initialIncident = initialIncidentId 
    ? communications.find(comm => comm.incidentId === initialIncidentId) || communications[0]
    : communications[0];
    
  const [selectedIncident, setSelectedIncident] = useState<IncidentCommunication | null>(
    initialIncident
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track previous message count to only auto-scroll on new messages, not initial load
  const prevMessageCount = useRef<number | null>(null);

  useEffect(() => {
    const currentCount = selectedIncident?.messages.length ?? 0;
    // Only scroll if a new message was added (not on initial render/page load)
    if (prevMessageCount.current !== null && currentCount > prevMessageCount.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = currentCount;
  }, [selectedIncident?.messages.length]);

  const filteredCommunications = communications.filter((comm) => {
    const matchesSearch =
      searchQuery === '' ||
      comm.incidentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      threadContext(comm.incidentId).involved.toLowerCase().includes(searchQuery.toLowerCase()) ||
      threadContext(comm.incidentId).counterparty.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 ||
      statusFilter.some(s =>
        s === 'unread' ? comm.unreadMessages > 0 : comm.status === s
      );

    // Filters on the subject label, matching what the row and header display.
    const matchesSubject =
      subjectFilter.length === 0 ||
      subjectFilter.includes(threadContext(comm.incidentId).subjectLabel);

    return matchesSearch && matchesStatus && matchesSubject;
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedIncident) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr = now.toISOString().split('T')[0];

    const newMessage: Message = {
      id: `msg-new-${Date.now()}`,
      sender: 'Sarah Williams',
      senderRole: 'coordinator',
      content: messageText.trim(),
      timestamp: `${dateStr} ${timeStr}`,
      status: 'sent',
    };

    // Update the selected incident's messages
    const updatedIncident = {
      ...selectedIncident,
      messages: [...selectedIncident.messages, newMessage],
      lastMessageTime: timeStr,
      status: selectedIncident.status === 'pending' ? 'in-progress' as const : selectedIncident.status,
    };
    setSelectedIncident(updatedIncident);

    // Also update the communications list so the sidebar reflects the change
    setCommunications(prev =>
      prev.map(comm =>
        comm.incidentId === selectedIncident.incidentId
          ? updatedIncident
          : comm
      )
    );

    setShowSuccess(true);
    setMessageText('');
    setTimeout(() => setShowSuccess(false), 3000);
  };

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
      case 'resolved': return 'success';
      case 'in-progress': return 'info-primary';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <forge-icon name="check_circle" style={{ fontSize: '12px', color: '#2563eb' }}></forge-icon>;
      case 'delivered':
        return <forge-icon name="check_circle" style={{ fontSize: '12px', color: '#9ca3af' }}></forge-icon>;
      case 'sent':
        return <forge-icon name="access_time" style={{ fontSize: '12px', color: '#9ca3af' }}></forge-icon>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 mb-2">Communications</h1>
        <p className="text-muted-foreground">
          Message the person handling an incident, whoever that is for the type
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Incident List */}
        <div className="lg:col-span-1">
          <ForgeCard>
            <div style={{ padding: 'var(--forge-spacing-medium)', paddingBottom: 'var(--forge-spacing-small)' }}>
              <h3 className="forge-typography--heading4 flex items-center gap-2">
                <forge-icon name="chat" style={{ fontSize: '20px' }}></forge-icon>
                Active Communications
              </h3>
              <p className="forge-typography--body2" style={{ color: 'var(--forge-theme-text-medium)' }}>Select an incident to view conversation</p>
            </div>
            <div style={{ padding: 0 }}>
              {/* Search and Filters */}
              <div className="px-4 pb-4 space-y-3">
                <div className="relative">
                  <forge-icon name="search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--forge-theme-text-medium)', pointerEvents: 'none' }}></forge-icon>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input
                      type="text"
                      placeholder="Search incidents, people, vehicles, or locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '2rem' }}
                    />
                  </forge-text-field>
                </div>

                <div className="flex items-center gap-2">
                  <forge-icon name="filter_list" style={{ fontSize: '16px', color: 'var(--forge-theme-text-medium)' }}></forge-icon>
                  <div style={{ flex: 1 }}>
                    <ForgeMultiSelect
                      options={[
                        { value: 'unread', label: 'Unread' },
                        { value: 'in-progress', label: 'In Progress' },
                        { value: 'resolved', label: 'Resolved' },
                      ]}
                      selected={statusFilter}
                      onChange={setStatusFilter}
                      placeholder="Status"
                      allLabel="All Status"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <ForgeMultiSelect
                      options={INCIDENT_SUBJECTS.map(s => ({ value: s.label, label: s.label }))}
                      selected={subjectFilter}
                      onChange={setSubjectFilter}
                      placeholder="Subject"
                      allLabel="All Subjects"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Incident List */}
              <ScrollArea className="h-[calc(100vh-400px)]">
                {filteredCommunications.map((comm) => (
                  <div key={comm.incidentId}>
                    <button
                      onClick={() => setSelectedIncident(comm)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedIncident?.incidentId === comm.incidentId
                          ? 'bg-blue-50 border-l-4 border-l-blue-600'
                          : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-gray-900">{comm.incidentId}</span>
                        <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                          {comm.lastMessageTime}
                        </span>
                      </div>
                      <div className="text-muted-foreground mb-2" style={{ fontSize: '0.875rem' }}>
                        {(() => {
                          const ctx = threadContext(comm.incidentId);
                          // On an Employee incident the person the incident is
                          // about is also the person the coordinator is talking
                          // to, so naming them twice reads as a bug.
                          return ctx.involved === ctx.counterparty.name
                            ? `${ctx.involved} • ${ctx.counterparty.role}`
                            : `${ctx.involved} • ${ctx.counterparty.name}`;
                        })()}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <forge-badge theme={severityTheme(comm.severity)} strong>
                          {comm.severity}
                        </forge-badge>
                        <forge-badge theme={statusTheme(comm.status)}>
                          {comm.status}
                        </forge-badge>
                        {comm.unreadMessages > 0 && (
                          <forge-badge theme="info-primary" strong>
                            {comm.unreadMessages} new
                          </forge-badge>
                        )}
                      </div>
                    </button>
                    <Separator />
                  </div>
                ))}
              </ScrollArea>
            </div>
          </ForgeCard>
        </div>

        {/* Right Panel - Conversation */}
        <div className="lg:col-span-2 flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
          {selectedIncident ? (
            <>
              {/* Conversation Header - pinned at top */}
              <ForgeCard className="flex-shrink-0" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}>
                <div style={{ padding: 'var(--forge-spacing-medium)', paddingBottom: 'var(--forge-spacing-small)', paddingTop: 'var(--forge-spacing-medium)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="forge-typography--heading4">{selectedIncident.incidentId}</h3>
                      <p className="forge-typography--body2 mt-1" style={{ color: 'var(--forge-theme-text-medium)' }}>
                        {selectedIncident.incidentType} • {selectedIncident.incidentDate}
                      </p>
                    </div>
                    <forge-badge theme={statusTheme(selectedIncident.status)}>
                      {selectedIncident.status}
                    </forge-badge>
                  </div>

                  {/* Subject and Involved replace the old Student row, and the
                      vehicle and run only appear when the incident has them. A
                      location incident showed "N/A" twice before. */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t">
                    <div>
                      <Label className="text-muted-foreground">Subject</Label>
                      <p className="mt-0.5">{threadContext(selectedIncident.incidentId).subjectLabel}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Involved</Label>
                      <p className="mt-0.5">{threadContext(selectedIncident.incidentId).involved}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        {threadContext(selectedIncident.incidentId).counterparty.role}
                      </Label>
                      <p className="mt-0.5">{threadContext(selectedIncident.incidentId).counterparty.name}</p>
                    </div>
                    {selectedIncident.bus && selectedIncident.bus !== 'N/A' && (
                      <div>
                        <Label className="text-muted-foreground">Vehicle</Label>
                        <p className="mt-0.5">{selectedIncident.bus}</p>
                      </div>
                    )}
                    {selectedIncident.route && selectedIncident.route !== 'N/A' && (
                      <div>
                        <Label className="text-muted-foreground">Run</Label>
                        <p className="mt-0.5">{selectedIncident.route}</p>
                      </div>
                    )}
                  </div>
                </div>
              </ForgeCard>

              {/* Messages - scrollable middle section */}
              <div className="flex-1 min-h-0 overflow-hidden border-x" style={{ borderColor: 'var(--border)' }}>
                <ScrollArea className="h-full">
                  <div className="space-y-4 p-4">
                    {selectedIncident.messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <forge-icon name="chat" style={{ fontSize: '40px', color: 'var(--forge-theme-text-medium)', marginBottom: '12px' }}></forge-icon>
                        <p style={{ fontFamily: 'var(--forge-font-family)', fontWeight: 'var(--forge-font-weight-medium)', fontSize: 'var(--forge-font-size-base)', marginBottom: 'var(--forge-spacing-xxsmall)' }}>
                          New Conversation
                        </p>
                        <p className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>
                          Send the first message to {threadContext(selectedIncident.incidentId).counterparty.name} about this incident.
                        </p>
                      </div>
                    )}
                    {selectedIncident.messages.map((message) => {
                      const isCoordinator = message.senderRole === 'coordinator';
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isCoordinator ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] ${
                              isCoordinator
                                ? 'text-gray-900'
                                : 'bg-gray-100 text-gray-900'
                            } rounded-lg p-4`}
                            style={isCoordinator ? { backgroundColor: '#a7cdf2' } : undefined}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {isCoordinator ? (
                                <forge-icon name="person" style={{ fontSize: '16px' }}></forge-icon>
                              ) : (
                                <forge-icon name="email" style={{ fontSize: '16px' }}></forge-icon>
                              )}
                              <span className="font-medium">{message.sender}</span>
                              <span
                                className="text-muted-foreground"
                                style={{ fontSize: '0.75rem' }}
                              >
                                {message.timestamp}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {isCoordinator && (
                              <div className="flex items-center justify-end gap-1 mt-2">
                                {getMessageStatusIcon(message.status)}
                                <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                                  {message.status}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Message Input - pinned at bottom */}
              <ForgeCard className="flex-shrink-0" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))' }}>
                <div style={{ padding: 'var(--forge-spacing-small)' }}>
                  {showSuccess && (
                    <Alert className="mb-3 bg-green-50 border-green-200">
                      <forge-icon name="check_circle" style={{ fontSize: '16px', color: '#16a34a' }}></forge-icon>
                      <AlertDescription className="text-green-800">
                        Message sent successfully to {threadContext(selectedIncident.incidentId).counterparty.name}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="message">Send Message to {threadContext(selectedIncident.incidentId).counterparty.name}</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        style={{
                          flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          padding: '0 16px', height: '36px',
                          background: '#4A6FA5', color: '#ffffff',
                          border: 'none', borderRadius: '4px',
                          fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                          cursor: !messageText.trim() ? 'not-allowed' : 'pointer',
                          opacity: !messageText.trim() ? 0.5 : 1,
                          letterSpacing: '0.0125em',
                        }}
                      >
                        <forge-icon slot="start" name="send"></forge-icon>
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>
              </ForgeCard>
            </>
          ) : (
            <ForgeCard className="h-full flex items-center justify-center">
              <div className="text-center" style={{ padding: 'var(--forge-spacing-xlarge) var(--forge-spacing-medium)' }}>
                <forge-icon name="chat" style={{ fontSize: '48px', color: 'var(--forge-theme-text-medium)', margin: '0 auto 16px', display: 'block' }}></forge-icon>
                <h3 className="forge-typography--heading4 mb-2">No Conversation Selected</h3>
                <p className="forge-typography--body2" style={{ color: 'var(--forge-theme-text-medium)' }}>
                  Select an incident from the list to view and manage driver communications
                </p>
              </div>
            </ForgeCard>
          )}
        </div>
      </div>
    </div>
  );
}