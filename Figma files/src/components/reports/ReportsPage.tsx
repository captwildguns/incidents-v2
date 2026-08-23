import { useState, useRef, useEffect } from 'react';
import { ForgeCard, ForgeButton, useForgeToast } from '@tylertech/forge-react';
import {
  defineCardComponent,
  defineButtonComponent,
  defineDialogComponent,
  defineBadgeComponent,
  defineIconComponent,
} from '@tylertech/forge';
defineCardComponent();
defineButtonComponent();
defineDialogComponent();
defineBadgeComponent();
defineIconComponent();
import { INCIDENT_TYPES } from '../incidents/IncidentTypes';
// Note: this file declares its own local `mockIncidents` below, shadowing the
// shared one. Only the label helper is imported here.
import { getIncidentSubjectLabel } from '../incidents/IncidentsPage';

const quickReports = [
  {
    id: 'monthly-summary',
    title: 'Monthly Summary',
    description: 'Incident statistics and trends for the current month',
    icon: 'calendar_today',
    color: '#3b82f6',
    lastRun: '1 day ago',
  },
  {
    id: 'yearly-summary',
    title: 'Yearly Summary',
    description: 'Annual incident trends and totals broken down by school term (Fall, Spring, Summer)',
    icon: 'date_range',
    color: '#7c3aed',
    lastRun: '1 week ago',
  },
  {
    id: 'high-critical-severity',
    title: 'High & Critical Incidents',
    description: 'All High and Critical severity incidents requiring immediate or escalated attention',
    icon: 'warning',
    color: '#ef4444',
    lastRun: '2 days ago',
  },
  {
    id: 'open-incidents',
    title: 'Open Incidents Report',
    description: 'All currently open incidents requiring action',
    icon: 'description',
    color: '#06b6d4',
    lastRun: '1 day ago',
  },
];

// Get filtered data for a specific quick report type
function getReportData(reportId: string) {
  switch (reportId) {
    case 'monthly-summary':
      // Past 30 days from today (2026-05-12)
      return mockIncidents.filter(inc => inc.date >= '2026-04-12').sort((a, b) => b.date.localeCompare(a.date));
    case 'yearly-summary':
      // Current school year: Sept 1 2025, today
      return mockIncidents.filter(inc => inc.date >= '2025-09-01').sort((a, b) => b.date.localeCompare(a.date));
    case 'high-critical-severity':
      return mockIncidents.filter(inc => inc.severity === 'High' || inc.severity === 'Critical').sort((a, b) => b.date.localeCompare(a.date));
    case 'open-incidents':
      return mockIncidents.filter(inc => inc.status === 'Open' || inc.status === 'In Progress').sort((a, b) => b.date.localeCompare(a.date));
    default:
      return mockIncidents.sort((a, b) => b.date.localeCompare(a.date));
  }
}

interface ReportsPageProps {
  onNavigate: (page: string) => void;
}

