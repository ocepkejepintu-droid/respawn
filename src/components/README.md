# Real Buzzer Dashboard Components

This directory contains the comprehensive design system and dashboard components for the Real Buzzer SaaS application.

## Design System

### Colors

- **Primary**: Indigo (`#4f46e5` / `indigo-600`)
- **Success**: Green (`#22c55e` / `green-500`)
- **Warning**: Amber (`#f59e0b` / `amber-500`)
- **Danger**: Red (`#ef4444` / `red-500`)
- **Neutral**: Slate gray scale (`slate-50` to `slate-950`)

### Design Tokens

| Token | Value | Description |
|-------|-------|-------------|
| `--sidebar-width` | 16rem | Expanded sidebar width |
| `--sidebar-width-collapsed` | 4rem | Collapsed sidebar width |
| `--header-height` | 4rem | Header height |
| `--radius-lg` | 0.75rem | Default border radius |

## UI Components (`src/components/ui/`)

### Button

Versatile button component with multiple variants and sizes.

```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>
<Button variant="warning">Warning</Button>
<Button variant="success">Success</Button>
<Button variant="link">Link</Button>
```

**Props:**
- `variant`: Button style variant
- `size`: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"
- `loading`: Show loading spinner
- `asChild`: Render as child component

### Card

Container component for grouping related content.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>
```

### Badge

Small status indicator component.

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="outline">Outline</Badge>
```

### Avatar

User avatar component with fallback initials.

```tsx
import { Avatar, AvatarGroup } from "@/components/ui/avatar";

<Avatar src="/avatar.jpg" alt="User" fallback="John Doe" size="md" status="online" />
<AvatarGroup max={3}>
  <Avatar fallback="User 1" />
  <Avatar fallback="User 2" />
  <Avatar fallback="User 3" />
</AvatarGroup>
```

**Sizes:** sm (32px), md (40px), lg (48px), xl (64px)
**Statuses:** online, offline, away, busy

### Skeleton

Loading placeholder component.

```tsx
import { Skeleton, SkeletonText, SkeletonCard, SkeletonStatCard, SkeletonTable } from "@/components/ui/skeleton";

<Skeleton className="h-12 w-12" variant="circle" />
<SkeletonText lines={3} />
<SkeletonCard hasImage hasHeader />
<SkeletonStatCard />
<SkeletonTable rows={5} columns={4} />
```

### DataTable

Sortable and filterable data table component.

```tsx
import { DataTable, type Column } from "@/components/ui/data-table";

const columns: Column<DataItem>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "status", header: "Status", render: (item) => <Badge>{item.status}</Badge> },
];

<DataTable
  data={data}
  columns={columns}
  keyExtractor={(item) => item.id}
  sortable
  filterable
  pagination
  pageSize={10}
/>
```

### StatCard

Metric display card with trend indicator.

```tsx
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";

<StatCardGrid columns={4}>
  <StatCard
    title="Revenue"
    value="$45,231"
    trend={{ value: 20.1, label: "from last month", direction: "up" }}
    icon={<DollarSign />}
    iconColor="success"
  />
</StatCardGrid>
```

### TrendIndicator

Up/down trend indicator with percentage.

```tsx
import { TrendIndicator, TrendComparison } from "@/components/ui/trend-indicator";

<TrendIndicator direction="up" value={12.5} format="percentage" />
<TrendComparison current={1000} previous={800} label="vs last month" />
```

### ProgressBar

Progress bar with multiple variants.

```tsx
import { ProgressBar, MultiProgressBar } from "@/components/ui/progress-bar";

<ProgressBar value={75} max={100} showLabel />
<ProgressBar value={50} variant="success" size="sm" />
<ProgressBar indeterminate />
<MultiProgressBar
  segments={[
    { value: 30, color: "#4f46e5", label: "Completed" },
    { value: 20, color: "#f59e0b", label: "In Progress" },
  ]}
  max={100}
/>
```

