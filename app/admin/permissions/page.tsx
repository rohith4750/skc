"use client"

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  FaShieldAlt, FaUsers, FaUserTag, FaSave, FaSpinner,
  FaInfoCircle, FaSearch, FaLock, FaUserShield
} from 'react-icons/fa'

interface RolePermission {
  id: string
  role: string
  permissions: string[]
}

interface User {
  id: string
  username: string
  email: string | null
  role: string
  permissions: string[]
  isActive: boolean
}

interface RouteItem {
  name: string
  route: string
  section: string
}

const ACTIONS = [
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Write' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
  { key: 'export', label: 'Export' }
]

const SECTIONS: Record<string, string> = {
  overview: "Overview",
  directory: "Directory",
  order_entry: "Order Operations",
  order_views: "Reports & Planning",
  logistics: "Transport & Delivery",
  financial: "Financial Management",
  inventory: "Stock & Inventory",
  system: "System Administration",
  profile: "My Account"
}

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [routes, setRoutes] = useState<RouteItem[]>([])

  // Selected Role & User state
  const [selectedRole, setSelectedRole] = useState<string>('admin')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/permissions')
      if (!res.ok) throw new Error('Failed to fetch permissions data')
      const data = await res.json()
      setRolePermissions(data.rolePermissions || [])
      setUsers(data.users || [])
      setRoutes(data.routes || [])
      if (data.users && data.users.length > 0) {
        setSelectedUser(data.users[0])
      }
    } catch (err: any) {
      toast.error(err.message || 'Error fetching permissions')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = (role: string, route: string, action: string) => {
    const permKey = `${route}:${action}`
    setRolePermissions(prev =>
      prev.map(rp => {
        if (rp.role === role) {
          const exists = rp.permissions.includes(permKey)
          const newPerms = exists
            ? rp.permissions.filter(p => p !== permKey)
            : [...rp.permissions, permKey]
          return { ...rp, permissions: newPerms }
        }
        return rp
      })
    )
  }

  const saveRolePermissions = async (role: string) => {
    const rp = rolePermissions.find(r => r.role === role)
    if (!rp) return

    try {
      setSaving(true)
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'role',
          role,
          permissions: rp.permissions
        })
      })

      if (!res.ok) throw new Error('Failed to save role permissions')
      toast.success(`Permissions for role "${role}" saved successfully!`)
    } catch (err: any) {
      toast.error(err.message || 'Error saving role permissions')
    } finally {
      setSaving(false)
    }
  }

  const handleUserToggle = (route: string, action: string) => {
    if (!selectedUser) return
    const permKey = `${route}:${action}`
    const hasPerm = selectedUser.permissions.includes(permKey)
    const newPerms = hasPerm
      ? selectedUser.permissions.filter(p => p !== permKey)
      : [...selectedUser.permissions, permKey]

    setSelectedUser({ ...selectedUser, permissions: newPerms })
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, permissions: newPerms } : u))
  }

  const saveUserPermissions = async () => {
    if (!selectedUser) return

    try {
      setSaving(true)
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          userId: selectedUser.id,
          permissions: selectedUser.permissions
        })
      })

      if (!res.ok) throw new Error('Failed to save user permissions')
      toast.success(`Custom overrides for user "${selectedUser.username}" saved successfully!`)
    } catch (err: any) {
      toast.error(err.message || 'Error saving user permissions')
    } finally {
      setSaving(false)
    }
  }

  // Group routes by section
  const routesBySection = routes.reduce((acc, route) => {
    const section = route.section || 'other'
    if (!acc[section]) acc[section] = []
    acc[section].push(route)
    return acc
  }, {} as Record<string, RouteItem[]>)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-primary-500 text-4xl mb-4" />
        <p className="text-gray-500 font-medium">Loading permissions data...</p>
      </div>
    )
  }

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <FaShieldAlt className="text-primary-500" />
            Access Control List (ACL)
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Configure action-level access control (Read, Write, Update, Delete, Export) per page.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/45 backdrop-blur-xs">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'bg-white text-primary-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaUserTag />
          Role Permissions
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-white text-primary-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaUsers />
          User Specific Overrides
        </button>
      </div>

      {/* Tab 1: Roles Tabular UI */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          {/* Horizontal Role Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Role:</span>
            {['admin', 'transport_admin', 'transport', 'chef', 'supervisor'].map(role => {
              const rp = rolePermissions.find(r => r.role === role)
              const count = rp ? rp.permissions.length : 0
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all capitalize border ${selectedRole === role
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
                    }`}
                >
                  {role.replace('_', ' ')}
                  <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full ${selectedRole === role ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {count} active
                  </span>
                </button>
              )
            })}
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-400 font-bold pr-2">
              <FaLock />
              <span>super_admin has full access always</span>
            </div>
          </div>

          {/* Matrix Table (Full Width) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 capitalize">
                  Permissions Matrix: {selectedRole.replace('_', ' ')}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Configure specific actions permitted for this role.
                </p>
              </div>
              <button
                onClick={() => saveRolePermissions(selectedRole)}
                disabled={saving}
                className="px-5 py-2 bg-primary-600 text-white rounded-xl font-bold text-xs hover:bg-primary-700 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Save Changes
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Page / Route</th>
                    {ACTIONS.map(act => (
                      <th key={act.key} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                        {act.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.keys(SECTIONS).map(sectionKey => {
                    const sectionRoutes = routesBySection[sectionKey] || []
                    if (sectionRoutes.length === 0) return null

                    return (
                      <React.Fragment key={sectionKey}>
                        <tr className="bg-slate-100/60 font-black">
                          <td colSpan={ACTIONS.length + 1} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {SECTIONS[sectionKey]}
                          </td>
                        </tr>
                        {sectionRoutes.map(route => (
                          <tr key={route.route} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-xs text-gray-800">{route.name}</div>
                              <div className="font-mono text-[10px] text-gray-400 mt-0.5">{route.route}</div>
                            </td>
                            {ACTIONS.map(act => {
                              const rp = rolePermissions.find(r => r.role === selectedRole)
                              const isChecked = rp
                                ? (rp.permissions.includes(`${route.route}:${act.key}`) || rp.permissions.includes(route.route))
                                : false
                              return (
                                <td key={act.key} className="p-4 text-center">
                                  <label className="inline-flex items-center justify-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleRoleToggle(selectedRole, route.route, act.key)}
                                      className="w-4.5 h-4.5 rounded text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer accent-primary-600"
                                    />
                                  </label>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Overrides */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Horizontal User Selector Dropdown Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/50">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-2">Select User:</span>
              <select
                value={selectedUser?.id || ''}
                onChange={e => {
                  const u = users.find(usr => usr.id === e.target.value)
                  if (u) setSelectedUser(u)
                }}
                className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            {selectedUser && (
              <div className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                <FaUserShield className="text-primary-500" />
                <span>{selectedUser.permissions.length} active custom overrides</span>
              </div>
            )}
          </div>

          {/* User Overrides Matrix (Full Width) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">
                      Action Overrides: <span className="text-primary-600">{selectedUser.username}</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Configure custom overrides for this user. Enabled checkboxes explicitly grant the action.
                    </p>
                  </div>
                  <button
                    onClick={saveUserPermissions}
                    disabled={saving}
                    className="px-5 py-2 bg-primary-600 text-white rounded-xl font-bold text-xs hover:bg-primary-700 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    Save Overrides
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Page / Route</th>
                        {ACTIONS.map(act => (
                          <th key={act.key} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                            {act.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.keys(SECTIONS).map(sectionKey => {
                        const sectionRoutes = routesBySection[sectionKey] || []
                        if (sectionRoutes.length === 0) return null

                        return (
                          <React.Fragment key={sectionKey}>
                            <tr className="bg-slate-100/60 font-black">
                              <td colSpan={ACTIONS.length + 1} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {SECTIONS[sectionKey]}
                              </td>
                            </tr>
                            {sectionRoutes.map(route => (
                              <tr key={route.route} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-xs text-gray-800">{route.name}</div>
                                  <div className="font-mono text-[10px] text-gray-400 mt-0.5">{route.route}</div>
                                </td>
                                {ACTIONS.map(act => {
                                  const defaultRoleRec = rolePermissions.find(r => r.role === selectedUser.role)
                                  const hasByRole = selectedUser.role === 'super_admin' || 
                                    (defaultRoleRec ? (defaultRoleRec.permissions.includes(`${route.route}:${act.key}`) || defaultRoleRec.permissions.includes(route.route)) : false)
                                  const hasByUser = selectedUser.permissions.includes(`${route.route}:${act.key}`) || 
                                    selectedUser.permissions.includes(route.route)
                                  const isChecked = hasByRole || hasByUser
                                  return (
                                    <td key={act.key} className="p-4 text-center">
                                      <label className="inline-flex items-center justify-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleUserToggle(route.route, act.key)}
                                          className="w-4.5 h-4.5 rounded text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer accent-primary-600"
                                        />
                                      </label>
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400 h-full">
                <FaInfoCircle className="text-3xl mb-2" />
                <p className="font-bold text-sm">Select a user to configure custom overrides.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
