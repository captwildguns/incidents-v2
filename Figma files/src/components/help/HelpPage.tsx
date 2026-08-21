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
                  The Incident Tracker is an application designed for Student Transportation departments to capture, manage, and communicate about incidents that occur during daily operations. The Tyler Tech Incident Tracker is integrated into Student Transportation to leverage student, vehicle, and driver data. The application helps safety coordinators, supervisors, and administrators track student behavioral incidents across 5 types, manage multi-step workflows, communicate with drivers, administer email templates and user roles, and generate reports for analysis and compliance.
                </p>
              </div>

              {/* Navigation */}
              <div>
                <h3 className="mb-3" style={{ fontFamily: 'var(--forge-font-family)' }}>Navigation</h3>
                <p className="text-foreground leading-relaxed" style={{ marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)' }}>
                  The application uses Tyler Forge navigation patterns:
                </p>
                <ul className="space-y-2 ml-5 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                  <li><strong>Hamburger Menu:</strong> Click the menu icon in the top-left to open the slide-out navigation panel with your profile and all application areas</li>
                  <li><strong>Top Navigation Tabs:</strong> Quick access to Dashboard, Incidents, Students, Drivers, Vehicles, Communications, Reports, Workflows, and Admin</li>
                  <li><strong>Help Icon (?):</strong> Located in the top-right app bar, click to access this Help &amp; Support page</li>
                  <li><strong>Profile Menu:</strong> Click the avatar in the top-right to log out</li>
                  <li><strong>Global Search:</strong> Search bar in the top-center of the app bar for quick access to incidents, students, drivers, vehicles, and communications</li>
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
                  <li><strong>Fleet Manager</strong> &mdash; Manages vehicle incidents, repairs, and fleet maintenance workflows</li>
                  <li><strong>Nurse</strong> &mdash; Provides victim support and medical assessments in behavioral incident workflows</li>
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
                      Create, edit, filter, and track student incidents across 5 types: Disruptive Behavior, Safety Violation, Physical Altercation, Property Damage, and Weapon / Prohibited Items. Includes visual bus seat selection, photo/document attachments, and full audit history.
                    </p>
                  </div>

                  <div style={featureCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Student Profiles</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      View student incident history, pattern analysis, and transportation details to support behavioral interventions.
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
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Driver Management</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      Track driver assignments, certifications, incident history, safety ratings, and performance scores.
                    </p>
                  </div>

                  <div style={featureCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Reports &amp; Analytics</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      4 pre-configured quick reports — Monthly Summary, Yearly Summary, High &amp; Critical Incidents, and Open Incidents Report. Click View Report to preview and download.
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
                      5 pre-configured workflows — one per incident type — with auto-assignment, manual step progression, role-based assignments, approval gates, configurable email notifications, and full audit trail.
                    </p>
                  </div>

                  <div style={highlightCard}>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h4 className="m-0" style={{ fontFamily: 'var(--forge-font-family)' }}>Administration</h4>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                      Manage user roles (7 types), 3 email notification templates with variable placeholders, and incident types with full CRUD operations.
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
                        Shows incidents assigned to you. Each card displays the student name, priority badge, incident type, vehicle, time, and a brief reason. Quick action buttons let you View the incident, send a Message, or Mark In Progress without leaving the dashboard.
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2">Charts</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Incidents by Type:</strong> Pie chart showing distribution across the student incident types</li>
                        <li><strong>Incidents by Vehicle:</strong> Horizontal bar chart of the top 6 buses by incident count</li>
                        <li><strong>Incidents by Day:</strong> Vertical bar chart showing incident volume by day of the week</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2">Active Incidents Table</h4>
                      <p>
                        Displays the most recent open incidents. Click any row to navigate directly to the incident detail page.
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
                      <p className="mb-2">The system tracks <strong>5 student incident types:</strong></p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Disruptive Behavior:</strong> Offensive language, excessive noise, harassment, bullying, refusal of driver directives, or any disruptive conduct on the bus</li>
                        <li><strong>Safety Violation:</strong> Seat or seatbelt refusal, unsafe movement, window misuse, emergency exit misuse, wrong stop exit, or eating/drinking on the bus</li>
                        <li><strong>Physical Altercation:</strong> Fighting, physical assault, throwing objects, or verbal/physical threats directed toward another student or any person on the bus</li>
                        <li><strong>Property Damage:</strong> Vandalism or damage to the bus, equipment, or personal belongings requiring restitution</li>
                        <li><strong>Weapon / Prohibited Items:</strong> Possession of a weapon, weapon-like object, tobacco, vaping devices, illegal substances, or any other prohibited materials on the bus</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Creating a New Incident</h4>
                      <p className="mb-2">Click <strong>&ldquo;+ New Incident&rdquo;</strong> on the Incidents page to open the 4-step wizard:</p>
                      <ol className="ml-5 space-y-1">
                        <li><strong>Step 1 — Involved Students:</strong> Search for and add all students involved. A linked incident record will be created for each student.</li>
                        <li><strong>Step 2 — Incident Details:</strong> Enter the shared details that apply to all students — incident type (one of 5), severity, description, location, and any supporting documents.</li>
                        <li><strong>Step 3 — Per-Student Details:</strong> Customize details for each individual student, including their role, specific actions taken, and notes.</li>
                        <li><strong>Step 4 — Review &amp; Submit:</strong> Review all entered information, then click <strong>&ldquo;Submit&rdquo;</strong> to create the incident records. The system automatically assigns the matching workflow based on incident type.</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="mb-2">Filtering &amp; Search</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Search:</strong> By student name, vehicle, or run</li>
                        <li><strong>Status:</strong> Open, In Progress, Closed, Cancelled</li>
                        <li><strong>Severity:</strong> Critical, High, Medium, Low</li>
                        <li><strong>Type:</strong> Any incident type</li>
                        <li><strong>Assigned To:</strong> Filter by coordinator</li>
                        <li><strong>Pagination:</strong> Navigate through large result sets with page controls</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Incident Detail Page</h4>
                      <p className="mb-2">Click any incident row or ID to open the full detail page with these tabs:</p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Overview:</strong> Complete incident info, student profile, severity, assigned coordinator, and workflow status widget</li>
                        <li><strong>Workflow:</strong> Step-by-step progress with &ldquo;Complete this step&rdquo; buttons, role assignments, approval gates, and timestamps</li>
                        <li><strong>Communications:</strong> All messages related to this incident</li>
                        <li><strong>Documents:</strong> Attached evidence and documentation</li>
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
                      The Workflow System provides structured, multi-step incident response processes. <strong>5 pre-configured workflows</strong> cover all student incident types — one per type — and are automatically assigned when an incident is created.
                    </p>

                    <div>
                      <h4 className="mb-2">How Workflows Are Assigned</h4>
                      <p className="mb-2">
                        When an incident is created, the system automatically matches the workflow to the incident type. Severity is used as a secondary signal but the primary match is always by incident type — ensuring every student incident gets the correct process immediately.
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-2">Pre-Configured Workflows</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>WF-001 Disruptive Behavior Response</strong> &mdash; Disruptive Behavior</li>
                        <li><strong>WF-002 Physical Altercation Response</strong> &mdash; Physical Altercation</li>
                        <li><strong>WF-003 Prohibited Items Response</strong> &mdash; Weapon / Prohibited Items</li>
                        <li><strong>WF-004 Property Damage Investigation</strong> &mdash; Property Damage</li>
                        <li><strong>WF-005 Safety Violation Response</strong> &mdash; Safety Violation</li>
                        <li><strong>WF-006 Witness / Bystander Statement</strong> &mdash; Witness / Bystander Statement</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2">Workflow Step Progression</h4>
                      <p className="mb-2">
                        <strong>All step progression is manual.</strong> Users click &ldquo;Complete this step&rdquo; within the incident detail&rsquo;s Workflow tab &mdash; there are no automated triggers. Each step includes:
                      </p>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Assigned Role:</strong> Who is responsible (Driver, Safety Coordinator, Administrator, School Principal, Fleet Manager, Nurse)</li>
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
                        <li>Select a <strong>specific incident type</strong> from the 5 available types</li>
                        <li>Choose a severity level</li>
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
                      The Students page provides a comprehensive view of all students with incident records, helping identify patterns and students needing support.
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
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>Driver Management</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p>
                      The Drivers page manages driver records, certifications, performance tracking, and safety ratings.
                    </p>
                    <div>
                      <h4 className="mb-2">Driver List View</h4>
                      <ul className="ml-5 space-y-1">
                        <li><strong>Driver ID:</strong> Clickable identifier</li>
                        <li><strong>Name, Status, Vehicle, Incidents, Communications</strong></li>
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
                        <li><strong>Monthly Summary</strong> — Incident statistics and trends for the current month</li>
                        <li><strong>Yearly Summary</strong> — Annual incident totals broken down by school term (Fall, Spring, Summer)</li>
                        <li><strong>High &amp; Critical Incidents</strong> — All High and Critical severity incidents requiring immediate attention</li>
                        <li><strong>Open Incidents Report</strong> — All currently open incidents requiring action</li>
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
                        <li><strong>Templates:</strong> Urgent Action Required, Approval Request, Parent/Guardian Notification — displayed as expandable cards</li>
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

                <AccordionItem value="faq-2">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>What are the incident types?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">The system tracks 5 student behavioral incident types. Each type has a dedicated workflow automatically assigned on creation:</p>
                    <ul className="ml-5 space-y-2">
                      <li><strong>Disruptive Behavior:</strong> Offensive language, excessive noise, harassment, bullying, refusal of driver directives, or any disruptive conduct on the bus</li>
                      <li><strong>Safety Violation:</strong> Seat or seatbelt refusal, unsafe movement, window misuse, emergency exit misuse, wrong stop exit, or eating/drinking on the bus</li>
                      <li><strong>Physical Altercation:</strong> Fighting, hitting, pushing, or any physical contact between students or toward the driver</li>
                      <li><strong>Property Damage:</strong> Vandalism or damage to the bus, another student&rsquo;s belongings, or district property</li>
                      <li><strong>Weapon / Prohibited Items:</strong> Possession of weapons, dangerous objects, or prohibited substances on the bus</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>What are the incident status values?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <ul className="ml-5 space-y-1">
                      <li><strong>Open:</strong> Newly created, awaiting action.</li>
                      <li><strong>In Progress:</strong> Actively being worked — workflow steps are underway.</li>
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
                      <li>Automatically assigns the right process based on incident type</li>
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
                    <p className="mb-2">When an incident is created, the system matches the workflow to the <strong>incident type</strong>. Since there is one workflow per student incident type, every student incident is guaranteed a matching workflow automatically. You can see the assigned workflow on the incident detail page&rsquo;s Overview and Workflow tabs.</p>
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
                      <li><strong>CSV Export:</strong> Available on Incidents, Students, Vehicles, and Drivers pages via the Export dropdown</li>
                      <li><strong>PDF Reports:</strong> Generate and download one of the 4 pre-configured reports from the Reports page</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-14">
                  <AccordionTrigger style={{ fontFamily: 'var(--forge-font-family)' }}>How do I specify where the incident occurred?</AccordionTrigger>
                  <AccordionContent className="text-foreground" style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <p className="mb-2">In Step 2 of the new incident form, select from the <strong>Location</strong> dropdown:</p>
                    <ul className="ml-5 space-y-1">
                      <li><strong>On Vehicle</strong> — incident occurred while riding the bus</li>
                      <li><strong>At Vehicle Stop</strong> — incident at a bus stop</li>
                      <li><strong>Loading/Unloading</strong> — incident during boarding or exit</li>
                      <li><strong>Layover Location</strong> — incident at a staging or layover area</li>
                      <li><strong>Other</strong> — any other location</li>
                    </ul>
                    <p className="mt-2">You can also optionally select the vehicle and run associated with the incident.</p>
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
                      <li><strong>Fleet Managers:</strong> Manage vehicle incidents and maintenance workflows</li>
                      <li><strong>Nurses:</strong> Participate in behavioral/medical assessment workflow steps</li>
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
