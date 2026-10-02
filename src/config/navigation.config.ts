import {
  LayoutDashboard,
  ClipboardCheck,
  Bell,
  UserCheck,
  PlusCircle,
  ClipboardList,
  Receipt,
  AlertCircle,
  Search,
  Store,
  ShoppingCart,
  Clock,
  CalendarDays,
  RotateCcw,
  History,
  Boxes,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  ClipboardCheck as StockCountIcon,
  FileText,
  FilePlus,
  CreditCard,
  Briefcase,
  Trash2,
  Repeat,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  Layers,
  DollarSign,
  Activity,
  Settings,
  ShieldCheck,
  School,
  Database,
  Tag,
  GitPullRequest,
  Hash,
  HardDriveDownload,
  Truck,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';

export interface FeatureFlags {
  multiStore: boolean;
  calendar: boolean;
  billingNote: boolean;
}

export const features: FeatureFlags = {
  multiStore: false,
  calendar: false,
  billingNote: false,
};

export interface NavigationSubItem {
  label: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  roles?: string[];
  permissions?: string[];
  featureFlag?: keyof FeatureFlags;
}

export interface NavigationSubGroup {
  id: string;
  label: string;
  items: NavigationSubItem[];
}

export interface NavigationGroup {
  id: string;
  label: string;
  icon: any;
  roles?: string[];
  permissions?: string[];
  subItems?: NavigationSubItem[];
  subGroups?: NavigationSubGroup[];
}

export const navigationConfig: NavigationGroup[] = [
  // 1. Dashboard
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    subItems: [
      { label: 'Overview', href: '/', icon: LayoutDashboard },
      {
        label: 'Approvals',
        href: '/?tab=approvals',
        icon: ClipboardCheck,
        permissions: ['inventory:stock:issue', 'inventory:stock:restock', 'iam:user:read'],
        roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER']
      },
      {
        label: 'Inbox',
        href: '/?tab=inbox',
        icon: Bell
      },
      {
        label: 'Calendar',
        href: '/?tab=calendar',
        icon: Calendar,
        featureFlag: 'calendar'
      }
    ]
  },

  // 2. My Space (Self-Service for all teachers & staff)
  {
    id: 'my_space',
    label: 'My Space',
    icon: UserCheck,
    subItems: [
      { label: 'New Request', href: '/my-space?tab=new-request', icon: PlusCircle },
      { label: 'My Requests', href: '/my-space?tab=my-requests', icon: ClipboardList },
      { label: 'My Receipts & Invoices', href: '/my-space?tab=my-receipts', icon: Receipt },
      { label: 'Report Issue', href: '/my-space?tab=report-issue', icon: AlertCircle },
      { label: 'Search Stock', href: '/my-space?tab=search-stock', icon: Search }
    ]
  },

  // 3. Point of Sale
  {
    id: 'pos',
    label: 'Point of Sale',
    icon: Store,
    permissions: ['pos:receipt:read', 'pos:receipt:create'],
    roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'CASHIER', 'cashier'],
    subItems: [
      { label: 'Sell', href: '/pos', icon: ShoppingCart },
      { label: 'Shift', href: '/pos?tab=shift', icon: Clock },
      { label: "Today's Sales", href: '/pos?tab=today', icon: CalendarDays },
      {
        label: 'Return / Exchange',
        href: '/pos?tab=return',
        icon: RotateCcw,
        permissions: ['pos:receipt:void', 'pos:receipt:refund'],
        roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN', 'CASHIER', 'cashier']
      },
      { label: 'Sales History', href: '/history?tab=sales', icon: History }
    ]
  },

  // 4. Inventory
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    permissions: ['inventory:item:read'],
    roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE', 'warehouse'],
    subItems: [
      {
        label: 'Goods Receipt',
        href: '/operations/restock',
        icon: PackagePlus,
        permissions: ['inventory:stock:restock'],
        roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE', 'warehouse']
      },
      {
        label: 'Issue',
        href: '/operations/issue',
        icon: PackageMinus,
        permissions: ['inventory:stock:issue'],
        roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE', 'warehouse']
      },
      {
        label: 'Borrow & Return',
        href: '/inventory?tab=borrow',
        icon: ArrowLeftRight,
        permissions: ['inventory:stock:issue'],
        roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE', 'warehouse']
      },
      {
        label: 'Transfer',
        href: '/inventory?tab=transfer',
        icon: Truck,
        featureFlag: 'multiStore'
      },
      {
        label: 'Stock Count',
        href: '/inventory?tab=stock-count',
        icon: StockCountIcon
      },
      {
        label: 'Item Master',
        href: '/inventory?tab=all',
        icon: Boxes
      },
      {
        label: 'Locations',
        href: '/inventory?tab=locations',
        icon: MapPin,
        featureFlag: 'multiStore'
      }
    ]
  },

  // 5. Invoicing & Receivables
  {
    id: 'invoicing',
    label: 'Invoicing & Receivables',
    icon: FileText,
    permissions: ['pos:receipt:read', 'pos:receipt:create'],
    roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'accountant', 'CASHIER', 'cashier'],
    subItems: [
      { label: 'Create Invoice', href: '/finance?tab=invoices&action=new', icon: FilePlus },
      {
        label: 'Billing Note',
        href: '/finance?tab=billing',
        icon: FileText,
        featureFlag: 'billingNote'
      },
      { label: 'Record Payment', href: '/finance?tab=receipts', icon: CreditCard },
      { label: 'Outstanding / Aging', href: '/finance?tab=aging', icon: Clock }
    ]
  },

  // 6. Assets
  {
    id: 'assets',
    label: 'Assets',
    icon: Briefcase,
    permissions: ['inventory:item:read'],
    roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN'],
    subItems: [
      { label: 'Asset Register', href: '/assets', icon: Briefcase },
      { label: 'Register / Dispose', href: '/assets?tab=dispose', icon: Trash2 },
      { label: 'Asset Borrow', href: '/assets?tab=borrow', icon: Repeat }
    ]
  },

  // 7. Reports
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    permissions: ['report:read', 'report:export', 'audit:log:read'],
    roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT', 'accountant', 'WAREHOUSE', 'warehouse'],
    subItems: [
      { label: 'Sales', href: '/history?tab=sales', icon: TrendingUp },
      { label: 'Stock Balance', href: '/history?tab=movements', icon: Layers },
      { label: 'Issue & Receipt', href: '/history?tab=issue-receipt', icon: ArrowLeftRight },
      { label: 'Receivables', href: '/history?tab=receivables', icon: DollarSign },
      {
        label: 'Audit Log',
        href: '/history?tab=audit',
        icon: Activity,
        permissions: ['audit:log:read'],
        roles: ['super_admin', 'legacy_admin', 'admin', 'SUPER_ADMIN', 'ADMIN']
      }
    ]
  },

  // 8. Settings
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    permissions: ['iam:user:read', 'iam:settings:configure'],
    roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN'],
    subGroups: [
      {
        id: 'people_access',
        label: 'People & Access',
        items: [
          {
            label: 'Users & Roles',
            href: '/settings?tab=users',
            icon: ShieldCheck,
            permissions: ['iam:user:read'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          },
          {
            label: 'Departments / Classes',
            href: '/settings?tab=departments',
            icon: School,
            permissions: ['iam:settings:configure'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          }
        ]
      },
      {
        id: 'master_data',
        label: 'Master Data',
        items: [
          {
            label: 'Categories & Units',
            href: '/settings?tab=master',
            icon: Database,
            permissions: ['iam:settings:configure'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          },
          {
            label: 'Storage Locations',
            href: '/settings?tab=locations',
            icon: MapPin,
            permissions: ['iam:settings:configure'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          },
          {
            label: 'Units of Measure',
            href: '/settings?tab=uom',
            icon: Hash,
            permissions: ['iam:settings:configure'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          }
        ]
      },
      {
        id: 'commerce',
        label: 'Commerce',
        items: [
          {
            label: 'Pricing & Promotions',
            href: '/settings?tab=pricing',
            icon: Tag,
            permissions: ['iam:settings:configure'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          },
          {
            label: 'Approval Workflow',
            href: '/settings?tab=workflow',
            icon: GitPullRequest,
            permissions: ['iam:settings:configure'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          },
          {
            label: 'Document Numbering',
            href: '/settings?tab=numbering',
            icon: Hash,
            permissions: ['iam:settings:configure'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          }
        ]
      },
      {
        id: 'system',
        label: 'System',
        items: [
          {
            label: 'Notifications',
            href: '/settings?tab=notifications',
            icon: Bell,
            permissions: ['iam:settings:configure'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          },
          {
            label: 'Backup & Restore',
            href: '/settings?tab=backup',
            icon: HardDriveDownload,
            permissions: ['iam:settings:configure'],
            roles: ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN']
          }
        ]
      }
    ]
  }
];
