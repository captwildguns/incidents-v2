import React, { useState, useRef, useEffect } from 'react';
import { ForgeCard, ForgeButton } from '@tylertech/forge-react';
import { defineCardComponent, defineButtonComponent, defineTextFieldComponent, defineDialogComponent } from '@tylertech/forge';
defineCardComponent();
defineButtonComponent();
defineTextFieldComponent();
defineDialogComponent();
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { StepConfigDialog } from './StepConfigDialog';
import { WorkflowStepLibrary, WorkflowStepTemplate } from './WorkflowStepLibrary';
import { ROLE_HOLDERS, holdersOfRole, resolveWorkflowOwner } from '../../data/workflows';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  FileText,
  Settings,
  Mail,
  UserCheck,
  Library,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedRole: string;
  estimatedDuration: string;
  required: boolean;
  order: number;
  status?: 'Not Started' | 'In Progress' | 'Completed' | 'Pending Approval' | 'Approved' | 'Rejected';
  completedDate?: string;
  completedBy?: string;
  requiresApproval?: boolean;
  approvers?: string[];
  emailNotifications?: {
    sendEmail: boolean;
    emailTiming: 'before' | 'after';
    notifyOnStart?: boolean;
    notifyOnComplete?: boolean;
    notifyAssignee: boolean;
    notifyRoles?: string[];
    additionalRecipients?: string[];
    emailTemplate?: string;
  };
  templateId?: string; // Track which template this step was created from
}

interface WorkflowBuilderPageProps {
  onNavigate: (page: string) => void;
  selectedWorkflow?: any | null;
}

