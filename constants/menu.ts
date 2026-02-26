import type { UserRole } from '@/lib/auth-storage'

export type PermissionKey =
  | 'ALL'
  | 'SUPER_ADMIN_ONLY'
  | 'ADMIN_AND_SUPER_ADMIN'
  | 'AUTHENTICATED'

export type MenuSection =
  | 'core'
  | 'financial'
  | 'tax'
  | 'inventory'
  | 'system'
  | 'profile'

export const MENU_SECTION_ORDER: MenuSection[] = [
  'core',
  'financial',
  'tax',
  'inventory',
  'system',
  'profile',
]

export const MENU_SECTION_TITLES: Record<MenuSection, string> = {
  core: 'Order Management',
  financial: 'Financial Management',
  tax: 'Tax Management',
  inventory: 'Stock & Inventory',
  system: 'System Administration',
  profile: 'My Account',
}

export type IconKey =
  | 'dashboard'
  | 'alerts'
  | 'customers'
  | 'menu'
  | 'orders'
  | 'history'
  | 'planner'
  | 'bills'
  | 'expenses'
  | 'store'
  | 'outstanding'
  | 'workforce'
  | 'analytics'
  | 'tax'
  | 'stock'
  | 'inventory'
  | 'users'
  | 'audit'
  | 'enquiries'
  | 'profile'

export interface RouteConfigItem {
  name: string
  route: string
  file: string
  icon?: IconKey
  permissions: PermissionKey
  showInSideMenu: boolean
  section?: MenuSection
  roles?: UserRole[]
  hideForRoles?: UserRole[]
}

export const menuData: RouteConfigItem[] = [
  { name: 'Dashboard', route: '/', file: 'app/page.tsx', icon: 'dashboard', permissions: 'AUTHENTICATED', showInSideMenu: true, section: 'core' },
  { name: 'Alerts', route: '/alerts', file: 'app/alerts/page.tsx', icon: 'alerts', permissions: 'AUTHENTICATED', showInSideMenu: true, section: 'core' },
  { name: 'Customers', route: '/customers', file: 'app/customers/page.tsx', icon: 'customers', permissions: 'AUTHENTICATED', showInSideMenu: true, section: 'core' },
  { name: 'Menu', route: '/menu', file: 'app/menu/page.tsx', icon: 'menu', permissions: 'AUTHENTICATED', showInSideMenu: true, section: 'core' },
  { name: 'Order Hub', route: '/orders/center', file: 'app/orders/center/page.tsx', icon: 'orders', permissions: 'AUTHENTICATED', showInSideMenu: true, section: 'core' },
  { name: 'Past Events', route: '/orders/history', file: 'app/orders/history/page.tsx', icon: 'history', permissions: 'AUTHENTICATED', showInSideMenu: true, section: 'core' },
  { name: 'Event Planner', route: '/orders/overview', file: 'app/orders/overview/page.tsx', icon: 'planner', permissions: 'AUTHENTICATED', showInSideMenu: true, section: 'core' },
  { name: 'Bills', route: '/bills', file: 'app/bills/page.tsx', icon: 'bills', permissions: 'AUTHENTICATED', showInSideMenu: true, section: 'core' },

  { name: 'Expenses', route: '/expenses', file: 'app/expenses/page.tsx', icon: 'expenses', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: true, section: 'financial', roles: ['super_admin'] },
  { name: 'Store Calculator', route: '/expenses/store-calculator', file: 'app/expenses/store-calculator/page.tsx', icon: 'store', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: true, section: 'financial', roles: ['super_admin'] },
  { name: 'Outstanding', route: '/workforce/outstanding', file: 'app/workforce/outstanding/page.tsx', icon: 'outstanding', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: true, section: 'financial', roles: ['super_admin'] },
  { name: 'Workforce', route: '/workforce', file: 'app/workforce/page.tsx', icon: 'workforce', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: true, section: 'financial', roles: ['super_admin'] },
  { name: 'Analytics', route: '/analytics', file: 'app/analytics/page.tsx', icon: 'analytics', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: true, section: 'financial', roles: ['super_admin'] },

  { name: 'Income Tax Return', route: '/tax', file: 'app/tax/page.tsx', icon: 'tax', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: true, section: 'tax', roles: ['super_admin'] },

  { name: 'Stock', route: '/stock', file: 'app/stock/page.tsx', icon: 'stock', permissions: 'ADMIN_AND_SUPER_ADMIN', showInSideMenu: true, section: 'inventory', hideForRoles: ['admin'] },
  { name: 'Inventory', route: '/inventory', file: 'app/inventory/page.tsx', icon: 'inventory', permissions: 'ADMIN_AND_SUPER_ADMIN', showInSideMenu: true, section: 'inventory', hideForRoles: ['admin'] },

  { name: 'User Management', route: '/users', file: 'app/users/page.tsx', icon: 'users', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: true, section: 'system', roles: ['super_admin'] },
  { name: 'Login Audit Logs', route: '/audit-logs', file: 'app/audit-logs/page.tsx', icon: 'audit', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: true, section: 'system', roles: ['super_admin'] },
  { name: 'Enquiries', route: '/enquiries', file: 'app/enquiries/page.tsx', icon: 'enquiries', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: true, section: 'system', roles: ['super_admin'] },

  { name: 'Profile', route: '/profile', file: 'app/profile/page.tsx', icon: 'profile', permissions: 'AUTHENTICATED', showInSideMenu: true, section: 'profile' },
]

