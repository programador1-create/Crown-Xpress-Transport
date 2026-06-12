import { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, Save, X, Search, Shield, Eye, UserCheck, Crown, CheckCircle2, AlertTriangle } from 'lucide-react'
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
  const [showInactive, setShowInactive] = useState(false)
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
  const [successModal, setSuccessModal] = useState({ show: false, message: '', isEdit: false })
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', data: null })
  const [saving, setSaving] = useState(false)

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
    const matchesActive = showInactive || emp.active !== false
    return matchesSearch && matchesRole && matchesActive
  })

  const handleLocationChange = (locationId) => {
    const loc = LOCATIONS.find(l => l.id === parseInt(locationId))
    setFormData(prev => ({
      ...prev,
      location_id: parseInt(locationId),
      location_name: loc?.name || ''
    }))
  }

  const handleSubmitClick = (e) => {
    e.preventDefault()
    // Show confirmation modal before saving
    setConfirmModal({
      show: true,
      type: editingId ? 'update' : 'create',
      data: formData
    })
  }

  const handleSubmit = async () => {
    setSaving(true)
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
      const isEdit = !!editingId
      resetForm()
      setSuccessModal({
        show: true,
        message: language === 'es' 
          ? (isEdit ? '¡Usuario actualizado exitosamente!' : '¡Usuario creado exitosamente!') 
          : (isEdit ? 'User updated successfully!' : 'User created successfully!'),
        isEdit
      })
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
      setConfirmModal({ show: false, type: '', data: null })
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

  const handleDeleteClick = (emp) => {
    setConfirmModal({
      show: true,
      type: 'delete',
      data: emp
    })
  }

  const handleDelete = async (id) => {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/employees?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadEmployees()
      setSuccessModal({
        show: true,
        message: language === 'es' ? '¡Usuario desactivado!' : 'User deactivated!',
        isEdit: false
      })
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
      setConfirmModal({ show: false, type: '', data: null })
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-300 text-crown-navy focus:ring-crown-navy/20"
            />
            {language === 'es' ? 'Mostrar inactivos' : 'Show inactive'}
          </label>
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
                <div key={emp.id} className={`px-4 py-3 flex items-center justify-between ${emp.active === false ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${roleInfo.color} ${emp.active === false ? 'opacity-50' : ''} flex items-center justify-center`}>
                      <RoleIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{emp.full_name}</div>
                      <div className="text-xs text-slate-500">
                        @{emp.username} · {roleInfo.label[language]} · {emp.location_name || '—'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        🔑 {emp.password_hash || '—'}
                      </div>
                      {emp.active === false && (
                        <div className="text-xs text-rose-500 font-medium">
                          {language === 'es' ? 'INACTIVO' : 'INACTIVE'}
                        </div>
                      )}
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
                      onClick={() => handleDeleteClick(emp)}
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
            <form onSubmit={handleSubmitClick} className="p-4 space-y-4">
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

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-scale-up">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                confirmModal.type === 'delete' ? 'bg-rose-100' : 'bg-amber-100'
              }`}>
                <AlertTriangle className={`w-8 h-8 ${
                  confirmModal.type === 'delete' ? 'text-rose-500' : 'text-amber-500'
                }`} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {confirmModal.type === 'delete' 
                  ? (language === 'es' ? '¿Desactivar Usuario?' : 'Deactivate User?')
                  : confirmModal.type === 'update'
                    ? (language === 'es' ? '¿Guardar Cambios?' : 'Save Changes?')
                    : (language === 'es' ? '¿Crear Usuario?' : 'Create User?')}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {confirmModal.type === 'delete' 
                  ? (language === 'es' 
                      ? `¿Estás seguro de desactivar a "${confirmModal.data?.full_name}"?` 
                      : `Are you sure you want to deactivate "${confirmModal.data?.full_name}"?`)
                  : confirmModal.type === 'update'
                    ? (language === 'es' 
                        ? `¿Guardar los cambios para "${formData.full_name}"?${formData.password ? ' (Se actualizará la contraseña)' : ''}` 
                        : `Save changes for "${formData.full_name}"?${formData.password ? ' (Password will be updated)' : ''}`)
                    : (language === 'es' 
                        ? `¿Crear el usuario "${formData.full_name}" con usuario "${formData.username}"?` 
                        : `Create user "${formData.full_name}" with username "${formData.username}"?`)}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, type: '', data: null })}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.type === 'delete') {
                      handleDelete(confirmModal.data.id)
                    } else {
                      handleSubmit()
                    }
                  }}
                  disabled={saving}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                    confirmModal.type === 'delete' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-crown-navy hover:bg-crown-navy-dark'
                  }`}
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {confirmModal.type === 'delete' ? <Trash2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {confirmModal.type === 'delete' 
                        ? (language === 'es' ? 'Desactivar' : 'Deactivate')
                        : (language === 'es' ? 'Confirmar' : 'Confirm')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.show && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-scale-up">
            <div className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {language === 'es' ? '¡Éxito!' : 'Success!'}
              </h3>
              <p className="text-slate-500 mb-6">
                {successModal.message}
              </p>
              <button
                onClick={() => setSuccessModal({ show: false, message: '', isEdit: false })}
                className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
              >
                {language === 'es' ? 'Aceptar' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
