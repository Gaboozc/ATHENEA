# WireScope UI/UX Wireframes and Design System

## Design Philosophy

WireScope follows a **mobile-first, accessibility-focused** design approach that prioritizes usability in field conditions while maintaining professional aesthetics for office environments.

### Core Principles
1. **Field-First Design**: Optimized for outdoor/construction site usage
2. **Role-Based UX**: Tailored interfaces for different user types
3. **Offline-Capable**: Clear indicators and functionality when disconnected
4. **Touch-Optimized**: Large touch targets for gloved hands
5. **High Contrast**: Readable in various lighting conditions

## Design System

### Color Palette

#### Primary Colors
```css
--primary-blue: #2563EB;      /* Main brand color */
--primary-dark: #1E40AF;      /* Dark variant */
--primary-light: #DBEAFE;     /* Light variant */
--secondary-orange: #F59E0B;   /* Accent color */
```

#### Status Colors
```css
--status-pending: #6B7280;     /* Pending points */
--status-progress: #3B82F6;    /* In progress */
--status-completed: #10B981;   /* Certified/completed */
--status-problem: #EF4444;     /* Problems/issues */
--status-warning: #F59E0B;     /* Warnings/material pending */
```

#### Neutral Colors
```css
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-500: #6B7280;
--gray-700: #374151;
--gray-900: #111827;
```

### Typography

#### Font Stack
```css
--font-primary: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

#### Scale
- **H1**: 2rem (32px) - Page titles
- **H2**: 1.5rem (24px) - Section headers
- **H3**: 1.25rem (20px) - Subsection headers
- **Body**: 1rem (16px) - Regular text
- **Small**: 0.875rem (14px) - Captions, labels
- **Micro**: 0.75rem (12px) - Status indicators

### Spacing System
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

## Mobile App Wireframes

### 1. Authentication Flow

#### Login Screen
```
┌─────────────────────────────┐
│        WireScope Logo       │
│                             │
│  ┌─────────────────────────┐│
│  │      Email Address      ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │       Password          ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │       SIGN IN           ││
│  └─────────────────────────┘│
│                             │
│     Forgot Password?        │
│                             │
│  [Biometric Icon] Touch ID  │
└─────────────────────────────┘
```

#### Role Selection (if multiple roles)
```
┌─────────────────────────────┐
│     Select Your Role        │
│                             │
│  ┌─────────────────────────┐│
│  │  👔 Project Manager     ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  👷 Supervisor          ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  🔧 Lead Technician     ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  ⚡ Technician          ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### 2. Project Dashboard

