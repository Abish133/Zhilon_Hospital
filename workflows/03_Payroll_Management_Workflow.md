# Payroll Management - Workflow

## Overview
This workflow describes the complete payroll generation and processing system for hospital employees.

## User Roles
- Admin: Full access (create salary structures, generate payroll)
- HR Manager: Can view and process payroll
- Accountant: Can view payroll and process payments

## Workflow Steps

### 1. Salary Structure Setup

```
1. Admin navigates to Salary Structure page
   └─> Views list of employees with salary structures
   
2. Admin creates/edits salary structure for employee:
   - Basic Salary
   - HRA (House Rent Allowance)
   - Medical Allowance
   - Transport Allowance
   - Other Allowances
   - Provident Fund (PF) Deduction
   - Professional Tax Deduction
   - Income Tax (TDS) Deduction
   - Other Deductions
   
3. System calculates:
   - Gross Salary = Basic + All Allowances
   - Total Deductions = PF + PT + TDS + Others
   - Net Salary = Gross - Deductions
   
4. Admin saves structure
   └─> POST /api/salary-structures
   └─> Structure saved in database
```

### 2. Payroll Generation

```
1. Admin/HR navigates to Payroll Generation page
2. Admin selects:
   - Month
   - Year
   - Department (optional - for filtering)
   
3. Admin clicks "Generate Payroll"
   └─> POST /api/payroll/generate
   
4. System processes:
   For each active employee:
   a. Gets salary structure
   b. Gets attendance records for the month
   c. Calculates:
      - Days worked
      - Days absent
      - Overtime hours (if applicable)
      - Leave deductions
   d. Calculates salary components:
      - Basic (prorated if partial month)
      - Allowances (as per structure)
      - Overtime allowance (if any)
      - Deductions:
        * Leave deductions
        * PF (on basic)
        * PT (as per slab)
        * TDS (as per tax rules)
   e. Creates payroll record with status "Generated"
   
5. System returns:
   - Total employees processed
   - Total payroll amount
   - List of generated payrolls
   
6. UI displays:
   - Table of all generated payrolls
   - Summary statistics
   - Status: Generated, Approved, Paid
```

### 3. Payroll Review & Approval

```
1. Admin reviews generated payroll
   └─> Clicks on employee row
   └─> Views detailed breakdown
   
2. Admin can:
   - Adjust any component (with reason)
   - Approve payroll
   - Reject and regenerate
   
3. Admin approves payroll
   └─> PUT /api/payroll/:id/approve
   └─> Status changes to "Approved"
   └─> Payroll locked (cannot be modified)
```

### 4. Payroll Processing (Payment)

```
1. Accountant views approved payrolls
2. Accountant selects payroll(s) to process
3. Accountant clicks "Process Payment"
   └─> PUT /api/payroll/:id/process
   
4. System:
   - Updates status to "Paid"
   - Records payment date
   - Optionally creates payment entry in accounting
   - Generates payslip
   
5. System sends payslip to employee (email/notification)
```

### 5. Payslip Generation

```
1. Employee/Admin views payslip
   └─> GET /api/payroll/:id/payslip
   
2. System generates PDF with:
   - Employee details
   - Pay period
   - Salary breakdown (Earnings & Deductions)
   - Net salary
   - Bank account details
   - Payment date
   
3. PDF can be downloaded/printed
```

## Database Schema

### Table: salary_structures
- structure_id (PK)
- employee_id (FK → employees, unique)
- basic_salary (DECIMAL)
- hra (DECIMAL)
- medical_allowance (DECIMAL)
- transport_allowance (DECIMAL)
- other_allowances (DECIMAL)
- pf_percentage (DECIMAL)
- pt_amount (DECIMAL)
- tds_percentage (DECIMAL)
- other_deductions (DECIMAL)
- effective_from (DATE)
- effective_to (DATE, nullable)
- hospital_id (FK)
- is_active (BOOLEAN)

