import { useState, useEffect, useMemo, useRef } from 'react';
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
import { ExportDropdown } from '../shared/ExportDropdown';
import type { ExportFormat } from '../shared/ExportDropdown';
import { ForgeMultiSelect } from '../ui/forge-multiselect';
import { EntitySearchField } from '../shared/EntitySearchField';
import { mockIncidents } from '../incidents/IncidentsPage';
import {
  BlueBirdVisionIcon,
  ICBusCESeriesIcon, 
  ThomasSafTLinerC2Icon, 
  ThomasSafTLinerHDXIcon, 
  BlueBirdAllAmericanIcon 
} from './bus-icons';
import blueBirdVisionImage from 'figma:asset/105378278b009ee6fc94abaed536f64cd3d8e2b3.png';
import icBusCESeriesImage from 'figma:asset/21d74f75357e2f9c963f7de5c42dc2984e42128f.png';
import thomasSafTLinerC2Image from 'figma:asset/3a2ed08444e1236b5d2ed085fae8108be0e34f25.png';
import blueBirdAllAmericanImage from 'figma:asset/cc1ace2efdf898535c090348483c30c45b97c1ee.png';
import thomasSafTLinerHDXImage from 'figma:asset/82ee4edb9142f194220fb71fddfb690c50f6e977.png';
import { colFilterStyle, ColumnSelect } from '../shared/ColumnFilters';

// Helper function to get bus image based on make and model
const getBusImage = (make: string, model: string) => {
  const key = `${make} ${model}`;
  const imageMap: { [key: string]: string } = {
    'Blue Bird Vision': blueBirdVisionImage,
    'IC Bus CE Series': icBusCESeriesImage,
    'Thomas Saf-T-Liner C2': thomasSafTLinerC2Image,
    'Blue Bird All American': blueBirdAllAmericanImage,
    'Thomas Saf-T-Liner HDX': thomasSafTLinerHDXImage,
  };
  return imageMap[key] || blueBirdVisionImage; // Default to Blue Bird Vision if not found
};