// Mock incident data for preview, dates span school year 2025-2026 and include current month (May 2026)
const mockIncidents = [
  // ── May 2026 (current month) ──
  {
    id: 'INC-2026-0063',
    date: '2026-05-08',
    student: 'Marcus Johnson',
    studentId: 'STU-3421',
    type: 'Physical Altercation',
    description: 'Student involved in physical altercation with another student near the back of the bus',
    vehicle: 'Vehicle 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'High',
    status: 'Open',
  },
  {
    id: 'INC-2026-0062',
    date: '2026-05-05',
    student: 'Emma Rodriguez',
    studentId: 'STU-1956',
    type: 'Safety Violation',
    description: 'Student repeatedly refused to remain seated and was disruptive to the driver',
    vehicle: 'Vehicle 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Medium',
    status: 'Open',
  },
  // ── April 2026 ──
  {
    id: 'INC-2026-0061',
    date: '2026-04-28',
    student: 'Sarah Mitchell',
    studentId: 'STU-2891',
    type: 'Disruptive Behavior',
    description: 'Ongoing verbal harassment of a younger student on the same route',
    vehicle: 'Vehicle 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Robert Martinez',
    severity: 'High',
    status: 'In Progress',
  },
  {
    id: 'INC-2026-0060',
    date: '2026-04-22',
    student: 'Noah Wilson',
    studentId: 'STU-6891',
    type: 'Weapon / Prohibited Items',
    description: 'Student found in possession of a pocket knife during boarding check',
    vehicle: 'Vehicle 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Critical',
    status: 'Open',
  },
  {
    id: 'INC-2026-0059',
    date: '2026-04-17',
    student: 'James Thompson',
    studentId: 'STU-4782',
    type: 'Disruptive Behavior',
    description: 'Directed profane language at the driver after a route change announcement',
    vehicle: 'Vehicle 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'Medium',
    status: 'Closed',
  },
  {
    id: 'INC-2026-0058',
    date: '2026-04-14',
    student: 'Olivia Davis',
    studentId: 'STU-5623',
    type: 'Safety Violation',
    description: 'Student attempted to open emergency exit while bus was in motion',
    vehicle: 'Vehicle 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'High',
    status: 'Closed',
  },
  // ── March 2026 ──
  {
    id: 'INC-2026-0057',
    date: '2026-03-20',
    student: 'Liam Brown',
    studentId: 'STU-8512',
    type: 'Property Damage',
    description: 'Student carved initials into seat back with a pen during the afternoon route',
    vehicle: 'Vehicle 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Robert Martinez',
    severity: 'Medium',
    status: 'Closed',
  },
  {
    id: 'INC-2026-0056',
    date: '2026-03-12',
    student: 'Ava Martinez',
    studentId: 'STU-9123',
    type: 'Physical Altercation',
    description: 'Student made verbal threats toward another student and refused to de-escalate',
    vehicle: 'Vehicle 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'High',
    status: 'Closed',
  },
  // ── February 2026 ──
  {
    id: 'INC-2026-0055',
    date: '2026-02-24',
    student: 'Ethan Lee',
    studentId: 'STU-1045',
    type: 'Weapon / Prohibited Items',
    description: 'Student found vaping in the rear of the bus; device confiscated',
    vehicle: 'Vehicle 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'High',
    status: 'Closed',
  },
  {
    id: 'INC-2026-0054',
    date: '2026-02-11',
    student: 'Sophia Garcia',
    studentId: 'STU-7234',
    type: 'Disruptive Behavior',
    description: 'Playing music at high volume from a portable speaker, ignoring driver warnings',
    vehicle: 'Vehicle 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Low',
    status: 'Closed',
  },
  // ── January 2026 ──
  {
    id: 'INC-2026-0053',
    date: '2026-01-30',
    student: 'Isabella White',
    studentId: 'STU-2387',
    type: 'Physical Altercation',
    description: 'Fight between two students resulting in minor injury; parents notified',
    vehicle: 'Vehicle 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Robert Martinez',
    severity: 'High',
    status: 'Closed',
  },
  {
    id: 'INC-2026-0052',
    date: '2026-01-15',
    student: 'Mason Taylor',
    studentId: 'STU-3498',
    type: 'Safety Violation',
    description: 'Student hanging arm out of window and throwing items at passing vehicles',
    vehicle: 'Vehicle 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'High',
    status: 'Closed',
  },
  // ── December 2025 ──
  {
    id: 'INC-2025-0051',
    date: '2025-12-18',
    student: 'Charlotte Anderson',
    studentId: 'STU-4561',
    type: 'Safety Violation',
    description: 'Refused assigned seat on multiple occasions during the last week of the term',
    vehicle: 'Vehicle 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'Medium',
    status: 'Closed',
  },
  {
    id: 'INC-2025-0050',
    date: '2025-12-05',
    student: 'Aiden Thomas',
    studentId: 'STU-5672',
    type: 'Disruptive Behavior',
    description: 'Used offensive and discriminatory language directed at another student',
    vehicle: 'Vehicle 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Medium',
    status: 'Closed',
  },
  // ── November 2025 ──
  {
    id: 'INC-2025-0049',
    date: '2025-11-19',
    student: 'Mia Jackson',
    studentId: 'STU-6783',
    type: 'Disruptive Behavior',
    description: 'Repeated bullying of same student over multiple weeks; escalated to administration',
    vehicle: 'Vehicle 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Robert Martinez',
    severity: 'High',
    status: 'Closed',
  },
  {
    id: 'INC-2025-0048',
    date: '2025-11-07',
    student: 'Lucas Harris',
    studentId: 'STU-7894',
    type: 'Property Damage',
    description: 'Multiple seat cushions slashed with a sharp object',
    vehicle: 'Vehicle 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Medium',
    status: 'Closed',
  },
  // ── October 2025 ──
  {
    id: 'INC-2025-0047',
    date: '2025-10-22',
    student: 'Harper Clark',
    studentId: 'STU-8905',
    type: 'Physical Altercation',
    description: 'Physical confrontation between students escalated; bus pulled over to resolve',
    vehicle: 'Vehicle 15',
    route: 'Jefferson Middle AM - Blue',
    driver: 'David Park',
    severity: 'High',
    status: 'Closed',
  },
  {
    id: 'INC-2025-0046',
    date: '2025-10-09',
    student: 'Benjamin Lewis',
    studentId: 'STU-9016',
    type: 'Safety Violation',
    description: 'Spilled energy drink causing a slip hazard in the aisle',
    vehicle: 'Vehicle 12',
    route: 'Meyers Middle AM - Yellow',
    driver: 'John Chen',
    severity: 'Low',
    status: 'Closed',
  },
  // ── September 2025 ──
  {
    id: 'INC-2025-0045',
    date: '2025-09-25',
    student: 'Amelia Robinson',
    studentId: 'STU-1127',
    type: 'Disruptive Behavior',
    description: 'Refused all driver instructions and used aggressive language throughout the route',
    vehicle: 'Vehicle 9',
    route: 'Lincoln Elementary AM - Green',
    driver: 'Robert Martinez',
    severity: 'High',
    status: 'Closed',
  },
  {
    id: 'INC-2025-0044',
    date: '2025-09-10',
    student: 'Henry Walker',
    studentId: 'STU-2238',
    type: 'Safety Violation',
    description: 'First week of school - student repeatedly changed seats and stood in aisle',
    vehicle: 'Vehicle 8',
    route: 'Washington High PM - Wolf Rd',
    driver: 'Lisa Anderson',
    severity: 'Low',
    status: 'Closed',
  },
];

