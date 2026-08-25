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
import {
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  Mail,
  Phone,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  Users,
  Bell,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  Shield,
  Video,
  FileCheck,
  UserPlus,
  Ban,
  Archive,
  Library,
  X,
} from 'lucide-react';
import { workflowStepTemplates, WorkflowStepTemplate } from './WorkflowStepLibrary';
import { INITIAL_EMAIL_TEMPLATES } from '../../data/email-templates';
import { toast } from 'sonner';

interface StepTemplateManagerProps {
  customTemplates?: WorkflowStepTemplate[];
  onAddTemplate?: (template: WorkflowStepTemplate) => void;
  onEditTemplate?: (template: WorkflowStepTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

const iconOptions = [
  { name: 'Phone', icon: Phone },
  { name: 'Mail', icon: Mail },
  { name: 'MessageSquare', icon: MessageSquare },
  { name: 'Bell', icon: Bell },
  { name: 'Calendar', icon: Calendar },
  { name: 'FileText', icon: FileText },
  { name: 'Users', icon: Users },
  { name: 'Video', icon: Video },
  { name: 'FileCheck', icon: FileCheck },
  { name: 'UserCheck', icon: UserCheck },
  { name: 'ClipboardCheck', icon: ClipboardCheck },
  { name: 'Shield', icon: Shield },
  { name: 'UserPlus', icon: UserPlus },
  { name: 'Ban', icon: Ban },
  { name: 'Clock', icon: Clock },
  { name: 'CheckCircle', icon: CheckCircle },
  { name: 'Settings', icon: Settings },
  { name: 'Archive', icon: Archive },
];

const categoryOptions: Array<'Notification' | 'Review & Action' | 'Close Out'> = [
  'Notification',
  'Review & Action',
  'Close Out',
];

// The seven members of IncidentRoleType, which is what a step can actually be
// assigned to. Nothing outside this list can be provisioned for a tenant, so do
// not add to it. Counselor and Transportation Director were here and are not
// IncidentRoleType members either. Also duplicated in StepConfigDialog and
// WorkflowBuilderPage; consolidating the three is a separate cleanup.
const roleOptions = [
  'Safety Coordinator',
  'Administrator',
  'Fleet Manager',
  'Driver',
  'School Principal',
];

export function StepTemplateManager({
  customTemplates = [],
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: StepTemplateManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowStepTemplate | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'Notification' as WorkflowStepTemplate['category'],
    icon: 'Phone',
    defaultRole: 'Safety Coordinator',
    defaultDuration: '30 minutes',
    requiresApproval: false,
    emailNotifications: {
      sendEmail: true,
      emailTiming: 'before' as 'before' | 'after',
      notifyAssignee: true,
      notifyGroups: ['Safety Coordinator'] as string[],
      emailTemplate: 'Action Required',
    },
    tags: [] as string[],
    instructions: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [newInstructionInput, setNewInstructionInput] = useState('');
  const [editInstructionInput, setEditInstructionInput] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: 'Notification' as WorkflowStepTemplate['category'],
    icon: 'Phone',
    defaultRole: 'Safety Coordinator',
    defaultDuration: '30 minutes',
    requiresApproval: false,
    emailNotifications: {
      sendEmail: true,
      emailTiming: 'before' as 'before' | 'after',
      notifyAssignee: true,
      notifyGroups: ['Safety Coordinator'] as string[],
      emailTemplate: 'Action Required',
    },
    tags: [] as string[],
    instructions: [] as string[],
  });

  const createDialogRef = useRef<HTMLElement>(null);
  const editDialogRef = useRef<HTMLElement>(null);

  // Sync create dialog open state
  useEffect(() => { const el = createDialogRef.current as any; if (!el) return; el.open = isCreateDialogOpen; }, [isCreateDialogOpen]);
  useEffect(() => { const el = createDialogRef.current as any; if (!el) return; const handler = () => setIsCreateDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Sync edit dialog open state
  useEffect(() => { const el = editDialogRef.current as any; if (!el) return; el.open = isEditDialogOpen; }, [isEditDialogOpen]);
  useEffect(() => { const el = editDialogRef.current as any; if (!el) return; const handler = () => setIsEditDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Populate edit form when a template is selected
  useEffect(() => {
    if (editingTemplate && isEditDialogOpen) {
      const iconName = iconOptions.find(i => i.icon === editingTemplate.icon)?.name || 'Phone';
      setEditForm({
        name: editingTemplate.name,
        description: editingTemplate.description,
        category: editingTemplate.category,
        icon: iconName,
        defaultRole: editingTemplate.defaultGroup,
        defaultDuration: editingTemplate.defaultDuration,
        requiresApproval: editingTemplate.requiresApproval || false,
        emailNotifications: (() => {
          const en = editingTemplate.emailNotifications as any;
          return {
            // A template with no emailNotifications has no email configured.
            sendEmail: en ? (en.sendEmail ?? true) : false,
            // Derive timing from the notify flags when no explicit emailTiming.
            emailTiming: en?.emailTiming
              ?? (en?.notifyOnComplete && !en?.notifyOnStart ? 'after' : 'before'),
            notifyAssignee: en?.notifyAssignee ?? true,
            notifyGroups: (en?.notifyGroups as string[]) ?? [],
            emailTemplate: en?.emailTemplate ?? 'Action Required',
          };
        })(),
        tags: [...editingTemplate.tags],
        instructions: [...(editingTemplate.instructions || [])],
      });
      setEditTagInput('');
      setEditInstructionInput('');
    }
  }, [editingTemplate, isEditDialogOpen]);

  // Combine built-in and custom templates
  const allTemplates = [...workflowStepTemplates, ...customTemplates];

  const categories = ['All', ...categoryOptions];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Notification':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Review & Action':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Close Out':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryCount = (category: string) => {
    if (category === 'All') return allTemplates.length;
    return allTemplates.filter((t) => t.category === category).length;
  };

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === 'All' || template.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedIcon = iconOptions.find((i) => i.name === newTemplate.icon);
    
    const template: WorkflowStepTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      category: newTemplate.category,
      icon: selectedIcon?.icon || Phone,
      defaultGroup: newTemplate.defaultRole,
      defaultDuration: newTemplate.defaultDuration,
      requiresApproval: newTemplate.requiresApproval,
      emailNotifications: newTemplate.emailNotifications.sendEmail
        ? {
            notifyOnStart: newTemplate.emailNotifications.emailTiming === 'before',
            notifyOnComplete: newTemplate.emailNotifications.emailTiming === 'after',
            notifyAssignee: newTemplate.emailNotifications.notifyAssignee,
            ...(newTemplate.emailNotifications.notifyGroups.length
              ? { notifyGroups: newTemplate.emailNotifications.notifyGroups }
              : {}),
            emailTemplate: newTemplate.emailNotifications.emailTemplate,
          }
        : undefined,
      tags: newTemplate.tags,
      instructions: newTemplate.instructions,
    };

    if (onAddTemplate) {
      onAddTemplate(template);
    }

    toast.success('Template created', {
      description: `"${template.name}" has been added to your step library`,
    });

    // Reset form
    setNewTemplate({
      name: '',
      description: '',
      category: 'Notification',
      icon: 'Phone',
      defaultRole: 'Safety Coordinator',
      defaultDuration: '30 minutes',
      requiresApproval: false,
      emailNotifications: {
        sendEmail: true,
        emailTiming: 'before' as 'before' | 'after',
        notifyAssignee: true,
      },
      tags: [],
      instructions: [],
    });
    setTagInput('');
    setNewInstructionInput('');
    setIsCreateDialogOpen(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newTemplate.tags.includes(tagInput.trim())) {
      setNewTemplate({
        ...newTemplate,
        tags: [...newTemplate.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTemplate({
      ...newTemplate,
      tags: newTemplate.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSaveEdit = () => {
    if (!editingTemplate || !editForm.name || !editForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    const selectedIcon = iconOptions.find(i => i.name === editForm.icon);
    const updated: WorkflowStepTemplate = {
      ...editingTemplate,
      name: editForm.name,
      description: editForm.description,
      category: editForm.category,
      icon: selectedIcon?.icon || editingTemplate.icon,
      defaultGroup: editForm.defaultRole,
      defaultDuration: editForm.defaultDuration,
      requiresApproval: editForm.requiresApproval,
      emailNotifications: editForm.emailNotifications.sendEmail
        ? {
            notifyOnStart: editForm.emailNotifications.emailTiming === 'before',
            notifyOnComplete: editForm.emailNotifications.emailTiming === 'after',
            notifyAssignee: editForm.emailNotifications.notifyAssignee,
            ...((editingTemplate.emailNotifications as any)?.notifyApprovers !== undefined
              ? { notifyApprovers: (editingTemplate.emailNotifications as any).notifyApprovers }
              : {}),
            ...(editForm.emailNotifications.notifyGroups.length
              ? { notifyGroups: editForm.emailNotifications.notifyGroups }
              : {}),
            emailTemplate: editForm.emailNotifications.emailTemplate,
          }
        : undefined,
      tags: editForm.tags,
      instructions: editForm.instructions,
    };
    if (onEditTemplate) onEditTemplate(updated);
    toast.success('Template updated', { description: `"${updated.name}" has been saved` });
    setIsEditDialogOpen(false);
    setEditingTemplate(null);
  };

  const isBuiltIn = (templateId: string) => {
    return workflowStepTemplates.some((t) => t.id === templateId);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--forge-spacing-large)' }}>
        <div>
          <h2
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--forge-font-weight-medium)',
              marginBottom: 'var(--forge-spacing-xsmall)',
            }}
          >
            Step Template Library
          </h2>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
            }}
          >
            Manage pre-built workflow step templates for quick workflow creation
          </p>
        </div>

        <button
          onClick={() => setIsCreateDialogOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '0 16px', height: '36px',
            background: 'var(--brand-blue-dark)', color: '#ffffff',
            border: 'none', borderRadius: '4px',
            fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
            cursor: 'pointer', letterSpacing: '0.0125em',
          }}
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
        {/* @ts-ignore */}
        <forge-dialog ref={createDialogRef}>
          <div style={{ padding: 'var(--forge-spacing-large)', maxWidth: '42rem', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}>Create Step Template</h2>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-medium)' }}>
              Create a reusable step template that can be added to any workflow
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
              {/* Template Name */}
              <div>
                <Label htmlFor="template-name" style={{ fontSize: 'var(--text-sm)' }}>
                  Template Name *
                </Label>
                {/* @ts-ignore */}
                <forge-text-field>
                  <input
                    type="text"
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Emergency Parent Notification"
                    style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                  />
                </forge-text-field>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="template-description" style={{ fontSize: 'var(--text-sm)' }}>
                  Description *
                </Label>
                <Textarea
                  id="template-description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Describe what this step does..."
                  rows={3}
                  style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                />
              </div>

              {/* Category and Icon */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--forge-spacing-medium)' }}>
                <div>
                  <Label htmlFor="template-category" style={{ fontSize: 'var(--text-sm)' }}>
                    Category
                  </Label>
                  <select
                    id="template-category"
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as WorkflowStepTemplate['category'] })}
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
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="template-icon" style={{ fontSize: 'var(--text-sm)' }}>
                    Icon
                  </Label>
                  <select
                    id="template-icon"
                    value={newTemplate.icon}
                    onChange={(e) => setNewTemplate({ ...newTemplate, icon: e.target.value })}
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
                    {iconOptions.map((iconOpt) => (
                      <option key={iconOpt.name} value={iconOpt.name}>
                        {iconOpt.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role and Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--forge-spacing-medium)' }}>
                <div>
                  <Label htmlFor="template-role" style={{ fontSize: 'var(--text-sm)' }}>
                    Default Assigned Role
                  </Label>
                  <select
                    id="template-role"
                    value={newTemplate.defaultRole}
                    onChange={(e) => setNewTemplate({ ...newTemplate, defaultRole: e.target.value })}
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
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="template-duration" style={{ fontSize: 'var(--text-sm)' }}>
                    Default Duration
                  </Label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input
                      type="text"
                      id="template-duration"
                      value={newTemplate.defaultDuration}
                      onChange={(e) => setNewTemplate({ ...newTemplate, defaultDuration: e.target.value })}
                      placeholder="e.g., 30 minutes, 1 hour"
                      style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                    />
                  </forge-text-field>
                </div>
              </div>

              {/* "What to do next" Instructions */}
              <div>
                <Label style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '4px' }}>
                  "What to do next" Instructions
                </Label>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-xsmall)' }}>
                  These bullet points appear on the step action card to guide the assignee. Leave empty to use the default instructions.
                </p>
                {newTemplate.instructions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--forge-spacing-small)' }}>
                    {newTemplate.instructions.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--muted)', borderRadius: '4px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', minWidth: '16px' }}>·</span>
                        <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{item}</span>
                        <button
                          type="button"
                          onClick={() => setNewTemplate({ ...newTemplate, instructions: newTemplate.instructions.filter((_, i) => i !== idx) })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--muted-foreground)', display: 'flex' }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)' }}>
                  {/* @ts-ignore */}
                  <forge-text-field style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={newInstructionInput}
                      onChange={(e) => setNewInstructionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = newInstructionInput.trim();
                          if (val) { setNewTemplate({ ...newTemplate, instructions: [...newTemplate.instructions, val] }); setNewInstructionInput(''); }
                        }
                      }}
                      placeholder="Type an instruction and press Enter..."
                    />
                  </forge-text-field>
                  <ForgeButton type="button" variant="outlined" onClick={() => {
                    const val = newInstructionInput.trim();
                    if (val) { setNewTemplate({ ...newTemplate, instructions: [...newTemplate.instructions, val] }); setNewInstructionInput(''); }
                  }}>
                    Add
                  </ForgeButton>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="template-tags" style={{ fontSize: 'var(--text-sm)' }}>
                  Tags
                </Label>
                <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-xsmall)' }}>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input
                      type="text"
                      id="template-tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add a tag and press Enter"
                    />
                  </forge-text-field>
                  <ForgeButton type="button" variant="outlined" onClick={handleAddTag}>
                    Add
                  </ForgeButton>
                </div>
                {newTemplate.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-small)' }}>
                    {newTemplate.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        style={{
                          fontSize: '0.6875rem',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-small)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newTemplate.requiresApproval}
                    onChange={(e) => setNewTemplate({ ...newTemplate, requiresApproval: e.target.checked })}
                  />
                  <span style={{ fontSize: 'var(--text-sm)' }}>Requires approval</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newTemplate.emailNotifications.sendEmail}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        emailNotifications: {
                          ...newTemplate.emailNotifications,
                          sendEmail: e.target.checked,
                        },
                      })
                    }
                  />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Send email?</span>
                </label>

                {newTemplate.emailNotifications.sendEmail && (
                  <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-small)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>When should the email be sent?</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="template-email-timing"
                        value="before"
                        checked={newTemplate.emailNotifications.emailTiming === 'before'}
                        onChange={() =>
                          setNewTemplate({
                            ...newTemplate,
                            emailNotifications: { ...newTemplate.emailNotifications, emailTiming: 'before' },
                          })
                        }
                      />
                      <span style={{ fontSize: 'var(--text-sm)' }}>Before the step, notify that this step is starting</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="template-email-timing"
                        value="after"
                        checked={newTemplate.emailNotifications.emailTiming === 'after'}
                        onChange={() =>
                          setNewTemplate({
                            ...newTemplate,
                            emailNotifications: { ...newTemplate.emailNotifications, emailTiming: 'after' },
                          })
                        }
                      />
                      <span style={{ fontSize: 'var(--text-sm)' }}>After the step, notify once this step is complete</span>
                    </label>
                    <div style={{ marginTop: 'var(--forge-spacing-xsmall)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>Email template</span>
                      <select
                        value={newTemplate.emailNotifications.emailTemplate}
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            emailNotifications: { ...newTemplate.emailNotifications, emailTemplate: e.target.value },
                          })
                        }
                        style={{ width: '100%', marginTop: '4px', padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)', border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)' }}
                      >
                        {INITIAL_EMAIL_TEMPLATES.map((t) => (
                          <option key={t.id} value={t.name}>{t.name} ({t.category})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginTop: 'var(--forge-spacing-xsmall)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>Send email to group</span>
                      <select
                        value={newTemplate.emailNotifications.notifyGroups[0] || ''}
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            emailNotifications: { ...newTemplate.emailNotifications, notifyGroups: e.target.value ? [e.target.value] : [] },
                          })
                        }
                        style={{ width: '100%', marginTop: '4px', padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)', border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)' }}
                      >
                        <option value="">None</option>
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newTemplate.emailNotifications.notifyAssignee}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        emailNotifications: {
                          ...newTemplate.emailNotifications,
                          notifyAssignee: e.target.checked,
                        },
                      })
                    }
                  />
                  <span style={{ fontSize: 'var(--text-sm)' }}>Notify assigned person</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 'var(--forge-spacing-medium)', justifyContent: 'flex-end', marginTop: 'var(--forge-spacing-medium)' }}>
                <ForgeButton variant="outlined" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </ForgeButton>
                <button
                  onClick={handleCreateTemplate}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '0 16px', height: '36px',
                    background: 'var(--brand-blue-dark)', color: '#ffffff',
                    border: 'none', borderRadius: '4px',
                    fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                    cursor: 'pointer', letterSpacing: '0.0125em',
                  }}
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </forge-dialog>

        {/* Edit Template Dialog */}
        {/* @ts-ignore */}
        <forge-dialog ref={editDialogRef}>
          <div style={{ padding: 'var(--forge-spacing-large)', maxWidth: '42rem', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}>Edit Step Template</h2>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-medium)' }}>
              Update the details of this step template
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
              <div>
                <Label style={{ fontSize: 'var(--text-sm)' }}>Template Name *</Label>
                {/* @ts-ignore */}
                <forge-text-field>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="e.g., Emergency Parent Notification" style={{ marginTop: 'var(--forge-spacing-xsmall)' }} />
                </forge-text-field>
              </div>

              <div>
                <Label style={{ fontSize: 'var(--text-sm)' }}>Description *</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Describe what this step does..." rows={3} style={{ marginTop: 'var(--forge-spacing-xsmall)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--forge-spacing-medium)' }}>
                <div>
                  <Label style={{ fontSize: 'var(--text-sm)' }}>Category</Label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value as WorkflowStepTemplate['category'] })} style={{ width: '100%', marginTop: 'var(--forge-spacing-xsmall)', padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)', border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)' }}>
                    {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <Label style={{ fontSize: 'var(--text-sm)' }}>Icon</Label>
                  <select value={editForm.icon} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })} style={{ width: '100%', marginTop: 'var(--forge-spacing-xsmall)', padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)', border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)' }}>
                    {iconOptions.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--forge-spacing-medium)' }}>
                <div>
                  <Label style={{ fontSize: 'var(--text-sm)' }}>Default Assigned Role</Label>
                  <select value={editForm.defaultRole} onChange={(e) => setEditForm({ ...editForm, defaultRole: e.target.value })} style={{ width: '100%', marginTop: 'var(--forge-spacing-xsmall)', padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)', border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)' }}>
                    {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <Label style={{ fontSize: 'var(--text-sm)' }}>Default Duration</Label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input type="text" value={editForm.defaultDuration} onChange={(e) => setEditForm({ ...editForm, defaultDuration: e.target.value })} placeholder="e.g., 30 minutes" style={{ marginTop: 'var(--forge-spacing-xsmall)' }} />
                  </forge-text-field>
                </div>
              </div>

              {/* "What to do next" Instructions */}
              <div>
                <Label style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '4px' }}>
                  "What to do next" Instructions
                </Label>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-xsmall)' }}>
                  These bullet points appear on the step action card to guide the assignee. Leave empty to use the default instructions.
                </p>
                {editForm.instructions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--forge-spacing-small)' }}>
                    {editForm.instructions.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--muted)', borderRadius: '4px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', minWidth: '16px' }}>·</span>
                        <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{item}</span>
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, instructions: editForm.instructions.filter((_, i) => i !== idx) })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--muted-foreground)', display: 'flex' }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)' }}>
                  {/* @ts-ignore */}
                  <forge-text-field style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={editInstructionInput}
                      onChange={(e) => setEditInstructionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = editInstructionInput.trim();
                          if (val) { setEditForm({ ...editForm, instructions: [...editForm.instructions, val] }); setEditInstructionInput(''); }
                        }
                      }}
                      placeholder="Type an instruction and press Enter..."
                    />
                  </forge-text-field>
                  <ForgeButton type="button" variant="outlined" onClick={() => {
                    const val = editInstructionInput.trim();
                    if (val) { setEditForm({ ...editForm, instructions: [...editForm.instructions, val] }); setEditInstructionInput(''); }
                  }}>
                    Add
                  </ForgeButton>
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label style={{ fontSize: 'var(--text-sm)' }}>Tags</Label>
                <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-xsmall)' }}>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input
                      type="text"
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (editTagInput.trim() && !editForm.tags.includes(editTagInput.trim())) {
                            setEditForm({ ...editForm, tags: [...editForm.tags, editTagInput.trim()] });
                            setEditTagInput('');
                          }
                        }
                      }}
                      placeholder="Add a tag and press Enter"
                    />
                  </forge-text-field>
                  <ForgeButton type="button" variant="outlined" onClick={() => {
                    if (editTagInput.trim() && !editForm.tags.includes(editTagInput.trim())) {
                      setEditForm({ ...editForm, tags: [...editForm.tags, editTagInput.trim()] });
                      setEditTagInput('');
                    }
                  }}>Add</ForgeButton>
                </div>
                {editForm.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-small)' }}>
                    {editForm.tags.map(tag => (
                      <Badge key={tag} variant="outline" style={{ fontSize: '0.6875rem', cursor: 'pointer' }} onClick={() => setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag) })}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-small)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.requiresApproval} onChange={(e) => setEditForm({ ...editForm, requiresApproval: e.target.checked })} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>Requires approval</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.emailNotifications.sendEmail} onChange={(e) => setEditForm({ ...editForm, emailNotifications: { ...editForm.emailNotifications, sendEmail: e.target.checked } })} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Send email?</span>
                </label>

                {editForm.emailNotifications.sendEmail && (
                  <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-small)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>When should the email be sent?</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                      <input type="radio" name="edit-email-timing" value="before" checked={editForm.emailNotifications.emailTiming === 'before'} onChange={() => setEditForm({ ...editForm, emailNotifications: { ...editForm.emailNotifications, emailTiming: 'before' } })} />
                      <span style={{ fontSize: 'var(--text-sm)' }}>Before the step, notify that this step is starting</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                      <input type="radio" name="edit-email-timing" value="after" checked={editForm.emailNotifications.emailTiming === 'after'} onChange={() => setEditForm({ ...editForm, emailNotifications: { ...editForm.emailNotifications, emailTiming: 'after' } })} />
                      <span style={{ fontSize: 'var(--text-sm)' }}>After the step, notify once this step is complete</span>
                    </label>
                    <div style={{ marginTop: 'var(--forge-spacing-xsmall)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>Email template</span>
                      <select
                        value={editForm.emailNotifications.emailTemplate}
                        onChange={(e) => setEditForm({ ...editForm, emailNotifications: { ...editForm.emailNotifications, emailTemplate: e.target.value } })}
                        style={{ width: '100%', marginTop: '4px', padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)', border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)' }}
                      >
                        {INITIAL_EMAIL_TEMPLATES.map((t) => (
                          <option key={t.id} value={t.name}>{t.name} ({t.category})</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginTop: 'var(--forge-spacing-xsmall)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>Send email to group</span>
                      <select
                        value={editForm.emailNotifications.notifyGroups[0] || ''}
                        onChange={(e) => setEditForm({ ...editForm, emailNotifications: { ...editForm.emailNotifications, notifyGroups: e.target.value ? [e.target.value] : [] } })}
                        style={{ width: '100%', marginTop: '4px', padding: 'var(--forge-spacing-small)', borderRadius: 'var(--forge-shape-medium)', border: '1px solid var(--border)', fontSize: 'var(--text-base)', background: 'var(--input-background)' }}
                      >
                        <option value="">None</option>
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.emailNotifications.notifyAssignee} onChange={(e) => setEditForm({ ...editForm, emailNotifications: { ...editForm.emailNotifications, notifyAssignee: e.target.checked } })} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>Notify assigned person</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 'var(--forge-spacing-medium)', justifyContent: 'flex-end', marginTop: 'var(--forge-spacing-medium)' }}>
                <ForgeButton variant="outlined" onClick={() => { setIsEditDialogOpen(false); setEditingTemplate(null); }}>Cancel</ForgeButton>
                <button
                  onClick={handleSaveEdit}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0 16px', height: '36px', background: 'var(--brand-blue-dark)', color: '#ffffff', border: 'none', borderRadius: '4px', fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </forge-dialog>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--forge-spacing-medium)',
          marginBottom: 'var(--forge-spacing-large)',
        }}
      >
        <ForgeCard>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)' }}>
              <Library className="h-8 w-8" style={{ color: 'var(--brand-blue-dark)' }} />
              <div>
                <div
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--forge-font-weight-medium)',
                  }}
                >
                  {allTemplates.length}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>Total Templates</div>
              </div>
            </div>
          </div>
        </ForgeCard>

        <ForgeCard>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)' }}>
              <CheckCircle className="h-8 w-8" style={{ color: 'var(--brand-olive-medium)' }} />
              <div>
                <div
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--forge-font-weight-medium)',
                  }}
                >
                  {workflowStepTemplates.length}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>Built-in Templates</div>
              </div>
            </div>
          </div>
        </ForgeCard>

        <ForgeCard>
          <div style={{ padding: 'var(--forge-spacing-medium)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)' }}>
              <Plus className="h-8 w-8" style={{ color: 'var(--brand-blue-medium)' }} />
              <div>
                <div
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--forge-font-weight-medium)',
                  }}
                >
                  {customTemplates.length}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>Custom Templates</div>
              </div>
            </div>
          </div>
        </ForgeCard>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {/* @ts-ignore */}
          <forge-text-field>
            <input
              type="text"
              placeholder="Search step templates by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
          </forge-text-field>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = filterCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setFilterCategory(category)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', height: '32px',
                  background: active ? 'var(--brand-blue-dark)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--foreground)',
                  border: `1px solid ${active ? 'var(--brand-blue-dark)' : 'var(--border)'}`,
                  borderRadius: '4px',
                  fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: active ? 500 : 400,
                  cursor: 'pointer',
                }}
              >
                {category}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '20px', height: '18px', padding: '0 5px',
                  borderRadius: '999px',
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--muted)',
                  color: active ? '#ffffff' : 'var(--muted-foreground)',
                  fontSize: '0.6875rem', fontWeight: 500,
                }}>
                  {getCategoryCount(category)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const IconComponent = template.icon;
          const isTemplateBuiltIn = isBuiltIn(template.id);

          return (
            <ForgeCard
              key={template.id}
              style={{ boxShadow: 'var(--forge-elevation-1)' }}
            >
              <div style={{ padding: 'var(--forge-spacing-medium)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-small)' }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--forge-spacing-small)' }}>
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--brand-blue-dark)', color: '#ffffff' }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 'var(--forge-spacing-small)' }}>
                        <h3
                          className="font-medium"
                          style={{ fontSize: 'var(--text-sm)', lineHeight: '1.4' }}
                        >
                          {template.name}
                        </h3>
                        <div style={{ display: 'flex', gap: 'var(--forge-spacing-xsmall)' }}>
                          <ForgeButton
                            variant="flat"
                            size="sm"
                            style={{ padding: 'var(--forge-spacing-xsmall)' }}
                            title="Edit template"
                            onClick={() => {
                              setEditingTemplate(template);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </ForgeButton>
                          {!isTemplateBuiltIn && (
                            <ForgeButton
                              variant="flat"
                              size="sm"
                              style={{ padding: 'var(--forge-spacing-xsmall)', color: 'var(--destructive)' }}
                              title="Delete template"
                              onClick={() => {
                                if (onDeleteTemplate) {
                                  onDeleteTemplate(template.id);
                                  toast.success('Template deleted');
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </ForgeButton>
                          )}
                        </div>
                      </div>
                      <p
                        className="text-muted-foreground"
                        style={{ fontSize: 'var(--text-xs)', lineHeight: '1.4', marginTop: 'var(--forge-spacing-xsmall)' }}
                      >
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={getCategoryColor(template.category)}
                      style={{ fontSize: '0.6875rem' }}
                    >
                      {template.category}
                    </Badge>
                    {isTemplateBuiltIn && (
                      <Badge variant="outline" style={{ fontSize: '0.6875rem', borderColor: 'var(--brand-olive-medium)', color: 'var(--brand-olive-dark)' }}>
                        Built-in
                      </Badge>
                    )}
                    <Badge variant="outline" style={{ fontSize: '0.6875rem' }}>
                      <Clock className="h-3 w-3 mr-1" />
                      {template.defaultDuration}
                    </Badge>
                    <Badge variant="outline" style={{ fontSize: '0.6875rem' }}>
                      <UserCheck className="h-3 w-3 mr-1" />
                      {template.defaultGroup}
                    </Badge>
                    {template.requiresApproval && (
                      <Badge variant="outline" style={{ fontSize: '0.6875rem' }}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Approval Required
                      </Badge>
                    )}
                  </div>

                  {template.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--forge-spacing-xsmall)' }}>
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          style={{
                            fontSize: '0.625rem',
                            background: 'var(--muted)',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge
                          variant="secondary"
                          style={{
                            fontSize: '0.625rem',
                            background: 'var(--muted)',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ForgeCard>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div
          className="text-center py-12"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p style={{ fontSize: 'var(--text-base)' }}>No step templates found matching your search.</p>
          <p style={{ fontSize: 'var(--text-sm)', marginTop: '8px' }}>
            Try adjusting your search or create a new template.
          </p>
        </div>
      )}
    </div>
  );
}
