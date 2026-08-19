import React, { useState, useRef, useEffect } from 'react';
import { ForgeCard, ForgeButton } from '@tylertech/forge-react';
import { defineCardComponent, defineButtonComponent, defineDialogComponent, defineAvatarComponent, defineIconButtonComponent } from '@tylertech/forge';
defineCardComponent();
defineButtonComponent();
defineDialogComponent();
defineAvatarComponent();
defineIconButtonComponent();
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { ArrowLeft, MessageSquare, Edit, Camera, FileText, GitBranch, Clock, CheckCircle2, AlertCircle, Users, ChevronRight, MessageCircle, Play, Pause, Send, FileDown, Paperclip, ChevronLeft, MapPin } from 'lucide-react';

import { EditIncidentDialog } from './EditIncidentDialog';
import { Workflow, WorkflowStep, isWorkflowActive, assignWorkflowToIncident, withNormalizedSteps } from '../../data/workflows';
import { toast } from 'sonner';
import { getCommunicationsByIncidentId, type Message } from '../communications/CommunicationsPage';
import { CurrentStepActionCard } from './CurrentStepActionCard';
import { DocumentsViewer } from './DocumentsViewer';
import { PhotosViewer } from './PhotosViewer';
import { buildMapUrl } from './IncidentLocationMap';
import { getSubjectLabel, getSubjectMeta, normalizeContacts } from './IncidentTypes';

interface IncidentDetailPageProps {
  incident: any;
  onNavigate: (page: string) => void;
  onNavigateToCommunication: (incidentId: string, incidentData?: any) => void;
  allIncidents?: any[];
  onNavigateToIncident?: (incident: any) => void;
}