// Mock vehicle data
export const mockVehicles = [
  {
    id: 'VEH-015',
    name: 'Bus 15',
    make: 'Blue Bird',
    model: 'Vision',
    year: 2022,
    vin: '1BABNBYA3NF123456',
    licensePlate: 'SCH-1015',
    capacity: 72,
    status: 'Active',
    driver: 'David Park',
    primaryRoute: 'Jefferson Middle AM - Blue',
    secondaryRoute: 'Jefferson Middle PM - Blue',
    defaultGarage: 'North District Garage',
    midDayGarage: 'Central Service Center',
    gpsHardwareId: 'GPS-7X4K9M2',
    hourmeter: 3456,
    useTydAvl: true,
    lastInspection: '2025-02-15',
    nextInspection: '2025-05-15',
    maintenanceStatus: 'Good',
    incidentCount: 8,
    mileage: 45230,
    fuelType: 'Diesel',
    notes: 'Rear camera replaced 2025-01-10'
  },
  {
    id: 'VEH-014',
    name: 'Bus 14',
    make: 'IC Bus',
    model: 'CE Series',
    year: 2021,
    vin: '1BABLCYA8MF987654',
    licensePlate: 'SCH-1014',
    capacity: 72,
    status: 'Active',
    driver: 'Robert Thompson',
    primaryRoute: 'Roosevelt High AM - Red',
    secondaryRoute: 'Roosevelt High PM - Red',
    defaultGarage: 'South District Garage',
    midDayGarage: 'South District Garage',
    gpsHardwareId: 'GPS-2A8N5P1',
    hourmeter: 2890,
    useTydAvl: true,
    lastInspection: '2025-02-20',
    nextInspection: '2025-05-20',
    maintenanceStatus: 'Good',
    incidentCount: 6,
    mileage: 38450,
    fuelType: 'Diesel',
    notes: ''
  },
  {
    id: 'VEH-012',
    name: 'Bus 12',
    make: 'Blue Bird',
    model: 'Vision',
    year: 2020,
    vin: '1BABNBYA2LF456789',
    licensePlate: 'SCH-1012',
    capacity: 72,
    status: 'Active',
    driver: 'John Chen',
    primaryRoute: 'Meyers Middle AM - Yellow',
    secondaryRoute: 'Meyers Middle PM - Yellow',
    defaultGarage: 'North District Garage',
    midDayGarage: 'East Service Center',
    gpsHardwareId: 'GPS-5B3L7R4',
    hourmeter: 4567,
    useTydAvl: true,
    lastInspection: '2025-01-25',
    nextInspection: '2025-04-25',
    maintenanceStatus: 'Needs Attention',
    incidentCount: 12,
    mileage: 62890,
    fuelType: 'Diesel',
    notes: 'Tire rotation scheduled for next week'
  },
  {
    id: 'VEH-009',
    name: 'Bus 9',
    make: 'Thomas Built',
    model: 'Saf-T-Liner C2',
    year: 2021,
    vin: '1T8HFEA19MF345678',
    licensePlate: 'SCH-1009',
    capacity: 84,
    status: 'Active',
    driver: 'Jennifer Martinez',
    primaryRoute: 'Lincoln Elementary AM - Green',
    secondaryRoute: 'Lincoln Elementary PM - Green',
    defaultGarage: 'Central Service Center',
    midDayGarage: 'Central Service Center',
    gpsHardwareId: 'GPS-9D1K4T6',
    hourmeter: 3120,
    useTydAvl: false,
    lastInspection: '2025-02-10',
    nextInspection: '2025-05-10',
    maintenanceStatus: 'Good',
    incidentCount: 5,
    mileage: 41200,
    fuelType: 'Diesel',
    notes: ''
  },
  {
    id: 'VEH-008',
    name: 'Bus 8',
    make: 'IC Bus',
    model: 'CE Series',
    year: 2019,
    vin: '1BABLCYA1KF234567',
    licensePlate: 'SCH-1008',
    capacity: 72,
    status: 'Active',
    driver: 'Lisa Anderson',
    primaryRoute: 'Washington High PM - Wolf Rd',
    secondaryRoute: '',
    defaultGarage: 'South District Garage',
    midDayGarage: 'Central Service Center',
    gpsHardwareId: 'GPS-3H7M2W8',
    hourmeter: 5234,
    useTydAvl: true,
    lastInspection: '2025-03-01',
    nextInspection: '2025-06-01',
    maintenanceStatus: 'Good',
    incidentCount: 9,
    mileage: 72340,
    fuelType: 'Diesel',
    notes: ''
  },
  {
    id: 'VEH-007',
    name: 'Bus 7',
    make: 'Blue Bird',
    model: 'All American',
    year: 2022,
    vin: '1BAANBKA4NF876543',
    licensePlate: 'SCH-1007',
    capacity: 84,
    status: 'Active',
    driver: 'Robert Martinez',
    primaryRoute: 'Lincoln Elementary AM - Orange',
    secondaryRoute: 'Lincoln Elementary PM - Orange',
    defaultGarage: 'North District Garage',
    midDayGarage: 'North District Garage',
    gpsHardwareId: 'GPS-6F8P1Y3',
    hourmeter: 2145,
    useTydAvl: true,
    lastInspection: '2025-02-18',
    nextInspection: '2025-05-18',
    maintenanceStatus: 'Excellent',
    incidentCount: 3,
    mileage: 28950,
    fuelType: 'Diesel',
    notes: ''
  },
  {
    id: 'VEH-005',
    name: 'Bus 5',
    make: 'Thomas Built',
    model: 'Saf-T-Liner HDX',
    year: 2018,
    vin: '1T8HEAA18JF567890',
    licensePlate: 'SCH-1005',
    capacity: 84,
    status: 'Inactive',
    driver: 'Unassigned',
    primaryRoute: '',
    secondaryRoute: '',
    defaultGarage: 'East Service Center',
    midDayGarage: 'East Service Center',
    gpsHardwareId: 'GPS-4Q2V9X5',
    hourmeter: 6789,
    useTydAvl: false,
    lastInspection: '2025-01-15',
    nextInspection: '2025-04-15',
    maintenanceStatus: 'In Repair',
    incidentCount: 4,
    mileage: 89560,
    fuelType: 'Diesel',
    notes: 'Engine repair in progress, estimated completion 2025-03-20'
  },
  {
    id: 'VEH-003',
    name: 'Bus 3',
    make: 'IC Bus',
    model: 'CE Series',
    year: 2020,
    vin: '1BABLCYA3LF098765',
    licensePlate: 'SCH-1003',
    capacity: 72,
    status: 'Active',
    driver: 'Patricia Wilson',
    primaryRoute: 'Central Elementary AM - Purple',
    secondaryRoute: 'Central Elementary PM - Purple',
    defaultGarage: 'Central Service Center',
    midDayGarage: 'North District Garage',
    gpsHardwareId: 'GPS-8R5T3N7',
    hourmeter: 2678,
    useTydAvl: true,
    lastInspection: '2025-02-05',
    nextInspection: '2025-05-05',
    maintenanceStatus: 'Good',
    incidentCount: 2,
    mileage: 35670,
    fuelType: 'Diesel',
    notes: ''
  },
  {
    id: 'VEH-002',
    name: 'Bus 2',
    make: 'Blue Bird',
    model: 'Vision',
    year: 2023,
    vin: '1BABNBYA5PF654321',
    licensePlate: 'SCH-1002',
    capacity: 72,
    status: 'Active',
    driver: 'James Rodriguez',
    primaryRoute: 'Northside High AM - Silver',
    secondaryRoute: 'Northside High PM - Silver',
    defaultGarage: 'South District Garage',
    midDayGarage: 'South District Garage',
    gpsHardwareId: 'GPS-1K9J6B2',
    hourmeter: 890,
    useTydAvl: true,
    lastInspection: '2025-02-28',
    nextInspection: '2025-05-28',
    maintenanceStatus: 'Excellent',
    incidentCount: 1,
    mileage: 12450,
    fuelType: 'Diesel',
    notes: 'New vehicle'
  },
  {
    id: 'VEH-001',
    name: 'Bus 1',
    make: 'Thomas Built',
    model: 'Saf-T-Liner C2',
    year: 2019,
    vin: '1T8HFEA11KF789012',
    licensePlate: 'SCH-1001',
    capacity: 84,
    status: 'Active',
    driver: 'Sarah Mitchell',
    primaryRoute: 'Westside Elementary AM - Gold',
    secondaryRoute: 'Westside Elementary PM - Gold',
    defaultGarage: 'East Service Center',
    midDayGarage: 'Central Service Center',
    gpsHardwareId: 'GPS-7W4U2C9',
    hourmeter: 5123,
    useTydAvl: false,
    lastInspection: '2025-02-12',
    nextInspection: '2025-05-12',
    maintenanceStatus: 'Needs Attention',
    incidentCount: 7,
    mileage: 67890,
    fuelType: 'Diesel',
    notes: 'Brake pads due for replacement'
  },
  {
    id: 'VEH-016',
    name: 'Bus 16',
    make: 'IC Bus',
    model: 'CE Series',
    year: 2023,
    vin: '1BABLCYA6PF112233',
    licensePlate: 'SCH-1016',
    capacity: 72,
    status: 'Active',
    driver: 'Kevin Brooks',
    primaryRoute: 'Oakwood Middle AM - Teal',
    secondaryRoute: 'Oakwood Middle PM - Teal',
    defaultGarage: 'North District Garage',
    midDayGarage: 'North District Garage',
    gpsHardwareId: 'GPS-4T6R8Q1',
    hourmeter: 1245,
    useTydAvl: true,
    lastInspection: '2025-03-05',
    nextInspection: '2025-06-05',
    maintenanceStatus: 'Excellent',
    incidentCount: 2,
    mileage: 15780,
    fuelType: 'Diesel',
    notes: 'New addition to fleet'
  },
  {
    id: 'VEH-017',
    name: 'Bus 17',
    make: 'Blue Bird',
    model: 'All American',
    year: 2021,
    vin: '1BAANBKA2MF445566',
    licensePlate: 'SCH-1017',
    capacity: 84,
    status: 'Active',
    // Was Angela Foster, who mockDrivers assigns to Bus 6. Cleared rather than
    // reassigned so no driver appears on two vehicles.
    driver: 'Unassigned',
    primaryRoute: 'Riverside High AM - Maroon',
    secondaryRoute: 'Riverside High PM - Maroon',
    defaultGarage: 'South District Garage',
    midDayGarage: 'Central Service Center',
    gpsHardwareId: 'GPS-8K2M5V7',
    hourmeter: 3890,
    useTydAvl: true,
    lastInspection: '2025-01-30',
    nextInspection: '2025-04-30',
    maintenanceStatus: 'Good',
    incidentCount: 6,
    mileage: 51230,
    fuelType: 'Diesel',
    notes: ''
  },
  {
    id: 'VEH-018',
    name: 'Bus 18',
    make: 'Thomas Built',
    model: 'Saf-T-Liner HDX',
    year: 2020,
    vin: '1T8HEAA12LF778899',
    licensePlate: 'SCH-1018',
    capacity: 84,
    status: 'Inactive',
    driver: 'Unassigned',
    primaryRoute: '',
    secondaryRoute: '',
    defaultGarage: 'East Service Center',
    midDayGarage: 'East Service Center',
    gpsHardwareId: 'GPS-1P9S3X6',
    hourmeter: 5678,
    useTydAvl: false,
    lastInspection: '2025-02-01',
    nextInspection: '2025-05-01',
    maintenanceStatus: 'In Repair',
    incidentCount: 10,
    mileage: 78430,
    fuelType: 'Diesel',
    notes: 'Transmission replacement in progress'
  },
  {
    id: 'VEH-019',
    name: 'Bus 19',
    make: 'Blue Bird',
    model: 'Vision',
    year: 2024,
    vin: '1BABNBYA7RF334455',
    licensePlate: 'SCH-1019',
    capacity: 72,
    status: 'Active',
    driver: 'Marcus Greene',
    primaryRoute: 'Hillcrest Elementary AM - Coral',
    secondaryRoute: 'Hillcrest Elementary PM - Coral',
    defaultGarage: 'Central Service Center',
    midDayGarage: 'South District Garage',
    gpsHardwareId: 'GPS-5N7W1D4',
    hourmeter: 620,
    useTydAvl: true,
    lastInspection: '2025-03-01',
    nextInspection: '2025-06-01',
    maintenanceStatus: 'Excellent',
    incidentCount: 0,
    mileage: 8340,
    fuelType: 'Diesel',
    notes: 'Newest vehicle in fleet'
  },
  {
    id: 'VEH-020',
    name: 'Bus 20',
    make: 'Thomas Built',
    model: 'Saf-T-Liner C2',
    year: 2022,
    vin: '1T8HFEA15NF556677',
    licensePlate: 'SCH-1020',
    capacity: 84,
    status: 'Active',
    driver: 'Diane Nguyen',
    primaryRoute: 'Summit Academy AM - Ivory',
    secondaryRoute: 'Summit Academy PM - Ivory',
    defaultGarage: 'North District Garage',
    midDayGarage: 'East Service Center',
    gpsHardwareId: 'GPS-2G4H6J8',
    hourmeter: 2340,
    useTydAvl: true,
    lastInspection: '2025-02-22',
    nextInspection: '2025-05-22',
    maintenanceStatus: 'Good',
    incidentCount: 4,
    mileage: 32100,
    fuelType: 'Diesel',
    notes: 'New stop sign arm installed 2025-02-10'
  },

  // ─── Vehicles back-filled from mockDrivers ─────────────────────────────────
  // These four were assigned to drivers and referenced by incidents but had no
  // vehicle record, so their incidents landed on no row at all. Driver, runs,
  // and garage are copied from the matching mockDrivers entry, which is the
  // authoritative driver-to-vehicle assignment.
  {
    id: 'VEH-004',
    name: 'Bus 4',
    make: 'Blue Bird',
    model: 'Vision',
    year: 2021,
    vin: '1BABNBYA3MF334455',
    licensePlate: 'SCH-1004',
    capacity: 72,
    status: 'Active',
    driver: 'Marcus Washington',
    primaryRoute: 'Eastside Middle AM - Teal',
    secondaryRoute: 'Eastside Middle PM - Teal',
    defaultGarage: 'East Service Center',
    midDayGarage: 'Central Service Center',
    gpsHardwareId: 'GPS-4B7N1P5',
    hourmeter: 4120,
    useTydAvl: true,
    lastInspection: '2025-02-08',
    nextInspection: '2025-05-08',
    maintenanceStatus: 'Good',
    incidentCount: 3,
    mileage: 51870,
    fuelType: 'Diesel',
    notes: ''
  },
  {
    id: 'VEH-006',
    name: 'Bus 6',
    make: 'IC Bus',
    model: 'CE Series',
    year: 2020,
    vin: '4DRBUAAN5LB556677',
    licensePlate: 'SCH-1006',
    capacity: 66,
    status: 'Active',
    driver: 'Angela Foster',
    primaryRoute: 'Oakwood Elementary AM - Bronze',
    secondaryRoute: 'Oakwood Elementary PM - Bronze',
    defaultGarage: 'Central Service Center',
    midDayGarage: 'North District Garage',
    gpsHardwareId: 'GPS-6C9Q2R7',
    hourmeter: 5240,
    useTydAvl: true,
    lastInspection: '2025-01-30',
    nextInspection: '2025-04-30',
    maintenanceStatus: 'Good',
    incidentCount: 2,
    mileage: 63410,
    fuelType: 'Diesel',
    notes: ''
  },
  {
    id: 'VEH-010',
    name: 'Bus 10',
    make: 'Thomas Built',
    model: 'Saf-T-Liner C2',
    year: 2023,
    vin: '1T8HFEA15PF778899',
    licensePlate: 'SCH-1010',
    capacity: 84,
    status: 'Active',
    driver: 'Derek Coleman',
    primaryRoute: 'Parkview Middle AM - Navy',
    secondaryRoute: 'Parkview Middle PM - Navy',
    defaultGarage: 'East Service Center',
    midDayGarage: 'South District Garage',
    gpsHardwareId: 'GPS-1D3S5T9',
    hourmeter: 1980,
    useTydAvl: true,
    lastInspection: '2025-02-26',
    nextInspection: '2025-05-26',
    maintenanceStatus: 'Excellent',
    incidentCount: 2,
    mileage: 24650,
    fuelType: 'Diesel',
    notes: ''
  },
  {
    id: 'VEH-011',
    name: 'Bus 11',
    make: 'Blue Bird',
    model: 'All American',
    year: 2019,
    vin: '1BAAKCPA9KF990011',
    licensePlate: 'SCH-1011',
    capacity: 78,
    status: 'Active',
    driver: 'Thomas Nguyen',
    primaryRoute: 'Hillcrest High AM - Crimson',
    secondaryRoute: 'Hillcrest High PM - Crimson',
    defaultGarage: 'South District Garage',
    midDayGarage: 'East Service Center',
    gpsHardwareId: 'GPS-8E5U7V1',
    hourmeter: 6830,
    useTydAvl: true,
    lastInspection: '2025-01-24',
    nextInspection: '2025-04-24',
    maintenanceStatus: 'Needs Attention',
    incidentCount: 2,
    mileage: 78920,
    fuelType: 'Diesel',
    notes: 'Rear suspension inspection scheduled'
  },
];

