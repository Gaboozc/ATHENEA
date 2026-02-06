# WireScope API Documentation

## API Overview

The WireScope API follows REST principles with JWT-based authentication and role-based access control. All endpoints return JSON responses and use standard HTTP status codes.

**Base URL**: `https://api.wirescope.com/v1`

## Authentication

### JWT Token Structure
```json
{
  "sub": "auth0|user_id",
  "email": "user@example.com",
  "role": "project_manager",
  "permissions": ["projects:read", "projects:write", "users:manage"],
  "exp": 1640995200,
  "iat": 1640908800
}
```

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## API Endpoints

### 1. Authentication & User Management

#### POST /auth/login
```json
{
  "method": "POST",
  "endpoint": "/auth/login",
  "description": "Authenticate user with Auth0",
  "request": {
    "email": "user@example.com",
    "password": "secure_password"
  },
  "response": {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "project_manager",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

#### GET /auth/profile
```json
{
  "method": "GET",
  "endpoint": "/auth/profile",
  "description": "Get current user profile",
  "headers": {
    "Authorization": "Bearer <token>"
  },
  "response": {
    "id": 1,
    "email": "user@example.com",
    "role": "project_manager",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1-555-0123",
    "skills": ["fiber_optics", "networking"],
    "last_login_at": "2025-10-17T10:30:00Z"
  }
}
```

#### PUT /auth/profile
```json
{
  "method": "PUT",
  "endpoint": "/auth/profile",
  "description": "Update user profile",
  "request": {
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1-555-0123",
    "skills": ["fiber_optics", "networking", "wireless"]
  },
  "response": {
    "success": true,
    "message": "Profile updated successfully"
  }
}
```

### 2. User Management (Admin Only)

#### GET /users
```json
{
  "method": "GET",
  "endpoint": "/users",
  "description": "List all users with pagination",
  "query_params": {
    "page": 1,
    "limit": 20,
    "role": "technician",
    "search": "john"
  },
  "response": {
    "users": [
      {
        "id": 1,
        "email": "user@example.com",
        "role": "technician",
        "first_name": "John",
        "last_name": "Doe",
        "is_active": true,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### POST /users
```json
{
  "method": "POST",
  "endpoint": "/users",
  "description": "Create new user",
  "request": {
    "email": "newuser@example.com",
    "role": "technician",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+1-555-0124",
    "skills": ["cable_installation"]
  },
  "response": {
    "success": true,
    "user_id": 2,
    "message": "User created successfully"
  }
}
```

### 3. Project Management

#### GET /projects
```json
{
  "method": "GET",
  "endpoint": "/projects",
  "description": "List projects with filtering and pagination",
  "query_params": {
    "page": 1,
    "limit": 10,
    "status": "active",
    "client_id": 5,
    "pm_id": 1
  },
  "response": {
    "projects": [
      {
        "id": 1,
        "name": "Office Building Network Installation",
        "client": {
          "id": 5,
          "company_name": "Tech Corp Inc."
        },
        "project_manager": {
          "id": 1,
          "name": "John Manager"
        },
        "status": "active",
        "budget_hours": 480.00,
        "actual_hours": 156.50,
        "completion_percentage": 32.60,
        "start_date": "2025-10-01",
        "estimated_end_date": "2025-12-15",
        "created_at": "2025-09-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### POST /projects
```json
{
  "method": "POST",
  "endpoint": "/projects",
  "description": "Create new project",
  "request": {
    "name": "New Office Network",
    "description": "Complete network infrastructure for 5-floor building",
    "client_id": 5,
    "project_manager_id": 1,
    "budget_hours": 600.00,
    "start_date": "2025-11-01",
    "estimated_end_date": "2026-01-31",
    "priority": "high"
  },
  "response": {
    "success": true,
    "project_id": 2,
    "project_code": "PRJ-2025-002",
    "message": "Project created successfully"
  }
}
```

#### GET /projects/:id
```json
{
  "method": "GET",
  "endpoint": "/projects/1",
  "description": "Get detailed project information",
  "response": {
    "id": 1,
    "name": "Office Building Network Installation",
    "description": "Complete structured cabling for 10-floor office building",
    "client": {
      "id": 5,
      "company_name": "Tech Corp Inc.",
      "contact_name": "Alice Johnson"
    },
    "project_manager": {
      "id": 1,
      "name": "John Manager",
      "email": "john.manager@example.com"
    },
    "team": [
      {
        "id": 3,
        "name": "Bob Supervisor",
        "role": "supervisor"
      },
      {
        "id": 4,
        "name": "Carol Tech",
        "role": "lead_technician"
      }
    ],
    "status": "active",
    "budget_hours": 480.00,
    "actual_hours": 156.50,
    "completion_percentage": 32.60,
    "statistics": {
      "total_points": 450,
      "completed_points": 147,
      "pending_points": 203,
      "problem_points": 5
    },
    "start_date": "2025-10-01",
    "estimated_end_date": "2025-12-15"
  }
}
```

### 4. Floor Plans Management

#### GET /projects/:id/floor-plans
```json
{
  "method": "GET",
  "endpoint": "/projects/1/floor-plans",
  "description": "Get all floor plans for a project",
  "response": {
    "floor_plans": [
      {
        "id": 1,
        "project_id": 1,
        "file_name": "floor-1-plan.pdf",
        "file_url": "https://s3.amazonaws.com/wirescope/floor-plans/floor-1-plan.pdf",
        "version": 2,
        "is_current": true,
        "labels": [
          {
            "id": "label-1",
            "text": "DP-101",
            "x": 150,
            "y": 200,
            "point_id": 1
          }
        ],
        "uploaded_by": {
          "id": 1,
          "name": "John Manager"
        },
        "created_at": "2025-10-01T09:00:00Z"
      }
    ]
  }
}
```

#### POST /projects/:id/floor-plans
```json
{
  "method": "POST",
  "endpoint": "/projects/1/floor-plans",
  "description": "Upload new floor plan",
  "request": "multipart/form-data",
  "form_data": {
    "file": "<PDF file>",
    "version": 1,
    "description": "Ground floor layout"
  },
  "response": {
    "success": true,
    "floor_plan_id": 1,
    "file_url": "https://s3.amazonaws.com/wirescope/floor-plans/floor-1-plan.pdf",
    "message": "Floor plan uploaded successfully"
  }
}
```

#### PUT /projects/:projectId/floor-plans/:id/labels
```json
{
  "method": "PUT",
  "endpoint": "/projects/1/floor-plans/1/labels",
  "description": "Update floor plan labels",
  "request": {
    "labels": [
      {
        "id": "label-1",
        "text": "DP-101",
        "x": 150,
        "y": 200,
        "point_id": 1
      },
      {
        "id": "label-2",
        "text": "DP-102",
        "x": 300,
        "y": 200,
        "point_id": 2
      }
    ]
  },
  "response": {
    "success": true,
    "message": "Labels updated successfully"
  }
}
```

### 5. Points Management

#### GET /projects/:id/points
```json
{
  "method": "GET",
  "endpoint": "/projects/1/points",
  "description": "Get all points for a project",
  "query_params": {
    "status": "in_progress",
    "technician_id": 4,
    "floor_plan_id": 1,
    "page": 1,
    "limit": 50
  },
  "response": {
    "points": [
      {
        "id": 1,
        "label": "DP-101",
        "point_type": "data_point",
        "status": "in_progress",
        "location": {
          "x": 150,
          "y": 200,
          "floor": "Ground Floor",
          "room": "Conference Room A"
        },
        "technician": {
          "id": 4,
          "name": "Dave Technician"
        },
        "lead_technician": {
          "id": 3,
          "name": "Carol Lead"
        },
        "priority": 5,
        "estimated_hours": 2.5,
        "actual_hours": 1.2,
        "notes": "Cable run completed, termination pending",
        "created_at": "2025-10-01T10:00:00Z",
        "updated_at": "2025-10-15T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 450,
      "pages": 9
    }
  }
}
```

#### PUT /projects/:projectId/points/:id/status
```json
{
  "method": "PUT",
  "endpoint": "/projects/1/points/1/status",
  "description": "Update point status",
  "request": {
    "status": "terminated",
    "notes": "Cable terminated and tested successfully",
    "actual_hours": 2.0
  },
  "response": {
    "success": true,
    "message": "Point status updated successfully",
    "point": {
      "id": 1,
      "status": "terminated",
      "updated_at": "2025-10-17T15:45:00Z"
    }
  }
}
```

#### POST /projects/:projectId/points/:id/certify
```json
{
  "method": "POST",
  "endpoint": "/projects/1/points/1/certify",
  "description": "Certify a point",
  "request": {
    "result": "pass",
    "notes": "All tests passed within specifications",
    "photos": [
      "https://s3.amazonaws.com/wirescope/photos/cert-1-photo1.jpg"
    ],
    "test_results": {
      "continuity": "pass",
      "wiremap": "pass",
      "length": "45.2m",
      "insertion_loss": "2.1dB"
    }
  },
  "response": {
    "success": true,
    "message": "Point certified successfully",
    "certification_id": "CERT-2025-001-001"
  }
}
```

### 6. Materials Management

#### GET /materials
```json
{
  "method": "GET",
  "endpoint": "/materials",
  "description": "Get materials inventory",
  "query_params": {
    "project_id": 1,
    "material_type": "cable",
    "low_stock": true
  },
  "response": {
    "materials": [
      {
        "id": 1,
        "name": "Cat6 UTP Cable",
        "material_type": "cable",
        "unit": "feet",
        "unit_cost": 0.45,
        "stock_quantity": 2500.0,
        "reserved_quantity": 500.0,
        "available_quantity": 2000.0,
        "min_stock_level": 1000.0,
        "stock_status": "adequate",
        "supplier": "Cable Corp",
        "storage_location": "Warehouse A-1"
      }
    ]
  }
}
```

#### POST /materials/usage
```json
{
  "method": "POST",
  "endpoint": "/materials/usage",
  "description": "Record material usage",
  "request": {
    "material_id": 1,
    "project_id": 1,
    "point_id": 5,
    "quantity_used": 85.5,
    "usage_type": "installation",
    "notes": "Cable run from comm room to DP-105"
  },
  "response": {
    "success": true,
    "usage_id": 123,
    "remaining_stock": 1914.5,
    "message": "Material usage recorded successfully"
  }
}
```

### 7. Comm Rooms Management

#### GET /projects/:id/comm-rooms
```json
{
  "method": "GET",
  "endpoint": "/projects/1/comm-rooms",
  "description": "Get comm rooms for a project",
  "response": {
    "comm_rooms": [
      {
        "id": 1,
        "name": "Main Distribution Frame",
        "room_type": "mdf",
        "status": "in_progress",
        "location": "Basement Level B1",
        "assigned_technician": {
          "id": 4,
          "name": "Dave Technician"
        },
        "supervisor": {
          "id": 3,
          "name": "Bob Supervisor"
        },
        "checklist": {
          "patch_panels_installed": true,
          "cable_management": false,
          "grounding_verified": false,
          "labeling_complete": false,
          "documentation_updated": false
        },
        "completion_percentage": 20,
        "started_at": "2025-10-15T08:00:00Z"
      }
    ]
  }
}
```

#### PUT /projects/:projectId/comm-rooms/:id/checklist
```json
{
  "method": "PUT",
  "endpoint": "/projects/1/comm-rooms/1/checklist",
  "description": "Update comm room checklist",
  "request": {
    "checklist": {
      "patch_panels_installed": true,
      "cable_management": true,
      "grounding_verified": true,
      "labeling_complete": false,
      "documentation_updated": false
    },
    "notes": "Cable management completed, labeling in progress"
  },
  "response": {
    "success": true,
    "completion_percentage": 60,
    "message": "Checklist updated successfully"
  }
}
```

### 8. Hardware Management

#### GET /projects/:id/hardware
```json
{
  "method": "GET",
  "endpoint": "/projects/1/hardware",
  "description": "Get hardware inventory for project",
  "query_params": {
    "hardware_type": "access_point",
    "status": "installed"
  },
  "response": {
    "hardware": [
      {
        "id": 1,
        "hardware_type": "access_point",
        "brand": "Cisco",
        "model": "AIR-AP1832I-B-K9",
        "serial_number": "FCW2140L0GH",
        "mac_address": "A4:6C:2A:12:34:56",
        "ip_address": "192.168.1.100",
        "status": "installed",
        "installation_date": "2025-10-15",
        "warranty_expiration": "2028-10-15",
        "point": {
          "id": 15,
          "label": "AP-101"
        },
        "location_description": "Conference Room A - Ceiling Mount"
      }
    ]
  }
}
```

### 9. Notifications

#### GET /notifications
```json
{
  "method": "GET",
  "endpoint": "/notifications",
  "description": "Get user notifications",
  "query_params": {
    "unread_only": true,
    "notification_type": "approval_request"
  },
  "response": {
    "notifications": [
      {
        "id": 1,
        "notification_type": "approval_request",
        "title": "Material Request Approval Needed",
        "message": "Dave Technician has requested 500 feet of Cat6 cable for Project Alpha",
        "priority": "medium",
        "is_read": false,
        "related_entity_type": "material_request",
        "related_entity_id": 25,
        "metadata": {
          "project_id": 1,
          "requester_name": "Dave Technician",
          "material_name": "Cat6 UTP Cable",
          "quantity": 500
        },
        "created_at": "2025-10-17T14:30:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

#### PUT /notifications/:id/read
```json
{
  "method": "PUT",
  "endpoint": "/notifications/1/read",
  "description": "Mark notification as read",
  "response": {
    "success": true,
    "message": "Notification marked as read"
  }
}
```

### 10. Reports

#### GET /reports/daily-summary
```json
{
  "method": "GET",
  "endpoint": "/reports/daily-summary",
  "description": "Get daily project summary",
  "query_params": {
    "project_id": 1,
    "date": "2025-10-17"
  },
  "response": {
    "report": {
      "project_id": 1,
      "project_name": "Office Building Network Installation",
      "date": "2025-10-17",
      "summary": {
        "points_completed": 12,
        "points_in_progress": 8,
        "points_with_problems": 2,
        "hours_logged": 64.5,
        "materials_used": [
          {
            "material_name": "Cat6 UTP Cable",
            "quantity_used": 850.0,
            "unit": "feet"
          }
        ],
        "team_productivity": [
          {
            "technician_name": "Dave Technician",
            "points_completed": 6,
            "hours_logged": 8.0,
            "efficiency": 0.75
          }
        ]
      }
    }
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ]
  },
  "timestamp": "2025-10-17T15:30:00Z",
  "request_id": "req_123456789"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited based on user role:
- **Technician**: 100 requests per minute
- **Lead Technician**: 200 requests per minute  
- **Supervisor**: 500 requests per minute
- **Project Manager**: 1000 requests per minute

## WebSocket Events

### Real-time Updates
```json
{
  "event": "point_status_updated",
  "data": {
    "project_id": 1,
    "point_id": 15,
    "old_status": "in_progress",
    "new_status": "terminated",
    "updated_by": {
      "id": 4,
      "name": "Dave Technician"
    },
    "timestamp": "2025-10-17T15:45:00Z"
  }
}
```

### Subscribe to Project Updates
```json
{
  "action": "subscribe",
  "channel": "project:1",
  "events": ["point_updates", "material_alerts", "notifications"]
}
```

This API documentation provides comprehensive coverage of all WireScope endpoints with detailed request/response examples.