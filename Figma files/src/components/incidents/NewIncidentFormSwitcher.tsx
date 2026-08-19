import { useState } from 'react';
import { defineButtonToggleGroupComponent, defineButtonToggleComponent } from '@tylertech/forge';
defineButtonToggleGroupComponent();
defineButtonToggleComponent();

import { NewIncidentForm } from './NewIncidentForm';
import { NewIncidentFormUnified } from './NewIncidentFormUnified';

// Lets the group click both new-incident designs against the same data in one
// running app, rather than deciding from a description.
//
// "Per subject" is the original: four steps for Student, Employee and Third
// Party, two for Vehicle and Location, and Incident Type relocated on a Location
// incident. "One container" is the Aug 19 meeting's approach: identical two-step
// flow for all five, no field ever changing position, people involved as a
// section rather than a step.
//
// Deliberately not persisted. Every open starts on the container design, because
// that is the one under review; switching back is one click.

type Design = 'unified' | 'perSubject';

interface NewIncidentFormSwitcherProps {
  onNavigate: (page: string) => void;
}

export function NewIncidentFormSwitcher({ onNavigate }: NewIncidentFormSwitcherProps) {
  const [design, setDesign] = useState<Design>('unified');

  const tab = (value: Design, label: string, hint: string) => {
    const active = design === value;
    return (
      <button
        key={value}
        onClick={() => setDesign(value)}
        title={hint}
        style={{
          padding: '6px 14px',
          fontFamily: 'var(--forge-font-family)',
          fontSize: 'var(--forge-font-size-sm)',
          fontWeight: active ? 500 : 400,
          background: active ? 'var(--forge-theme-primary)' : 'transparent',
          color: active ? '#fff' : 'var(--forge-theme-text-medium)',
          border: '1px solid var(--forge-color-border-default)',
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div>
      <div
        className="flex items-center"
        style={{
          gap: 'var(--forge-spacing-small)',
          marginBottom: 'var(--forge-spacing-medium)',
          paddingBottom: 'var(--forge-spacing-small)',
          borderBottom: '1px dashed var(--forge-color-border-default)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--forge-font-family)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--forge-theme-text-medium)',
          }}
        >
          Design under review
        </span>
        <div className="flex" style={{ borderRadius: 'var(--forge-radius-medium)', overflow: 'hidden' }}>
          {tab('unified', 'One container', 'Identical two-step flow for all five subjects, no field changes position')}
          {tab('perSubject', 'Per subject', 'The original: four steps for Student, Employee and Third Party, two for Vehicle and Location')}
        </div>
      </div>

      {/* Remounted on switch by the differing element type, so neither design
          inherits half-filled state from the other. */}
      {design === 'unified'
        ? <NewIncidentFormUnified onNavigate={onNavigate} />
        : <NewIncidentForm onNavigate={onNavigate} />}
    </div>
  );
}
