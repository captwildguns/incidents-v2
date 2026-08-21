import { useState, useRef, useEffect } from 'react';
import { ForgeCard, ForgeButton, ForgeMenu, ForgeIconButton, useForgeToast } from '@tylertech/forge-react';
import { defineCardComponent, defineDialogComponent, defineBadgeComponent, defineMenuComponent, defineIconButtonComponent } from '@tylertech/forge';
defineCardComponent();
defineDialogComponent();
defineBadgeComponent();
defineMenuComponent();
defineIconButtonComponent();
import { EditIncidentDialog } from '../incidents/EditIncidentDialog';
import { NewIncidentFormUnified } from '../incidents/NewIncidentFormUnified';
import { mockIncidents, getIncidentSubjectLabel, getIncidentSubjectSubLabel } from '../incidents/IncidentsPage';
import { getSubjectLabel, INCIDENT_SUBJECTS } from '../incidents/IncidentTypes';
import { defineButtonComponent } from '@tylertech/forge';
defineButtonComponent();
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { toast } from 'sonner';

// Mock current user - in production, this would come from authentication context
const currentUser = {
  name: 'Sarah Williams',
  role: 'Safety Coordinator',
  email: 'sarah.williams@district.edu'
};

// Every number on this page used to be a hardcoded array or a literal in the
// markup, which is why the vehicle chart read Bus 8 as 9 and Bus 14 as 4 while
// the vehicles grid read 10 and 5: the seed data moved and these did not. All of
// it is derived from mockIncidents now, so the dashboard cannot drift from the
// grids again.

const CHART_FILLS = ['#4A6FA5', '#5B8BB8', '#8B9264', '#6B9BC5', '#7B8458', '#9AA4B8', '#A8B47A'];

