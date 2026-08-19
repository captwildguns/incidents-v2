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
} from '@tylertech/forge';
defineCardComponent();
defineDialogComponent();
defineTextFieldComponent();
defineButtonComponent();
defineBadgeComponent();
defineAutocompleteComponent();
defineIconComponent();
import { ForgeMultiSelect } from '../ui/forge-multiselect';
import { ExportDropdown } from '../shared/ExportDropdown';
import type { ExportFormat } from '../shared/ExportDropdown';
import { mockIncidents } from '../incidents/IncidentsPage';

// Mock driver data
export const mockDrivers = [
  {
    id: 'DRV-001',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    fullName: 'Sarah Mitchell',
    employeeId: 'EMP-2019-045',
    phone: '(555) 123-4567',
    email: 'sarah.mitchell@district.edu',
    photo: 'https://images.unsplash.com/photo-1589220286904-3dcef62c68ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBwcm9mZXNzaW9uYWwlMjBwYXNzcG9ydCUyMGhlYWRzaG90JTIwcGhvdG98ZW58MXx8fHwxNzY5NTI2ODE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-8472651',
    licenseExpiry: '2026-08-15',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2019-08-15',
    yearsOfService: 5,
    assignedVehicle: 'Bus 1',
    vehicleId: 'VEH-001',
    primaryRoute: 'Westside Elementary AM - Gold',
    secondaryRoute: 'Westside Elementary PM - Gold',
    defaultGarage: 'East Service Center',
    incidentCount: 7,
    safetyRating: 'Good',
    lastTrainingDate: '2024-12-10',
    nextTrainingDate: '2025-06-10',
    certifications: ['First Aid', 'CPR', 'Defensive Driving', 'Student Management'],
    medicalExamExpiry: '2025-12-20',
    backgroundCheckExpiry: '2025-09-01',
    performanceScore: 87,
    onTimePercentage: 94,
    notes: 'Excellent with special needs students'
  },
  {
    id: 'DRV-002',
    firstName: 'James',
    lastName: 'Rodriguez',
    fullName: 'James Rodriguez',
    employeeId: 'EMP-2023-112',
    phone: '(555) 234-5678',
    email: 'james.rodriguez@district.edu',
    photo: 'https://images.unsplash.com/photo-1567662851835-98c9c2a1180c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwaGlzcGFuaWMlMjBwcm9mZXNzaW9uYWwlMjBwYXNzcG9ydCUyMGhlYWRzaG90fGVufDF8fHx8MTc2OTUyNjgxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-9584621',
    licenseExpiry: '2027-03-22',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2023-08-01',
    yearsOfService: 1,
    assignedVehicle: 'Bus 2',
    vehicleId: 'VEH-002',
    primaryRoute: 'Northside High AM - Silver',
    secondaryRoute: 'Northside High PM - Silver',
    defaultGarage: 'South District Garage',
    incidentCount: 1,
    safetyRating: 'Excellent',
    lastTrainingDate: '2025-01-15',
    nextTrainingDate: '2025-07-15',
    certifications: ['First Aid', 'CPR', 'Defensive Driving'],
    medicalExamExpiry: '2026-07-30',
    backgroundCheckExpiry: '2026-08-01',
    performanceScore: 96,
    onTimePercentage: 98,
    notes: 'New hire, excellent performance'
  },
  {
    id: 'DRV-003',
    firstName: 'Patricia',
    lastName: 'Wilson',
    fullName: 'Patricia Wilson',
    employeeId: 'EMP-2017-089',
    phone: '(555) 345-6789',
    email: 'patricia.wilson@district.edu',
    photo: 'https://images.unsplash.com/photo-1744127176890-66798b8e75af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXR1cmUlMjBmZW1hbGUlMjBwcm9mZXNzaW9uYWwlMjBwYXNzcG9ydCUyMHBob3RvfGVufDF8fHx8MTc2OTUyNjgxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-7362514',
    licenseExpiry: '2025-11-08',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2017-09-01',
    yearsOfService: 7,
    assignedVehicle: 'Bus 3',
    vehicleId: 'VEH-003',
    primaryRoute: 'Central Elementary AM - Purple',
    secondaryRoute: 'Central Elementary PM - Purple',
    defaultGarage: 'Central Service Center',
    incidentCount: 2,
    safetyRating: 'Excellent',
    lastTrainingDate: '2024-11-20',
    nextTrainingDate: '2025-05-20',
    certifications: ['First Aid', 'CPR', 'Defensive Driving', 'Student Management', 'Crisis Intervention'],
    medicalExamExpiry: '2025-10-15',
    backgroundCheckExpiry: '2025-09-01',
    performanceScore: 93,
    onTimePercentage: 97,
    notes: 'Senior driver, mentor for new hires'
  },
  {
    id: 'DRV-004',
    firstName: 'John',
    lastName: 'Chen',
    fullName: 'John Chen',
    employeeId: 'EMP-2020-067',
    phone: '(555) 456-7890',
    email: 'john.chen@district.edu',
    photo: 'https://images.unsplash.com/photo-1567662851835-98c9c2a1180c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hbGUlMjBwcm9mZXNzaW9uYWwlMjBwYXNzcG9ydCUyMGhlYWRzaG90fGVufDF8fHx8MTc2OTUyNjgxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-6251487',
    licenseExpiry: '2026-05-14',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2020-09-15',
    yearsOfService: 4,
    assignedVehicle: 'Bus 12',
    vehicleId: 'VEH-012',
    primaryRoute: 'Meyers Middle AM - Yellow',
    secondaryRoute: 'Meyers Middle PM - Yellow',
    defaultGarage: 'North District Garage',
    incidentCount: 12,
    safetyRating: 'Needs Improvement',
    lastTrainingDate: '2024-09-15',
    nextTrainingDate: '2025-03-15',
    certifications: ['First Aid', 'CPR', 'Defensive Driving'],
    medicalExamExpiry: '2025-08-20',
    backgroundCheckExpiry: '2025-09-15',
    performanceScore: 72,
    onTimePercentage: 88,
    notes: 'Additional training scheduled due to incident rate'
  },
  {
    id: 'DRV-005',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    fullName: 'Jennifer Martinez',
    employeeId: 'EMP-2021-098',
    phone: '(555) 567-8901',
    email: 'jennifer.martinez@district.edu',
    photo: 'https://images.unsplash.com/photo-1750175473842-353543b839db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXNwYW5pYyUyMGZlbWFsZSUyMHByb2Zlc3Npb25hbCUyMHBhc3Nwb3J0JTIwcGhvdG98ZW58MXx8fHwxNzY5NTI2ODIwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-5147896',
    licenseExpiry: '2027-01-10',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2021-08-20',
    yearsOfService: 3,
    assignedVehicle: 'Bus 9',
    vehicleId: 'VEH-009',
    primaryRoute: 'Lincoln Elementary AM - Green',
    secondaryRoute: 'Lincoln Elementary PM - Green',
    defaultGarage: 'Central Service Center',
    incidentCount: 5,
    safetyRating: 'Good',
    lastTrainingDate: '2024-10-05',
    nextTrainingDate: '2025-04-05',
    certifications: ['First Aid', 'CPR', 'Defensive Driving', 'Student Management'],
    medicalExamExpiry: '2026-01-15',
    backgroundCheckExpiry: '2025-08-20',
    performanceScore: 89,
    onTimePercentage: 95,
    notes: ''
  },
  {
    id: 'DRV-006',
    firstName: 'Robert',
    lastName: 'Thompson',
    fullName: 'Robert Thompson',
    employeeId: 'EMP-2021-103',
    phone: '(555) 678-9012',
    email: 'robert.thompson@district.edu',
    photo: 'https://images.unsplash.com/photo-1567662851835-98c9c2a1180c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwcHJvZmVzc2lvbmFsJTIwcGFzc3BvcnQlMjBoZWFkc2hvdCUyMHBob3RvfGVufDF8fHx8MTc2OTUyNjgyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-4258963',
    licenseExpiry: '2026-09-25',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2021-09-10',
    yearsOfService: 3,
    assignedVehicle: 'Bus 14',
    vehicleId: 'VEH-014',
    primaryRoute: 'Roosevelt High AM - Red',
    secondaryRoute: 'Roosevelt High PM - Red',
    defaultGarage: 'South District Garage',
    incidentCount: 6,
    safetyRating: 'Good',
    lastTrainingDate: '2024-11-01',
    nextTrainingDate: '2025-05-01',
    certifications: ['First Aid', 'CPR', 'Defensive Driving'],
    medicalExamExpiry: '2025-11-30',
    backgroundCheckExpiry: '2025-09-10',
    performanceScore: 85,
    onTimePercentage: 92,
    notes: ''
  },
  {
    id: 'DRV-007',
    firstName: 'Lisa',
    lastName: 'Anderson',
    fullName: 'Lisa Anderson',
    employeeId: 'EMP-2019-071',
    phone: '(555) 789-0123',
    email: 'lisa.anderson@district.edu',
    photo: 'https://images.unsplash.com/photo-1740153204804-200310378f2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZlbWFsZSUyMHByb2Zlc3Npb25hbCUyMHBhc3Nwb3J0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzY5NTI2ODIwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-3698521',
    licenseExpiry: '2026-06-18',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2019-09-05',
    yearsOfService: 5,
    assignedVehicle: 'Bus 8',
    vehicleId: 'VEH-008',
    primaryRoute: 'Washington High PM - Wolf Rd',
    secondaryRoute: '',
    defaultGarage: 'South District Garage',
    incidentCount: 9,
    safetyRating: 'Good',
    lastTrainingDate: '2024-08-22',
    nextTrainingDate: '2025-02-22',
    certifications: ['First Aid', 'CPR', 'Defensive Driving', 'Student Management'],
    medicalExamExpiry: '2025-09-10',
    backgroundCheckExpiry: '2025-09-05',
    performanceScore: 81,
    onTimePercentage: 90,
    notes: 'Part-time driver'
  },
  {
    id: 'DRV-008',
    firstName: 'David',
    lastName: 'Park',
    fullName: 'David Park',
    employeeId: 'EMP-2022-134',
    phone: '(555) 890-1234',
    email: 'david.park@district.edu',
    photo: 'https://images.unsplash.com/photo-1567662851835-98c9c2a1180c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMG1hbGUlMjBwYXNzcG9ydCUyMHByb2Zlc3Npb25hbCUyMHBob3RvfGVufDF8fHx8MTc2OTUyNjgyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-2581473',
    licenseExpiry: '2027-04-12',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2022-08-15',
    yearsOfService: 2,
    assignedVehicle: 'Bus 15',
    vehicleId: 'VEH-015',
    primaryRoute: 'Jefferson Middle AM - Blue',
    secondaryRoute: 'Jefferson Middle PM - Blue',
    defaultGarage: 'North District Garage',
    incidentCount: 8,
    safetyRating: 'Good',
    lastTrainingDate: '2024-12-01',
    nextTrainingDate: '2025-06-01',
    certifications: ['First Aid', 'CPR', 'Defensive Driving'],
    medicalExamExpiry: '2026-08-30',
    backgroundCheckExpiry: '2025-08-15',
    performanceScore: 84,
    onTimePercentage: 91,
    notes: ''
  },
  {
    id: 'DRV-009',
    firstName: 'Robert',
    lastName: 'Martinez',
    fullName: 'Robert Martinez',
    employeeId: 'EMP-2022-145',
    phone: '(555) 901-2345',
    email: 'robert.martinez@district.edu',
    photo: 'https://images.unsplash.com/photo-1567662851835-98c9c2a1180c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXNwYW5pYyUyMG1hbGUlMjBwYXNzcG9ydCUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc2OTUyNjgyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-1472589',
    licenseExpiry: '2027-07-22',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2022-09-01',
    yearsOfService: 2,
    assignedVehicle: 'Bus 7',
    vehicleId: 'VEH-007',
    primaryRoute: 'Lincoln Elementary AM - Orange',
    secondaryRoute: 'Lincoln Elementary PM - Orange',
    defaultGarage: 'North District Garage',
    incidentCount: 3,
    safetyRating: 'Excellent',
    lastTrainingDate: '2025-01-05',
    nextTrainingDate: '2025-07-05',
    certifications: ['First Aid', 'CPR', 'Defensive Driving', 'Student Management'],
    medicalExamExpiry: '2027-02-15',
    backgroundCheckExpiry: '2025-09-01',
    performanceScore: 92,
    onTimePercentage: 96,
    notes: ''
  },
  {
    id: 'DRV-010',
    firstName: 'Karen',
    lastName: 'Taylor',
    fullName: 'Karen Taylor',
    employeeId: 'EMP-2018-056',
    phone: '(555) 012-3456',
    email: 'karen.taylor@district.edu',
    photo: 'https://images.unsplash.com/photo-1589220286904-3dcef62c68ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXR1cmUlMjBmZW1hbGUlMjBwYXNzcG9ydCUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc2OTUyNjgyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Inactive',
    licenseNumber: 'CDL-NY-0369852',
    licenseExpiry: '2026-02-14',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2018-08-30',
    yearsOfService: 6,
    assignedVehicle: 'Unassigned',
    vehicleId: '',
    primaryRoute: '',
    secondaryRoute: '',
    defaultGarage: 'East Service Center',
    incidentCount: 4,
    safetyRating: 'Good',
    lastTrainingDate: '2024-07-15',
    nextTrainingDate: '2025-01-15',
    certifications: ['First Aid', 'CPR', 'Defensive Driving', 'Student Management'],
    medicalExamExpiry: '2025-06-20',
    backgroundCheckExpiry: '2025-08-30',
    performanceScore: 88,
    onTimePercentage: 93,
    notes: 'Medical leave until March 2025'
  },
  {
    id: 'DRV-011',
    firstName: 'Marcus',
    lastName: 'Washington',
    fullName: 'Marcus Washington',
    employeeId: 'EMP-2022-158',
    phone: '(555) 112-3344',
    email: 'marcus.washington@district.edu',
    photo: 'https://images.unsplash.com/photo-1745174837801-b7f37abe9d2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYW1lcmljYW4lMjBtYWxlJTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3QlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzI4MDkwMjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-7714523',
    licenseExpiry: '2027-05-20',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2022-09-12',
    yearsOfService: 3,
    assignedVehicle: 'Bus 4',
    vehicleId: 'VEH-004',
    primaryRoute: 'Eastside Middle AM - Teal',
    secondaryRoute: 'Eastside Middle PM - Teal',
    defaultGarage: 'East Service Center',
    incidentCount: 3,
    safetyRating: 'Good',
    lastTrainingDate: '2025-01-20',
    nextTrainingDate: '2025-07-20',
    certifications: ['First Aid', 'CPR', 'Defensive Driving'],
    medicalExamExpiry: '2026-09-12',
    backgroundCheckExpiry: '2025-09-12',
    performanceScore: 86,
    onTimePercentage: 93,
    notes: 'Reliable morning route driver'
  },
  {
    id: 'DRV-012',
    firstName: 'Angela',
    lastName: 'Foster',
    fullName: 'Angela Foster',
    employeeId: 'EMP-2023-171',
    phone: '(555) 223-4455',
    email: 'angela.foster@district.edu',
    photo: 'https://images.unsplash.com/photo-1589220286904-3dcef62c68ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXVjYXNpYW4lMjBmZW1hbGUlMjBwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjgwOTAyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-6623418',
    licenseExpiry: '2027-08-14',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2023-08-28',
    yearsOfService: 2,
    assignedVehicle: 'Bus 6',
    vehicleId: 'VEH-006',
    primaryRoute: 'Oakwood Elementary AM - Bronze',
    secondaryRoute: 'Oakwood Elementary PM - Bronze',
    defaultGarage: 'Central Service Center',
    incidentCount: 2,
    safetyRating: 'Excellent',
    lastTrainingDate: '2025-02-10',
    nextTrainingDate: '2025-08-10',
    certifications: ['First Aid', 'CPR', 'Defensive Driving', 'Student Management'],
    medicalExamExpiry: '2026-08-28',
    backgroundCheckExpiry: '2026-08-28',
    performanceScore: 94,
    onTimePercentage: 97,
    notes: 'Strong rapport with elementary students'
  },
  {
    id: 'DRV-013',
    firstName: 'Thomas',
    lastName: 'Nguyen',
    fullName: 'Thomas Nguyen',
    employeeId: 'EMP-2019-082',
    phone: '(555) 334-5566',
    email: 'thomas.nguyen@district.edu',
    photo: 'https://images.unsplash.com/photo-1753367034674-d38bf4e4d1fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwbWFsZSUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcyODA5MDIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-5532197',
    licenseExpiry: '2026-11-30',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2019-10-01',
    yearsOfService: 6,
    assignedVehicle: 'Bus 11',
    vehicleId: 'VEH-011',
    primaryRoute: 'Hillcrest High AM - Crimson',
    secondaryRoute: 'Hillcrest High PM - Crimson',
    defaultGarage: 'South District Garage',
    incidentCount: 2,
    safetyRating: 'Good',
    lastTrainingDate: '2024-12-15',
    nextTrainingDate: '2025-06-15',
    certifications: ['First Aid', 'CPR', 'Defensive Driving', 'Student Management', 'Crisis Intervention'],
    medicalExamExpiry: '2026-04-01',
    backgroundCheckExpiry: '2025-10-01',
    performanceScore: 90,
    onTimePercentage: 95,
    notes: 'Experienced high school route driver'
  },
  {
    id: 'DRV-014',
    firstName: 'Sandra',
    lastName: 'Brooks',
    fullName: 'Sandra Brooks',
    employeeId: 'EMP-2017-041',
    phone: '(555) 445-6677',
    email: 'sandra.brooks@district.edu',
    photo: 'https://images.unsplash.com/photo-1643921330459-6fb64282f467?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYW1lcmljYW4lMjBmZW1hbGUlMjBwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjgwOTAyM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Inactive',
    licenseNumber: 'CDL-NY-4419876',
    licenseExpiry: '2026-03-10',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2017-08-15',
    yearsOfService: 8,
    assignedVehicle: 'Unassigned',
    vehicleId: '',
    primaryRoute: '',
    secondaryRoute: '',
    defaultGarage: 'North District Garage',
    incidentCount: 1,
    safetyRating: 'Good',
    lastTrainingDate: '2024-06-20',
    nextTrainingDate: '2025-01-20',
    certifications: ['First Aid', 'CPR', 'Defensive Driving', 'Student Management'],
    medicalExamExpiry: '2025-08-15',
    backgroundCheckExpiry: '2025-08-15',
    performanceScore: 82,
    onTimePercentage: 91,
    notes: 'Retired effective January 2025'
  },
  {
    id: 'DRV-015',
    firstName: 'Derek',
    lastName: 'Coleman',
    fullName: 'Derek Coleman',
    employeeId: 'EMP-2024-203',
    phone: '(555) 556-7788',
    email: 'derek.coleman@district.edu',
    photo: 'https://images.unsplash.com/photo-1758613654360-45f1ff78c0cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbGUlMjBwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjgwOTAyM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    status: 'Active',
    licenseNumber: 'CDL-NY-3318745',
    licenseExpiry: '2028-01-15',
    licenseClass: 'Class B CDL',
    endorsements: ['P - Passenger', 'S - School Bus'],
    hireDate: '2024-08-19',
    yearsOfService: 1,
    assignedVehicle: 'Bus 10',
    vehicleId: 'VEH-010',
    primaryRoute: 'Parkview Middle AM - Navy',
    secondaryRoute: 'Parkview Middle PM - Navy',
    defaultGarage: 'East Service Center',
    incidentCount: 2,
    safetyRating: 'Excellent',
    lastTrainingDate: '2025-02-01',
    nextTrainingDate: '2025-08-01',
    certifications: ['First Aid', 'CPR', 'Defensive Driving'],
    medicalExamExpiry: '2027-08-19',
    backgroundCheckExpiry: '2027-08-19',
    performanceScore: 95,
    onTimePercentage: 98,
    notes: 'Newest hire, showing excellent promise'
  },
];