interface VehiclesPageProps {
  onNavigate: (page: string) => void;
  // Opens the incidents grid scoped to one vehicle. Optional so the page still
  // renders if a caller has not wired it; the count degrades to plain text.
  onNavigateToIncidentsMatching?: (term: string) => void;
}

export function VehiclesPage({ onNavigate, onNavigateToIncidentsMatching }: VehiclesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  // Per-column filters, matching the Forge build's Vehicles grid.
  const [idFilter, setIdFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [garageTextFilter, setGarageTextFilter] = useState('');
  const paginatorRef = useRef<HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [mileageRangeFilter, setMileageRangeFilter] = useState<string[]>([]);
  const [garageFilter, setGarageFilter] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const toastHelper = useForgeToast();

  // Sorting state - default sort by vehicle name
  const [sortColumn, setSortColumn] = useState<'id' | 'details' | 'driver' | 'route' | 'status' | 'maintenance' | 'incidents' | 'mileage'>('details');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Function to get bus icon based on make and model
  const getBusIconByMakeModel = (make: string, model: string) => {
    const makeModelKey = `${make} ${model}`.toLowerCase();
    
    if (makeModelKey.includes('blue bird') && makeModelKey.includes('vision')) {
      return { icon: <BlueBirdVisionIcon />, type: 'Blue Bird Vision', description: 'Modern conventional school bus with distinctive front cap design' };
    } else if (makeModelKey.includes('ic bus') && makeModelKey.includes('ce')) {
      return { icon: <ICBusCESeriesIcon />, type: 'IC Bus CE Series', description: 'Commercial-style conventional with squared-off front profile' };
    } else if (makeModelKey.includes('thomas') && makeModelKey.includes('saf-t-liner c2')) {
      return { icon: <ThomasSafTLinerC2Icon />, type: 'Thomas Built Saf-T-Liner C2', description: 'Conventional bus with distinctive rounded nose' };
    } else if (makeModelKey.includes('thomas') && makeModelKey.includes('hdx')) {
      return { icon: <ThomasSafTLinerHDXIcon />, type: 'Thomas Built Saf-T-Liner HDX', description: 'Heavy-duty conventional with angular front design' };
    } else if (makeModelKey.includes('blue bird') && makeModelKey.includes('all american')) {
      return { icon: <BlueBirdAllAmericanIcon />, type: 'Blue Bird All American', description: 'Traditional conventional with classic Blue Bird profile' };
    } else {
      // Default to Blue Bird Vision for unknown models
      return { icon: <BlueBirdVisionIcon />, type: `${make} ${model}`, description: 'Conventional school bus' };
    }
  };

  // Incident counts derived from mockIncidents rather than read from the seeded
  // incidentCount field, so filing a vehicle incident actually moves the number
  // on this grid. Keyed by vehicle name ('Bus 15'), which is the only vehicle
  // identifier an incident carries.
  //
  // This must stay inside the component. VehiclesPage and IncidentsPage sit in
  // an import cycle (IncidentsPage -> NewIncidentForm -> VehiclesPage), so at
  // this module's top level mockIncidents is still in its temporal dead zone.
  const incidentCountByVehicle = useMemo(() => {
    const counts = new Map<string, number>();
    for (const inc of mockIncidents as any[]) {
      // A vehicle is linked either by the bus the incident happened on, or by
      // assetRef on a vehicle-subject incident. 'N/A' is the seeded placeholder
      // for incidents with no vehicle at all.
      const names = new Set(
        [inc.bus, inc.subject === 'vehicle' ? inc.assetRef : null]
          .filter((n: any) => typeof n === 'string' && n && n !== 'N/A')
      );
      for (const name of names) {
        counts.set(name as string, (counts.get(name as string) ?? 0) + 1);
      }
    }
    return counts;
  }, []);

  const incidentsFor = (vehicle: any) => incidentCountByVehicle.get(vehicle.name) ?? 0;

  // Garage options come from the fleet rather than mockLocations, so a garage
  // no vehicle is based at does not appear as an option that filters to nothing.
  const uniqueGarages = Array.from(
    new Set(mockVehicles.map(v => v.defaultGarage).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  // Typeahead groups, limited to the fields the filter above actually matches.
  // Vehicle IDs stay searchable but unsuggested; the bus name is what people use.
  const searchSuggestionGroups = useMemo(() => [
    { kind: 'Vehicle', values: mockVehicles.map(v => v.name) },
    { kind: 'Driver', values: mockVehicles.map(v => v.driver) },
    { kind: 'Run', values: mockVehicles.flatMap(v => [v.primaryRoute, v.secondaryRoute]) },
    { kind: 'Garage', values: uniqueGarages },
  ], []);

  // Calculate summary statistics
  const totalVehicles = mockVehicles.length;
  const activeVehicles = mockVehicles.filter(v => v.status === 'Active').length;
  const inMaintenance = mockVehicles.filter(v => v.status === 'Maintenance').length;
  const needsAttention = mockVehicles.filter(v => v.maintenanceStatus === 'Needs Attention' || v.maintenanceStatus === 'In Repair').length;
  const inactiveVehicles = mockVehicles.filter(v => v.status !== 'Active').length;
  const avgIncidents = (mockVehicles.reduce((sum, v) => sum + incidentsFor(v), 0) / totalVehicles).toFixed(1);
  const avgMileage = Math.round(mockVehicles.reduce((sum, v) => sum + v.mileage, 0) / totalVehicles);

  // Filter vehicles
  const filteredVehicles = mockVehicles.filter((vehicle) => {
    // The garage is matched because the placeholder promised it and because a
    // location incident names a garage, which is the only way to get from that
    // incident back to the vehicles based there. Secondary run included since an
    // incident may cite either leg of the day.
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = q === '' || [
      vehicle.id,
      vehicle.name,
      vehicle.driver,
      vehicle.primaryRoute,
      vehicle.secondaryRoute,
      vehicle.defaultGarage,
    ].some((field: any) => (field ?? '').toLowerCase().includes(q));

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(vehicle.status);
    const bucketForMileage = (m: number): string => {
      const bucket = Math.floor(m / 10000) * 10;
      return `${bucket}k-${bucket + 10}k`;
    };
    const matchesMaintenance = mileageRangeFilter.length === 0 || mileageRangeFilter.includes(bucketForMileage(vehicle.mileage));
    // Home garage only, which is the value this grid displays. midDayGarage is
    // deliberately excluded: filtering on a field the row does not show would
    // return vehicles whose visible garage disagrees with the filter chip.
    const matchesGarage = garageFilter.length === 0 || garageFilter.includes(vehicle.defaultGarage);

    const matchesId = !idFilter.trim() || String(vehicle.id).toLowerCase().includes(idFilter.trim().toLowerCase());
    const matchesDriverText = !driverFilter.trim() || String(vehicle.assignedDriver ?? '').toLowerCase().includes(driverFilter.trim().toLowerCase());
    const matchesGarageText = !garageTextFilter.trim() || String(vehicle.defaultGarage ?? '').toLowerCase().includes(garageTextFilter.trim().toLowerCase());

    return matchesSearch && matchesStatus && matchesMaintenance && matchesGarage
      && matchesId && matchesDriverText && matchesGarageText;
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
  
  // Sort the filtered vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    let compareResult = 0;
    
    switch (sortColumn) {
      case 'id':
        compareResult = a.id.localeCompare(b.id);
        break;
      case 'details':
        // Sort by name
        compareResult = a.name.localeCompare(b.name);
        break;
      case 'driver':
        compareResult = a.driver.localeCompare(b.driver);
        break;
      case 'route':
        compareResult = (a.defaultGarage || '').localeCompare(b.defaultGarage || '');
        break;
      case 'status':
        compareResult = a.status.localeCompare(b.status);
        break;
      case 'maintenance':
        const maintenanceOrder = { 'Excellent': 4, 'Good': 3, 'Needs Attention': 2, 'In Repair': 1 };
        compareResult = (maintenanceOrder[a.maintenanceStatus as keyof typeof maintenanceOrder] || 0) - 
                       (maintenanceOrder[b.maintenanceStatus as keyof typeof maintenanceOrder] || 0);
        break;
      case 'incidents':
        compareResult = incidentsFor(a) - incidentsFor(b);
        break;
      case 'mileage':
        compareResult = a.mileage - b.mileage;
        break;
    }
    
    return sortDirection === 'asc' ? compareResult : -compareResult;
  });
  
  // Pagination calculations
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

  const totalPages = Math.ceil(sortedVehicles.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedVehicles = sortedVehicles.slice(startIndex, startIndex + rowsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, mileageRangeFilter, rowsPerPage]);

  useEffect(() => {
    const el = dialogRef.current as any;
    if (!el) return;
    el.open = dialogOpen;
  }, [dialogOpen]);

  useEffect(() => {
    const el = dialogRef.current as any;
    if (!el) return;
    const handler = () => { setDialogOpen(false); setSelectedVehicle(null); };
    el.addEventListener('forge-dialog-close', handler);
    return () => el.removeEventListener('forge-dialog-close', handler);
  }, []);

  // Render sort icon for column header
  const SortIcon = ({ column }: { column: typeof sortColumn }) => {
    if (sortColumn !== column) {
      return <forge-icon name="unfold_more" style={{ fontSize: '14px', marginLeft: '4px', opacity: 0.5 }}></forge-icon>;
    }
    return sortDirection === 'asc' 
      ? <forge-icon name="arrow_upward" style={{ fontSize: '14px', marginLeft: '4px' }}></forge-icon>
      : <forge-icon name="arrow_downward" style={{ fontSize: '14px', marginLeft: '4px' }}></forge-icon>;
  };

  const getMaintenanceColor = (status: string) => {
    switch (status) {
      case 'Excellent':
        return 'default';
      case 'Good':
        return 'secondary';
      case 'Needs Attention':
        return 'destructive';
      case 'In Repair':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getMaintenanceIcon = (status: string) => {
    switch (status) {
      case 'Excellent':
      case 'Good':
        return <forge-icon name="check_circle" style={{ fontSize: '16px' }}></forge-icon>;
      case 'Needs Attention':
        return <forge-icon name="warning" style={{ fontSize: '16px' }}></forge-icon>;
      case 'In Repair':
        return <forge-icon name="build" style={{ fontSize: '16px' }}></forge-icon>;
      default:
        return <forge-icon name="access_time" style={{ fontSize: '16px' }}></forge-icon>;
    }
  };

  const handleExport = (format: ExportFormat) => {
    const formatLabels: Record<ExportFormat, string> = {
      excel: 'Excel Spreadsheet', csv: 'CSV',
    };
    const formatExtensions: Record<ExportFormat, string> = {
      excel: 'xlsx', csv: 'csv',
    };

    toastHelper[0]({
      message: `Export started, preparing ${formatLabels[format]} for vehicles data.`,
      theme: 'success',
      duration: 3000,
    } as any);

    setTimeout(() => {
      const headers = ['Vehicle ID', 'Name', 'Make', 'Model', 'Year', 'Driver', 'Primary Run', 'Status', 'Maintenance', 'Incidents', 'Mileage', 'Last Inspection'];
      const rows = filteredVehicles.map(v => [
        v.id, v.name, v.make, v.model, v.year, `"${v.driver}"`,
        `"${v.primaryRoute}"`, v.status, v.maintenanceStatus,
        incidentsFor(v), v.mileage, v.lastInspection
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehicles-export-${new Date().toISOString().split('T')[0]}.${formatExtensions[format]}`;
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
          <h1 style={{ margin: 0, marginBottom: '8px' }}>Vehicles</h1>
          <p className="text-muted-foreground" style={{ margin: 0 }}>
            Monitor and manage all district vehicles
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{totalVehicles}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Total Vehicles</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-olive-medium)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{activeVehicles}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Active Vehicles</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: inactiveVehicles > 0 ? '#dc2626' : 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{inactiveVehicles}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Inactive Vehicles</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{avgIncidents}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Avg. Incidents</h3>
          </div>
        </ForgeCard>
      </div>

      {/* Filters Card */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)', marginBottom: 'var(--forge-spacing-large)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)', paddingTop: 'var(--forge-spacing-large)' }}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <EntitySearchField
                value={searchTerm}
                onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                placeholder="Search vehicles, drivers, runs, or garage..."
                groups={searchSuggestionGroups}
              />
            </div>

            {/* Status Filter */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Maintenance', label: 'Maintenance' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
                selected={statusFilter}
                onChange={setStatusFilter}
                placeholder="Status"
                allLabel="All Statuses"
                width="180px"
              />
            </div>

            {/* Mileage Range Filter */}
            <div className="shrink-0">
              <ForgeMultiSelect
                options={[
                  { value: '0k-10k', label: '0, 10,000 mi' },
                  { value: '10k-20k', label: '10,000, 20,000 mi' },
                  { value: '20k-30k', label: '20,000, 30,000 mi' },
                  { value: '30k-40k', label: '30,000, 40,000 mi' },
                  { value: '40k-50k', label: '40,000, 50,000 mi' },
                  { value: '50k-60k', label: '50,000, 60,000 mi' },
                  { value: '60k-70k', label: '60,000, 70,000 mi' },
                  { value: '70k-80k', label: '70,000, 80,000 mi' },
                  { value: '80k-90k', label: '80,000, 90,000 mi' },
                  { value: '90k-100k', label: '90,000, 100,000 mi' },
                ]}
                selected={mileageRangeFilter}
                onChange={setMileageRangeFilter}
                placeholder="Mileage Range"
                allLabel="All Ranges"
                width="220px"
              />
            </div>

            {/* Garage Filter. A location incident names a garage, so this is how
                you get from that incident to the vehicles based there. */}
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

      {/* Vehicles Table */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)' }} className="flex flex-row items-center justify-between">
          <h3 className="forge-typography--heading4">
            All Vehicles <span className="text-muted-foreground">({filteredVehicles.length})</span>
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
                      Vehicle ID
                      <SortIcon column="id" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('details')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Vehicle
                      <SortIcon column="details" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('driver')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Driver
                      <SortIcon column="driver" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('route')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Default Garage
                      <SortIcon column="route" />
                    </button>
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <button
                      onClick={() => handleSort('mileage')}
                      className="flex items-center hover:text-primary transition-colors cursor-pointer"
                    >
                      Mileage
                      <SortIcon column="mileage" />
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
                    <input value={idFilter} onChange={(e) => setIdFilter(e.target.value)} placeholder="Filter Vehicle ID..." style={colFilterStyle} />
                  </th>
                  <th className="forge-table-cell forge-table-cell--header"></th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <input value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} placeholder="Filter Driver..." style={colFilterStyle} />
                  </th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <input value={garageTextFilter} onChange={(e) => setGarageTextFilter(e.target.value)} placeholder="Filter Default Garage..." style={colFilterStyle} />
                  </th>
                  <th className="forge-table-cell forge-table-cell--header"></th>
                  <th className="forge-table-cell forge-table-cell--header"></th>
                  <th className="forge-table-cell forge-table-cell--header">
                    <ColumnSelect placeholder="Filter Status..." options={['Active', 'Inactive']} selected={statusFilter} onChange={setStatusFilter} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="forge-table-row cursor-pointer"
                    onClick={() => { setSelectedVehicle(vehicle); setDialogOpen(true); }}
                    style={{ transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--forge-theme-primary-container-minimum)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                  >
                    <td className="forge-table-cell">
                      <span style={{ fontWeight: 500, fontFamily: 'var(--forge-font-family)' }}>
                        {vehicle.id}
                      </span>
                    </td>
                    <td className="forge-table-cell">
                      <div>
                        <div style={{ fontWeight: 500, fontFamily: 'var(--forge-font-family)' }}>{vehicle.name}</div>
                      </div>
                    </td>
                    <td className="forge-table-cell">
                      <div className="flex items-center gap-2">
                        <forge-icon name="person" style={{ fontSize: '16px', color: 'var(--forge-theme-text-medium)' }}></forge-icon>
                        <span>{vehicle.driver}</span>
                      </div>
                    </td>
                    <td className="forge-table-cell">
                      <div className="flex items-center gap-2">
                        <forge-icon name="location_on" style={{ fontSize: '16px', color: 'var(--forge-theme-text-medium)' }}></forge-icon>
                        <span style={{ fontSize: '0.875rem' }}>{vehicle.defaultGarage || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="forge-table-cell">
                      <span style={{ fontSize: '0.875rem', color: 'var(--forge-theme-text-low)' }}>
                        {vehicle.mileage.toLocaleString()} mi
                      </span>
                    </td>
                    <td className="forge-table-cell">
                      {/* stopPropagation so the count opens the incidents grid
                          rather than the vehicle detail dialog behind it. Zero
                          stays plain text; there is nothing to open. */}
                      {incidentsFor(vehicle) > 0 && onNavigateToIncidentsMatching ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigateToIncidentsMatching(vehicle.name); }}
                          title={`View incidents involving ${vehicle.name}`}
                          style={{
                            fontFamily: 'var(--forge-font-family)',
                            fontSize: 'inherit',
                            fontWeight: incidentsFor(vehicle) > 8 ? 600 : 'normal',
                            color: 'var(--forge-theme-primary)',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {incidentsFor(vehicle)}
                        </button>
                      ) : (
                        <span style={{ fontWeight: incidentsFor(vehicle) > 8 ? 600 : 'normal' }}>
                          {incidentsFor(vehicle)}
                        </span>
                      )}
                    </td>
                    <td className="forge-table-cell">
                      <forge-badge theme={vehicle.status === 'Active' ? 'success' : 'default'}>
                        {vehicle.status}
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
              total={sortedVehicles.length}
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
      <forge-dialog ref={dialogRef} aria-label={`Vehicle Details - ${selectedVehicle?.id || ''}`}>
        <div style={{ padding: 'var(--forge-spacing-large)', minWidth: '600px', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--forge-spacing-medium)' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--forge-font-family)', fontWeight: 700, fontSize: 'var(--forge-font-size-xl)' }}>
                Vehicle Details - {selectedVehicle?.id}
              </h2>
              <p style={{ margin: 0, marginTop: 'var(--forge-spacing-xxsmall)', fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>
                Complete information for {selectedVehicle?.name}
              </p>
            </div>
            {selectedVehicle && (
              <forge-badge theme={selectedVehicle.status === 'Active' ? 'success' : 'default'}>
                {selectedVehicle.status}
              </forge-badge>
            )}
          </div>
          {selectedVehicle && (
            <div className="space-y-6">
              {/* VIN, Capacity, Current Mileage, Vehicle Incident Count */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>VIN</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', marginTop: 'var(--forge-spacing-xxsmall)' }}>{selectedVehicle.vin}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>Capacity</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', marginTop: 'var(--forge-spacing-xxsmall)' }}>{selectedVehicle.capacity} passengers</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>Current Mileage</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', marginTop: 'var(--forge-spacing-xxsmall)' }}>{selectedVehicle.mileage.toLocaleString()} miles</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>Vehicle Incident Count</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', marginTop: 'var(--forge-spacing-xxsmall)' }}>{incidentsFor(selectedVehicle)} incidents this year</div>
                  </div>
                </div>
              </div>

              {/* GPS & AVL Configuration */}
              <div className="border-t pt-4">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)' }}>
                  GPS & AVL Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>GPS Hardware ID</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', marginTop: 'var(--forge-spacing-xxsmall)' }}>{selectedVehicle.gpsHardwareId}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>TYD AVL Integration</div>
                    <div className="flex items-center gap-2" style={{ marginTop: 'var(--forge-spacing-xxsmall)' }}>
                      <div
                        className={`w-3 h-3 rounded-full ${selectedVehicle.useTydAvl ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>{selectedVehicle.useTydAvl ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Garage Assignments */}
              <div className="border-t pt-4">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)' }}>
                  Garage Assignments
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>Default Garage</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', marginTop: 'var(--forge-spacing-xxsmall)' }}>{selectedVehicle.defaultGarage}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>Mid-Day Garage</div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', marginTop: 'var(--forge-spacing-xxsmall)' }}>{selectedVehicle.midDayGarage}</div>
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div className="border-t pt-4">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--forge-spacing-small)', fontFamily: 'var(--forge-font-family)' }}>
                  Assignment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>Assigned Driver</div>
                    <div className="flex items-center gap-2" style={{ marginTop: 'var(--forge-spacing-xxsmall)' }}>
                      <forge-icon name="person" style={{ fontSize: '16px', color: 'var(--forge-theme-text-medium)' }}></forge-icon>
                      <span style={{ fontWeight: 500, fontFamily: 'var(--forge-font-family)' }}>{selectedVehicle.driver}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground" style={{ fontSize: 'var(--forge-font-size-sm)', fontFamily: 'var(--forge-font-family)' }}>Primary Run</div>
                    <div className="flex items-center gap-2" style={{ marginTop: 'var(--forge-spacing-xxsmall)' }}>
                      <forge-icon name="location_on" style={{ fontSize: '16px', color: 'var(--forge-theme-text-medium)' }}></forge-icon>
                      <span style={{ fontFamily: 'var(--forge-font-family)' }}>{selectedVehicle.primaryRoute || 'None'}</span>
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