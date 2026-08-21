import React, { useState } from 'react';
import { ForgeCard } from '@tylertech/forge-react';
import { defineCardComponent, defineButtonComponent, defineTextFieldComponent } from '@tylertech/forge';
defineCardComponent();
import { ForgeButton } from '@tylertech/forge-react';
defineButtonComponent();
defineTextFieldComponent();
import { Badge } from '../ui/badge';
import {
  Search,
  Plus,
  Mail,
  Phone,
  Bell,
  AlertCircle,
  CheckCircle,
  Shield,
  Video,
  FileText,
  Settings,
} from 'lucide-react';

export interface WorkflowStepTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Notification' | 'Review & Action' | 'Close Out';
  icon: any;
  defaultGroup: string;
  defaultDuration: string;
  requiresApproval: boolean;
  instructions?: string[];
  emailNotifications?: {
    notifyOnStart: boolean;
    notifyOnComplete: boolean;
    notifyAssignee: boolean;
    notifyApprovers?: boolean;
    notifyGroups?: string[];
    emailTemplate?: string;
  };
  tags: string[];
}

export const workflowStepTemplates: WorkflowStepTemplate[] = [
  // Notification Steps
  {
    id: 'comm-parent-notify',
    name: 'Parent/Guardian Notification',
    description: 'Contact parent or guardian to inform them of the incident and expected next steps',
    category: 'Notification',
    icon: Phone,
    defaultGroup: 'Safety Coordinator',
    defaultDuration: '20 minutes',
    requiresApproval: false,
    emailNotifications: {
      notifyOnStart: false,
      notifyOnComplete: true,
      notifyAssignee: true,
    },
    tags: ['parent', 'guardian', 'notification', 'contact'],
  },

  // Review & Action Steps
  {
    id: 'doc-photo-evidence',
    name: 'Photo & Evidence Documentation',
    description: 'Photograph damage or relevant scene, document physical evidence',
    category: 'Review & Action',
    icon: Video,
    defaultGroup: 'Driver',
    defaultDuration: '20 minutes',
    requiresApproval: false,
    tags: ['photo', 'evidence', 'documentation', 'damage'],
  },
  {
    id: 'admin-disciplinary-review',
    name: 'Disciplinary Review',
    description: 'Administrator reviews incident and determines appropriate disciplinary action; requires approval before proceeding',
    category: 'Review & Action',
    icon: Shield,
    defaultGroup: 'School Principal',
    defaultDuration: '1 hour',
    requiresApproval: true,
    emailNotifications: {
      notifyOnStart: false,
      notifyOnComplete: true,
      notifyAssignee: true,
      notifyApprovers: true,
      notifyGroups: ['Safety Coordinator'],
      emailTemplate: 'Action Required',
    },
    tags: ['disciplinary', 'review', 'administrator', 'approval'],
  },
  {
    id: 'admin-police-report',
    name: 'Law Enforcement Contact',
    description: 'File police report or coordinate with law enforcement for criminal incidents',
    category: 'Review & Action',
    icon: Shield,
    defaultGroup: 'Administrator',
    defaultDuration: '1 hour',
    requiresApproval: true,
    tags: ['police', 'law enforcement', 'criminal', 'report'],
  },

  // Close Out Steps
  {
    id: 'follow-close-incident',
    name: 'Documentation & Close',
    description: 'Complete all incident documentation, finalize the record, and close the case',
    category: 'Close Out',
    icon: CheckCircle,
    defaultGroup: 'Safety Coordinator',
    defaultDuration: '15 minutes',
    requiresApproval: false,
    tags: ['close', 'documentation', 'finalize', 'complete'],
  },
];

interface WorkflowStepLibraryProps {
  onAddStep: (template: WorkflowStepTemplate) => void;
  selectedCategory?: string;
  addedTemplateIds?: string[];
}

export function WorkflowStepLibrary({ onAddStep, selectedCategory, addedTemplateIds = [] }: WorkflowStepLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>(selectedCategory || 'All');

  const categories = ['All', 'Notification', 'Review & Action', 'Close Out'];

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

  const filteredTemplates = workflowStepTemplates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === 'All' || template.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Search Bar */}
      <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {/* @ts-ignore */}
          <forge-text-field>
            <input
              type="text"
              placeholder="Search workflow steps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
          </forge-text-field>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              style={{
                padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)',
                borderRadius: 'var(--forge-shape-full, 9999px)',
                border: '1px solid',
                background: filterCategory === category ? 'var(--brand-blue-dark)' : 'transparent',
                color: filterCategory === category ? 'white' : 'var(--foreground)',
                borderColor: filterCategory === category ? 'var(--brand-blue-dark)' : 'var(--border)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--forge-font-family)',
                cursor: 'pointer',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Step Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => {
          const isAdded = addedTemplateIds.includes(template.id);
          return (
            <div
              key={template.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--forge-shape-medium)',
                padding: 'var(--forge-spacing-medium)',
                background: 'var(--card)',
                fontFamily: 'var(--forge-font-family)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--forge-spacing-xsmall)' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 'var(--forge-shape-full, 9999px)',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}
                  className={getCategoryColor(template.category)}
                >
                  {template.category}
                </span>
              </div>
              <h3
                style={{
                  fontWeight: 'var(--forge-font-weight-medium)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: 'var(--forge-spacing-xsmall)',
                  color: 'var(--card-foreground)',
                }}
              >
                {template.name}
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted-foreground)',
                  marginBottom: 'var(--forge-spacing-medium)',
                  lineHeight: '1.4',
                }}
              >
                {template.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  {template.defaultGroup} · {template.defaultDuration}
                  {template.requiresApproval && ' · Requires Approval'}
                </span>
                <button
                  onClick={() => !isAdded && onAddStep(template)}
                  disabled={isAdded}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)',
                    borderRadius: 'var(--forge-shape-medium)',
                    border: '1px solid',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--forge-font-family)',
                    cursor: isAdded ? 'default' : 'pointer',
                    background: isAdded ? 'var(--brand-blue-dark)' : 'transparent',
                    color: isAdded ? 'white' : 'var(--brand-blue-dark)',
                    borderColor: isAdded ? 'var(--brand-blue-dark)' : 'var(--brand-blue-medium)',
                    opacity: isAdded ? 0.8 : 1,
                  }}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Add to Workflow
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div
          className="text-center py-12"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p style={{ fontSize: 'var(--text-base)' }}>
            No workflow steps found matching your search.
          </p>
          <p style={{ fontSize: 'var(--text-sm)', marginTop: '8px' }}>
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
