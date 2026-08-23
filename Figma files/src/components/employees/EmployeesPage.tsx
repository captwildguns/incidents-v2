import { useState, useRef, useEffect, useMemo } from 'react';
import { ForgeCard, ForgeButton, useForgeToast } from '@tylertech/forge-react';
import {
  defineCardComponent,
  defineDialogComponent,
  defineTextFieldComponent,
  defineButtonComponent,
  defineBadgeComponent,
  defineAutocompleteComponent,
  defineIconComponent,
  definePaginatorComponent,
} from '@tylertech/forge';
defineCardComponent();
defineDialogComponent();
defineTextFieldComponent();
defineButtonComponent();
defineBadgeComponent();
defineAutocompleteComponent();
defineIconComponent();
definePaginatorComponent();
import { ForgeMultiSelect } from '../ui/forge-multiselect';
import { ExportDropdown } from '../shared/ExportDropdown';
import type { ExportFormat } from '../shared/ExportDropdown';
import { EntitySearchField } from '../shared/EntitySearchField';
import { allEmployees, employeeJobRoles } from '../../data/employees';
import { mockIncidents } from '../incidents/IncidentsPage';
import { colFilterStyle, ColumnSelect } from '../shared/ColumnFilters';

interface EmployeesPageProps {
  onNavigate: (page: string) => void;
  // Opens the incidents grid scoped to one driver. Optional so the page still
  // renders if a caller has not wired it; the count degrades to plain text.
  onNavigateToIncidentsMatching?: (term: string) => void;
}

