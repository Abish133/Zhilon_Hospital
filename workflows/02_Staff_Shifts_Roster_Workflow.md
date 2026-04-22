# Staff Shifts & Roster Management - Workflow

## Overview
This workflow describes shift management and employee roster assignment system for hospital staff.

## User Roles
- Admin: Full access (create shifts, assign roster, manage swaps)
- HR Manager: Can view and assign roster
- Employee: Can view own roster, request swaps

## Workflow Steps

### 1. Shift Master Management

```
1. Admin navigates to Shift Management page
   └─> Views list of existing shifts
   
2. Admin creates new shift:
   - Shift Name (e.g., "Morning", "Evening", "Night")
   - Start Time (e.g., 08:00)
   - End Time (e.g., 16:00)
   - System calculates duration automatically
   
3. Admin saves shift
   └─> POST /api/shifts
   └─> Shift created in database
   
4. Admin can edit/delete shifts
   └─> PUT /api/shifts/:id
   └─> DELETE /api/shifts/:id (soft delete)
```

### 2. Roster Assignment (Single)

```
1. Admin navigates to Roster Management page
   └─> Calendar/Grid view showing employees and dates
   
2. Admin selects:
   - Employee
   - Date
   - Shift
   
3. Admin clicks "Assign"
   └─> POST /api/roster
   └─> System validates:
        - Employee exists
        - Shift exists
        - No duplicate assignment for same employee+date
   └─> Creates roster entry
   
4. UI updates:
   └─> Cell in grid shows assigned shift
   └─> Color coding by shift type
```

### 3. Bulk Roster Assignment

```
1. Admin selects multiple employees (checkbox)
2. Admin selects date range (from-to)
3. Admin selects shift
4. Admin clicks "Bulk Assign"
   └─> POST /api/roster/bulk
   └─> System creates multiple roster entries
   └─> Returns success count and any errors
   
5. UI updates:
   └─> All selected cells show assigned shift
```

### 4. Shift Swap Request

```
1. Employee views own roster
   └─> Sees assigned shifts
   
2. Employee clicks "Request Swap" on a shift
   └─> Modal opens
   
3. Employee selects:
   - Date to swap
   - Employee to swap with (dropdown of available employees)
   
4. Employee submits request
   └─> POST /api/roster/swap
   └─> System:
        - Validates both employees have shifts on those dates
        - Creates swap request record
        - Notifies other employee
   
5. Other employee receives notification
   └─> Can approve/reject swap
   
6. If approved:
   └─> System updates both roster entries
   └─> Sets swap_with_employee_id
   └─> Updates status to "Confirmed"
```

### 5. Leave Management

```
1. Admin/Employee marks roster entry as leave
   └─> PUT /api/roster/:id/leave
   
2. System:
   - Updates status to "On Leave"
   - Records leave type (Sick, Casual, Annual, etc.)
   - Optionally finds replacement
   
3. UI shows leave indicator
```

### 6. Monthly Roster Generation

```
1. Admin navigates to Roster Management
2. Admin selects month/year
3. Admin clicks "Generate Roster"
   └─> POST /api/roster/generate
   └─> System:
        - Gets all active employees
        - Gets all active shifts
        - Applies shift rotation pattern (if configured)
        - Creates roster entries for entire month
   
4. Admin reviews and adjusts as needed
```

## Database Schema

### Table: shifts
- shift_id (PK)
- shift_name (VARCHAR)
- start_time (TIME)
- end_time (TIME)
- duration_hours (DECIMAL)
- hospital_id (FK)
- is_active (BOOLEAN)

### Table: employee_roster
- roster_id (PK)
- employee_id (FK → employees)
- shift_id (FK → shifts)
- roster_date (DATE)
- status (ENUM: Scheduled, Confirmed, Swap Requested, On Leave, Cancelled)
- swap_with_employee_id (FK → employees, nullable)
- leave_type (VARCHAR, nullable)
- remarks (TEXT)
- hospital_id (FK)
- created_by (FK → users)

## API Endpoints

### Shifts

**GET /api/shifts**
- Query: hospital_id
- Returns: List of shifts

**POST /api/shifts**
```json
{
  "shift_name": "Morning",
  "start_time": "08:00:00",
  "end_time": "16:00:00",
  "hospital_id": 1
}
```

**PUT /api/shifts/:id**
**DELETE /api/shifts/:id**

### Roster

**GET /api/roster**
- Query: employee_id, start_date, end_date, hospital_id
- Returns: Roster entries

**POST /api/roster**
```json
{
  "employee_id": 5,
  "shift_id": 2,
  "roster_date": "2025-01-20",
  "hospital_id": 1
}
```

**POST /api/roster/bulk**
```json
{
  "employee_ids": [5, 6, 7],
  "shift_id": 2,
  "start_date": "2025-01-20",
  "end_date": "2025-01-25",
  "hospital_id": 1
}
```

**PUT /api/roster/:id**
**DELETE /api/roster/:id**

**POST /api/roster/swap**
```json
{
  "roster_id": 10,
  "swap_with_employee_id": 8,
  "swap_date": "2025-01-22"
}
```

**PUT /api/roster/:id/leave**
```json
{
  "leave_type": "Sick Leave",
  "remarks": "Medical emergency"
}
```

**POST /api/roster/generate**
```json
{
  "month": 1,
  "year": 2025,
  "hospital_id": 1,
  "rotation_pattern": "weekly" // optional
}
```

## UI Components

### Roster Calendar View
- Grid: Employees (rows) × Dates (columns)
- Color coding by shift
- Click cell to assign/modify
- Drag-and-drop support (optional)

### Shift Management Table
- Columns: Name, Start Time, End Time, Duration, Actions
- Actions: Edit, Delete, View Assignments

## Business Rules

1. One employee can have only one shift per day
2. Shift swap requires approval from both employees
3. Leave requests should be submitted in advance
4. Roster generation respects employee preferences (if configured)
5. System prevents double-booking

## Integration Points

- **Attendance System**: Roster data used to validate attendance
- **Payroll System**: Roster data used for shift allowance calculation
- **Notification System**: Sends alerts for roster changes, swap requests