#### Project List (Technician View)
```
┌─────────────────────────────┐
│ Projects          [🔔] [👤] │
├─────────────────────────────┤
│                             │
│ 📋 Active Project (1)       │
│                             │
│ ┌─── Office Building ─────┐ │
│ │ 📊 Progress: 65%        │ │
│ │ 📍 Downtown Campus      │ │
│ │ ⏰ Due: Dec 15, 2025    │ │
│ │                         │ │
│ │ Your Tasks (5):         │ │
│ │ • 3 In Progress         │ │
│ │ • 2 Pending Review      │ │
│ └─────────────────────────┘ │
│                             │
│ Recent Projects (2):        │
│                             │
│ ┌─── Warehouse Network ───┐ │
│ │ ✅ Completed            │ │
│ │ 📅 Oct 2025             │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### Executive Dashboard (Project Manager)
```
┌─────────────────────────────┐
│ Dashboard        [🔔] [👤] │
├─────────────────────────────┤
│                             │
│ 📊 Overview                 │
│ ┌─────────┬─────────┬──────┐│
│ │Active: 5│On Hold:1│Done:8││
│ └─────────┴─────────┴──────┘│
│                             │
│ 🚨 Alerts (2)               │
│ • Material shortage - Proj A│
│ • Deadline risk - Proj B    │
│                             │
│ 📈 This Week                │
│ • 234 Points completed      │
│ • 89% Avg completion rate   │
│ • 12 Hours saved vs plan    │
│                             │
│ 👥 Team Status              │
│ • 15 Active technicians     │
│ • 3 Pending approvals       │
│ • 2 Training required       │
└─────────────────────────────┘
```

### 3. Project Detail Views

#### Project Overview
```
┌─────────────────────────────┐
│ ← Office Building Network   │
├─────────────────────────────┤
│                             │
│ 📊 Progress Bar [████░░] 65%│
│                             │
│ 🏢 Client: Tech Corp Inc    │
│ 📅 Start: Oct 1, 2025       │
│ ⏰ Due: Dec 15, 2025        │
│ 💰 Budget: 480 hrs          │
│                             │
│ Quick Stats:                │
│ ┌─────────┬─────────┬──────┐│
│ │Total:450│Done:290 │Prob:5││
│ │Points   │Points   │Points││
│ └─────────┴─────────┴──────┘│
│                             │
│ 🔧 Your Tasks (5):          │
│ • DP-101: In Progress       │
│ • DP-102: Pending           │
│ • AP-201: Needs Material    │
│                             │
│ [📋 All Points] [📄 Reports]│
└─────────────────────────────┘
```

### 4. Floor Plan Interface

#### Floor Plan Viewer
```
┌─────────────────────────────┐
│ ← Floor 1 Plan    [🔍][📋] │
├─────────────────────────────┤
│                             │
│    Floor Plan Canvas        │
│  ┌─────────────────────────┐│
│  │     ┌─────────┐         ││
│  │     │  Room A │ ●DP-101 ││
│  │     │         │         ││
│  │     └─────────┘         ││
│  │                         ││
│  │  ●DP-102    ┌─────────┐ ││
│  │             │  Room B │ ││
│  │             │         │ ││
│  │             └─────────┘ ││
│  └─────────────────────────┘│
│                             │
│ Legend: ●Pending ●Progress  │
│         ●Complete ●Problem  │
│                             │
│ [➕ Add Point] [🔄 Sync]    │
└─────────────────────────────┘
```

#### Point Detail Modal
```
┌─────────────────────────────┐
│ Point Details          [✕]  │
├─────────────────────────────┤
│                             │
│ 🏷️  Label: DP-101           │
│ 📍 Location: Conference A   │
│ 🔌 Type: Data Point         │
│                             │
│ Status: In Progress         │
│ ┌─────────────────────────┐ │
│ │ ○ Pending               │ │
│ │ ● In Progress           │ │
│ │ ○ Pull Complete         │ │
│ │ ○ Terminated            │ │
│ │ ○ Certified             │ │
│ └─────────────────────────┘ │
│                             │
│ 👤 Assigned: Dave Tech      │
│ ⏱️  Est. Hours: 2.5         │
│ ✅ Act. Hours: 1.2          │
│                             │
│ 📝 Notes:                   │
│ "Cable pulled, termination  │
│ scheduled for tomorrow"     │
│                             │
│ [📷 Add Photo] [💾 Save]    │
└─────────────────────────────┘
```

### 5. Point Management

#### Points List View
```
┌─────────────────────────────┐
│ ← Points          [🔍][⚙️]  │
├─────────────────────────────┤
│                             │
│ Filters: [All ▼] [Floor ▼] │
│                             │
│ ┌─ DP-101 ──────────────────┐│
│ │ Conference Room A         ││
│ │ ⏳ In Progress           ││
│ │ 👤 Dave Tech | ⏱️ 2.5h   ││
│ └───────────────────────────┘│
│                             │
│ ┌─ DP-102 ──────────────────┐│
│ │ Conference Room A         ││
│ │ ⏸️  Pending              ││
│ │ 👤 Unassigned | ⏱️ 2.0h  ││
│ └───────────────────────────┘│
│                             │
│ ┌─ AP-201 ──────────────────┐│
│ │ Lobby Area                ││
│ │ ⚠️  Material Pending      ││
│ │ 👤 Carol Lead | ⏱️ 4.0h   ││
│ └───────────────────────────┘│
│                             │
│ [➕ Add Point]              │
└─────────────────────────────┘
```

#### Point Status Update
```
┌─────────────────────────────┐
│ Update Status          [✕]  │
├─────────────────────────────┤
│                             │
│ Point: DP-101               │
│ Current: In Progress        │
│                             │
│ New Status:                 │
│ ┌─────────────────────────┐ │
│ │ ○ In Progress           │ │
│ │ ● Pull Complete         │ │
│ │ ○ Terminated            │ │
│ │ ○ Certified             │ │
│ │ ○ Problem               │ │
│ └─────────────────────────┘ │
│                             │
│ ⏱️ Hours Worked:            │
│ ┌─────────┐                │
│ │   2.5   │ hours           │
│ └─────────┘                │
│                             │
│ 📝 Notes (optional):        │
│ ┌─────────────────────────┐ │
│ │Cable pulled and tested  │ │
│ │successfully. Ready for  │ │
│ │termination.             │ │
│ └─────────────────────────┘ │
│                             │
│ [📷 Photo] [💾 Update]      │
└─────────────────────────────┘
```

### 6. Materials Management

#### Materials Inventory
```
┌─────────────────────────────┐
│ Materials         [🔍][➕]  │
├─────────────────────────────┤
│                             │
│ 📊 Quick Stats              │
│ ┌─────────┬─────────┬──────┐│
│ │ 5 Low   │12 Items │$2.3K ││
│ │ Stock   │ Total   │Value ││
│ └─────────┴─────────┴──────┘│
│                             │
│ ⚠️ Low Stock Alerts (3)     │
│                             │
│ ┌─ Cat6 UTP Cable ─────────┐│
│ │ 850 ft remaining         ││
│ │ ⚠️ Below minimum (1000)  ││
│ │ 💰 $0.45/ft             ││
│ └─────────────────────────┘│
│                             │
│ ┌─ RJ45 Connectors ───────┐│
│ │ 45 pieces remaining      ││
│ │ ✅ Adequate stock        ││
│ │ 💰 $0.85/piece          ││
│ └─────────────────────────┘│
│                             │
│ [📋 Usage Report]           │
└─────────────────────────────┘
```

#### Material Usage Recording
```
┌─────────────────────────────┐
│ Record Usage          [✕]   │
├─────────────────────────────┤
│                             │
│ Material: Cat6 UTP Cable    │
│ Available: 850 ft           │
│                             │
│ Usage Details:              │
│ ┌─────────────────────────┐ │
│ │ Point: [DP-101    ▼]    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Quantity: [85.5] ft     │ │
│ └─────────────────────────┘ │
│                             │
│ Usage Type:                 │
│ ┌─────────────────────────┐ │
│ │ ● Installation          │ │
│ │ ○ Repair               │ │
│ │ ○ Replacement          │ │
│ │ ○ Waste                │ │
│ └─────────────────────────┘ │
│                             │
│ 📝 Notes:                   │
│ ┌─────────────────────────┐ │
│ │Cable run from comm room │ │
│ │to conference room A     │ │
│ └─────────────────────────┘ │
│                             │
│ Remaining: 764.5 ft         │
│ [💾 Record Usage]           │
└─────────────────────────────┘
```

### 7. Comm Rooms Module

#### Comm Rooms List
```
┌─────────────────────────────┐
│ Comm Rooms        [🔍][➕]  │
├─────────────────────────────┤
│                             │
│ ┌─ Main Distribution Frame ┐│
│ │ 📍 Basement Level B1     ││
│ │ 🏗️  In Progress (60%)    ││
│ │ 👤 Dave Tech            ││
│ │ ✅ 3/5 Tasks Complete   ││
│ └─────────────────────────┘│
│                             │
│ ┌─ Floor 2 IDF ───────────┐│
│ │ 📍 Electrical Room 2F    ││
│ │ ⏸️  Pending             ││
│ │ 👤 Unassigned           ││
│ │ ⚪ 0/5 Tasks Complete    ││
│ └─────────────────────────┘│
│                             │
│ ┌─ Lobby Equipment Closet ┐│
│ │ 📍 Lobby Level          ││
│ │ ✅ Approved             ││
│ │ 👤 Carol Lead           ││
│ │ ✅ 5/5 Tasks Complete   ││
│ └─────────────────────────┘│
└─────────────────────────────┘
```

#### Comm Room Checklist
```
┌─────────────────────────────┐
│ ← MDF Checklist            │
├─────────────────────────────┤
│                             │
│ Progress: 3/5 Complete      │
│ ████████░░ 60%              │
│                             │
│ Checklist Items:            │
│                             │
│ ✅ Patch panels installed   │
│ ✅ Cable management done    │
│ ✅ Grounding verified       │
│ ⏸️  Labeling complete       │
│ ⏸️  Documentation updated   │
│                             │
│ 📷 Photos (3):              │
│ ┌─────┬─────┬─────┬─────┐   │
│ │Before│During│After│ + │   │
│ │ [📷] │ [📷] │ [ ] │[📷]│   │
│ └─────┴─────┴─────┴─────┘   │
│                             │
│ 👤 Assigned: Dave Tech      │
│ 👥 Supervisor: Bob Super    │
│                             │
│ [💾 Save] [✅ Request Appr.]│
└─────────────────────────────┘
```

### 8. Notifications Center

#### Notifications List
```
┌─────────────────────────────┐
│ Notifications     [🔔3][⚙️] │
├─────────────────────────────┤
│                             │
│ Today                       │
│                             │
│ 🚨 Material Shortage        │
│ Cat6 cable below minimum    │
│ Project: Office Building    │
│ 2 hours ago         [●]     │
│                             │
│ ✅ Approval Request         │
│ Dave Tech requests approval │
│ for MDF completion          │
│ 4 hours ago         [●]     │
│                             │
│ Yesterday                   │
│                             │
│ 📋 Daily Report Ready       │
│ Project summary for Oct 16  │
│ is ready for review         │
│ Yesterday 6:00 PM   [○]     │
│                             │
│ 🏆 Milestone Achieved       │
│ Floor 1 points 100% complete│
│ Great work team!            │
│ Yesterday 2:30 PM   [○]     │
│                             │
│ [Mark All Read]             │
└─────────────────────────────┘
```

## Desktop App Interface

### 1. Executive Dashboard (Project Manager)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ WireScope | Executive Dashboard              [🔔3] [👤 John Manager] [⚙️] │
├─────────────────────────────────────────────────────────────────────────┤
│ 📊 Portfolio Overview                                     📅 Oct 17, 2025 │
│                                                                         │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐ │
│ │ 12 Active   │ 3 On Hold   │ 28 Complete │ $2.3M Value │ 89% Avg     │ │
│ │ Projects    │ Projects    │ Projects    │ Portfolio   │ Efficiency  │ │
│ └─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘ │
│                                                                         │
│ 📈 Performance Trends (Last 30 Days)         🚨 Critical Alerts (4)     │
│ ┌─────────────────────────────────────┐     ┌─────────────────────────┐ │
│ │      📊 Completion Rate             │     │ ⚠️ Proj A - Budget Risk │ │
│ │     ╭─╮                             │     │ 🔴 Proj B - Overdue     │ │
│ │  ╭──╯ ╰─╮      ╭─╮                 │     │ 📦 Proj C - Material    │ │
│ │ ╱        ╰──╭──╯ ╰╮                │     │ 👥 Proj D - Staffing    │ │
│ │╱            ╱     ╰─               │     └─────────────────────────┘ │
│ └─────────────────────────────────────┘                                 │
│                                                                         │
│ 📋 Project Status Summary                     👥 Team Performance        │
│ ┌─────────────────────────────────────┐     ┌─────────────────────────┐ │
│ │ Office Building    ████████░░  80%  │     │ Dave T.    ⭐⭐⭐⭐⭐  │ │
│ │ Warehouse Net      ██████░░░░  60%  │     │ Carol L.   ⭐⭐⭐⭐⭐  │ │
│ │ Campus Upgrade     ██████████ 100%  │     │ Mike S.    ⭐⭐⭐⭐⚪  │ │
│ │ Data Center        ████░░░░░░  40%  │     │ Sarah B.   ⭐⭐⭐⚪⚪  │ │
│ └─────────────────────────────────────┘     └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Project Management Interface
```
┌─────────────────────────────────────────────────────────────────────────┐
│ WireScope | Office Building Network                     [👤] [📋] [⚙️]   │
├─────────────────────────────────────────────────────────────────────────┤
│ 🏢 Tech Corp Inc. | Started: Oct 1, 2025 | Due: Dec 15, 2025 | 65% ████│
│                                                                         │
│ ┌─ Floor Plans ─┐ ┌─ Points Status ─┐ ┌─ Team Activity ─┐ ┌─ Materials ┐│
│ │               │ │                 │ │                 │ │            ││
│ │   📄 Floor 1  │ │ Total: 450      │ │ Online: 12/15   │ │ 5 Items    ││
│ │   📄 Floor 2  │ │ Done: 290       │ │ Active: 8       │ │ Low Stock  ││
│ │   📄 Floor 3  │ │ Progress: 95    │ │ Idle: 4         │ │            ││
│ │   📄 Floor 4  │ │ Pending: 60     │ │ Offline: 3      │ │ Request    ││
│ │   📄 Floor 5  │ │ Problems: 5     │ │                 │ │ Materials  ││
│ │               │ │                 │ │ View Team →     │ │            ││
│ └───────────────┘ └─────────────────┘ └─────────────────┘ └────────────┘│
│                                                                         │
│ 🗂️ Recent Activity                            📊 Progress Chart          │
│ ┌─────────────────────────────────────┐     ┌─────────────────────────┐ │
│ │ 2:30 PM Dave T. completed DP-101    │     │     Weekly Progress     │ │
│ │ 2:15 PM Carol L. updated AP-201     │     │ 100%┌─┐                │ │
│ │ 1:45 PM Material request approved   │     │  75%│ │     ┌─┐        │ │
│ │ 1:30 PM MDF checklist submitted     │     │  50%│ │ ┌─┐ │ │ ┌─┐    │ │
│ │ 12:45 PM Floor 2 plan updated       │     │  25%│ │ │ │ │ │ │ │ ┌─ │ │
│ │                                     │     │   0%└─┘ └─┘ └─┘ └─┘ └─┘ │ │
│ │ View All Activity →                 │     │     Mon Tue Wed Thu Fri  │ │
│ └─────────────────────────────────────┘     └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Interactive Floor Plan (Desktop)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Floor Plan - Ground Floor                           [🔍] [📋] [💾] [🔄] │
├─────────────────────────────────────────────────────────────────────────┤
│ Tools: [👆 Select] [➕ Point] [📏 Measure] [🏷️ Label] | View: [👥] [📊] │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                        Floor Plan Canvas                            │ │
│ │                                                                     │ │
│ │    ┌─────────────────┐      ┌─────────────────┐                    │ │
│ │    │   Conference A  │      │   Conference B  │                    │ │
│ │    │                 │      │                 │                    │ │
│ │    │ ●DP-101 ●DP-102│      │ ●DP-201 ●DP-202│                    │ │
│ │    │                 │      │                 │                    │ │
│ │    └─────────────────┘      └─────────────────┘                    │ │
│ │                                                                     │ │
│ │              ●AP-301                                               │ │
│ │                                                                     │ │
│ │    ┌───────────────────────────────────────┐                      │ │
│ │    │            Open Office Area            │                      │ │
│ │    │                                       │                      │ │
│ │    │ ●DP-401  ●DP-402  ●DP-403  ●DP-404   │                      │ │
│ │    │                                       │                      │ │
│ │    │ ●DP-405  ●DP-406  ●DP-407  ●DP-408   │                      │ │
│ │    └───────────────────────────────────────┘                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Legend: ●Complete ●Progress ●Pending ●Problem | Selected: DP-101        │
│                                                                         │
│ ┌─ Point Details ──────────────┐ ┌─ Layers ──────┐ ┌─ History ────────┐│
│ │ DP-101 | Conference Room A   │ │ ☑ Data Points │ │ v2.1 - Oct 15    ││
│ │ Status: Completed ✅         │ │ ☑ Voice Points│ │ v2.0 - Oct 10    ││
│ │ Tech: Dave T.                │ │ ☑ Access Pts  │ │ v1.0 - Oct 1     ││
│ │ Hours: 2.5/2.5               │ │ ☐ Labels Only │ │                  ││
│ │ Certified: Oct 16, 3:30 PM   │ └───────────────┘ └──────────────────┘│
│ └──────────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Responsive Design Breakpoints