// Incidents by type, largest first, capped at the seven the pie can label.
const incidentTypeData = (() => {
  const counts = new Map<string, number>();
  for (const inc of mockIncidents as any[]) {
    counts.set(inc.type, (counts.get(inc.type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value], idx) => ({ name, value, fill: CHART_FILLS[idx % CHART_FILLS.length] }));
})();

// Incidents by subject. The reason this page exists in a district that now
// tracks more than students, and the one chart that answers "how much of this is
// not about a student".
const incidentSubjectData = (() => {
  const counts = new Map<string, number>();
  for (const inc of mockIncidents as any[]) {
    const label = getSubjectLabel(inc.subject ?? 'student');
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return INCIDENT_SUBJECTS
    .map((s, idx) => ({ name: s.label, value: counts.get(s.label) ?? 0, fill: CHART_FILLS[idx % CHART_FILLS.length] }))
    .filter(d => d.value > 0);
})();

// Incidents by vehicle. Counted exactly the way the vehicles grid counts them:
// the bus the incident happened on, plus assetRef on a vehicle-subject incident,
// skipping the 'N/A' placeholder.
const incidentsByVehicleData = (() => {
  const counts = new Map<string, number>();
  for (const inc of mockIncidents as any[]) {
    const names = new Set(
      [inc.bus, inc.subject === 'vehicle' ? inc.assetRef : null]
        .filter((n: any) => typeof n === 'string' && n && n !== 'N/A')
    );
    for (const name of names) {
      counts.set(name as string, (counts.get(name as string) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([vehicle, incidents]) => ({ vehicle, incidents }));
})();

// Incidents by weekday, Monday to Friday. Seed dates are historical, so a real
// calendar week would read zero across the board; this is the whole seed set
// bucketed by the day of the week each incident happened on.
const incidentsByDayData = (() => {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const counts = new Map<string, number>(order.map(d => [d, 0]));
  for (const inc of mockIncidents as any[]) {
    if (!inc.date) continue;
    const [y, m, d] = inc.date.split('-').map(Number);
    const label = order[new Date(Date.UTC(y, m - 1, d)).getUTCDay() - 1];
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return order.map(day => ({ day, incidents: counts.get(day) ?? 0 }));
})();

// KPI numbers, matched to how the incidents grid counts the same things so the
// two pages never disagree.
const kpiCritical = (mockIncidents as any[]).filter(i => i.severity === 'Critical').length;
const kpiOpen = (mockIncidents as any[]).filter(i => i.status === 'Open').length;
const kpiStudentsWithIncidents = new Set(
  (mockIncidents as any[]).flatMap(i => (i.involvedStudents ?? []).map((s: any) => s.studentId).filter(Boolean))
).size;
// The seed set is historical, so "this week" is the seven days up to the most
// recent incident rather than up to today, which would always read zero.
const kpiRecent = (() => {
  const dates = (mockIncidents as any[]).map(i => i.date).filter(Boolean).sort();
  if (!dates.length) return 0;
  const latest = dates[dates.length - 1];
  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - 6);
  const from = cutoff.toISOString().slice(0, 10);
  return (mockIncidents as any[]).filter(i => i.date >= from && i.date <= latest).length;
})();

// Custom SVG Pie Chart component to avoid recharts duplicate key bug
function CustomPieChart({ data }: { data: { name: string; value: number; fill: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 65;
  const cy = 100;
  const radius = 55;
  let cumulativeAngle = -90;

  const slices = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const d = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return (
      <path
        key={`slice-${index}`}
        d={d}
        fill={item.fill}
        stroke="white"
        strokeWidth={2}
      >
        <title>{`${item.name}: ${item.value} (${Math.round((item.value / total) * 100)}%)`}</title>
      </path>
    );
  });

  return (
    <div className="flex items-center" style={{ height: 200 }}>
      <svg width={130} height={200} viewBox="0 0 130 200">
        {slices}
      </svg>
      <div className="flex flex-col gap-1 ml-4" style={{ fontFamily: 'var(--forge-font-family, Roboto, sans-serif)', fontSize: '11px' }}>
        {data.map((item, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="rounded-full flex-shrink-0"
              style={{ width: 8, height: 8, backgroundColor: item.fill }}
            />
            <span style={{ color: 'var(--forge-text-secondary, #666)', lineHeight: '16px' }}>
              {item.name} ({Math.round((item.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom SVG Horizontal Bar Chart (for Incidents by Vehicle)
function CustomHorizontalBarChart({ data }: { data: { vehicle: string; incidents: number }[] }) {
  const maxValue = Math.max(...data.map(d => d.incidents));
  const barHeight = 22;
  const gap = 6;
  const labelWidth = 80;
  const chartWidth = 240;
  const svgHeight = data.length * (barHeight + gap) + 20;

  return (
    <div style={{ height: 200, overflow: 'hidden' }}>
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${labelWidth + chartWidth + 30} ${svgHeight}`} preserveAspectRatio="xMinYMin meet">
        {data.map((item, index) => {
          const y = index * (barHeight + gap) + 8;
          const barWidth = maxValue > 0 ? (item.incidents / maxValue) * chartWidth : 0;
          return (
            <g key={`bar-${index}`}>
              <text
                x={labelWidth - 4}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                style={{ fontSize: '11px', fill: 'var(--forge-text-secondary, #666)', fontFamily: 'var(--forge-font-family, Roboto, sans-serif)' }}
              >
                {item.vehicle}
              </text>
              <rect
                x={labelWidth}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill="#4A6FA5"
              >
                <title>{`${item.vehicle}: ${item.incidents} incidents`}</title>
              </rect>
              <text
                x={labelWidth + barWidth + 6}
                y={y + barHeight / 2 + 4}
                style={{ fontSize: '11px', fill: 'var(--forge-text-secondary, #666)', fontFamily: 'var(--forge-font-family, Roboto, sans-serif)' }}
              >
                {item.incidents}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Custom SVG Vertical Bar Chart (for Incidents by Day)
function CustomVerticalBarChart({ data }: { data: { day: string; incidents: number }[] }) {
  const maxValue = Math.max(...data.map(d => d.incidents));
  const chartHeight = 140;
  const barWidth = 36;
  const gap = 16;
  const totalWidth = data.length * (barWidth + gap);
  const leftPad = 8;
  const bottomPad = 24;
  const topPad = 20;

  return (
    <div style={{ height: 200, overflow: 'hidden' }}>
      <svg width="100%" height={chartHeight + bottomPad + topPad} viewBox={`0 0 ${leftPad + totalWidth + 10} ${chartHeight + bottomPad + topPad}`} preserveAspectRatio="xMinYMin meet">
        {/* Bars */}
        {data.map((item, index) => {
          const barH = maxValue > 0 ? (item.incidents / maxValue) * chartHeight : 0;
          const x = leftPad + index * (barWidth + gap) + gap / 2;
          const y = chartHeight - barH + topPad;
          return (
            <g key={`vbar-${index}`}>
              {/* Value label above bar */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                style={{ fontSize: '12px', fontWeight: 600, fill: 'var(--forge-theme-text-high, #111)', fontFamily: 'var(--forge-font-family, Roboto, sans-serif)' }}
              >
                {item.incidents}
              </text>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill="#4A6FA5"
              >
                <title>{`${item.day}: ${item.incidents} incidents`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={chartHeight + topPad + 16}
                textAnchor="middle"
                style={{ fontSize: '11px', fill: 'var(--forge-text-secondary, #666)', fontFamily: 'var(--forge-font-family, Roboto, sans-serif)' }}
              >
                {item.day}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const activeIncidents = (mockIncidents as any[])
  .filter(i => i.status !== 'Closed')
  .slice()
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  .slice(0, 5)
  // displayDate, not time. `time` now holds the incident's occurrence time, and
  // overwriting it here leaked a date string into the detail page via the
  // row-click handler below, which renders "Occurred: <date> at <date>".
  .map(i => ({ ...i, displayDate: (i.date || '').replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2-$3-$1') }));

const needsAttention = [
  {
    id: 'INC-2025-0044',
    student: 'Christopher Adams',
    type: 'Physical Altercation',
    bus: 'Bus 15',
    reason: 'Student caused minor injury to another student',
    priority: 'high',
    time: '5 mins ago',
    timeValue: 5,
    actionNeeded: 'Contact parents immediately and review with administration',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0052',
    student: 'Tyler Stewart',
    type: 'Physical Altercation',
    bus: 'Bus 12',
    reason: 'Physical aggression requires immediate response',
    priority: 'high',
    time: '8 hours ago',
    timeValue: 8 * 60,
    actionNeeded: 'Contact parents and schedule student meeting',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0051',
    student: 'Natalie Collins',
    type: 'Disruptive Behavior',
    bus: 'Bus 8',
    reason: 'Profanity directed at driver',
    priority: 'high',
    time: '9 hours ago',
    timeValue: 9 * 60,
    actionNeeded: 'Contact parents about disrespectful behavior toward staff',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0061',
    student: 'Kayla Bailey',
    type: 'Disruptive Behavior',
    bus: 'Bus 8',
    reason: 'Bullying behavior requires intervention',
    priority: 'high',
    time: '2 days ago',
    timeValue: 48 * 60,
    actionNeeded: 'Parent meeting and anti-bullying intervention plan',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0045',
    student: 'Grace Phillips',
    type: 'Disruptive Behavior',
    bus: 'Bus 9',
    reason: 'Ongoing bullying of younger student',
    priority: 'high',
    time: '1 day ago',
    timeValue: 24 * 60,
    actionNeeded: 'Contact parents and implement supervision plan',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0043',
    student: 'Victoria Martinez',
    type: 'Disruptive Behavior',
    bus: 'Bus 14',
    reason: 'Open incident requires assignment of action items',
    priority: 'medium',
    time: '12 mins ago',
    timeValue: 12,
    actionNeeded: 'Contact parents about bus behavior expectations',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0048',
    student: 'Joshua Parker',
    type: 'Safety Violation',
    bus: 'Bus 14',
    reason: 'Sat in restricted driver area',
    priority: 'medium',
    time: '4 days ago',
    timeValue: 4 * 24 * 60,
    actionNeeded: 'Review bus safety rules with student and parents',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0057',
    student: 'Alexis Morgan',
    type: 'Safety Violation',
    bus: 'Bus 12',
    reason: 'Open incident - left mess requiring cleanup',
    priority: 'medium',
    time: '13 days ago',
    timeValue: 13 * 24 * 60,
    actionNeeded: 'Contact parents about cleanliness expectations',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0055',
    student: 'Samantha Reed',
    type: 'Property Damage',
    bus: 'Bus 15',
    reason: 'Open incident - property damage requires parent meeting',
    priority: 'medium',
    time: '11 days ago',
    timeValue: 11 * 24 * 60,
    actionNeeded: 'Schedule parent meeting for restitution discussion',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0053',
    student: 'Hannah Morris',
    type: 'Disruptive Behavior',
    bus: 'Bus 14',
    reason: 'In Progress - awaiting parent meeting follow-up',
    priority: 'medium',
    time: '9 days ago',
    timeValue: 9 * 24 * 60,
    actionNeeded: 'Follow up on parent meeting and monitor behavior',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0059',
    student: 'Brianna Cooper',
    type: 'Physical Altercation',
    bus: 'Bus 9',
    reason: 'In Progress - requires continued monitoring',
    priority: 'high',
    time: '15 days ago',
    timeValue: 15 * 24 * 60,
    actionNeeded: 'Review progress and determine if escalation needed',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0035',
    student: 'James Patterson',
    type: 'Disruptive Behavior',
    bus: 'Bus 12',
    reason: 'Overdue - incident reported 24+ hours ago',
    priority: 'medium',
    time: '26 hours ago',
    timeValue: 26 * 60,
    actionNeeded: 'Schedule parent meeting',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0037',
    student: 'Olivia Chen',
    type: 'Physical Altercation',
    bus: 'Bus 5',
    reason: 'Multiple students involved - investigation pending',
    priority: 'high',
    time: '6 hours ago',
    timeValue: 6 * 60,
    actionNeeded: 'Review video footage and interview students',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0038',
    student: 'Tyler Washington',
    type: 'Weapon / Prohibited Items',
    bus: 'Bus 22',
    reason: 'No action taken in 4 hours',
    priority: 'medium',
    time: '4 hours ago',
    timeValue: 4 * 60,
    actionNeeded: 'Escalate to administration immediately',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0040',
    student: 'Emma Rodriguez',
    type: 'Disruptive Behavior',
    bus: 'Bus 15',
    reason: 'Driver awaiting response - 2 unread messages',
    priority: 'high',
    time: '1 hour ago',
    timeValue: 60,
    actionNeeded: 'Respond to driver communication',
    assignedTo: 'Sarah Williams',
  },
  {
    id: 'INC-2025-0041',
    student: 'Marcus Johnson',
    type: 'Safety Violation',
    bus: 'Bus 8',
    reason: 'Requires immediate parent contact',
    priority: 'high',
    time: '32 mins ago',
    timeValue: 32,
    actionNeeded: 'Contact parents and administration',
    assignedTo: 'Jane Doe',
  },
  {
    id: 'INC-2025-0042',
    student: 'Sarah Mitchell',
    type: 'Safety Violation',
    bus: 'Bus 12',
    reason: 'Driver awaiting response on behavior plan',
    priority: 'medium',
    time: '2 hours ago',
    timeValue: 2 * 60,
    actionNeeded: 'Respond to driver and establish seating plan',
    assignedTo: 'Sarah Williams',
  },
];

// Communications with unanswered driver messages
const unansweredCommunications = [
  {
    incidentId: 'INC-2025-0042',
    student: 'Sarah Mitchell',
    driver: 'John Chen',
    type: 'Safety Violation',
    lastMessage: 'She was trying to talk to friends in the back. When I asked her to sit down, she complied briefly but stood up again after a few minutes.',
    timeSent: '10:45 AM',
    severity: 'Medium',
  },
  {
    incidentId: 'INC-2025-0040',
    student: 'Emma Rodriguez',
    driver: 'David Park',
    type: 'Disruptive Behavior',
    lastMessage: 'Yes, I separated them and had Emma sit closer to the front. She stopped the verbal taunting but gave dirty looks. I think this needs parent involvement.',
    timeSent: 'Yesterday 4:30 PM',
    severity: 'High',
  },
];

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onNavigateToCommunication: (incidentId: string, incidentData?: any) => void;
  onNavigateToMyIncidents: (assignedTo: string) => void;
  onNavigateToIncidentDetail?: (incident: any) => void;
  onNavigateToFilteredIncidents?: (filters: { status?: string; severity?: string; dateAfter?: string }) => void;
  onNavigateToStudentsWithActiveIncidents?: () => void;
}

export function DashboardPage({ onNavigate, onNavigateToCommunication, onNavigateToMyIncidents, onNavigateToIncidentDetail, onNavigateToFilteredIncidents, onNavigateToStudentsWithActiveIncidents }: DashboardPageProps) {
  const [triageDetailsOpen, setTriageDetailsOpen] = useState(false);
  const [selectedTriageItem, setSelectedTriageItem] = useState<any>(null);
  const [editingIncident, setEditingIncident] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassigningIncident, setReassigningIncident] = useState<any>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [inProgressItems, setInProgressItems] = useState<Set<string>>(new Set());

  // Forge dialog refs
  const triageDialogRef = useRef<HTMLElement>(null);
  const editDialogRef = useRef<HTMLElement>(null);
  const reassignDialogRef = useRef<HTMLElement>(null);
  const newIncidentDialogRef = useRef<HTMLElement>(null);
  const toastHelper = useForgeToast();
  const [isNewIncidentDialogOpen, setIsNewIncidentDialogOpen] = useState(false);

  // Sync triageDetailsOpen state with forge-dialog
  useEffect(() => { const el = triageDialogRef.current as any; if (!el) return; el.open = triageDetailsOpen; }, [triageDetailsOpen]);
  useEffect(() => { const el = triageDialogRef.current as any; if (!el) return; const handler = () => setTriageDetailsOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Sync editDialogOpen state with forge-dialog
  useEffect(() => { const el = editDialogRef.current as any; if (!el) return; el.open = editDialogOpen; }, [editDialogOpen]);
  useEffect(() => { const el = editDialogRef.current as any; if (!el) return; const handler = () => setEditDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Sync the New Incident dialog. Filing starts in a modal here exactly as it
  // does on the incidents page, rather than navigating away from the dashboard.
  useEffect(() => { const el = newIncidentDialogRef.current as any; if (!el) return; el.open = isNewIncidentDialogOpen; }, [isNewIncidentDialogOpen]);
  useEffect(() => { const el = newIncidentDialogRef.current as any; if (!el) return; const handler = () => setIsNewIncidentDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Sync reassignDialogOpen state with forge-dialog
  useEffect(() => { const el = reassignDialogRef.current as any; if (!el) return; el.open = reassignDialogOpen; }, [reassignDialogOpen]);
  useEffect(() => { const el = reassignDialogRef.current as any; if (!el) return; const handler = () => setReassignDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // List of available assignees
  const availableAssignees = [
    'Sarah Williams',
    'Jane Doe',
    'John Chen',
    'David Park',
    'Robert Thompson',
  ];

  // Incidents that have communications on the Communications page
  const incidentsWithCommunications = ['INC-2025-0042', 'INC-2025-0041', 'INC-2025-0040'];

  // Filter incidents assigned to the current user
  const myIncidents = needsAttention.filter(item => item.assignedTo === currentUser.name);
  
  // Get the 3 most urgent of my incidents (sorted by priority and time)
  const myTopIncidents = [...myIncidents]
    .sort((a, b) => {
      // Sort by priority first (critical > high > medium)
      const priorityOrder = { critical: 3, high: 2, medium: 1 };
      const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                          (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      // Then by time (oldest first)
      return b.timeValue - a.timeValue;
    })
    .slice(0, 3);

  // Get the 3 oldest items (longest waiting) for general triage
  const oldestNeedingAttention = [...needsAttention]
    .sort((a, b) => b.timeValue - a.timeValue)
    .slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', badge: 'bg-red-600 text-white', borderLeft: 'border-l-red-500' };
      case 'high':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-600 text-white', borderLeft: 'border-l-orange-500' };
      case 'medium':
        return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-600 text-white', borderLeft: 'border-l-amber-500' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', badge: 'bg-gray-600 text-white', borderLeft: 'border-l-gray-500' };
    }
  };

  const getPriorityTheme = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };
  // Mirrors statusTheme on the incidents page, so the same status reads the
  // same colour in both grids.
  const getStatusTheme = (status: string): string => {
    switch (status) {
      case 'Open': return 'info-primary';
      case 'In Progress': return 'warning';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  const getSeverityTheme = (severity: string): string => {
    switch (severity) {
      case 'Critical': return 'danger';
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'info';
      default: return 'default';
    }
  };

  return (
    <div style={{ padding: 'var(--forge-spacing-xlarge)' }}>
      {/* Page Header. New Incident sits here, matching the incidents page, so
          the action is in the same place wherever you start from. */}
      <div className="flex items-start justify-between" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <div>
        <h1 style={{ margin: 0, marginBottom: '8px' }}>Dashboard</h1>
        <p className="text-muted-foreground" style={{ margin: 0 }}>
          Overview of incident tracking and management
        </p>
        </div>
        {/* Same markup as the incidents page button, so the two read as one
            control rather than two similar ones. */}
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

      {/* My Incidents Section */}
      {myIncidents.length > 0 && (
        <div style={{ marginBottom: 'var(--forge-spacing-large)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <forge-icon name="person" style={{ fontSize: '20px', color: '#2563eb' }}></forge-icon>
              </div>
              <div>
                <h2 className="flex items-center gap-2" style={{ margin: 0 }}>
                  My Incidents
                  <forge-badge theme="info-primary" strong>{myIncidents.length}</forge-badge>
                </h2>
                <p className="text-muted-foreground" style={{ fontSize: '0.875rem', margin: 0, marginTop: '4px' }}>
                  Assigned to {currentUser.name}
                </p>
              </div>
            </div>
            <ForgeButton 
              variant="outline" 
              size="sm" 
              onClick={() => onNavigateToMyIncidents(currentUser.name)}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              View All My Incidents
              <forge-icon name="arrow_forward" style={{ fontSize: '16px', marginLeft: '8px' }}></forge-icon>
            </ForgeButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myTopIncidents.map((item) => {
              const colors = getPriorityColor(item.priority);
              return (
                <ForgeCard
                  key={item.id}
                  className="border hover:shadow-md transition-all border-l-4 relative"
                  style={{ boxShadow: 'var(--forge-elevation-1)', borderLeftColor: colors.borderLeft.split('-')[2] === 'red' ? '#dc2626' : colors.borderLeft.split('-')[2] === 'orange' ? '#ea580c' : '#f59e0b' }}
                >
                  <div style={{ padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex-1 cursor-pointer min-w-0"
                        onClick={() => {
                          if (onNavigateToIncidentDetail) {
                            let severity = 'Medium';
                            if (item.priority === 'critical') severity = 'High';
                            else if (item.priority === 'high') severity = 'High';
                            else if (item.priority === 'medium') severity = 'Medium';
                            else if (item.priority === 'low') severity = 'Low';

                            const fullIncident = {
                              ...item,
                              description: item.reason,
                              route: item.bus,
                              severity: severity,
                              status: 'Open',
                              date: new Date().toISOString().split('T')[0],
                              studentId: '',
                              driver: '',
                              createdBy: '',
                            };
                            onNavigateToIncidentDetail(fullIncident);
                          }
                        }}
                      >
                        <div className="font-semibold" style={{ fontSize: '1rem', lineHeight: 1.2 }}>
                          {getIncidentSubjectLabel(item)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <forge-badge theme={getPriorityTheme(item.priority)} strong>
                          {item.priority.toUpperCase()}
                        </forge-badge>
                        <ForgeMenu
                          placement="bottom-end"
                          options={[
                            { label: 'Edit Incident', value: 'edit' },
                            { label: 'Reassign', value: 'reassign' },
                          ]}
                          on-forge-menu-select={(evt: any) => {
                            evt.stopPropagation();
                            const val = evt.detail?.value;
                            if (val === 'edit') {
                              setEditingIncident(item);
                              setEditDialogOpen(true);
                            } else if (val === 'reassign') {
                              setReassigningIncident(item);
                              setSelectedAssignee(item.assignedTo);
                              setReassignDialogOpen(true);
                            }
                          }}
                          onClick={(e: any) => e.stopPropagation()}
                        >
                          <ForgeIconButton aria-label="Quick actions">
                            <button type="button" onClick={(e) => e.stopPropagation()}>
                              <forge-icon name="more_vert"></forge-icon>
                            </button>
                          </ForgeIconButton>
                        </ForgeMenu>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2" style={{ marginTop: '2px' }}>
                      <p className="text-muted-foreground" style={{ fontSize: '0.75rem', margin: 0 }}>
                        {item.id}
                      </p>
                      <forge-badge theme="default">{item.type}</forge-badge>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: '0.8125rem', marginTop: 'var(--forge-spacing-xsmall)' }}>
                      <forge-icon name="access_time" style={{ fontSize: '12px' }}></forge-icon>
                      <span>{item.bus} • {item.time}</span>
                    </div>

                    <div className="flex items-start gap-1 text-muted-foreground" style={{ fontSize: '0.8125rem', marginTop: '2px', marginBottom: 'var(--forge-spacing-small)' }}>
                      <forge-icon name="error" style={{ fontSize: '12px', marginTop: '2px', flexShrink: 0 }}></forge-icon>
                      <span>{item.reason}</span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div style={{
                      display: 'flex', gap: 'var(--forge-spacing-xsmall)',
                      paddingTop: 'var(--forge-spacing-xsmall)',
                      borderTop: '1px solid var(--forge-theme-outline)',
                    }}>
                      <ForgeButton
                        variant="outlined"
                        className="incident-card-action-btn"
                        style={{ flex: 1 }}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          if (onNavigateToIncidentDetail) {
                            let severity = 'Medium';
                            if (item.priority === 'critical' || item.priority === 'high') severity = 'High';
                            else if (item.priority === 'low') severity = 'Low';
                            const fullIncident = {
                              ...item,
                              description: item.reason,
                              route: item.bus,
                              severity,
                              status: 'Open',
                              date: new Date().toISOString().split('T')[0],
                              studentId: '', driver: '', createdBy: '',
                            };
                            onNavigateToIncidentDetail(fullIncident);
                          }
                        }}
                      >
                        View
                      </ForgeButton>
                      <ForgeButton
                        variant="outlined"
                        className="incident-card-action-btn"
                        style={{ flex: 1 }}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          onNavigateToCommunication(item.id, {
                            student: item.student, type: item.type, bus: item.bus,
                            priority: item.priority, assignedTo: item.assignedTo,
                          });
                        }}
                      >
                        Message
                      </ForgeButton>
                      <ForgeButton
                        variant="outlined"
                        disabled={inProgressItems.has(item.id)}
                        className="incident-card-action-btn"
                        style={{ flex: 1 }}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          setInProgressItems(prev => {
                            const next = new Set(prev);
                            next.add(item.id);
                            return next;
                          });
                          toast.success('Status Updated', {
                            description: `${item.id} has been marked as In Progress`,
                          });
                        }}
                      >
                        {inProgressItems.has(item.id) ? 'In Progress' : 'Mark In Progress'}
                      </ForgeButton>
                    </div>
                  </div>
                </ForgeCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {/* All four KPIs stay on one row. They previously dropped to a 2x2 block
          at md, which is the width most people actually run this at. */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <ForgeCard
          style={{ boxShadow: 'var(--forge-elevation-1)', cursor: 'pointer' }}
          className="hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToFilteredIncidents?.({ status: 'Open', severity: 'Critical' })}
        >
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#dc2626', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{kpiCritical}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Critical Incidents</h3>
          </div>
        </ForgeCard>

        <ForgeCard
          style={{ boxShadow: 'var(--forge-elevation-1)', cursor: 'pointer' }}
          className="hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToFilteredIncidents?.({ status: 'Open' })}
        >
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{kpiOpen}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Open Incidents</h3>
          </div>
        </ForgeCard>

        <ForgeCard
          style={{ boxShadow: 'var(--forge-elevation-1)', cursor: 'pointer' }}
          className="hover:shadow-lg transition-shadow"
          onClick={() => onNavigateToStudentsWithActiveIncidents?.()}
        >
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#9333ea', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{kpiStudentsWithIncidents}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Students w/ Incidents</h3>
          </div>
        </ForgeCard>

        <ForgeCard
          style={{ boxShadow: 'var(--forge-elevation-1)', cursor: 'pointer' }}
          className="hover:shadow-lg transition-shadow"
          onClick={() => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const dateStr = sevenDaysAgo.toISOString().split('T')[0];
            onNavigateToFilteredIncidents?.({ status: 'Open', dateAfter: dateStr });
          }}
        >
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#16a34a', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{kpiRecent}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Incidents This Week</h3>
          </div>
        </ForgeCard>

      </div>

      {/* Charts Row */}
      {/* All four charts on one row, matching the KPI row above. */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        {/* Incidents by Subject. First, because it is the question a district
            that has just started tracking more than students asks first. */}
        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)', paddingBottom: 'var(--forge-spacing-small)' }}>
            <h3 className="forge-typography--heading4" style={{ fontSize: '1rem' }}>Incidents by Subject</h3>
          </div>
          <div style={{ paddingTop: 0 }}>
            <CustomPieChart data={incidentSubjectData} />
          </div>
        </ForgeCard>

        {/* Incident Type Distribution */}
        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)', paddingBottom: 'var(--forge-spacing-small)' }}>
            <h3 className="forge-typography--heading4" style={{ fontSize: '1rem' }}>Incidents by Type</h3>
          </div>
          <div style={{ paddingTop: 0 }}>
            <CustomPieChart data={incidentTypeData} />
          </div>
        </ForgeCard>

        {/* Incidents by Vehicle */}
        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)', paddingBottom: 'var(--forge-spacing-small)' }}>
            <h3 className="forge-typography--heading4" style={{ fontSize: '1rem' }}>Incidents by Vehicle</h3>
          </div>
          <div style={{ paddingTop: 0 }}>
            <CustomHorizontalBarChart data={incidentsByVehicleData.slice(0, 6)} />
          </div>
        </ForgeCard>

        {/* Incidents by Day of Week */}
        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-medium)', paddingBottom: 'var(--forge-spacing-small)' }}>
            <h3 className="forge-typography--heading4" style={{ fontSize: '1rem' }}>Incidents by Day</h3>
          </div>
          <div style={{ paddingTop: 0 }}>
            <CustomVerticalBarChart data={incidentsByDayData} />
          </div>
        </ForgeCard>
      </div>

      {/* Active Incidents Table */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }} className="flex flex-row items-center justify-between">
          <h3 className="forge-typography--heading4">Active Incidents</h3>
          <ForgeButton variant="outlined" size="sm" onClick={() => onNavigate('incidents')}>
            View All
          </ForgeButton>
        </div>
        <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
          <div className="overflow-x-auto">
            {/* Same ten columns, in the same order, as the incidents page grid,
                so moving between the two does not mean relearning the table. The
                only difference is that this one is locked to newest first and is
                not sortable, which the arrow on Date indicates. */}
            <table className="forge-table" style={{ minWidth: '1400px', width: '100%' }}>
              <thead>
                <tr>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '130px' }}>Incident ID</th>
                  <th
                    className="forge-table-cell forge-table-cell--header"
                    aria-sort="descending"
                    title="Locked sort: newest first"
                    style={{ cursor: 'default', minWidth: '110px' }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Date
                      <forge-icon name="arrow_downward" style={{ fontSize: '14px', opacity: 0.8 }}></forge-icon>
                    </span>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '180px' }}>Involved</th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '120px' }}>Subject</th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '180px' }}>Type</th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '220px' }}>Vehicle/Run</th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '110px' }}>Severity</th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '130px' }}>Status</th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '150px' }}>Assigned To</th>
                  <th className="forge-table-cell forge-table-cell--header" style={{ minWidth: '100px' }}>Messages</th>
                </tr>
              </thead>
              <tbody>
                {activeIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="forge-table-row"
                    onClick={() => {
                      if (onNavigateToIncidentDetail) {
                        onNavigateToIncidentDetail({
                          ...incident,
                          description: incident.description,
                          route: incident.route,
                        });
                      }
                    }}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--forge-theme-primary-container-minimum)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                  >
                    <td className="forge-table-cell" style={{ fontWeight: 500, fontFamily: 'var(--forge-font-family)' }}>
                      {incident.id}
                    </td>
                    <td className="forge-table-cell" style={{ fontFamily: 'var(--forge-font-family)' }}>
                      {incident.displayDate}
                    </td>
                    {/* Involved, matching the incidents page: multi-student rows
                        keep the "+N more" treatment, everything else falls back
                        to the subject label so no row is blank. */}
                    <td className="forge-table-cell" style={{ fontFamily: 'var(--forge-font-family)' }}>
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
                    <td className="forge-table-cell">
                      <forge-badge theme={(incident.subject ?? 'student') === 'student' ? 'default' : 'info-primary'}>
                        {getSubjectLabel(incident.subject ?? 'student')}
                      </forge-badge>
                    </td>
                    <td className="forge-table-cell">
                      <forge-badge theme="default">{incident.type}</forge-badge>
                    </td>
                    <td className="forge-table-cell" style={{ fontFamily: 'var(--forge-font-family)' }}>
                      <div>{incident.bus}</div>
                      <div style={{ fontSize: 'calc(var(--forge-font-size-sm) - 2px)', color: 'var(--forge-theme-text-low)' }}>
                        {incident.route}
                      </div>
                    </td>
                    <td className="forge-table-cell">
                      <forge-badge theme={getSeverityTheme(incident.severity)} strong>
                        {incident.severity}
                      </forge-badge>
                    </td>
                    <td className="forge-table-cell">
                      <forge-badge theme={getStatusTheme(incident.status)}>
                        {incident.status}
                      </forge-badge>
                    </td>
                    <td className="forge-table-cell" style={{ fontFamily: 'var(--forge-font-family)' }}>{incident.assignedTo}</td>
                    <td className="forge-table-cell">
                      {incidentsWithCommunications.includes(incident.id) && (
                        <ForgeButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigateToCommunication(incident.id)}
                          title="View driver communication"
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
        </div>
      </ForgeCard>

      {/* Triage Item Details Dialog */}
      {/* @ts-ignore */}
      <forge-dialog ref={triageDialogRef}>
        <div style={{ padding: '24px', maxWidth: '672px', minWidth: '400px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', fontWeight: 600 }}>Incident Details - {selectedTriageItem?.id}</h2>
          <p className="text-muted-foreground" style={{ margin: '0 0 16px 0', fontSize: '0.875rem' }}>
            Review incident triage information and take action
          </p>
          {selectedTriageItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>Student</div>
                  <div style={{ fontWeight: 500 }}>{getIncidentSubjectLabel(selectedTriageItem)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>Priority</div>
                  <forge-badge theme={getPriorityTheme(selectedTriageItem.priority)} strong>
                    {selectedTriageItem.priority.toUpperCase()}
                  </forge-badge>
                </div>
                <div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>Incident Type</div>
                  <forge-badge theme="default">{selectedTriageItem.type}</forge-badge>
                </div>
                <div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>Vehicle</div>
                  <div>{selectedTriageItem.bus}</div>
                </div>
                <div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>Time Reported</div>
                  <div>{selectedTriageItem.time}</div>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
                  Why This Needs Attention
                </div>
                <Alert className={`${getPriorityColor(selectedTriageItem.priority).bg} border ${getPriorityColor(selectedTriageItem.priority).border}`}>
                  <forge-icon name="error" style={{ fontSize: '16px' }}></forge-icon>
                  <AlertDescription className={getPriorityColor(selectedTriageItem.priority).text}>
                    {selectedTriageItem.reason}
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <div className="text-muted-foreground" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
                  Recommended Action
                </div>
                <p className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-900">
                  {selectedTriageItem.actionNeeded}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <ForgeButton
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  style={{ color: '#ffffff' }}
                  onClick={() => {
                    setTriageDetailsOpen(false);
                    onNavigate('incidents');
                  }}
                >
                  Take Action on Incident
                  <forge-icon name="arrow_forward" style={{ fontSize: '16px', marginLeft: '8px' }}></forge-icon>
                </ForgeButton>
                <ForgeButton
                  variant="outline"
                  onClick={() => {
                    setTriageDetailsOpen(false);
                    onNavigate('communications');
                  }}
                >
                  <forge-icon name="chat" style={{ fontSize: '16px', marginRight: '8px' }}></forge-icon>
                  Message Driver
                </ForgeButton>
              </div>
            </div>
          )}
        </div>
      {/* @ts-ignore */}
      </forge-dialog>

      {/* Edit Incident Dialog */}
      {/* @ts-ignore */}
      <forge-dialog ref={editDialogRef}>
        <div style={{ padding: '24px', maxWidth: '720px', minWidth: '480px' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', fontWeight: 600 }}>
                Edit Incident — {editingIncident?.id}
              </h2>
              <p className="text-muted-foreground" style={{ margin: 0, fontSize: '0.875rem' }}>
                Update incident details and information
              </p>
            </div>
            <button
              onClick={() => setEditDialogOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--forge-text-secondary, #6b7280)' }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>×</span>
            </button>
          </div>
          {editingIncident && (
            <EditIncidentDialog
              incident={editingIncident}
              onClose={() => setEditDialogOpen(false)}
              onSave={() => setEditDialogOpen(false)}
            />
          )}
        </div>
      {/* @ts-ignore */}
      </forge-dialog>

      {/* Reassign Dialog */}
      {/* @ts-ignore */}
      <forge-dialog ref={reassignDialogRef}>
        <div style={{ padding: '24px', maxWidth: '448px', minWidth: '350px' }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', fontWeight: 600 }}>Reassign Incident - {reassigningIncident?.id}</h2>
          <p className="text-muted-foreground" style={{ margin: '0 0 16px 0', fontSize: '0.875rem' }}>
            Select a new assignee for this incident
          </p>
          {reassigningIncident && (
            <div className="space-y-4">
              <div>
                <div className="text-muted-foreground" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
                  Current Assignee
                </div>
                <div style={{ fontWeight: 500 }}>{reassigningIncident.assignedTo}</div>
              </div>

              <div>
                <div className="text-muted-foreground" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
                  New Assignee
                </div>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  style={{ fontSize: '0.875rem' }}
                >
                  {availableAssignees.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <ForgeButton
                  className="flex-1"
                  onClick={() => {
                    toast.success('Incident Reassigned', {
                      description: `${reassigningIncident.id} has been assigned to ${selectedAssignee}`,
                    });
                    setReassignDialogOpen(false);
                    setReassigningIncident(null);
                  }}
                >
                  Reassign Incident
                </ForgeButton>
                <ForgeButton
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setReassignDialogOpen(false);
                    setReassigningIncident(null);
                  }}
                >
                  Cancel
                </ForgeButton>
              </div>
            </div>
          )}
        </div>
      {/* @ts-ignore */}
      </forge-dialog>

      {/* New Incident. Same dialog as the incidents page, including the capped
          width, so filing from either place is the same experience. */}
      {/* @ts-ignore */}
      <forge-dialog ref={newIncidentDialogRef} aria-label="Report New Incident">
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
            <NewIncidentFormUnified onNavigate={(page) => {
              setIsNewIncidentDialogOpen(false);
              if (page === 'incidents') {
                toastHelper[0]({ message: 'Incident reported successfully!', theme: 'success', duration: 3000 } as any);
              }
            }} />
          </div>
        </div>
      </forge-dialog>
    </div>
  );
}