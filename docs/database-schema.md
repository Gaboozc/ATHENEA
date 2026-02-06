# WireScope Database Schema

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Users      │    │    Projects     │    │   FloorPlans    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ email           │    │ name            │    │ project_id (FK) │
│ password_hash   │    │ description     │    │ file_url        │
│ role            │    │ client_id (FK)  │    │ version         │
│ first_name      │    │ pm_id (FK)      │    │ labels (JSON)   │
│ last_name       │    │ budget_hours    │    │ mod_docs (JSON) │
│ phone           │    │ status          │    │ created_at      │
│ skills (JSON)   │    │ start_date      │    │ updated_at      │
│ is_active       │    │ end_date        │    └─────────────────┘
│ created_at      │    │ created_at      │           │
│ updated_at      │    │ updated_at      │           │
└─────────────────┘    └─────────────────┘           │
         │                       │                   │
         └───────────────────────┼───────────────────┘
                                │
    ┌─────────────────┐         │         ┌─────────────────┐
    │     Points      │         │         │    Hardware     │
    ├─────────────────┤         │         ├─────────────────┤
    │ id (PK)         │         │         │ id (PK)         │
    │ project_id (FK) │─────────┼─────────│ project_id (FK) │
    │ floor_plan_id   │         │         │ point_id (FK)   │
    │ label           │         │         │ type            │
    │ status          │         │         │ brand           │
    │ location (JSON) │         │         │ model           │
    │ technician_id   │         │         │ serial_number   │
    │ lead_tech_id    │         │         │ mac_address     │
    │ certification   │         │         │ installation_dt │
    │ photos (JSON)   │         │         │ warranty_exp    │
    │ notes           │         │         │ status          │
    │ created_at      │         │         │ created_at      │
    │ updated_at      │         │         │ updated_at      │
    └─────────────────┘         │         └─────────────────┘
                                │
    ┌─────────────────┐         │         ┌─────────────────┐
    │    CommRooms    │         │         │    Materials    │
    ├─────────────────┤         │         ├─────────────────┤
    │ id (PK)         │         │         │ id (PK)         │
    │ project_id (FK) │─────────┼─────────│ project_id (FK) │
    │ name            │         │         │ name            │
    │ status          │         │         │ type            │
    │ checklist(JSON) │         │         │ unit_cost       │
    │ photos (JSON)   │         │         │ supplier        │
    │ supervisor_id   │         │         │ stock_quantity  │
    │ approved_at     │         │         │ min_stock_level │
    │ created_at      │         │         │ created_at      │
    │ updated_at      │         │         │ updated_at      │
    └─────────────────┘         │         └─────────────────┘
                                │
                ┌─────────────────┐
                │ MaterialUsage   │
                ├─────────────────┤
                │ id (PK)         │
                │ material_id(FK) │
                │ project_id (FK) │
                │ point_id (FK)   │
                │ technician_id   │
                │ quantity_used   │
                │ usage_date      │
                │ notes           │
                │ created_at      │
                └─────────────────┘
```

## Table Definitions

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- For local auth fallback
    auth0_sub VARCHAR(255) UNIQUE, -- Auth0 subject ID
    role VARCHAR(50) NOT NULL CHECK (role IN ('project_manager', 'supervisor', 'lead_technician', 'technician')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    skills JSONB DEFAULT '[]', -- Array of skills/specialties
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_auth0_sub ON users(auth0_sub);
```