interface DriversPageProps {
  onNavigate: (page: string) => void;
}

export function DriversPage({ onNavigate }: DriversPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [yearsOfServiceFilter, setYearsOfServiceFilter] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const toastHelper = useForgeToast();
  const dialogRef = useRef<HTMLElement>(null);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<'id' | 'name' | 'contact' | 'email' | 'yearsOfService' | 'incidents' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(5);
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

  // Incident counts derived from mockIncidents rather than read from the seeded
  // incidentCount field, so filing an incident actually moves the number on this
  // grid. Keyed by driver full name, which is what every incident carries; the
  // DRV ids on involvedParties are not reliably in sync with this roster.
  //
  // This must stay inside the component. DriversPage and IncidentsPage sit in an
  // import cycle (IncidentsPage -> NewIncidentForm -> DriversPage), so at this
  // module's top level mockIncidents is still in its temporal dead zone.
  const incidentCountByDriver = useMemo(() => {
    const counts = new Map<string, number>();
    const bump = (name: string) => counts.set(name, (counts.get(name) ?? 0) + 1);
    for (const inc of mockIncidents as any[]) {
      // A driver is linked either by having been the driver on the incident, or
      // by being a named employee party on a staff-subject incident. Counted
      // once per incident, so a driver who is both does not count twice.
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

  // Calculate summary statistics
  const totalDrivers = mockDrivers.length;
  const activeDrivers = mockDrivers.filter(d => d.status === 'Active').length;
  const expiringCerts = mockDrivers.filter(d => {
    const licenseExpiry = new Date(d.licenseExpiry);
    const medicalExpiry = new Date(d.medicalExamExpiry);
    const bgExpiry = new Date(d.backgroundCheckExpiry);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return licenseExpiry <= threeMonthsFromNow || medicalExpiry <= threeMonthsFromNow || bgExpiry <= threeMonthsFromNow;
  }).length;
  const inactiveDrivers = mockDrivers.filter(d => d.status !== 'Active').length;
  const avgIncidents = (mockDrivers.reduce((sum, d) => sum + incidentsFor(d), 0) / totalDrivers).toFixed(1);

  // Filter drivers
  const filteredDrivers = mockDrivers.filter((driver) => {
    const matchesSearch =
      driver.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.assignedVehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.primaryRoute.toLowerCase().includes(searchTerm.toLowerCase());
    
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

    return matchesSearch && matchesStatus && matchesYears;
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
      message: `Export started — preparing ${formatLabels[format]} for drivers data.`,
      theme: 'success',
      duration: 3000,
    } as any);

    setTimeout(() => {
      const headers = ['Driver ID', 'Name', 'Employee ID', 'Status', 'Phone', 'Email', 'License', 'Years of Service', 'Primary Run', 'Safety Rating', 'Incidents', 'Performance', 'On-Time %'];
      const rows = sortedDrivers.map(d => [
        d.id, `"${d.fullName}"`, d.employeeId, d.status, d.phone, d.email,
        d.licenseNumber, d.yearsOfService, `"${d.primaryRoute}"`,
        d.safetyRating, incidentsFor(d), d.performanceScore, d.onTimePercentage
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
        message: `Export complete — your ${formatLabels[format]} has been downloaded.`,
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
          <h1 style={{ margin: 0, marginBottom: '8px' }}>Drivers</h1>
          <p className="text-muted-foreground" style={{ margin: 0 }}>
            Monitor and manage all district bus drivers
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 'var(--forge-spacing-large)' }}>
        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{totalDrivers}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Total Drivers</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-olive-medium)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{activeDrivers}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Active Drivers</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: expiringCerts > 0 ? '#dc2626' : 'var(--brand-blue-dark)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{expiringCerts}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Expiring Certifications</h3>
          </div>
        </ForgeCard>

        <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)' }}>
          <div style={{ padding: 'var(--forge-spacing-xsmall) var(--forge-spacing-medium)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--brand-blue-medium)', fontFamily: 'var(--forge-font-family)', lineHeight: 1 }}>{inactiveDrivers}</div>
            <h3 className="forge-typography--heading4" style={{ fontSize: '0.9375rem', fontWeight: 400, fontFamily: 'var(--forge-font-family)', margin: 'var(--forge-spacing-xxsmall) 0 0', color: 'var(--forge-theme-text-high)' }}>Inactive Drivers</h3>
          </div>
        </ForgeCard>
      </div>

      {/* Filters Card */}
      <ForgeCard style={{ boxShadow: 'var(--forge-elevation-1)', marginBottom: 'var(--forge-spacing-large)' }}>
        <div style={{ padding: 'var(--forge-spacing-medium)', paddingTop: 'var(--forge-spacing-large)' }}>
          <div className="flex items-center" style={{ gap: 'var(--forge-spacing-medium)' }}>
            {/* Search */}
            <div className="flex-1 min-w-0">
              <forge-text-field>
                <forge-icon slot="start" name="search"></forge-icon>
                <input
                  type="text"
                  placeholder="Search drivers, vehicles, or runs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </forge-text-field>
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
                  { value: '1-5', label: '1–5 Years' },
                  { value: '6-10', label: '6–10 Years' },
                  { value: '11-15', label: '11–15 Years' },
                  { value: '16-20', label: '16–20 Years' },
                  { value: '20+', label: '20+ Years' },
                ]}
                selected={yearsOfServiceFilter}
                onChange={(val) => { setYearsOfServiceFilter(val); setCurrentPage(1); }}
                placeholder="Years of Service"
                allLabel="All Years of Service"
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
            All Drivers <span className="text-muted-foreground">({filteredDrivers.length})</span>
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
                      <span style={{ fontWeight: incidentsFor(driver) > 8 ? 600 : 'normal' }}>
                        {incidentsFor(driver)}
                      </span>
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
          <div className="flex items-center justify-between" style={{ paddingTop: 'var(--forge-spacing-medium)', borderTop: '1px solid var(--forge-color-border-subtle)', marginTop: 'var(--forge-spacing-medium)' }}>
            <div className="flex items-center" style={{ gap: 'var(--forge-spacing-small)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontFamily: 'var(--forge-font-family)', whiteSpace: 'nowrap' }}>
                Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, sortedDrivers.length)} of {sortedDrivers.length} drivers
              </span>
              {rowsPerPage === 5 && sortedDrivers.length > 5 && (
                <ForgeButton
                  variant="outlined"
                  dense
                  onClick={() => { setRowsPerPage(25); setCurrentPage(1); }}
                  style={{ fontSize: '0.75rem', fontFamily: 'var(--forge-font-family)' }}
                >
                  Show 25
                </ForgeButton>
              )}
              {rowsPerPage === 25 && (
                <ForgeButton
                  variant="outlined"
                  dense
                  onClick={() => { setRowsPerPage(5); setCurrentPage(1); }}
                  style={{ fontSize: '0.75rem', fontFamily: 'var(--forge-font-family)' }}
                >
                  Show 5
                </ForgeButton>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)' }}>
                <ForgeButton
                  variant="outlined"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: 'var(--forge-spacing-xxsmall) var(--forge-spacing-xsmall)' }}
                >
                  <forge-icon name="chevron_left" style={{ fontSize: '18px' }}></forge-icon>
                </ForgeButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <ForgeButton
                    key={page}
                    variant={page === currentPage ? 'raised' : 'outlined'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      ['--forge-button-min-width' as any]: '24px',
                      ['--forge-button-padding-inline' as any]: '6px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--forge-font-family)',
                    }}
                  >
                    {page}
                  </ForgeButton>
                ))}
                <ForgeButton
                  variant="outlined"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: 'var(--forge-spacing-xxsmall) var(--forge-spacing-xsmall)' }}
                >
                  <forge-icon name="chevron_right" style={{ fontSize: '18px' }}></forge-icon>
                </ForgeButton>
              </div>
            )}
          </div>
        </div>
      </ForgeCard>

      {/* @ts-ignore */}
      <forge-dialog ref={dialogRef} aria-label={`Driver Profile - ${selectedDriver?.fullName || ''}`}>
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
              <div style={{ borderTop: '1px solid var(--forge-color-border-default)', paddingTop: 'var(--forge-spacing-medium)' }}>
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

              {/* License & Certifications */}
              <div style={{ borderTop: '1px solid var(--forge-color-border-default)', paddingTop: 'var(--forge-spacing-medium)' }}>
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

              {/* Current Assignment */}
              <div style={{ borderTop: '1px solid var(--forge-color-border-default)', paddingTop: 'var(--forge-spacing-medium)' }}>
                <h3 style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-lg)', fontWeight: 'var(--forge-font-weight-medium)', marginBottom: 'var(--forge-spacing-small)' }}>
                  Current Assignment
                </h3>
                <div className="grid grid-cols-2" style={{ gap: 'var(--forge-spacing-medium)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--forge-font-family)', fontSize: 'var(--forge-font-size-sm)', color: 'var(--muted-foreground)' }}>Assigned Vehicle</div>
                    <div className="flex items-center" style={{ gap: 'var(--forge-spacing-xsmall)', fontFamily: 'var(--forge-font-family)' }}>
                      <forge-icon name="directions_bus" style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}></forge-icon>
                      <span>{selectedDriver.assignedVehicle}</span>
                    </div>
                  </div>
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