// Render a stored 24-hour time ("14:05") for display ("2:05 PM"). Older records
// predate time capture and have none, so this returns an empty string for them.
const formatIncidentTime = (value?: string): string => {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return value;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

const formatIncidentDate = (value?: string): string =>
  (value ?? '').replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2-$3-$1');

// "03-11-2025 at 2:05 PM", or just the date when no time was captured
const formatOccurredAt = (incident: any): string => {
  const date = formatIncidentDate(incident?.date);
  const time = formatIncidentTime(incident?.time);
  return time ? `${date} at ${time}` : date;
};

export function IncidentDetailPage({ incident, onNavigate, onNavigateToCommunication, allIncidents = [], onNavigateToIncident }: IncidentDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'history' | 'photos' | 'documents' | 'communications'>('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    incident.involvedStudents?.[0]?.studentId ?? null
  );

  const computeWorkflow = (studentId: string | null) => {
    const student = (incident.involvedStudents ?? []).find((s: any) => s.studentId === studentId) ?? null;
    if (!(incident.involvedStudents?.length) || !student) {
      return withNormalizedSteps(
        incident.workflow ?? assignWorkflowToIncident(incident.type, incident.severity) ?? null
      );
    }
    if ((student as any).noWorkflow) return null;
    const type = (student as any).incidentTypeOverride || incident.type;
    const sev = (student as any).severity || incident.severity;
    const resolved = assignWorkflowToIncident(type, sev) ?? null;
    // Reuse the step statuses already enriched onto the incident when this is the same
    // workflow, so entering from the dashboard and from the incidents list behave the same.
    if (resolved && incident.workflow?.id === resolved.id) {
      return withNormalizedSteps(incident.workflow);
    }
    return withNormalizedSteps(resolved);
  };

  const resolvedWorkflow = computeWorkflow(selectedStudentId);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(resolvedWorkflow?.steps || []);
  const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null);
  const [stepComments, setStepComments] = useState<{ [key: number]: string }>({});
  const [workflowActive, setWorkflowActive] = useState<boolean>(
    resolvedWorkflow ? isWorkflowActive(resolvedWorkflow) : false
  );
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalStepIndex, setApprovalStepIndex] = useState<number | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Forge dialog refs
  const editDialogRef = useRef<HTMLElement>(null);
  const approvalDialogRef = useRef<HTMLElement>(null);

  // Sync edit dialog open state
  useEffect(() => { const el = editDialogRef.current as any; if (!el) return; el.open = isEditDialogOpen; }, [isEditDialogOpen]);
  useEffect(() => { const el = editDialogRef.current as any; if (!el) return; const handler = () => setIsEditDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Sync approval dialog open state
  useEffect(() => { const el = approvalDialogRef.current as any; if (!el) return; el.open = approvalDialogOpen; }, [approvalDialogOpen]);
  useEffect(() => { const el = approvalDialogRef.current as any; if (!el) return; const handler = () => setApprovalDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Reset workflow state when selected student changes
  useEffect(() => {
    if (!incident.involvedStudents?.length) return;
    const wf = computeWorkflow(selectedStudentId);
    setWorkflowSteps(wf?.steps || []);
    setSelectedStepIndex(null);
    setStepComments({});
    setWorkflowActive(wf ? isWorkflowActive(wf) : false);
  }, [selectedStudentId]);

  // Communications state - load existing conversations or create default
  const existingMessages = getCommunicationsByIncidentId(incident.id);
  const [messages, setMessages] = useState<Message[]>(
    existingMessages || [
      {
        id: 'msg-1',
        sender: incident.driver || 'Driver Name',
        senderRole: 'driver',
        content: `Initial incident report: ${incident.description}`,
        timestamp: new Date(incident.date).toLocaleString(),
        status: 'read',
      },
    ]
  );
  const [newMessage, setNewMessage] = useState('');

  // Function to send a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: `msg-${Date.now()}`,
        sender: 'Current User',
        senderRole: 'coordinator',
        content: newMessage,
        timestamp: new Date().toLocaleString(),
        status: 'sent',
      };
      setMessages([...messages, message]);
      setNewMessage('');
      toast.success('Message sent successfully');
    }
  };

  // Function to open approval dialog
  const openApprovalDialog = (stepIndex: number) => {
    setApprovalStepIndex(stepIndex);
    setApprovalComment(stepComments[stepIndex] || '');
    setApprovalDialogOpen(true);
  };

  // Function to handle approval submission
  const handleApprovalSubmit = () => {
    if (approvalStepIndex !== null) {
      // Update the comment in stepComments
      setStepComments(prev => ({
        ...prev,
        [approvalStepIndex]: approvalComment
      }));
      
      // Complete the step
      completeStep(approvalStepIndex);
      
      // Close dialog and reset
      setApprovalDialogOpen(false);
      setApprovalStepIndex(null);
      setApprovalComment('');
    }
  };

  const handleWorkflowStepUpdate = (stepId: string, status: string, comments?: string, followUpAction?: string) => {
    const stepIndex = workflowSteps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const updatedSteps = [...workflowSteps];
    
    // Build comprehensive comments including follow-up action
    let fullComments = comments || '';
    if (followUpAction && status === 'Completed') {
      const actionLabel = followUpAction.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      fullComments = fullComments 
        ? `${fullComments}\n\nFollow-up Action: ${actionLabel}`
        : `Follow-up Action: ${actionLabel}`;
    }

    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      status: status as any,
      comments: fullComments,
      completedDate: status === 'Completed' ? formattedDateTime : undefined,
      completedBy: status === 'Completed' ? 'Current User' : undefined,
    };

    setWorkflowSteps(updatedSteps);

    if (status === 'Completed') {
      toast.success(`Step "${updatedSteps[stepIndex].name}" completed`);
    }
  };

  // Function to complete a workflow step
  const completeStep = (stepIndex: number) => {
    const stepName = workflowSteps[stepIndex].name;
    const isApproval = workflowSteps[stepIndex].status === 'Pending Approval';
    const isLastStep = stepIndex === workflowSteps.length - 1;
    let comment = stepComments[stepIndex] || '';
    
    // Get current date and time in readable format
    const now = new Date();
    const formattedDateTime = now.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // If this is an approval step, automatically add approval info to the comment
    if (isApproval) {
      const approvalInfo = `Approved by Current User on ${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}-${now.getFullYear()}`;
      comment = comment 
        ? `${comment}\n\n${approvalInfo}` 
        : approvalInfo;
    }
    
    // If this is the last step, automatically add workflow completion info
    if (isLastStep) {
      const completionInfo = `Workflow completed by Current User on ${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}-${now.getFullYear()}`;
      comment = comment 
        ? `${comment}\n\n${completionInfo}` 
        : completionInfo;
    }
    
    // Create a copy of the steps array
    const updatedSteps = [...workflowSteps];
    
    // Mark current step as completed with comment
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      status: 'Completed',
      comments: comment,
      completedDate: formattedDateTime,
      completedBy: 'Current User', // In a real app, this would be the logged-in user
    };
    
    // Find the next incomplete step and mark it as in progress
    const nextStepIndex = updatedSteps.findIndex((step, idx) => 
      idx > stepIndex && (!step.status || step.status === 'Not Started')
    );
    
    if (nextStepIndex !== -1) {
      // Check if next step requires approval
      if (updatedSteps[nextStepIndex].requiresApproval) {
        updatedSteps[nextStepIndex] = {
          ...updatedSteps[nextStepIndex],
          status: 'Pending Approval',
        };
      } else {
        updatedSteps[nextStepIndex] = {
          ...updatedSteps[nextStepIndex],
          status: 'In Progress',
        };
      }
    }
    
    // Update state
    setWorkflowSteps(updatedSteps);
    
    // Clear the comment for this step
    setStepComments(prev => {
      const newComments = { ...prev };
      delete newComments[stepIndex];
      return newComments;
    });
    
    // Close the expanded view if it's currently selected
    if (selectedStepIndex === stepIndex) {
      setSelectedStepIndex(null);
    }
    
    // Show success toast
    const allCompleted = updatedSteps.every(step => step.status === 'Completed');
    if (allCompleted) {
      setWorkflowActive(false); // Mark workflow as inactive when completed
      toast.success('Workflow Complete!', {
        description: `All ${totalSteps} steps have been completed. This incident has been fully processed.`,
        duration: 5000,
      });
    } else {
      toast.success(isApproval ? 'Step Approved!' : 'Step Completed!', {
        description: `"${stepName}" has been marked as complete. ${nextStepIndex !== -1 ? `Moving to: "${updatedSteps[nextStepIndex].name}"` : ''}`,
        duration: 4000,
      });
    }
  };

  const INCIDENT_LOCATION_LABELS: Record<string, string> = {
    'on-bus': 'On Vehicle',
    'bus-stop': 'At Vehicle Stop',
    'loading': 'Loading/Unloading',
    'school-campus': 'School Campus',
    'parking-lot': 'Parking Lot',
    'layover-location': 'Layover Location',
    'garage': 'Garage',
    'yard': 'Yard',
    'maintenance-bay': 'Maintenance Bay',
    'fuel-station': 'Fuel Station',
    'wash-bay': 'Wash Bay',
    'other': 'Other',
  };
  const getLocationLabel = (val: string) => INCIDENT_LOCATION_LABELS[val] ?? val;

  const getStepStatusColor = (status?: string) => {
    switch (status) {
      case 'Completed':
        return { bg: 'var(--brand-olive-light)', border: 'var(--brand-olive-dark)', text: 'var(--brand-olive-dark)' };
      case 'In Progress':
        return { bg: 'rgba(91, 139, 184, 0.1)', border: 'var(--brand-blue-medium)', text: 'var(--brand-blue-dark)' };
      case 'Pending Approval':
        return { bg: 'rgba(255, 193, 7, 0.1)', border: '#FFC107', text: '#F57C00' };
      default:
        return { bg: 'var(--muted)', border: 'var(--border)', text: 'var(--muted-foreground)' };
    }
  };

  const getStepIcon = (status?: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-6 w-6" style={{ color: 'var(--brand-olive-dark)' }} />;
      case 'In Progress':
        return <Clock className="h-6 w-6" style={{ color: 'var(--brand-blue-medium)' }} />;
      case 'Pending Approval':
        return <AlertCircle className="h-6 w-6" style={{ color: '#F57C00' }} />;
      default:
        return <div className="h-6 w-6 rounded-full border-2" style={{ borderColor: 'var(--muted-foreground)' }} />;
    }
  };

  const currentStepIndex = workflowSteps.findIndex((step: WorkflowStep) => 
    step.status === 'In Progress' || step.status === 'Pending Approval'
  ) ?? -1;

  const completedSteps = workflowSteps.filter((step: WorkflowStep) => step.status === 'Completed').length ?? 0;
  const totalSteps = workflowSteps.length ?? 0;
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Navigation logic
  const currentIndex = allIncidents.findIndex(inc => inc.id === incident.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allIncidents.length - 1;
  
  const handlePrevious = () => {
    if (hasPrevious && onNavigateToIncident) {
      onNavigateToIncident(allIncidents[currentIndex - 1]);
    }
  };
  
  const handleNext = () => {
    if (hasNext && onNavigateToIncident) {
      onNavigateToIncident(allIncidents[currentIndex + 1]);
    }
  };

  return (
    <div style={{ padding: 'var(--forge-spacing-xlarge)', background: 'var(--background)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <ForgeButton 
          variant="ghost" 
          onClick={() => onNavigate('incidents')}
          style={{ marginBottom: 'var(--forge-spacing-medium)' }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Incidents
        </ForgeButton>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--forge-spacing-small)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)' }}>
            <h1 style={{ margin: 0 }}>{incident.id}</h1>
            <ForgeButton variant="outlined" size="sm" onClick={() => setIsEditDialogOpen(true)} style={{ transform: 'scale(0.8)', transformOrigin: 'left center' }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ForgeButton>
            {/* @ts-ignore */}
            <forge-dialog ref={editDialogRef}>
              <div style={{ maxWidth: '48rem', padding: 'var(--forge-spacing-large)' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', fontFamily: 'Roboto, sans-serif' }}>Edit Incident - {incident.id}</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif' }}>
                  Modify incident details and update status
                </p>
                <EditIncidentDialog
                  incident={incident}
                  onClose={() => setIsEditDialogOpen(false)}
                  onSave={(updatedData) => {
                    console.log('Incident updated:', updatedData);
                  }}
                />
              </div>
            </forge-dialog>
          </div>
          
          {/* Navigation Controls */}
          {allIncidents.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif' }}>
                {currentIndex + 1} of {allIncidents.length}
              </span>
              <ForgeButton
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={!hasPrevious}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </ForgeButton>
              <ForgeButton
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!hasNext}
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </ForgeButton>
            </div>
          )}
        </div>
        
        {!(incident.involvedStudents && incident.involvedStudents.length >= 1) && (
          <p style={{ margin: 0, color: 'var(--muted-foreground)' }}>
            {incident.type} • {formatOccurredAt(incident)}
          </p>
        )}
      </div>

      {/* Student banner — shown whenever the incident has involved students */}
      {incident.involvedStudents && incident.involvedStudents.length >= 1 && (() => {
        const students = incident.involvedStudents;
        const isMulti = students.length > 1;
        const idx = Math.max(0, students.findIndex((s: any) => s.studentId === selectedStudentId));
        const current = students[idx];
        const roleSolid: Record<string, string> = {
          // Student roles
          Instigator: '#b91c1c',
          Participant: '#b45309',
          Victim: '#1d4ed8',
          Bystander: '#475569',
          // Non-student party roles
          Injured: '#b91c1c',
          Witness: '#475569',
          Reporter: '#1d4ed8',
        };
        const roleTint: Record<string, string> = {
          Instigator: 'rgba(185,28,28,0.06)',
          Participant: 'rgba(180,83,9,0.06)',
          Victim: 'rgba(29,78,216,0.06)',
          Bystander: 'rgba(71,85,105,0.06)',
          Injured: 'rgba(185,28,28,0.06)',
          Witness: 'rgba(71,85,105,0.06)',
          Reporter: 'rgba(29,78,216,0.06)',
        };
        const avatarColor = roleSolid[current.role] ?? '#475569';
        const tint = roleTint[current.role] ?? 'rgba(71,85,105,0.06)';
        const goPrev = () => idx > 0 && setSelectedStudentId(students[idx - 1].studentId);
        const goNext = () => idx < students.length - 1 && setSelectedStudentId(students[idx + 1].studentId);
        return (
          <ForgeCard
            raised
            style={{
              display: 'block',
              marginBottom: 'var(--forge-spacing-medium)',
              // Highlight keyed to the selected student's role color — all via Forge card props
              '--forge-card-padding': '14px 18px',
              '--forge-card-background': tint,
              '--forge-card-outline-color': avatarColor,
              '--forge-card-outline-width': '2px',
            } as React.CSSProperties}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Avatar — Forge component, colored to the student's role */}
              {/* @ts-ignore */}
              <forge-avatar
                text={current.name}
                style={{
                  flexShrink: 0,
                  '--forge-avatar-background': avatarColor,
                  '--forge-avatar-color': '#fff',
                  '--forge-avatar-size': '48px',
                } as React.CSSProperties}
              />

              {/* Identity */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 'var(--text-xs)', fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600, color: avatarColor,
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
                }}>
                  <Users className="h-3.5 w-3.5" />
                  {isMulti ? `Multi-Student Incident · ${students.length} students involved` : 'Involved Student'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: 'var(--foreground)' }}>
                    {current.name}
                  </span>
                  {current.role && (
                    /* @ts-ignore */
                    <forge-badge theme="default">{current.role}</forge-badge>
                  )}
                  {/* @ts-ignore */}
                  <forge-badge theme={current.severity === 'Critical' ? 'danger' : current.severity === 'High' ? 'error' : current.severity === 'Medium' ? 'warning' : 'info'} strong>{current.severity}</forge-badge>
                  {computeWorkflow(current.studentId) === null && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif' }}>· No workflow</span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif', marginTop: 3 }}>
                  {incident.type} • {formatOccurredAt(incident)}
                </div>
              </div>

              {/* Switcher — only when more than one student is involved */}
              {isMulti && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-start', minWidth: 300 }}>
                <label style={{ fontSize: 'var(--text-sm)', fontFamily: 'Roboto, sans-serif', color: 'var(--brand-blue-dark)', fontWeight: 500 }}>
                  Switch student:
                </label>
                {/* @ts-ignore */}
                <forge-icon-button
                  aria-label="Previous student"
                  onClick={goPrev}
                  {...(idx === 0 ? { disabled: true } : {})}
                  style={{
                    color: 'var(--brand-blue-dark)',
                    border: '1px solid rgba(91,139,184,0.45)',
                    borderRadius: 6,
                  } as React.CSSProperties}
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                {/* @ts-ignore */}
                </forge-icon-button>
                {/* @ts-ignore */}
                <forge-text-field style={{ minWidth: 240 }}>
                  <select
                    value={selectedStudentId ?? ''}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)' }}
                  >
                    {students.map((s: any) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.name} — {s.role}{computeWorkflow(s.studentId) === null ? ' (No workflow)' : ''}
                      </option>
                    ))}
                  </select>
                </forge-text-field>
                {/* @ts-ignore */}
                <forge-icon-button
                  aria-label="Next student"
                  onClick={goNext}
                  {...(idx === students.length - 1 ? { disabled: true } : {})}
                  style={{
                    color: 'var(--brand-blue-dark)',
                    border: '1px solid rgba(91,139,184,0.45)',
                    borderRadius: 6,
                  } as React.CSSProperties}
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                {/* @ts-ignore */}
                </forge-icon-button>
              </div>
              )}
            </div>
          </ForgeCard>
        );
      })()}

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--forge-spacing-small)', 
          marginBottom: 'var(--forge-spacing-large)',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid var(--brand-blue-medium)' : '2px solid transparent',
            color: activeTab === 'overview' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
            fontWeight: activeTab === 'overview' ? 'var(--forge-font-weight-medium)' : 'var(--forge-font-weight-regular)',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s',
          }}
        >
          <FileText className="inline h-4 w-4 mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          style={{
            padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'workflow' ? '2px solid var(--brand-blue-medium)' : '2px solid transparent',
            color: activeTab === 'workflow' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
            fontWeight: activeTab === 'workflow' ? 'var(--forge-font-weight-medium)' : 'var(--forge-font-weight-regular)',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s',
          }}
        >
          <GitBranch className="inline h-4 w-4 mr-2" />
          Workflow
          {resolvedWorkflow && (
            <Badge
              variant="outline"
              style={{
                marginLeft: 'var(--forge-spacing-xsmall)',
                background: progressPercentage === 100 ? 'var(--brand-olive-light)' : 'rgba(91, 139, 184, 0.1)',
                color: progressPercentage === 100 ? 'var(--brand-olive-dark)' : 'var(--brand-blue-dark)',
                border: 'none',
              }}
            >
              {totalSteps} Steps
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('communications')}
          style={{
            padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'communications' ? '2px solid var(--brand-blue-medium)' : '2px solid transparent',
            color: activeTab === 'communications' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
            fontWeight: activeTab === 'communications' ? 'var(--forge-font-weight-medium)' : 'var(--forge-font-weight-regular)',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s',
          }}
        >
          <MessageSquare className="inline h-4 w-4 mr-2" />
          Communications
          {messages.length > 1 && (
            <Badge 
              variant="outline" 
              style={{ 
                marginLeft: 'var(--forge-spacing-xsmall)',
                background: 'rgba(91, 139, 184, 0.1)',
                color: 'var(--brand-blue-dark)',
                border: 'none',
              }}
            >
              {messages.length}
            </Badge>
          )}
        </button>
        {incident.photos && incident.photos.length > 0 && (
          <button
            onClick={() => setActiveTab('photos')}
            style={{
              padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'photos' ? '2px solid var(--brand-blue-medium)' : '2px solid transparent',
              color: activeTab === 'photos' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
              fontWeight: activeTab === 'photos' ? 'var(--forge-font-weight-medium)' : 'var(--forge-font-weight-regular)',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            <Camera className="inline h-4 w-4 mr-2" />
            Photos ({incident.photos.length})
          </button>
        )}
        {incident.documents && incident.documents.length > 0 && (
          <button
            onClick={() => setActiveTab('documents')}
            style={{
              padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'documents' ? '2px solid var(--brand-blue-medium)' : '2px solid transparent',
              color: activeTab === 'documents' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
              fontWeight: activeTab === 'documents' ? 'var(--forge-font-weight-medium)' : 'var(--forge-font-weight-regular)',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            <Paperclip className="inline h-4 w-4 mr-2" />
            Documents ({incident.documents.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--brand-blue-medium)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
            fontWeight: activeTab === 'history' ? 'var(--forge-font-weight-medium)' : 'var(--forge-font-weight-regular)',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s',
          }}
        >
          <Clock className="inline h-4 w-4 mr-2" />
          History
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incident & Student Details - Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-large)' }}>
              <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
                <div style={{ padding: 'var(--forge-spacing-medium)' }}>
                  <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                    Incident Details
                  </h3>
                </div>
                <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Subject
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* @ts-ignore */}
                        <forge-badge theme={(incident.subject ?? 'student') === 'student' ? 'default' : 'info-primary'}>
                          {getSubjectLabel(incident.subject ?? 'student')}
                        </forge-badge>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Type
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' }}>
                        {incident.type}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Occurred
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' }}>
                        {formatOccurredAt(incident)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Location
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' }}>
                        {incident.location ? (
                          <>
                            {getLocationLabel(incident.location)}
                            {incident.locationAddress && (
                              <span style={{ marginLeft: 8, color: 'var(--muted-foreground)', fontSize: 'var(--text-sm)' }}>
                                — {incident.locationAddress}
                              </span>
                            )}
                          </>
                        ) : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Vehicle
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' }}>
                        {incident.bus}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Driver
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' }}>
                        {incident.driver}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Run
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' }}>
                        {incident.route}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Severity
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' }}>
                        {incident.severity ? (
                          /* @ts-ignore */
                          <forge-badge theme={incident.severity === 'Critical' ? 'danger' : incident.severity === 'High' ? 'error' : incident.severity === 'Medium' ? 'warning' : 'info'} strong>{incident.severity}</forge-badge>
                        ) : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Assigned To
                      </div>
                      <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' }}>
                        {incident.assignedTo}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {incident.description && (
                    <div style={{ marginTop: 'var(--forge-spacing-large)', paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Description
                      </div>
                      <p style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', lineHeight: '1.6' }}>{incident.description}</p>
                    </div>
                  )}

                  {/* Witnesses and third parties. normalizeContacts accepts both
                      the legacy string[] on seeded incidents and the structured
                      contacts the form now produces. */}
                  {[
                    { present: incident.witnessPresent, heading: 'Witnesses', raw: incident.witnesses ?? incident.witnessNames, emptyText: 'Witness(es) present, names not recorded' },
                    { present: incident.thirdPartyPresent, heading: 'Third Parties', raw: incident.thirdParties ?? incident.thirdPartyNames, emptyText: 'Third part(ies) involved, names not recorded' },
                  ].filter(g => g.present).map(group => {
                    const contacts = normalizeContacts(group.raw);
                    return (
                      <div key={group.heading} style={{ marginTop: 'var(--forge-spacing-large)', paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '8px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {group.heading}
                        </div>
                        {contacts.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {contacts.map((c, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)' }}>
                                <Users className="h-3.5 w-3.5" style={{ color: 'var(--brand-blue-medium)', flexShrink: 0, marginTop: 3 }} />
                                <div>
                                  <div>{c.name}</div>
                                  {(c.phone || c.email) && (
                                    <div style={{ color: 'var(--muted-foreground)', fontSize: 'var(--text-xs)' }}>
                                      {[c.phone, c.email].filter(Boolean).join('  ·  ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                            {group.emptyText}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Tags */}
                  {incident.tags && incident.tags.length > 0 && (
                    <div style={{ marginTop: 'var(--forge-spacing-large)', paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '8px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Tags
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {incident.tags.map((tag: string, i: number) => (
                          <span key={i} style={{
                            padding: '2px 10px',
                            borderRadius: 12,
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 500,
                            background: 'rgba(91,139,184,0.1)',
                            color: 'var(--brand-blue-dark)',
                            border: '1px solid rgba(91,139,184,0.25)',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location Pin — only when a coordinate was pinned at creation */}
                  {incident.locationCoordinates && (
                    <div style={{ marginTop: 'var(--forge-spacing-large)', paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '8px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Pinned Location
                      </div>
                      <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0, display: 'block' }}
                          src={buildMapUrl(incident.locationCoordinates.lat, incident.locationCoordinates.lng, 15)}
                          title="Pinned incident location"
                          loading="lazy"
                        />
                        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'var(--brand-blue-medium)', color: '#fff', padding: '3px 10px', borderRadius: 4, fontFamily: 'Roboto, sans-serif', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
                          <MapPin className="h-3 w-3" /> Location Pinned
                        </div>
                      </div>
                      {incident.locationAddress && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)' }}>
                          <MapPin className="h-4 w-4" style={{ color: 'var(--brand-blue-medium)', flexShrink: 0 }} />
                          {incident.locationAddress}
                        </div>
                      )}
                      <div style={{ marginTop: 4, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                        {incident.locationCoordinates.lat.toFixed(5)}, {incident.locationCoordinates.lng.toFixed(5)}
                      </div>
                    </div>
                  )}
                </div>
              </ForgeCard>

              {/* Student Details */}
              {incident.involvedStudents?.length > 0 && (() => {
                const s = incident.involvedStudents.find((s: any) => s.studentId === selectedStudentId);
                if (!s) return null;
                const labelStyle = { fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
                const valueStyle = { fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' };
                const sevTheme = s.severity === 'Critical' ? 'danger' : s.severity === 'High' ? 'error' : s.severity === 'Medium' ? 'warning' : 'info';
                return (
                  <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
                    <div style={{ padding: 'var(--forge-spacing-medium)' }}>
                      <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                        Student Details
                      </h3>
                    </div>
                    <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <div style={labelStyle}>Student</div>
                          <div style={valueStyle}>{s.name}</div>
                        </div>
                        <div>
                          <div style={labelStyle}>Student ID</div>
                          <div style={valueStyle}>{s.studentId}</div>
                        </div>
                        {s.role && (
                          <div>
                            <div style={labelStyle}>Role In Incident</div>
                            <div style={valueStyle}>
                              {/* @ts-ignore */}
                              <forge-badge theme="default">{s.role}</forge-badge>
                            </div>
                          </div>
                        )}
                        {s.severity && (
                          <div>
                            <div style={labelStyle}>Severity</div>
                            <div style={valueStyle}>
                              {/* @ts-ignore */}
                              <forge-badge theme={sevTheme} strong>{s.severity}</forge-badge>
                            </div>
                          </div>
                        )}
                      </div>

                      {s.parentNotified !== undefined && (
                        <div style={{ marginTop: 'var(--forge-spacing-medium)' }}>
                          <div style={labelStyle}>Parent/Guardian has been notified</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', color: s.parentNotified ? '#16a34a' : '#94a3b8' }}>
                            {s.parentNotified ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                            {s.parentNotified ? 'Yes' : 'No'}
                          </div>
                        </div>
                      )}

                      {s.description && (
                        <div style={{ marginTop: 'var(--forge-spacing-medium)' }}>
                          <div style={labelStyle}>Student Account</div>
                          <p style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', lineHeight: '1.6' }}>{s.description}</p>
                        </div>
                      )}

                      {s.actionTaken && (
                        <div style={{ marginTop: 'var(--forge-spacing-medium)' }}>
                          <div style={labelStyle}>Immediate Action Taken</div>
                          <p style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', lineHeight: '1.6' }}>{s.actionTaken}</p>
                        </div>
                      )}

                      {s.notes && (
                        <div style={{ marginTop: 'var(--forge-spacing-medium)' }}>
                          <div style={labelStyle}>Additional Notes</div>
                          <p style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', lineHeight: '1.6', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{s.notes}</p>
                        </div>
                      )}
                    </div>
                  </ForgeCard>
                );
              })()}

              {/* Involved Parties — the non-student equivalent of the Student
                  Details card above. Deliberately the same shape, because
                  involvedParties mirrors involvedStudents field for field. */}
              {incident.involvedParties?.length > 0 && (() => {
                const labelStyle = { fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
                const valueStyle = { fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' };
                const parties = incident.involvedParties;
                return (
                  <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
                    <div style={{ padding: 'var(--forge-spacing-medium)' }}>
                      <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                        {parties.length === 1 ? 'Involved Party' : `Involved Parties (${parties.length})`}
                      </h3>
                      <p style={{ margin: 0, marginTop: 4, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                        {incident.subject === 'staff'
                          ? 'Employees involved in this incident.'
                          : 'People outside the district involved in this incident.'}
                      </p>
                    </div>
                    <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
                      {parties.map((p: any, idx: number) => {
                        const sevTheme = p.severity === 'Critical' ? 'danger' : p.severity === 'High' ? 'error' : p.severity === 'Medium' ? 'warning' : 'info';
                        return (
                          <div
                            key={p.partyId ?? `${p.name}-${idx}`}
                            style={{
                              paddingTop: idx === 0 ? 0 : 'var(--forge-spacing-medium)',
                              marginTop: idx === 0 ? 0 : 'var(--forge-spacing-medium)',
                              borderTop: idx === 0 ? 'none' : '1px solid var(--forge-theme-border-subtle, #e2e8f0)',
                            }}
                          >
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                              <div>
                                <div style={labelStyle}>Name</div>
                                <div style={valueStyle}>{p.name}</div>
                              </div>
                              <div>
                                <div style={labelStyle}>Type</div>
                                <div style={valueStyle}>
                                  {/* @ts-ignore */}
                                  <forge-badge theme="default">
                                    {p.partyType === 'employee' ? 'Employee' : 'Third Party'}
                                  </forge-badge>
                                </div>
                              </div>
                              {p.role && (
                                <div>
                                  <div style={labelStyle}>Role In Incident</div>
                                  <div style={valueStyle}>
                                    {/* @ts-ignore */}
                                    <forge-badge theme="default">{p.role}</forge-badge>
                                  </div>
                                </div>
                              )}
                              {p.severity && (
                                <div>
                                  <div style={labelStyle}>Severity</div>
                                  <div style={valueStyle}>
                                    {/* @ts-ignore */}
                                    <forge-badge theme={sevTheme} strong>{p.severity}</forge-badge>
                                  </div>
                                </div>
                              )}
                            </div>

                            {p.description && (
                              <div style={{ marginTop: 'var(--forge-spacing-medium)' }}>
                                <div style={labelStyle}>Their Account</div>
                                <p style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', lineHeight: '1.6' }}>{p.description}</p>
                              </div>
                            )}

                            {p.actionTaken && (
                              <div style={{ marginTop: 'var(--forge-spacing-medium)' }}>
                                <div style={labelStyle}>Immediate Action Taken</div>
                                <p style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', lineHeight: '1.6' }}>{p.actionTaken}</p>
                              </div>
                            )}

                            {p.notes && (
                              <div style={{ marginTop: 'var(--forge-spacing-medium)' }}>
                                <div style={labelStyle}>Additional Notes</div>
                                <p style={{ margin: 0, fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)', lineHeight: '1.6', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{p.notes}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ForgeCard>
                );
              })()}

              {/* Affected asset — facility and vehicle incidents may carry no
                  people at all, so the asset is what identifies the record. */}
              {incident.assetRef && !incident.involvedStudents?.length && !incident.involvedParties?.length && (
                <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
                  <div style={{ padding: 'var(--forge-spacing-medium)' }}>
                    <h3 className="forge-typography--heading4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {incident.subject === 'facility' ? 'Affected Facility' : 'Affected Vehicle'}
                    </h3>
                  </div>
                  <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '6px', fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {incident.subject === 'facility' ? 'Facility' : 'Vehicle'}
                    </div>
                    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-base)' }}>{incident.assetRef}</div>
                    <p style={{ margin: 0, marginTop: 'var(--forge-spacing-small)', fontFamily: 'Roboto, sans-serif', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                      No people were recorded on this incident.
                    </p>
                  </div>
                </ForgeCard>
              )}
            </div>

            {/* Right Column: Workflow */}
            <div>
              {/* Workflow card */}
              {resolvedWorkflow && currentStepIndex >= 0 ? (
                <CurrentStepActionCard
                  step={workflowSteps[currentStepIndex]}
                  stepNumber={currentStepIndex + 1}
                  totalSteps={totalSteps}
                  onCompleteStep={(comment) => completeStep(currentStepIndex)}
                  onViewDetails={() => setActiveTab('workflow')}
                  progressPercentage={progressPercentage}
                />
              ) : (
                resolvedWorkflow && (
                  <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
                    <div style={{ padding: 'var(--forge-spacing-medium)' }}>
                      <h3 className="forge-typography--heading4" style={{ fontSize: 'var(--text-lg)', fontFamily: 'Roboto, sans-serif' }}>Workflow Progress</h3>
                    </div>
                    <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
                      <div style={{ textAlign: 'center', marginBottom: 'var(--forge-spacing-medium)' }}>
                        <div
                          style={{
                            width: '120px',
                            height: '120px',
                            margin: '0 auto',
                            position: 'relative',
                          }}
                        >
                          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="8" />
                            <circle
                              cx="60"
                              cy="60"
                              r="52"
                              fill="none"
                              stroke={progressPercentage === 100 ? 'var(--brand-olive-dark)' : 'var(--brand-blue-medium)'}
                              strokeWidth="8"
                              strokeDasharray={`${2 * Math.PI * 52}`}
                              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPercentage / 100)}`}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                            />
                          </svg>
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--forge-font-weight-bold)', fontFamily: 'Roboto, sans-serif' }}>
                              {progressPercentage}%
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif' }}>
                              Complete
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-small)', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                        {resolvedWorkflow.name}
                      </div>

                      <div style={{
                        padding: 'var(--forge-spacing-medium)',
                        background: 'rgba(159, 168, 112, 0.15)',
                        borderRadius: 'var(--forge-radius-small)',
                        marginBottom: 'var(--forge-spacing-medium)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--brand-olive-dark)', fontFamily: 'Roboto, sans-serif' }}>
                          {progressPercentage === 100 ? '✓ All Steps Completed' : 'No Step In Progress'}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif', marginTop: '4px' }}>
                          {progressPercentage === 100
                            ? 'This workflow has been fully processed'
                            : 'Open the workflow to start the first step'}
                        </div>
                      </div>

                      <ForgeButton
                        className="w-full"
                        variant="outline"
                        onClick={() => setActiveTab('workflow')}
                        style={{ fontFamily: 'Roboto, sans-serif' }}
                      >
                        View Full Workflow
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </ForgeButton>
                    </div>
                  </ForgeCard>
                )
              )}
            </div>
          </div>
        )}

        {/* Workflow Tab — empty state when no workflow resolved */}
        {activeTab === 'workflow' && !resolvedWorkflow && (
          <div style={{ textAlign: 'center', padding: 'var(--forge-spacing-xxlarge)', color: 'var(--muted-foreground)' }}>
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-40" />
            {(() => {
              const s = incident.involvedStudents?.find((s: any) => s.studentId === selectedStudentId);
              return s ? (
                <>
                  <p style={{ fontSize: 'var(--text-base)', fontFamily: 'Roboto, sans-serif', marginBottom: 8 }}>
                    No workflow is assigned for <strong>{s.name}</strong>.
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'Roboto, sans-serif' }}>
                    This student's role ({s.role}) does not require a workflow step in this incident.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 'var(--text-base)', fontFamily: 'Roboto, sans-serif', marginBottom: 8 }}>
                    No workflow has been assigned to this incident.
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', fontFamily: 'Roboto, sans-serif' }}>
                    Incident type <strong>{incident.type}</strong> does not match a configured workflow.
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab === 'workflow' && resolvedWorkflow && (
          <div>
            <>
                {/* Per-student context banner */}
                {incident.involvedStudents?.length > 0 && (() => {
                  const s = incident.involvedStudents.find((s: any) => s.studentId === selectedStudentId);
                  if (!s) return null;
                  const roleColors: Record<string, { bg: string; border: string; text: string }> = {
                    Instigator: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)', text: '#b91c1c' },
                    Participant: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', text: '#b45309' },
                    Victim: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.25)', text: '#1d4ed8' },
                    Injured: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)', text: '#b91c1c' },
                    Reporter: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.25)', text: '#1d4ed8' },
                  };
                  const rc = roleColors[s.role] ?? { bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.25)', text: '#475569' };
                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 'var(--forge-spacing-medium)',
                      padding: '8px 14px',
                      background: 'var(--forge-theme-surface-container-minimum)',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      fontFamily: 'Roboto, sans-serif',
                    }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Workflow for:</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--foreground)' }}>{s.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, padding: '1px 8px', borderRadius: 10, background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>{s.role}</span>
                    </div>
                  );
                })()}
                <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)', marginBottom: 'var(--forge-spacing-large)' }}>
                  <div style={{ padding: 'var(--forge-spacing-medium)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="forge-typography--heading4">{resolvedWorkflow.name}</h3>
                          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: 0, marginTop: '4px' }}>
                            {resolvedWorkflow.description}
                          </p>
                        </div>
                  </div>
                  <Badge
                    style={{
                      background: progressPercentage === 100 ? 'var(--brand-olive-dark)' : 'var(--brand-blue-medium)',
                      color: 'white',
                      fontSize: 'var(--text-base)',
                      padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
                    }}
                  >
                    {totalSteps} Steps
                  </Badge>
                </div>
              </div>
            </ForgeCard>

            {/* Current Action Required Panel - Only show if there's an active step */}
            {currentStepIndex >= 0 && (
              <ForgeCard
                style={{
                  boxShadow: 'var(--forge-elevation-2)', 
                  marginBottom: 'var(--forge-spacing-large)',
                  background: 'linear-gradient(135deg, rgba(91, 139, 184, 0.08) 0%, rgba(123, 132, 88, 0.08) 100%)',
                  border: '2px solid var(--brand-blue-medium)',
                }}
              >
                <div style={{ padding: 'var(--forge-spacing-large)' }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--forge-spacing-large)' }}>
                    {/* Icon Section */}
                    <div 
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: workflowSteps[currentStepIndex].status === 'Pending Approval' 
                          ? 'rgba(255, 193, 7, 0.15)' 
                          : 'rgba(91, 139, 184, 0.15)',
                        border: `3px solid ${workflowSteps[currentStepIndex].status === 'Pending Approval' ? '#FFC107' : 'var(--brand-blue-medium)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {workflowSteps[currentStepIndex].status === 'Pending Approval' ? (
                        <AlertCircle className="h-10 w-10" style={{ color: '#F57C00' }} />
                      ) : (
                        <Clock className="h-10 w-10" style={{ color: 'var(--brand-blue-medium)' }} />
                      )}
                    </div>

                    {/* Content Section */}
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 'var(--forge-spacing-small)' }}>
                        <Badge 
                          style={{
                            background: workflowSteps[currentStepIndex].status === 'Pending Approval' ? '#F57C00' : 'var(--brand-blue-medium)',
                            color: 'white',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--forge-font-weight-bold)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {workflowSteps[currentStepIndex].status === 'Pending Approval' ? 'Approval Required' : 'Action Required'}
                        </Badge>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--forge-spacing-xsmall)',
                          marginBottom: 'var(--forge-spacing-small)',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--forge-font-family)',
                            fontSize: 'var(--text-sm)',
                            color: 'var(--brand-blue-dark)',
                            fontWeight: 'var(--font-weight-semibold)',
                            background: 'rgba(91, 139, 184, 0.1)',
                            padding: '2px var(--forge-spacing-small)',
                            borderRadius: 'var(--forge-radius-small)',
                          }}
                        >
                          Step {currentStepIndex + 1} of {totalSteps}
                        </span>
                      </div>
                      
                      <h2 style={{ 
                        margin: 0, 
                        marginBottom: 'var(--forge-spacing-xsmall)',
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 'var(--forge-font-weight-bold)',
                        color: 'var(--brand-blue-dark)',
                      }}>
                        {workflowSteps[currentStepIndex].name}
                      </h2>
                      
                      <p style={{ 
                        margin: 0, 
                        marginBottom: 'var(--forge-spacing-medium)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        lineHeight: '1.6',
                      }}>
                        {workflowSteps[currentStepIndex].description}
                      </p>

                      {/* What To Do Next Section */}
                      <div 
                        style={{
                          padding: 'var(--forge-spacing-medium)',
                          background: 'white',
                          borderRadius: 'var(--forge-radius-medium)',
                          border: '1px solid var(--border)',
                          marginBottom: 'var(--forge-spacing-medium)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-small)' }}>
                          <div 
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'var(--brand-olive-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-bold)', color: 'var(--brand-olive-dark)' }}>
                              1
                            </span>
                          </div>
                          <h3 style={{ 
                            margin: 0, 
                            fontSize: 'var(--text-lg)', 
                            fontWeight: 'var(--forge-font-weight-bold)',
                            color: 'var(--brand-olive-dark)',
                          }}>
                            What to do next
                          </h3>
                        </div>
                        
                        <div style={{ paddingLeft: '34px' }}>
                          {workflowSteps[currentStepIndex].status === 'Pending Approval' ? (
                            <ul style={{ 
                              margin: 0, 
                              padding: 0, 
                              listStyle: 'none',
                              fontSize: 'var(--text-sm)',
                              color: 'var(--foreground)',
                            }}>
                              <li style={{ marginBottom: 'var(--forge-spacing-xsmall)', display: 'flex', alignItems: 'start' }}>
                                <span style={{ color: 'var(--brand-blue-medium)', marginRight: 'var(--forge-spacing-small)', fontWeight: 'var(--forge-font-weight-bold)' }}>•</span>
                                <span>Review the incident details and all documentation provided</span>
                              </li>
                              <li style={{ marginBottom: 'var(--forge-spacing-xsmall)', display: 'flex', alignItems: 'start' }}>
                                <span style={{ color: 'var(--brand-blue-medium)', marginRight: 'var(--forge-spacing-small)', fontWeight: 'var(--forge-font-weight-bold)' }}>•</span>
                                <span>Verify that all required information is complete and accurate</span>
                              </li>
                              <li style={{ marginBottom: 0, display: 'flex', alignItems: 'start' }}>
                                <span style={{ color: 'var(--brand-blue-medium)', marginRight: 'var(--forge-spacing-small)', fontWeight: 'var(--forge-font-weight-bold)' }}>•</span>
                                <span>Click "Approve & Complete Step" below to move this incident forward</span>
                              </li>
                            </ul>
                          ) : (
                            <ul style={{ 
                              margin: 0, 
                              padding: 0, 
                              listStyle: 'none',
                              fontSize: 'var(--text-sm)',
                              color: 'var(--foreground)',
                            }}>
                              <li style={{ marginBottom: 'var(--forge-spacing-xsmall)', display: 'flex', alignItems: 'start' }}>
                                <span style={{ color: 'var(--brand-blue-medium)', marginRight: 'var(--forge-spacing-small)', fontWeight: 'var(--forge-font-weight-bold)' }}>•</span>
                                <span>Complete all tasks outlined in: "{workflowSteps[currentStepIndex].name}"</span>
                              </li>
                              <li style={{ marginBottom: 'var(--forge-spacing-xsmall)', display: 'flex', alignItems: 'start' }}>
                                <span style={{ color: 'var(--brand-blue-medium)', marginRight: 'var(--forge-spacing-small)', fontWeight: 'var(--forge-font-weight-bold)' }}>•</span>
                                <span>Document any actions taken or findings in the incident notes</span>
                              </li>
                              <li style={{ marginBottom: 0, display: 'flex', alignItems: 'start' }}>
                                <span style={{ color: 'var(--brand-blue-medium)', marginRight: 'var(--forge-spacing-small)', fontWeight: 'var(--forge-font-weight-bold)' }}>•</span>
                                <span>Click "Complete This Step" below to proceed to the next workflow stage</span>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Action Details */}
                      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '4px', fontWeight: 'var(--forge-font-weight-medium)' }}>
                            Assigned To
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
                            <Users className="h-4 w-4" style={{ color: 'var(--brand-blue-medium)' }} />
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                              {workflowSteps[currentStepIndex].assignedRole}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '4px', fontWeight: 'var(--forge-font-weight-medium)' }}>
                            Est. Time
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
                            <Clock className="h-4 w-4" style={{ color: 'var(--brand-blue-medium)' }} />
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                              {workflowSteps[currentStepIndex].estimatedDuration}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '4px', fontWeight: 'var(--forge-font-weight-medium)' }}>
                            Step Status
                          </div>
                          <Badge
                            variant="outline"
                            style={{
                              background: workflowSteps[currentStepIndex].status === 'Pending Approval' 
                                ? 'rgba(255, 193, 7, 0.1)' 
                                : 'rgba(91, 139, 184, 0.1)',
                              color: workflowSteps[currentStepIndex].status === 'Pending Approval' ? '#F57C00' : 'var(--brand-blue-dark)',
                              border: 'none',
                              fontWeight: 'var(--forge-font-weight-medium)',
                            }}
                          >
                            {workflowSteps[currentStepIndex].status}
                          </Badge>
                        </div>
                      </div>

                      {/* Comment Section */}
                      <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
                        <label 
                          htmlFor={`comment-${currentStepIndex}`}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--forge-spacing-xsmall)',
                            fontSize: 'var(--text-sm)', 
                            fontWeight: 'var(--forge-font-weight-medium)',
                            color: 'var(--foreground)',
                            marginBottom: 'var(--forge-spacing-xsmall)',
                          }}
                        >
                          <MessageCircle className="h-4 w-4" style={{ color: 'var(--brand-blue-medium)' }} />
                          Add Comment (Optional)
                        </label>
                        <Textarea
                          id={`comment-${currentStepIndex}`}
                          value={stepComments[currentStepIndex] || ''}
                          onChange={(e) => setStepComments(prev => ({
                            ...prev,
                            [currentStepIndex]: e.target.value
                          }))}
                          placeholder="Add notes or comments about completing this step..."
                          rows={3}
                          style={{
                            fontSize: 'var(--text-sm)',
                            resize: 'vertical',
                          }}
                        />
                        <p style={{ 
                          fontSize: 'var(--text-xs)', 
                          color: 'var(--muted-foreground)',
                          marginTop: 'var(--forge-spacing-xsmall)',
                        }}>
                          This comment will be saved with the step completion record.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)' }}>
                        {workflowSteps[currentStepIndex].status === 'Pending Approval' ? (
                          <>
                            <ForgeButton 
                              size="lg"
                              style={{
                                fontSize: 'var(--text-base)',
                                fontWeight: 'var(--forge-font-weight-bold)',
                                padding: 'var(--forge-spacing-small) var(--forge-spacing-large)',
                                background: '#F57C00',
                                color: 'white',
                                flex: 1,
                              }}
                              onClick={() => openApprovalDialog(currentStepIndex)}
                            >
                              <MessageCircle className="mr-2 h-5 w-5" />
                              Review & Approve
                            </ForgeButton>
                            <ForgeButton 
                              variant="outline"
                              size="lg"
                              onClick={() => setSelectedStepIndex(currentStepIndex)}
                              style={{
                                fontSize: 'var(--text-base)',
                                padding: 'var(--forge-spacing-small) var(--forge-spacing-large)',
                              }}
                            >
                              View Details
                            </ForgeButton>
                          </>
                        ) : (
                          <>
                            <button
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '0 24px', height: '40px',
                                background: 'var(--brand-blue-dark)', color: '#ffffff',
                                border: 'none', borderRadius: '4px',
                                fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 700,
                                cursor: 'pointer', letterSpacing: '0.0125em',
                              }}
                              onClick={() => completeStep(currentStepIndex)}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                              Complete This Step
                            </button>
                            <ForgeButton 
                              variant="outline"
                              size="lg"
                              onClick={() => setSelectedStepIndex(currentStepIndex)}
                              style={{
                                fontSize: 'var(--text-base)',
                                padding: 'var(--forge-spacing-small) var(--forge-spacing-large)',
                              }}
                            >
                              View Step Details
                            </ForgeButton>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ForgeCard>
            )}

            {/* Workflow Completed Message */}
            {currentStepIndex === -1 && progressPercentage === 100 && (
              <ForgeCard
                style={{
                  boxShadow: 'var(--forge-elevation-1)', 
                  marginBottom: 'var(--forge-spacing-large)',
                  background: 'linear-gradient(135deg, rgba(123, 132, 88, 0.08) 0%, rgba(159, 168, 112, 0.08) 100%)',
                  border: '2px solid var(--brand-olive-dark)',
                }}
              >
                <div style={{ padding: 'var(--forge-spacing-large)', textAlign: 'center' }}>
                  <div 
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'var(--brand-olive-light)',
                      border: '3px solid var(--brand-olive-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto var(--forge-spacing-medium)',
                    }}
                  >
                    <CheckCircle2 className="h-10 w-10" style={{ color: 'var(--brand-olive-dark)' }} />
                  </div>
                  <h2 style={{ 
                    margin: 0, 
                    marginBottom: 'var(--forge-spacing-xsmall)',
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--forge-font-weight-bold)',
                    color: 'var(--brand-olive-dark)',
                  }}>
                    Workflow Complete!
                  </h2>
                  <p style={{ 
                    margin: 0, 
                    fontSize: 'var(--text-base)',
                    color: 'var(--muted-foreground)',
                  }}>
                    All {totalSteps} steps have been completed. This incident has been fully processed according to district policy.
                  </p>
                </div>
              </ForgeCard>
            )}

            {/* Visual Workflow Stepper */}
            <div style={{ position: 'relative', paddingBottom: 'var(--forge-spacing-xlarge)' }}>
              {/* Connecting Line */}
              <div 
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '80px',
                  bottom: '0',
                  width: '3px',
                  background: 'var(--border)',
                  transform: 'translateX(-50%)',
                  zIndex: 0,
                }}
              />

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-large)', position: 'relative', zIndex: 1 }}>
                {workflowSteps.map((step: WorkflowStep, index: number) => {
                  const colors = getStepStatusColor(step.status);
                  const isSelected = selectedStepIndex === index;
                  const isActive = step.status === 'In Progress' || step.status === 'Pending Approval';

                  return (
                    <div 
                      key={step.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 'var(--forge-spacing-medium)',
                      }}
                    >
                      {/* Step Number Circle */}
                      <div 
                        style={{
                          minWidth: '160px',
                          textAlign: 'right',
                          paddingRight: 'var(--forge-spacing-medium)',
                        }}
                      >
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                          Step {step.order}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                          {step.estimatedDuration}
                        </div>
                      </div>

                      {/* Icon Circle */}
                      <div 
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: colors.bg,
                          border: `3px solid ${colors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: isActive ? `0 0 0 4px ${colors.bg}` : 'none',
                        }}
                      >
                        {getStepIcon(step.status)}
                      </div>

                      {/* Step Card */}
                      <ForgeCard
                        style={{
                          flex: 1,
                          boxShadow: isActive ? 'var(--forge-elevation-2)' : 'var(--forge-elevation-1)',
                          border: isActive ? `2px solid ${colors.border}` : '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => setSelectedStepIndex(isSelected ? null : index)}
                        onMouseEnter={() => setHoveredStepIndex(index)}
                        onMouseLeave={() => setHoveredStepIndex(null)}
                      >
                        <div style={{ padding: 'var(--forge-spacing-medium)' }}>
                          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 'var(--forge-spacing-xsmall)' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: '4px' }}>
                                <h3 style={{ 
                                  margin: 0, 
                                  fontSize: 'var(--text-lg)', 
                                  fontWeight: 'var(--forge-font-weight-medium)',
                                }}>
                                  {step.name}
                                </h3>
                                {step.required && (
                                  <Badge 
                                    variant="outline"
                                    style={{
                                      fontSize: 'var(--text-xs)',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: 'var(--destructive)',
                                      border: 'none',
                                    }}
                                  >
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <p style={{ 
                                margin: 0, 
                                fontSize: 'var(--text-sm)', 
                                color: 'var(--muted-foreground)',
                              }}>
                                {step.description}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              style={{
                                background: colors.bg,
                                color: colors.text,
                                border: 'none',
                              }}
                            >
                              {step.status || 'Not Started'}
                            </Badge>
                          </div>

                          {/* Comment Display for Completed Steps - Shows prominently in card */}
                          {step.status === 'Completed' && step.comments && (
                            <div 
                              style={{ 
                                marginTop: 'var(--forge-spacing-medium)',
                                padding: 'var(--forge-spacing-small)',
                                background: 'rgba(123, 132, 88, 0.05)',
                                borderRadius: 'var(--forge-radius-small)',
                                border: '1px solid var(--brand-olive-light)',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--forge-spacing-xsmall)',
                                fontSize: 'var(--text-xs)', 
                                fontWeight: 'var(--forge-font-weight-medium)',
                                color: 'var(--brand-olive-dark)',
                                marginBottom: 'var(--forge-spacing-xsmall)',
                              }}>
                                <MessageCircle className="h-3 w-3" />
                                Completion Comment
                              </div>
                              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)', lineHeight: '1.4' }}>
                                {step.comments}
                              </div>
                              {step.completedBy && step.completedDate && (
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: 'var(--forge-spacing-xsmall)' }}>
                                  by {step.completedBy} on {step.completedDate}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick Complete Button - Shows for active steps */}
                          {isActive && !isSelected && (
                            <div 
                              style={{ 
                                marginTop: 'var(--forge-spacing-medium)',
                                paddingTop: 'var(--forge-spacing-medium)',
                                borderTop: '1px solid var(--border)',
                                display: 'flex',
                                gap: 'var(--forge-spacing-small)',
                                alignItems: 'center',
                              }}
                            >
                              <div style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                                <div style={{ marginBottom: '2px' }}>Assigned Group</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Users className="h-3 w-3" style={{ color: 'var(--brand-blue-medium)' }} />
                                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--forge-font-weight-medium)', color: 'var(--foreground)' }}>{step.assignedRole}</span>
                                </div>
                              </div>
                              <button
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '0 12px', height: '32px',
                                  background: step.status === 'Pending Approval' ? '#F57C00' : 'var(--brand-blue-medium)',
                                  color: '#ffffff',
                                  border: 'none', borderRadius: '4px',
                                  fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                                  cursor: 'pointer', letterSpacing: '0.0125em',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (step.status === 'Pending Approval') {
                                    openApprovalDialog(index);
                                  } else {
                                    completeStep(index);
                                  }
                                }}
                              >
                                {step.status === 'Pending Approval' ? (
                                  <>
                                    <MessageCircle className="h-4 w-4" />
                                    Approve
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Complete
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Expanded Details */}
                          {isSelected && (
                            <div 
                              style={{ 
                                marginTop: 'var(--forge-spacing-medium)',
                                paddingTop: 'var(--forge-spacing-medium)',
                                borderTop: '1px solid var(--border)',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                                  Assigned Group
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
                                  <Users className="h-4 w-4" style={{ color: 'var(--brand-blue-medium)' }} />
                                  <span style={{ fontSize: 'var(--text-sm)' }}>{step.assignedRole}</span>
                                </div>
                              </div>

                              {step.requiresApproval && (
                                <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                                    Requires Approval From
                                  </div>
                                  <div style={{ display: 'flex', gap: 'var(--forge-spacing-xsmall)' }}>
                                    {step.approvers?.map((approver, i) => (
                                      <Badge key={i} variant="secondary" style={{ fontSize: 'var(--text-xs)' }}>
                                        {approver}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {step.emailNotifications && (step.emailNotifications.notifyOnStart || step.emailNotifications.notifyOnComplete) && (
                                <div 
                                  style={{ 
                                    marginTop: 'var(--forge-spacing-small)',
                                    padding: 'var(--forge-spacing-small)',
                                    background: 'rgba(91, 139, 184, 0.05)',
                                    borderRadius: 'var(--forge-radius-small)',
                                  }}
                                >
                                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: '4px' }}>
                                    Email Notifications
                                  </div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                                    {step.emailNotifications.notifyOnStart && 'Notify on start • '}
                                    {step.emailNotifications.notifyOnComplete && 'Notify on complete'}
                                  </div>
                                </div>
                              )}

                              {/* Display saved comment for completed steps */}
                              {step.status === 'Completed' && step.comments && (
                                <div 
                                  style={{ 
                                    marginTop: 'var(--forge-spacing-small)',
                                    padding: 'var(--forge-spacing-small)',
                                    background: 'rgba(123, 132, 88, 0.05)',
                                    borderRadius: 'var(--forge-radius-small)',
                                    border: '1px solid var(--brand-olive-light)',
                                  }}
                                >
                                  <div style={{ 
                                    fontSize: 'var(--text-xs)', 
                                    fontWeight: 'var(--forge-font-weight-medium)', 
                                    marginBottom: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--forge-spacing-xsmall)',
                                  }}>
                                    <MessageCircle className="h-3 w-3" style={{ color: 'var(--brand-olive-dark)' }} />
                                    Completion Comment
                                  </div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)' }}>
                                    {step.comments}
                                  </div>
                                  {step.completedBy && step.completedDate && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                                      by {step.completedBy} on {step.completedDate}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Comment input for active steps */}
                              {isActive && (
                                <div style={{ marginTop: 'var(--forge-spacing-medium)' }} onClick={(e) => e.stopPropagation()}>
                                  <label 
                                    htmlFor={`expanded-comment-${index}`}
                                    style={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 'var(--forge-spacing-xsmall)',
                                      fontSize: 'var(--text-xs)', 
                                      fontWeight: 'var(--forge-font-weight-medium)',
                                      color: 'var(--foreground)',
                                      marginBottom: 'var(--forge-spacing-xsmall)',
                                    }}
                                  >
                                    <MessageCircle className="h-3 w-3" style={{ color: 'var(--brand-blue-medium)' }} />
                                    Add Comment (Optional)
                                  </label>
                                  <Textarea
                                    id={`expanded-comment-${index}`}
                                    value={stepComments[index] || ''}
                                    onChange={(e) => setStepComments(prev => ({
                                      ...prev,
                                      [index]: e.target.value
                                    }))}
                                    placeholder="Add notes about completing this step..."
                                    rows={2}
                                    style={{
                                      fontSize: 'var(--text-xs)',
                                      resize: 'vertical',
                                    }}
                                  />
                                </div>
                              )}

                              {isActive && (
                                <div style={{ marginTop: 'var(--forge-spacing-medium)' }} onClick={(e) => e.stopPropagation()}>
                                  {step.status === 'Pending Approval' ? (
                                    <button
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        width: '100%', padding: '0 16px', height: '36px',
                                        background: '#F57C00', color: '#ffffff',
                                        border: 'none', borderRadius: '4px',
                                        fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                                        cursor: 'pointer', letterSpacing: '0.0125em',
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openApprovalDialog(index);
                                      }}
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                      Review & Approve Step
                                    </button>
                                  ) : (
                                    <button
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        width: '100%', padding: '0 16px', height: '36px',
                                        background: 'var(--brand-blue-dark)', color: '#ffffff',
                                        border: 'none', borderRadius: '4px',
                                        fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                                        cursor: 'pointer', letterSpacing: '0.0125em',
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        completeStep(index);
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      Complete This Step
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </ForgeCard>
                    </div>
                  );
                })}
              </div>
            </div>
            </>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
            <div style={{ padding: 'var(--forge-spacing-medium)' }}>
              <h3 className="forge-typography--heading4">Incident Timeline & Audit Log</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: 0 }}>
                Complete timeline of all actions taken on this incident
              </p>
            </div>
            <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
              <div style={{ position: 'relative', paddingLeft: 'var(--forge-spacing-large)' }}>
                {/* Vertical Line */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    background: 'var(--brand-blue-light)',
                  }}
                />
                
                {/* Timeline Events */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
                  {/* Event 1 */}
                  <div style={{ position: 'relative' }}>
                    <div 
                      style={{
                        position: 'absolute',
                        left: '-23px',
                        top: '2px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'var(--brand-olive-dark)',
                        border: '2px solid white',
                      }}
                    />
                    <div 
                      style={{
                        padding: 'var(--forge-spacing-small)',
                        background: 'white',
                        borderRadius: 'var(--forge-radius-small)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--forge-elevation-1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                          Incident Created
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                          {formatIncidentDate(incident.reportedDate ?? incident.date)}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: 0 }}>
                        Created by {incident.createdBy}
                      </p>
                      <p style={{ fontSize: 'var(--text-sm)', margin: 0, marginTop: '4px' }}>
                        Initial report: {incident.description}
                      </p>
                    </div>
                  </div>

                  {/* Event 2 */}
                  {resolvedWorkflow && (
                    <div style={{ position: 'relative' }}>
                      <div 
                        style={{
                          position: 'absolute',
                          left: '-23px',
                          top: '2px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: 'var(--brand-blue-medium)',
                          border: '2px solid white',
                        }}
                      />
                      <div 
                        style={{
                          padding: 'var(--forge-spacing-small)',
                          background: 'white',
                          borderRadius: 'var(--forge-radius-small)',
                          border: '1px solid var(--border)',
                          boxShadow: 'var(--forge-elevation-1)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                            Workflow Assigned
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                            {formatIncidentDate(incident.reportedDate ?? incident.date)}
                          </span>
                        </div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: 0 }}>
                          System automatically assigned workflow
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)', marginTop: '4px' }}>
                          <GitBranch className="h-3 w-3" style={{ color: 'var(--brand-blue-medium)' }} />
                          <span style={{ fontSize: 'var(--text-sm)' }}>
                            {resolvedWorkflow.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Workflow Step Completions */}
                  {resolvedWorkflow && workflowSteps
                    .filter((step: any) => step.status === 'Completed' && step.completedDate && step.completedBy)
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((step: any) => (
                      <div key={step.id} style={{ position: 'relative' }}>
                        <div 
                          style={{
                            position: 'absolute',
                            left: '-23px',
                            top: '2px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#2e7d32',
                            border: '2px solid white',
                          }}
                        />
                        <div 
                          style={{
                            padding: 'var(--forge-spacing-small)',
                            background: 'white',
                            borderRadius: 'var(--forge-radius-small)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--forge-elevation-1)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
                              <CheckCircle2 className="h-4 w-4" style={{ color: '#2e7d32' }} />
                              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                                {step.name} Completed
                              </span>
                            </div>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                              {step.completedDate}
                            </span>
                          </div>
                          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: 0 }}>
                            Completed by {step.completedBy}
                          </p>
                          {step.comments && (
                            <div 
                              style={{ 
                                marginTop: 'var(--forge-spacing-xsmall)',
                                padding: 'var(--forge-spacing-xsmall)',
                                background: 'var(--muted)',
                                borderRadius: 'var(--forge-radius-small)',
                                fontSize: 'var(--text-sm)',
                              }}
                            >
                              <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>Notes:</strong> {step.comments}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                  {/* Current Status */}
                  <div style={{ position: 'relative' }}>
                    <div 
                      style={{
                        position: 'absolute',
                        left: '-26px',
                        top: '0px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'var(--brand-blue-medium)',
                        border: '3px solid white',
                        boxShadow: '0 0 0 2px var(--brand-blue-medium)',
                      }}
                    />
                    <div 
                      style={{
                        padding: 'var(--forge-spacing-small)',
                        background: 'rgba(91, 139, 184, 0.1)',
                        borderRadius: 'var(--forge-radius-small)',
                        border: '1px solid var(--brand-blue-light)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)', color: 'var(--brand-blue-dark)' }}>
                          Current Status
                        </span>
                        <Badge>{incident.status}</Badge>
                      </div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: 0 }}>
                        {resolvedWorkflow
                          ? `Workflow in progress: ${completedSteps} of ${totalSteps} steps completed`
                          : 'No workflow assigned'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ForgeCard>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && incident.photos && incident.photos.length > 0 && (
          <PhotosViewer 
            photos={incident.photos} 
            incidentId={incident.id}
            driverName={incident.driver}
          />
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && incident.documents && incident.documents.length > 0 && (
          <DocumentsViewer documents={incident.documents} incidentId={incident.id} />
        )}

        {/* Communications Tab */}
        {activeTab === 'communications' && (
          <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
            <div style={{ padding: 'var(--forge-spacing-medium)' }}>
              <h3 className="forge-typography--heading4">Communications</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: 0 }}>
                Conversation thread for incident {incident.id}
              </p>
            </div>
            <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
              {/* Messages Thread */}
              <div 
                style={{ 
                  maxHeight: '500px', 
                  overflowY: 'auto',
                  marginBottom: 'var(--forge-spacing-large)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--forge-spacing-medium)',
                }}
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      flexDirection: message.senderRole === 'coordinator' ? 'row-reverse' : 'row',
                      gap: 'var(--forge-spacing-small)',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: message.senderRole === 'coordinator' 
                          ? 'var(--brand-blue-light)' 
                          : 'var(--brand-olive-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: message.senderRole === 'coordinator' 
                          ? 'var(--brand-blue-dark)' 
                          : 'var(--brand-olive-dark)',
                        fontWeight: 'var(--forge-font-weight-medium)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {message.sender.charAt(0).toUpperCase()}
                    </div>

                    {/* Message Content */}
                    <div
                      style={{
                        flex: 1,
                        maxWidth: '70%',
                      }}
                    >
                      <div
                        style={{
                          background: message.senderRole === 'coordinator' 
                            ? 'rgba(74, 111, 165, 0.1)' 
                            : 'rgba(123, 132, 88, 0.1)',
                          border: message.senderRole === 'coordinator'
                            ? '1px solid var(--brand-blue-light)'
                            : '1px solid var(--brand-olive-light)',
                          borderRadius: 'var(--forge-radius-medium)',
                          padding: 'var(--forge-spacing-medium)',
                        }}
                      >
                        {/* Sender Info */}
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 'var(--forge-spacing-small)',
                            marginBottom: 'var(--forge-spacing-xsmall)',
                          }}
                        >
                          <span 
                            style={{ 
                              fontSize: 'var(--text-sm)', 
                              fontWeight: 'var(--forge-font-weight-medium)',
                              color: message.senderRole === 'coordinator' 
                                ? 'var(--brand-blue-dark)' 
                                : 'var(--brand-olive-dark)',
                            }}
                          >
                            {message.sender}
                          </span>
                          <Badge
                            variant="outline"
                            style={{
                              fontSize: 'var(--text-xs)',
                              background: 'transparent',
                              color: 'var(--muted-foreground)',
                              borderColor: 'var(--border)',
                            }}
                          >
                            {message.senderRole === 'coordinator' ? 'Coordinator' : 'Driver'}
                          </Badge>
                        </div>

                        {/* Message Text */}
                        <p 
                          style={{ 
                            margin: 0, 
                            fontSize: 'var(--text-sm)',
                            color: 'var(--foreground)',
                            lineHeight: '1.5',
                            marginBottom: 'var(--forge-spacing-xsmall)',
                          }}
                        >
                          {message.content}
                        </p>

                        {/* Timestamp and Status */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--forge-spacing-xsmall)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{message.timestamp}</span>
                          {message.status === 'read' && <CheckCircle2 className="h-3 w-3" style={{ color: 'var(--brand-olive-dark)' }} />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input Section */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: 'var(--forge-spacing-large)',
                }}
              >
                <div style={{ marginBottom: 'var(--forge-spacing-small)' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--forge-font-weight-medium)',
                      marginBottom: 'var(--forge-spacing-xsmall)',
                      color: 'var(--foreground)',
                    }}
                  >
                    Send Message
                  </label>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    style={{
                      fontSize: 'var(--text-sm)',
                      resize: 'vertical',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleSendMessage();
                      }
                    }}
                  />
                  <p 
                    style={{ 
                      fontSize: 'var(--text-xs)', 
                      color: 'var(--muted-foreground)',
                      marginTop: 'var(--forge-spacing-xsmall)',
                    }}
                  >
                    Press Ctrl+Enter to send
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', justifyContent: 'flex-end' }}>
                  <ForgeButton
                    variant="outline"
                    onClick={() => setNewMessage('')}
                    disabled={!newMessage.trim()}
                  >
                    Clear
                  </ForgeButton>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '0 16px', height: '36px',
                      background: 'var(--brand-blue-medium)', color: '#ffffff',
                      border: 'none', borderRadius: '4px',
                      fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                      cursor: !newMessage.trim() ? 'not-allowed' : 'pointer',
                      opacity: !newMessage.trim() ? 0.5 : 1,
                      letterSpacing: '0.0125em',
                    }}
                  >
                    <Send className="h-4 w-4" />
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </ForgeCard>
        )}
      </div>

      {/* Approval Dialog */}
      {/* @ts-ignore */}
      <forge-dialog ref={approvalDialogRef}>
        <div style={{ maxWidth: '600px', padding: 'var(--forge-spacing-large)' }}>
          <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--text-2xl)', display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', fontFamily: 'Roboto, sans-serif' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255, 193, 7, 0.15)',
                  border: '2px solid #FFC107',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertCircle className="h-5 w-5" style={{ color: '#F57C00' }} />
              </div>
              Approve Workflow Step
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif' }}>
              {approvalStepIndex !== null && workflowSteps[approvalStepIndex]?.name}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)', marginTop: 'var(--forge-spacing-medium)' }}>
            {/* Step Description */}
            {approvalStepIndex !== null && workflowSteps[approvalStepIndex]?.description && (
              <div
                style={{
                  padding: 'var(--forge-spacing-medium)',
                  background: 'var(--input-background)',
                  borderRadius: 'var(--forge-radius-medium)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-xsmall)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                  Step Details
                </div>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
                  {workflowSteps[approvalStepIndex].description}
                </p>
              </div>
            )}

            {/* Approvers */}
            {approvalStepIndex !== null && workflowSteps[approvalStepIndex]?.approvers && workflowSteps[approvalStepIndex].approvers!.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-xsmall)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                  Authorized Approvers
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--forge-spacing-xsmall)' }}>
                  {workflowSteps[approvalStepIndex].approvers!.map((approver, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      style={{
                        background: 'rgba(123, 132, 88, 0.1)',
                        color: 'var(--brand-olive-dark)',
                        border: '1px solid var(--brand-olive-light)',
                      }}
                    >
                      {approver}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Approval Comment */}
            <div>
              <label
                htmlFor="approval-comment"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--forge-spacing-xsmall)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--forge-font-weight-medium)',
                  color: 'var(--foreground)',
                  marginBottom: 'var(--forge-spacing-xsmall)',
                }}
              >
                <MessageCircle className="h-4 w-4" style={{ color: 'var(--brand-blue-medium)' }} />
                Approval Comment (Optional)
              </label>
              <Textarea
                id="approval-comment"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Add notes about your approval decision or any additional context..."
                rows={4}
                style={{
                  fontSize: 'var(--text-sm)',
                  resize: 'vertical',
                }}
              />
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--muted-foreground)',
                marginTop: 'var(--forge-spacing-xsmall)',
              }}>
                This comment will be saved with the approval record and visible in the audit trail.
              </p>
            </div>

            {/* Info Box */}
            <div
              style={{
                padding: 'var(--forge-spacing-medium)',
                background: 'rgba(255, 193, 7, 0.1)',
                borderRadius: 'var(--forge-radius-medium)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
              }}
            >
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
                <strong style={{ color: '#F57C00' }}>Important:</strong> By approving this step, you confirm that all requirements have been met and the workflow can proceed to the next stage.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 'var(--forge-spacing-medium)', marginTop: 'var(--forge-spacing-small)' }}>
              <ForgeButton
                variant="outline"
                onClick={() => {
                  setApprovalDialogOpen(false);
                  setApprovalComment('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </ForgeButton>
              <button
                onClick={handleApprovalSubmit}
                style={{
                  flex: 1,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '0 16px', height: '36px',
                  background: '#F57C00', color: '#ffffff',
                  border: 'none', borderRadius: '4px',
                  fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                  cursor: 'pointer', letterSpacing: '0.0125em',
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve & Complete
              </button>
            </div>
          </div>
        </div>
      </forge-dialog>
    </div>
  );
}