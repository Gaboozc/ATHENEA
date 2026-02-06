# WireScope Mobile - UI Components Documentation

This document describes the comprehensive UI component system built for the WireScope mobile application.

## 📋 Component Architecture

The UI system is organized into three main categories:

### 🎨 UI Components (`/src/components/ui/`)
Core, reusable UI elements that form the foundation of the design system.

### 🏗️ Layout Components (`/src/components/layout/`)
Structural components for organizing content and providing consistent layouts.

### 🏢 Business Components (`/src/components/business/`)
Domain-specific components tailored to WireScope's structured cabling functionality.

---

## 🎨 UI Components

### Button
A versatile button component with multiple variants and states.

```tsx
import { Button } from '../components';

<Button
  title="Submit"
  variant="primary" // primary | secondary | outline | text
  size="medium" // small | medium | large
  loading={isLoading}
  disabled={false}
  onPress={handleSubmit}
/>
```

**Features:**
- 4 visual variants (primary, secondary, outline, text)
- 3 size options with responsive touch targets
- Loading state with activity indicator
- Disabled state with visual feedback
- Customizable styles

### InputField
Advanced text input with validation, icons, and password toggle.

```tsx
import { InputField } from '../components';

<InputField
  label="Email Address"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  helperText="We'll never share your email"
  required
  showPasswordToggle // for password fields
  leftIcon={<Icon name="email" />}
/>
```

**Features:**
- Label and validation error display
- Password visibility toggle
- Left and right icon support
- Focus/blur state styling
- Helper text and required field indicators
- Customizable container and input styles

### Card
Flexible card container with multiple variants and interactive capabilities.

```tsx
import { Card } from '../components';

<Card
  title="Project Overview"
  subtitle="Current status and metrics"
  variant="elevated" // default | elevated | outlined
  padding="medium" // none | small | medium | large
  onPress={handleCardPress} // makes card touchable
>
  <Text>Card content goes here</Text>
</Card>
```

**Features:**
- Optional title and subtitle
- 3 visual variants with different elevation/borders
- 4 padding options
- Optional onPress for interactive cards
- Consistent shadow and border radius

### BottomSheet
Modal bottom sheet for contextual actions and forms.

```tsx
import { BottomSheet } from '../components';

<BottomSheet
  visible={isVisible}
  onClose={handleClose}
  title="Filter Options"
  height={400} // or 'auto'
  closeOnBackdrop={true}
>
  <Text>Bottom sheet content</Text>
</BottomSheet>
```

**Features:**
- Slide-up animation
- Drag handle for visual feedback
- Optional title bar with close button
- Backdrop tap to close
- Scrollable content area
- Customizable height

### Chip
Small, compact elements for filters, tags, and selections.

```tsx
import { Chip } from '../components';

<Chip
  label="Active Projects"
  selected={isSelected}
  onPress={handleSelection}
  onDelete={handleDelete} // shows delete icon
  variant="outlined" // filled | outlined
  color="primary" // primary | secondary | success | warning | error
  size="medium" // small | medium
/>
```

**Features:**
- Selection state with visual feedback
- Optional delete functionality
- 2 variants and 5 color options
- 2 size options
- Disabled state support

### Badge
Notification badges and count indicators.

```tsx
import { Badge } from '../components';

<Badge
  count={5}
  variant="error" // primary | secondary | success | warning | error | info
  position="topRight" // topRight | topLeft | bottomRight | bottomLeft | inline
  maxCount={99} // shows "99+" when exceeded
  showZero={false}
/>
```

**Features:**
- Automatic count display with max limits
- 6 color variants
- 5 position options for overlay placement
- Text badge support
- Auto-hide when count is zero

### Avatar
User profile pictures and name initials.

```tsx
import { Avatar } from '../components';

<Avatar
  name="John Smith"
  size="medium" // small | medium | large | xlarge
  backgroundColor="#2196F3"
  textColor="#fff"
  source={{ uri: 'https://example.com/avatar.jpg' }} // optional
/>
```

**Features:**
- Automatic initials generation from names
- 4 size options
- Customizable colors
- Image support (placeholder implementation)
- Fallback to initials when no image

---

## 🏗️ Layout Components

### ScreenWrapper
Root container component for consistent screen layouts.

```tsx
import { ScreenWrapper } from '../components';

<ScreenWrapper
  scrollable={true}
  safeArea={true}
  padding={true}
  backgroundColor="#f5f5f5"
>
  <Text>Screen content</Text>
</ScreenWrapper>
```

**Features:**
- Safe area handling for iOS notches
- Optional scrollable content
- Consistent padding system
- Background color customization
- Keyboard handling for forms

### Header
Navigation header with title, subtitle, and action buttons.

