// Shared data for incidents that have active communications
export const INCIDENTS_WITH_COMMUNICATIONS = [
  'INC-2025-0042',
  'INC-2025-0041',
  'INC-2025-0040',
  'INC-2025-0039',
  'INC-2025-0038',
  'INC-2025-0037',
  'INC-2025-0036',
  'INC-2025-0035',
  'INC-2025-0034',
  'INC-2025-0033',
  'INC-2025-0032',
  'INC-2025-0031',
  'INC-2025-0030',
  'INC-2025-0029',
  'INC-2025-0028',
  'INC-2025-0027',
  'INC-2024-0026',
  'INC-2024-0025',
  'INC-2024-0024',
  'INC-2024-0023',
  'INC-2024-0022',
  'INC-2024-0021',
  'INC-2024-0020',
  'INC-2024-0019',
  'INC-2024-0018',
  'INC-2024-0017',
  // Non-student subjects
  'INC-2025-0066',
  'INC-2025-0067',
  'INC-2025-0070',
];

export function hasActiveCommunication(incidentId: string): boolean {
  return INCIDENTS_WITH_COMMUNICATIONS.includes(incidentId);
}