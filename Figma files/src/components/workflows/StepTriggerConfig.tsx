import React, { useState, useEffect, useRef } from 'react';
import { ForgeButton } from '@tylertech/forge-react';
import { defineButtonComponent, defineTextFieldComponent, defineDialogComponent } from '@tylertech/forge';
defineButtonComponent();
defineTextFieldComponent();
defineDialogComponent();
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Clock,
  GitBranch,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  Link2,
  Settings,
  Timer,
} from 'lucide-react';

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
    notifyOnStart: boolean;
    notifyOnComplete: boolean;
    notifyAssignee: boolean;
  };
  templateId?: string;
  triggers?: {
    autoStart?: boolean;
    delayStart?: {
      enabled: boolean;
      amount: number;
      unit: 'minutes' | 'hours' | 'days';
    };
    conditionalOn?: {
      enabled: boolean;
      stepId: string;
      condition: 'completed' | 'approved' | 'rejected' | 'any_status';
      action: 'proceed' | 'skip' | 'end_workflow';
    };
    dependencies?: string[];
  };
}

interface StepTriggerConfigProps {
  isOpen: boolean;
  onClose: () => void;
  step: WorkflowStep | null;
  onSave: (updatedStep: WorkflowStep) => void;
  allSteps: WorkflowStep[];
}

