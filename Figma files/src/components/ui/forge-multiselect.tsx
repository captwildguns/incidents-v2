import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';

export interface ForgeMultiSelectOption {
  value: string;
  label: string;
}

interface ForgeMultiSelectProps {
  options: ForgeMultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  className?: string;
  width?: string;
}

export function ForgeMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  allLabel = 'All',
  className = '',
  width = '200px',
}: ForgeMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearchTerm('');
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAllSelected = selected.length === 0;

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => {
    onChange([]);
  };

  const removeTag = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const getDisplayText = () => {
    if (selected.length === 0) return allLabel;
    if (selected.length === 1) {
      const opt = options.find((o) => o.value === selected[0]);
      return opt?.label || selected[0];
    }
    return `${selected.length} selected`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width, fontFamily: 'var(--forge-font-family, Roboto, sans-serif)' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full cursor-pointer"
        style={{
          height: '36px',
          padding: '0 var(--forge-spacing-xsmall)',
          border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
          borderRadius: 'var(--forge-shape-medium)',
          backgroundColor: 'var(--input-background, #f7f8fc)',
          fontSize: 'var(--forge-font-size-sm)',
          fontFamily: 'var(--forge-font-family, Roboto, sans-serif)',
          fontWeight: 'var(--forge-font-weight-regular, 400)',
          color: 'var(--foreground)',
          outline: 'none',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--ring)';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(63, 81, 181, 0.15)';
        }}
        onBlur={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = 'var(--forge-theme-outline, rgba(0,0,0,0.12))';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <span
          className="truncate"
          style={{
            color: selected.length === 0 ? 'var(--muted-foreground)' : 'var(--foreground)',
            fontSize: 'var(--forge-font-size-sm)',
          }}
        >
          {getDisplayText()}
        </span>
        <ChevronDown
          className="shrink-0 ml-1"
          style={{
            width: '16px',
            height: '16px',
            color: 'var(--muted-foreground)',
            transition: 'transform 0.15s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Selected tags row (shown when multiple selected) */}
      {selected.length > 1 && (
        <div className="flex flex-wrap gap-1" style={{ marginTop: 'var(--forge-spacing-xxsmall)' }}>
          {selected.map((val) => {
            const opt = options.find((o) => o.value === val);
            return (
              <span
                key={val}
                className="inline-flex items-center"
                style={{
                  padding: '1px var(--forge-spacing-xxsmall)',
                  paddingRight: '2px',
                  borderRadius: 'var(--forge-shape-small)',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  fontSize: 'var(--forge-font-size-xs)',
                  fontFamily: 'var(--forge-font-family, Roboto, sans-serif)',
                  lineHeight: '1.4',
                }}
              >
                {opt?.label || val}
                <button
                  type="button"
                  onClick={(e) => removeTag(val, e)}
                  className="ml-1 inline-flex items-center justify-center cursor-pointer"
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.3)',
                    color: 'var(--primary-foreground)',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  <X style={{ width: '10px', height: '10px' }} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            zIndex: 50,
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
            borderRadius: 'var(--forge-shape-medium)',
            boxShadow: 'var(--forge-elevation-4)',
            overflow: 'hidden',
            minWidth: width,
          }}
        >
          {/* Search input */}
          <div style={{ padding: 'var(--forge-spacing-xsmall)', borderBottom: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))' }}>
            <div className="relative">
              <Search
                className="absolute"
                style={{
                  left: 'var(--forge-spacing-xsmall)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '14px',
                  height: '14px',
                  color: 'var(--muted-foreground)',
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%',
                  height: '30px',
                  paddingLeft: '28px',
                  paddingRight: 'var(--forge-spacing-xsmall)',
                  border: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))',
                  borderRadius: 'var(--forge-shape-small)',
                  backgroundColor: 'var(--input-background, #f7f8fc)',
                  fontSize: 'var(--forge-font-size-sm)',
                  fontFamily: 'var(--forge-font-family, Roboto, sans-serif)',
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ring)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--forge-theme-outline-low, rgba(0,0,0,0.06))';
                }}
              />
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {/* "All" option */}
            {!searchTerm && (
              <button
                type="button"
                onClick={selectAll}
                className="flex items-center w-full cursor-pointer"
                style={{
                  padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-small)',
                  border: 'none',
                  background: isAllSelected ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
                  fontSize: 'var(--forge-font-size-sm)',
                  fontFamily: 'var(--forge-font-family, Roboto, sans-serif)',
                  color: 'var(--foreground)',
                  textAlign: 'left',
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isAllSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isAllSelected ? 'rgba(63, 81, 181, 0.08)' : 'transparent';
                }}
              >
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: 'var(--forge-spacing-xsmall)',
                    borderRadius: 'var(--forge-shape-small)',
                    border: isAllSelected ? '2px solid var(--primary)' : '2px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
                    backgroundColor: isAllSelected ? 'var(--primary)' : 'transparent',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {isAllSelected && <Check style={{ width: '12px', height: '12px', color: 'var(--primary-foreground)' }} />}
                </span>
                {allLabel}
              </button>
            )}

            {filteredOptions.length === 0 && (
              <div
                style={{
                  padding: 'var(--forge-spacing-medium)',
                  textAlign: 'center',
                  color: 'var(--muted-foreground)',
                  fontSize: 'var(--forge-font-size-sm)',
                  fontFamily: 'var(--forge-font-family, Roboto, sans-serif)',
                }}
              >
                No results found
              </div>
            )}

            {filteredOptions.map((option) => {
              const isChecked = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className="flex items-center w-full cursor-pointer"
                  style={{
                    padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-small)',
                    border: 'none',
                    background: isChecked ? 'rgba(63, 81, 181, 0.08)' : 'transparent',
                    fontSize: 'var(--forge-font-size-sm)',
                    fontFamily: 'var(--forge-font-family, Roboto, sans-serif)',
                    color: 'var(--foreground)',
                    textAlign: 'left',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChecked) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isChecked ? 'rgba(63, 81, 181, 0.08)' : 'transparent';
                  }}
                >
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: 'var(--forge-spacing-xsmall)',
                      borderRadius: 'var(--forge-shape-small)',
                      border: isChecked ? '2px solid var(--primary)' : '2px solid var(--forge-theme-outline, rgba(0,0,0,0.12))',
                      backgroundColor: isChecked ? 'var(--primary)' : 'transparent',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    {isChecked && <Check style={{ width: '12px', height: '12px', color: 'var(--primary-foreground)' }} />}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Footer with clear action */}
          {selected.length > 0 && (
            <div
              style={{
                padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-small)',
                borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 'var(--forge-font-size-xs)', color: 'var(--muted-foreground)', fontFamily: 'var(--forge-font-family, Roboto, sans-serif)' }}>
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={() => { onChange([]); setSearchTerm(''); }}
                className="cursor-pointer"
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--primary)',
                  fontSize: 'var(--forge-font-size-xs)',
                  fontFamily: 'var(--forge-font-family, Roboto, sans-serif)',
                  fontWeight: 'var(--forge-font-weight-medium, 500)',
                  padding: '2px var(--forge-spacing-xxsmall)',
                  borderRadius: 'var(--forge-shape-small)',
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(63, 81, 181, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
