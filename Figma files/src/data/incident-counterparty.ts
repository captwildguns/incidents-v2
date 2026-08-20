import { mockLocations } from './locations';
import { allEmployees } from './employees';

// Who the coordinator is talking to about an incident.
//
// A thread is always the coordinator plus one counterpart, and which counterpart
// depends on what the incident is about: a burst pipe is a conversation with the
// location manager, not with a driver who was never there.
//
// Lives in data rather than on the Communications page because the global search
// renders the same pairing in its results, and it was hardcoded to inc.driver
// there, which printed "undefined (Employee)" on any incident without a driver.
//
// Imports only other data modules, so it carries no page import cycle.
export function counterpartyFor(inc: any): { name: string; role: string } {
  const subject = inc?.subject ?? 'student';

  if (subject === 'location') {
    const loc = mockLocations.find(l => l.name === inc?.assetRef);
    if (loc && loc.manager !== 'Unassigned') {
      return { name: loc.manager, role: 'Location manager' };
    }
  }

  if (subject === 'vehicle') {
    const fleet = allEmployees.find(e => e.jobRole === 'Fleet Manager' && e.status === 'Active');
    if (fleet) return { name: fleet.fullName, role: 'Fleet manager' };
  }

  if (subject === 'employee') {
    // The employee the incident is about, not whoever reported it.
    const party = (inc?.involvedParties ?? []).find((p: any) => p?.partyType === 'employee');
    if (party?.name) return { name: party.name, role: 'Employee' };
  }

  // Student and third party incidents happen on a run, so the driver is the
  // person the coordinator needs.
  if (typeof inc?.driver === 'string' && inc.driver && inc.driver !== 'N/A') {
    return { name: inc.driver, role: 'Driver' };
  }

  return { name: inc?.assignedTo ?? 'Unassigned', role: 'Assignee' };
}
