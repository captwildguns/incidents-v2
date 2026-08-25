// The organization hierarchy the MDM selector shows.
//
// Student Transportation loads this from api/Org/GetOrg?orgName=Global and marks
// each node against the user's claims. The shape here matches what that returns
// after tyler.tms.org.processHierarchyWithData runs: a tree, each node knowing
// whether the signed-in user may select it and whether it is currently checked.
//
// Names are invented. Nothing here comes from a real district.

export interface OrgNode {
  orgKey: string;
  text: string;
  // False when the org sits outside the user's claims. Rendered disabled rather
  // than hidden, which is what ST does, so the hierarchy stays readable.
  available: boolean;
  checked: boolean;
  children?: OrgNode[];
}

// The site level switch. Student Transportation calls IsMultiDistrictSite().
// With this false the selector is not rendered at all and no org filter applies
// anywhere, which is the single-district behavior.
export const IS_MULTI_DISTRICT_SITE = true;

export const ORG_TREE: OrgNode[] = [
  {
    orgKey: 'GLOBAL',
    text: 'Global',
    available: false,
    checked: false,
    children: [
      {
        orgKey: 'RVC',
        text: 'River Valley Consortium',
        available: true,
        checked: true,
        children: [
          { orgKey: 'RVC-NOR', text: 'Northgate Schools', available: true, checked: true },
          { orgKey: 'RVC-STA', text: 'Stanford Heights Schools', available: true, checked: true },
          { orgKey: 'RVC-WES', text: 'Westbrook Schools', available: true, checked: false },
        ],
      },
      {
        orgKey: 'LKC',
        text: 'Lakeshore County Schools',
        available: true,
        checked: false,
        children: [
          { orgKey: 'LKC-CEN', text: 'Central District', available: true, checked: false },
          { orgKey: 'LKC-HAR', text: 'Harborview District', available: true, checked: false },
        ],
      },
      {
        orgKey: 'PLN',
        text: 'Plainfield Regional',
        available: false,
        checked: false,
        children: [
          { orgKey: 'PLN-EAS', text: 'East Plainfield', available: false, checked: false },
        ],
      },
    ],
  },
];

export function countChecked(nodes: OrgNode[]): number {
  return nodes.reduce(
    (n, node) => n + (node.checked && node.orgKey !== 'GLOBAL' ? 1 : 0) + countChecked(node.children ?? []),
    0,
  );
}

export function checkedLeafNames(nodes: OrgNode[]): string[] {
  const out: string[] = [];
  const walk = (list: OrgNode[]) => {
    list.forEach(n => {
      if (!n.children?.length && n.checked) out.push(n.text);
      walk(n.children ?? []);
    });
  };
  walk(nodes);
  return out;
}
