import { useState, useRef, useEffect } from 'react';
import { ForgeButton } from '@tylertech/forge-react';
import { defineButtonComponent, defineDialogComponent, defineTextFieldComponent, defineTabBarComponent, defineTabComponent, defineBadgeComponent, defineIconComponent } from '@tylertech/forge';
defineButtonComponent();
defineDialogComponent();
defineTextFieldComponent();
defineTabBarComponent();
defineTabComponent();
defineBadgeComponent();
defineIconComponent();
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Copy,
  Eye,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertTriangle,
  GitBranch,
  ExternalLink,

} from 'lucide-react';
import {
  INCIDENT_TYPES as SEED_INCIDENT_TYPES,
  INCIDENT_CATEGORIES,
  INCIDENT_SUBJECTS,
  IncidentType,
  getSubjectLabel,
  type IncidentSubject,
} from '../incidents/IncidentTypes';
import { EmailTemplate, INITIAL_EMAIL_TEMPLATES } from '../../data/email-templates';
import { ForgeMultiSelect } from '../ui/forge-multiselect';
import { workflows as SEED_WORKFLOWS, Workflow } from '../../data/workflows';

const INITIAL_TEMPLATES: EmailTemplate[] = INITIAL_EMAIL_TEMPLATES;

// ─── Shared Inline Styles ────────────────────────────────────────────────────

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--forge-font-weight-medium)',
  fontFamily: 'var(--forge-font-family)',
  color: 'var(--foreground)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--forge-shape-large)',
  padding: 'var(--forge-spacing-large)',
  boxShadow: 'var(--forge-elevation-1)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--forge-font-family)',
  fontWeight: 'var(--forge-font-weight-medium)',
  color: 'var(--foreground)',
  display: 'block',
  marginBottom: 'var(--forge-spacing-xxsmall)',
};

const mutedTextStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--forge-font-family)',
  color: 'var(--muted-foreground)',
};

const inputWrapperStyle: React.CSSProperties = {
  marginTop: 'var(--forge-spacing-xxsmall)',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--forge-spacing-small)',
  borderRadius: 'var(--forge-shape-medium)',
  border: '1px solid var(--border)',
  fontSize: 'var(--text-base)',
  fontFamily: 'var(--forge-font-family)',
  background: 'var(--input-background)',
};

const tableHeaderCellStyle: React.CSSProperties = {
  padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--forge-font-family)',
  fontWeight: 'var(--forge-font-weight-medium)',
  color: 'var(--muted-foreground)',
  textAlign: 'left',
  borderBottom: '2px solid var(--border)',
};

const tableCellStyle: React.CSSProperties = {
  padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
  fontSize: 'var(--text-base)',
  fontFamily: 'var(--forge-font-family)',
  color: 'var(--foreground)',
  borderBottom: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))',
  verticalAlign: 'middle',
};

// Category color helper
function categoryBadgeStyle(cat: string): React.CSSProperties {
  const map: Record<string, { bg: string; border: string; color: string }> = {
    Notification: { bg: 'rgba(74, 111, 165, 0.10)', border: 'var(--brand-blue-medium)', color: 'var(--brand-blue-dark)' },
    Approval: { bg: 'rgba(255, 193, 7, 0.12)', border: 'var(--secondary)', color: '#8B6914' },
  };
  const c = map[cat] || { bg: 'var(--muted)', border: 'var(--border)', color: 'var(--foreground)' };
  return {
    background: c.bg,
    borderColor: c.border,
    color: c.color,
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--forge-font-family)',
  };
}

// ─── Permission Groups ────────────────────────────────────────────────────────

type PermCol = 'read' | 'add' | 'edit' | 'delete';

