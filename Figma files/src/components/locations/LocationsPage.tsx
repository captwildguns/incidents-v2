import { useState, useEffect, useMemo, useRef } from 'react';
import { ForgeCard, ForgeButton, useForgeToast } from '@tylertech/forge-react';
import {
  defineCardComponent,
  defineDialogComponent,
  defineTextFieldComponent,
  defineButtonComponent,
  defineBadgeComponent,
  defineIconComponent,
} from '@tylertech/forge';
defineCardComponent();
defineDialogComponent();
defineTextFieldComponent();
defineButtonComponent();
defineBadgeComponent();
defineIconComponent();
import { ExportDropdown } from '../shared/ExportDropdown';
import type { ExportFormat } from '../shared/ExportDropdown';
import { ForgeMultiSelect } from '../ui/forge-multiselect';
import { EntitySearchField } from '../shared/EntitySearchField';
import { mockLocations, locationTypes } from '../../data/locations';
import { allEmployees } from '../../data/employees';
import { mockVehicles } from '../vehicles/VehiclesPage';
import { mockIncidents } from '../incidents/IncidentsPage';

// The Locations page, GH #196's first gap. Vehicles and Employees each list an
// entity, show an incident count, and drill into the incidents behind it;
// locations had neither, so a district could file a Location incident and then
// had no way to ask which depot has the most of them.
//
// Built to match those two pages rather than inventing a third layout: same KPI
// row, same search and filter card, same sortable table with a linked incident
// count, same detail dialog.

interface LocationsPageProps {
  onNavigate: (page: string) => void;
  // Opens the incidents grid scoped to one location. Optional so the page still
  // renders if a caller has not wired it; the count degrades to plain text.
  onNavigateToIncidentsMatching?: (term: string) => void;
}

