import React, { useState, useEffect, useRef } from 'react';
import { ForgeCard, ForgeButton } from '@tylertech/forge-react';
import {
  defineCardComponent,
  defineButtonComponent,
  defineTextFieldComponent,
  defineDialogComponent,
  defineBadgeComponent,
  defineTooltipComponent,
  defineIconComponent,
  definePaginatorComponent,
} from '@tylertech/forge';
defineCardComponent();
defineButtonComponent();
defineTextFieldComponent();
defineDialogComponent();
defineBadgeComponent();
defineTooltipComponent();
defineIconComponent();
definePaginatorComponent();
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { workflows as importedWorkflows, Workflow, WorkflowStep, resolveWorkflowOwner } from '../../data/workflows';
import { INCIDENT_TYPES, INCIDENT_CATEGORIES, getSubjectLabel } from '../incidents/IncidentTypes';
import { WorkflowStepLibrary, WorkflowStepTemplate } from './WorkflowStepLibrary';
import { StepTemplateManager } from './StepTemplateManager';
import { ForgeMultiSelect } from '../ui/forge-multiselect';
import { colFilterStyle, ColumnSelect } from '../shared/ColumnFilters';

interface WorkflowsPageProps {
  onNavigate: (page: string) => void;
  onNavigateToWorkflowBuilder: (workflow: any) => void;
}

