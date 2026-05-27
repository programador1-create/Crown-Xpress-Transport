import { useState, useEffect } from 'react'
import { Users, Search, Plus, Edit2, Trash2, Check, X, Shield, UserCheck, Eye, MapPin } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const ROLES = [
  { id: 'guard', label: { es: 'Guardia', en: 'Guard' }, color: 'bg-blue-100 text-blue-700' },
  { id: 'inspector', label: { es: 'Inspector', en: 'Inspector' }, color: 'bg-purple-100 text-purple-700' },
  { id: 'auditor', label: { es: 'Auditor', en: 'Auditor' }, color: 'bg-amber-100 text-amber-700' },
  { id: 'admin', label: { es: 'Administrador', en: 'Administrator' }, color: 'bg-rose-100 text-rose-700' },
]

const LOCATIONS = [
  { id: 1, name: 'Yard A - Laredo' },
  { id: 2, name: 'Yard B - El Paso' },
  { id: 3, name: 'Yard C - Dallas' },
  { id: 4, name: 'Yard D - Houston' },
  { id: 5, name: 'Yard E - San Antonio' },
]

export default function UserManagement() {
  const { language } = useLanguage()
  const { user: currentUser } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'guard',
    location_id: 1,
    location_name: 'Yard A - Laredo',
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    loadEmployees()
  }, [filterRole, filterLocation, showInactive])

  async function loadEmployees() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterRole) params.append('role', filterRole)
      if (filterLocation) params.append('location_id', filterLocation)
      if (!showInactive) params.append('active', 'true')
      
      const res = await fetch(`${API_BASE}/employees?${params}`)
      const data = await res.json()
      setEmployees(data.data || [])
    } catch (err) {
      console.error('Error loading employees:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(emp =>
    !search ||
    emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.username?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setShowAddModal(false)
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role: 'guard',
        location_id: 1,
        location_name: 'Yard A - Laredo',
      })
      loadEmployees()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpdate = async (id, updates) => {
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setEditingId(null)
      loadEmployees()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(language === 'es' ? '¿Desactivar este usuario?' : 'Deactivate this user?')) return
    
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      loadEmployees()
    } catch (err) {
      alert(err.message)
    }
  }

  const getRoleInfo = (roleId) => ROLES.find(r => r.id === roleId) || ROLES[0]

  if (currentUser?.role !== 'admin') {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <Shield className="w-12 h-12 mx-auto mb-3 text-rose-400" />
          <p className="text-slate-600 dark:text-slate-400">
            {language === 'es' ? 'Acceso restringido a administradores' : 'Admin access only'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-crown-gold" />
            <h2 className="font-bold tracking-wide uppercase text-sm">
              {language === 'es' ? 'Gestión de Usuarios' : 'User Management'}
            </h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-gold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {language === 'es' ? 'Nuevo Usuario' : 'New User'}
          </button>
        </div>

        <div className="card-body space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'es' ? 'Buscar usuario...' : 'Search user...'}
                className="input pl-10"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input w-auto"
            >
              <option value="">{language === 'es' ? 'Todos los roles' : 'All roles'}</option>
              {ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label[language]}</option>
              ))}
            </select>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="input w-auto"
            >
              <option value="">{language === 'es' ? 'Todas las ubicaciones' : 'All locations'}</option>
              {LOCATIONS.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              {language === 'es' ? 'Mostrar inactivos' : 'Show inactive'}
            </label>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-crown-navy/30 border-t-crown-navy rounded-full mx-auto" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{language === 'es' ? 'No se encontraron usuarios' : 'No users found'}</p>
              <p className="text-sm mt-2">
                {language === 'es' 
                  ? 'Crea la tabla de empleados en la base de datos primero'
                  : 'Create the employees table in the database first'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                      {language === 'es' ? 'Usuario' : 'User'}
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                      {language === 'es' ? 'Nombre' : 'Name'}
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                      {language === 'es' ? 'Rol' : 'Role'}
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                      {language === 'es' ? 'Ubicación' : 'Location'}
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                      {language === 'es' ? 'Estado' : 'Status'}
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-slate-600 dark:text-slate-400">
                      {language === 'es' ? 'Acciones' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => {
                    const roleInfo = getRoleInfo(emp.role)
                    return (
                      <tr key={emp.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-2 font-mono text-xs">{emp.username}</td>
                        <td className="py-3 px-2 font-medium">{emp.full_name}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleInfo.color}`}>
                            {roleInfo.label[language]}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {emp.location_name || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {emp.active ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Check className="w-4 h-4" />
                              {language === 'es' ? 'Activo' : 'Active'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400">
                              <X className="w-4 h-4" />
                              {language === 'es' ? 'Inactivo' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingId(emp.id)}
                              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                              title={language === 'es' ? 'Editar' : 'Edit'}
                            >
                              <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            {emp.active && emp.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDelete(emp.id)}
                                className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30"
                                title={language === 'es' ? 'Desactivar' : 'Deactivate'}
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                              </button>
                            )}
                            {!emp.active && (
                              <button
                                onClick={() => handleUpdate(emp.id, { active: true })}
                                className="p-1.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                title={language === 'es' ? 'Reactivar' : 'Reactivate'}
                              >
                                <Check className="w-4 h-4 text-emerald-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {language === 'es' ? 'Nuevo Usuario' : 'New User'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'es' ? 'Usuario' : 'Username'}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  placeholder="usuario01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'es' ? 'Contraseña' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'es' ? 'Nombre Completo' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'es' ? 'Rol' : 'Role'}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.label[language]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'es' ? 'Ubicación' : 'Location'}
                </label>
                <select
                  value={formData.location_id}
                  onChange={(e) => {
                    const loc = LOCATIONS.find(l => l.id === parseInt(e.target.value))
                    setFormData({ 
                      ...formData, 
                      location_id: parseInt(e.target.value),
                      location_name: loc?.name || ''
                    })
                  }}
                  className="input"
                >
                  {LOCATIONS.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleAdd}
                disabled={!formData.username || !formData.password || !formData.full_name}
                className="btn-gold disabled:opacity-50"
              >
                {language === 'es' ? 'Crear Usuario' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingId && (
        <EditUserModal
          employee={employees.find(e => e.id === editingId)}
          onClose={() => setEditingId(null)}
          onSave={(updates) => handleUpdate(editingId, updates)}
          language={language}
        />
      )}
    </div>
  )
}

function EditUserModal({ employee, onClose, onSave, language }) {
  const [formData, setFormData] = useState({
    username: employee?.username || '',
    password: '',
    full_name: employee?.full_name || '',
    role: employee?.role || 'guard',
    location_id: employee?.location_id || 1,
    location_name: employee?.location_name || 'Yard A - Laredo',
  })

  const handleSave = () => {
    const updates = { ...formData }
    if (!updates.password) delete updates.password
    onSave(updates)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {language === 'es' ? 'Editar Usuario' : 'Edit User'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'es' ? 'Usuario' : 'Username'}
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'es' ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'New Password (leave empty to keep)'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'es' ? 'Nombre Completo' : 'Full Name'}
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'es' ? 'Rol' : 'Role'}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              {ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label[language]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'es' ? 'Ubicación' : 'Location'}
            </label>
            <select
              value={formData.location_id}
              onChange={(e) => {
                const loc = LOCATIONS.find(l => l.id === parseInt(e.target.value))
                setFormData({ 
                  ...formData, 
                  location_id: parseInt(e.target.value),
                  location_name: loc?.name || ''
                })
              }}
              className="input"
            >
              {LOCATIONS.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button onClick={handleSave} className="btn-gold">
            {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