interface PermArea {
  id: string;
  label: string;
  read: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

// ST-style tabs, Incident Tracker lives inside "General"
const PERM_TAB_DEFS = [
  { id: 'general',      label: 'General' },
  { id: 'report',       label: 'Report' },
  { id: 'trip-workflow', label: 'Trip Workflow' },
  { id: 'accounts',     label: 'Accounts' },
  { id: 'terms',        label: 'Terms' },
  { id: 'schools',      label: 'Schools' },
  { id: 'users',        label: 'Users' },
];

const PERM_COLS: { key: PermCol; label: string }[] = [
  { key: 'read',   label: 'Read' },
  { key: 'add',    label: 'Add' },
  { key: 'edit',   label: 'Edit' },
  { key: 'delete', label: 'Delete' },
];

const GROUP_COLORS = ['#4A6FA5', '#3F51B5', '#7B8458', '#607D8B', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6'];

// General-tab areas, incidents, workflows, communications, admin
const ALL_AREAS: { id: string; label: string }[] = [
  { id: 'my-incidents',        label: 'My Incidents' },
  { id: 'all-incidents',       label: 'Student Incidents' },
  { id: 'workflows',           label: 'Workflows' },
  { id: 'workflow-steps',      label: 'Workflow Steps' },
  { id: 'approvals',           label: 'Approvals' },
  { id: 'messages',            label: 'Messages' },
  { id: 'notifications',       label: 'Notifications' },
  { id: 'users-admin',         label: 'Users' },
  { id: 'incident-types',      label: 'Incident Types' },
  { id: 'workflow-templates',  label: 'Workflow Templates' },
  { id: 'email-templates',     label: 'Email Templates' },
  { id: 'permission-groups',   label: 'Permission Groups' },
];

// Report-tab areas, matches the 4 Quick Reports in ReportsPage.tsx (Accessible only)
const REPORT_AREAS: { id: string; label: string }[] = [
  { id: 'rpt-monthly-summary',   label: 'Monthly Summary' },
  { id: 'rpt-yearly-summary',    label: 'Yearly Summary' },
  { id: 'rpt-high-critical',     label: 'High & Critical Incidents' },
  { id: 'rpt-open-incidents',    label: 'Open Incidents Report' },
];

// "Incident Tracker" sits in both General and Report tabs at the same level as ST modules
const PERM_TREE: Record<string, Array<{ id: string; label: string; children: string[] }>> = {
  general: [{ id: 'incident-tracker',         label: 'Incident Tracker', children: ALL_AREAS.map(a => a.id) }],
  report:  [{ id: 'incident-tracker-reports', label: 'Incident Tracker', children: REPORT_AREAS.map(r => r.id) }],
  'trip-workflow': [
    { id: 'tw-cat-request',    label: 'Trip Request',        children: ['tw-enter-request','tw-enter-request-other','tw-cancel-request','tw-view-request','tw-edit-after-approval','tw-edit-after-schedule'] },
    { id: 'tw-cat-approval',   label: 'Trip Approval',       children: ['tw-approve-deny','tw-approve-other','tw-bypass-approval','tw-view-approval'] },
    { id: 'tw-cat-scheduling', label: 'Trip Scheduling',     children: ['tw-schedule-trip','tw-view-schedule'] },
    { id: 'tw-cat-completion', label: 'Trip Completion',     children: ['tw-complete-trip','tw-view-completion'] },
    { id: 'tw-cat-admin',      label: 'Trip Administration', children: ['tw-delete-trip','tw-all-accounts','tw-all-trips','tw-override-funds','tw-close-trip','tw-edit-closed','tw-attachments','tw-max-trips-day','tw-max-trips-type','tw-max-vehicles','tw-advance-cancel','tw-advance-request','tw-closed-datetime','tw-time-thresholds','tw-batch-cancel','tw-batch-close','tw-batch-delete'] },
    { id: 'tw-cat-invoice',    label: 'Trip Invoice',        children: ['tw-enter-invoice','tw-view-invoice'] },
    { id: 'tw-cat-estimate',   label: 'Trip Estimate',       children: ['tw-enter-estimate','tw-view-estimate'] },
    { id: 'tw-cat-payment',    label: 'Trip Payment',        children: ['tw-enter-payment','tw-view-payment'] },
  ],
  accounts: [], terms: [], schools: [], users: [],
};

// Accounts tab, reference only
const ACCOUNT_AREAS: { id: string; label: string }[] = [
  { id: 'acct-default',    label: 'Default - Ungrouped Account' },
  { id: 'acct-requesters', label: 'Trip Requesters - Ungrouped Account' },
];

// Trip Workflow tab, reference only, does not affect app behaviour
const TRIP_WORKFLOW_AREAS: { id: string; label: string }[] = [
  { id: 'tw-enter-request',       label: 'Enter a Trip Request' },
  { id: 'tw-enter-request-other', label: 'Enter a Trip Request for another Requester' },
  { id: 'tw-cancel-request',      label: 'Cancel a Trip Request' },
  { id: 'tw-view-request',        label: 'View a Trip Request' },
  { id: 'tw-edit-after-approval', label: 'Edit Request After Approval' },
  { id: 'tw-edit-after-schedule', label: 'Edit Request After Schedule' },
  { id: 'tw-approve-deny',        label: 'Approve or Deny Trip' },
  { id: 'tw-approve-other',       label: 'Approve for Another User' },
  { id: 'tw-bypass-approval',     label: 'Bypass Approval' },
  { id: 'tw-view-approval',       label: 'View Approval Information' },
  { id: 'tw-schedule-trip',       label: 'Schedule a Trip' },
  { id: 'tw-view-schedule',       label: 'View Schedule Information' },
  { id: 'tw-complete-trip',       label: 'Complete a Trip' },
  { id: 'tw-view-completion',     label: 'View Completion Information' },
  { id: 'tw-delete-trip',         label: 'Delete a Trip' },
  { id: 'tw-all-accounts',        label: 'All Accounts Access' },
  { id: 'tw-all-trips',           label: 'All Trips Access' },
  { id: 'tw-override-funds',      label: 'Override Insufficient Funds' },
  { id: 'tw-close-trip',          label: 'Close a Trip' },
  { id: 'tw-edit-closed',         label: 'Edit a Trip After Closed' },
  { id: 'tw-attachments',         label: 'Add/Remove Attachments' },
  { id: 'tw-max-trips-day',       label: 'Override Maximum Number of Trips per Day' },
  { id: 'tw-max-trips-type',      label: 'Override Maximum Number of Trips per Day per Trip Type' },
  { id: 'tw-max-vehicles',        label: 'Override Maximum Number of Vehicles per Day' },
  { id: 'tw-advance-cancel',      label: 'Override Advance Notice Of Trip Cancellations' },
  { id: 'tw-advance-request',     label: 'Override Advance Notice Of Trip Requests' },
  { id: 'tw-closed-datetime',     label: 'Override Closed Date/Times For Trips' },
  { id: 'tw-time-thresholds',     label: 'Override Time Thresholds' },
  { id: 'tw-batch-cancel',        label: 'Batch Cancel' },
  { id: 'tw-batch-close',         label: 'Batch Close' },
  { id: 'tw-batch-delete',        label: 'Batch Delete' },
  { id: 'tw-enter-invoice',       label: 'Enter a Trip Invoice' },
  { id: 'tw-view-invoice',        label: 'View a Trip Invoice' },
  { id: 'tw-enter-estimate',      label: 'Enter a Trip Estimate' },
  { id: 'tw-view-estimate',       label: 'View a Trip Estimate' },
  { id: 'tw-enter-payment',       label: 'Enter a Trip Payment' },
  { id: 'tw-view-payment',        label: 'View a Trip Payment' },
];

// Schools tab, reference only, uses schools from sample incident data
const SCHOOL_AREAS: { id: string; label: string }[] = [
  { id: 'sch-jefferson',  label: 'Jefferson Middle School' },
  { id: 'sch-lincoln-e',  label: 'Lincoln Elementary' },
  { id: 'sch-lincoln-m',  label: 'Lincoln Middle School' },
  { id: 'sch-roosevelt',  label: 'Roosevelt High School' },
  { id: 'sch-washington', label: 'Washington High School' },
];

// Terms tab, reference only
const TERM_AREAS: { id: string; label: string; alwaysOn?: boolean }[] = [
  { id: 'term-72cft',       label: '72 CFT SAP (transfers)' },
  { id: 'term-default',     label: 'Default SAP (Default)', alwaysOn: true },
  { id: 'term-edited',      label: 'Edited Schedules' },
  { id: 'term-manual',      label: 'Manual Schedules' },
  { id: 'term-smaller',     label: 'Smaller Student Count' },
];

const ALL_COMBINED = [...ALL_AREAS, ...REPORT_AREAS, ...TRIP_WORKFLOW_AREAS, ...ACCOUNT_AREAS, ...SCHOOL_AREAS, ...TERM_AREAS];

function makeAreas(overrides: Partial<Record<string, Partial<Record<PermCol, boolean>>>> = {}): PermArea[] {
  return ALL_COMBINED.map(a => {
    const o = overrides[a.id] ?? {};
    // Default term is always enabled for all groups
    const isDefaultTerm = a.id === 'term-default';
    return { id: a.id, label: a.label, read: isDefaultTerm || (o.read ?? false), add: o.add ?? false, edit: o.edit ?? false, delete: o.delete ?? false };
  });
}

interface GroupMember { name: string; email: string; title: string; }
interface PermissionGroup { id: string; name: string; description: string; color: string; active: boolean; areas: PermArea[]; members: GroupMember[]; }

const INITIAL_GROUPS: PermissionGroup[] = [
  {
    id: 'G-001', name: 'Administrator', color: '#3F51B5', active: true,
    description: 'Full access to all incident management features and administrative controls.',
    areas: makeAreas({
      ...ALL_AREAS.reduce((acc, a) => ({ ...acc, [a.id]: { read: true, add: true, edit: true, delete: true } }), {}),
      ...REPORT_AREAS.reduce((acc, a) => ({ ...acc, [a.id]: { read: true } }), {}),
      ...TRIP_WORKFLOW_AREAS.reduce((acc, a) => ({ ...acc, [a.id]: { read: true } }), {}),
      ...SCHOOL_AREAS.reduce((acc, a) => ({ ...acc, [a.id]: { read: true } }), {}),
      'term-72cft': { read: true }, 'term-default': { read: true },
    }),
    members: [
      { name: 'Sarah Williams',  email: 'sarah.williams@district.edu',  title: 'Transportation Director' },
      { name: 'Karen Singh',     email: 'karen.singh@district.edu',     title: 'District Administrator' },
    ],
  },
  {
    id: 'G-002', name: 'Safety Coordinator', color: '#7B8458', active: true,
    description: 'Manages incidents end-to-end including workflows, communications, and reporting.',
    areas: makeAreas({
      'my-incidents':            { read: true, add: true, edit: true },
      'all-incidents':           { read: true, add: true, edit: true },
      'workflows':               { read: true, add: true, edit: true },
      'workflow-steps':          { read: true, add: true, edit: true },
      'approvals':               { read: true, add: true },
      'messages':                { read: true, add: true },
      'notifications':           { read: true },
      'rpt-monthly-summary':  { read: true },
      'rpt-yearly-summary':   { read: true },
      'rpt-high-critical':    { read: true },
      'rpt-open-incidents':   { read: true },
    }),
    members: [
      { name: 'Carlos Medina',  email: 'carlos.medina@district.edu',  title: 'Safety Coordinator' },
      { name: 'Megan Ford',     email: 'megan.ford@district.edu',     title: 'Safety Coordinator' },
      { name: 'Angela Brooks',  email: 'angela.brooks@district.edu',  title: 'Transportation Director' },
    ],
  },
  {
    id: 'G-003', name: 'Driver', color: '#4A6FA5', active: true,
    description: 'Can create and view own incidents and participate in assigned workflow steps.',
    areas: makeAreas({
      'my-incidents':         { read: true, add: true },
      'workflows':            { read: true },
      'workflow-steps':       { read: true },
      'messages':             { read: true, add: true },
      'notifications':        { read: true },
    }),
    members: [
      { name: 'James Rodriguez',  email: 'james.rodriguez@district.edu',  title: 'Bus Driver' },
      { name: 'Michael Thompson', email: 'michael.thompson@district.edu', title: 'Bus Driver' },
      { name: 'Frank Okafor',     email: 'frank.okafor@district.edu',     title: 'Bus Driver' },
      { name: 'Gloria Patel',     email: 'gloria.patel@district.edu',     title: 'Bus Driver' },
      { name: 'Luis Torres',      email: 'luis.torres@district.edu',      title: 'Bus Driver' },
    ],
  },
  {
    id: 'G-004', name: 'Fleet Manager', color: '#607D8B', active: true,
    description: 'Read-only access to all incidents with reporting capabilities.',
    areas: makeAreas({
      'my-incidents':           { read: true, add: true },
      'all-incidents':          { read: true },
      'workflows':              { read: true },
      'workflow-steps':         { read: true },
      'messages':               { read: true },
      'notifications':          { read: true },
      'rpt-monthly-summary': { read: true },
      'rpt-yearly-summary':  { read: true },
      'rpt-high-critical':   { read: true },
      'rpt-open-incidents':  { read: true },
    }),
    members: [
      { name: 'Patricia Chen',  email: 'patricia.chen@district.edu',  title: 'Fleet Manager' },
      { name: 'Denise Harmon',  email: 'denise.harmon@district.edu',  title: 'Fleet Manager' },
      { name: 'Nathan Kim',     email: 'nathan.kim@district.edu',     title: 'Fleet Manager' },
    ],
  },
  {
    id: 'G-005', name: 'School Principal', color: '#F59E0B', active: true,
    description: 'View-only access to all incidents with communication capability.',
    areas: makeAreas({
      'all-incidents':        { read: true },
      'workflows':            { read: true },
      'workflow-steps':       { read: true },
      'approvals':            { read: true },
      'workflow-templates':   { read: true },
      'messages':             { read: true, add: true },
      'notifications':        { read: true },
      'rpt-monthly-summary': { read: true },
      'rpt-yearly-summary':  { read: true },
      'rpt-high-critical':   { read: true },
      'rpt-open-incidents':  { read: true },
    }),
    members: [
      { name: 'Lisa Nguyen',    email: 'lisa.nguyen@district.edu',    title: 'School Principal' },
      { name: 'Jerome Wallace', email: 'jerome.wallace@district.edu', title: 'School Principal' },
    ],
  },
];

function IndeterminateCheckbox({ state, onChange }: { state: 'checked' | 'indeterminate' | 'unchecked'; onChange: () => void }) {
  const iRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (iRef.current) iRef.current.indeterminate = state === 'indeterminate'; }, [state]);
  return (
    <input ref={iRef} type="checkbox" checked={state === 'checked'} onChange={onChange}
      style={{ cursor: 'pointer', accentColor: '#586ab1', width: 14, height: 14, transform: 'scale(1.15)' }} />
  );
}

function PermToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: checked ? 'var(--primary)' : '#94a3b8',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.15s', flexShrink: 0,
        outline: 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.15s', display: 'block',
      }} />
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  // ─── Tab State ──────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<'templates' | 'incidentTypes' | 'permissions'>('templates');

  // ─── Templates State ─────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Omit<EmailTemplate, 'id' | 'lastModified' | 'isDefault'>>({
    name: '',
    description: '',
    subject: '',
    body: '',
    category: 'Notification',
  });
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // ─── Incident Types State ───────────────────────────────────────────────────
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([...SEED_INCIDENT_TYPES]);
  const [itSearch, setItSearch] = useState('');
  const [itCategoryFilter, setItCategoryFilter] = useState<string[]>([]);
  const [isItDialogOpen, setIsItDialogOpen] = useState(false);
  const [editingIt, setEditingIt] = useState<IncidentType | null>(null);
  const [itForm, setItForm] = useState<Omit<IncidentType, 'id'>>({
    label: '',
    category: Object.values(INCIDENT_CATEGORIES)[0],
    description: '',
    defaultSeverity: 'Medium',
    applicableTo: 'student',
  });

  // ─── Permission Groups State ─────────────────────────────────────────────────
  const [groups, setGroups] = useState<PermissionGroup[]>(INITIAL_GROUPS.map(g => ({ ...g, areas: g.areas.map(a => ({ ...a })), members: [...g.members] })));
  const [groupSearch, setGroupSearch] = useState('');
  const [permView, setPermView] = useState<'list' | 'edit'>('list');
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);
  const [permActiveTab, setPermActiveTab] = useState('general');
  const [groupForm, setGroupForm] = useState<Omit<PermissionGroup, 'id'>>({
    name: '', description: '', color: GROUP_COLORS[0], active: true, areas: makeAreas(), members: [],
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isDefaultGroup, setIsDefaultGroup] = useState(false);

  // ─── Workflows State (for incident type linking) ────────────────────────────
  const [workflowsList, setWorkflowsList] = useState<Workflow[]>([...SEED_WORKFLOWS]);
  const [itWorkflowOption, setItWorkflowOption] = useState<'existing' | 'new' | 'none'>('none');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');

  // ─── Dialog Refs & Effects ─────────────────────────────────────────────────
  const templateDialogRef = useRef<HTMLElement>(null);
  const previewDialogRef = useRef<HTMLElement>(null);
  const itDialogRef = useRef<HTMLElement>(null);

  // Template Dialog sync
  useEffect(() => { const el = templateDialogRef.current as any; if (!el) return; el.open = isTemplateDialogOpen; }, [isTemplateDialogOpen]);
  useEffect(() => { const el = templateDialogRef.current as any; if (!el) return; const handler = () => setIsTemplateDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Preview Dialog sync
  useEffect(() => { const el = previewDialogRef.current as any; if (!el) return; el.open = isPreviewOpen; }, [isPreviewOpen]);
  useEffect(() => { const el = previewDialogRef.current as any; if (!el) return; const handler = () => setIsPreviewOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Incident Type Dialog sync
  useEffect(() => { const el = itDialogRef.current as any; if (!el) return; el.open = isItDialogOpen; }, [isItDialogOpen]);
  useEffect(() => { const el = itDialogRef.current as any; if (!el) return; const handler = () => setIsItDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // ─── Template Helpers ────────────────────────────────────────────────────────

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !templateSearch ||
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCat = templateCategoryFilter.length === 0 || templateCategoryFilter.includes(t.category);
    return matchesSearch && matchesCat;
  });

  const openAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', description: '', subject: '', body: '', category: 'Notification' });
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplate = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      name: tpl.name,
      description: tpl.description,
      subject: tpl.subject,
      body: tpl.body,
      category: tpl.category,
    });
    setIsTemplateDialogOpen(true);
  };

  const duplicateTemplate = (tpl: EmailTemplate) => {
    const copy: EmailTemplate = {
      ...tpl,
      id: `ET-${String(templates.length + 1).padStart(3, '0')}`,
      name: `${tpl.name} (Copy)`,
      isDefault: false,
      lastModified: '2026-03-17',
    };
    setTemplates([...templates, copy]);
  };

  const saveTemplate = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body) return;
    if (editingTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id ? { ...t, ...templateForm, lastModified: '2026-03-17' } : t
        )
      );
    } else {
      const newT: EmailTemplate = {
        id: `ET-${String(templates.length + 1).padStart(3, '0')}`,
        ...templateForm,
        lastModified: '2026-03-17',
        isDefault: false,
      };
      setTemplates([...templates, newT]);
    }
    setIsTemplateDialogOpen(false);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  // ─── Incident Type Helpers ──────────────────────────────────────────────────

  const allItCategories = Object.values(INCIDENT_CATEGORIES);

  // Find linked workflow for an incident type label
  const findLinkedWorkflow = (label: string): Workflow | undefined =>
    workflowsList.find((w) => w.incidentTypes.includes(label) && w.isActive);

  const filteredIncidentTypes = incidentTypes
    .filter((t) => {
      const matchesSearch =
        !itSearch ||
        t.label.toLowerCase().includes(itSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(itSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(itSearch.toLowerCase());
      const matchesCat = itCategoryFilter.length === 0 || itCategoryFilter.includes(t.category);
      return matchesSearch && matchesCat;
    })
    // Auto-sort by linked workflow id; types with no linked workflow sort last
    .sort((a, b) => {
      const aId = findLinkedWorkflow(a.label)?.id ?? '';
      const bId = findLinkedWorkflow(b.label)?.id ?? '';
      if (!aId && !bId) return a.label.localeCompare(b.label);
      if (!aId) return 1;
      if (!bId) return -1;
      return aId.localeCompare(bId);
    });

  const openAddIt = () => {
    setEditingIt(null);
    setItForm({ label: '', category: allItCategories[0], description: '', defaultSeverity: 'Medium', applicableTo: 'student' });
    setItWorkflowOption('none');
    setSelectedWorkflowId('');
    setNewWorkflowName('');
    setNewWorkflowDesc('');
    setIsItDialogOpen(true);
  };

  const openEditIt = (it: IncidentType) => {
    setEditingIt(it);
    setItForm({ label: it.label, category: it.category, description: it.description, defaultSeverity: it.defaultSeverity, applicableTo: it.applicableTo });
    const linked = findLinkedWorkflow(it.label);
    if (linked) {
      setItWorkflowOption('existing');
      setSelectedWorkflowId(linked.id);
    } else {
      setItWorkflowOption('none');
      setSelectedWorkflowId('');
    }
    setNewWorkflowName('');
    setNewWorkflowDesc('');
    setIsItDialogOpen(true);
  };

  const saveIt = () => {
    const label = itForm.label;
    if (editingIt) {
      setIncidentTypes(incidentTypes.map((t) => t.id === editingIt.id ? { ...t, ...itForm } : t));
      // Update workflow link if label changed
      if (editingIt.label !== label) {
        setWorkflowsList((wfs) =>
          wfs.map((w) =>
            w.incidentTypes.includes(editingIt.label)
              ? { ...w, incidentTypes: w.incidentTypes.map((t) => (t === editingIt.label ? label : t)) }
              : w
          )
        );
      }
    } else {
      const newId = itForm.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newIt: IncidentType = { id: newId || `it-${Date.now()}`, ...itForm };
      setIncidentTypes([...incidentTypes, newIt]);
    }

    // Handle workflow linking
    if (itWorkflowOption === 'existing' && selectedWorkflowId) {
      // Remove this type from any other workflow, add to selected
      setWorkflowsList((wfs) =>
        wfs.map((w) => {
          const without = w.incidentTypes.filter((t) => t !== label);
          if (w.id === selectedWorkflowId) {
            return { ...w, incidentTypes: w.incidentTypes.includes(label) ? w.incidentTypes : [...w.incidentTypes, label] };
          }
          return { ...w, incidentTypes: without };
        })
      );
    } else if (itWorkflowOption === 'new' && newWorkflowName) {
      // Remove from any existing workflow
      setWorkflowsList((wfs) => {
        const cleaned = wfs.map((w) => ({
          ...w,
          incidentTypes: w.incidentTypes.filter((t) => t !== label),
        }));
        const nextNum = Math.max(...wfs.map((w) => { const m = w.id.match(/WF-(\d+)/); return m ? parseInt(m[1]) : 0; }), 0) + 1;
        const newWf: Workflow = {
          id: `WF-${String(nextNum).padStart(3, '0')}`,
          name: newWorkflowName,
          description: newWorkflowDesc || `Workflow for ${label}`,
          incidentTypes: [label],
          severityLevels: [itForm.defaultSeverity],
          steps: [
            {
              id: `step-${Date.now()}-1`,
              name: 'Initial Review',
              description: `Review the ${label} incident and gather preliminary information.`,
              assignedRole: 'Safety Coordinator',
              estimatedDuration: '2 hours',
              required: true,
              order: 1,
              status: 'Not Started',
            },
            {
              id: `step-${Date.now()}-2`,
              name: 'Investigation',
              description: 'Conduct a thorough investigation of the incident.',
              assignedRole: 'Safety Coordinator',
              estimatedDuration: '24 hours',
              required: true,
              order: 2,
              status: 'Not Started',
            },
            {
              id: `step-${Date.now()}-3`,
              name: 'Resolution & Documentation',
              description: 'Document findings and close the incident.',
              assignedRole: 'Safety Coordinator',
              estimatedDuration: '4 hours',
              required: true,
              order: 3,
              status: 'Not Started',
            },
          ],
          isActive: true,
          createdBy: 'Sarah Williams',
          createdDate: '2026-03-18',
          lastModified: '2026-03-18',
        };
        return [...cleaned, newWf];
      });
    }

    setIsItDialogOpen(false);
  };

  const deleteIt = (id: string) => {
    setIncidentTypes(incidentTypes.filter((t) => t.id !== id));
  };

  const studentItCount = incidentTypes.filter((t) => t.applicableTo === 'student').length;
  const nonStudentItCount = incidentTypes.filter((t) => t.applicableTo !== 'student').length;

  // ─── Permission Group Helpers ────────────────────────────────────────────────

  const filteredGroups = groups.filter(g =>
    !groupSearch ||
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.description.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const openAddGroup = () => {
    setEditingGroup(null);
    setGroupForm({ name: '', description: '', color: GROUP_COLORS[0], active: true, areas: makeAreas() });
    setPermActiveTab('general');
    setExpandedRows(new Set());
    setIsDefaultGroup(false);
    setPermView('edit');
  };

  const openEditGroup = (g: PermissionGroup) => {
    setEditingGroup(g);
    setGroupForm({ name: g.name, description: g.description, color: g.color, active: g.active, areas: g.areas.map(a => ({ ...a })), members: [...g.members] });
    setPermActiveTab('general');
    setExpandedRows(new Set());
    setIsDefaultGroup(false);
    setPermView('edit');
  };

  const saveGroup = () => {
    if (!groupForm.name) return;
    if (editingGroup) {
      setGroups(groups.map(g => g.id === editingGroup.id ? { ...g, ...groupForm } : g));
    } else {
      setGroups([...groups, { id: `G-${String(groups.length + 1).padStart(3, '0')}`, ...groupForm }]);
    }
    setPermView('list');
  };

  const deleteGroup = (id: string) => setGroups(groups.filter(g => g.id !== id));

  const toggleAreaPerm = (areaId: string, key: PermCol) => {
    setGroupForm(prev => ({
      ...prev,
      areas: prev.areas.map(a => a.id === areaId ? { ...a, [key]: !a[key] } : a),
    }));
  };

  const getParentState = (childIds: string[], col: PermCol): 'checked' | 'indeterminate' | 'unchecked' => {
    const children = groupForm.areas.filter(a => childIds.includes(a.id));
    const n = children.filter(a => a[col]).length;
    if (n === 0) return 'unchecked';
    if (n === children.length) return 'checked';
    return 'indeterminate';
  };

  const toggleParentPerm = (childIds: string[], col: PermCol) => {
    const allChecked = groupForm.areas.filter(a => childIds.includes(a.id)).every(a => a[col]);
    setGroupForm(prev => ({
      ...prev,
      areas: prev.areas.map(a => childIds.includes(a.id) ? { ...a, [col]: !allChecked } : a),
    }));
  };

  const toggleExpand = (id: string) => setExpandedRows(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ fontFamily: 'var(--forge-font-family)', maxWidth: '1280px', margin: '0 auto', padding: 'var(--forge-spacing-large)' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-xxsmall)' }}>
          <Shield size={24} style={{ color: 'var(--primary)' }} />
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--forge-font-weight-medium)', fontFamily: 'var(--forge-font-family)', color: 'var(--foreground)', margin: 0 }}>
            Administration
          </h1>
        </div>
        <p style={{ ...mutedTextStyle, marginTop: 'var(--forge-spacing-xxsmall)' }}>
          Manage incident types, email notification templates, and permission groups for the Incident Tracker system.
        </p>
      </div>

      {/* Section Tabs */}
      {/* @ts-ignore */}
      <forge-tab-bar
        active-tab={activeSection === 'templates' ? 0 : activeSection === 'incidentTypes' ? 1 : 2}
        style={{ marginBottom: 'var(--forge-spacing-large)' }}
      >
        {/* @ts-ignore */}
        <forge-tab onClick={() => setActiveSection('templates')}>
          <forge-icon name="email" slot="leading"></forge-icon>
          Email Templates
        {/* @ts-ignore */}
        </forge-tab>
        {/* @ts-ignore */}
        <forge-tab onClick={() => setActiveSection('incidentTypes')}>
          <forge-icon name="warning" slot="leading"></forge-icon>
          Incident Types
        {/* @ts-ignore */}
        </forge-tab>
        {/* @ts-ignore */}
        <forge-tab onClick={() => setActiveSection('permissions')}>
          <forge-icon name="shield" slot="leading"></forge-icon>
          Permissions
        {/* @ts-ignore */}
        </forge-tab>
      {/* @ts-ignore */}
      </forge-tab-bar>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* EMAIL TEMPLATES SECTION                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'templates' && (
        <div>
          {/* Template Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-small)' }}>
            {filteredTemplates.length === 0 && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: 'var(--forge-spacing-xlarge)', color: 'var(--muted-foreground)', fontFamily: 'var(--forge-font-family)' }}>
                No templates found matching your criteria.
              </div>
            )}
            {filteredTemplates.map((tpl) => {
              const isExpanded = expandedTemplateId === tpl.id;
              return (
                <div key={tpl.id} style={cardStyle}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--forge-spacing-medium)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', flexWrap: 'wrap' }}>
                        <span style={{ ...sectionHeaderStyle, fontSize: 'var(--text-base)' }}>{tpl.name}</span>
                        {/* @ts-ignore */}
                        <forge-badge style={categoryBadgeStyle(tpl.category)}>{tpl.category}</forge-badge>
                        {tpl.isDefault && (
                          // @ts-ignore
                          <forge-badge theme="info-primary">System Default</forge-badge>
                        )}
                      </div>
                      <p style={{ ...mutedTextStyle, marginTop: 'var(--forge-spacing-xxsmall)' }}>{tpl.description}</p>
                      <div style={{ marginTop: 'var(--forge-spacing-xsmall)', fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>
                        <strong>Subject:</strong> {tpl.subject}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--forge-spacing-xxsmall)', flexShrink: 0 }}>
                      <ForgeButton variant="flat" size="sm" onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)} title={isExpanded ? 'Collapse' : 'Expand'}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </ForgeButton>
                      <ForgeButton variant="flat" size="sm" onClick={() => { setPreviewTemplate(tpl); setIsPreviewOpen(true); }} title="Preview">
                        <Eye size={14} />
                      </ForgeButton>
                      <ForgeButton variant="flat" size="sm" onClick={() => duplicateTemplate(tpl)} title="Duplicate">
                        <Copy size={14} />
                      </ForgeButton>
                      <ForgeButton variant="flat" size="sm" onClick={() => openEditTemplate(tpl)} title="Edit">
                        <Pencil size={14} />
                      </ForgeButton>
                      <ForgeButton variant="flat" size="sm" onClick={() => deleteTemplate(tpl.id)} title="Delete" style={{ color: 'var(--destructive)' }}>
                        <Trash2 size={14} />
                      </ForgeButton>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ marginTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', paddingTop: 'var(--forge-spacing-medium)' }}>
                      {/* Body Preview */}
                      <div>
                        <div style={labelStyle}>Body Preview</div>
                        <pre
                          style={{
                            background: 'var(--input-background)',
                            border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))',
                            borderRadius: 'var(--forge-shape-medium)',
                            padding: 'var(--forge-spacing-medium)',
                            fontSize: 'var(--text-sm)',
                            fontFamily: 'var(--forge-font-family)',
                            color: 'var(--foreground)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            margin: 0,
                          }}
                        >
                          {tpl.body}
                        </pre>
                      </div>
                      <div style={{ marginTop: 'var(--forge-spacing-small)', fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>
                        Last Modified: {tpl.lastModified}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TEMPLATE DIALOG                                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* @ts-ignore */}
      <forge-dialog ref={templateDialogRef} style={{ '--forge-dialog-width': '700px' }}>
        <div style={{ maxHeight: '90vh', overflow: 'auto', fontFamily: 'var(--forge-font-family)', padding: 'var(--forge-spacing-large)' }}>
          <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--forge-font-family)', fontWeight: 'var(--forge-font-weight-medium)', margin: 0 }}>
              {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)', margin: 'var(--forge-spacing-xxsmall) 0 0 0' }}>
              {editingTemplate ? 'Update the email template details and body.' : 'Define a new email template for workflow notifications.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
            {/* Name & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--forge-spacing-medium)' }}>
              <div>
                <Label style={labelStyle}>Template Name</Label>
                {/* @ts-ignore */}
                <forge-text-field style={inputWrapperStyle}>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g., Parent Notification"
                    style={{ fontFamily: 'var(--forge-font-family)' }}
                  />
                {/* @ts-ignore */}
                </forge-text-field>
              </div>
              <div>
                <Label style={labelStyle}>Category</Label>
                {/* @ts-ignore */}
                <forge-text-field style={inputWrapperStyle}>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as EmailTemplate['category'] })}
                    style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-sm)', width: '100%' }}
                  >
                    <option value="Notification">Notification</option>
                    <option value="Approval">Approval</option>
                  </select>
                {/* @ts-ignore */}
                </forge-text-field>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label style={labelStyle}>Description</Label>
              {/* @ts-ignore */}
              <forge-text-field style={inputWrapperStyle}>
                <input
                  type="text"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Brief description of when this template is used"
                  style={{ fontFamily: 'var(--forge-font-family)' }}
                />
              {/* @ts-ignore */}
              </forge-text-field>
            </div>

            {/* Subject */}
            <div>
              <Label style={labelStyle}>Email Subject</Label>
              {/* @ts-ignore */}
              <forge-text-field style={inputWrapperStyle}>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="The subject line recipients see"
                  style={{ fontFamily: 'var(--forge-font-family)' }}
                />
              {/* @ts-ignore */}
              </forge-text-field>
            </div>

            {/* Body. Plain text, edited as it sends: there is no placeholder
                substitution, so nothing here is filled in later. */}
            <div>
              <Label style={labelStyle}>Email Body</Label>
              <Textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                placeholder="Write the message recipients receive. It sends exactly as written."
                rows={12}
                style={{ ...inputWrapperStyle, fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-sm)' }}
              />
              <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)', marginTop: 'var(--forge-spacing-xxsmall)' }}>
                Every recipient gets this wording. Details about the incident stay out of the mail, so the reader signs in to see them.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 'var(--forge-spacing-medium)', marginTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--border)', paddingTop: 'var(--forge-spacing-medium)' }}>
            <ForgeButton variant="outlined" onClick={() => setIsTemplateDialogOpen(false)} style={{ flex: 1, fontFamily: 'var(--forge-font-family)' }}>
              Cancel
            </ForgeButton>
            <ForgeButton
              onClick={saveTemplate}
              disabled={!templateForm.name || !templateForm.subject || !templateForm.body}
              style={{ flex: 1, fontFamily: 'var(--forge-font-family)' }}
            >
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </ForgeButton>
          </div>
        </div>
      {/* @ts-ignore */}
      </forge-dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TEMPLATE PREVIEW DIALOG                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* @ts-ignore */}
      <forge-dialog ref={previewDialogRef} style={{ '--forge-dialog-width': '640px' }}>
        <div style={{ maxHeight: '80vh', overflow: 'auto', fontFamily: 'var(--forge-font-family)', padding: 'var(--forge-spacing-large)' }}>
          <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--forge-font-family)', fontWeight: 'var(--forge-font-weight-medium)', margin: 0 }}>
              <Eye size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
              Email Preview
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)', margin: 'var(--forge-spacing-xxsmall) 0 0 0' }}>
              Preview of "{previewTemplate?.name}" template with sample data.
            </p>
          </div>
          {previewTemplate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
              {/* Simulated email chrome */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--forge-shape-large)',
                  overflow: 'hidden',
                }}
              >
                {/* Email header bar */}
                <div
                  style={{
                    background: 'var(--input-background)',
                    padding: 'var(--forge-spacing-medium)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', marginBottom: 'var(--forge-spacing-xxsmall)' }}>
                    <strong>From:</strong> noreply@incidenttracker.district.edu
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', marginBottom: 'var(--forge-spacing-xxsmall)' }}>
                    <strong>To:</strong> sarah.williams@district.edu
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                    <strong>Subject:</strong>{' '}
                    {previewTemplate.subject}
                  </div>
                </div>
                {/* Email body */}
                <div style={{ padding: 'var(--forge-spacing-large)' }}>
                  <pre
                    style={{
                      fontFamily: 'var(--forge-font-family)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--foreground)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                      lineHeight: '1.6',
                    }}
                  >
                    {previewTemplate.body}
                  </pre>
                </div>
              </div>
              {/* This is the whole mail. Nothing gets filled in later, so the
                  preview is exactly what a recipient receives. */}
              <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>
                This is what recipients receive, word for word.
              </div>
            </div>
          )}
        </div>
      {/* @ts-ignore */}
      </forge-dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* INCIDENT TYPES SECTION                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'incidentTypes' && (
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--forge-spacing-medium)', flexWrap: 'wrap', gap: 'var(--forge-spacing-small)' }}>
            <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', zIndex: 1 }} />
                {/* @ts-ignore */}
                <forge-text-field>
                  <input
                    type="text"
                    value={itSearch}
                    onChange={(e) => setItSearch(e.target.value)}
                    placeholder="Search incident types..."
                    style={{ paddingLeft: '2rem', width: '260px', fontFamily: 'var(--forge-font-family)' }}
                  />
                {/* @ts-ignore */}
                </forge-text-field>
              </div>
              <ForgeMultiSelect
                selected={itCategoryFilter}
                onChange={setItCategoryFilter}
                options={allItCategories.map((cat) => ({ value: cat, label: cat }))}
                placeholder="All Categories"
                allLabel="All Categories"
                width="200px"
              />
            </div>
            <ForgeButton onClick={openAddIt} style={{ fontFamily: 'var(--forge-font-family)' }}>
              <Plus size={16} style={{ marginRight: 'var(--forge-spacing-xxsmall)' }} />
              Add Incident Type
            </ForgeButton>
          </div>

          {/* Incident Types Table */}
          <div style={cardStyle}>
            <div style={{ overflowX: 'auto' }}>
              <table className="forge-table">
                <thead>
                  <tr>
                    <th className="forge-table-cell forge-table-cell--header">Label</th>
                    <th className="forge-table-cell forge-table-cell--header">Applies To</th>
                    <th className="forge-table-cell forge-table-cell--header">Category</th>
                    <th className="forge-table-cell forge-table-cell--header">Severity</th>
                    <th className="forge-table-cell forge-table-cell--header">Linked Workflow</th>
                    <th className="forge-table-cell forge-table-cell--header">Description</th>
                    <th className="forge-table-cell forge-table-cell--header" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidentTypes.map((it) => (
                    <tr key={it.id} className="forge-table-row">
                      <td className="forge-table-cell">
                        <div style={{ fontWeight: 'var(--forge-font-weight-medium)', fontFamily: 'var(--forge-font-family)' }}>{it.label}</div>
                        <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>{it.id}</div>
                      </td>
                      <td className="forge-table-cell">
                        {/* @ts-ignore */}
                        <forge-badge theme={it.applicableTo === 'student' ? 'default' : 'info-primary'} style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-xs)' }}>
                          {getSubjectLabel(it.applicableTo)}
                        </forge-badge>
                      </td>
                      <td className="forge-table-cell">
                        {/* @ts-ignore */}
                        <forge-badge theme="default" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-xs)' }}>{it.category}</forge-badge>
                      </td>
                      <td className="forge-table-cell">
                        {/* @ts-ignore */}
                        <forge-badge
                          theme={it.defaultSeverity === 'Critical' ? 'danger' : it.defaultSeverity === 'High' ? 'error' : it.defaultSeverity === 'Medium' ? 'warning' : 'info'}
                          strong
                          style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-xs)' }}
                        >
                          {it.defaultSeverity}
                        {/* @ts-ignore */}
                        </forge-badge>
                      </td>
                      <td className="forge-table-cell">
                        {(() => {
                          const linked = findLinkedWorkflow(it.label);
                          return linked ? (
                            <button
                              onClick={() => onNavigate('workflow-builder')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--forge-spacing-xxsmall)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                fontFamily: 'var(--forge-font-family)',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--primary)',
                              }}
                              title={`${linked.id}: ${linked.name}`}
                            >
                              <GitBranch size={13} />
                              <span>{linked.id}</span>
                              <ExternalLink size={11} style={{ opacity: 0.5 }} />
                            </button>
                          ) : (
                            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                              No workflow
                            </span>
                          );
                        })()}
                      </td>
                      <td className="forge-table-cell" style={{ maxWidth: '300px' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>{it.description}</span>
                      </td>
                      <td className="forge-table-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <ForgeButton variant="flat" size="sm" onClick={() => openEditIt(it)} style={{ fontFamily: 'var(--forge-font-family)' }}>
                          <Pencil size={14} />
                        </ForgeButton>
                        <ForgeButton variant="flat" size="sm" onClick={() => deleteIt(it.id)} style={{ color: 'var(--destructive)', fontFamily: 'var(--forge-font-family)' }}>
                          <Trash2 size={14} />
                        </ForgeButton>
                      </td>
                    </tr>
                  ))}
                  {filteredIncidentTypes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="forge-table-cell" style={{ textAlign: 'center', padding: 'var(--forge-spacing-xlarge)', color: 'var(--muted-foreground)' }}>
                        No incident types match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)', borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>
              Showing {filteredIncidentTypes.length} of {incidentTypes.length} incident types
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Incident Type Dialog */}
      {/* @ts-ignore */}
      <forge-dialog ref={itDialogRef} style={{ '--forge-dialog-width': '620px' }}>
        <div style={{ maxHeight: '90vh', overflow: 'auto', fontFamily: 'var(--forge-font-family)', padding: 'var(--forge-spacing-large)' }}>
          <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
            <h2 style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--forge-font-family)', fontWeight: 'var(--forge-font-weight-medium)', margin: 0 }}>
              {editingIt ? 'Edit Incident Type' : 'Add Incident Type'}
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)', margin: 'var(--forge-spacing-xxsmall) 0 0 0' }}>
              {editingIt ? 'Update the details for this incident type.' : 'Define a new incident type for the system.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
            {/* Label */}
            <div>
              <div style={labelStyle}>Label <span style={{ color: 'var(--destructive)' }}>*</span></div>
              {/* @ts-ignore */}
              <forge-text-field style={inputWrapperStyle}>
                <input
                  type="text"
                  value={itForm.label}
                  onChange={(e) => setItForm({ ...itForm, label: e.target.value })}
                  placeholder="e.g., Unauthorized Device Usage"
                  style={{ fontFamily: 'var(--forge-font-family)' }}
                />
              {/* @ts-ignore */}
              </forge-text-field>
            </div>

            {/* Description */}
            <div>
              <div style={labelStyle}>Description <span style={{ color: 'var(--destructive)' }}>*</span></div>
              <Textarea
                value={itForm.description}
                onChange={(e) => setItForm({ ...itForm, description: e.target.value })}
                placeholder="Describe the incident type..."
                rows={3}
                style={{ ...inputWrapperStyle, fontFamily: 'var(--forge-font-family)' }}
              />
            </div>

            {/* Category */}
            <div>
              <div style={labelStyle}>Category <span style={{ color: 'var(--destructive)' }}>*</span></div>
              {/* @ts-ignore */}
              <forge-text-field style={inputWrapperStyle}>
                <select
                  value={itForm.category}
                  onChange={(e) => setItForm({ ...itForm, category: e.target.value })}
                  style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-sm)', width: '100%' }}
                >
                  {allItCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              {/* @ts-ignore */}
              </forge-text-field>
            </div>

            {/* Applies To, which incident subject this type belongs to. Drives
                which types the New Incident wizard offers for a given subject. */}
            <div>
              <div style={labelStyle}>Applies To <span style={{ color: 'var(--destructive)' }}>*</span></div>
              {/* @ts-ignore */}
              <forge-text-field style={inputWrapperStyle}>
                <select
                  value={itForm.applicableTo}
                  onChange={(e) => setItForm({ ...itForm, applicableTo: e.target.value as IncidentSubject })}
                  style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-sm)', width: '100%' }}
                >
                  {INCIDENT_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              {/* @ts-ignore */}
              </forge-text-field>
            </div>

            {/* Default Severity */}
            <div>
              <div style={labelStyle}>Default Severity <span style={{ color: 'var(--destructive)' }}>*</span></div>
              <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-xxsmall)' }}>
                {(['Low', 'Medium', 'High', 'Critical'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setItForm({ ...itForm, defaultSeverity: sev })}
                    style={{
                      flex: 1,
                      padding: 'var(--forge-spacing-small)',
                      borderRadius: 'var(--forge-shape-medium)',
                      border: itForm.defaultSeverity === sev ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: itForm.defaultSeverity === sev
                        ? (sev === 'Critical' ? 'rgba(176, 0, 32, 0.16)' : sev === 'High' ? 'rgba(176, 0, 32, 0.08)' : sev === 'Medium' ? 'rgba(255, 193, 7, 0.12)' : 'rgba(159, 168, 112, 0.15)')
                        : 'var(--input-background)',
                      color: itForm.defaultSeverity === sev
                        ? (sev === 'Critical' ? '#B00020' : sev === 'High' ? 'var(--destructive)' : sev === 'Medium' ? '#8B6914' : 'var(--brand-olive-dark)')
                        : 'var(--muted-foreground)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--forge-font-weight-medium)',
                      fontFamily: 'var(--forge-font-family)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Linked Workflow ─── */}
            <div style={{ borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', paddingTop: 'var(--forge-spacing-medium)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)', marginBottom: 'var(--forge-spacing-small)' }}>
                <GitBranch size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ ...labelStyle, margin: 0 }}>Linked Workflow <span style={{ color: 'var(--destructive)' }}>*</span></span>
              </div>
              <p style={{ ...mutedTextStyle, marginBottom: 'var(--forge-spacing-small)' }}>
                Every incident type must be tied to a workflow. Select an existing workflow or create a new one.
              </p>

              {/* Option selector */}
              <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-medium)' }}>
                {(['existing', 'new'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setItWorkflowOption(opt);
                      if (opt === 'existing') { setNewWorkflowName(''); setNewWorkflowDesc(''); }
                      if (opt === 'new') { setSelectedWorkflowId(''); }
                    }}
                    style={{
                      flex: 1,
                      padding: 'var(--forge-spacing-small)',
                      borderRadius: 'var(--forge-shape-medium)',
                      border: itWorkflowOption === opt ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: itWorkflowOption === opt ? 'rgba(63, 81, 181, 0.08)' : 'var(--input-background)',
                      color: itWorkflowOption === opt ? 'var(--primary)' : 'var(--foreground)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--forge-font-weight-medium)',
                      fontFamily: 'var(--forge-font-family)',
                      transition: 'all 150ms',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--forge-spacing-xxsmall)',
                    }}
                  >
                    {opt === 'existing' ? (
                      <><GitBranch size={14} /> Use Existing Workflow</>
                    ) : (
                      <><Plus size={14} /> Create New Workflow</>
                    )}
                  </button>
                ))}
              </div>

              {/* Existing workflow selector */}
              {itWorkflowOption === 'existing' && (
                <div>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <select
                      value={selectedWorkflowId}
                      onChange={(e) => setSelectedWorkflowId(e.target.value)}
                      style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-sm)', width: '100%' }}
                    >
                      <option value="">- Select a workflow -</option>
                      {workflowsList
                        .filter((w) => w.isActive)
                        .sort((a, b) => a.id.localeCompare(b.id))
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.id}: {w.name}
                          </option>
                        ))}
                    </select>
                  {/* @ts-ignore */}
                  </forge-text-field>
                  {selectedWorkflowId && (() => {
                    const wf = workflowsList.find((w) => w.id === selectedWorkflowId);
                    return wf ? (
                      <div
                        style={{
                          marginTop: 'var(--forge-spacing-small)',
                          padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
                          background: 'var(--input-background)',
                          borderRadius: 'var(--forge-shape-medium)',
                          border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))',
                        }}
                      >
                        <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', color: 'var(--foreground)', marginBottom: '2px' }}>
                          <strong>{wf.name}</strong>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>
                          {wf.description}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-xsmall)', fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>
                          <span>{wf.steps.length} steps</span>
                          <span>•</span>
                          <span>Currently linked to: {wf.incidentTypes.join(', ') || 'none'}</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* New workflow form */}
              {itWorkflowOption === 'new' && (
                <div
                  style={{
                    padding: 'var(--forge-spacing-medium)',
                    background: 'var(--input-background)',
                    borderRadius: 'var(--forge-shape-medium)',
                    border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--forge-spacing-small)',
                  }}
                >
                  <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xxsmall)' }}>
                    <Plus size={12} />
                    New Workflow Details
                  </div>
                  <div>
                    <div style={{ ...labelStyle, fontSize: 'var(--text-xs)' }}>Workflow Name <span style={{ color: 'var(--destructive)' }}>*</span></div>
                    {/* @ts-ignore */}
                    <forge-text-field>
                      <input
                        type="text"
                        value={newWorkflowName}
                        onChange={(e) => setNewWorkflowName(e.target.value)}
                        placeholder={itForm.label ? `${itForm.label} Response` : 'e.g., Unauthorized Device Response'}
                        style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-sm)' }}
                      />
                    {/* @ts-ignore */}
                    </forge-text-field>
                  </div>
                  <div>
                    <div style={{ ...labelStyle, fontSize: 'var(--text-xs)' }}>Description</div>
                    <Textarea
                      value={newWorkflowDesc}
                      onChange={(e) => setNewWorkflowDesc(e.target.value)}
                      placeholder={itForm.label ? `Workflow for handling ${itForm.label} incidents` : 'Brief description of the workflow purpose'}
                      rows={2}
                      style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-sm)' }}
                    />
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xxsmall)' }}>
                    <AlertTriangle size={11} />
                    A 3-step starter workflow (Initial Review → Investigation → Resolution) will be created. You can customize steps in the Workflow Builder after saving.
                  </div>
                </div>
              )}

              {itWorkflowOption === 'none' && !editingIt && (
                <p style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--forge-font-family)', color: 'var(--destructive)', marginTop: 'var(--forge-spacing-xxsmall)' }}>
                  Please select or create a workflow for this incident type.
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-small)' }}>
              <ForgeButton variant="outlined" onClick={() => setIsItDialogOpen(false)} style={{ flex: 1, fontFamily: 'var(--forge-font-family)' }}>
                Cancel
              </ForgeButton>
              <ForgeButton
                onClick={saveIt}
                disabled={
                  !itForm.label || !itForm.description ||
                  (itWorkflowOption === 'none' && !editingIt) ||
                  (itWorkflowOption === 'existing' && !selectedWorkflowId) ||
                  (itWorkflowOption === 'new' && !newWorkflowName)
                }
                style={{ flex: 1, fontFamily: 'var(--forge-font-family)' }}
              >
                {editingIt ? 'Save Changes' : 'Add Type'}
              </ForgeButton>
            </div>
          </div>
        </div>
      {/* @ts-ignore */}
      </forge-dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PERMISSIONS SECTION, ST Groups design                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Groups List (ST Index.cshtml style) ─────────────────────────────── */}
      {activeSection === 'permissions' && permView === 'list' && (
        <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#333', fontSize: 13 }}>
          {/* Title */}
          <div style={{ fontSize: 17, fontWeight: 400, borderBottom: '1px solid #d0d5dd', paddingBottom: 8, marginBottom: 14 }}>
            Groups
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 12 }}>
            <button onClick={openAddGroup} style={{ color: '#586ab1', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0 }}>
              Add a new Group
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="text"
                value={groupSearch}
                onChange={e => setGroupSearch(e.target.value)}
                placeholder="Search..."
                style={{ border: '1px solid #bbb', padding: '4px 8px', fontSize: 12, width: 200, borderRadius: 2, outline: 'none' }}
              />
              <Search size={16} style={{ color: '#555', cursor: 'pointer' }} />
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #c8d0d8', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontWeight: 600, borderBottom: '1px solid #c8d0d8', borderRight: '1px solid #c8d0d8', background: '#fff', width: '38%' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '7px 10px', fontWeight: 600, borderBottom: '1px solid #c8d0d8', background: '#fff', color: '#586ab1' }}>Description</th>
                <th style={{ width: 16, borderBottom: '1px solid #c8d0d8', borderLeft: '1px solid #c8d0d8', background: '#fff' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g, idx) => (
                <tr key={g.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#EEF4FB' }}>
                  <td style={{ padding: '6px 10px', borderRight: '1px solid #dde3ea', borderBottom: '1px solid #eaecef' }}>
                    <button onClick={() => openEditGroup(g)} style={{ color: '#586ab1', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0, textAlign: 'left' }}>
                      {g.name}
                    </button>
                  </td>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #eaecef', color: '#555' }}>{g.description}</td>
                  <td style={{ borderBottom: '1px solid #eaecef', borderLeft: '1px solid #dde3ea' }}></td>
                </tr>
              ))}
              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '14px 10px', textAlign: 'center', color: '#888' }}>No groups found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button style={{ color: '#586ab1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>PDF</button>
              <span style={{ color: '#888' }}>|</span>
              <button style={{ color: '#586ab1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>EXCEL</button>
            </div>
            <span style={{ color: '#666' }}>{filteredGroups.length} records</span>
          </div>
        </div>
      )}

      {/* ── Group Detail (_formDetail.cshtml style) ──────────────────────────── */}
      {activeSection === 'permissions' && permView === 'edit' && (() => {
        const treeNodes = PERM_TREE[permActiveTab] || [];
        const isReportTab = permActiveTab === 'report';
        const isUsersTab = permActiveTab === 'users';
        const isTripWorkflowTab = permActiveTab === 'trip-workflow';
        const isAccountsTab = permActiveTab === 'accounts';
        const isTermsTab = permActiveTab === 'terms';
        const isSchoolsTab = permActiveTab === 'schools';
        return (
          <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#333', fontSize: 13 }}>

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 400 }}>
                Group{groupForm.name ? ` - ${groupForm.name}` : ''}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setPermView('list')}
                  style={{ background: '#e8e8e8', border: '1px solid #c0c0c0', borderRadius: 3, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#333' }}
                >
                  back to list
                </button>
                <button style={{ background: '#fff', border: '1px solid #c0c0c0', borderRadius: 3, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: '#333', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Actions <span style={{ fontSize: 9 }}>▾</span>
                </button>
              </div>
            </div>

            {/* Group Information */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Group Information</div>
              <table style={{ borderCollapse: 'separate', borderSpacing: '0 5px', marginTop: -4 }}>
                <tbody>
                  <tr>
                    <td style={{ paddingRight: 12, fontWeight: 500, verticalAlign: 'middle', width: 110 }}>Name</td>
                    <td>
                      <input
                        type="text"
                        value={groupForm.name}
                        onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                        style={{ border: '1px solid #aaa', padding: '4px 6px', fontSize: 13, width: 320, borderRadius: 1, outline: 'none' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingRight: 12, fontWeight: 500, verticalAlign: 'top', paddingTop: 4 }}>Description</td>
                    <td>
                      <textarea
                        value={groupForm.description}
                        onChange={e => setGroupForm({ ...groupForm, description: e.target.value })}
                        rows={3}
                        style={{ border: '1px solid #aaa', padding: '4px 6px', fontSize: 13, width: 320, borderRadius: 1, resize: 'none', outline: 'none' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingRight: 12, fontWeight: 500, verticalAlign: 'middle' }}>Default Group</td>
                    <td style={{ paddingTop: 2 }}>
                      <input
                        type="checkbox"
                        checked={isDefaultGroup}
                        onChange={() => setIsDefaultGroup(v => !v)}
                        style={{ accentColor: '#586ab1', width: 14, height: 14, cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Permissions */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Permissions</div>

              {/* Tab links */}
              <div style={{ display: 'flex', borderBottom: '1px solid #c8d0d8', marginBottom: 0 }}>
                {PERM_TAB_DEFS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setPermActiveTab(t.id); setExpandedRows(new Set()); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '5px 14px',
                      color: '#586ab1',
                      fontSize: 13,
                      fontWeight: permActiveTab === t.id ? 700 : 400,
                      borderBottom: permActiveTab === t.id ? '2px solid #586ab1' : '2px solid transparent',
                      marginBottom: -1,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Trip Workflow tab, left-checkbox layout, no column headers, reference only */}
              {isTripWorkflowTab && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {treeNodes.map((parent, pi) => {
                      const isExpanded = expandedRows.has(parent.id);
                      const childAreas = groupForm.areas.filter(a => parent.children.includes(a.id));
                      return (
                        <>
                          <tr key={parent.id} style={{ background: pi % 2 === 0 ? '#EEF4FB' : '#ffffff', borderBottom: '1px solid #dde3ea' }}>
                            <td onClick={() => toggleExpand(parent.id)} style={{ padding: '6px 10px', cursor: 'pointer', userSelect: 'none' }}>
                              <span style={{ fontSize: 9, color: '#555', marginRight: 8, display: 'inline-block', transition: 'transform 0.1s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
                              <span style={{ fontWeight: 500 }}>{parent.label}</span>
                            </td>
                          </tr>
                          {isExpanded && childAreas.map((area, ci) => (
                            <tr key={area.id} style={{ background: ci % 2 === 0 ? '#ffffff' : '#EEF4FB', borderBottom: '1px solid #eaecef' }}>
                              <td style={{ padding: '5px 10px 5px 36px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input type="checkbox" checked={area.read} onChange={() => toggleAreaPerm(area.id, 'read')}
                                  style={{ cursor: 'pointer', accentColor: '#586ab1', width: 14, height: 14, flexShrink: 0 }} />
                                <span style={{ color: '#444' }}>{area.label}</span>
                              </td>
                            </tr>
                          ))}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Accounts tab, Enable/Disable All buttons + flat permissions table, reference only */}
              {isAccountsTab && (() => {
                const acctAreas = groupForm.areas.filter(a => ACCOUNT_AREAS.some(ac => ac.id === a.id));
                const allEnabled = acctAreas.every(a => a.read);
                return (
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button
                        onClick={() => ACCOUNT_AREAS.forEach(ac => { if (!groupForm.areas.find(a => a.id === ac.id)?.read) toggleAreaPerm(ac.id, 'read'); })}
                        style={{ background: '#586ab1', border: 'none', borderRadius: 3, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                        Enable All Accounts
                      </button>
                      <button
                        onClick={() => ACCOUNT_AREAS.forEach(ac => { if (groupForm.areas.find(a => a.id === ac.id)?.read) toggleAreaPerm(ac.id, 'read'); })}
                        style={{ background: '#586ab1', border: 'none', borderRadius: 3, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                        Disable All Accounts
                      </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #c0c8d4' }}>
                          <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, fontSize: 12, color: '#555' }}>Account / Account Groups</th>
                          <th style={{ textAlign: 'right', padding: '6px 24px 6px 10px', fontWeight: 500, fontSize: 12, color: '#555', width: 120 }}>Permissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acctAreas.map((area, idx) => (
                          <tr key={area.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#EEF4FB', borderBottom: '1px solid #eaecef' }}>
                            <td style={{ padding: '6px 10px', color: '#586ab1' }}>{area.label}</td>
                            <td style={{ textAlign: 'right', padding: '6px 24px 6px 10px' }}>
                              <input type="checkbox" checked={area.read} onChange={() => toggleAreaPerm(area.id, 'read')}
                                style={{ cursor: 'pointer', accentColor: '#586ab1', width: 14, height: 14, transform: 'scale(1.15)' }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Schools tab, Enable/Disable All + flat permissions table, reference only */}
              {isSchoolsTab && (() => {
                const schoolAreas = groupForm.areas.filter(a => SCHOOL_AREAS.some(s => s.id === a.id));
                return (
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button
                        onClick={() => SCHOOL_AREAS.forEach(s => { if (!groupForm.areas.find(a => a.id === s.id)?.read) toggleAreaPerm(s.id, 'read'); })}
                        style={{ background: '#586ab1', border: 'none', borderRadius: 3, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                        Enable All Schools
                      </button>
                      <button
                        onClick={() => SCHOOL_AREAS.forEach(s => { if (groupForm.areas.find(a => a.id === s.id)?.read) toggleAreaPerm(s.id, 'read'); })}
                        style={{ background: '#586ab1', border: 'none', borderRadius: 3, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                        Disable All Schools
                      </button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #c0c8d4' }}>
                          <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, fontSize: 12, color: '#555' }}>Schools - Allow users to view students and runs associated with:</th>
                          <th style={{ textAlign: 'right', padding: '6px 24px 6px 10px', fontWeight: 500, fontSize: 12, color: '#555', width: 120 }}>Permissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schoolAreas.map((area, idx) => (
                          <tr key={area.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#EEF4FB', borderBottom: '1px solid #eaecef' }}>
                            <td style={{ padding: '6px 10px', color: '#333' }}>{area.label}</td>
                            <td style={{ textAlign: 'right', padding: '6px 24px 6px 10px' }}>
                              <input type="checkbox" checked={area.read} onChange={() => toggleAreaPerm(area.id, 'read')}
                                style={{ cursor: 'pointer', accentColor: '#586ab1', width: 14, height: 14, transform: 'scale(1.15)' }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Terms tab, info banner + flat checkbox list, reference only */}
              {isTermsTab && (
                <div>
                  <div style={{ background: '#eef4fb', border: '1px solid #c8d8ee', borderRadius: 3, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                    A Group always has permission for the default term. Select additional term permissions for this group.
                  </div>
                  <div style={{ border: '1px solid #c8d0d8', borderRadius: 2 }}>
                    {TERM_AREAS.map((term, idx) => {
                      const area = groupForm.areas.find(a => a.id === term.id);
                      const isAlwaysOn = !!term.alwaysOn;
                      const isChecked = isAlwaysOn || (area?.read ?? false);
                      return (
                        <div key={term.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 12px', background: idx % 2 === 0 ? '#ffffff' : '#EEF4FB', borderBottom: idx < TERM_AREAS.length - 1 ? '1px solid #e8ecf0' : 'none' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isAlwaysOn}
                            onChange={() => !isAlwaysOn && area && toggleAreaPerm(area.id, 'read')}
                            style={{ cursor: isAlwaysOn ? 'default' : 'pointer', accentColor: '#586ab1', width: 14, height: 14, transform: 'scale(1.15)', opacity: isAlwaysOn ? 0.5 : 1 }}
                          />
                          <span style={{ fontSize: 13, color: isAlwaysOn ? '#888' : '#333' }}>{term.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Users tab, member list */}
              {isUsersTab && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 0 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #c0c8d4' }}>
                      <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, fontSize: 12, color: '#555', width: '35%' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, fontSize: 12, color: '#555', width: '40%' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, fontSize: 12, color: '#555' }}>Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupForm.members.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: '20px 10px', color: '#aaa', fontSize: 12 }}>No users assigned to this group.</td></tr>
                    ) : groupForm.members.map((m, idx) => (
                      <tr key={m.email} style={{ background: idx % 2 === 0 ? '#ffffff' : '#EEF4FB', borderBottom: '1px solid #eaecef' }}>
                        <td style={{ padding: '6px 10px', color: '#586ab1' }}>{m.name}</td>
                        <td style={{ padding: '6px 10px', color: '#555' }}>{m.email}</td>
                        <td style={{ padding: '6px 10px', color: '#555' }}>{m.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Permission grid, hidden on Users, Trip Workflow, Accounts, Terms, Schools tabs */}
              {!isUsersTab && !isTripWorkflowTab && !isAccountsTab && !isTermsTab && !isSchoolsTab && <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 0 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #c0c8d4' }}>
                    <th style={{ width: 24, borderRight: '1px solid #dde3ea' }}></th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 500, fontSize: 12, color: '#555' }}>Area</th>
                    {isReportTab
                      ? <th style={{ textAlign: 'right', padding: '6px 24px 6px 10px', fontWeight: 500, fontSize: 12, color: '#555' }}>Accessible</th>
                      : PERM_COLS.map(c => (
                          <th key={c.key} style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 500, fontSize: 12, color: '#555', width: '11%' }}>
                            {c.label}
                          </th>
                        ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {treeNodes.map((parent, pi) => {
                    const isExpanded = expandedRows.has(parent.id);
                    const accessState = getParentState(parent.children, 'read');
                    return (
                      <>
                        <tr key={parent.id} style={{ background: pi % 2 === 0 ? '#EEF4FB' : '#ffffff', borderBottom: '1px solid #dde3ea' }}>
                          <td onClick={() => toggleExpand(parent.id)} style={{ textAlign: 'center', cursor: 'pointer', padding: '5px 0', borderRight: '1px solid #dde3ea', userSelect: 'none' }}>
                            <span style={{ fontSize: 9, color: '#555', display: 'inline-block', transition: 'transform 0.1s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
                          </td>
                          <td style={{ padding: '6px 10px', fontWeight: 500 }}>{parent.label}</td>
                          {isReportTab
                            ? <td style={{ textAlign: 'right', padding: '6px 24px 6px 10px' }}>
                                <IndeterminateCheckbox state={accessState} onChange={() => toggleParentPerm(parent.children, 'read')} />
                              </td>
                            : PERM_COLS.map(c => {
                                const st = getParentState(parent.children, c.key);
                                return (
                                  <td key={c.key} style={{ textAlign: 'center', padding: '6px 10px' }}>
                                    <IndeterminateCheckbox state={st} onChange={() => toggleParentPerm(parent.children, c.key)} />
                                  </td>
                                );
                              })
                          }
                        </tr>
                        {isExpanded && groupForm.areas
                          .filter(a => parent.children.includes(a.id))
                          .map(area => (
                            <tr key={area.id} style={{ background: '#ffffff', borderBottom: '1px solid #eaecef' }}>
                              <td style={{ borderRight: '1px solid #dde3ea' }}></td>
                              <td style={{ padding: '5px 10px 5px 30px', color: '#444' }}>{area.label}</td>
                              {isReportTab
                                ? <td style={{ textAlign: 'right', padding: '5px 24px 5px 10px' }}>
                                    <input type="checkbox" checked={area.read} onChange={() => toggleAreaPerm(area.id, 'read')} style={{ cursor: 'pointer', accentColor: '#586ab1', width: 14, height: 14, transform: 'scale(1.15)' }} />
                                  </td>
                                : PERM_COLS.map(c => (
                                    <td key={c.key} style={{ textAlign: 'center', padding: '5px 10px' }}>
                                      <input type="checkbox" checked={area[c.key]} onChange={() => toggleAreaPerm(area.id, c.key)} style={{ cursor: 'pointer', accentColor: '#586ab1', width: 14, height: 14, transform: 'scale(1.15)' }} />
                                    </td>
                                  ))
                              }
                            </tr>
                          ))
                        }
                      </>
                    );
                  })}
                  {treeNodes.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '20px 10px', color: '#aaa', fontSize: 12 }}>No permissions configured for this area.</td></tr>
                  )}
                </tbody>
              </table>}

            </div>

            {/* Save / Cancel */}
            <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
              <button
                onClick={saveGroup}
                disabled={!groupForm.name}
                style={{ background: groupForm.name ? '#586ab1' : '#a0a8c0', border: 'none', borderRadius: 3, padding: '6px 18px', color: '#fff', fontSize: 13, cursor: groupForm.name ? 'pointer' : 'not-allowed' }}
              >
                {editingGroup ? 'Save' : 'Add Group'}
              </button>
              <button
                onClick={() => setPermView('list')}
                style={{ background: '#e8e8e8', border: '1px solid #c0c0c0', borderRadius: 3, padding: '6px 18px', color: '#333', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}