export function WorkflowsPage({ onNavigate, onNavigateToWorkflowBuilder }: WorkflowsPageProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'workflows' | 'templates'>('workflows');
  
  // Custom step templates
  const [customStepTemplates, setCustomStepTemplates] = useState<WorkflowStepTemplate[]>([]);
  
  // A workflow covers exactly one event, so the category shown here is that
  // event's category. Category describes what happened, so it belongs to the
  // event and is never chosen separately on the workflow.
  const categoryOfEvent = (eventRef?: string) =>
    INCIDENT_TYPES.find((t) => t.label === eventRef || t.id === eventRef)?.category ?? '';

  // Convert imported workflows to match local format
  const convertedWorkflows: any[] = importedWorkflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    category: categoryOfEvent(w.incidentTypes?.[0]),
    severity: w.severityLevels?.[0] || 'Medium',
    ownerRole: w.ownerRole,
    ownerName: w.ownerName,
    owner: resolveWorkflowOwner(w),
    incidentTypes: w.incidentTypes,
    steps: w.steps,
    active: w.isActive,
    createdDate: w.createdDate,
    lastModified: w.lastModified,
  }));

  const [workflows, setWorkflows] = useState<any[]>(convertedWorkflows);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  // The Forge build filters this grid on severity too.
  const [filterSeverities, setFilterSeverities] = useState<string[]>([]);
  const paginatorRef = useRef<HTMLElement>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [expandedWorkflowId, setExpandedWorkflowId] = useState<string | null>(null);

  const createDialogRef = useRef<HTMLElement>(null);
  const builderDialogRef = useRef<HTMLElement>(null);

  // Sync create dialog open state
  useEffect(() => { const el = createDialogRef.current as any; if (!el) return; el.open = isCreateDialogOpen; }, [isCreateDialogOpen]);
  useEffect(() => { const el = createDialogRef.current as any; if (!el) return; const handler = () => setIsCreateDialogOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  // Sync builder dialog open state
  useEffect(() => { const el = builderDialogRef.current as any; if (!el) return; el.open = isBuilderOpen; }, [isBuilderOpen]);
  useEffect(() => { const el = builderDialogRef.current as any; if (!el) return; const handler = () => setIsBuilderOpen(false); el.addEventListener('forge-dialog-close', handler); return () => el.removeEventListener('forge-dialog-close', handler); }, []);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    severity: '',
    incidentTypes: [] as string[],
    associatedIncidentType: '',
  });

  const categories = Object.values(INCIDENT_CATEGORIES);
  const severityLevels = ['Critical', 'High', 'Medium', 'Low'];

  // Group incident types by category for the selector
  const studentIncidentTypes = INCIDENT_TYPES.filter(t => t.applicableTo === 'student');
  const nonStudentIncidentTypes = INCIDENT_TYPES.filter(t => t.applicableTo !== 'student');

  // Compute which incident type labels are already linked to an active workflow
  const linkedIncidentTypeLabels = new Set(
    workflows.flatMap((w: any) => w.incidentTypes || [])
  );

  const customWorkflows = workflows;

  const filteredWorkflows = customWorkflows.filter((workflow) => {
    const matchesSearch =
      searchTerm === '' ||
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategories.length === 0 || filterCategories.includes(workflow.category);

    const matchesActive =
      filterStatuses.length === 0 ||
      (filterStatuses.includes('Active') && workflow.active) ||
      (filterStatuses.includes('Inactive') && !workflow.active);

    const matchesSeverity =
      filterSeverities.length === 0 || filterSeverities.includes(workflow.severity);

    return matchesSearch && matchesCategory && matchesActive && matchesSeverity;
  })
    // Rows read alphabetically by name rather than in seeded order.
    .sort((a, b) => a.name.localeCompare(b.name));

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Paginator changes, via a ref because reactify-wc only forwards custom
  // events for hyphenated props.
  useEffect(() => {
    const el = paginatorRef.current;
    if (!el) return;
    const onChange = (evt: any) => {
      const d = evt.detail ?? {};
      if (typeof d.pageSize === 'number') setRowsPerPage(d.pageSize);
      if (typeof d.pageIndex === 'number') setCurrentPage(d.pageIndex + 1);
    };
    el.addEventListener('forge-paginator-change', onChange);
    return () => el.removeEventListener('forge-paginator-change', onChange);
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(filteredWorkflows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedWorkflows = filteredWorkflows.slice(startIndex, startIndex + rowsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategories, filterStatuses, filterSeverities, rowsPerPage]);

  const handleCreateWorkflow = () => {
    const selectedType = INCIDENT_TYPES.find(t => t.id === newWorkflow.associatedIncidentType);
    const workflow: Workflow = {
      id: Date.now().toString(),
      name: newWorkflow.name,
      description: newWorkflow.description,
      category: categoryOfEvent(selectedType?.label),
      severity: newWorkflow.severity,
      incidentTypes: selectedType ? [selectedType.id] : newWorkflow.incidentTypes,
      steps: [],
      active: true,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
    };

    setWorkflows([...workflows, workflow]);
    setIsCreateDialogOpen(false);
    setSelectedWorkflow(workflow);
    setIsBuilderOpen(true);

    setNewWorkflow({
      name: '',
      description: '',
      severity: '',
      incidentTypes: [],
      associatedIncidentType: '',
    });
  };

  const handleDuplicateWorkflow = (workflow: Workflow) => {
    const duplicated: Workflow = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (Copy)`,
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
    };

    setWorkflows([...workflows, duplicated]);
  };

  const handleDeleteWorkflow = (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      setWorkflows(workflows.filter((w) => w.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === id ? { ...w, active: !w.active } : w
      )
    );
  };

  const handleOpenBuilder = (workflow: Workflow) => {
    onNavigateToWorkflowBuilder(workflow);
  };

  const toggleIncidentType = (type: string) => {
    setNewWorkflow((prev) => ({
      ...prev,
      incidentTypes: prev.incidentTypes.includes(type)
        ? prev.incidentTypes.filter((t) => t !== type)
        : [...prev.incidentTypes, type],
    }));
  };

  return (
    <div style={{ padding: 'var(--forge-spacing-xlarge)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <h1
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--forge-font-weight-medium)',
            marginBottom: 'var(--forge-spacing-small)',
          }}
        >
          Workflow Management
        </h1>
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)',
          }}
        >
          Create and manage custom workflows for different incident types and severities
        </p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <div 
          style={{ 
            display: 'flex', 
            gap: 'var(--forge-spacing-small)',
            borderBottom: '2px solid var(--border)',
          }}
        >
          <button
            onClick={() => setActiveTab('workflows')}
            style={{
              padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--forge-font-weight-medium)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'workflows' ? '3px solid var(--brand-blue-dark)' : '3px solid transparent',
              color: activeTab === 'workflows' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            <forge-icon name="account_tree" style={{ fontSize: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}></forge-icon>
            Workflows
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--forge-font-weight-medium)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: activeTab === 'templates' ? '3px solid var(--brand-blue-dark)' : '3px solid transparent',
              color: activeTab === 'templates' ? 'var(--brand-blue-dark)' : 'var(--muted-foreground)',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            <forge-icon name="description" style={{ fontSize: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}></forge-icon>
            Step Templates
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'workflows' && (
        <>
          {/* Stats Cards */}
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
                  <forge-icon name="description" style={{ fontSize: '32px', color: 'var(--brand-blue-dark)' }}></forge-icon>
                  <div>
                    <div
                      style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 'var(--forge-font-weight-medium)',
                      }}
                    >
                      {workflows.length}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                      Total Workflows
                    </div>
                  </div>
                </div>
              </div>
            </ForgeCard>

            <ForgeCard>
              <div style={{ padding: 'var(--forge-spacing-medium)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)' }}>
                  <forge-icon name="check_circle" style={{ fontSize: '32px', color: 'var(--brand-olive-medium)' }}></forge-icon>
                  <div>
                    <div
                      style={{
                        fontSize: 'var(--text-2xl)',
                        fontWeight: 'var(--forge-font-weight-medium)',
                      }}
                    >
                      {workflows.filter((w) => w.active).length}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                      Active Workflows
                    </div>
                  </div>
                </div>
              </div>
            </ForgeCard>
          </div>

          {/* Filters and Actions */}
          <ForgeCard style={{ marginBottom: 'var(--forge-spacing-large)' }}>
            <div style={{ padding: 'var(--forge-spacing-medium)' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--forge-spacing-medium)',
                  alignItems: 'center',
                }}
              >
                <ForgeButton onClick={() => setIsCreateDialogOpen(true)}>
                  <forge-icon slot="start" name="add"></forge-icon>
                  Create Workflow
                </ForgeButton>
              </div>
            </div>
          </ForgeCard>

          {/* Workflows Table */}
          <ForgeCard>
            <div style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="forge-table" style={{ fontFamily: 'var(--forge-font-family)' }}>
                  <thead>
                    <tr>
                      {/* Column names and order copied from the Forge build:
                          Name, Category, Severity, Status. Incident Assignee is
                          ours and sits after Status, and Actions has no header
                          text there either. */}
                      <th className="forge-table-cell forge-table-cell--header" style={{ whiteSpace: 'nowrap' }}>Name</th>
                      <th className="forge-table-cell forge-table-cell--header" style={{ whiteSpace: 'nowrap' }}>Category</th>
                      <th className="forge-table-cell forge-table-cell--header" style={{ whiteSpace: 'nowrap' }}>Severity</th>
                      <th className="forge-table-cell forge-table-cell--header" style={{ whiteSpace: 'nowrap' }}>Status</th>
                      <th className="forge-table-cell forge-table-cell--header" style={{ whiteSpace: 'nowrap' }}>Incident Assignee</th>
                      <th className="forge-table-cell forge-table-cell--header" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Steps</th>
                      <th className="forge-table-cell forge-table-cell--header" style={{ whiteSpace: 'nowrap' }}>Last Modified</th>
                      <th className="forge-table-cell forge-table-cell--header" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}></th>
                    </tr>
                  {/* Filter row, matching the Forge build: text on Name,
                      selects on Category, Severity and Status, nothing on the
                      derived or action columns. */}
                  <tr>
                    <th className="forge-table-cell forge-table-cell--header">
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filter Name..."
                        aria-label="Filter by workflow name or description"
                        style={colFilterStyle}
                      />
                    </th>
                    <th className="forge-table-cell forge-table-cell--header">
                      <ColumnSelect
                        placeholder="Filter Category..."
                        options={categories}
                        selected={filterCategories}
                        onChange={setFilterCategories}
                      />
                    </th>
                    <th className="forge-table-cell forge-table-cell--header">
                      <ColumnSelect
                        placeholder="Filter Severity..."
                        options={severityLevels}
                        selected={filterSeverities}
                        onChange={setFilterSeverities}
                      />
                    </th>
                    <th className="forge-table-cell forge-table-cell--header">
                      <ColumnSelect
                        placeholder="Filter Status..."
                        options={['Active', 'Inactive']}
                        selected={filterStatuses}
                        onChange={setFilterStatuses}
                      />
                    </th>
                    <th className="forge-table-cell forge-table-cell--header"></th>
                    <th className="forge-table-cell forge-table-cell--header"></th>
                    <th className="forge-table-cell forge-table-cell--header"></th>
                    <th className="forge-table-cell forge-table-cell--header"></th>
                  </tr>
                  </thead>
                  <tbody>
                    {paginatedWorkflows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="forge-table-cell" style={{ padding: 'var(--forge-spacing-xlarge)', textAlign: 'center' }}>
                          <forge-icon name="warning" style={{ fontSize: '48px', color: 'var(--muted-foreground)', margin: '0 auto var(--forge-spacing-medium)', display: 'block' }}></forge-icon>
                          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--muted-foreground)', fontFamily: 'var(--forge-font-family)' }}>
                            No workflows found matching your criteria
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedWorkflows.map((workflow) => (
                        <tr
                          key={workflow.id}
                          className="forge-table-row"
                          style={{
                            opacity: workflow.active ? 1 : 0.6,
                          }}
                        >
                          <td className="forge-table-cell">
                            {/* The identifier sits beside the name so a workflow
                                referenced from Admin can be found here. */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--forge-spacing-xsmall)', fontFamily: 'var(--forge-font-family)' }}>
                              <span style={{ fontWeight: 'var(--forge-font-weight-medium)', fontSize: 'var(--text-base)' }}>
                                {workflow.name}
                              </span>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                                {workflow.id}
                              </span>
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontFamily: 'var(--forge-font-family)', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {workflow.description}
                            </div>
                          </td>
                          <td className="forge-table-cell">
                            <forge-badge theme="default">{workflow.category}</forge-badge>
                          </td>
                          <td className="forge-table-cell">
                            <forge-badge
                              theme={workflow.severity === 'Critical' ? 'danger' : workflow.severity === 'High' ? 'error' : workflow.severity === 'Medium' ? 'warning' : 'info'}
                              strong
                            >
                              {workflow.severity}
                            </forge-badge>
                          </td>
                          <td className="forge-table-cell">
                            <forge-badge theme={workflow.active ? 'success' : 'default'}>
                              {workflow.active ? 'Active' : 'Inactive'}
                            </forge-badge>
                          </td>
                          {/* Who an incident on this workflow is assigned to at
                              creation. The role is what is configured; the name
                              is who currently holds it. */}
                          <td className="forge-table-cell">
                            {workflow.owner ? (
                              <>
                                <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-base)' }}>
                                  {workflow.owner}
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontFamily: 'var(--forge-font-family)', marginTop: '2px' }}>
                                  {workflow.ownerName ? 'Named on this workflow' : workflow.ownerRole}
                                </div>
                              </>
                            ) : workflow.ownerRole ? (
                              <>
                                <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--text-base)' }}>
                                  {workflow.ownerRole}
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontFamily: 'var(--forge-font-family)', marginTop: '2px' }}>
                                  Whoever holds the role
                                </div>
                              </>
                            ) : (
                              <span style={{ fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)' }}>
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="forge-table-cell" style={{ textAlign: 'center', fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)' }}>
                            {workflow.steps.length}
                          </td>
                          <td className="forge-table-cell" style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--forge-font-family)', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                            {workflow.lastModified}
                          </td>
                          <td className="forge-table-cell" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 'var(--forge-spacing-xxsmall)', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleOpenBuilder(workflow)}
                                title="Edit workflow"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: 'var(--forge-text-secondary, #6b7280)', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <forge-icon name="settings" style={{ fontSize: '16px' }}></forge-icon>
                              </button>
                              <button
                                onClick={() => handleDuplicateWorkflow(workflow)}
                                title="Duplicate workflow"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: 'var(--forge-text-secondary, #6b7280)', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <forge-icon name="content_copy" style={{ fontSize: '16px' }}></forge-icon>
                              </button>
                              <button
                                onClick={() => handleToggleActive(workflow.id)}
                                title={workflow.active ? 'Set to Inactive' : 'Set to Active'}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: 'var(--forge-text-secondary, #6b7280)', display: 'inline-flex', alignItems: 'center' }}
                              >
                                {workflow.active ? (
                                  <forge-icon name="radio_button_unchecked" style={{ fontSize: '16px' }}></forge-icon>
                                ) : (
                                  <forge-icon name="check_circle" style={{ fontSize: '16px' }}></forge-icon>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteWorkflow(workflow.id)}
                                title="Delete workflow"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: 'var(--destructive)', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <forge-icon name="delete" style={{ fontSize: '16px' }}></forge-icon>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* forge-paginator, as the Forge build uses on this grid. */}
              <div style={{ padding: 'var(--forge-spacing-small) var(--forge-spacing-medium)', borderTop: '1px solid var(--border)' }}>
                {/* @ts-ignore */}
                <forge-paginator
                  ref={paginatorRef}
                  total={filteredWorkflows.length}
                  page-size={rowsPerPage}
                  page-index={currentPage - 1}
                  page-size-options="10,25,50"
                  offset={(currentPage - 1) * rowsPerPage}
                  first-last
                ></forge-paginator>
              </div>
            </div>
          </ForgeCard>

          {/* Create Workflow Dialog */}
          {/* @ts-ignore */}
          <forge-dialog ref={createDialogRef}>
            <div style={{ padding: 'var(--forge-spacing-large)' }}>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}>Create New Workflow</h2>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-medium)' }}>
                Define a new workflow for handling specific incident types
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
                <div>
                  <Label htmlFor="workflow-name" style={{ fontSize: 'var(--text-sm)' }}>
                    Workflow Name
                  </Label>
                  {/* @ts-ignore */}
                  <forge-text-field>
                    <input
                      type="text"
                      id="workflow-name"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                      placeholder="e.g., Bus Accident Response"
                      style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                    />
                  </forge-text-field>
                </div>

                <div>
                  <Label htmlFor="workflow-description" style={{ fontSize: 'var(--text-sm)' }}>
                    Description
                  </Label>
                  <Textarea
                    id="workflow-description"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    placeholder="Describe when this workflow should be used..."
                    rows={3}
                    style={{ marginTop: 'var(--forge-spacing-xsmall)' }}
                  />
                </div>

                <div>
                  <Label style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--forge-spacing-small)', display: 'block' }}>
                    Severity Level
                  </Label>
                  <select
                    value={newWorkflow.severity}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, severity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--forge-spacing-small)',
                      borderRadius: 'var(--forge-shape-medium)',
                      border: '1px solid var(--border)',
                      fontSize: 'var(--text-base)',
                      fontFamily: 'var(--forge-font-family)',
                      background: 'var(--input-background)',
                    }}
                  >
                    <option value="">-- Select severity --</option>
                    {severityLevels.map((sev) => (
                      <option key={sev} value={sev}>
                        {sev}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--forge-spacing-small)', display: 'block' }}>
                    Associated Incident Type <span style={{ color: 'var(--destructive)' }}>*</span>
                  </Label>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-small)' }}>
                    Each workflow is mapped to a specific incident type. Select the incident type this workflow will handle.
                  </p>
                  {(() => {
                    const unlinkedCount = INCIDENT_TYPES.filter(t => !linkedIncidentTypeLabels.has(t.label) && !linkedIncidentTypeLabels.has(t.id)).length;
                    return unlinkedCount > 0 ? (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-olive-dark)', marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)', display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xxsmall)' }}>
                        <forge-icon name="warning" style={{ fontSize: '12px' }}></forge-icon>
                        {unlinkedCount} incident type{unlinkedCount > 1 ? 's' : ''} available (not yet linked to a workflow). Linked types are greyed out.
                      </p>
                    ) : (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)', fontStyle: 'italic' }}>
                        All incident types are currently linked to a workflow.
                      </p>
                    );
                  })()}
                  <select
                    value={newWorkflow.associatedIncidentType}
                    onChange={(e) => {
                      const selectedType = INCIDENT_TYPES.find(t => t.id === e.target.value);
                      setNewWorkflow({
                        ...newWorkflow,
                        associatedIncidentType: e.target.value,
                        severity: selectedType ? selectedType.defaultSeverity : newWorkflow.severity,
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: 'var(--forge-spacing-small)',
                      borderRadius: 'var(--forge-shape-medium)',
                      border: '1px solid var(--border)',
                      fontSize: 'var(--text-base)',
                      fontFamily: 'var(--forge-font-family)',
                      background: 'var(--input-background)',
                    }}
                  >
                    <option value="">-- Select an incident type --</option>
                    <optgroup label="Student Events">
                      {studentIncidentTypes.map((t) => {
                        const isLinked = linkedIncidentTypeLabels.has(t.label) || linkedIncidentTypeLabels.has(t.id);
                        return (
                          <option key={t.id} value={t.id} disabled={isLinked} style={isLinked ? { color: 'var(--muted-foreground)' } : {}}>
                            {t.label} ({t.category}), {t.defaultSeverity}{isLinked ? '  ✓ Linked' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="Non-Student Events">
                      {nonStudentIncidentTypes.map((t) => {
                        const isLinked = linkedIncidentTypeLabels.has(t.label) || linkedIncidentTypeLabels.has(t.id);
                        return (
                          <option key={t.id} value={t.id} disabled={isLinked} style={isLinked ? { color: 'var(--muted-foreground)' } : {}}>
                            {t.label} ({t.category}), {t.defaultSeverity}{isLinked ? '  ✓ Linked' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                  {newWorkflow.associatedIncidentType && (() => {
                    const selectedType = INCIDENT_TYPES.find(t => t.id === newWorkflow.associatedIncidentType);
                    return selectedType ? (
                      <div style={{
                        marginTop: 'var(--forge-spacing-small)',
                        padding: 'var(--forge-spacing-small)',
                        background: 'var(--input-background)',
                        borderRadius: 'var(--forge-shape-medium)',
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', gap: 'var(--forge-spacing-xsmall)', marginBottom: 'var(--forge-spacing-xxsmall)', flexWrap: 'wrap' }}>
                          <forge-badge theme={selectedType.applicableTo === 'student' ? 'info-primary' : 'success'}>
                            {getSubjectLabel(selectedType.applicableTo)}
                          </forge-badge>
                          <forge-badge theme="default">{selectedType.category}</forge-badge>
                          <forge-badge
                            theme={selectedType.defaultSeverity === 'Critical' ? 'danger' : selectedType.defaultSeverity === 'High' ? 'error' : selectedType.defaultSeverity === 'Medium' ? 'warning' : 'info'}
                            strong
                          >
                            {selectedType.defaultSeverity}
                          </forge-badge>
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', margin: 0 }}>
                          {selectedType.description}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', marginTop: 'var(--forge-spacing-medium)' }}>
                  <ForgeButton
                    variant="outlined"
                    onClick={() => setIsCreateDialogOpen(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </ForgeButton>
                  <ForgeButton
                    onClick={handleCreateWorkflow}
                    disabled={!newWorkflow.name || !newWorkflow.severity || !newWorkflow.associatedIncidentType}
                    style={{ flex: 1 }}
                  >
                    Create & Build Steps
                  </ForgeButton>
                </div>
              </div>
            </div>
          </forge-dialog>

          {/* Workflow Builder Dialog */}
          {selectedWorkflow && (
            <>
              {/* @ts-ignore */}
              <forge-dialog ref={builderDialogRef}>
                <div style={{ padding: 'var(--forge-spacing-large)', maxWidth: '800px' }}>
                  <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-xsmall)' }}>
                    Workflow Builder: {selectedWorkflow.name}
                  </h2>
                  <p style={{ fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', marginBottom: 'var(--forge-spacing-medium)' }}>
                    Define the steps for this workflow
                  </p>

                  <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
                      {selectedWorkflow.description}
                    </p>
                  </div>

                  <ForgeButton
                    onClick={() => {
                      setIsBuilderOpen(false);
                      onNavigateToWorkflowBuilder(selectedWorkflow);
                    }}
                    style={{ width: '100%' }}
                  >
                    <forge-icon slot="start" name="settings"></forge-icon>
                    Open Advanced Workflow Builder
                  </ForgeButton>
                </div>
              </forge-dialog>
            </>
          )}
        </>
      )}

      {activeTab === 'templates' && (
        <>
          {/* Step Templates Manager */}
          <StepTemplateManager
            customTemplates={customStepTemplates}
            onAddTemplate={(template) => setCustomStepTemplates([...customStepTemplates, template])}
            onEditTemplate={(template) => {
              setCustomStepTemplates(
                customStepTemplates.map((t) => (t.id === template.id ? template : t))
              );
            }}
            onDeleteTemplate={(templateId) => {
              setCustomStepTemplates(customStepTemplates.filter((t) => t.id !== templateId));
            }}
          />
        </>
      )}
    </div>
  );
}