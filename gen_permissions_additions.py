"""Builds the permissions additions workbook: what still has to be added.

Only the additions. Everything already seeded in the permissions PR is correct
and is not repeated here. Same sheet conventions as the June workbook so it
drops straight into the same hand-off.
"""

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

DATED = "2026-09-15"
OUT = f"Incident-Tracker-Permissions-Additions-{DATED}.xlsx"

GROUPS = [
    ("G-001", "Administrator"),
    ("G-002", "Safety Coordinator"),
    ("G-003", "Driver"),
    ("G-004", "Fleet Manager"),
    ("G-005", "School Principal"),
]

# Role order for the grids, matching how the question was asked on the PR.
ASK_ORDER = ["Administrator", "Safety Coordinator", "Fleet Manager", "School Principal", "Driver"]

# label, resource key, parent, then Read per group in G-001..G-005 order.
# These four areas are read only for every group. The records themselves are
# maintained in Student Transportation, so Add, Edit and Delete have nothing to
# act on and are granted to nobody, including Administrator.
NEW_AREAS = [
    ("Students List", "incident-page-students", "incidentmanagement",
     ["R", "R", "", "", "R"]),
    ("Employees List", "incident-page-employees", "incidentmanagement",
     ["R", "R", "", "R", ""]),
    ("Vehicles List", "incident-page-vehicles", "incidentmanagement",
     ["R", "R", "", "R", ""]),
    ("Locations List", "incident-page-locations", "incidentmanagement",
     ["R", "R", "", "R", ""]),
]

RULES = [
    ["#", "Rule", "Applies to", "Behavior"],
    [1, "School based access", "Every incident type",
     "A user sees an incident when they hold Read on its type AND hold school access to a "
     "school that at least one student named on the incident attends. A student named on board "
     "a vehicle, employee or third party incident counts the same as a student named on a "
     "student incident."],
    [2, "A Driver reads their own incidents only", "Every incident type",
     "A Driver's Read returns only incidents the driver is named on, either as the driver on "
     "the incident or as a party on it. It never returns another driver's incidents. This "
     "filter is applied after the type grant, the same way school based access is."],
    [3, "The four list areas are read only", "The four areas on the New Areas sheet",
     "No group holds Add, Edit or Delete on any of the four, including Administrator. The "
     "records are maintained in Student Transportation and Incidents only reads them."],
]

READ_ME = [
    f"Incident Tracker Permissions - Additions ({DATED})",
    "",
    "What this is: the permission work still to be added, and nothing else.",
    "",
    "Everything seeded in the permissions PR today is correct and stays as it is. It is not",
    "repeated in this workbook. These are the additions on top of it.",
    "",
    "This workbook answers the second question asked on the permissions PR: a student incident",
    "and the student list are two different things, and only the first one has a permission",
    "area today. The four areas on the New Areas sheet are the second thing.",
    "",
    "Sheets:",
    "  • New Areas - the four areas to add, with their keys and their grants.",
    "  • Resource Visibility - the same four as a role grid, in the layout the question used.",
    "  • Access Rules - three rules that no grant can express, to be built as filters.",
    "  • Permissions (for SQL) - normalized one row per group x area x flags (1/0) for inserts.",
    "",
    "Legend: R = Read. Add, Edit and Delete are granted to nobody on these four areas.",
    "",
    "THE FOUR NEW AREAS",
    "",
    "Students List, Employees List, Vehicles List and Locations List. They gate the four pages",
    "in Incidents that list Student Transportation records, and they carry Read only.",
    "",
    "They sit under the incidentmanagement parent, alongside Incident List rather than under",
    "it, because they are pages of their own and not a kind of incident.",
    "",
    "Their keys are incident-page-students, incident-page-employees, incident-page-vehicles",
    "and incident-page-locations. The four keys that read incident-students, incident-employees,",
    "incident-vehicles and incident-locations are already taken and mean the incident TYPE, so",
    "the new areas carry page in the key to keep the two apart. The labels do the same job on",
    "screen: the types read Student, Employee, Vehicle and Location, and these read Students",
    "List, Employees List, Vehicles List and Locations List.",
    "",
    "WHO READS WHAT, AND WHY",
    "",
    "  • Administrator and Safety Coordinator read all four. Both work incidents of every type.",
    "  • Fleet Manager reads Employees, Vehicles and Locations. A fleet manager needs the bus,",
    "    the garage and the staff based there, and has no reason to hold the student roster.",
    "  • School Principal reads Students only, and school based access still limits that to",
    "    their own schools.",
    "  • Driver reads none of the four. Read on the student list would hand a driver the whole",
    "    district roster, which is the opposite of the driver holding only their own incidents.",
    "",
    "THE THREE ACCESS RULES",
    "",
    "The Access Rules sheet carries three requirements that a CRUD flag cannot express. Two of",
    "them are filters that run after the grant: school based access, and a Driver seeing only",
    "the incidents they are named on. The third states that the four new areas are read only.",
    "",
    "SETTLED AND DELIBERATELY NOT HERE",
    "",
    "  • Approvals is not an area. Approving is completing a workflow step you are assigned, so",
    "    the Incident Workflows grant plus the step assignment decides it.",
    "  • Notifications is not an area. What a workflow sends is configured in Incident Admin,",
    "    and who receives it follows the step assignment.",
    "  • There is no Third Party list area. Student Transportation holds no third party record",
    "    to list, so the Third Party incident type is the only third party area.",
]