### Table: payroll
- payroll_id (PK)
- employee_id (FK → employees)
- month (INTEGER, 1-12)
- year (INTEGER)
- days_worked (INTEGER)
- days_absent (INTEGER)
- overtime_hours (DECIMAL)
- basic_salary (DECIMAL)
- total_allowances (DECIMAL)
- total_deductions (DECIMAL)
- gross_salary (DECIMAL)
- net_salary (DECIMAL)
- status (ENUM: Generated, Approved, Paid, Cancelled)
- payment_date (DATE, nullable)
- payment_mode (VARCHAR, nullable)
- transaction_reference (VARCHAR, nullable)
- remarks (TEXT)
- hospital_id (FK)
- generated_by (FK → users)
- approved_by (FK → users, nullable)
- processed_by (FK → users, nullable)
- createdAt, updatedAt

### Table: payroll_details (Optional - for detailed breakdown)
- detail_id (PK)
- payroll_id (FK → payroll)
- component_type (ENUM: Allowance, Deduction)
- component_name (VARCHAR)
- amount (DECIMAL)
- is_calculated (BOOLEAN) - system calculated or manual

## API Endpoints

### Salary Structures

**GET /api/salary-structures**
- Query: employee_id, hospital_id
- Returns: List of salary structures

**POST /api/salary-structures**
```json
{
  "employee_id": 5,
  "basic_salary": 50000,
  "hra": 10000,
  "medical_allowance": 2000,
  "transport_allowance": 1500,
  "pf_percentage": 12,
  "pt_amount": 200,
  "tds_percentage": 5,
  "effective_from": "2025-01-01",
  "hospital_id": 1
}
```

**PUT /api/salary-structures/:id**
**GET /api/salary-structures/:id**

### Payroll

**GET /api/payroll**
- Query: month, year, employee_id, status, hospital_id
- Returns: List of payroll records

**POST /api/payroll/generate**
```json
{
  "month": 1,
  "year": 2025,
  "department_id": 2, // optional
  "hospital_id": 1
}
```

**GET /api/payroll/:id**
- Returns: Detailed payroll with breakdown

**PUT /api/payroll/:id/approve**
```json
{
  "remarks": "Approved by HR Manager"
}
```

**PUT /api/payroll/:id/process**
```json
{
  "payment_date": "2025-02-01",
  "payment_mode": "Bank Transfer",
  "transaction_reference": "TXN123456"
}
```

**GET /api/payroll/:id/payslip**
- Returns: PDF file

**POST /api/payroll/:id/adjust**
```json
{
  "component": "bonus",
  "amount": 5000,
  "type": "allowance",
  "reason": "Performance bonus"
}
```

## Calculation Logic

### Gross Salary Calculation
```
Gross Salary = Basic + HRA + Medical + Transport + Other Allowances + Overtime
```

### Deductions Calculation
```
PF = (Basic * PF_Percentage) / 100
PT = Fixed amount (as per tax slab)
TDS = ((Gross - PF - PT) * TDS_Percentage) / 100
Total Deductions = PF + PT + TDS + Other Deductions
```

### Net Salary
```
Net Salary = Gross Salary - Total Deductions
```

### Prorated Salary (for partial month)
```
If employee joined mid-month or left mid-month:
Days in month = Total days in month
Days worked = Actual working days
Prorated Basic = (Basic / Days in month) * Days worked
```

### Leave Deductions
```
If employee took unpaid leave:
Leave days = Unpaid leave days
Deduction = (Basic / Days in month) * Leave days
```

## UI Components

### Payroll Generation Page
- Month/Year selector
- Department filter
- "Generate Payroll" button
- Summary cards (Total Amount, Employees, Status)
- Payroll table with filters

### Payroll Detail Modal
- Employee information
- Salary breakdown (Earnings & Deductions)
- Attendance summary
- Adjustment options
- Approve/Reject buttons

### Payslip View
- PDF viewer
- Download button
- Print button

## Integration Points

- **Attendance System**: Fetches attendance data for calculations
- **Roster System**: Fetches shift data for overtime calculation
- **Accounting System**: Creates payment entries
- **Notification System**: Sends payslip to employees

## Business Rules

1. Salary structure must be active and effective for the payroll month
2. Payroll can only be generated for past or current month
3. Once approved, payroll cannot be modified (only cancelled)
4. Payment processing requires approval
5. Payslips are generated only for paid payrolls
6. System maintains audit trail of all changes