export const loginRoutes: RouteConfigItem[] = [
  { name: 'Login', route: '/login', file: 'app/login/page.tsx', permissions: 'ALL', showInSideMenu: false },
  { name: 'Reset Password', route: '/reset-password', file: 'app/reset-password/page.tsx', permissions: 'ALL', showInSideMenu: false },
]

const hiddenAdminRoutes: RouteConfigItem[] = [
  { name: 'Create Customer', route: '/customers/create', file: 'app/customers/create/page.tsx', permissions: 'AUTHENTICATED', showInSideMenu: false },
  { name: 'Create Expense', route: '/expenses/create', file: 'app/expenses/create/page.tsx', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: false, roles: ['super_admin'] },
  { name: 'Create Inventory Item', route: '/inventory/create', file: 'app/inventory/create/page.tsx', permissions: 'ADMIN_AND_SUPER_ADMIN', showInSideMenu: false },
  { name: 'Create Stock Item', route: '/stock/create', file: 'app/stock/create/page.tsx', permissions: 'ADMIN_AND_SUPER_ADMIN', showInSideMenu: false },
  { name: 'Stock Transaction', route: '/stock/transaction', file: 'app/stock/transaction/page.tsx', permissions: 'ADMIN_AND_SUPER_ADMIN', showInSideMenu: false },
  { name: 'Create Workforce', route: '/workforce/create', file: 'app/workforce/create/page.tsx', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: false, roles: ['super_admin'] },
  { name: 'Supervisors', route: '/supervisors', file: 'app/supervisors/page.tsx', permissions: 'SUPER_ADMIN_ONLY', showInSideMenu: false, roles: ['super_admin'] },
  { name: 'Create Order', route: '/orders', file: 'app/orders/page.tsx', permissions: 'AUTHENTICATED', showInSideMenu: false },
  { name: 'Order Summary', route: '/orders/summary', file: 'app/orders/summary/page.tsx', permissions: 'AUTHENTICATED', showInSideMenu: false },
  { name: 'Order Summary Detail', route: '/orders/summary/:id', file: 'app/orders/summary/[id]/page.tsx', permissions: 'AUTHENTICATED', showInSideMenu: false },
  { name: 'Order Financials', route: '/orders/financial', file: 'app/orders/financial/page.tsx', permissions: 'AUTHENTICATED', showInSideMenu: false },
  { name: 'Order Financial Detail', route: '/orders/financial/:id', file: 'app/orders/financial/[id]/page.tsx', permissions: 'AUTHENTICATED', showInSideMenu: false },
]

export const adminRoutes: RouteConfigItem[] = [...menuData, ...hiddenAdminRoutes]

export const ALL_ROUTE_CONFIG: RouteConfigItem[] = [...loginRoutes, ...adminRoutes]

const normalizePath = (path: string): string => {
  if (!path) return '/'
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1)
  }
  return normalized
}

export function matchesRoute(pathname: string, routePattern: string): boolean {
  const path = normalizePath(pathname)
  const pattern = normalizePath(routePattern)
  if (path === pattern) return true

  const pathSegments = path.split('/').filter(Boolean)
  const patternSegments = pattern.split('/').filter(Boolean)
  if (pathSegments.length !== patternSegments.length) return false

  for (let i = 0; i < patternSegments.length; i += 1) {
    const target = patternSegments[i]
    if (target.startsWith(':')) continue
    if (target !== pathSegments[i]) return false
  }

  return true
}

export function canAccessRoute(
  route: RouteConfigItem,
  userRole: UserRole | null,
  userPermissions: string[] = []
): boolean {
  if (route.hideForRoles?.includes(userRole as UserRole)) return false

  if (route.roles && route.roles.length > 0 && (!userRole || !route.roles.includes(userRole))) {
    return false
  }

  if (route.permissions === 'ALL') return true
  if (route.permissions === 'AUTHENTICATED') return !!userRole
  if (route.permissions === 'SUPER_ADMIN_ONLY') return userRole === 'super_admin'
  if (route.permissions === 'ADMIN_AND_SUPER_ADMIN') return userRole === 'admin' || userRole === 'super_admin'

  if (userRole === 'super_admin') return true
  return userPermissions.includes(route.permissions)
}

export function getRouteConfig(pathname: string): RouteConfigItem | undefined {
  const path = normalizePath(pathname)

  const exactMatch = ALL_ROUTE_CONFIG.find((item) => normalizePath(item.route) === path)
  if (exactMatch) return exactMatch

  return ALL_ROUTE_CONFIG.find((item) => matchesRoute(path, item.route))
}

export function getRouteTitle(pathname: string): string {
  const found = getRouteConfig(pathname)
  if (found) return found.name

  if (pathname === '/') return 'Dashboard'
  const firstSegment = pathname.replace('/', '').split('/')[0]
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1).replace(/-/g, ' ')
}

export function getSidebarSections(
  userRole: UserRole | null,
  userPermissions: string[] = []
): Array<{ key: MenuSection; title: string; items: RouteConfigItem[] }> {
  const visibleItems = menuData.filter(
    (item) =>
      item.showInSideMenu &&
      !!item.section &&
      !!item.icon &&
      canAccessRoute(item, userRole, userPermissions)
  )

  return MENU_SECTION_ORDER.map((key) => ({
    key,
    title: MENU_SECTION_TITLES[key],
    items: visibleItems.filter((item) => item.section === key),
  })).filter((section) => section.items.length > 0)
}
