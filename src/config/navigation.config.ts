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
  Boxes,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  ClipboardCheck as StockCountIcon,
  FileSpreadsheet,
  FileText,
  FilePlus,
  CreditCard,
  Briefcase,
  Trash2,
  Repeat,
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
  AlertTriangle
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

const adminRoles = ['super_admin', 'legacy_admin', 'SUPER_ADMIN', 'ADMIN'];
const stockManagerRoles = [...adminRoles, 'admin', 'INVENTORY_MANAGER', 'WAREHOUSE', 'warehouse'];
const posRoles = [...adminRoles, 'admin', 'INVENTORY_MANAGER', 'CASHIER', 'cashier'];
const financeRoles = [...adminRoles, 'admin', 'ACCOUNTANT', 'accountant', 'CASHIER', 'cashier'];
const reportRoles = [...adminRoles, 'admin', 'INVENTORY_MANAGER', 'ACCOUNTANT', 'accountant', 'WAREHOUSE', 'warehouse'];
const settingsAccess = {
  permissions: ['iam:settings:configure'],
  roles: adminRoles
};

export const navigationConfig: NavigationGroup[] = [
  {
    id: 'overview_personal',
    label: 'Overview & Personal',
    icon: LayoutDashboard,
    subGroups: [
      {
        id: 'overview',
        label: 'Overview',
        items: [
          { label: 'Dashboard', href: '/', icon: LayoutDashboard },
          {
            label: 'Approvals', href: '/?tab=approvals', icon: ClipboardCheck,
            permissions: ['inventory:stock:issue', 'inventory:stock:restock', 'iam:user:read'],
            roles: [...adminRoles, 'INVENTORY_MANAGER']
          },
          { label: 'Inbox', href: '/?tab=inbox', icon: Bell },
          { label: 'Calendar', href: '/?tab=calendar', icon: Calendar, featureFlag: 'calendar' }
        ]
      },
      {
        id: 'personal_space',
        label: 'Personal',
        items: [
          { label: 'My Items & Requests', href: '/my-space', icon: UserCheck },
          { label: 'New Request', href: '/my-space?tab=new-request', icon: PlusCircle },
          { label: 'My Requests', href: '/my-space?tab=my-requests', icon: ClipboardList },
          { label: 'My Receipts & Invoices', href: '/my-space?tab=my-receipts', icon: Receipt },
          { label: 'Report an Issue', href: '/my-space?tab=report-issue', icon: AlertCircle },
          { label: 'Search Stock', href: '/my-space?tab=search-stock', icon: Search }
        ]
      }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory Management',
    icon: Boxes,
    subGroups: [
      {
        id: 'inventory_catalog',
        label: 'Catalog & Control',
        items: [
          { label: 'Inventory Catalog', href: '/inventory?tab=all', icon: Boxes, permissions: ['inventory:item:read'], roles: stockManagerRoles },
          { label: 'Reorder Points', href: '/inventory?tab=low', icon: AlertTriangle, permissions: ['inventory:item:read'], roles: stockManagerRoles },
          { label: 'Storage Locations', href: '/inventory?tab=locations', icon: MapPin, featureFlag: 'multiStore', permissions: ['inventory:item:read'], roles: stockManagerRoles }
        ]
      },
      {
        id: 'stock_operations',
        label: 'Stock Operations',
        items: [
          { label: 'Stock In / Restock', href: '/operations/restock', icon: PackagePlus, permissions: ['inventory:stock:restock'], roles: stockManagerRoles },
          { label: 'Requisition / Stock Issue', href: '/operations/issue', icon: PackageMinus, permissions: ['inventory:stock:issue'], roles: stockManagerRoles },
          { label: 'Stock Adjustment', href: '/operations/deduct', icon: Trash2, permissions: ['inventory:stock:adjust'], roles: stockManagerRoles },
          { label: 'Borrow & Return', href: '/inventory?tab=borrow', icon: ArrowLeftRight, permissions: ['inventory:stock:issue'], roles: stockManagerRoles },
          { label: 'Stock Count', href: '/inventory?tab=stock-count', icon: StockCountIcon, permissions: ['inventory:item:read'], roles: stockManagerRoles },
          { label: 'Purchase Requests', href: '/inventory?tab=pr', icon: FileSpreadsheet, permissions: ['inventory:item:read'], roles: stockManagerRoles },
          { label: 'Stock Transfer', href: '/inventory?tab=transfer', icon: Truck, featureFlag: 'multiStore', permissions: ['inventory:item:read'], roles: stockManagerRoles }
        ]
      }
    ]
  },
  {
    id: 'assets',
    label: 'Fixed Assets',
    icon: Briefcase,
    subItems: [
      { label: 'Asset Management', href: '/assets', icon: Briefcase, permissions: ['inventory:item:read'], roles: adminRoles },
      { label: 'Borrow & Return', href: '/assets?tab=borrow', icon: Repeat, permissions: ['inventory:item:read'], roles: adminRoles },
      { label: 'Maintenance & Disposal', href: '/assets?tab=dispose', icon: Trash2, permissions: ['inventory:item:read'], roles: adminRoles }
    ]
  },
  {
    id: 'pos_finance',
    label: 'Sales & Finance',
    icon: Store,
    subGroups: [
      {
        id: 'point_of_sale',
        label: 'Point of Sale (POS)',
        items: [
          { label: 'Sell', href: '/pos', icon: ShoppingCart, permissions: ['pos:receipt:read', 'pos:receipt:create'], roles: posRoles },
          { label: 'Shift Management', href: '/pos?tab=shift', icon: Clock, permissions: ['pos:receipt:read', 'pos:receipt:create'], roles: posRoles },
          { label: "Today's Sales", href: '/pos?tab=today', icon: CalendarDays, permissions: ['pos:receipt:read', 'pos:receipt:create'], roles: posRoles },
          { label: 'Returns / Exchanges', href: '/pos?tab=return', icon: RotateCcw, permissions: ['pos:receipt:void', 'pos:receipt:refund'], roles: [...adminRoles, 'admin', 'CASHIER', 'cashier'] }
        ]
      },
      {
        id: 'finance_documents',
        label: 'Billing & Finance',
        items: [
          { label: 'Invoices', href: '/finance?tab=invoices', icon: FilePlus, permissions: ['pos:receipt:read', 'pos:receipt:create'], roles: financeRoles },
          { label: 'Billing Notes', href: '/finance?tab=billing', icon: FileText, featureFlag: 'billingNote', permissions: ['pos:receipt:read'], roles: financeRoles },
          { label: 'Receipts', href: '/finance?tab=receipts', icon: CreditCard, permissions: ['pos:receipt:read'], roles: financeRoles },
          { label: 'Outstanding / Aging', href: '/finance?tab=aging', icon: Clock, permissions: ['pos:receipt:read'], roles: financeRoles }
        ]
      },
      {
        id: 'contacts',
        label: 'Customers & Contacts',
        items: [
          { label: 'Customers & Contacts', href: '/customers', icon: UserCheck, permissions: ['customer:read'], roles: financeRoles }
        ]
      }
    ]
  },
  {
    id: 'system_reports',
    label: 'System & Administration',
    icon: Settings,
    subGroups: [
      {
        id: 'reports',
        label: 'Reports & Audit Logs',
        items: [
          { label: 'Stock Movements', href: '/history?tab=movements', icon: Layers, permissions: ['report:read', 'report:export'], roles: reportRoles },
          { label: 'Sales / Finance Summary', href: '/history?tab=sales', icon: TrendingUp, permissions: ['report:read', 'report:export'], roles: reportRoles },
          { label: 'Receipts & Issues', href: '/history?tab=issue-receipt', icon: ArrowLeftRight, permissions: ['report:read', 'report:export'], roles: reportRoles },
          { label: 'Receivables & Budgets', href: '/history?tab=receivables', icon: DollarSign, permissions: ['report:read', 'report:export'], roles: reportRoles },
          { label: 'System Audit Logs', href: '/history?tab=audit', icon: Activity, permissions: ['audit:log:read'], roles: adminRoles }
        ]
      },
      {
        id: 'settings',
        label: 'System Settings',
        items: [
          { label: 'Users & Roles', href: '/settings?tab=users', icon: ShieldCheck, permissions: ['iam:user:read'], roles: adminRoles },
          { label: 'Departments / Classes', href: '/settings?tab=departments', icon: School, ...settingsAccess },
          { label: 'Categories & Units', href: '/settings?tab=master', icon: Database, ...settingsAccess },
          { label: 'Storage Locations', href: '/settings?tab=locations', icon: MapPin, ...settingsAccess },
          { label: 'Units of Measure', href: '/settings?tab=uom', icon: Hash, ...settingsAccess },
          { label: 'Pricing & Promotions', href: '/settings?tab=pricing', icon: Tag, ...settingsAccess },
          { label: 'Approval Workflow', href: '/settings?tab=workflow', icon: GitPullRequest, ...settingsAccess },
          { label: 'Document Numbering', href: '/settings?tab=numbering', icon: Hash, ...settingsAccess },
          { label: 'Notifications', href: '/settings?tab=notifications', icon: Bell, ...settingsAccess },
          { label: 'Backup & Restore', href: '/settings?tab=backup', icon: HardDriveDownload, ...settingsAccess }
        ]
      }
    ]
  }
];
