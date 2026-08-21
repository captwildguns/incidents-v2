import React, { useState } from 'react';
import { ForgeCard } from '@tylertech/forge-react';
import { defineCardComponent } from '@tylertech/forge';
defineCardComponent();
import { ForgeButton } from '@tylertech/forge-react';
import { defineButtonComponent } from '@tylertech/forge';
defineButtonComponent();
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Clock, CheckCircle2, AlertCircle, User, Timer, Lightbulb } from 'lucide-react';
import { WorkflowStep } from '../../data/workflows';

interface CurrentStepActionCardProps {
  step: WorkflowStep;
  stepNumber: number;
  totalSteps: number;
  onCompleteStep: (comment?: string) => void;
  onViewDetails: () => void;
  progressPercentage: number;
}

export function CurrentStepActionCard({ step, stepNumber, totalSteps, onCompleteStep, onViewDetails, progressPercentage }: CurrentStepActionCardProps) {
  const [comment, setComment] = useState('');
  const [showCommentField, setShowCommentField] = useState(false);

  const getStatusIcon = () => {
    switch (step.status) {
      case 'In Progress':
        return <Clock className="h-8 w-8" style={{ color: 'var(--brand-blue-medium)' }} />;
      case 'Pending Approval':
        return <AlertCircle className="h-8 w-8" style={{ color: '#F57C00' }} />;
      default:
        return <Clock className="h-8 w-8" style={{ color: 'var(--brand-blue-medium)' }} />;
    }
  };

  const getStatusBadge = () => {
    switch (step.status) {
      case 'In Progress':
        return (
          <Badge 
            style={{ 
              background: 'rgba(91, 139, 184, 0.15)',
              color: 'var(--brand-blue-dark)',
              border: 'none',
              fontFamily: 'Roboto, sans-serif',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            In Progress
          </Badge>
        );
      case 'Pending Approval':
        return (
          <Badge 
            style={{ 
              background: 'rgba(255, 193, 7, 0.15)',
              color: '#F57C00',
              border: 'none',
              fontFamily: 'Roboto, sans-serif',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Action Required
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleComplete = () => {
    onCompleteStep(comment || undefined);
    setComment('');
    setShowCommentField(false);
  };

  return (
    <ForgeCard
      style={{
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        border: `2px solid ${step.status === 'Pending Approval' ? '#FFC107' : 'var(--brand-blue-medium)'}`,
        background: 'var(--card)',
      }}
    >
      <div style={{ padding: 'var(--forge-spacing-large)' }}>
        {/* Header with Icon and Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--forge-spacing-medium)' }}>
          <div style={{ display: 'flex', gap: 'var(--forge-spacing-medium)', alignItems: 'center', flex: 1 }}>
            {/* Icon */}
            <div 
              style={{ 
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: step.status === 'Pending Approval' 
                  ? 'rgba(255, 193, 7, 0.1)' 
                  : 'rgba(91, 139, 184, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getStatusIcon()}
            </div>

            {/* Status Badge, Step Counter, and Title */}
            <div style={{ flex: 1 }}>
              {getStatusBadge()}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--forge-spacing-xsmall)',
                  marginTop: 'var(--forge-spacing-small)',
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
                    borderRadius: 'var(--forge-shape-small)',
                  }}
                >
                  Step {stepNumber} of {totalSteps}
                </span>
              </div>
              <h3 
                style={{ 
                  margin: 0,
                  marginTop: 'var(--forge-spacing-xsmall)',
                  fontFamily: 'var(--forge-font-family)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                }}
              >
                {step.name}
              </h3>
            </div>
          </div>

          {/* Progress Indicator - Top Right */}
          <div style={{ flexShrink: 0, marginLeft: 'var(--forge-spacing-medium)' }}>
            <div 
              style={{ 
                width: '80px', 
                height: '80px', 
                position: 'relative',
              }}
            >
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke={step.status === 'Pending Approval' ? '#FFC107' : 'var(--brand-blue-medium)'}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPercentage / 100)}`}
                  strokeLinecap="round"
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
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', fontFamily: 'Roboto, sans-serif' }}>
                  {progressPercentage}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: 'Roboto, sans-serif' }}>
                  Complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p 
          style={{ 
            margin: 0,
            marginBottom: 'var(--forge-spacing-medium)',
            fontFamily: 'Roboto, sans-serif',
            fontSize: 'var(--text-sm)',
            color: 'var(--muted-foreground)',
            lineHeight: '1.5',
          }}
        >
          {step.description}
        </p>

        {/* What to do next */}
        <div 
          style={{ 
            background: 'var(--muted)',
            borderRadius: 'var(--forge-shape-small)',
            padding: 'var(--forge-spacing-medium)',
            marginBottom: 'var(--forge-spacing-medium)',
          }}
        >
          <div 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--forge-spacing-xsmall)',
              marginBottom: 'var(--forge-spacing-small)',
            }}
          >
            <Lightbulb className="h-4 w-4" style={{ color: 'var(--brand-olive-dark)' }} />
            <span 
              style={{ 
                fontFamily: 'Roboto, sans-serif',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--brand-olive-dark)',
              }}
            >
              What to do next
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 'var(--forge-spacing-large)',
              fontFamily: 'Roboto, sans-serif',
              fontSize: 'var(--text-sm)',
              color: 'var(--foreground)',
              lineHeight: '1.6',
            }}
          >
            {(step.instructions && step.instructions.length > 0
              ? step.instructions
              : [
                  `Complete all tasks outlined in: "${step.name}"`,
                  'Document any actions taken or findings in the incident notes',
                  'Click "Complete This Step" below to proceed to the next workflow stage',
                ]
            ).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Metadata Row */}
        <div 
          style={{ 
            display: 'flex',
            gap: 'var(--forge-spacing-large)',
            marginBottom: 'var(--forge-spacing-medium)',
          }}
        >
          {/* Assigned To */}
          <div>
            <div 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--forge-spacing-xsmall)',
                marginBottom: '2px',
              }}
            >
              <User className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />
              <span 
                style={{ 
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted-foreground)',
                }}
              >
                Assigned To
              </span>
            </div>
            <div 
              style={{ 
                fontFamily: 'Roboto, sans-serif',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              {step.assignedRole}
            </div>
          </div>

          {/* Est. Time */}
          <div>
            <div 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--forge-spacing-xsmall)',
                marginBottom: '2px',
              }}
            >
              <Timer className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />
              <span 
                style={{ 
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted-foreground)',
                }}
              >
                Est. Time
              </span>
            </div>
            <div 
              style={{ 
                fontFamily: 'Roboto, sans-serif',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              {step.estimatedDuration}
            </div>
          </div>

          {/* Step Status */}
          <div>
            <div 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--forge-spacing-xsmall)',
                marginBottom: '2px',
              }}
            >
              <CheckCircle2 className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />
              <span 
                style={{ 
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted-foreground)',
                }}
              >
                Step Status
              </span>
            </div>
            <div 
              style={{ 
                fontFamily: 'Roboto, sans-serif',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: step.status === 'Pending Approval' ? '#F57C00' : 'var(--brand-blue-dark)',
              }}
            >
              {step.status}
            </div>
          </div>
        </div>

        {/* Add Comment Section */}
        {!showCommentField ? (
          <button
            onClick={() => setShowCommentField(true)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontFamily: 'Roboto, sans-serif',
              fontSize: 'var(--text-sm)',
              color: 'var(--brand-blue-dark)',
              cursor: 'pointer',
              marginBottom: 'var(--forge-spacing-medium)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--forge-spacing-xsmall)',
            }}
          >
            <span>💬</span> Add Comment (Optional)
          </button>
        ) : (
          <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
            <label 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--forge-spacing-xsmall)',
                marginBottom: 'var(--forge-spacing-xsmall)',
                fontFamily: 'Roboto, sans-serif',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--foreground)',
              }}
            >
              <span>💬</span> Add Comment (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add notes or comments about completing this step..."
              rows={3}
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: 'var(--text-sm)',
              }}
            />
            <div 
              style={{ 
                marginTop: 'var(--forge-spacing-xsmall)',
                fontFamily: 'Roboto, sans-serif',
                fontSize: 'var(--text-xs)',
                color: 'var(--muted-foreground)',
              }}
            >
              This comment will be saved with the step completion record.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--forge-spacing-small)', flexWrap: 'wrap' }}>
          <button
            onClick={handleComplete}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '0 24px', height: '36px',
              background: step.status === 'Pending Approval'
                ? 'linear-gradient(135deg, #F57C00 0%, #FFA726 100%)'
                : 'linear-gradient(135deg, var(--brand-blue-dark) 0%, var(--brand-blue-medium) 100%)',
              color: '#ffffff',
              border: 'none', borderRadius: '4px',
              fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 500,
              cursor: 'pointer', letterSpacing: '0.0125em',
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {step.status === 'Pending Approval' ? 'Approve & Complete' : 'Complete This Step'}
          </button>
          <ForgeButton
            variant="outlined"
            onClick={onViewDetails}
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            View Step Details
          </ForgeButton>
        </div>
      </div>
    </ForgeCard>
  );
}