### Mobile (320px - 768px)
- Single column layout
- Touch-optimized controls (min 44px)
- Collapsible navigation
- Simplified data tables

### Tablet (769px - 1024px)  
- Two column layout
- Side navigation panel
- Enhanced touch targets
- Modal dialogs

### Desktop (1025px+)
- Multi-column layouts
- Persistent navigation
- Detailed data views
- Multiple simultaneous contexts

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio
- **Focus Indicators**: Clear keyboard navigation
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Touch Targets**: Minimum 44x44px
- **Text Scaling**: Responsive to system font sizes

### Field-Specific Accessibility  
- **High Visibility Mode**: Increased contrast for bright sunlight
- **Glove Mode**: Larger touch targets for work gloves
- **Voice Commands**: Basic voice navigation for hands-free operation
- **Offline Indicators**: Clear visual feedback for connection status

## Animation and Interactions

### Micro-interactions
- **Button Press**: Subtle scale and shadow change
- **Status Updates**: Color transition with pulse effect
- **Loading States**: Skeleton screens and progress indicators
- **Success/Error**: Toast notifications with slide-in animation

### Page Transitions
- **Navigation**: Slide transitions between major sections
- **Modal Dialogs**: Fade in with backdrop blur
- **Data Updates**: Smooth state changes without jarring updates

This comprehensive design system ensures consistency across all platforms while maintaining usability in challenging field conditions.