const fmtDate = (d: string) => (d ? d.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2-$3-$1') : d);

export function LocationsPage({ onNavigate, onNavigateToIncidentsMatching }: LocationsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const toastHelper = useForgeToast();

  const [sortColumn, setSortColumn] = useState<'id' | 'name' | 'type' | 'manager' | 'vehicles' | 'employees' | 'incidents' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (dialogRef.current) (dialogRef.current as any).open = dialogOpen;
  }, [dialogOpen]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handleClose = () => { setDialogOpen(false); setSelectedLocation(null); };
    el.addEventListener('forge-dialog-close', handleClose);
    return () => el.removeEventListener('forge-dialog-close', handleClose);
  }, []);

  // Incidents at a location, keyed by name because assetRef stores the name
  // rather than a reference. Making that a real reference is #196's first
  // acceptance criterion; until then a rename here orphans the incidents.
  //
  // Counts any subject that named the location, not only Location-subject
  // incidents, because "what happened at this depot" is the question the page
  // exists to answer. The employee altercation at the fuel island counts.
  //
  // Computed inside the component: mockIncidents comes from IncidentsPage, which
  // is in an import cycle with the incident form, so at module level it would
  // still be in its temporal dead zone.
  const incidentCountByLocation = useMemo(() => {
    const counts = new Map<string, number>();
    for (const inc of mockIncidents as any[]) {
      const ref = inc.assetRef;
      if (typeof ref !== 'string' || !ref) continue;
      counts.set(ref, (counts.get(ref) ?? 0) + 1);
    }
    return counts;
  }, []);

  const incidentsFor = (loc: any) => incidentCountByLocation.get(loc.name) ?? 0;

  // Vehicles and employees based at a location, both derived from defaultGarage.
  // A location with none is not broken: an office parks no buses.
  const vehiclesFor = (loc: any) =>
    mockVehicles.filter((v: any) => v.defaultGarage === loc.name).length;
  const employeesFor = (loc: any) =>
    allEmployees.filter(e => e.defaultGarage === loc.name).length;

  const searchSuggestionGroups = useMemo(() => [
    { kind: 'Location', values: mockLocations.map(l => l.name) },
    { kind: 'Type', values: mockLocations.map(l => l.locationType) },
    { kind: 'Manager', values: mockLocations.map(l => l.manager) },
    { kind: 'City', values: mockLocations.map(l => l.city) },
  ], []);

  const totalLocations = mockLocations.length;
  const activeLocations = mockLocations.filter(l => l.status === 'Active').length;
  const vehiclesBased = mockLocations.reduce((sum, l) => sum + vehiclesFor(l), 0);
  const totalLocationIncidents = mockLocations.reduce((sum, l) => sum + incidentsFor(l), 0);

  const filteredLocations = mockLocations.filter((loc) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = q === '' || [
      loc.id,
      loc.name,
      loc.locationType,
      loc.manager,
      loc.address,
      loc.city,
      loc.zip,
    ].some((field: any) => (field ?? '').toLowerCase().includes(q));

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(loc.status);
    const matchesType = typeFilter.length === 0 || typeFilter.includes(loc.locationType);

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedLocations = [...filteredLocations].sort((a, b) => {
    let c = 0;
    switch (sortColumn) {
      case 'id': c = a.id.localeCompare(b.id); break;
      case 'name': c = a.name.localeCompare(b.name); break;
      case 'type': c = a.locationType.localeCompare(b.locationType); break;
      case 'manager': c = a.manager.localeCompare(b.manager); break;
      case 'vehicles': c = vehiclesFor(a) - vehiclesFor(b); break;
      case 'employees': c = employeesFor(a) - employeesFor(b); break;
      case 'incidents': c = incidentsFor(a) - incidentsFor(b); break;
      case 'status': c = a.status.localeCompare(b.status); break;
    }
    return sortDirection === 'asc' ? c : -c;
  });

  const totalPages = Math.ceil(sortedLocations.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedLocations = sortedLocations.slice(startIndex, startIndex + rowsPerPage);

  const SortIcon = ({ column }: { column: typeof sortColumn }) => {
    if (sortColumn !== column) {
      return <forge-icon name="unfold_more" style={{ fontSize: '14px', opacity: 0.3, marginLeft: '4px' }}></forge-icon>;
    }
    return (
      <forge-icon
        name={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
        style={{ fontSize: '14px', marginLeft: '4px' }}
      ></forge-icon>
    );
  };

  const handleExport = (format: ExportFormat) => {
    const formatLabels: Record<ExportFormat, string> = { excel: 'Excel Spreadsheet', csv: 'CSV' };
    const formatExtensions: Record<ExportFormat, string> = { excel: 'xlsx', csv: 'csv' };

    toastHelper[0]({
      message: `Export started, preparing ${formatLabels[format]} for locations data.`,
      theme: 'success',
      duration: 3000,
    } as any);

    setTimeout(() => {
      const headers = ['Location ID', 'Name', 'Type', 'Manager', 'Address', 'City', 'State', 'Zip', 'Phone', 'Bus Capacity', 'Vehicles Based', 'Employees Based', 'Incidents', 'Status', 'Opened'];
      const rows = sortedLocations.map(l => [
        l.id, `"${l.name}"`, `"${l.locationType}"`, `"${l.manager}"`, `"${l.address}"`,
        `"${l.city}"`, l.state, l.zip, l.phone, l.busCapacity,
        vehiclesFor(l), employeesFor(l), incidentsFor(l), l.status, l.openedDate,
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `locations-export-${new Date().toISOString().split('T')[0]}.${formatExtensions[format]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toastHelper[0]({
        message: `Export complete, your ${formatLabels[format]} has been downloaded.`,
        theme: 'success',
        duration: 3000,
      } as any);
    }, 1500);
  };

  const kpi = (value: any, label: string, color: string) => (
    <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
      <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color, fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{value}</div>
        <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>{label}</h3>
      </div>
    </ForgeCard>
  );

  return (
    <div style={{ padding: 'var(--forge-spacing-large)' }}>
      <div style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <h1 className="forge-typography--heading3" style={{ margin: 0, fontFamily: 'var(--forge-font-family)' }}>
          Locations
        </h1>
        <p className="text-muted-foreground" style={{ margin: 'var(--forge-spacing-xxsmall) 0 0', fontFamily: 'var(--forge-font-family)' }}>
          Monitor and manage all district transportation locations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        {kpi(totalLocations, 'Total Locations', 'var(--brand-blue-dark)')}
        {kpi(activeLocations, 'Active', 'var(--brand-olive-medium)')}
        {kpi(vehiclesBased, 'Vehicles Based', 'var(--brand-blue-dark)')}
        {kpi(totalLocationIncidents, 'Incidents', totalLocationIncidents > 0 ? '#ea580c' : 'var(--brand-blue-dark)')}
      </div>

      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)', marginBottom: 'var(--forge-spacing-large)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)', paddingTop: 'var(--forge-spacing-large)' }}>
          <div className="flex items-center" style={{ gap: 'var(--forge-spacing-medium)' }}>
            <div className="flex-1 min-w-0">
              <EntitySearchField
                value={searchTerm}
                onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                placeholder="Search locations, types, managers, or addresses..."
                groups={searchSuggestionGroups}
              />
            </div>

            <div className="shrink-0">
              <ForgeMultiSelect
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
                selected={statusFilter}
                onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                placeholder="Status"
                allLabel="All Statuses"
                width="180px"
              />
            </div>

            <div className="shrink-0">
              <ForgeMultiSelect
                options={locationTypes.map(t => ({ value: t, label: t }))}
                selected={typeFilter}
                onChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}
                placeholder="Location Type"
                allLabel="All Location Types"
                width="200px"
              />
            </div>
          </div>
        </div>
      </ForgeCard>

      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }} className="flex flex-row items-center justify-between">
          <h3 className="forge-typography--heading4">
            All Locations <span className="text-muted-foreground">({filteredLocations.length})</span>
          </h3>
          <div className="flex gap-2">
            <ExportDropdown onExport={handleExport} />
          </div>
        </div>

        <div style={{ marginTop: 'var(--forge-spacing-small)' }}>
          <div className="overflow-x-auto">
            <table className="forge-table">
              <thead>
                <tr>
                  {([
                    ['id', 'Location ID'],
                    ['name', 'Name'],
                    ['type', 'Type'],
                    ['manager', 'Manager'],
                    ['vehicles', 'Vehicles'],
                    ['employees', 'Employees'],
                    ['incidents', 'Incidents'],
                    ['status', 'Status'],
                  ] as Array<[typeof sortColumn, string]>).map(([col, label]) => (
                    <th key={col} className="forge-table-cell forge-table-cell--header">
                      <button
                        onClick={() => handleSort(col)}
                        className="flex items-center hover:text-primary transition-colors cursor-pointer"
                      >
                        {label}
                        <SortIcon column={col} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedLocations.map((loc) => (
                  <tr
                    key={loc.id}
                    className="forge-table-row cursor-pointer"
                    onClick={() => { setSelectedLocation(loc); setDialogOpen(true); }}
                    style={{ transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--forge-theme-primary-container-minimum)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                  >
                    <td className="forge-table-cell">
                      <span style={{ fontWeight: 500, fontFamily: 'var(--forge-font-family)' }}>{loc.id}</span>
                    </td>
                    <td className="forge-table-cell">
                      <div style={{ fontWeight: 500, fontFamily: 'var(--forge-font-family)' }}>{loc.name}</div>
                      {/* Address on a sub-line, the way the employee rows carry
                          their garage, so the table keeps eight columns. */}
                      <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: '0.75rem' }}>
                        {loc.address}, {loc.city}
                      </div>
                    </td>
                    <td className="forge-table-cell">
                      <forge-badge theme="default">{loc.locationType}</forge-badge>
                    </td>
                    <td className="forge-table-cell">
                      <div className="flex items-center gap-2">
                        <forge-icon name="person" style={{ fontSize: '16px', color: 'var(--forge-theme-text-medium)' }}></forge-icon>
                        <span>{loc.manager}</span>
                      </div>
                    </td>
                    <td className="forge-table-cell">
                      <span>{vehiclesFor(loc)}</span>
                      {loc.busCapacity > 0 && (
                        <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}> / {loc.busCapacity}</span>
                      )}
                    </td>
                    <td className="forge-table-cell">
                      <span>{employeesFor(loc)}</span>
                    </td>
                    <td className="forge-table-cell">
                      {/* stopPropagation so the count opens the incidents grid
                          rather than the location dialog behind it. Zero stays
                          plain text; there is nothing to open. */}
                      {incidentsFor(loc) > 0 && onNavigateToIncidentsMatching ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigateToIncidentsMatching(loc.name); }}
                          title={`View incidents at ${loc.name}`}
                          style={{
                            fontFamily: 'var(--forge-font-family)',
                            fontSize: 'inherit',
                            color: 'var(--forge-theme-primary)',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {incidentsFor(loc)}
                        </button>
                      ) : (
                        <span>{incidentsFor(loc)}</span>
                      )}
                    </td>
                    <td className="forge-table-cell">
                      <forge-badge theme={loc.status === 'Active' ? 'success' : 'default'}>
                        {loc.status}
                      </forge-badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between" style={{ paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', marginTop: 'var(--forge-spacing-medium)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'var(--forge-font-family)', whiteSpace: 'nowrap' }}>
              Showing {sortedLocations.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + rowsPerPage, sortedLocations.length)} of {sortedLocations.length} locations
            </span>
            {totalPages > 1 && (
              <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)' }}>
                <ForgeButton variant="outlined" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                  <forge-icon name="chevron_left" style={{ fontSize: '18px' }}></forge-icon>
                </ForgeButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <ForgeButton
                    key={page}
                    variant={page === currentPage ? 'raised' : 'outlined'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </ForgeButton>
                ))}
                <ForgeButton variant="outlined" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                  <forge-icon name="chevron_right" style={{ fontSize: '18px' }}></forge-icon>
                </ForgeButton>
              </div>
            )}
          </div>
        </div>
      </ForgeCard>

      {/* @ts-ignore */}
      <forge-dialog ref={dialogRef} aria-label={`Location Profile - ${selectedLocation?.name || ''}`}>
        <div style={{ padding: 'var(--forge-spacing-large)', maxWidth: '720px' }}>
          {selectedLocation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-medium)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="forge-typography--heading4" style={{ margin: 0, fontFamily: 'var(--forge-font-family)' }}>
                    {selectedLocation.name}
                  </h2>
                  <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>
                    {selectedLocation.id} · {selectedLocation.locationType}
                  </div>
                </div>
                <forge-badge theme={selectedLocation.status === 'Active' ? 'success' : 'default'}>
                  {selectedLocation.status}
                </forge-badge>
              </div>

              <div className="grid grid-cols-2" style={{ gap: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', paddingTop: 'var(--forge-spacing-medium)' }}>
                <div>
                  <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>Address</div>
                  <div style={{ fontFamily: 'var(--forge-font-family)' }}>
                    {selectedLocation.address}<br />
                    {selectedLocation.city}, {selectedLocation.state} {selectedLocation.zip}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>Phone</div>
                  <div style={{ fontFamily: 'var(--forge-font-family)' }}>
                    <a href={`tel:${selectedLocation.phone}`} className="hover:underline" style={{ color: 'var(--primary)' }}>
                      {selectedLocation.phone}
                    </a>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>Manager</div>
                  <div style={{ fontFamily: 'var(--forge-font-family)' }}>{selectedLocation.manager}</div>
                </div>
                <div>
                  <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>In service since</div>
                  <div style={{ fontFamily: 'var(--forge-font-family)' }}>{fmtDate(selectedLocation.openedDate)}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', paddingTop: 'var(--forge-spacing-medium)' }}>
                <h3 style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-lg)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-small)' }}>
                  Based here
                </h3>
                <div className="grid grid-cols-3" style={{ gap: 'var(--forge-spacing-medium)' }}>
                  <div>
                    <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>Vehicles</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)' }}>
                      {vehiclesFor(selectedLocation)}
                      {selectedLocation.busCapacity > 0 && ` of ${selectedLocation.busCapacity} spaces`}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>Employees</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)' }}>{employeesFor(selectedLocation)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>Incidents</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)' }}>{incidentsFor(selectedLocation)}</div>
                  </div>
                </div>
              </div>

              {selectedLocation.notes && (
                <div style={{ borderTop: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', paddingTop: 'var(--forge-spacing-medium)' }}>
                  <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)' }}>Notes</div>
                  <div style={{ fontFamily: 'var(--forge-font-family)' }}>{selectedLocation.notes}</div>
                </div>
              )}

              <div className="flex justify-end" style={{ gap: 'var(--forge-spacing-small)', borderTop: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', paddingTop: 'var(--forge-spacing-medium)' }}>
                {incidentsFor(selectedLocation) > 0 && onNavigateToIncidentsMatching && (
                  <ForgeButton
                    variant="outlined"
                    onClick={() => {
                      setDialogOpen(false);
                      onNavigateToIncidentsMatching(selectedLocation.name);
                    }}
                  >
                    <forge-icon slot="start" name="list"></forge-icon>
                    View incidents
                  </ForgeButton>
                )}
                <ForgeButton variant="raised" onClick={() => setDialogOpen(false)}>Close</ForgeButton>
              </div>
            </div>
          )}
        </div>
      </forge-dialog>
    </div>
  );
}
