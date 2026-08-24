import { ForgeCard } from '@tylertech/forge-react';
import { defineCardComponent } from '@tylertech/forge';
defineCardComponent();
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  BookOpen, HelpCircle, FileText, Users, BarChart3, Bus,
  UserCircle, Mail, GitBranch, AlertCircle, MessageSquare,
  Shield, Settings, CheckCircle,
} from 'lucide-react';

/* ───────────────────── shared inline style helpers ───────────────────── */
const sectionCard: React.CSSProperties = {
  boxShadow: 'var(--forge-elevation-2)',
  marginBottom: 'var(--forge-spacing-large)',
};

const featureCard: React.CSSProperties = {
  borderRadius: 'var(--forge-shape-large)',
  padding: 'var(--forge-spacing-medium)',
  border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
};

const highlightCard: React.CSSProperties = {
  ...featureCard,
  borderColor: 'var(--brand-blue-medium)',
  borderWidth: '2px',
};

const badgeNew: React.CSSProperties = {
  backgroundColor: 'var(--brand-olive-light)',
  color: 'var(--brand-olive-dark)',
};

/* ───────────────────── component ───────────────────── */
export function HelpPage() {
  return (
    <div style={{ padding: 'var(--forge-spacing-xlarge)', fontFamily: 'var(--forge-font-family)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 'var(--forge-spacing-xsmall)', fontFamily: 'var(--forge-font-family)' }}>
            Help &amp; Support
          </h1>
          <p className="text-muted-foreground" style={{ margin: 0, fontFamily: 'var(--forge-font-family)' }}>
            Learn how to use the Incident Tracker in Student Transportation
          </p>
        </div>
      </div>

      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="grid w-full grid-cols-3" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
          <TabsTrigger value="getting-started">
            <BookOpen className="mr-2 h-4 w-4" />
            Getting Started
          </TabsTrigger>
          <TabsTrigger value="user-guide">
            <FileText className="mr-2 h-4 w-4" />
            User Guide
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="mr-2 h-4 w-4" />
            FAQ
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════  GETTING STARTED  ═══════════════════ */}
        <TabsContent value="getting-started">
          <ForgeCard style={sectionCard}>
            <div style={{ padding: 'var(--forge-spacing-medium)' }}>
              <h3 className="forge-typography--heading4" style={{ fontFamily: 'var(--forge-font-family)' }}>
                Welcome to the Student Transportation Incident Tracker
              </h3>
              <div className="space-y-6" style={{ marginTop: 'var(--forge-spacing-small)' }}>
              {/* Overview */}
              <div>
                <h3 className="mb-3" style={{ fontFamily: 'var(--forge-font-family)' }}>Overview</h3>
                <p className="text-foreground leading-relaxed" style={{ fontFamily: 'var(--forge-font-family)' }}>
                  The Incident Tracker is an application designed for Student Transportation departments to capture, manage, and communicate about incidents that occur during daily operations. It is integrated into Student Transportation to leverage student, employee, vehicle, and location data. An incident is not always about a student, so the application covers five subjects: Student, Vehicle, Location, Third Party, and Employee. Choosing the subject is the first thing you do, and it determines which details you are asked for. Across those subjects there are 20 incident types in 10 categories. The application helps safety coordinators, supervisors, and administrators file incidents, run multi-step workflows, communicate with drivers, administer email templates and user roles, and generate reports for analysis and compliance.
                </p>
              </div>

              {/* Navigation */}
              <div>
                <h3 className="mb-3" style={{ fontFamily: 'var(--forge-font-family)' }}>Navigation</h3>
                <p className="text-foreground leading-relaxed" style={{ marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)' }}>
                  The application uses Tyler Forge navigation patterns:
                </p>
                <ul className="space-y-2 ml-5 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                  <li><strong>Navigation Drawer:</strong> Always visible down the left side, listing every application area: Dashboard, Incidents, Students, Employees, Vehicles, Locations, Communications, Reports, Workflows, and Admin. Click the menu icon in the top-left to collapse it to icons when you need the width</li>
                  <li><strong>Students, Employees, Vehicles, and Locations:</strong> One page per thing an incident can be about, so every subject has a record to point at</li>
                  <li><strong>Help Icon (?):</strong> Located in the top-right app bar, click to access this Help &amp; Support page</li>
                  <li><strong>Profile Menu:</strong> Click the avatar in the top-right to log out</li>
                  <li><strong>Global Search:</strong> Search bar in the top-center of the app bar for quick access to incidents, students, drivers, and vehicles. Employees who are not drivers, and locations, are found from their own pages</li>
                </ul>
              </div>

              {/* Roles */}
              <div>
                <h3 className="mb-3" style={{ fontFamily: 'var(--forge-font-family)' }}>User Roles</h3>
                <p className="text-foreground leading-relaxed" style={{ marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)' }}>
                  The system supports seven role types, managed through Administration &rarr; User Roles:
                </p>
                <ul className="space-y-1 ml-5 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                  <li><strong>Safety Coordinator</strong> &mdash; Primary user; manages incidents, communicates with drivers, runs reports</li>
                  <li><strong>Administrator</strong> &mdash; Full system access including Admin configuration, workflow builder, and system settings</li>
                  <li><strong>School Principal</strong> &mdash; Reviews incidents involving their school&rsquo;s students, participates in disciplinary workflows</li>
                  <li><strong>Driver</strong> &mdash; Completes initial response workflow steps, receives communications</li>
                  <li><strong>Fleet Manager</strong> &mdash; Owns Vehicle incidents, assesses damage, and schedules repairs</li>
                  <li><strong>Nurse</strong> &mdash; Provides medical assessment and first aid, and owns the Employee Injury workflow</li>
                  <li><strong>Mechanic</strong> &mdash; Handles vehicle repair tasks within maintenance and breakdown workflows</li>
                </ul>
              </div>

              {/* Key Features Grid */}
              <div>
                <h3 className="mb-3" style={{ fontFamily: 'var(--forge-font-family)' }}>Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={featureCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Dashboard</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      Personalized triage view with &ldquo;My Incidents,&rdquo; &ldquo;Needs Attention&rdquo; queue, KPI summary cards, trend charts, and unanswered communications count.
                    </p>
                  </div>

                  <div style={featureCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Incident Management</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      File, edit, filter, and track incidents on any of the five subjects, using 20 incident types. One form serves all five: the fields that do not apply to the subject are not shown. Records when the incident happened separately from when it was filed, and carries photo and document attachments plus a full audit history.
                    </p>
                  </div>

                  <div style={featureCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Students, Employees, and Locations</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      A page for each, showing incident history and the details behind it. Employees covers drivers and non-drivers alike, so an Employee incident can name an aide or a mechanic, and Locations covers depots, garages, and yards.
                    </p>
                  </div>

                  <div style={featureCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Driver Communications</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      Incident-linked messaging hub between coordinators and drivers with delivery tracking, acknowledgment status, and unread filters.
                    </p>
                  </div>

                  <div style={featureCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Vehicles and Fleet</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      Track vehicle assignments, maintenance status, default garage, and incident history. A Vehicle incident names the affected bus rather than a person.
                    </p>
                  </div>

                  <div style={featureCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Reports &amp; Analytics</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      4 pre-configured quick reports, Monthly Summary, Yearly Summary, High &amp; Critical Incidents, and Open Incidents Report. Click View Report to preview and download.
                    </p>
                  </div>

                  <div style={featureCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Notifications</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      Real-time alerts for new incidents, workflow step assignments, approval requests, and overdue items.
                    </p>
                  </div>

                  <div style={highlightCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Workflow System</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      12 delivered workflows containing 46 steps, selected automatically from incident type and severity. Every workflow names a required Incident Owner, so no incident is filed unassigned, and can name a specific person instead of a role. Manual step progression, approval gates, configurable email notifications, and a full audit trail.
                    </p>
                  </div>

                  <div style={highlightCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Administration</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      Manage user roles (7 types), 3 email notification templates with variable placeholders, and the 20 incident types with full CRUD operations.
                    </p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </ForgeCard>
        </TabsContent>

        {/* ═══════════════════  USER GUIDE  ═══════════════════ */}
        <TabsContent value="user-guide">
          <ForgeCard style={sectionCard}>
            <div style={{ padding: 'var(--forge-spacing-medium)' }}>
              <h3 className="forge-typography--heading4" style={{ fontFamily: 'var(--forge-font-family)' }}>Complete User Guide</h3>
              <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
              <Accordion type="single" collapsible className="w-full">

                {/* ─── Dashboard ─── */}
                <AccordionItem value="dashboard">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Dashboard</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Dashboard is your personalized command center, showing assigned incidents, a triage queue, unanswered driver messages, and analytics charts.
                    </p>
                    <div>
                      <h4 className="mb-2">Summary Statistics (KPI Cards)</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Critical Incidents:</strong> Count of incidents flagged as critical severity</li>
                        <li><strong>Open Incidents:</strong> Incidents currently open and in progress</li>
                        <li><strong>Students w/ Incidents:</strong> Distinct count of students with at least one incident</li>
                        <li><strong>Incidents This Week:</strong> Total incidents logged in the current week</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2">My Incidents Section</h4>
                      <p className="mb-2">
                        Shows incidents assigned to you. Each card displays who or what the incident is about, a priority badge, the incident type, the vehicle, the time, and a brief reason. Quick action buttons let you View the incident, send a Message, or Mark In Progress without leaving the dashboard.
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2">Charts</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Incidents by Subject:</strong> Pie chart splitting incidents across Student, Vehicle, Location, Third Party, and Employee</li>
                        <li><strong>Incidents by Type:</strong> Pie chart showing distribution across the 20 incident types</li>
                        <li><strong>Incidents by Driver:</strong> Horizontal bar chart of drivers by incident count</li>
                        <li><strong>Incidents by Day:</strong> Vertical bar chart showing incident volume by day of the week</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2">Active Incidents Table</h4>
                      <p>
                        Displays the most recent open incidents using the same columns as the Incidents page, including Subject. Click any row to navigate directly to the incident detail page.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Incidents ─── */}
                <AccordionItem value="incidents">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Incident Management</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Incidents page is the central hub for managing all incident records with powerful filtering, search, and pagination.
                    </p>

                    <div>
                      <h4 className="mb-2">Incident Types</h4>
                      <p className="mb-2">The system tracks <strong>20 incident types</strong>, and the list you are offered is filtered to the subject you chose, so a Vehicle incident only offers vehicle types:</p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Student (6):</strong> Disruptive Behavior, Safety Violation, Physical Altercation, Property Damage, Weapon / Prohibited Items, and Witness / Bystander Statement</li>
                        <li><strong>Employee (4):</strong> Employee Altercation, Employee Misconduct, Employee Injury, and Employee Substance Violation</li>
                        <li><strong>Third Party (4):</strong> Third Party Collision, Third Party Injury, Third Party Conduct, and Public Complaint</li>
                        <li><strong>Vehicle (3):</strong> Vehicle Damage, Mechanical Failure, and Single Vehicle Collision</li>
                        <li><strong>Location (3):</strong> Location Damage, Utility Failure, and Location Safety Hazard</li>
                      </ul>
                      <p className="mb-2" style={{ marginTop: 'var(--forge-spacing-small)' }}>
                        Every type sits in a category describing what happened rather than who was involved, which is what the list filters on and what reports group by. The subject carries the relationship.
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-2">Creating a New Incident</h4>
                      <p className="mb-2">Click <strong>&ldquo;+ New Incident&rdquo;</strong> on the Incidents page. Choose what the incident is about first, then fill out two steps:</p>
                      <ol className="ml-5 space-y-1">
                        <li><strong>Subject:</strong> Student, Vehicle, Location, Third Party or Employee. The subject determines which fields you are asked for.</li>
                        <li><strong>Step 1, Incident Details:</strong> The incident type, severity, description, when it happened, where, supporting photos and documents, and the people involved. Expand a person&rsquo;s row to record their role, severity, action taken and notes. Vehicle and Location incidents name an affected asset instead of people.</li>
                        <li><strong>Step 2, Review &amp; Submit:</strong> Check the details, then submit. <strong>One incident record is created.</strong> Each person named on it carries their own workflow, so the response can differ per person while the incident stays a single record. The workflow is assigned automatically from incident type and severity.</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="mb-2">Filtering &amp; Search</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Per-column filters:</strong> A filter sits under each column header and applies as you type or choose</li>
                        <li><strong>Involved:</strong> Who or what the incident is about, whether that is a student, an employee, a vehicle, or a location</li>
                        <li><strong>Subject:</strong> Student, Vehicle, Location, Third Party, or Employee</li>
                        <li><strong>Status:</strong> Open, In Progress, Closed, Cancelled</li>
                        <li><strong>Severity:</strong> Critical, High, Medium, Low</li>
                        <li><strong>Type:</strong> Any of the 20 incident types</li>
                        <li><strong>Assigned To:</strong> Filter by the person the incident is assigned to</li>
                        <li><strong>Year separation:</strong> Incidents are listed newest first with a break between years, so past years stay visible rather than being filtered out</li>
                        <li><strong>Pagination:</strong> Navigate through large result sets with page controls</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Incident Detail Page</h4>
                      <p className="mb-2">Click any incident row or ID to open the full detail page with these tabs:</p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Overview:</strong> Every field the form collected, including subject, type, severity, status, the term the incident falls in, when it happened and when it was reported, the people or the affected asset, and who it is assigned to. Fields that do not apply to the subject are not shown</li>
                        <li><strong>Workflow:</strong> Step-by-step progress with &ldquo;Complete this step&rdquo; buttons, role assignments, approval gates, and timestamps</li>
                        <li><strong>Communications:</strong> All messages related to this incident</li>
                        <li><strong>Photos:</strong> Photo evidence, with a count on the tab</li>
                        <li><strong>Documents:</strong> Attached documentation, with a count on the tab</li>
                        <li><strong>History:</strong> Full audit trail with chronological timeline of all activities</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Exporting Data</h4>
                      <p>
                        Click the <strong>&ldquo;Export&rdquo;</strong> dropdown for CSV or PDF export of filtered incident data.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Workflow System ─── */}
                <AccordionItem value="workflows">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Workflow System</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Workflow System provides structured, multi-step incident response processes. <strong>12 delivered workflows containing 46 steps</strong> cover all 20 incident types across the five subjects, and are automatically assigned when an incident is created.
                    </p>

                    <div>
                      <h4 className="mb-2">How Workflows Are Assigned</h4>
                      <p className="mb-2">
                        When an incident is created, the system matches a workflow on incident type plus severity, so every incident gets the correct process immediately. The workflow names a required <strong>Incident Owner</strong>, and the incident is assigned to whoever holds that role at the moment it is created, or to a specific person if the workflow names one. Because the owner is required, no incident is filed unassigned. The person filing can also choose a different assignee for that one incident.
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-2">Pre-Configured Workflows</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>WF-001 Disruptive Behavior Response</strong> &mdash; Disruptive Behavior, owned by School Principal</li>
                        <li><strong>WF-002 Physical Altercation Response</strong> &mdash; Physical Altercation, owned by School Principal</li>
                        <li><strong>WF-003 Prohibited Items Response</strong> &mdash; Weapon / Prohibited Items, owned by Administrator</li>
                        <li><strong>WF-004 Property Damage Investigation</strong> &mdash; Property Damage, owned by Administrator</li>
                        <li><strong>WF-005 Safety Violation Response</strong> &mdash; Safety Violation, owned by Safety Coordinator</li>
                        <li><strong>WF-006 Witness / Bystander Statement</strong> &mdash; Witness / Bystander Statement, owned by Safety Coordinator</li>
                        <li><strong>WF-007 Employee Conduct Review</strong> &mdash; Employee Altercation, Employee Misconduct, and Employee Substance Violation, owned by Administrator</li>
                        <li><strong>WF-008 Employee Injury Report</strong> &mdash; Employee Injury, owned by Nurse</li>
                        <li><strong>WF-009 Location Issue Response</strong> &mdash; Location Damage, Utility Failure, and Location Safety Hazard, owned by Administrator</li>
                        <li><strong>WF-010 Vehicle Damage and Mechanical Response</strong> &mdash; Vehicle Damage, Mechanical Failure, and Single Vehicle Collision, owned by Fleet Manager</li>
                        <li><strong>WF-011 Third Party Incident Response</strong> &mdash; Third Party Collision, Third Party Injury, and Third Party Conduct, owned by Safety Coordinator</li>
                        <li><strong>WF-012 Public Complaint Review</strong> &mdash; Public Complaint, owned by Safety Coordinator</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Workflow Step Progression</h4>
                      <p className="mb-2">
                        <strong>All step progression is manual.</strong> Users click &ldquo;Complete this step&rdquo; within the incident detail&rsquo;s Workflow tab &mdash; there are no automated triggers. Each step includes:
                      </p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Assigned Role:</strong> Who is responsible, one of the seven incident roles (Driver, Safety Coordinator, Administrator, Fleet Manager, Mechanic, School Principal, Nurse)</li>
                        <li><strong>Clear Instructions:</strong> Detailed description of what needs to be done</li>
                        <li><strong>Time Estimate:</strong> Expected completion timeframe</li>
                        <li><strong>Status Tracking:</strong> Not Started, In Progress, Completed, Pending Approval, Approved, Rejected</li>
                        <li><strong>Completion Record:</strong> Date, time, user, and detailed comments</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Step Configuration (Configure Step Modal)</h4>
                      <p className="mb-2">
                        When building or editing a workflow, click the gear icon on any step to open the three-tab configuration dialog:
                      </p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>General Tab:</strong> Step name, description, assigned role, estimated duration, and required/optional toggle</li>
                        <li><strong>Notifications Tab:</strong> Toggle notify-on-start, notify-on-complete, notify-assignee, and notify-approvers. Select an <strong>email template</strong> from the 3 system templates defined in Admin &rarr; Email Templates. Add additional recipient email addresses. Select roles to notify.</li>
                        <li><strong>Approvals Tab:</strong> Enable/disable approval requirement and select approver roles</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Creating a Custom Workflow</h4>
                      <ol className="ml-5 space-y-1">
                        <li>Navigate to the <strong>Workflows</strong> page</li>
                        <li>Click <strong>&ldquo;+ Create New Workflow&rdquo;</strong></li>
                        <li>Enter workflow name and description</li>
                        <li>Select a <strong>specific incident type</strong> from the 20 available types</li>
                        <li>Choose a severity level</li>
                        <li>Choose an <strong>Incident Owner</strong>. This is required, and the workflow cannot be saved without one. The resolved person is shown under the field, and you can name a specific person instead of a role</li>
                        <li>Add steps from the step library (8 templates across 3 categories: Notification, Review &amp; Action, Close Out) or create custom steps</li>
                        <li>Configure each step&rsquo;s notifications and approvals using the gear icon</li>
                        <li>Save as draft or activate immediately</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="mb-2">Workflow Notifications &amp; Email Templates</h4>
                      <p className="mb-2">
                        Each workflow step can be configured to send email notifications using one of the <strong>3 system email templates</strong>:
                      </p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Urgent Action Required</strong> &mdash; High-priority alerts for critical steps</li>
                        <li><strong>Approval Request</strong> &mdash; Sent to approvers when approval is needed</li>
                        <li><strong>Parent/Guardian Notification</strong> &mdash; Tailored for parent communication about student incidents</li>
                      </ul>
                      <p className="mt-2" style={{ fontStyle: 'italic', fontSize: 'var(--text-sm)' }}>
                        Templates are managed in Administration &rarr; Email Templates. Each template supports {`{{variable}}`} placeholders that are populated at send time.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Students ─── */}
                <AccordionItem value="students">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Student Profiles</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Students page provides a comprehensive view of all students with incident records, helping identify patterns and students needing support. It is one of four record pages, alongside Employees, Vehicles, and Locations, so every incident subject has something to point at.
                    </p>
                    <div>
                      <h4 className="mb-2">Student List View</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Student ID:</strong> Clickable unique identifier</li>
                        <li><strong>Name:</strong> Student&rsquo;s full name</li>
                        <li><strong>Grade Level:</strong> Current grade (K-12)</li>
                        <li><strong>School:</strong> Assigned school building</li>
                        <li><strong>Total Incidents:</strong> Count with trend indicator</li>
                        <li><strong>Last Incident:</strong> Date of most recent incident</li>
                        <li><strong>Status:</strong> Active or Inactive</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2">Filtering Students</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Search:</strong> By student name, ID, or school</li>
                        <li><strong>Grade Filter:</strong> Filter by specific grade levels</li>
                        <li><strong>School Filter:</strong> Filter by specific schools</li>
                        <li><strong>Active Incidents:</strong> Checkbox to show only students with open incidents</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2">Student Detail</h4>
                      <p>Click a student row to open their profile: name, grade, school, last incident date, and a chronological history of all incidents with severity badges and role chips.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Communications ─── */}
                <AccordionItem value="communications">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Driver Communications</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Communications page manages all incident-linked messaging between safety coordinators and bus drivers.
                    </p>
                    <div>
                      <h4 className="mb-2">Using the Chat Interface</h4>
                      <p className="mb-2">Select a conversation from the left sidebar to open the message thread. Type your message in the composition area at the bottom and click Send. New conversations are created automatically when a communication is initiated from an incident&rsquo;s Communications tab.</p>
                    </div>
                    <div>
                      <h4 className="mb-2">Search &amp; Filtering</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Search:</strong> By driver name, incident ID, or student name</li>
                        <li><strong>Status Filter:</strong> Unread, In Progress, Resolved</li>
                        <li><strong>Message status indicators:</strong> Sent, Delivered, Read per message</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Vehicles ─── */}
                <AccordionItem value="vehicles">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Fleet Management</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Vehicles page provides comprehensive fleet management with visual bus icons matching each vehicle&rsquo;s make and model, full pagination support, and clickable table rows.
                    </p>
                    <div>
                      <h4 className="mb-2">Vehicle List View</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Vehicle ID:</strong> Clickable unique identifier</li>
                        <li><strong>Details:</strong> Bus name, year, make, model</li>
                        <li><strong>Assigned Driver:</strong> Current assignment</li>
                        <li><strong>Status:</strong> Active, Inactive, or Maintenance</li>
                        <li><strong>Incidents:</strong> Count with trend indicator</li>
                        <li><strong>Mileage:</strong> Current odometer reading</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Drivers ─── */}
                <AccordionItem value="drivers">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Employees</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Employees page manages employee records, covering drivers and non-drivers alike. An Employee incident is often about an aide hurt on a wheelchair lift or a mechanic in a yard dispute, so the roster is not limited to drivers.
                    </p>
                    <div>
                      <h4 className="mb-2">Employee List View</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Employee ID:</strong> Clickable identifier</li>
                        <li><strong>Name:</strong> Employee&rsquo;s full name</li>
                        <li><strong>Job Role:</strong> What the person does day to day, which is separate from the incident role a workflow step is assigned to</li>
                        <li><strong>Contact and Email:</strong> How to reach them</li>
                        <li><strong>Status:</strong> Active or Inactive</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2">Certification Tracking</h4>
                      <ul className="ml-5 space-y-1">
                        <li>CDL expiration: 90-day warning (yellow), expired (red)</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Locations ─── */}
                <AccordionItem value="locations">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Locations</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Locations page lists the depots, garages, and yards a Location incident can be filed against, such as a burst pipe or a power loss. Location is the word Student Transportation already uses for these places, so the subject, its category, and its types all use it.
                    </p>
                    <div>
                      <h4 className="mb-2">Location List View</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Location ID:</strong> Clickable identifier</li>
                        <li><strong>Name:</strong> The depot, garage, or yard</li>
                        <li><strong>Type:</strong> What kind of place it is</li>
                        <li><strong>Status:</strong> Active or Inactive</li>
                        <li><strong>Incidents:</strong> Count of incidents filed against it</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2">Filing a Location Incident</h4>
                      <p>
                        A Location incident names no people. The affected location is what identifies the record, so it is required, and the Vehicle Number, Driver, and Run fields are not shown at all.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Reports ─── */}
                <AccordionItem value="reports">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Reports &amp; Analytics</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Reports page provides four pre-configured quick reports. Click <strong>View Report</strong> on any card to preview the data, then download it.
                    </p>
                    <div>
                      <h4 className="mb-2">Quick Reports</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Monthly Summary</strong>, Incident statistics and trends for the current month</li>
                        <li><strong>Yearly Summary</strong>, Annual incident totals broken down by school term (Fall, Spring, Summer)</li>
                        <li><strong>High &amp; Critical Incidents</strong>, All High and Critical severity incidents requiring immediate attention</li>
                        <li><strong>Open Incidents Report</strong>, All currently open incidents requiring action</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Administration ─── */}
                <AccordionItem value="admin">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Administration</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Admin page provides system configuration across three tabbed sections. Access requires the Administrator role.
                    </p>

                    <div>
                      <h4 className="mb-2">Incident Tracker Roles Tab</h4>
                      <p className="mb-2">Full CRUD management of system users and their role assignments:</p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>User Table:</strong> Name, Email, Roles, Status, Last Login</li>
                        <li><strong>Search &amp; Filter:</strong> Search by name/email; filter by role</li>
                        <li><strong>Actions:</strong> Add new user, edit user, delete user</li>
                        <li><strong>7 Roles:</strong> Driver, Safety Coordinator, Administrator, Fleet Manager, Mechanic, School Principal, Nurse</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Email Templates Tab</h4>
                      <p className="mb-2">Manage the 3 notification email templates used by workflow steps:</p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Templates:</strong> Urgent Action Required, Approval Request, Parent/Guardian Notification, displayed as expandable cards</li>
                        <li><strong>Variable Placeholders:</strong> Templates use {`{{variable_name}}`} syntax (e.g., {`{{recipient_name}}`}, {`{{incident_id}}`}, {`{{step_name}}`}) that are populated when emails are sent</li>
                        <li><strong>Actions per template:</strong> Edit, duplicate, preview, delete</li>
                        <li><strong>Workflow Integration:</strong> Templates selected here appear in the Configure Step &rarr; Notifications &rarr; Email Template dropdown when building workflows</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Incident Types Tab</h4>
                      <p className="mb-2">View and manage incident types:</p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Type Table:</strong> Label, Category, Default Severity, Linked Workflow, Description, Actions</li>
                        <li><strong>Search &amp; Filter:</strong> Search by name/description; filter by category</li>
                        <li><strong>Add/Edit Dialog:</strong> Configure label, category, description, and default severity</li>
                        <li><strong>Delete:</strong> Remove custom incident types (system defaults are protected)</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Notifications ─── */}
                <AccordionItem value="notifications">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Notifications</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The system provides real-time notifications for important events.
                    </p>
                    <div>
                      <h4 className="mb-2">Notification Types</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>New Incident Assigned:</strong> When an incident is assigned to you</li>
                        <li><strong>Workflow Step Assigned:</strong> When a workflow step is assigned to your role</li>
                        <li><strong>New Message:</strong> When a driver communication arrives</li>
                        <li><strong>Severity Escalated:</strong> When an incident severity is raised</li>
                        <li><strong>Workflow Step Completed:</strong> When a step you&rsquo;re tracking is finished</li>
                        <li><strong>Incident Unassigned:</strong> When an incident you own becomes unassigned</li>
                        <li><strong>Critical Incident Created:</strong> Immediate alert when a critical-severity incident is logged</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2">Accessing Notifications</h4>
                      <ul className="ml-5 space-y-1">
                        <li>Click the bell icon in the top-right header</li>
                        <li>Badge color indicates highest priority: red for critical/high, orange for medium, gray for low</li>
                        <li>Notifications are grouped by day (Today, Yesterday, or date)</li>
                        <li>Click any notification to navigate to the related record</li>
                        <li>Use &ldquo;Mark All as Read&rdquo; to clear the badge</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
              </div>
            </div>
          </ForgeCard>
        </TabsContent>

        {/* ═══════════════════  FAQ  ═══════════════════ */}
        <TabsContent value="faq">
          <ForgeCard style={sectionCard}>
            <div style={{ padding: 'var(--forge-spacing-medium)' }}>
              <h3 className="forge-typography--heading4" style={{ fontFamily: 'var(--forge-font-family)' }}>Frequently Asked Questions</h3>
              <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
              <Accordion type="single" collapsible className="w-full">

                {/* General */}
                <AccordionItem value="faq-1">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How do I change the status of an incident?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">To update an incident status:</p>
                    <ol className="ml-5 space-y-1">
                      <li>Click the incident row to open its detail page</li>
                      <li>Click the &ldquo;Edit&rdquo; button</li>
                      <li>Change the status dropdown (Open, In Progress, Closed, Cancelled)</li>
                      <li>Add notes about the change</li>
                      <li>Click &ldquo;Save Changes&rdquo;</li>
                    </ol>
                    <p className="mt-2">
                      <strong>Note:</strong> Status changes are logged in the History tab and create notifications for relevant users.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-subjects">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>Can I file an incident that does not involve a student?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">Yes. An incident is not always about a student, so the form asks what the incident is about before anything else. There are five subjects:</p>
                    <ul className="ml-5 space-y-1">
                      <li><strong>Student:</strong> One or more students involved</li>
                      <li><strong>Vehicle:</strong> Damage or breakdown with nobody aboard</li>
                      <li><strong>Location:</strong> A depot, garage, or yard problem such as a burst pipe or power loss</li>
                      <li><strong>Third Party:</strong> A motorist, parent, or member of the public</li>
                      <li><strong>Employee:</strong> Employees only, no students involved</li>
                    </ul>
                    <p className="mt-2">The subject determines which fields you are asked for. Vehicle and Location incidents name an affected asset instead of people, and a Location incident does not ask for a vehicle, driver, or run at all.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-subject-change">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>What happens if I pick the wrong subject and change it?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>Changing the subject clears only the answers that are specific to it: the incident type, the people involved, and the affected asset. The date, time, description, location, and any evidence you attached are kept. You are warned before it happens, so a mid-report switch is never a silent loss of what you already typed.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-dates">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>What is the difference between the incident date and the reported date?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">They are two separate values, and both appear on the incident.</p>
                    <ul className="ml-5 space-y-1">
                      <li><strong>Incident date and time:</strong> When the incident actually happened. Required. The date defaults to today and cannot be set in the future. The time is deliberately left blank rather than prefilled, so you enter what happened instead of accepting a clock value you never looked at</li>
                      <li><strong>Reported date and time:</strong> When the record was created. Set by the system and not editable</li>
                    </ul>
                    <p className="mt-2">This matters because an incident filed the next morning has to carry the date it happened, not the date it was filed.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-term">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How is the term determined, and can I see incidents from past terms?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">The term is derived from the incident date rather than being entered separately, and it is shown on the incident record.</p>
                    <p>Nothing is hidden by term. The Incidents page lists every incident newest first, with a break between years, so past years stay visible instead of being filtered out.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-assignee">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>Who is an incident assigned to when I file it?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">To the owner of the workflow that the incident type and severity matched. Every workflow names a required Incident Owner, so nothing is filed unassigned.</p>
                    <ul className="ml-5 space-y-1">
                      <li>The owner is a <strong>role</strong>, and the incident goes to whoever holds that role when it is created</li>
                      <li>A workflow can name <strong>a specific person</strong> instead, which overrides the role so the assignment does not follow a change of staff</li>
                      <li>On the form, <strong>Assigned To</strong> shows who that resolves to, for example &ldquo;Workflow default (Jane Doe)&rdquo;, and you can pick someone else for that one incident</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>What are the incident types?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">There are 20 incident types, grouped by the subject they apply to. The dropdown only offers the types that match the subject you chose, and every type carries a default severity that you can change:</p>
                    <ul className="ml-5 space-y-2">
                      <li><strong>Student:</strong> Disruptive Behavior, Safety Violation, Physical Altercation, Property Damage, Weapon / Prohibited Items, and Witness / Bystander Statement</li>
                      <li><strong>Employee:</strong> Employee Altercation, Employee Misconduct, Employee Injury, and Employee Substance Violation</li>
                      <li><strong>Third Party:</strong> Third Party Collision, Third Party Injury, Third Party Conduct, and Public Complaint</li>
                      <li><strong>Vehicle:</strong> Vehicle Damage, Mechanical Failure, and Single Vehicle Collision</li>
                      <li><strong>Location:</strong> Location Damage, Utility Failure, and Location Safety Hazard</li>
                    </ul>
                    <p className="mt-2">Each type sits in one of 10 categories describing what happened rather than who was involved, so a district asking how many collisions it had gets one number regardless of who was in them.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>What are the incident status values?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <ul className="ml-5 space-y-1">
                      <li><strong>Open:</strong> Newly created, awaiting action.</li>
                      <li><strong>In Progress:</strong> Actively being worked, workflow steps are underway.</li>
                      <li><strong>Closed:</strong> Fully resolved with no further action needed. Still searchable for historical analysis.</li>
                      <li><strong>Cancelled:</strong> Incident was voided or entered in error.</li>
                    </ul>
                    <p className="mt-2">Typical flow: Open &rarr; In Progress &rarr; Closed</p>
                  </AccordionContent>
                </AccordionItem>

                {/* Workflows */}
                <AccordionItem value="faq-4">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>What is a workflow and how does it help me?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">
                      A workflow is a structured, step-by-step process that guides you through incident response according to district policies. Instead of remembering all the steps manually, the workflow:
                    </p>
                    <ul className="ml-5 space-y-1">
                      <li>Automatically assigns the right process based on incident type and severity</li>
                      <li>Tells you exactly what to do at each step with clear instructions</li>
                      <li>Assigns responsibility to specific roles</li>
                      <li>Enforces approval gates for critical decisions</li>
                      <li>Records completion timestamps and comments for full accountability</li>
                      <li>Sends email notifications using configurable templates</li>
                      <li>Provides a complete audit trail for compliance</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How are workflows assigned to incidents?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">When an incident is created, the system matches a workflow on <strong>incident type plus severity</strong>. The 12 delivered workflows cover all 20 types, so every incident is guaranteed a matching workflow automatically, and the workflow&rsquo;s required Incident Owner determines who it is assigned to. You can see both on the incident detail page&rsquo;s Overview and Workflow tabs.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-6">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How do I complete a workflow step?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <ol className="ml-5 space-y-1">
                      <li>Open the incident&rsquo;s detail page and go to the <strong>Workflow</strong> tab</li>
                      <li>Find the current step (highlighted as &ldquo;In Progress&rdquo; or your assigned step)</li>
                      <li>Click <strong>&ldquo;Complete this step&rdquo;</strong></li>
                      <li>Enter completion comments describing actions taken, outcomes, and relevant details</li>
                      <li>If the step requires approval, it enters &ldquo;Pending Approval&rdquo; status</li>
                      <li>The system records your name, date/time, and comments</li>
                    </ol>
                    <p className="mt-2">
                      <strong>Important:</strong> All step progression is manual. There are no automated triggers &mdash; you must click &ldquo;Complete this step&rdquo; to advance.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-7">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>What happens when a step requires approval?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <ol className="ml-5 space-y-1">
                      <li>Assigned user completes the step with comments</li>
                      <li>Step changes to <strong>&ldquo;Pending Approval&rdquo;</strong></li>
                      <li>Approval request notification sent to designated approvers (using the Approval Request email template)</li>
                      <li>Workflow pauses until approval is granted</li>
                      <li>Approver can <strong>Approve</strong> (workflow continues) or <strong>Reject</strong> (step returns for revision)</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-8">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>Can I create a custom workflow for my district?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">Yes! Navigate to the Workflows page and click &ldquo;+ Create New Workflow&rdquo;:</p>
                    <ol className="ml-5 space-y-1">
                      <li>Enter name and description</li>
                      <li>Select an incident type for the chosen subject</li>
                      <li>Choose a severity level</li>
                      <li>Add steps from the step library (8 templates across 3 categories: Notification, Review &amp; Action, Close Out) or create custom steps</li>
                      <li>Configure email notifications per step (using the 3 Admin email templates)</li>
                      <li>Save and activate</li>
                    </ol>
                    <p className="mt-2">
                      <strong>Tip:</strong> Duplicate an existing workflow as a starting point &mdash; it&rsquo;s faster than building from scratch.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Admin */}
                <AccordionItem value="faq-9">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How do I manage email templates?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">Go to <strong>Admin &rarr; Email Templates</strong> tab:</p>
                    <ul className="ml-5 space-y-1">
                      <li>The system includes <strong>3 templates</strong>: Urgent Action Required, Approval Request, and Parent/Guardian Notification</li>
                      <li>Click any template card to expand and edit its subject, body, and variable placeholders</li>
                      <li>Use <strong>&ldquo;Duplicate&rdquo;</strong> to create a copy of an existing template for customization</li>
                      <li>Click <strong>&ldquo;Preview&rdquo;</strong> to see how the template looks with sample data</li>
                      <li>Templates use {`{{variable_name}}`} placeholders (e.g., {`{{recipient_name}}`}, {`{{incident_id}}`}) that are automatically replaced when emails are sent</li>
                    </ul>
                    <p className="mt-2">
                      Templates are immediately available in the Configure Step &rarr; Notifications &rarr; Email Template dropdown when building workflows.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-10">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How do I add or edit incident types?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">Go to <strong>Admin &rarr; Incident Types</strong> tab:</p>
                    <ul className="ml-5 space-y-1">
                      <li>Click <strong>&ldquo;+ Add Incident Type&rdquo;</strong> to create a new type</li>
                      <li>Set the label, category, description, and default severity</li>
                      <li>Edit existing types by clicking the edit icon on any row</li>
                      <li>Delete custom types (system defaults are protected)</li>
                      <li>Use the search field or category filter to find specific types</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-11">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How do I manage user roles?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">Go to <strong>Admin &rarr; Incident Tracker Roles</strong> tab:</p>
                    <ul className="ml-5 space-y-1">
                      <li>View all users with their assigned roles, status, and last login</li>
                      <li>Click <strong>&ldquo;+ Add User&rdquo;</strong> to create a new user record</li>
                      <li>Assign one or more of the 7 roles: Driver, Safety Coordinator, Administrator, Fleet Manager, Mechanic, School Principal, Nurse</li>
                      <li>Edit user details or toggle Active/Inactive status</li>
                      <li>Search by name/email and filter by role</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Communications */}
                <AccordionItem value="faq-12">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How do I know if a driver has read my communication?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <ul className="ml-5 space-y-1">
                      <li>Each message shows a status indicator: <strong>Sent</strong>, <strong>Delivered</strong>, or <strong>Read</strong></li>
                      <li>Use the <strong>Unread</strong> filter in the left sidebar to surface conversations with unread messages</li>
                      <li>Conversations are also filterable by <strong>In Progress</strong> or <strong>Resolved</strong> status</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                {/* Data & Export */}
                <AccordionItem value="faq-13">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>Can I export data for use in other systems?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <ul className="ml-5 space-y-1">
                      <li><strong>CSV Export:</strong> Available on the Incidents, Students, Employees, Vehicles, and Locations pages via the Export dropdown</li>
                      <li><strong>PDF Reports:</strong> Generate and download one of the 4 pre-configured reports from the Reports page</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-14">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How do I specify where the incident occurred?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">Two things record where it happened, and they answer different questions.</p>
                    <p className="mb-2"><strong>Location Type</strong> says what kind of place it was, chosen from 12 options: At Vehicle Stop, Fuel Station, Garage, Layover Location, Loading/Unloading, Maintenance Bay, On Vehicle, Parking Lot, School Campus, Wash Bay, Yard, and Other.</p>
                    <p className="mb-2"><strong>Incident Location Pin</strong> records the actual spot on a map, set from your current location, by clicking the map, or by searching an address.</p>
                    <p className="mt-2">For a Vehicle or Location incident, the affected asset is separate and required, because with no people named it is the only thing identifying the record. Vehicle Number, Driver, and Run are optional where they apply, and are not shown where they do not.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-15">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>Who has access to view incident data?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">Access is role-based, managed in Admin &rarr; User Roles:</p>
                    <ul className="ml-5 space-y-1">
                      <li><strong>Safety Coordinators:</strong> Full CRUD on assigned incidents, messaging, reports</li>
                      <li><strong>Administrators:</strong> Complete system access including Admin configuration and workflow builder</li>
                      <li><strong>School Principals:</strong> View and participate in incidents involving their students</li>
                      <li><strong>Drivers:</strong> View incidents involving their bus, receive communications</li>
                      <li><strong>Fleet Managers:</strong> Own Vehicle incidents, assess damage, and schedule repairs</li>
                      <li><strong>Nurses:</strong> Provide medical assessment and first aid, and own the Employee Injury workflow</li>
                      <li><strong>Mechanics:</strong> Handle repair-related workflow steps</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-16">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>Where can I see the complete audit trail for an incident?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">The <strong>History tab</strong> on the incident detail page provides a complete audit trail:</p>
                    <ul className="ml-5 space-y-1">
                      <li>Chronological timeline of all activities</li>
                      <li>Workflow steps showing &ldquo;Completed by [User] on [date]&rdquo; with comments</li>
                      <li>Status changes, workflow assignments, and approval events</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
              </div>
            </div>
          </ForgeCard>
        </TabsContent>
      </Tabs>

      {/* Support Contact Card */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-2)', marginTop: 'var(--forge-spacing-large)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }}>
          <h3 className="forge-typography--heading4" style={{ fontFamily: 'var(--forge-font-family)' }}>Need Additional Help?</h3>
          <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
            <p className="text-foreground mb-4" style={{ fontFamily: 'var(--forge-font-family)' }}>
              If you can&rsquo;t find the answer in this documentation, please contact your system administrator
              or the Transportation Technology team.
            </p>
          </div>
        </div>
      </ForgeCard>
    </div>
  );
}
