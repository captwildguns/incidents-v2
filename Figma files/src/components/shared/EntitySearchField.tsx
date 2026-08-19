import { useEffect, useRef } from 'react';
import {
  defineAutocompleteComponent,
  defineTextFieldComponent,
  defineIconComponent,
} from '@tylertech/forge';
defineAutocompleteComponent();
defineTextFieldComponent();
defineIconComponent();

// The search box shared by the incidents, students, drivers, and vehicles grids.
//
// Built on forge-autocomplete rather than a plain forge-text-field so every grid
// offers the same typeahead: a query surfaces matching people, vehicles, runs,
// and garages, each labelled with its kind, so "Bus 12 (Vehicle)" and
// "Meyers Middle AM - Yellow (Run)" are distinguishable at a glance.
//
// The element is used directly rather than through the ForgeAutocomplete React
// wrapper. The wrapper bridges custom events only through a hyphenated prop
// (on-forge-autocomplete-change), which is easy to misspell into silence in a
// project with no typechecking. Either way the component is stock Forge.
//
// allow-unmatched keeps whatever the user typed when nothing matches, so the box
// still works as free text. option-limit is Forge's own cap on the dropdown.

// One set of suggestion values sharing a kind, e.g. every bus name under
// "Vehicle". Callers pass the fields their own filter actually searches, so a
// suggestion can never point at something the grid would then discard.
export interface SearchSuggestionGroup {
  kind: string;
  values: (string | null | undefined)[];
}

interface EntitySearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  // Called on Enter. The incidents grid uses it to commit its pending filters;
  // grids that filter as you type leave it unset.
  onSubmit?: () => void;
  placeholder: string;
  groups: SearchSuggestionGroup[];
  optionLimit?: number;
}

export function EntitySearchField({
  value,
  onChange,
  onSubmit,
  placeholder,
  groups,
  optionLimit = 20,
}: EntitySearchFieldProps) {
  const hostRef = useRef<any>(null);

  // Held in refs so the effect below can run once on mount. Re-running it per
  // render would add another change listener each time, which is what the
  // inline version on the incidents grid used to do.
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    el.filter = (filterText: string) => {
      const q = (filterText || '').trim().toLowerCase();
      if (!q) return [];
      const seen = new Set<string>();
      const options: Array<{ label: string; value: string }> = [];
      for (const group of groupsRef.current) {
        for (const raw of group.values) {
          const candidate = (raw ?? '').trim();
          // 'N/A' is the seed placeholder for "no vehicle" and "no run". Nobody
          // means to search for it.
          if (!candidate || candidate === 'N/A') continue;
          if (!candidate.toLowerCase().includes(q)) continue;
          const key = `${group.kind}::${candidate}`;
          if (seen.has(key)) continue;
          seen.add(key);
          options.push({ label: `${candidate} (${group.kind})`, value: candidate });
        }
      }
      return options;
    };

    const handleChange = (e: any) => {
      const next = e.detail?.value;
      if (next !== undefined) onChangeRef.current(next);
    };
    el.addEventListener('forge-autocomplete-change', handleChange);
    return () => el.removeEventListener('forge-autocomplete-change', handleChange);
  }, []);

  return (
    <forge-autocomplete ref={hostRef} allow-unmatched filter-on-focus option-limit={optionLimit}>
      <forge-text-field>
        <forge-icon slot="start" name="search"></forge-icon>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSubmit) onSubmit();
          }}
          style={{ fontFamily: 'Roboto, sans-serif', fontSize: 'var(--forge-font-size-base)' }}
        />
      </forge-text-field>
    </forge-autocomplete>
  );
}
