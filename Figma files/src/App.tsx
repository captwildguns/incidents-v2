import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { IncidentsPage } from './components/incidents/IncidentsPage';
import { IncidentDetailPage } from './components/incidents/IncidentDetailPage';
import { StudentsPage } from './components/students/StudentsPage';
import { VehiclesPage } from './components/vehicles/VehiclesPage';
import { EmployeesPage } from './components/employees/EmployeesPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { CommunicationsPage } from './components/communications/CommunicationsPage';
import { NewIncidentFormUnified } from './components/incidents/NewIncidentFormUnified';
import { HelpPage } from './components/help/HelpPage';
import { WorkflowsPage } from './components/workflows/WorkflowsPage';
import { WorkflowBuilderPage } from './components/workflows/WorkflowBuilderPage';
import { AdminPage } from './components/admin/AdminPage';
import { TabletView } from './components/tablet/TabletView';
import { Toaster } from './components/ui/sonner';
import { assignWorkflowToIncident, workflows } from './data/workflows';

const SITE_PASSWORD = 'My-Drop-Site';

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      sessionStorage.setItem('site-auth', 'true');
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '320px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#1e293b' }}>Incident Tracker</h2>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b' }}>Enter password to continue</p>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="Password"
          autoFocus
          style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`, borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.5rem 0 0' }}>Incorrect password</p>}
        <button type="submit" style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', background: '#4A6FA5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
          Enter
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('site-auth') === 'true');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCommIncidentId, setSelectedCommIncidentId] = useState<string | null>(null);
  const [newCommIncidentData, setNewCommIncidentData] = useState<any | null>(null);
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<any | null>(null);
  const [incidentsAssignedToFilter, setIncidentsAssignedToFilter] = useState<string | null>(null);
  const [incidentsStatusFilter, setIncidentsStatusFilter] = useState<string | null>(null);
  const [incidentsSeverityFilter, setIncidentsSeverityFilter] = useState<string | null>(null);
  const [incidentsDateAfterFilter, setIncidentsDateAfterFilter] = useState<string | null>(null);
  const [incidentsSearchTerm, setIncidentsSearchTerm] = useState<string | null>(null);
  const [sortedFilteredIncidents, setSortedFilteredIncidents] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null);
  const [studentsActiveIncidentsFilter, setStudentsActiveIncidentsFilter] = useState(false);

  const navigateToPage = (page: string) => {
    setCurrentPage(page);
    // Clear selected incident when navigating to a different page
    if (page !== 'communications') {
      setSelectedCommIncidentId(null);
      setNewCommIncidentData(null);
    }
    if (page !== 'incident-detail') {
      setSelectedIncidentForDetail(null);
    }
    // Clear incidents filters when navigating to a different page
    if (page !== 'incidents') {
      setIncidentsAssignedToFilter(null);
      setIncidentsStatusFilter(null);
      setIncidentsSeverityFilter(null);
      setIncidentsDateAfterFilter(null);
      setIncidentsSearchTerm(null);
    }
    // Clear students filters when navigating away
    if (page !== 'students') {
      setStudentsActiveIncidentsFilter(false);
    }
    // Clear selected workflow when navigating away from workflow-builder
    if (page !== 'workflow-builder') {
      setSelectedWorkflow(null);
    }
  };

  const navigateToMyIncidents = (assignedTo: string) => {
    setIncidentsAssignedToFilter(assignedTo);
    setIncidentsStatusFilter('Open');
    setIncidentsSeverityFilter(null);
    setIncidentsDateAfterFilter(null);
    setIncidentsSearchTerm(null);
    setCurrentPage('incidents');
  };

  // Hands a vehicle name or driver name to the incidents grid as a search term,
  // so an incident count on another grid opens the rows behind it instead of
  // being a dead end. Status is left unset on purpose: the count is every
  // incident, not only the open ones.
  const navigateToIncidentsMatching = (term: string) => {
    setIncidentsSearchTerm(term);
    setIncidentsAssignedToFilter(null);
    setIncidentsStatusFilter(null);
    setIncidentsSeverityFilter(null);
    setIncidentsDateAfterFilter(null);
    setCurrentPage('incidents');
  };

  const navigateToFilteredIncidents = (filters: { status?: string; severity?: string; dateAfter?: string }) => {
    setIncidentsStatusFilter(filters.status || null);
    setIncidentsSeverityFilter(filters.severity || null);
    setIncidentsDateAfterFilter(filters.dateAfter || null);
    setIncidentsAssignedToFilter(null);
    setIncidentsSearchTerm(null);
    setCurrentPage('incidents');
  };

  const navigateToStudentsWithActiveIncidents = () => {
    setStudentsActiveIncidentsFilter(true);
    setCurrentPage('students');
  };

  const navigateToCommunication = (incidentId: string, incidentData?: any) => {
    setSelectedCommIncidentId(incidentId);
    setNewCommIncidentData(incidentData || null);
    setCurrentPage('communications');
  };

  const navigateToIncidentDetail = (incident: any) => {
    // Enrich incident with workflow if not already present
    let enrichedIncident = incident;
    
    if (!incident.workflow && incident.type && incident.severity) {
      const workflow = assignWorkflowToIncident(incident.type, incident.severity);
      
      if (workflow) {
        // For open incidents, set appropriate step statuses
        if (incident.status === 'Open') {
          const updatedSteps = workflow.steps.map((step: any, index: number) => {
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
          
          enrichedIncident = {
            ...incident,
            workflow: { ...workflow, steps: updatedSteps },
          };
        } else {
          enrichedIncident = {
            ...incident,
            workflow: workflow,
          };
        }
      }
    }
    
    setSelectedIncidentForDetail(enrichedIncident);
    setCurrentPage('incident-detail');
  };

  const navigateToWorkflowBuilder = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setCurrentPage('workflow-builder');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigateToPage} onNavigateToCommunication={navigateToCommunication} onNavigateToMyIncidents={navigateToMyIncidents} onNavigateToIncidentDetail={navigateToIncidentDetail} onNavigateToFilteredIncidents={navigateToFilteredIncidents} onNavigateToStudentsWithActiveIncidents={navigateToStudentsWithActiveIncidents} />;
      case 'incidents':
        return <IncidentsPage 
          onNavigate={navigateToPage} 
          onNavigateToCommunication={navigateToCommunication} 
          onNavigateToIncidentDetail={navigateToIncidentDetail} 
          initialAssignedToFilter={incidentsAssignedToFilter} 
          initialStatusFilter={incidentsStatusFilter}
          initialSeverityFilter={incidentsSeverityFilter}
          initialDateAfterFilter={incidentsDateAfterFilter}
          initialSearchTerm={incidentsSearchTerm}
          onSortedFilteredIncidentsChange={setSortedFilteredIncidents}
        />;
      case 'incident-detail':
        return selectedIncidentForDetail ? (
          <IncidentDetailPage 
            incident={selectedIncidentForDetail} 
            onNavigate={navigateToPage} 
            onNavigateToCommunication={navigateToCommunication}
            allIncidents={sortedFilteredIncidents}
            onNavigateToIncident={navigateToIncidentDetail}
          />
        ) : (
          <IncidentsPage 
            onNavigate={navigateToPage} 
            onNavigateToCommunication={navigateToCommunication} 
            onNavigateToIncidentDetail={navigateToIncidentDetail} 
            initialAssignedToFilter={incidentsAssignedToFilter} 
            initialStatusFilter={incidentsStatusFilter}
            initialSeverityFilter={incidentsSeverityFilter}
            initialDateAfterFilter={incidentsDateAfterFilter}
            initialSearchTerm={incidentsSearchTerm}
            onSortedFilteredIncidentsChange={setSortedFilteredIncidents}
          />
        );
      case 'students':
        return <StudentsPage onNavigate={navigateToPage} initialActiveIncidentsFilter={studentsActiveIncidentsFilter} onNavigateToIncidentDetail={navigateToIncidentDetail} />;
      case 'employees':
        return <EmployeesPage onNavigate={navigateToPage} onNavigateToIncidentsMatching={navigateToIncidentsMatching} />;
      case 'vehicles':
        return <VehiclesPage onNavigate={navigateToPage} onNavigateToIncidentsMatching={navigateToIncidentsMatching} />;
      case 'communications':
        return <CommunicationsPage initialIncidentId={selectedCommIncidentId} initialIncidentData={newCommIncidentData} />;
      case 'reports':
        return <ReportsPage onNavigate={navigateToPage} />;
      case 'new-incident':
        return <NewIncidentFormUnified onNavigate={navigateToPage} />;
      case 'workflows':
        return <WorkflowsPage onNavigate={navigateToPage} onNavigateToWorkflowBuilder={navigateToWorkflowBuilder} />;
      case 'workflow-builder':
        return <WorkflowBuilderPage onNavigate={navigateToPage} selectedWorkflow={selectedWorkflow} />;
      case 'admin':
        return <AdminPage onNavigate={navigateToPage} />;
      case 'help':
        return <HelpPage />;
      default:
        return <DashboardPage onNavigate={navigateToPage} onNavigateToCommunication={navigateToCommunication} onNavigateToMyIncidents={navigateToMyIncidents} />;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('site-auth');
    setAuthenticated(false);
  };

  if (!authenticated) {
    return <PasswordGate onUnlock={() => setAuthenticated(true)} />;
  }

  // Full-screen driver tablet view — rendered outside the desktop chrome.
  // Tapping the Tyler logo (onExit) returns to the desktop view.
  if (currentPage === 'tablet') {
    return <TabletView onExit={() => navigateToPage('dashboard')} />;
  }

  return (
    <>
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateToPage}
        onNavigateToCommunication={navigateToCommunication}
        onNavigateToIncidentDetail={navigateToIncidentDetail}
        onLogout={handleLogout}
      >
        {renderPage()}
      </AppLayout>
      <Toaster />
    </>
  );
}