export function WorkflowBuilderPage({ onNavigate, selectedWorkflow }: WorkflowBuilderPageProps) {
  const [workflowName, setWorkflowName] = useState(selectedWorkflow?.name || 'Bus Accident Response');
  const [workflowDescription, setWorkflowDescription] = useState(selectedWorkflow?.description || '');
  const [workflowCategory, setWorkflowCategory] = useState(selectedWorkflow?.category || 'Safety');
  const [workflowSeverity, setWorkflowSeverity] = useState(selectedWorkflow?.severity || 'Medium');
  const [workflowActive, setWorkflowActive] = useState(selectedWorkflow?.active ?? true);
  // Required: a workflow that names no owner would file its incidents unassigned.
  const [ownerRole, setOwnerRole] = useState<string>(selectedWorkflow?.ownerRole || '');
  // Optional: names one person instead of whoever holds the role.
  const [ownerName, setOwnerName] = useState<string>(selectedWorkflow?.ownerName || '');
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>(
    selectedWorkflow?.steps && selectedWorkflow.steps.length > 0
      ? selectedWorkflow.steps
      : [
          {
            id: '1',
            name: 'Immediate Scene Assessment',
            description: 'Driver assesses injuries and secures the scene',
            assignedRole: 'Driver',
            estimatedDuration: '5 minutes',
            required: true,
            order: 1,
          },
          {
            id: '2',
            name: 'Emergency Services Notification',
            description: 'Contact 911 if injuries are present',
            assignedRole: 'Driver',
            estimatedDuration: '2 minutes',
            required: true,
            order: 2,
          },
          {
            id: '3',
            name: 'Transportation Department Notification',
            description: 'Notify dispatch immediately',
            assignedRole: 'Driver',
            estimatedDuration: '5 minutes',
            required: true,
            order: 3,
          },
        ]
  );

  const [configuringStep, setConfiguringStep] = useState<WorkflowStep | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
  const libraryDialogRef = useRef<HTMLElement>(null);

  // Sync library dialog open state
  useEffect(() => { const el = libraryDialogRef.current as any; if (!el) return; el.open = isLibraryDialogOpen; }, [isLibraryDialogOpen]);
  useEffect(() => { const el = libraryDialogRef.current as any; if (!el) return; const handler = () => setIsLibraryDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);
  const [newStep, setNewStep] = useState({
    name: '',
    description: '',
    assignedRole: 'Driver',
    estimatedDuration: '',
    required: true,
  });

  const groups = [
    // The seven members of IncidentRoleType, which is what a step can actually
    // be assigned to. Nothing outside this list can be provisioned for a
    // tenant, so do not add to it. Also duplicated in StepConfigDialog and
    // StepTemplateManager; consolidating the three is a separate cleanup.
    'Driver',
    'Safety Coordinator',
    'Administrator',
    'Fleet Manager',
    'School Principal',
  ];

  const addStep = () => {
    if (!newStep.name || !newStep.description) return;

    const step: WorkflowStep = {
      id: Date.now().toString(),
      ...newStep,
      order: steps.length + 1,
    };

    setSteps([...steps, step]);
    setNewStep({
      name: '',
      description: '',
      assignedRole: 'Driver',
      estimatedDuration: '',
      required: true,
    });
  };

  const deleteStep = (id: string) => {
    const newSteps = steps.filter((s) => s.id !== id);
    // Reorder remaining steps
    setSteps(
      newSteps.map((step, index) => ({
        ...step,
        order: index + 1,
      }))
    );
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];

    // Update order numbers
    setSteps(
      newSteps.map((step, idx) => ({
        ...step,
        order: idx + 1,
      }))
    );
  };

  const updateStep = (id: string, field: keyof WorkflowStep, value: any) => {
    setSteps(
      steps.map((step) =>
        step.id === id ? { ...step, [field]: value } : step
      )
    );
  };

  const handleSave = () => {
    if (!ownerRole) {
      setDetailsExpanded(true);
      return;
    }
    alert('Workflow saved successfully!');
    onNavigate('workflows');
  };

  const handleOpenConfig = (step: WorkflowStep) => {
    setConfiguringStep(step);
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = (updatedStep: WorkflowStep) => {
    setSteps(steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)));
  };

  return (
    <div style={{ padding: 'var(--forge-spacing-xlarge)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-small)' }}>
          <ForgeButton variant="flat" onClick={() => onNavigate('workflows')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </ForgeButton>
        </div>

        <h1
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--forge-font-weight-medium)',
            marginBottom: 'var(--forge-spacing-small)',
          }}
        >
          Workflow Builder: {workflowName}
        </h1>
        {workflowDescription && (
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              marginBottom: 'var(--forge-spacing-small)',
            }}
          >
            {workflowDescription}
          </p>
        )}
        {selectedWorkflow && (
          <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', flexWrap: 'wrap', marginTop: 'var(--forge-spacing-small)' }}>
          </div>
        )}
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)',
            marginTop: 'var(--forge-spacing-small)',
          }}
        >
          Define the sequence of steps that will be followed when this workflow is triggered
        </p>
      </div>

      {/* Workflow Details card */}
      <ForgeCard style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <button
          type="button"
          onClick={() => setDetailsExpanded(e => !e)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--forge-spacing-medium)', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)' }}>
            <Settings className="h-5 w-5" style={{ color: 'var(--brand-blue-dark)' }} />
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--forge-font-weight-medium)' }}>
              Workflow Details
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginLeft: 4 }}>
              {workflowName}{workflowCategory ? ` · ${workflowCategory}` : ''}{workflowSeverity ? ` · ${workflowSeverity}` : ''}{ownerName ? ` · ${ownerName}` : ownerRole ? ` · ${ownerRole}` : ''}
            </span>
          </div>
          <ChevronDown
            className="h-4 w-4"
            style={{
              color: 'var(--muted-foreground)',
              transform: detailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          />
        </button>

        {detailsExpanded && (
          <div style={{ padding: '0 var(--forge-spacing-medium) var(--forge-spacing-medium)', display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--forge-spacing-medium)', marginTop: 'var(--forge-spacing-medium)' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Label style={{ fontSize: 'var(--text-sm)' }}>Workflow Name *</Label>
                {/* @ts-ignore */}
                <forge-text-field>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="e.g., Bus Accident Response"
                    style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                  />
                </forge-text-field>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <Label style={{ fontSize: 'var(--text-sm)' }}>Description</Label>
                <Textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe when and how this workflow is used..."
                  rows={3}
                  style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                />
              </div>

              <div>
                <Label style={{ fontSize: 'var(--text-sm)' }}>Category</Label>
                <select
                  value={workflowCategory}
                  onChange={(e) => setWorkflowCategory(e.target.value)}
                  style={{
                    width: '100%', marginTop: 'var(--forge-spacing-xsmall)',
                    padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)',
                    border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)',
                  }}
                >
                  {['Safety', 'Behavioral', 'Medical', 'Administrative', 'Communication', 'Investigation', 'Follow-up'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label style={{ fontSize: 'var(--text-sm)' }}>Default Severity</Label>
                <select
                  value={workflowSeverity}
                  onChange={(e) => setWorkflowSeverity(e.target.value)}
                  style={{
                    width: '100%', marginTop: 'var(--forge-spacing-xsmall)',
                    padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)',
                    border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)',
                  }}
                >
                  {['Low', 'Medium', 'High', 'Critical'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label style={{ fontSize: 'var(--text-sm)' }}>Incident Assignee *</Label>
                <select
                  value={ownerRole}
                  onChange={(e) => { setOwnerRole(e.target.value); setOwnerName(''); }}
                  style={{
                    width: '100%', marginTop: 'var(--forge-spacing-xsmall)',
                    padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)',
                    border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)',
                  }}
                >
                  <option value="">Select an assignee...</option>
                  {Object.keys(ROLE_HOLDERS).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div style={{ fontSize: 'var(--text-sm)', color: ownerRole ? 'var(--muted-foreground)' : 'var(--destructive)', marginTop: 'var(--forge-spacing-xxsmall)' }}>
                  {!ownerRole
                    ? 'Required. Every incident on this workflow needs an assignee.'
                    : ownerName
                      ? 'Incidents on this workflow are assigned to ' + ownerName + ', regardless of who holds the role.'
                      : 'Incidents on this workflow are assigned to ' + ownerRole
                        + (holdersOfRole(ownerRole).length > 1
                            ? ', which ' + holdersOfRole(ownerRole).length + ' people hold.'
                            : '.')}
                </div>
              </div>

              <div>
                <Label style={{ fontSize: 'var(--text-sm)' }}>Assign incident to specific person</Label>
                <select
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  style={{
                    width: '100%', marginTop: 'var(--forge-spacing-xsmall)',
                    padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)',
                    border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)',
                  }}
                >
                  <option value="">Whoever holds the role</option>
                  {holdersOfRole(ownerRole).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginTop: 'var(--forge-spacing-xxsmall)' }}>
                  Optional. Overrides the role, so the assignment does not follow a change of staff.
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer', marginTop: 'var(--forge-spacing-xsmall)' }}>
                  <input
                    type="checkbox"
                    checked={workflowActive}
                    onChange={(e) => setWorkflowActive(e.target.checked)}
                  />
                  <span style={{ fontSize: 'var(--text-sm)' }}>Active</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </ForgeCard>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--forge-spacing-large)' }}>
        {/* Steps List */}
        <div>
          <ForgeCard style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
            <div style={{ padding: 'var(--forge-spacing-medium)' }}>
              <h3 className="forge-typography--heading4" style={{ fontSize: 'var(--text-xl)' }}>
                Workflow Steps ({steps.length})
              </h3>
            </div>
            <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--forge-shape-medium)',
                      padding: 'var(--forge-spacing-medium)',
                      background: 'transparent',
                    }}
                  >
                    {/* Step Number and Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-small)' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--brand-blue-dark)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'var(--forge-font-weight-medium)',
                          fontSize: 'var(--text-base)',
                        }}
                      >
                        {step.order}
                      </div>

                      <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--forge-font-weight-medium)', fontFamily: 'var(--forge-font-family)' }}>
                            {step.name}
                          </div>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--forge-spacing-xsmall)' }}>
                        <ForgeButton
                          variant="flat"
                          size="sm"
                          onClick={() => moveStep(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </ForgeButton>
                        <ForgeButton
                          variant="flat"
                          size="sm"
                          onClick={() => moveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </ForgeButton>
                        <ForgeButton
                          variant="flat"
                          size="sm"
                          onClick={() => handleOpenConfig(step)}
                          title="Configure step settings, notifications, and approvals"
                        >
                          <Settings className="h-4 w-4" />
                        </ForgeButton>
                        <ForgeButton
                          variant="raised"
                          size="sm"
                          onClick={() => deleteStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ForgeButton>
                      </div>
                    </div>

                    {/* Step Details */}
                      <div>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)' }}>
                          {step.description}
                        </p>

                        <div style={{ display: 'flex', gap: 'var(--forge-spacing-medium)', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
                            <User className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                            <span style={{ fontSize: 'var(--text-sm)' }}>{step.assignedRole}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
                            <Clock className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                            <span style={{ fontSize: 'var(--text-sm)' }}>{step.estimatedDuration}</span>
                          </div>

                          {step.required ? (
                            <Badge
                              style={{
                                background: 'var(--destructive)',
                                color: 'var(--destructive-foreground)',
                              }}
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="outline">Optional</Badge>
                          )}

                          {step.emailNotifications && step.emailNotifications.sendEmail && (
                            <Badge
                              variant="outline"
                              style={{
                                background: 'rgba(63, 81, 181, 0.1)',
                                borderColor: 'var(--brand-blue-medium)',
                              }}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Notifications
                            </Badge>
                          )}

                          {step.requiresApproval && (
                            <Badge
                              variant="outline"
                              style={{
                                background: 'rgba(255, 193, 7, 0.1)',
                                borderColor: 'var(--brand-olive-medium)',
                              }}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Approval Required
                            </Badge>
                          )}
                        </div>
                      </div>
                  </div>
                ))}

                {steps.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 'var(--forge-spacing-xlarge)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    <FileText className="h-12 w-12" style={{ margin: '0 auto var(--forge-spacing-medium)' }} />
                    <p style={{ fontSize: 'var(--text-lg)' }}>No steps added yet</p>
                    <p style={{ fontSize: 'var(--text-sm)' }}>Use the form to add your first step</p>
                  </div>
                )}
              </div>
            </div>
          </ForgeCard>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: 'var(--forge-spacing-medium)' }}>
            <ForgeButton onClick={handleSave} style={{ flex: 1 }} disabled={!ownerRole}>
              <Save className="h-4 w-4 mr-2" />
              Save Workflow
            </ForgeButton>
            <ForgeButton variant="outlined" onClick={() => onNavigate('workflows')}>
              Cancel
            </ForgeButton>
          </div>
          {!ownerRole && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--destructive)', marginTop: 'var(--forge-spacing-small)' }}>
              Choose an Incident Assignee in Workflow Details before saving.
            </div>
          )}
        </div>

        {/* Add Step Form */}
        <div>
          {/* Browse Step Library */}
          <button
            onClick={() => setIsLibraryDialogOpen(true)}
            style={{
              width: '100%',
              marginBottom: 'var(--forge-spacing-medium)',
              background: 'var(--card)',
              color: 'var(--card-foreground)',
              borderRadius: 'var(--forge-shape-medium)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              padding: 'var(--forge-spacing-large)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--forge-spacing-medium)',
              fontFamily: 'var(--forge-font-family)',
            }}
          >
            <Library className="h-8 w-8" style={{ color: 'var(--brand-blue-dark)' }} />
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--forge-font-weight-medium)', color: 'var(--brand-blue-dark)' }}>
              Add Step from Library
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
              Browse pre-built step templates to quickly build your workflow
            </span>
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--forge-spacing-small)',
                background: 'var(--muted)',
                borderRadius: 'var(--forge-shape-medium)',
                padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
                marginTop: 'var(--forge-spacing-xsmall)',
              }}
            >
              <Search className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                Search steps...
              </span>
            </div>
          </button>
          {/* @ts-ignore */}
          <forge-dialog ref={libraryDialogRef}>
            <div style={{ padding: 'var(--forge-spacing-large)', maxWidth: '80vw', maxHeight: '80vh', overflow: 'auto' }}>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}>Add Step from Library</h2>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-medium)' }}>
                Select a pre-built step template to add to your workflow. Click "Add to Workflow" on any step below.
              </p>
              <WorkflowStepLibrary
                onAddStep={(template: WorkflowStepTemplate) => {
                  const step: WorkflowStep = {
                    id: Date.now().toString(),
                    name: template.name,
                    description: template.description,
                    assignedRole: template.defaultGroup,
                    estimatedDuration: template.defaultDuration,
                    required: true,
                    order: steps.length + 1,
                    requiresApproval: template.requiresApproval,
                    emailNotifications: template.emailNotifications,
                    templateId: template.id, // Store the template ID
                  };

                  setSteps([...steps, step]);
                  toast.success('Step added to workflow', {
                    description: `"${template.name}" has been added to your workflow`,
                  });
                }}
                addedTemplateIds={steps.filter(s => s.templateId).map(s => s.templateId!)}
              />
            </div>
          </forge-dialog>

          <ForgeCard style={{ position: 'sticky', top: 'var(--forge-spacing-medium)' }}>
            <div style={{ padding: 'var(--forge-spacing-medium)' }}>
              <h3 className="forge-typography--heading4" style={{ fontSize: 'var(--text-xl)' }}>
                <Plus className="h-5 w-5 inline mr-2" />
                Create Custom Step
              </h3>
            </div>
            <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
                <div>
                  <Label htmlFor="step-name" style={{ fontSize: 'var(--text-sm)' }}>
                    Step Name
                  </Label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input
                      type="text"
                      id="step-name"
                      value={newStep.name}
                      onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                      placeholder="e.g., Notify Parent"
                      style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                    />
                  </forge-text-field>
                </div>

                <div>
                  <Label htmlFor="step-description" style={{ fontSize: 'var(--text-sm)' }}>
                    Description
                  </Label>
                  <Textarea
                    id="step-description"
                    value={newStep.description}
                    onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                    placeholder="Describe what needs to be done..."
                    rows={3}
                    style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                  />
                </div>

                <div>
                  <Label htmlFor="step-group" style={{ fontSize: 'var(--text-sm)' }}>
                    Assigned Group
                  </Label>
                  <select
                    id="step-group"
                    value={newStep.assignedRole}
                    onChange={(e) => setNewStep({ ...newStep, assignedRole: e.target.value })}
                    style={{
                      width: '100%',
                      marginTop: 'var(--forge-spacing-xsmall)',
                      padding: 'var(--forge-spacing-small)',
                      borderRadius: 'var(--forge-shape-medium)',
                      border: '1px solid var(--border)',
                      fontSize: 'var(--text-base)',
                      background: 'var(--input-background)',
                    }}
                  >
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="step-duration" style={{ fontSize: 'var(--text-sm)' }}>
                    Estimated Duration
                  </Label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input
                      type="text"
                      id="step-duration"
                      value={newStep.estimatedDuration}
                      onChange={(e) => setNewStep({ ...newStep, estimatedDuration: e.target.value })}
                      placeholder="e.g., 10 minutes, 1 hour"
                      style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                    />
                  </forge-text-field>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newStep.required}
                      onChange={(e) => setNewStep({ ...newStep, required: e.target.checked })}
                    />
                    <span style={{ fontSize: 'var(--text-sm)' }}>Required step</span>
                  </label>
                </div>

                <ForgeButton
                  onClick={addStep}
                  disabled={!newStep.name || !newStep.description}
                  style={{ width: '100%' }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </ForgeButton>
              </div>
            </div>
          </ForgeCard>


        </div>
      </div>

      {/* Step Config Dialog */}
      <StepConfigDialog
        isOpen={isConfigDialogOpen}
        onClose={() => setIsConfigDialogOpen(false)}
        step={configuringStep}
        onSave={handleSaveConfig}
      />
    </div>
  );
}