export function EmployeesPage({ onNavigate, onNavigateToIncidentsMatching }: EmployeesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  // Per-column filters, matching the Forge build's Drivers grid.
  const [idFilter, setIdFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const paginatorRef = useRef<HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [yearsOfServiceFilter, setYearsOfServiceFilter] = useState<string[]>([]);
  const [garageFilter, setGarageFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const toastHelper = useForgeToast();
  const dialogRef = useRef<HTMLElement>(null);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<'id' | 'name' | 'role' | 'contact' | 'email' | 'yearsOfService' | 'incidents' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const el = dialogRef.current as any;
    if (!el) return;
    el.open = dialogOpen;
  }, [dialogOpen]);

  useEffect(() => {
    const el = dialogRef.current as any;
    if (!el) return;
    const handler = () => { setDialogOpen(false); setSelectedDriver(null); };
    el.addEventListener('forge-dialog-close', handler);
    return () => el.removeEventListener('forge-dialog-close', handler);
  }, []);

  // Incident counts derived from mockIncidents rather than read from a seeded
  // count, so filing an incident actually moves the number on this grid. Keyed
  // by full name, which is what every incident carries; the ids on
  // involvedParties are not reliably in sync with the roster.
  //
  // Still computed inside the component: this page imports mockIncidents from
  // IncidentsPage, which imports the incident form, which imports this page for
  // nothing now but would reintroduce the cycle if it ever did again.
  const incidentCountByDriver = useMemo(() => {
    const counts = new Map<string, number>();
    const bump = (name: string) => counts.set(name, (counts.get(name) ?? 0) + 1);
    for (const inc of mockIncidents as any[]) {
      // An employee is linked either by having been the driver on the incident,
      // or by being a named party on an Employee-subject incident. Counted once
      // per incident, so someone who is both does not count twice.
      const names = new Set<string>();
      if (typeof inc.driver === 'string' && inc.driver && inc.driver !== 'N/A') {
        names.add(inc.driver);
      }
      for (const party of (inc.involvedParties ?? [])) {
        if (party?.partyType === 'employee' && party?.name) names.add(party.name);
      }
      names.forEach(bump);
    }
    return counts;
  }, []);

  const incidentsFor = (driver: any) => incidentCountByDriver.get(driver.fullName) ?? 0;

  // Garage options come from the roster rather than mockLocations, so a garage
  // no driver is based at does not appear as an option that filters to nothing.
  const uniqueGarages = Array.from(
    new Set(allEmployees.map(d => d.defaultGarage).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  // Typeahead groups, limited to the fields the filter above actually matches.
  // Employee IDs, email, and phone stay searchable but unsuggested; nobody
  // browses for a partial phone number.
  const searchSuggestionGroups = useMemo(() => [
    { kind: 'Driver', values: allEmployees.map(d => d.fullName) },
    { kind: 'Vehicle', values: allEmployees.map(d => d.assignedVehicle) },
    { kind: 'Run', values: allEmployees.flatMap(d => [d.primaryRoute, d.secondaryRoute]) },
    { kind: 'Garage', values: uniqueGarages },
  ], []);

  // Calculate summary statistics
  const totalDrivers = allEmployees.length;
  const activeDrivers = allEmployees.filter(d => d.status === 'Active').length;
  // Drivers only: an aide holds no CDL, medical exam, or background check in
  // this model, so counting them all would understate the figure it reports on.
  const driverCount = allEmployees.filter(e => e.jobRole === 'Driver').length;
  const expiringCerts = allEmployees.filter(d => {
    if (d.jobRole !== 'Driver' || !d.licenseExpiry || !d.medicalExamExpiry || !d.backgroundCheckExpiry) return false;
    const licenseExpiry = new Date(d.licenseExpiry);
    const medicalExpiry = new Date(d.medicalExamExpiry);
    const bgExpiry = new Date(d.backgroundCheckExpiry);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return licenseExpiry <= threeMonthsFromNow || medicalExpiry <= threeMonthsFromNow || bgExpiry <= threeMonthsFromNow;
  }).length;
  const inactiveDrivers = allEmployees.filter(d => d.status !== 'Active').length;
  const avgIncidents = (allEmployees.reduce((sum, d) => sum + incidentsFor(d), 0) / totalDrivers).toFixed(1);

  // Filter drivers
  const filteredDrivers = allEmployees.filter((driver) => {
    // Email and phone are matched because both are columns on this grid, and the
    // secondary run because an incident may cite either leg of a driver's day.
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = q === '' || [
      driver.fullName,
      driver.id,
      driver.employeeId,
      driver.email,
      driver.phone,
      driver.jobRole,
      driver.assignedVehicle,
      driver.primaryRoute,
      driver.secondaryRoute,
      driver.defaultGarage,
    ].some((field: any) => (field ?? '').toLowerCase().includes(q));

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(driver.status);
    
    const matchesYears = yearsOfServiceFilter.length === 0 || yearsOfServiceFilter.some((range) => {
      const yos = driver.yearsOfService;
      switch (range) {
        case '1-5': return yos >= 1 && yos <= 5;
        case '6-10': return yos >= 6 && yos <= 10;
        case '11-15': return yos >= 11 && yos <= 15;
        case '16-20': return yos >= 16 && yos <= 20;
        case '20+': return yos > 20;
        default: return false;
      }
    });

    // Home garage, matching the value shown under each name.
    const matchesGarage = garageFilter.length === 0 || garageFilter.includes(driver.defaultGarage);
    const matchesRole = roleFilter.length === 0 || roleFilter.includes(driver.jobRole);

    const matchesId = !idFilter.trim() || String(driver.id).toLowerCase().includes(idFilter.trim().toLowerCase());
    const matchesContact = !contactFilter.trim() || String(driver.phone ?? '').toLowerCase().includes(contactFilter.trim().toLowerCase());
    const matchesEmail = !emailFilter.trim() || String(driver.email ?? '').toLowerCase().includes(emailFilter.trim().toLowerCase());

    return matchesSearch && matchesStatus && matchesYears && matchesGarage && matchesRole
      && matchesId && matchesContact && matchesEmail;
  });
  
  // Function to handle column header clicks
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with ascending direction
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Sort the filtered drivers
  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    let compareResult = 0;
    
    switch (sortColumn) {
      case 'id':
        compareResult = a.employeeId.localeCompare(b.employeeId);
        break;
      case 'name':
        compareResult = a.fullName.localeCompare(b.fullName);
        break;
      case 'contact':
        compareResult = a.phone.localeCompare(b.phone);
        break;
      case 'email':
        compareResult = a.email.localeCompare(b.email);
        break;
      case 'yearsOfService':
        compareResult = a.yearsOfService - b.yearsOfService;
        break;
      case 'role':
        compareResult = a.jobRole.localeCompare(b.jobRole);
        break;
      case 'incidents':
        compareResult = incidentsFor(a) - incidentsFor(b);
        break;
      case 'status':
        compareResult = a.status.localeCompare(b.status);
        break;
    }
    
    return sortDirection === 'asc' ? compareResult : -compareResult;
  });

  // Pagination
  useEffect(() => {
    const el = paginatorRef.current;
    if (!el) return;
    const onChange = (evt: any) => {
      const d = evt.detail ?? {};
      if (typeof d.pageSize === 'number') setRowsPerPage(d.pageSize);
      if (typeof d.pageIndex === 'number') setCurrentPage(d.pageIndex + 1);
    };
    el.addEventListener('forge-paginator-change', onChange);
    return () => el.removeEventListener('forge-paginator-change', onChange);
  }, []);

  const totalPages = Math.ceil(sortedDrivers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedDrivers = sortedDrivers.slice(startIndex, startIndex + rowsPerPage);
  
  // Render sort icon for column header
  const SortIcon = ({ column }: { column: typeof sortColumn }) => {
    if (sortColumn !== column) {
      return <forge-icon name="unfold_more" style={{ fontSize: '14px', marginLeft: '4px', opacity: 0.5 }}></forge-icon>;
    }
    return sortDirection === 'asc' 
      ? <forge-icon name="arrow_upward" style={{ fontSize: '14px', marginLeft: '4px' }}></forge-icon>
      : <forge-icon name="arrow_downward" style={{ fontSize: '14px', marginLeft: '4px' }}></forge-icon>;
  };

  const isExpiringOrExpired = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    const today = new Date();
    
    if (expiryDate < today) return { status: 'expired', color: 'text-red-600' };
    if (expiryDate <= threeMonthsFromNow) return { status: 'expiring', color: 'text-orange-500' };
    return { status: 'valid', color: 'text-green-600' };
  };

  const handleExport = (format: ExportFormat) => {
    const formatLabels: Record<ExportFormat, string> = {
      excel: 'Excel Spreadsheet', csv: 'CSV',
    };
    const formatExtensions: Record<ExportFormat, string> = {
      excel: 'xlsx', csv: 'csv',
    };

    toastHelper[0]({
      message: `Export started, preparing ${formatLabels[format]} for employees data.`,
      theme: 'success',
      duration: 3000,
    } as any);

    setTimeout(() => {
      // Driver-only columns stay in the export but read empty for everyone else,
      // rather than dropping the columns and breaking downstream consumers.
      const headers = ['Employee ID', 'Name', 'Job Role', 'Employee Number', 'Status', 'Phone', 'Email', 'License', 'Years of Service', 'Primary Run', 'Safety Rating', 'Incidents', 'Performance', 'On-Time %'];
      const rows = sortedDrivers.map(d => [
        d.id, `"${d.fullName}"`, `"${d.jobRole}"`, d.employeeId, d.status, d.phone, d.email,
        d.licenseNumber ?? '', d.yearsOfService, `"${d.primaryRoute ?? ''}"`,
        d.safetyRating ?? '', incidentsFor(d), d.performanceScore ?? '', d.onTimePercentage ?? ''
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drivers-export-${new Date().toISOString().split('T')[0]}.${formatExtensions[format]}`;
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

  return (
    <div style={{ padding: 'var(--forge-spacing-xlarge)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '8px' }}>Employees</h1>
          <p className="text-muted-foreground" style={{ margin: 0 }}>
            Monitor and manage all district transportation employees
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{totalDrivers}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Total Employees</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-olive-medium)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{activeDrivers}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Active</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: expiringCerts > 0 ? '#dc2626' : 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{expiringCerts}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Expiring Certifications</h3>
            <p style={{ fontFamily: 'var(--forge-font-family)', fontSize: '0.6875rem', color: 'var(--forge-theme-text-medium)', margin: '2px 0 0' }}>
              of {driverCount} drivers
            </p>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-blue-medium)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{inactiveDrivers}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Inactive</h3>
          </div>
        </ForgeCard>
      </div>

      {/* Filters Card */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)', marginBottom: 'var(--forge-spacing-large)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)', paddingTop: 'var(--forge-spacing-large)' }}>
          <div className="flex items-center" style={{ gap: 'var(--forge-spacing-medium)' }}>
            {/* Search */}
            <div className="flex-1 min-w-0">
              <EntitySearchField
                value={searchTerm}
                onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                placeholder="Search employees, roles, contact details, vehicles, runs, or garage..."
                groups={searchSuggestionGroups}
              />
            </div>

            {/* Status Filter */}
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
                width="200px"
              />
            </div>

            {/* Years of Service Filter */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={[
                  { value: '1-5', label: '1-5 Years' },
                  { value: '6-10', label: '6-10 Years' },
                  { value: '11-15', label: '11-15 Years' },
                  { value: '16-20', label: '16-20 Years' },
                  { value: '20+', label: '20+ Years' },
                ]}
                selected={yearsOfServiceFilter}
                onChange={(val) => { setYearsOfServiceFilter(val); setCurrentPage(1); }}
                placeholder="Years of Service"
                allLabel="All Years of Service"
                width="220px"
              />
            </div>

            {/* Job Role filter. This is what lets one page serve drivers and
                every other employee instead of splitting them across two. */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={employeeJobRoles.map(r => ({ value: r, label: r }))}
                selected={roleFilter}
                onChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}
                placeholder="Job Role"
                allLabel="All Job Roles"
                width="200px"
              />
            </div>

            {/* Garage Filter. A location incident names a garage, so this is how
                you get from that incident to the employees based there. */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={uniqueGarages.map(g => ({ value: g, label: g }))}
                selected={garageFilter}
                onChange={(val) => { setGarageFilter(val); setCurrentPage(1); }}
                placeholder="Garage"
                allLabel="All Garages"
                width="220px"
              />
            </div>
          </div>
        </div>
      </ForgeCard>

      {/* Drivers Table */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }} className="flex flex-row items-center justify-between">
          <h3 className="forge-typography--heading4">
            All Employees <span className="text-muted-foreground">({filteredDrivers.length})</span>
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
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('id')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Employee ID
                      <SortIcon column="id" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Name
                      <SortIcon column="name" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('role')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Job Role
                      <SortIcon column="role" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('contact')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Contact
                      <SortIcon column="contact" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Email
                      <SortIcon column="email" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('yearsOfService')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Years of Service
                      <SortIcon column="yearsOfService" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('incidents')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Incidents
                      <SortIcon column="incidents" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Status
                      <SortIcon column="status" />
                    </button>
                  </th>
                </tr>
                {/* Filter row, matching the Forge build's equivalent grid. */}
                <tr>
                  <th className="forge-table-cell forge-table-cell--header">
                    <input value={idFilter} onChange={(e) => setIdFilter(e.target.value)} placeholder="Filter Employee ID..." style={colFilterStyle} />
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filter Name..." style={colFilterStyle} />
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <ColumnSelect placeholder="Filter Job Role..." options={employeeJobRoles} selected={roleFilter} onChange={setRoleFilter} />
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <input value={contactFilter} onChange={(e) => setContactFilter(e.target.value)} placeholder="Filter Contact..." style={colFilterStyle} />
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <input value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} placeholder="Filter Email..." style={colFilterStyle} />
                  </th>
                  <th className="forge-table-cell forge-table-cell--header"></th>
                  <th className="forge-table-cell forge-table-cell--header"></th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <ColumnSelect placeholder="Filter Status..." options={['Active', 'Inactive']} selected={statusFilter} onChange={setStatusFilter} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDrivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="forge-table-row cursor-pointer"
                    onClick={() => { setSelectedDriver(driver); setDialogOpen(true); }}
                    style={{ transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--forge-theme-primary-container-minimum)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                  >
                    <td className="forge-table-cell">
                      <span style={{ fontWeight: 500, fontFamily: 'var(--forge-font-family)', color: 'var(--foreground)' }}>
                        {driver.employeeId}
                      </span>
                    </td>
                    <td className="forge-table-cell">
                      <div style={{ fontWeight: 500, fontFamily: 'var(--forge-font-family)' }}>{driver.fullName}</div>
                      {/* Garage on a sub-line rather than its own column, so the
                          Garage filter is legible without an eighth column. */}
                      {driver.defaultGarage && (
                        <div className="text-muted-foreground" style={{ fontFamily: 'var(--forge-font-family)', fontSize: '0.75rem' }}>
                          {driver.defaultGarage}
                        </div>
                      )}
                    </td>
                    <td className="forge-table-cell">
                      {/* One theme for every role. Job role is a category, not a
                          status, so colouring Driver differently implied a
                          hierarchy that does not exist. */}
                      <forge-badge theme="default">
                        {driver.jobRole}
                      </forge-badge>
                    </td>
                    <td className="forge-table-cell">
                      <div style={{ fontSize: '0.875rem' }}>
                        <span>{driver.phone}</span>
                      </div>
                    </td>
                    <td className="forge-table-cell">
                      <span style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--foreground)' }}>
                        {driver.email}
                      </span>
                    </td>
                    <td className="forge-table-cell">
                      <span style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--foreground)' }}>
                        {driver.yearsOfService} {driver.yearsOfService === 1 ? 'year' : 'years'}
                      </span>
                    </td>
                    <td className="forge-table-cell">
                      {/* stopPropagation so the count opens the incidents grid
                          rather than the driver detail dialog behind it. Zero
                          stays plain text; there is nothing to open. */}
                      {incidentsFor(driver) > 0 && onNavigateToIncidentsMatching ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigateToIncidentsMatching(driver.fullName); }}
                          title={`View incidents involving ${driver.fullName}`}
                          style={{
                            fontFamily: 'var(--forge-font-family)',
                            fontSize: 'inherit',
                            fontWeight: incidentsFor(driver) > 8 ? 600 : 'normal',
                            color: 'var(--forge-theme-primary)',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {incidentsFor(driver)}
                        </button>
                      ) : (
                        <span style={{ fontWeight: incidentsFor(driver) > 8 ? 600 : 'normal' }}>
                          {incidentsFor(driver)}
                        </span>
                      )}
                    </td>
                    <td className="forge-table-cell">
                      <forge-badge theme={driver.status === 'Active' ? 'success' : 'default'}>
                        {driver.status}
                      </forge-badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{ paddingTop: 'var(--forge-spacing-small)', borderTop: '1px solid var(--forge-theme-outline-low, rgba(0,0,0,0.06))', marginTop: 'var(--forge-spacing-medium)' }}>
            {/* @ts-ignore */}
            <forge-paginator
              ref={paginatorRef}
              total={sortedDrivers.length}
              page-size={rowsPerPage}
              page-index={currentPage - 1}
              page-size-options="10,25,50"
              offset={(currentPage - 1) * rowsPerPage}
              first-last
            ></forge-paginator>
          </div>
        </div>
      </ForgeCard>

      {/* @ts-ignore */}
      <forge-dialog ref={dialogRef} aria-label={`Employee Profile - ${selectedDriver?.fullName || ''}`}>
        <div style={{ padding: 'var(--forge-spacing-large)', minWidth: '500px', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
          {/* Header with title and status badge */}
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--forge-font-family)', fontWeight: 'var(--forge-font-weight-medium)', fontSize: 'var(--forge-font-size-xl)' }}>
              Driver Profile - {selectedDriver?.fullName}
            </h2>
            {selectedDriver && (
              <forge-badge theme={selectedDriver.status === 'Active' ? 'success' : 'default'}>
                {selectedDriver.status}
              </forge-badge>
            )}
          </div>

          {selectedDriver && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--forge-spacing-large)' }}>

              {/* Personal Information */}
              <div style={{ borderTop: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', paddingTop: 'var(--forge-spacing-medium)' }}>
                <h3 style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-lg)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-small)' }}>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2" style={{ gap: 'var(--forge-spacing-medium)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>Employee ID</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontWeight: 'var(--forge-font-weight-medium)' }}>{selectedDriver.employeeId}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>Phone</div>
                    <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)' }}>
                      <forge-icon name="phone" style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}></forge-icon>
                      <a href={`tel:${selectedDriver.phone}`} className="hover:underline" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--primary)' }}>
                        {selectedDriver.phone}
                      </a>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>Hire Date</div>
                    <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)', fontFamily: 'var(--forge-font-family)' }}>
                      <forge-icon name="calendar_today" style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}></forge-icon>
                      <span>{selectedDriver.hireDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2-$3-$1')}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>Email</div>
                    <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)' }}>
                      <forge-icon name="email" style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}></forge-icon>
                      <a href={`mailto:${selectedDriver.email}`} className="hover:underline" style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--primary)' }}>
                        {selectedDriver.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* License and certifications apply only to drivers. An aide or a
                  mechanic holds none of them, so the section is absent rather
                  than rendering empty rows. */}
              {selectedDriver.jobRole === 'Driver' && (
              <div style={{ borderTop: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', paddingTop: 'var(--forge-spacing-medium)' }}>
                <h3 style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-lg)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-small)' }}>
                  License & Certifications
                </h3>
                <div className="grid grid-cols-2" style={{ gap: 'var(--forge-spacing-medium)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>License Number</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)' }}>{selectedDriver.licenseNumber}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>License Expiry</div>
                    <div className={isExpiringOrExpired(selectedDriver.licenseExpiry).color} style={{ fontFamily: 'var(--forge-font-family)' }}>
                      {selectedDriver.licenseExpiry.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2-$3-$1')}
                      {isExpiringOrExpired(selectedDriver.licenseExpiry).status === 'expired' && ' (EXPIRED)'}
                      {isExpiringOrExpired(selectedDriver.licenseExpiry).status === 'expiring' && ' (Expiring Soon)'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>License Class</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)' }}>{selectedDriver.licenseClass}</div>
                  </div>
                </div>
              </div>
              )}

              {/* Current Assignment */}
              <div style={{ borderTop: '1px solid var(--forge-theme-outline, rgba(0,0,0,0.12))', paddingTop: 'var(--forge-spacing-medium)' }}>
                <h3 style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-lg)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-small)' }}>
                  Current Assignment
                </h3>
                <div className="grid grid-cols-2" style={{ gap: 'var(--forge-spacing-medium)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>Job Role</div>
                    <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)', fontFamily: 'var(--forge-font-family)' }}>
                      <forge-icon name="badge" style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}></forge-icon>
                      <span>{selectedDriver.jobRole}</span>
                    </div>
                  </div>
                  {selectedDriver.assignedVehicle && (
                    <div>
                      <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>Assigned Vehicle</div>
                      <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)', fontFamily: 'var(--forge-font-family)' }}>
                        <forge-icon name="directions_bus" style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}></forge-icon>
                        <span>{selectedDriver.assignedVehicle}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>Default Garage</div>
                    <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)', fontFamily: 'var(--forge-font-family)' }}>
                      <forge-icon name="location_on" style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}></forge-icon>
                      <span>{selectedDriver.defaultGarage}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </forge-dialog>
    </div>
  );
}