### EmptyState

Empty state illustration component.

```tsx
import { EmptyState, EmptySearch, EmptyInbox, EmptyFolder, EmptyError } from "@/components/ui/empty-state";

<EmptyState
  icon={Inbox}
  title="No items yet"
  description="Get started by creating your first item"
  action={{ label: "Create Item", onClick: () => {}, variant: "primary" }}
/>
<EmptySearch searchTerm="query" />
<EmptyInbox />
<EmptyFolder />
<EmptyError error="Failed to load data" />
```

## Dashboard Components (`src/components/dashboard/`)

### DashboardShell

Main layout wrapper for dashboard pages.

```tsx
import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard/dashboard-shell";

<DashboardShell
  user={{ name: "John", email: "john@example.com" }}
  workspaces={[{ id: "1", name: "Acme Corp" }]}
  currentWorkspace="1"
  notifications={[]}
>
  <PageHeader
    title="Dashboard"
    description="Overview of your account"
    breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
    actions={<Button>New Project</Button>}
  />
  <PageContent>
    {/* Page content */}
  </PageContent>
</DashboardShell>
```

### Sidebar

Collapsible navigation sidebar.

```tsx
import { Sidebar } from "@/components/dashboard/sidebar";

<Sidebar
  collapsed={false}
  onToggle={() => setCollapsed(!collapsed)}
  user={{ name: "John", email: "john@example.com" }}
/>
```

### Header

Top navigation header with search, notifications, and user menu.

```tsx
import { Header } from "@/components/dashboard/header";

<Header
  user={{ id: "1", name: "John", email: "john@example.com" }}
  workspaces={[]}
  currentWorkspace="1"
  notifications={[]}
  onThemeToggle={() => toggleTheme()}
  isDarkMode={false}
/>
```

### WorkspaceSwitcher

Dropdown for switching between workspaces.

```tsx
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";

<WorkspaceSwitcher
  workspaces={[
    { id: "1", name: "Acme Corp", plan: "Pro" },
    { id: "2", name: "Personal", plan: "Free" },
  ]}
  currentWorkspace="1"
  onWorkspaceChange={(id) => console.log(id)}
  onCreateWorkspace={() => console.log("Create new")}
/>
```

### NotificationBell

Notification dropdown with unread count.

```tsx
import { NotificationBell } from "@/components/dashboard/notification-bell";

<NotificationBell
  notifications={[
    {
      id: "1",
      title: "New message",
      message: "You have a new message",
      type: "info",
      read: false,
      timestamp: new Date(),
    },
  ]}
  onNotificationClick={(id) => console.log(id)}
  onMarkAllRead={() => console.log("Mark all read")}
/>
```

### MobileNav

Mobile slide-out navigation drawer.

```tsx
import { MobileNav } from "@/components/dashboard/mobile-nav";

<MobileNav
  isOpen={mobileMenuOpen}
  onClose={() => setMobileMenuOpen(false)}
  user={{ name: "John", email: "john@example.com" }}
/>
```

## Usage Example

```tsx
// app/(dashboard)/page.tsx
import { DashboardShell, PageHeader, PageContent } from "@/components/dashboard/dashboard-shell";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome to your dashboard"
        actions={<Button>New Project</Button>}
      />
      <PageContent>
        <StatCardGrid columns={4}>
          <StatCard title="Revenue" value="$45,231" icon={<DollarSign />} />
        </StatCardGrid>
        {/* More content */}
      </PageContent>
    </>
  );
}
```

## Dark Mode Support

All components support dark mode through the `dark:` Tailwind CSS modifier. The theme can be toggled using the `dark` class on the `html` element.

```tsx
// Toggle dark mode
document.documentElement.classList.toggle("dark");
```

## Accessibility

- All components follow WAI-ARIA guidelines
- Keyboard navigation support
- Focus management and visible focus states
- Screen reader friendly markup
- Color contrast compliance (WCAG AA)
