import React, { useState, useEffect, useRef } from 'react';
import { ForgeButton } from '@tylertech/forge-react';
import { defineButtonComponent, defineTextFieldComponent, defineDialogComponent } from '@tylertech/forge';
defineButtonComponent();
defineTextFieldComponent();
defineDialogComponent();
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Mail, UserCheck, Settings, X, Plus } from 'lucide-react';
import { INITIAL_EMAIL_TEMPLATES } from '../../data/email-templates';
import { ForgeMultiSelect } from '../ui/forge-multiselect';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignedRole: string;
  estimatedDuration: string;
  required: boolean;
  order: number;
  requiresApproval?: boolean;
  approvers?: string[];
  emailNotifications?: {
    sendEmail: boolean;
    emailTiming: 'before' | 'after';
    notifyAssignee: boolean;
    notifyApprovers: boolean;
    notifyGroups?: string[];
    additionalRecipients: string[];
    emailTemplate?: string;
  };
}

interface StepConfigDialogProps {
  step: WorkflowStep | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (step: WorkflowStep) => void;
}

export function StepConfigDialog({ step, isOpen, onClose, onSave }: StepConfigDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);

  // Kept in a ref so the effect below does not need onClose in its deps, which
  // would tear the listener down and rebuild it on every parent render.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Sync open state and listen for the dialog closing itself.
  //
  // The listener has to be attached here rather than in a mount-only effect.
  // Nothing is rendered until the dialog is opened for the first time, so a
  // mount-only effect finds no element and never attaches. Without the
  // listener, dismissing with Escape or a click outside closed the dialog
  // without telling the page, which still thought it was open, so the next
  // click on a step's settings changed nothing and the only way back was to
  // leave the page.
  useEffect(() => {
    const el = dialogRef.current as any;
    if (!el) return;
    const handler = () => closeRef.current();
    el.addEventListener('forge-dialog-close', handler);
    // Property and attribute both, same as the navigation drawer.
    el.open = isOpen;
    if (isOpen) el.setAttribute('open', '');
    else el.removeAttribute('open');
    return () => el.removeEventListener('forge-dialog-close', handler);
  }, [isOpen]);

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'approvals'>('general');
  
  const defaultConfig: WorkflowStep = {
    id: Date.now().toString(),
    name: '',
    description: '',
    assignedRole: 'Driver',
    estimatedDuration: '',
    required: true,
    order: 1,
    requiresApproval: false,
    approvers: [],
    emailNotifications: {
      sendEmail: true,
      emailTiming: 'before',
      notifyAssignee: true,
      notifyApprovers: false,
      additionalRecipients: [],
    },
  };

  const [config, setConfig] = useState<WorkflowStep>(step || defaultConfig);

  // Sync config state when step prop changes (e.g., clicking gear on a different step)
  useEffect(() => {
    if (step && isOpen) {
      setConfig({
        ...defaultConfig,
        ...step,
        emailNotifications: (() => {
          const en = step.emailNotifications as {
            sendEmail?: boolean;
            emailTiming?: 'before' | 'after';
            notifyOnStart?: boolean;
            notifyOnComplete?: boolean;
          } | undefined;
          return {
            ...defaultConfig.emailNotifications!,
            ...(step.emailNotifications || {}),
            // Derive sendEmail from the step's actual data: a step with no
            // emailNotifications has no email configured (don't fabricate one).
            sendEmail: en ? (en.sendEmail ?? true) : false,
            // Derive timing from the notify flags when no explicit emailTiming
            // is stored: complete-only => "after", otherwise "before".
            emailTiming: en?.emailTiming
              ?? (en?.notifyOnComplete && !en?.notifyOnStart ? 'after' : 'before'),
          };
        })(),
        approvers: step.approvers || [],
      });
      setActiveTab('general');
    }
  }, [step, isOpen]);

  const [newRecipient, setNewRecipient] = useState('');
  const [newApprover, setNewApprover] = useState('');

  // NOTE: this list is duplicated in WorkflowBuilderPage and StepTemplateManager
  // and the three have historically diverged. Kept in sync here; consolidating
  // them into one shared constant is a separate cleanup.
  // The seven members of IncidentRoleType, which is what a step can actually
  // be assigned to. Nothing outside this list can be provisioned for a tenant,
  // so do not add to it. Still duplicated across this dialog,
  // WorkflowBuilderPage and StepTemplateManager; consolidating is a cleanup.
  const groups = [
    'Driver',
    'Safety Coordinator',
    'Administrator',
    'Fleet Manager',
    'School Principal',
  ];

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const addRecipient = () => {
    if (newRecipient && config.emailNotifications) {
      setConfig({
        ...config,
        emailNotifications: {
          ...config.emailNotifications,
          additionalRecipients: [
            ...config.emailNotifications.additionalRecipients,
            newRecipient,
          ],
        },
      });
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    if (config.emailNotifications) {
      setConfig({
        ...config,
        emailNotifications: {
          ...config.emailNotifications,
          additionalRecipients: config.emailNotifications.additionalRecipients.filter(
            (r) => r !== email
          ),
        },
      });
    }
  };

  const addApprover = () => {
    if (newApprover) {
      setConfig({
        ...config,
        approvers: [...(config.approvers || []), newApprover],
      });
      setNewApprover('');
    }
  };

  const removeApprover = (approver: string) => {
    setConfig({
      ...config,
      approvers: (config.approvers || []).filter((a) => a !== approver),
    });
  };

  if (!step && !isOpen) return null;

  return (
    <>
      {/* @ts-ignore */}
      <forge-dialog ref={dialogRef}>
        <div style={{ padding: 'var(--forge-spacing-large)', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}>
            <Settings className="h-6 w-6 inline mr-2" />
            Configure Step
          </h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-medium)' }}>
            Configure notifications and approvals for this step
          </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--forge-spacing-xsmall)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--forge-spacing-medium)' }}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'general' ? '2px solid var(--brand-blue-dark)' : '2px solid transparent',
              color: activeTab === 'general' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--forge-font-weight-medium)',
            }}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'notifications' ? '2px solid var(--brand-blue-dark)' : '2px solid transparent',
              color: activeTab === 'notifications' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--forge-font-weight-medium)',
            }}
          >
            <Mail className="h-4 w-4 inline mr-1" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            style={{
              padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'approvals' ? '2px solid var(--brand-blue-dark)' : '2px solid transparent',
              color: activeTab === 'approvals' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--forge-font-weight-medium)',
            }}
          >
            <UserCheck className="h-4 w-4 inline mr-1" />
            Approvals
          </button>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
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
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g., Review and Approve"
                  style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                />
              </forge-text-field>
            </div>

            <div>
              <Label htmlFor="step-desc" style={{ fontSize: 'var(--text-sm)' }}>
                Description
              </Label>
              <Textarea
                id="step-desc"
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Describe what needs to be done in this step..."
                rows={3}
                style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--forge-spacing-medium)' }}>
              <div>
                <Label htmlFor="step-role" style={{ fontSize: 'var(--text-sm)' }}>
                  Assigned Group
                </Label>
                <select
                  id="step-role"
                  value={config.assignedRole}
                  onChange={(e) => setConfig({ ...config, assignedRole: e.target.value })}
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
                    value={config.estimatedDuration}
                    onChange={(e) => setConfig({ ...config, estimatedDuration: e.target.value })}
                    placeholder="e.g., 30 minutes"
                    style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                  />
                </forge-text-field>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.required}
                  onChange={(e) => setConfig({ ...config, required: e.target.checked })}
                />
                <span style={{ fontSize: 'var(--text-sm)' }}>This is a required step (cannot be skipped)</span>
              </label>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
            <div
              style={{
                padding: 'var(--forge-spacing-medium)',
                background: 'var(--input-background)',
                borderRadius: 'var(--forge-shape-medium)',
                border: '1px solid var(--border)',
              }}
            >
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-small)' }}>
                Email Notification Settings
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-medium)' }}>
                Configure when and who receives email notifications for this step
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
                {/* Send email toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.emailNotifications?.sendEmail ?? true}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        emailNotifications: {
                          ...config.emailNotifications!,
                          sendEmail: e.target.checked,
                        },
                      })
                    }
                  />
                  <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                    Send email?
                  </span>
                </label>

                {/* Timing radio group, only visible when sendEmail is true */}
                {(config.emailNotifications?.sendEmail ?? true) && (
                  <div style={{ paddingLeft: 'var(--forge-spacing-large)', display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-small)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>
                      When should the email be sent?
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`email-timing-${config.id}`}
                        value="before"
                        checked={(config.emailNotifications?.emailTiming ?? 'before') === 'before'}
                        onChange={() =>
                          setConfig({
                            ...config,
                            emailNotifications: {
                              ...config.emailNotifications!,
                              emailTiming: 'before',
                            },
                          })
                        }
                      />
                      <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                        Before the step, notify recipients that this step is starting
                      </span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`email-timing-${config.id}`}
                        value="after"
                        checked={(config.emailNotifications?.emailTiming ?? 'before') === 'after'}
                        onChange={() =>
                          setConfig({
                            ...config,
                            emailNotifications: {
                              ...config.emailNotifications!,
                              emailTiming: 'after',
                            },
                          })
                        }
                      />
                      <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                        After the step, notify recipients once this step is complete
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email-template" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                Email Template
              </Label>
              <select
                id="email-template"
                value={config.emailNotifications?.emailTemplate || 'Action Required'}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    emailNotifications: {
                      ...config.emailNotifications!,
                      emailTemplate: e.target.value,
                    },
                  })
                }
                style={{
                  width: '100%',
                  marginTop: 'var(--forge-spacing-xsmall)',
                  padding: 'var(--forge-spacing-small)',
                  borderRadius: 'var(--forge-shape-medium)',
                  border: '1px solid var(--border)',
                  fontSize: 'var(--text-base)',
                  fontFamily: 'var(--forge-font-family)',
                  background: 'var(--input-background)',
                }}
              >
                {INITIAL_EMAIL_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.name}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </select>
              {(() => {
                const selected = INITIAL_EMAIL_TEMPLATES.find(
                  (t) => t.name === (config.emailNotifications?.emailTemplate || 'Action Required')
                );
                return selected ? (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: 'var(--forge-spacing-xxsmall)', fontFamily: 'var(--forge-font-family)' }}>
                    {selected.description}
                  </p>
                ) : null;
              })()}
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: 'var(--forge-spacing-xsmall)', fontFamily: 'var(--forge-font-family)', fontStyle: 'italic' }}>
                Templates are managed in Administration &rarr; Email Templates
              </p>
            </div>

            <div>
              <Label style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', marginBottom: 'var(--forge-spacing-xsmall)', display: 'block' }}>
                Notify Roles
              </Label>
              <ForgeMultiSelect
                options={groups.map((group) => ({ value: group, label: group }))}
                selected={config.emailNotifications?.notifyGroups || []}
                onChange={(selected) =>
                  setConfig({
                    ...config,
                    emailNotifications: {
                      ...config.emailNotifications!,
                      notifyGroups: selected,
                    },
                  })
                }
                placeholder="Select groups to notify..."
                allLabel="None selected"
                width="100%"
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: 'var(--forge-spacing-xxsmall)', fontFamily: 'var(--forge-font-family)' }}>
                Select one or more groups that should receive email notifications for this step
              </p>
            </div>

            <div>
              <Label style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', marginBottom: 'var(--forge-spacing-xsmall)', display: 'block' }}>
                Additional Email Recipients
              </Label>
              <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-small)' }}>
                {/* @ts-ignore */}
                <forge-text-field>
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="email@example.com"
                    style={{ fontFamily: 'var(--forge-font-family)' }}
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  />
                </forge-text-field>
                <ForgeButton onClick={addRecipient} disabled={!newRecipient}>
                  <Plus className="h-4 w-4" />
                </ForgeButton>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--forge-spacing-xsmall)' }}>
                {config.emailNotifications?.additionalRecipients.map((email) => (
                  <Badge
                    key={email}
                    style={{
                      background: 'var(--brand-blue-medium)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--forge-spacing-xsmall)',
                      fontFamily: 'var(--forge-font-family)',
                    }}
                  >
                    {email}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeRecipient(email)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
            <div
              style={{
                padding: 'var(--forge-spacing-medium)',
                background: 'var(--input-background)',
                borderRadius: 'var(--forge-shape-medium)',
                border: '1px solid var(--border)',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.requiresApproval}
                  onChange={(e) => setConfig({ ...config, requiresApproval: e.target.checked })}
                />
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--forge-font-weight-medium)' }}>
                  This step requires approval before proceeding
                </span>
              </label>
            </div>

            {config.requiresApproval && (
              <>
                <div>
                  <Label style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--forge-spacing-small)', display: 'block' }}>
                    Designated Approvers
                  </Label>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-small)' }}>
                    Select the groups that can approve this step
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-small)' }}>
                    <select
                      value={newApprover}
                      onChange={(e) => setNewApprover(e.target.value)}
                      style={{
                        flex: 1,
                        padding: 'var(--forge-spacing-small)',
                        borderRadius: 'var(--forge-shape-medium)',
                        border: '1px solid var(--border)',
                        fontSize: 'var(--text-base)',
                        background: 'var(--input-background)',
                      }}
                    >
                      <option value="">Select a group...</option>
                      {groups
                        .filter((group) => !(config.approvers || []).includes(group))
                        .map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                    </select>
                    <ForgeButton onClick={addApprover} disabled={!newApprover}>
                      <Plus className="h-4 w-4" />
                    </ForgeButton>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--forge-spacing-xsmall)' }}>
                    {(config.approvers || []).map((approver) => (
                      <Badge
                        key={approver}
                        style={{
                          background: 'var(--brand-olive-medium)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--forge-spacing-xsmall)',
                        }}
                      >
                        <UserCheck className="h-3 w-3" />
                        {approver}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeApprover(approver)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    padding: 'var(--forge-spacing-medium)',
                    background: 'rgba(255, 193, 7, 0.1)',
                    borderRadius: 'var(--forge-shape-medium)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                  }}
                >
                  <p style={{ fontSize: 'var(--text-sm)' }}>
                    <strong>Note:</strong> When approval is required, the workflow will pause at this step until an
                    authorized approver reviews and approves the action. Approvers will be notified via email.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--forge-spacing-medium)', marginTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--border)', paddingTop: 'var(--forge-spacing-medium)' }}>
          <ForgeButton variant="outlined" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </ForgeButton>
          <ForgeButton onClick={handleSave} style={{ flex: 1 }}>
            Save Configuration
          </ForgeButton>
        </div>
        </div>
      </forge-dialog>
    </>
  );
}