### Clients Table
```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    billing_address TEXT,
    tax_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Projects Table
```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    project_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    budget_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planning' 
        CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_date DATE,
    estimated_end_date DATE,
    actual_end_date DATE,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    project_code VARCHAR(50) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_pm ON projects(project_manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_code ON projects(project_code);
```

### Project Team Table (Many-to-Many relationship)
```sql
CREATE TABLE project_team (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_in_project VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMP,
    UNIQUE(project_id, user_id)
);
```

### Floor Plans Table
```sql
CREATE TABLE floor_plans (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    version INTEGER DEFAULT 1,
    labels JSONB DEFAULT '[]', -- Array of label objects with positions
    mod_docs JSONB DEFAULT '{}', -- Modification documents metadata
    is_current BOOLEAN DEFAULT TRUE,
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_floor_plans_project ON floor_plans(project_id);
CREATE INDEX idx_floor_plans_current ON floor_plans(is_current);
```

### Points Table
```sql
CREATE TABLE points (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    floor_plan_id INTEGER REFERENCES floor_plans(id) ON DELETE SET NULL,
    label VARCHAR(100) NOT NULL,
    point_type VARCHAR(50) DEFAULT 'data_point' 
        CHECK (point_type IN ('data_point', 'voice_point', 'fiber_point', 'coax_point', 'access_point')),
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'pull', 'terminated', 'certified', 'problems', 'material_pending')),
    location JSONB, -- {x: number, y: number, floor: string}
    room VARCHAR(100),
    technician_id INTEGER REFERENCES users(id),
    lead_technician_id INTEGER REFERENCES users(id),
    supervisor_id INTEGER REFERENCES users(id),
    
    -- Certification data
    certified_at TIMESTAMP,
    certified_by INTEGER REFERENCES users(id),
    certification_result VARCHAR(50),
    certification_notes TEXT,
    certification_photos JSONB DEFAULT '[]', -- Array of photo URLs
    
    -- Problem tracking
    problem_reported_at TIMESTAMP,
    problem_description TEXT,
    problem_photos JSONB DEFAULT '[]',
    problem_resolved_at TIMESTAMP,
    
    -- General
    notes TEXT,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_points_project ON points(project_id);
CREATE INDEX idx_points_status ON points(status);
CREATE INDEX idx_points_technician ON points(technician_id);
CREATE INDEX idx_points_label ON points(label);
CREATE INDEX idx_points_floor_plan ON points(floor_plan_id);
```

### Hardware Table
```sql
CREATE TABLE hardware (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    point_id INTEGER REFERENCES points(id) ON DELETE SET NULL,
    hardware_type VARCHAR(50) NOT NULL 
        CHECK (hardware_type IN ('access_point', 'switch', 'router', 'firewall', 'patch_panel', 'cable', 'connector')),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    mac_address VARCHAR(17), -- Format: XX:XX:XX:XX:XX:XX
    ip_address INET,
    installation_date DATE,
    warranty_expiration DATE,
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    status VARCHAR(50) DEFAULT 'in_stock' 
        CHECK (status IN ('in_stock', 'installed', 'configured', 'retired', 'faulty')),
    location_description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_hardware_project ON hardware(project_id);
CREATE INDEX idx_hardware_type ON hardware(hardware_type);
CREATE INDEX idx_hardware_serial ON hardware(serial_number);
CREATE INDEX idx_hardware_warranty ON hardware(warranty_expiration);
```

### Materials Table
```sql
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    material_type VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- feet, meters, pieces, boxes, etc.
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    supplier_part_number VARCHAR(100),
    stock_quantity DECIMAL(10,2) DEFAULT 0,
    reserved_quantity DECIMAL(10,2) DEFAULT 0,
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    max_stock_level DECIMAL(10,2),
    storage_location VARCHAR(100),
    description TEXT,
    specifications JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_materials_project ON materials(project_id);
CREATE INDEX idx_materials_type ON materials(material_type);
CREATE INDEX idx_materials_stock ON materials(stock_quantity);
```

### Material Usage Table
```sql
CREATE TABLE material_usage (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    point_id INTEGER REFERENCES points(id) ON DELETE SET NULL,
    technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    usage_date DATE NOT NULL,
    usage_type VARCHAR(50) DEFAULT 'installation' 
        CHECK (usage_type IN ('installation', 'repair', 'replacement', 'waste')),
    notes TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_material_usage_material ON material_usage(material_id);
CREATE INDEX idx_material_usage_project ON material_usage(project_id);
CREATE INDEX idx_material_usage_technician ON material_usage(technician_id);
CREATE INDEX idx_material_usage_date ON material_usage(usage_date);
```

### Comm Rooms Table
```sql
CREATE TABLE comm_rooms (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    room_type VARCHAR(50) DEFAULT 'comm_room' 
        CHECK (room_type IN ('comm_room', 'server_room', 'equipment_closet', 'mdf', 'idf')),
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected')),
    location VARCHAR(255),
    floor VARCHAR(50),
    
    -- Quality checklist
    checklist JSONB DEFAULT '{}', -- JSON object with checklist items and completion status
    
    -- Photos
    before_photos JSONB DEFAULT '[]', -- Array of photo URLs
    during_photos JSONB DEFAULT '[]',
    after_photos JSONB DEFAULT '[]',
    
    -- Team assignments
    assigned_technician_id INTEGER REFERENCES users(id),
    supervisor_id INTEGER REFERENCES users(id),
    
    -- Approval workflow
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_comm_rooms_project ON comm_rooms(project_id);
CREATE INDEX idx_comm_rooms_status ON comm_rooms(status);
CREATE INDEX idx_comm_rooms_technician ON comm_rooms(assigned_technician_id);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL 
        CHECK (notification_type IN ('project_update', 'approval_request', 'material_shortage', 'deadline_alert', 'system_message')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50), -- project, point, comm_room, etc.
    related_entity_id INTEGER,
    priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
```

### Approvals Table
```sql
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    approval_type VARCHAR(50) NOT NULL 
        CHECK (approval_type IN ('material_request', 'comm_room', 'point_certification', 'project_milestone')),
    entity_type VARCHAR(50) NOT NULL, -- What needs approval
    entity_id INTEGER NOT NULL, -- ID of the entity
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    request_message TEXT,
    approval_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_approvals_project ON approvals(project_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);
CREATE INDEX idx_approvals_requester ON approvals(requested_by);
```

### Reports Table
```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL 
        CHECK (report_type IN ('daily', 'weekly', 'monthly', 'project_summary', 'material_usage', 'custom')),
    report_name VARCHAR(255) NOT NULL,
    report_data JSONB NOT NULL, -- Complete report data
    file_url TEXT, -- PDF/Excel export URL
    date_range_start DATE,
    date_range_end DATE,
    parameters JSONB DEFAULT '{}', -- Report generation parameters
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_automated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reports_project ON reports(project_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_date ON reports(generated_at);
```

### Audit Log Table
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
```

## Views and Functions

### Project Progress View
```sql
CREATE VIEW project_progress AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.budget_hours,
    p.actual_hours,
    COUNT(pt.id) as total_points,
    COUNT(CASE WHEN pt.status = 'certified' THEN 1 END) as certified_points,
    ROUND(
        (COUNT(CASE WHEN pt.status = 'certified' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(pt.id), 0) * 100), 2
    ) as completion_percentage
FROM projects p
LEFT JOIN points pt ON p.id = pt.project_id
GROUP BY p.id, p.name, p.status, p.budget_hours, p.actual_hours;
```

### Material Stock Alerts View
```sql
CREATE VIEW material_stock_alerts AS
SELECT 
    m.*,
    (m.stock_quantity - m.reserved_quantity) as available_quantity,
    CASE 
        WHEN (m.stock_quantity - m.reserved_quantity) <= 0 THEN 'out_of_stock'
        WHEN (m.stock_quantity - m.reserved_quantity) <= m.min_stock_level THEN 'low_stock'
        ELSE 'adequate'
    END as stock_status
FROM materials m
WHERE m.is_active = TRUE;
```

### Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (repeat for other tables)
```

## Data Integrity and Constraints

### Business Rules
1. **Point Status Workflow**: Points must follow the defined status progression
2. **Role Hierarchy**: Users can only approve items within their authority level
3. **Material Tracking**: Material usage must not exceed available stock
4. **Project Dates**: Start date cannot be after end date
5. **Certification Requirements**: Points must be terminated before certification

### Constraints Examples
```sql
-- Ensure project dates are logical
ALTER TABLE projects ADD CONSTRAINT check_project_dates 
    CHECK (start_date IS NULL OR estimated_end_date IS NULL OR start_date <= estimated_end_date);

-- Ensure material usage is positive
ALTER TABLE material_usage ADD CONSTRAINT check_positive_quantity 
    CHECK (quantity_used > 0);

-- Ensure completion percentage is valid
ALTER TABLE projects ADD CONSTRAINT check_completion_percentage 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100);
```

This database schema provides a robust foundation for the WireScope application, supporting all the required functionality while maintaining data integrity and performance.