HEADER_FILL = PatternFill("solid", fgColor="4A6FA5")
HEADER_FONT = Font(bold=True, color="FFFFFF", name="Calibri")
BOLD = Font(bold=True, name="Calibri")
THIN = Side(style="thin", color="D0D7E2")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
CENTER = Alignment(horizontal="center", vertical="center")
TOPWRAP = Alignment(wrap_text=True, vertical="top")


def head(ws, ncols, height=30):
    for c in range(1, ncols + 1):
        cell = ws.cell(row=1, column=c)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.border = BOX
        cell.alignment = Alignment(vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = height


def widths(ws, pairs):
    for col, w in pairs:
        ws.column_dimensions[col].width = w


def box_row(ws, ncols, center_from=None):
    for c in range(1, ncols + 1):
        ws.cell(row=ws.max_row, column=c).border = BOX
        if center_from and c >= center_from:
            ws.cell(row=ws.max_row, column=c).alignment = CENTER


wb = Workbook()

# 1. Read Me
ws = wb.active
ws.title = "Read Me"
for i, line in enumerate(READ_ME, start=1):
    ws.cell(row=i, column=1, value=line)
    if line and line == line.upper() and any(ch.isalpha() for ch in line):
        ws.cell(row=i, column=1).font = BOLD
ws.cell(row=1, column=1).font = Font(bold=True, size=14, name="Calibri")
widths(ws, [("A", 100)])

# 2. New Areas
ws = wb.create_sheet("New Areas")
ws.append(["Permission Area", "Resource Key", "Parent", "Read", "Add", "Edit", "Delete",
           "Groups with Read"])
head(ws, 8)
for label, key, parent, rights in NEW_AREAS:
    holders = [name for (gid, name), r in zip(GROUPS, rights) if "R" in r]
    ws.append([label, key, parent, "Yes", "No", "No", "No", ", ".join(holders)])
    box_row(ws, 8, center_from=4)
    ws.cell(row=ws.max_row, column=8).alignment = TOPWRAP
widths(ws, [("A", 20), ("B", 28), ("C", 22), ("D", 8), ("E", 8), ("F", 8), ("G", 9), ("H", 52)])
ws.freeze_panes = "A2"

# 3. Resource Visibility
ws = wb.create_sheet("Resource Visibility")
ws.append(["Role"] + [f"{label} (read)" for label, _k, _p, _r in NEW_AREAS])
head(ws, 5)
for role in ASK_ORDER:
    gi = [n for _i, n in GROUPS].index(role)
    ws.append([role] + ["X" if "R" in rights[gi] else "" for _l, _k, _p, rights in NEW_AREAS])
    box_row(ws, 5, center_from=2)
    ws.cell(row=ws.max_row, column=1).font = BOLD
widths(ws, [("A", 22), ("B", 20), ("C", 20), ("D", 20), ("E", 20)])
ws.freeze_panes = "A2"

# 4. Access Rules
ws = wb.create_sheet("Access Rules")
for row in RULES:
    ws.append(row)
head(ws, 4)
widths(ws, [("A", 6), ("B", 38), ("C", 24), ("D", 88)])
for r in range(2, ws.max_row + 1):
    for c in range(1, 5):
        ws.cell(row=r, column=c).border = BOX
        ws.cell(row=r, column=c).alignment = TOPWRAP
    ws.row_dimensions[r].height = 62

# 5. Permissions (for SQL)
ws = wb.create_sheet("Permissions (for SQL)")
ws.append(["group_id", "group_name", "module", "permission_area", "area_key", "parent_key",
           "can_read", "can_add", "can_edit", "can_delete"])
head(ws, 10)
for gi, (gid, gname) in enumerate(GROUPS):
    for label, key, parent, rights in NEW_AREAS:
        ws.append([gid, gname, "Incident Tracker / General", label, key, parent,
                   1 if "R" in rights[gi] else 0, 0, 0, 0])
        box_row(ws, 10, center_from=7)
widths(ws, [("A", 10), ("B", 20), ("C", 26), ("D", 20), ("E", 28), ("F", 22),
            ("G", 11), ("H", 10), ("I", 10), ("J", 12)])
ws.freeze_panes = "A2"

wb.save(OUT)
print("wrote", OUT)
print(f"new areas {len(NEW_AREAS)}, groups {len(GROUPS)}, "
      f"sql rows {len(NEW_AREAS) * len(GROUPS)}, rules {len(RULES) - 1}")
