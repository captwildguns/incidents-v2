import React, { useState } from 'react';
import { ForgeCard, ForgeButton } from '@tylertech/forge-react';
import { defineCardComponent, defineButtonComponent, defineTextFieldComponent } from '@tylertech/forge';
defineCardComponent();
defineButtonComponent();
defineTextFieldComponent();
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { CheckCircle, Circle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { Workflow, WorkflowStep } from '../../data/workflows';

interface DefaultWorkflowComponentProps {
  workflow: Workflow;
  incidentId: string;
  onUpdateStep: (stepId: string, status: string, comments?: string, followUpAction?: string) => void;
}

export function DefaultWorkflowComponent({ workflow, incidentId, onUpdateStep }: DefaultWorkflowComponentProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [stepComments, setStepComments] = useState<{ [key: string]: string }>({});
  const [followUpAction, setFollowUpAction] = useState<{ [key: string]: string }>({});

  const currentStep = workflow.steps.find(
    (step) => step.status === 'In Progress' || (step.status === 'Not Started' && !workflow.steps.slice(0, step.order - 1).some(s => s.status !== 'Completed'))
  );

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5" style={{ color: 'var(--brand-olive-dark)' }} />;
      case 'In Progress':
        return <Clock className="h-5 w-5" style={{ color: 'var(--brand-blue-medium)' }} />;
      default:
        return <Circle className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }} />;
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'Completed':
        return <Badge style={{ background: 'var(--brand-olive-dark)', color: 'white' }}>Completed</Badge>;
      case 'In Progress':
        return <Badge style={{ background: 'var(--brand-blue-medium)', color: 'white' }}>In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const handleCompleteStep = (step: WorkflowStep) => {
    const comments = stepComments[step.id] || '';
    const action = followUpAction[step.id] || '';
    
    // Mark step as completed
    onUpdateStep(step.id, 'Completed', comments, action);
    
    // Clear form
    setStepComments({ ...stepComments, [step.id]: '' });
    setFollowUpAction({ ...followUpAction, [step.id]: '' });
    setExpandedStep(null);
    
    // Move to next step
    const nextStep = workflow.steps.find(s => s.order === step.order + 1);
    if (nextStep) {
      onUpdateStep(nextStep.id, 'In Progress');
    }
  };

  const handleStartStep = (step: WorkflowStep) => {
    onUpdateStep(step.id, 'In Progress');
    setExpandedStep(step.id);
  };

  return (
    <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
      <div style={{ padding: 'var(--forge-spacing-medium)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="forge-typography--heading4" style={{ marginBottom: 'var(--forge-spacing-xsmall)' }}>
              {workflow.name}
            </h3>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--muted-foreground)',
              margin: 0,
              fontFamily: 'Roboto, sans-serif'
            }}>
              {workflow.description}
            </p>
          </div>
          {currentStep && (
            <Badge 
              style={{ 
                background: 'var(--brand-blue-medium)', 
                color: 'white',
                fontSize: 'var(--text-sm)',
                padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-small)'
              }}
            >
              Current: {currentStep.name}
            </Badge>
          )}
        </div>
        <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
          {workflow.steps.map((step, index) => {
            const isExpanded = expandedStep === step.id;
            const isCurrentStep = currentStep?.id === step.id;
            const canStart = step.status === 'Not Started' && 
                           (index === 0 || workflow.steps[index - 1].status === 'Completed');
            
            return (
              <div 
                key={step.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--forge-shape-medium)',
                  padding: 'var(--forge-spacing-medium)',
                  background: isCurrentStep ? 'var(--accent)' : 'transparent',
                  borderLeft: isCurrentStep ? '4px solid var(--brand-blue-medium)' : '4px solid transparent',
                }}
              >
                {/* Step Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--forge-spacing-small)' }}>
                  {getStatusIcon(step.status)}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)', marginBottom: 'var(--forge-spacing-xsmall)' }}>
                      <span style={{ 
                        fontSize: 'var(--text-base)', 
                        fontWeight: 'var(--font-weight-medium)',
                        fontFamily: 'Roboto, sans-serif',
                        color: 'var(--foreground)'
                      }}>
                        {step.order}. {step.name}
                      </span>
                      {getStatusBadge(step.status)}
                    </div>
                    
                    <p style={{ 
                      fontSize: 'var(--text-sm)', 
                      color: 'var(--muted-foreground)', 
                      margin: 0,
                      marginBottom: 'var(--forge-spacing-xsmall)',
                      fontFamily: 'Roboto, sans-serif'
                    }}>
                      {step.description}
                    </p>
                    
                    <div style={{ display: 'flex', gap: 'var(--forge-spacing-medium)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                      <span style={{ fontFamily: 'Roboto, sans-serif' }}>
                        <strong>Assigned Group:</strong> {step.assignedRole}
                      </span>
                      <span style={{ fontFamily: 'Roboto, sans-serif' }}>
                        <strong>Est. Duration:</strong> {step.estimatedDuration}
                      </span>
                    </div>

                    {/* Completed Step Info */}
                    {step.status === 'Completed' && step.completedBy && (
                      <div style={{ 
                        marginTop: 'var(--forge-spacing-small)',
                        padding: 'var(--forge-spacing-small)',
                        background: 'var(--muted)',
                        borderRadius: 'var(--forge-shape-small)',
                        fontSize: 'var(--text-xs)'
                      }}>
                        <div style={{ fontFamily: 'Roboto, sans-serif', color: 'var(--foreground)' }}>
                          <strong>Completed by:</strong> {step.completedBy} on {step.completedDate}
                        </div>
                        {step.comments && (
                          <div style={{ marginTop: 'var(--forge-spacing-xsmall)', fontFamily: 'Roboto, sans-serif', color: 'var(--muted-foreground)' }}>
                            <strong>Notes:</strong> {step.comments}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div>
                    {step.status === 'Not Started' && canStart && (
                      <ForgeButton
                        size="sm"
                        variant="outlined"
                        onClick={() => handleStartStep(step)}
                        style={{ fontFamily: 'Roboto, sans-serif' }}
                      >
                        Start Step
                      </ForgeButton>
                    )}
                    {step.status === 'In Progress' && !isExpanded && (
                      <button
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '0 12px', height: '32px',
                          background: 'var(--brand-blue-medium)',
                          color: '#ffffff',
                          border: 'none', borderRadius: '4px',
                          fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                          cursor: 'pointer', letterSpacing: '0.0125em',
                        }}
                        onClick={() => setExpandedStep(step.id)}
                      >
                        Complete
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Step Form */}
                {isExpanded && step.status === 'In Progress' && (
                  <div style={{ 
                    marginTop: 'var(--forge-spacing-medium)',
                    paddingTop: 'var(--forge-spacing-medium)',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
                      {/* Follow-up Action Selection (Step 2 only) */}
                      {step.order === 2 && (
                        <div>
                          <Label htmlFor={`follow-up-${step.id}`} style={{ fontFamily: 'Roboto, sans-serif' }}>
                            Determine Follow-up Action *
                          </Label>
                          {/* @ts-ignore */}
                          <forge-text-field>
                            <select
                              id={`follow-up-${step.id}`}
                              value={followUpAction[step.id] || ''}
                              onChange={(e) => setFollowUpAction({ ...followUpAction, [step.id]: e.target.value })}
                              style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-base)', width: '100%' }}
                            >
                              <option value="">Select follow-up action...</option>
                              <option value="parent-contact">Contact Parent/Guardian</option>
                              <option value="counselor-referral">Refer to School Counselor</option>
                              <option value="principal-meeting">Schedule Principal Meeting</option>
                              <option value="behavior-plan">Create Behavior Intervention Plan</option>
                              <option value="seating-change">Implement Seating Change</option>
                              <option value="verbal-warning">Verbal Warning Only</option>
                              <option value="suspension">Bus Suspension (1-3 days)</option>
                              <option value="long-suspension">Bus Suspension (4+ days)</option>
                              <option value="no-action">No Further Action Needed</option>
                              <option value="escalate">Escalate to Administration</option>
                            </select>
                          </forge-text-field>
                        </div>
                      )}

                      {/* Comments/Notes */}
                      <div>
                        <Label htmlFor={`comments-${step.id}`} style={{ fontFamily: 'Roboto, sans-serif' }}>
                          Notes & Comments
                        </Label>
                        <Textarea
                          id={`comments-${step.id}`}
                          placeholder="Add any notes about this step..."
                          value={stepComments[step.id] || ''}
                          onChange={(e) => setStepComments({ ...stepComments, [step.id]: e.target.value })}
                          rows={3}
                          style={{ fontFamily: 'Roboto, sans-serif' }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', justifyContent: 'flex-end' }}>
                        <ForgeButton
                          variant="outlined"
                          onClick={() => setExpandedStep(null)}
                          style={{ fontFamily: 'Roboto, sans-serif' }}
                        >
                          Cancel
                        </ForgeButton>
                        <button
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '0 16px', height: '36px',
                            background: 'var(--brand-olive-dark)',
                            color: '#ffffff',
                            border: 'none', borderRadius: '4px',
                            fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
                            cursor: (step.order === 2 && !followUpAction[step.id]) ? 'not-allowed' : 'pointer',
                            opacity: (step.order === 2 && !followUpAction[step.id]) ? 0.5 : 1,
                            letterSpacing: '0.0125em',
                          }}
                          onClick={() => handleCompleteStep(step)}
                          disabled={step.order === 2 && !followUpAction[step.id]}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Complete Step
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Workflow Progress Summary */}
        <div style={{ 
          marginTop: 'var(--forge-spacing-large)',
          padding: 'var(--forge-spacing-medium)',
          background: 'var(--muted)',
          borderRadius: 'var(--forge-shape-medium)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'Roboto, sans-serif', fontWeight: 'var(--font-weight-medium)' }}>
              Workflow Progress
            </span>
            <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'Roboto, sans-serif', color: 'var(--muted-foreground)' }}>
              {workflow.steps.filter(s => s.status === 'Completed').length} of {workflow.steps.length} steps completed
            </span>
          </div>
          <div style={{ 
            marginTop: 'var(--forge-spacing-small)',
            height: '8px',
            background: 'var(--background)',
            borderRadius: 'var(--forge-shape-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(workflow.steps.filter(s => s.status === 'Completed').length / workflow.steps.length) * 100}%`,
              height: '100%',
              background: workflow.steps.every(s => s.status === 'Completed') 
                ? 'var(--brand-olive-dark)' 
                : 'var(--brand-blue-medium)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
        </div>
      </div>
    </ForgeCard>
  );
}
