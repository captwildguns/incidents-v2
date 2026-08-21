import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, AlertCircle, Users, UserCircle, Bus, MessageSquare } from 'lucide-react';
import { mockIncidents, getIncidentSubjectLabel } from '../incidents/IncidentsPage';
import { counterpartyFor } from '../../data/incident-counterparty';
import { getSubjectLabel } from '../incidents/IncidentTypes';
import { mockStudents } from '../students/StudentsPage';
import { mockDrivers } from '../../data/employees';
import { mockVehicles } from '../vehicles/VehiclesPage';
import { INCIDENTS_WITH_COMMUNICATIONS } from '../communications/communicationsData';

type SearchResult = {
  id: string;
  category: 'Incidents' | 'Students' | 'Drivers' | 'Vehicles' | 'Communications';
  title: string;
  subtitle: string;
  payload?: any;
};

interface GlobalSearchProps {
  onNavigate: (page: string) => void;
  onNavigateToIncidentDetail?: (incident: any) => void;
  onNavigateToCommunication?: (incidentId: string) => void;
}

function match(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.toLowerCase();
  return fields.some(f => f && f.toLowerCase().includes(q));
}

export function GlobalSearch({ onNavigate, onNavigateToIncidentDetail, onNavigateToCommunication }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim();
    if (q.length < 2) return [];

    const out: SearchResult[] = [];

    for (const inc of mockIncidents as any[]) {
      // Match and display on the subject label, so a location or vehicle
      // incident is findable and does not render a leading bullet from a
      // missing student name.
      const involved = getIncidentSubjectLabel(inc);
      if (match(q, inc.id, involved, inc.type, inc.driver, inc.bus, inc.route, inc.description, inc.assignedTo, inc.status)) {
        out.push({
          id: inc.id,
          category: 'Incidents',
          title: `${inc.id} — ${inc.type}`,
          subtitle: [involved, inc.bus, inc.status].filter(Boolean).join(' • '),
          payload: inc,
        });
      }
    }

    for (const s of mockStudents as any[]) {
      if (match(q, s.id, s.name, s.grade, s.school, s.bus, s.route)) {
        out.push({
          id: s.id,
          category: 'Students',
          title: s.name,
          subtitle: `${s.id} • ${s.grade} • ${s.school}`,
        });
      }
    }

    for (const d of mockDrivers as any[]) {
      if (match(q, d.id, d.fullName, d.employeeId, d.email, d.phone, d.assignedVehicle, d.primaryRoute)) {
        out.push({
          id: d.id,
          category: 'Drivers',
          title: d.fullName,
          subtitle: `${d.employeeId} • ${d.assignedVehicle}`,
        });
      }
    }

    for (const v of mockVehicles as any[]) {
      if (match(q, v.id, v.name, v.make, v.model, v.licensePlate, v.vin, v.driver, v.primaryRoute)) {
        out.push({
          id: v.id,
          category: 'Vehicles',
          title: `${v.name} (${v.make} ${v.model})`,
          subtitle: `${v.licensePlate} • ${v.driver}`,
        });
      }
    }

    for (const incId of INCIDENTS_WITH_COMMUNICATIONS) {
      const inc = (mockIncidents as any[]).find(i => i.id === incId);
      if (!inc) continue;
      const involved = getIncidentSubjectLabel(inc);
      if (match(q, inc.id, involved, inc.driver, inc.type)) {
        out.push({
          id: `comm-${inc.id}`,
          category: 'Communications',
          title: `${inc.id} — ${inc.type}`,
          // Was `${inc.driver} (Employee)`, which printed "undefined (Employee)"
          // on any incident with no driver and mislabelled the rest.
          subtitle: (() => {
            const other = counterpartyFor(inc);
            return `${involved} (${getSubjectLabel(inc.subject ?? 'student')}) to ${other.name} (${other.role})`;
          })(),
          payload: inc.id,
        });
      }
    }

    return out.slice(0, 30);
  }, [query]);

  const grouped = useMemo(() => {
    const g: Record<string, SearchResult[]> = {};
    for (const r of results) {
      (g[r.category] ||= []).push(r);
    }
    return g;
  }, [results]);

  const handleSelect = (r: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    switch (r.category) {
      case 'Incidents':
        if (onNavigateToIncidentDetail && r.payload) {
          onNavigateToIncidentDetail(r.payload);
        } else {
          onNavigate('incidents');
        }
        break;
      case 'Students':
        onNavigate('students');
        break;
      case 'Drivers':
        onNavigate('employees');
        break;
      case 'Vehicles':
        onNavigate('vehicles');
        break;
      case 'Communications':
        if (onNavigateToCommunication && r.payload) {
          onNavigateToCommunication(r.payload);
        } else {
          onNavigate('communications');
        }
        break;
    }
  };

  const categoryIcon = (cat: SearchResult['category']) => {
    const size = 14;
    switch (cat) {
      case 'Incidents': return <AlertCircle size={size} />;
      case 'Students': return <Users size={size} />;
      case 'Drivers': return <UserCircle size={size} />;
      case 'Vehicles': return <Bus size={size} />;
      case 'Communications': return <MessageSquare size={size} />;
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 'var(--forge-shape-full)', padding: '4px 16px', minWidth: '280px',
      }}>
        <Search size={16} style={{ color: 'rgba(255,255,255,0.7)', marginRight: '8px' }} />
        <input
          type="text"
          placeholder="Search incidents, students, drivers, vehicles..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
          style={{
            background: 'none', border: 'none', outline: 'none', color: 'white',
            fontSize: '14px', fontFamily: 'Roboto, sans-serif', width: '100%',
          }}
        />
      </div>

      {isOpen && query.trim().length >= 2 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: '480px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--forge-shape-medium)',
            boxShadow: 'var(--forge-elevation-8)',
            zIndex: 1000,
            color: '#0f172a',
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>
              No matches for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {categoryIcon(category as SearchResult['category'])}
                  {category} ({items.length})
                </div>
                {items.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', marginBottom: '2px' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {r.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
