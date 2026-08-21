// District transportation locations: the garages, yards and service centres a
// Location incident is filed against.
//
// Moved out of IncidentsPage, where it was a four-field stub of ids and names,
// and enriched enough to justify a page. Kept as data rather than a page export
// for the same reason as the employee roster: IncidentsPage is in an import
// cycle with the incident form, so anything exported from it has to be read
// inside a component to avoid its temporal dead zone. This file imports nothing.
//
// The four service centres and district garages are the ones the fleet and the
// roster are actually based at, so their derived vehicle and employee counts are
// real. The administration building and the west yard are referenced by nothing,
// which is legitimate: an office parks no buses, and a yard can be brought into
// service before anything is assigned to it. They also exercise the zero case.
//
// Note for GH #196: a Location incident still stores this name as a string
// rather than referencing the record, so renaming one here silently orphans
// every incident that named it. Making assetRef a real reference is that
// issue's first acceptance criterion and is not done.

export interface DistrictLocation {
  id: string;
  name: string;
  // Garage, Service Center, Yard or Administration. Drives the type filter.
  locationType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  // The employee who runs it. Matches a name in the employee roster.
  manager: string;
  // Buses the site can hold, which is what makes it a garage rather than a lot.
  busCapacity: number;
  status: 'Active' | 'Inactive';
  openedDate: string;
  notes: string;
}

export const mockLocations: DistrictLocation[] = [
  {
    id: 'LOC-001',
    name: 'Central Service Center',
    locationType: 'Service Center',
    address: '1400 Central Avenue',
    city: 'Albany',
    state: 'NY',
    zip: '12205',
    phone: '(555) 200-4100',
    manager: 'Robert Mills',
    busCapacity: 60,
    status: 'Active',
    openedDate: '2004-06-01',
    notes: 'Primary maintenance site. Two lifts and the fuel island.',
  },
  {
    id: 'LOC-002',
    name: 'East Service Center',
    locationType: 'Service Center',
    address: '85 Wolf Road',
    city: 'Colonie',
    state: 'NY',
    zip: '12211',
    phone: '(555) 200-4200',
    manager: 'Terrance Boyle',
    busCapacity: 45,
    status: 'Active',
    openedDate: '2011-08-15',
    notes: '',
  },
  {
    id: 'LOC-003',
    name: 'North District Garage',
    locationType: 'Garage',
    address: '2200 Sand Creek Road',
    city: 'Latham',
    state: 'NY',
    zip: '12110',
    phone: '(555) 200-4300',
    manager: 'Robert Mills',
    busCapacity: 55,
    status: 'Active',
    openedDate: '1998-09-01',
    notes: 'Maintenance bay flooded 2025-03-10, two lifts out of service.',
  },
  {
    id: 'LOC-004',
    name: 'South District Garage',
    locationType: 'Garage',
    address: '640 Delaware Avenue',
    city: 'Albany',
    state: 'NY',
    zip: '12209',
    phone: '(555) 200-4400',
    manager: 'Terrance Boyle',
    busCapacity: 50,
    status: 'Active',
    openedDate: '2001-04-20',
    notes: '',
  },
  {
    id: 'LOC-005',
    name: 'Transportation Administration',
    locationType: 'Administration',
    address: '12 Academy Park',
    city: 'Albany',
    state: 'NY',
    zip: '12207',
    phone: '(555) 200-4000',
    manager: 'Alison Frank',
    busCapacity: 0,
    status: 'Active',
    openedDate: '1996-01-08',
    notes: 'Offices and dispatch. No vehicles based here.',
  },
  {
    id: 'LOC-006',
    name: 'West Bus Yard',
    locationType: 'Yard',
    address: '3100 Washington Avenue Extension',
    city: 'Albany',
    state: 'NY',
    zip: '12203',
    phone: '(555) 200-4500',
    manager: 'Unassigned',
    busCapacity: 30,
    status: 'Inactive',
    openedDate: '2024-11-01',
    notes: 'Paved and fenced, not yet in service. No assignments made.',
  },
];

// Distinct types present, for the type filter. Derived so a type nothing holds
// never appears as an option that filters to nothing.
export const locationTypes = Array.from(
  new Set(mockLocations.map(l => l.locationType))
).sort((a, b) => a.localeCompare(b));