export function ReportsPage({ onNavigate }: ReportsPageProps) {
  const toastHelper = useForgeToast();
  const [selectedDateRange, setSelectedDateRange] = useState('this-month');
  const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<string[]>([]);
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<typeof quickReports[0] | null>(null);

  const previewDialogRef = useRef<HTMLElement>(null);

  // Sync preview dialog open state to forge-dialog
  useEffect(() => {
    const el = previewDialogRef.current as any;
    if (!el) return;
    el.open = isPreviewOpen;
  }, [isPreviewOpen]);

  useEffect(() => {
    const el = previewDialogRef.current as any;
    if (!el) return;
    const handler = () => setIsPreviewOpen(false);
    el.addEventListener('forge-dialog-close', handler);
    return () => el.removeEventListener('forge-dialog-close', handler);
  }, []);

  const incidentTypes = INCIDENT_TYPES.map((type) => type.label);

  const vehicleRuns = [
    'Meyers Middle AM - Yellow', 
    'Washington High PM - Wolf Rd', 
    'Jefferson Middle AM - Blue', 
    'Roosevelt High PM - Red', 
    'Lincoln Elementary AM - Green', 
    'Colonie High AM - Purple'
  ];

  const toggleIncidentType = (type: string) => {
    setSelectedIncidentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAllIncidentTypes = () => {
    if (selectedIncidentTypes.length === incidentTypes.length) {
      setSelectedIncidentTypes([]);
    } else {
      setSelectedIncidentTypes([...incidentTypes]);
    }
  };

  const toggleRun = (run: string) => {
    setSelectedRuns((prev) =>
      prev.includes(run) ? prev.filter((r) => r !== run) : [...prev, run]
    );
  };

  const toggleAllRuns = () => {
    if (selectedRuns.length === vehicleRuns.length) {
      setSelectedRuns([]);
    } else {
      setSelectedRuns([...vehicleRuns]);
    }
  };

  const toggleSeverity = (severity: string) => {
    setSelectedSeverity((prev) =>
      prev.includes(severity) ? prev.filter((s) => s !== severity) : [...prev, severity]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleGenerateReport = () => {
    const formatLabel = selectedFormat === 'pdf' ? 'PDF' : selectedFormat === 'excel' ? 'Excel' : 'CSV';
    toastHelper[0]({
      message: `Report Generated, your custom ${formatLabel} report with ${filteredIncidents.length} incident(s) is ready for download.`,
      theme: 'success',
      duration: 3000,
    } as any);
  };

  const handleQuickReport = (reportId: string, reportTitle: string) => {
    // Different messages for different report types
    const messages: Record<string, string> = {
      'monthly-summary': 'Your Monthly Summary PDF report for March 2025 with incident statistics and trends is ready for download.',
      'yearly-summary': 'Your Yearly Summary PDF report with annual incident totals broken down by school term is ready for download.',
      'high-critical-severity': 'Your High & Critical Incidents PDF report with all escalated incidents requiring immediate attention is ready for download.',
      'open-incidents': 'Your Open Incidents Report PDF with all currently open incidents requiring action is ready for download.',
    };

    toastHelper[0]({
      message: `${reportTitle} Generated, ${messages[reportId] || `Your ${reportTitle} report is ready for download.`}`,
      theme: 'success',
      duration: 3000,
    } as any);
  };

  // Filter incidents based on selected criteria
  const getFilteredIncidents = () => {
    let filtered = [...mockIncidents];

    // Filter by incident types if any selected
    if (selectedIncidentTypes.length > 0) {
      filtered = filtered.filter(inc => selectedIncidentTypes.includes(inc.type));
    }

    // Filter by runs if any selected
    if (selectedRuns.length > 0) {
      filtered = filtered.filter(inc => selectedRuns.includes(inc.route));
    }

    // Filter by severity if any selected
    if (selectedSeverity.length > 0) {
      filtered = filtered.filter(inc => selectedSeverity.includes(inc.severity));
    }

    // Filter by status if any selected
    if (selectedStatus.length > 0) {
      filtered = filtered.filter(inc => selectedStatus.includes(inc.status));
    }

    return filtered;
  };

  const filteredIncidents = getFilteredIncidents();
  const totalIncidents = filteredIncidents.length;

  return (
    <div style={{ padding: 'var(--forge-spacing-xlarge)' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <h1 style={{ margin: 0, marginBottom: '8px' }}>Reports</h1>
        <p className="text-muted-foreground" style={{ margin: 0 }}>
          Generate and download incident reports
        </p>
      </div>

      {/* Quick Reports Section */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }}>
          <h3 className="forge-typography--heading4">Quick Reports</h3>
          <p className="forge-typography--body2" style={{ color: 'var(--forge-theme-text-medium)' }}>
            Pre-configured reports ready to generate with one click
          </p>
        </div>
        <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quickReports.map((report) => {
              return (
                <ForgeCard
                  key={report.id}
                  className="border-border hover:border-primary/50 transition-colors cursor-pointer"
                  style={{ boxShadow: 'var(--forge-elevation-1)' }}
                >
                  <div style={{ padding: 'var(--forge-spacing-medium)', paddingTop: 'var(--forge-spacing-large)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: `${report.color}1A` }}>
                        <forge-icon name={report.icon} style={{ fontSize: '24px', color: report.color }}></forge-icon>
                      </div>
                      <forge-badge theme="default">
                        {report.lastRun}
                      </forge-badge>
                    </div>
                    
                    <h3 style={{ margin: 0, marginBottom: '8px' }}>{report.title}</h3>
                    <p className="text-muted-foreground" style={{ fontSize: '0.875rem', marginBottom: '16px', minHeight: '3em' }}>
                      {report.description}
                    </p>
                    
                    <ForgeButton
                      variant="raised"
                      full-width
                      onClick={() => {
                        setPreviewReport(report);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <forge-icon slot="start" name="visibility"></forge-icon>
                      View Report
                    </ForgeButton>
                  </div>
                </ForgeCard>
              );
            })}
          </div>
        </div>
      </ForgeCard>

      {/* Report Preview Modal */}
      {/* @ts-ignore */}
      <forge-dialog ref={previewDialogRef} aria-label={previewReport?.title || 'Report Preview'}>
        <div className="max-h-[85vh] flex flex-col" style={{ maxWidth: '95vw', width: 'fit-content', minWidth: '900px', padding: 'var(--forge-spacing-large)' }}>
          <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
            <div className="flex items-center justify-between" style={{ marginRight: 'var(--forge-spacing-large)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--forge-font-size-xl)', fontWeight: 'var(--forge-font-weight-medium)', fontFamily: 'var(--forge-font-family)' }}>
                {previewReport?.title}
              </h2>
              <ForgeButton
                variant="raised"
                onClick={() => {
                  if (previewReport) {
                    handleQuickReport(previewReport.id, previewReport.title);
                  }
                }}
              >
                <forge-icon slot="start" name="download"></forge-icon>
                Download Report
              </ForgeButton>
            </div>
          </div>

          {previewReport && (
            <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
              {false ? null : (
                // Standard Table View
                <>
              {/* Report table */}
              <div className="flex-1 overflow-y-auto" style={{ border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', borderRadius: 'var(--forge-shape-medium)' }}>
                <table className="forge-table" style={{ fontSize: 'var(--forge-font-size-sm)', whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr>
                      <th className="forge-table-cell forge-table-cell--header">Incident ID</th>
                      <th className="forge-table-cell forge-table-cell--header">Date</th>
                      <th className="forge-table-cell forge-table-cell--header">Involved</th>
                      <th className="forge-table-cell forge-table-cell--header">Type</th>
                      <th className="forge-table-cell forge-table-cell--header">Vehicle</th>
                      <th className="forge-table-cell forge-table-cell--header">Driver</th>
                      <th className="forge-table-cell forge-table-cell--header">Severity</th>
                      <th className="forge-table-cell forge-table-cell--header">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getReportData(previewReport.id).map((incident) => (
                      <tr
                        key={incident.id}
                        className="forge-table-row"
                      >
                        <td className="forge-table-cell" style={{ fontWeight: 'var(--forge-font-weight-medium)', color: 'var(--primary)' }}>{incident.id}</td>
                        <td className="forge-table-cell" style={{ color: 'var(--muted-foreground)' }}>{incident.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2-$3-$1')}</td>
                        <td className="forge-table-cell">
                          <div>{getIncidentSubjectLabel(incident)}</div>
                          <div style={{ fontSize: 'var(--forge-font-size-xs)', color: 'var(--muted-foreground)' }}>{incident.studentId}</div>
                        </td>
                        <td className="forge-table-cell">{incident.type}</td>
                        <td className="forge-table-cell" style={{ color: 'var(--muted-foreground)' }}>{incident.vehicle}</td>
                        <td className="forge-table-cell">{incident.driver}</td>
                        <td className="forge-table-cell">
                          <forge-badge theme={incident.severity === 'Critical' ? 'danger' : incident.severity === 'High' ? 'error' : incident.severity === 'Medium' ? 'warning' : 'info'} strong>
                            {incident.severity}
                          </forge-badge>
                        </td>
                        <td className="forge-table-cell">
                          <forge-badge theme={incident.status === 'Open' ? 'info-primary' : incident.status === 'In Progress' ? 'warning' : 'default'}>
                            {incident.status}
                          </forge-badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

                  {/* Footer with record count */}
                  <div className="flex items-center justify-between" style={{ paddingTop: 'var(--forge-spacing-small)', fontSize: 'var(--forge-font-size-xs)', color: 'var(--muted-foreground)' }}>
                    <span>Showing {getReportData(previewReport.id).length} record(s)</span>
                    <span>Generated: 05-12-2026</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </forge-dialog>
    </div>
  );
}