export function StepTriggerConfig({ isOpen, onClose, step, onSave, allSteps }: StepTriggerConfigProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [config, setConfig] = useState<WorkflowStep | null>(null);

  // Sync dialog open state
  useEffect(() => { const el = dialogRef.current as any; if (!el) return; el.open = isOpen; }, [isOpen]);
  useEffect(() => { const el = dialogRef.current as any; if (!el) return; const handler = () => onClose(); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  useEffect(() => {
    if (step) {
      // Initialize triggers if they don't exist
      setConfig({
        ...step,
        triggers: step.triggers || {
          autoStart: true,
          delayStart: {
            enabled: false,
            amount: 0,
            unit: 'minutes',
          },
          conditionalOn: {
            enabled: false,
            stepId: '',
            condition: 'completed',
            action: 'proceed',
          },
          dependencies: [],
        },
      });
    }
  }, [step]);

  if (!config) return null;

  // Get previous steps that can be used as conditions or dependencies
  const previousSteps = allSteps.filter((s) => s.order < config.order);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const updateTrigger = (field: string, value: any) => {
    setConfig({
      ...config,
      triggers: {
        ...config.triggers!,
        [field]: value,
      },
    });
  };

  const updateDelayStart = (field: string, value: any) => {
    setConfig({
      ...config,
      triggers: {
        ...config.triggers!,
        delayStart: {
          ...config.triggers!.delayStart!,
          [field]: value,
        },
      },
    });
  };

  const updateConditional = (field: string, value: any) => {
    setConfig({
      ...config,
      triggers: {
        ...config.triggers!,
        conditionalOn: {
          ...config.triggers!.conditionalOn!,
          [field]: value,
        },
      },
    });
  };

  const toggleDependency = (stepId: string) => {
    const currentDeps = config.triggers?.dependencies || [];
    const newDeps = currentDeps.includes(stepId)
      ? currentDeps.filter((id) => id !== stepId)
      : [...currentDeps, stepId];
    
    updateTrigger('dependencies', newDeps);
  };

  return (
    <>
      {/* @ts-ignore */}
      <forge-dialog ref={dialogRef}>
        <div style={{ padding: 'var(--forge-spacing-large)', maxWidth: '48rem', maxHeight: '85vh', overflow: 'auto' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}>
            <Settings className="h-6 w-6 inline mr-2" style={{ color: 'var(--brand-blue-dark)' }} />
            Configure Triggers: {config.name}
          </h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-medium)' }}>
            Define when and how this step should be triggered in the workflow
          </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-large)' }}>
          {/* Auto-Start Configuration */}
          <div
            style={{
              padding: 'var(--forge-spacing-medium)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--forge-shape-medium)',
              background: 'var(--input-background)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-medium)' }}>
              <Zap className="h-5 w-5" style={{ color: 'var(--brand-blue-dark)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                Auto-Start Behavior
              </h3>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.triggers?.autoStart ?? true}
                onChange={(e) => updateTrigger('autoStart', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                  Automatically start this step
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                  Step will start automatically when all dependencies and conditions are met
                </div>
              </div>
            </label>

            {!config.triggers?.autoStart && (
              <div
                style={{
                  marginTop: 'var(--forge-spacing-small)',
                  padding: 'var(--forge-spacing-small)',
                  background: 'rgba(255, 193, 7, 0.1)',
                  borderRadius: 'var(--forge-shape-small)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
                  <AlertCircle className="h-4 w-4" style={{ color: 'var(--brand-olive-dark)' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-olive-dark)' }}>
                    This step will require manual initiation by an administrator
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Time Delay Configuration */}
          <div
            style={{
              padding: 'var(--forge-spacing-medium)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--forge-shape-medium)',
              background: 'var(--input-background)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-medium)' }}>
              <Timer className="h-5 w-5" style={{ color: 'var(--brand-blue-dark)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                Time Delay
              </h3>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer', marginBottom: 'var(--forge-spacing-medium)' }}>
              <input
                type="checkbox"
                checked={config.triggers?.delayStart?.enabled ?? false}
                onChange={(e) => updateDelayStart('enabled', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                  Add time delay before starting
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                  Wait a specified amount of time before this step begins
                </div>
              </div>
            </label>

            {config.triggers?.delayStart?.enabled && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: 'var(--forge-spacing-small)',
                  padding: 'var(--forge-spacing-medium)',
                  background: 'white',
                  borderRadius: 'var(--forge-shape-medium)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <Label htmlFor="delay-amount" style={{ fontSize: 'var(--text-sm)' }}>
                    Delay Amount
                  </Label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input
                      type="number"
                      id="delay-amount"
                      min="0"
                      value={config.triggers?.delayStart?.amount ?? 0}
                      onChange={(e) => updateDelayStart('amount', parseInt(e.target.value) || 0)}
                      style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                    />
                  </forge-text-field>
                </div>

                <div>
                  <Label htmlFor="delay-unit" style={{ fontSize: 'var(--text-sm)' }}>
                    Time Unit
                  </Label>
                  <select
                    id="delay-unit"
                    value={config.triggers?.delayStart?.unit ?? 'minutes'}
                    onChange={(e) => updateDelayStart('unit', e.target.value)}
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
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: 'var(--forge-spacing-small)' }}>
                  <div
                    style={{
                      padding: 'var(--forge-spacing-small)',
                      background: 'rgba(74, 111, 165, 0.1)',
                      borderRadius: 'var(--forge-shape-small)',
                      border: '1px solid rgba(74, 111, 165, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
                      <Clock className="h-4 w-4" style={{ color: 'var(--brand-blue-dark)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-blue-dark)' }}>
                        This step will wait{' '}
                        <strong>
                          {config.triggers?.delayStart?.amount} {config.triggers?.delayStart?.unit}
                        </strong>{' '}
                        before starting
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conditional Logic */}
          <div
            style={{
              padding: 'var(--forge-spacing-medium)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--forge-shape-medium)',
              background: 'var(--input-background)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-medium)' }}>
              <GitBranch className="h-5 w-5" style={{ color: 'var(--brand-blue-dark)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                Conditional Logic
              </h3>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer', marginBottom: 'var(--forge-spacing-medium)' }}>
              <input
                type="checkbox"
                checked={config.triggers?.conditionalOn?.enabled ?? false}
                onChange={(e) => updateConditional('enabled', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                  Make this step conditional
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                  Control whether this step runs based on the outcome of a previous step
                </div>
              </div>
            </label>

            {config.triggers?.conditionalOn?.enabled && (
              <div
                style={{
                  padding: 'var(--forge-spacing-medium)',
                  background: 'white',
                  borderRadius: 'var(--forge-shape-medium)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--forge-spacing-medium)',
                }}
              >
                {previousSteps.length === 0 ? (
                  <div
                    style={{
                      padding: 'var(--forge-spacing-medium)',
                      background: 'rgba(255, 193, 7, 0.1)',
                      borderRadius: 'var(--forge-shape-small)',
                      border: '1px solid rgba(255, 193, 7, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--brand-olive-dark)' }} />
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-olive-dark)' }}>
                      No previous steps available. Conditional logic requires at least one step before this one.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="condition-step" style={{ fontSize: 'var(--text-sm)' }}>
                        When this step:
                      </Label>
                      <select
                        id="condition-step"
                        value={config.triggers?.conditionalOn?.stepId ?? ''}
                        onChange={(e) => updateConditional('stepId', e.target.value)}
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
                        <option value="">Select a step...</option>
                        {previousSteps.map((s) => (
                          <option key={s.id} value={s.id}>
                            Step {s.order}: {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="condition-status" style={{ fontSize: 'var(--text-sm)' }}>
                        Has this status:
                      </Label>
                      <select
                        id="condition-status"
                        value={config.triggers?.conditionalOn?.condition ?? 'completed'}
                        onChange={(e) => updateConditional('condition', e.target.value)}
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
                        <option value="completed">Completed</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="any_status">Any Status (just completed)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="condition-action" style={{ fontSize: 'var(--text-sm)' }}>
                        Then:
                      </Label>
                      <select
                        id="condition-action"
                        value={config.triggers?.conditionalOn?.action ?? 'proceed'}
                        onChange={(e) => updateConditional('action', e.target.value)}
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
                        <option value="proceed">Proceed with this step</option>
                        <option value="skip">Skip this step</option>
                        <option value="end_workflow">End the workflow</option>
                      </select>
                    </div>

                    {config.triggers?.conditionalOn?.stepId && (
                      <div
                        style={{
                          padding: 'var(--forge-spacing-small)',
                          background: 'rgba(74, 111, 165, 0.1)',
                          borderRadius: 'var(--forge-shape-small)',
                          border: '1px solid rgba(74, 111, 165, 0.2)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--forge-spacing-xsmall)' }}>
                          <GitBranch className="h-4 w-4 mt-0.5" style={{ color: 'var(--brand-blue-dark)' }} />
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-blue-dark)', lineHeight: '1.4' }}>
                            <strong>If</strong>{' '}
                            {previousSteps.find((s) => s.id === config.triggers?.conditionalOn?.stepId)?.name || 'selected step'}{' '}
                            is <strong>{config.triggers?.conditionalOn?.condition}</strong>,{' '}
                            <strong>
                              {config.triggers?.conditionalOn?.action === 'proceed'
                                ? 'proceed with'
                                : config.triggers?.conditionalOn?.action === 'skip'
                                ? 'skip'
                                : 'end workflow after'}
                            </strong>{' '}
                            this step
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dependencies */}
          <div
            style={{
              padding: 'var(--forge-spacing-medium)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--forge-shape-medium)',
              background: 'var(--input-background)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-medium)' }}>
              <Link2 className="h-5 w-5" style={{ color: 'var(--brand-blue-dark)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                Step Dependencies
              </h3>
            </div>

            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-medium)' }}>
              Select which steps must be completed before this step can start. By default, only the immediately previous step is required.
            </div>

            {previousSteps.length === 0 ? (
              <div
                style={{
                  padding: 'var(--forge-spacing-medium)',
                  background: 'rgba(74, 111, 165, 0.1)',
                  borderRadius: 'var(--forge-shape-small)',
                  border: '1px solid rgba(74, 111, 165, 0.2)',
                  textAlign: 'center',
                }}
              >
                <PlayCircle className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--brand-blue-dark)' }} />
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-blue-dark)' }}>
                  This is the first step in the workflow - no dependencies available
                </p>
              </div>
            ) : (
              <div
                style={{
                  padding: 'var(--forge-spacing-medium)',
                  background: 'white',
                  borderRadius: 'var(--forge-shape-medium)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--forge-spacing-small)',
                }}
              >
                {previousSteps.map((s) => (
                  <label
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--forge-spacing-small)',
                      padding: 'var(--forge-spacing-small)',
                      borderRadius: 'var(--forge-shape-small)',
                      cursor: 'pointer',
                      background: config.triggers?.dependencies?.includes(s.id)
                        ? 'rgba(74, 111, 165, 0.1)'
                        : 'transparent',
                      border: '1px solid',
                      borderColor: config.triggers?.dependencies?.includes(s.id)
                        ? 'var(--brand-blue-medium)'
                        : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={config.triggers?.dependencies?.includes(s.id) ?? false}
                      onChange={() => toggleDependency(s.id)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div className="flex-1">
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                        Step {s.order}: {s.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                        {s.assignedRole} · {s.estimatedDuration}
                      </div>
                    </div>
                    {config.triggers?.dependencies?.includes(s.id) && (
                      <CheckCircle className="h-4 w-4" style={{ color: 'var(--brand-olive-medium)' }} />
                    )}
                  </label>
                ))}

                {(config.triggers?.dependencies?.length ?? 0) > 0 && (
                  <div
                    style={{
                      marginTop: 'var(--forge-spacing-small)',
                      padding: 'var(--forge-spacing-small)',
                      background: 'rgba(74, 111, 165, 0.1)',
                      borderRadius: 'var(--forge-shape-small)',
                      border: '1px solid rgba(74, 111, 165, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
                      <Link2 className="h-4 w-4" style={{ color: 'var(--brand-blue-dark)' }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-blue-dark)' }}>
                        This step will wait for <strong>{config.triggers?.dependencies?.length}</strong> step(s) to complete
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--forge-spacing-medium)',
              paddingTop: 'var(--forge-spacing-medium)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <ForgeButton variant="outlined" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </ForgeButton>
            <button
              onClick={handleSave}
              style={{
                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '0 16px', height: '36px',
                background: 'var(--brand-blue-dark)', color: '#ffffff',
                border: 'none', borderRadius: '4px',
                fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', letterSpacing: '0.0125em',
              }}
            >
              <Settings className="h-4 w-4" />
              Save Trigger Configuration
            </button>
          </div>
        </div>
        </div>
      </forge-dialog>
    </>
  );
}
