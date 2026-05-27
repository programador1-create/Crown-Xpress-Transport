import { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, Save, X, Search, Shield, Eye, UserCheck, Crown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const LOCATIONS = [
  { id: 1, name: 'Yard A - Laredo' },
  { id: 2, name: 'Yard B - El Paso' },
  { id: 3, name: 'Yard C - Dallas' },
  { id: 4, name: 'Yard D - Houston' },
]

const ROLES = [
  { id: 'guard', label: { es: 'Guardia', en: 'Guard' }, icon: Shield, color: 'bg-blue-500' },
  { id: 'inspector', label: { es: 'Inspector', en: 'Inspector' }, icon: Eye, color: 'bg-emerald-500' },
  { id: 'auditor', label: { es: 'Auditor', en: 'Auditor' }, icon: UserCheck, color: 'bg-purple-500' },
  { id: 'admin', label: { es: 'Administrador', en: 'Admin' }, icon: Crown, color: 'bg-amber-500' },
]

export default function UserManagement() {
  const { language } = useLanguage()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'guard',
    location_id: 1,
    location_name: 'Yard A - Laredo',
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  async function loadEmployees() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/employees`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEmployees(data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !search || 
      emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.username?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = !filterRole || emp.role === filterRole
    return matchesSearch && matchesRole && emp.active !== false
  })

  const handleLocationChange = (locationId) => {
    const loc = LOCATIONS.find(l => l.id === parseInt(locationId))
    setFormData(prev => ({
      ...prev,
      location_id: parseInt(locationId),
      location_name: loc?.name || ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingId ? 'PUT' : 'POST'
      const body = editingId ? { ...formData, id: editingId } : formData

      const res = await fetch(`${API_BASE}/employees`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      await loadEmployees()
      resetForm()
      alert(language === 'es' 
        ? (editingId ? 'Usuario actualizado' : 'Usuario creado') 
        : (editingId ? 'User updated' : 'User created'))
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleEdit = (emp) => {
    setFormData({
      username: emp.username,
      password: '',
      full_name: emp.full_name,
      role: emp.role,
      location_id: emp.location_id || 1,
      location_name: emp.location_name || '',
    })
    setEditingId(emp.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(language === 'es' ? '¿Desactivar este usuario?' : 'Deactivate this user?')) return
    try {
      const res = await fetch(`${API_BASE}/employees?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadEmployees()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'guard',
      location_id: 1,
      location_name: 'Yard A - Laredo',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const getRoleInfo = (roleId) => ROLES.find(r => r.id === roleId) || ROLES[0]

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-crown-navy/30 border-t-crown-navy rounded-full mx-auto mb-3" />
          <p className="text-slate-500">{language === 'es' ? 'Cargando usuarios...' : 'Loading users...'}</p>
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
            onClick={() => { resetForm(); setShowForm(true) }}
            className="btn-gold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {language === 'es' ? 'Nuevo Usuario' : 'New User'}
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'es' ? 'Buscar usuario...' : 'Search user...'}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
          >
            <option value="">{language === 'es' ? 'Todos los roles' : 'All roles'}</option>
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.label[language]}</option>
            ))}
          </select>
        </div>

        {/* Users list */}
        <div className="divide-y divide-slate-100">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              {language === 'es' ? 'No hay usuarios' : 'No users found'}
            </div>
          ) : (
            filteredEmployees.map(emp => {
              const roleInfo = getRoleInfo(emp.role)
              const RoleIcon = roleInfo.icon
              return (
                <div key={emp.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${roleInfo.color} flex items-center justify-center`}>
                      <RoleIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{emp.full_name}</div>
                      <div className="text-xs text-slate-500">
                        @{emp.username} · {roleInfo.label[language]} · {emp.location_name || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
                      title={language === 'es' ? 'Editar' : 'Edit'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-2 rounded-lg hover:bg-rose-100 text-rose-500"
                      title={language === 'es' ? 'Desactivar' : 'Deactivate'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">
                {editingId 
                  ? (language === 'es' ? 'Editar Usuario' : 'Edit User')
                  : (language === 'es' ? 'Nuevo Usuario' : 'New User')}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {language === 'es' ? 'Nombre Completo' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {language === 'es' ? 'Usuario' : 'Username'} *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {language === 'es' ? 'Contraseña' : 'Password'} {editingId ? '' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                  required={!editingId}
                  placeholder={editingId ? (language === 'es' ? 'Dejar vacío para no cambiar' : 'Leave empty to keep current') : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {language === 'es' ? 'Rol' : 'Role'} *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.label[language]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {language === 'es' ? 'Ubicación' : 'Location'}
                </label>
                <select
                  value={formData.location_id}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crown-navy/20"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-crown-navy text-white rounded-lg hover:bg-crown-navy-dark flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {language === 'es' ? 'Guardar' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