```tsx
import { Header } from '../components';

<Header
  title="Project Details"
  subtitle="Building A - Phase 1"
  leftIcon={<Icon name="arrow-back" />}
  rightIcon={<Icon name="more-vert" />}
  onLeftPress={handleBack}
  onRightPress={handleMenu}
  showBorder={true}
/>
```

**Features:**
- Centered title with optional subtitle
- Left and right action buttons
- Customizable colors and styling
- Optional bottom border
- Consistent touch targets

### Section
Content organization component with titles and spacing.

```tsx
import { Section } from '../components';

<Section
  title="Recent Activity"
  subtitle="Last 7 days"
  spacing="large" // none | small | medium | large
>
  <Text>Section content</Text>
</Section>
```

**Features:**
- Optional title and subtitle
- 4 spacing options for consistent margins
- Flexible content area
- Customizable header styling

---

## 🏢 Business Components

### ProjectCard
Specialized card for displaying project information.

```tsx
import { ProjectCard } from '../components';

<ProjectCard
  project={{
    id: '1',
    name: 'Office Building A',
    status: 'active',
    clientName: 'ABC Corporation',
    completion: 75,
    totalPoints: 248,
    lastActivity: '2 hours ago'
  }}
  onPress={handleProjectPress}
  onStatusPress={handleStatusChange}
/>
```

**Features:**
- Status chips with color coding
- Progress visualization
- Key metrics display
- Last activity timestamp
- Touch interactions for navigation

### PointCard
Cable point information display with status management.

```tsx
import { PointCard } from '../components';

<PointCard
  point={{
    id: '1',
    pointNumber: 'A-001',
    type: 'data',
    category: 'Cat6',
    status: 'installed',
    roomNumber: '301',
    coordinates: { x: 150, y: 200 }
  }}
  onPress={handlePointPress}
  onStatusChange={handleStatusUpdate}
  showLocation={true}
/>
```

**Features:**
- Type indicator with color coding
- Status management with quick updates
- Location information display
- Cable category badges
- Interactive status cycling

### FilterBar
Horizontal scrolling filter chips for data filtering.

```tsx
import { FilterBar } from '../components';

<FilterBar
  title="Filter by Status"
  options={[
    { key: 'active', label: 'Active', count: 12 },
    { key: 'completed', label: 'Completed', count: 5 }
  ]}
  selectedKeys={selectedFilters}
  onFilterChange={setSelectedFilters}
  multiSelect={true}
  showCounts={true}
/>
```

**Features:**
- Horizontal scrolling for many options
- Multi-select or single-select modes
- Count badges for each filter
- Dynamic selection state
- Customizable styling

---

## 🎨 Design System

### Colors
```typescript
const theme = {
  colors: {
    primary: '#2196F3',
    secondary: '#FFC107',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    // ... more colors
  }
};
```

### Typography
```typescript
const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 14, fontWeight: 'normal' },
};
```

### Spacing
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

---

## 🔧 Usage Examples

### Complete Screen Example
```tsx
import React, { useState } from 'react';
import {
  ScreenWrapper,
  Header,
  Section,
  ProjectCard,
  FilterBar,
  Button
} from '../components';

const ProjectsScreen = () => {
  const [selectedFilters, setSelectedFilters] = useState([]);
  
  return (
    <ScreenWrapper scrollable>
      <Header
        title="Projects"
        rightIcon={<Icon name="add" />}
        onRightPress={handleAddProject}
      />
      
      <FilterBar
        title="Filter by Status"
        options={statusOptions}
        selectedKeys={selectedFilters}
        onFilterChange={setSelectedFilters}
      />
      
      <Section title="Active Projects" spacing="medium">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onPress={handleProjectPress}
          />
        ))}
      </Section>
      
      <Button
        title="Add New Project"
        variant="primary"
        onPress={handleAddProject}
      />
    </ScreenWrapper>
  );
};
```

### Form Example
```tsx
const LoginForm = () => {
  return (
    <ScreenWrapper>
      <Section title="Sign In" spacing="large">
        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          required
        />
        
        <InputField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          showPasswordToggle
          required
        />
        
        <Button
          title="Sign In"
          loading={isLoading}
          onPress={handleLogin}
        />
      </Section>
    </ScreenWrapper>
  );
};
```

---

## 🚀 Next Steps

The UI component system provides a solid foundation for building the WireScope mobile application. The next development phases should focus on:

1. **API Integration**: Connect components to backend services
2. **Advanced Interactions**: Implement drag-and-drop, gestures, animations  
3. **Accessibility**: Add proper accessibility labels and navigation
4. **Testing**: Create unit tests for all components
5. **Documentation**: Generate Storybook documentation
6. **Performance**: Optimize rendering and memory usage

This component system ensures consistency, maintainability, and scalability as the WireScope mobile application continues to evolve.