import React from 'react';
import { Badge } from '../ui/badge';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { Workflow, WorkflowStep } from '../../data/workflows';

interface IncidentWorkflowProgressProps {
  workflow: Workflow | null;
}

export function IncidentWorkflowProgress({ workflow }: IncidentWorkflowProgressProps) {
  if (!workflow) {
    return (
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
        No workflow assigned
      </div>
    );
  }

  const completedSteps = workflow.steps.filter((step) => step.status === 'Completed').length;
  const totalSteps = workflow.steps.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);
  const currentStep = workflow.steps.find((step) => step.status === 'In Progress' || step.status === 'Pending Approval');

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-3 w-3" style={{ color: 'var(--brand-olive-dark)' }} />;
      case 'In Progress':
        return <Clock className="h-3 w-3" style={{ color: 'var(--brand-blue-medium)' }} />;
      case 'Pending Approval':
        return <AlertCircle className="h-3 w-3" style={{ color: 'var(--brand-olive-medium)' }} />;
      default:
        return <Circle className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-xsmall)' }}>
      {/* Current Step Name - Most Prominent */}
      {currentStep && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
          {getStatusIcon(currentStep.status)}
          <span style={{ 
            fontSize: 'var(--text-sm)', 
            color: 'var(--foreground)',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 'var(--font-weight-medium)',
          }}>
            {currentStep.name}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)' }}>
        <div
          style={{
            flex: 1,
            height: '6px',
            background: 'var(--muted)',
            borderRadius: 'var(--forge-shape-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: progress === 100 ? 'var(--brand-olive-dark)' : 'var(--brand-blue-medium)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ 
          fontSize: 'var(--text-xs)', 
          color: 'var(--muted-foreground)', 
          minWidth: '35px',
          fontFamily: 'Roboto, sans-serif',
        }}>
          Step {Math.min(completedSteps + 1, totalSteps)}/{totalSteps}
        </span>
      </div>

      {/* Completed Status */}
      {progress === 100 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-xsmall)' }}>
          <CheckCircle className="h-3 w-3" style={{ color: 'var(--brand-olive-dark)' }} />
          <span style={{ 
            fontSize: 'var(--text-xs)', 
            color: 'var(--brand-olive-dark)',
            fontFamily: 'Roboto, sans-serif',
          }}>
            Workflow Complete
          </span>
        </div>
      )}
    </div>
  );
}