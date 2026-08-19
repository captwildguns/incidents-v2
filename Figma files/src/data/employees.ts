// Employees who are not drivers.
//
// The Drivers page roster is drivers only, organised around CDL class,
// endorsements, and certification expiry. An Employee incident is often about an
// aide hurt on a wheelchair lift or a mechanic in a yard dispute, and neither had
// a record anywhere in the app, so an Employee incident could only ever name a
// driver. That made the subject half-built.
//
// Deliberately a separate list rather than rows appended to mockDrivers: the
// Drivers page renders driver-specific columns that would be blank for every
// person here. Broadening that page to all employees with a role filter is GH
// #196. When it lands, the page reads drivers and this list together the same way
// the new incident form already does, and this file is where the non-driver
// records already live.
//
// The shape covers what a person needs on an incident, plus jobRole, which is
// what the #196 role filter will key on.

export interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
  // Job title, not an incident role. IncidentRoleType governs who a workflow
  // step is assigned to; this is what the person does day to day.
  jobRole: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  defaultGarage: string;
  hireDate: string;
}

export const mockNonDriverEmployees: Employee[] = [
  {
    id: 'EMP-101',
    fullName: 'Robert Mills',
    employeeId: 'EMP-2017-088',
    jobRole: 'Yard Supervisor',
    phone: '(555) 204-9911',
    email: 'robert.mills@district.edu',
    status: 'Active',
    defaultGarage: 'Central Service Center',
    hireDate: '2017-03-06',
  },
  {
    id: 'EMP-102',
    fullName: 'Denise Okafor',
    employeeId: 'EMP-2020-142',
    jobRole: 'Bus Aide',
    phone: '(555) 311-4028',
    email: 'denise.okafor@district.edu',
    status: 'Active',
    defaultGarage: 'North District Garage',
    hireDate: '2020-08-24',
  },
  {
    id: 'EMP-103',
    fullName: 'Curtis Vance',
    employeeId: 'EMP-2021-067',
    jobRole: 'Bus Aide',
    phone: '(555) 448-7735',
    email: 'curtis.vance@district.edu',
    status: 'Active',
    defaultGarage: 'South District Garage',
    hireDate: '2021-09-13',
  },
  {
    id: 'EMP-104',
    fullName: 'Priya Raman',
    employeeId: 'EMP-2019-215',
    jobRole: 'Mechanic',
    phone: '(555) 662-1180',
    email: 'priya.raman@district.edu',
    status: 'Active',
    defaultGarage: 'Central Service Center',
    hireDate: '2019-05-20',
  },
  {
    id: 'EMP-105',
    fullName: 'Hector Delgado',
    employeeId: 'EMP-2016-031',
    jobRole: 'Mechanic',
    phone: '(555) 779-3364',
    email: 'hector.delgado@district.edu',
    status: 'Active',
    defaultGarage: 'East Service Center',
    hireDate: '2016-07-11',
  },
  {
    id: 'EMP-106',
    fullName: 'Alison Frank',
    employeeId: 'EMP-2022-190',
    jobRole: 'Dispatcher',
    phone: '(555) 890-5521',
    email: 'alison.frank@district.edu',
    status: 'Active',
    defaultGarage: 'Central Service Center',
    hireDate: '2022-01-18',
  },
  {
    id: 'EMP-107',
    fullName: 'Terrance Boyle',
    employeeId: 'EMP-2018-076',
    jobRole: 'Fleet Manager',
    phone: '(555) 127-6643',
    email: 'terrance.boyle@district.edu',
    status: 'Active',
    defaultGarage: 'South District Garage',
    hireDate: '2018-04-02',
  },
  {
    id: 'EMP-108',
    fullName: 'Grace Whitfield',
    employeeId: 'EMP-2023-054',
    jobRole: 'Bus Aide',
    phone: '(555) 356-8802',
    email: 'grace.whitfield@district.edu',
    status: 'Inactive',
    defaultGarage: 'North District Garage',
    hireDate: '2023-08-21',
  },
];
