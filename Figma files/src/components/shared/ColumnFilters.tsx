import { useEffect, useRef } from 'react';
import { defineSelectComponent, defineOptionComponent } from '@tylertech/forge';
defineSelectComponent();
defineOptionComponent();

// Shared per-column filter controls for every grid in the app.
//
// The Forge build puts filters in the table header rather than in a card above
// it, with a text input or a single-select per column and no Search button.
// These two exports are that pattern, extracted once rather than copied into
// each grid, which is what was starting to happen.

export const colFilterStyle: any = {
  width: '100%',
  boxSizing: 'border-box',
  font: 'inherit',
  fontSize: 'var(--forge-font-size-sm, 0.875rem)',
  fontWeight: 400,
  padding: '4px 8px',
  border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
  borderRadius: 'var(--forge-shape-medium)',
  background: 'var(--forge-theme-surface, #fff)',
  color: 'var(--forge-theme-text-high)',
};

export interface ColumnSelectProps {
  placeholder: string;
  options: Array<string | { value: string; label: string }>;
  // Selection stays an array even though the control is single-select, so the
  // grids' existing filter predicates and their drill-through props keep
  // working. A single select simply sets [] or [one].
  selected: string[];
  onChange: (v: string[]) => void;
}

export function ColumnSelect({ placeholder, options, selected, onChange }: ColumnSelectProps) {
  const ref = useRef<any>(null);
  const handler = useRef(onChange);
  handler.current = onChange;

  const normalized = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));

  // Mount-only listener reading the handler from a ref. reactify-wc only
  // forwards custom events for hyphenated props, so an onChange prop on a raw
  // custom element fails silently, and re-registering the listener on every
  // render leaves removeEventListener with nothing to match.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onNativeChange = (evt: any) => {
      const v = evt?.detail ?? el.value;
      handler.current(v ? [String(v)] : []);
    };
    el.addEventListener('change', onNativeChange);
    return () => el.removeEventListener('change', onNativeChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.options = normalized;
    el.value = selected[0] ?? '';
  }, [JSON.stringify(normalized), selected[0]]);

  return (
    /* @ts-ignore */
    <forge-select
      ref={ref}
      placeholder={placeholder}
      density="extra-small"
      style={{ width: '100%' }}
    ></forge-select>
  );
}

// A plain text column filter, so grids do not each restyle an input.
export function ColumnInput({
  value, onChange, placeholder, ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      style={colFilterStyle}
    />
  );
}
