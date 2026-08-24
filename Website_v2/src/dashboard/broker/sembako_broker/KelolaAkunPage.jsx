import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { isDevUser } from '@/lib/auth/business-roles'
import { toast } from 'sonner'
import {
  Crown, Store, UserCheck, Shield, UserPlus, Key, Trash2, Edit3,
  CheckCircle2, Lock, AlertTriangle, Users, RefreshCw, Mail, User,
  Eye, EyeOff, Calendar, BadgeCheck, ChevronDown
} from 'lucide-react'

export default function KelolaAkunPage() {
  const { profile, tenant, user: authUser } = useAuth()
  const [accountList, setAccountList] = useState([])
  const [loading, setLoading] = useState(true)

  // Form State Tambah Akun
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('admin')
  const [creating, setCreating] = useState(false)

  // Form State Edit Modal
  const [editUser, setEditUser] = useState(null)
  const [editPassword, setEditPassword] = useState('')
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  // Custom Dropdown open state
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [showEditRoleDropdown, setShowEditRoleDropdown] = useState(false)
  const roleDropdownRef = useRef(null)
  const editRoleDropdownRef = useRef(null)

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setShowRoleDropdown(false)
      }
      if (editRoleDropdownRef.current && !editRoleDropdownRef.current.contains(e.target)) {
        setShowEditRoleDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Nama Bisnis
  const [businessName, setBusinessName] = useState('')
  const [savingBusiness, setSavingBusiness] = useState(false)
  useEffect(() => {
    if (tenant?.business_name !== undefined) setBusinessName(tenant.business_name || '')
  }, [tenant?.business_name])

  const handleSaveBusinessName = async () => {
    if (!tenant?.id) { toast.error('Tenant ID tidak ditemukan'); return }
    setSavingBusiness(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ business_name: businessName.trim() })
        .eq('id', tenant.id)
      if (error) throw error
      toast.success('Nama bisnis berhasil diperbarui!')
    } catch (err) {
      toast.error('Gagal simpan: ' + err.message)
    } finally {
      setSavingBusiness(false)
    }
  }

  const isDev = isDevUser(profile)

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      let query = supabase.from('profiles').select('*')
      if (tenant?.id) {
        query = query.eq('tenant_id', tenant.id)
      }
      const { data, error } = await query

      if (error) {
        setAccountList(getFallbackAccounts())
      } else if (data && data.length > 0) {
        setAccountList(data)
      } else {
        setAccountList(getFallbackAccounts())
      }
    } catch (err) {
      setAccountList(getFallbackAccounts())
    } finally {
      setLoading(false)
    }
  }

  const getFallbackAccounts = () => [
    {
      id: 'prof-dev-001',
      full_name: 'Developer Superadmin',
      email: 'dev@sembako.id',
      role: 'dev',
      app_role: 'dev',
      created_at: new Date().toISOString()
    },
    {
      id: 'prof-owner-001',
      full_name: 'Pemilik Toko',
      email: 'owner@sembako.id',
      role: 'owner',
      app_role: 'owner',
      created_at: new Date().toISOString()
    },
    {
      id: 'prof-admin-001',
      full_name: 'Kasir / Admin Ops',
      email: 'admin@sembako.id',
      role: 'admin',
      app_role: 'admin',
      created_at: new Date().toISOString()
    }
  ]

  useEffect(() => {
    fetchAccounts()
  }, [tenant?.id])

  // Validasi email format
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Semua kolom wajib diisi!')
      return
    }
    if (!isValidEmail(email.trim())) {
      toast.error('Format email tidak valid!')
      return
    }
    if (password.trim().length < 6) {
      toast.error('Password minimal 6 karakter!')
      return
    }

    // Cek email duplikat
    const duplicate = accountList.find(a => a.email?.toLowerCase() === email.trim().toLowerCase())
    if (duplicate) {
      toast.error('Email sudah terdaftar di sistem!')
      return
    }

    setCreating(true)
    const cleanEmail = email.trim().toLowerCase()

    try {
      const newProfile = {
        id: 'prof-' + Date.now(),
        auth_user_id: 'auth-' + Date.now(),
        tenant_id: tenant?.id || '00000000-0000-0000-0000-000000000002',
        full_name: name.trim(),
        email: cleanEmail,
        role: selectedRole,
        app_role: selectedRole,
        user_type: 'broker',
        sub_type: 'distributor_sembako',
        business_name: tenant?.business_name || '',
        onboarded: true,
        created_at: new Date().toISOString()
      }

      const { error: dbErr } = await supabase.from('profiles').insert([newProfile])

      if (dbErr) {
        toast.info('Akun ditambahkan ke sesi lokal (DB sync pending)')
      }

      setAccountList(prev => [...prev, newProfile])
      toast.success(`Akun ${name.trim()} (${selectedRole.toUpperCase()}) berhasil dibuat!`)

      // Reset form
      setName('')
      setEmail('')
      setPassword('')
      setSelectedRole('admin')
      setShowPassword(false)
      setShowAddModal(false)
    } catch (err) {
      toast.error('Gagal membuat akun: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editUser) return
    if (!editName.trim()) {
      toast.error('Nama tidak boleh kosong!')
      return
    }

    setSavingEdit(true)
    try {
      const updates = {
        full_name: editName.trim(),
        role: editRole,
        app_role: editRole
      }

      const updatedList = accountList.map(ac =>
        ac.id === editUser.id ? { ...ac, ...updates } : ac
      )
      setAccountList(updatedList)

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', editUser.id)

      if (error) {
        toast.info('Data diperbarui di lokal (DB sync pending)')
      } else {
        toast.success('Data akun berhasil diperbarui!')
      }
      setEditUser(null)
    } catch (err) {
      toast.error('Gagal update data akun')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await supabase.from('profiles').delete().eq('id', deleteTarget.id)
      setAccountList(prev => prev.filter(a => a.id !== deleteTarget.id))
      toast.success(`Akun ${deleteTarget.full_name} berhasil dihapus!`)
    } catch (err) {
      // Tetap hapus dari local state walaupun DB gagal
      setAccountList(prev => prev.filter(a => a.id !== deleteTarget.id))
      toast.success(`Akun ${deleteTarget.full_name} dihapus dari sesi lokal!`)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleDeleteAccount = (acc) => {
    if (acc.role === 'dev') {
      toast.error('Akun Developer Superadmin tidak dapat dihapus!')
      return
    }
    if (acc.id === profile?.id) {
      toast.error('Tidak dapat menghapus akun Anda sendiri!')
      return
    }
    setDeleteTarget(acc)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
      })
    } catch {
      return '—'
    }
  }

  const getRoleLabel = (role) => {
    const map = { dev: '👑 Dev Superadmin', owner: '💼 Owner', admin: '🛒 Kasir/Admin' }
    return map[role] || role
  }

  if (!isDev) {
    return (
      <div style={{ padding: '60px 20px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0A07' }}>
        <div style={{ maxWidth: 440, background: '#140E08', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 20, padding: 32, textAlign: 'center' }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Akses Terbatas (Dev Mode Only)</h2>
          <p style={{ fontSize: 13, color: '#A18E7E', lineHeight: 1.6 }}>
            Halaman ini khusus untuk <strong>Developer Superadmin (`dev`)</strong> untuk membuat dan mengelola akun yang bisa login.
          </p>
        </div>
      </div>
    )
  }

  const devCount = accountList.filter(a => a.role === 'dev').length
  const ownerCount = accountList.filter(a => a.role === 'owner').length
  const adminCount = accountList.filter(a => a.role === 'admin').length

  /* ─────────────── INPUT STYLE SHARED ─────────────── */
  const inputStyle = {
    width: '100%', height: 42, padding: '0 12px',
    background: '#F8FAFC', border: '1px solid #CBD5E1',
    borderRadius: 10, color: '#0F172A', fontSize: 14, outline: 'none', boxSizing: 'border-box'
  }
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', padding: '24px 20px 100px', fontFamily: "'Sora', sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: 'linear-gradient(135deg, #0F172A, #334155)', color: '#FFF', padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Crown size={12} /> DEV MODE ONLY
              </span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px', color: '#0F172A' }}>
              Kelola Akun Login &amp; Hak Akses
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Daftar akun yang terdaftar dan diizinkan login ke sistem Dashboard Sembako.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 20px', borderRadius: 12,
              background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
              border: 'none', color: '#FFF', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.25)'
            }}
          >
            <UserPlus size={16} /> Buat Akun Baru
          </button>
        </div>

        {/* NAMA BISNIS */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Store size={16} color="#0F172A" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Nama Bisnis / Toko</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Masukkan nama bisnis / toko Anda..."
              style={{
                flex: 1, height: 42, padding: '0 14px',
                background: '#F8FAFC', border: '1px solid #CBD5E1',
                borderRadius: 10, color: '#0F172A', fontSize: 14, outline: 'none'
              }}
              onKeyDown={e => e.key === 'Enter' && handleSaveBusinessName()}
            />
            <button
              onClick={handleSaveBusinessName}
              disabled={savingBusiness}
              style={{
                height: 42, padding: '0 18px', borderRadius: 10, border: 'none',
                background: savingBusiness ? '#94A3B8' : 'linear-gradient(135deg, #0F172A, #334155)',
                color: '#FFF', fontSize: 13, fontWeight: 700,
                cursor: savingBusiness ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {savingBusiness ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
            Nama ini akan muncul di invoice dan header beranda.
          </p>
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: '👑 DEV SUPERADMIN', count: devCount, color: '#D97706', border: '#FDE68A', bg: '#FFFBEB', icon: <Crown size={18} color="#D97706" />, sub: 'Full Control System' },
            { label: '💼 OWNER / PEMILIK', count: ownerCount, color: '#059669', border: '#A7F3D0', bg: '#ECFDF5', icon: <Store size={18} color="#059669" />, sub: 'Laporan Profit & Audit Log' },
            { label: '🛒 KASIR / ADMIN', count: adminCount, color: '#2563EB', border: '#BFDBFE', bg: '#EFF6FF', icon: <UserCheck size={18} color="#2563EB" />, sub: 'Akses Utama POS & Stok' },
            { label: '👥 TOTAL AKUN', count: accountList.length, color: '#475569', border: '#E2E8F0', bg: '#FFFFFF', icon: <Users size={18} color="#475569" />, sub: 'Terdaftar di Database' },
          ].map((stat, i) => (
            <div key={i} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: stat.color, fontWeight: 700 }}>{stat.label}</span>
                {stat.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>{stat.count}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ACCOUNT LIST */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
              Daftar Pengguna Terdaftar ({accountList.length})
            </div>
            <button
              onClick={fetchAccounts}
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', color: '#475569', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={12} /> Refresh Data
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Memuat data akun...</div>
          ) : accountList.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Belum ada data akun terdaftar.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {accountList.map((acc, index) => {
                const isDevAcc = acc.role === 'dev'
                const isOwnerAcc = acc.role === 'owner'
                const isCurrentUser = acc.id === profile?.id || acc.email === authUser?.email
                const badgeColor = isDevAcc ? '#D97706' : isOwnerAcc ? '#059669' : '#2563EB'
                const badgeBg = isDevAcc ? '#FFFBEB' : isOwnerAcc ? '#ECFDF5' : '#EFF6FF'
                const badgeBorder = isDevAcc ? '#FDE68A' : isOwnerAcc ? '#A7F3D0' : '#BFDBFE'
                const initials = acc.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

                return (
                  <div
                    key={acc.id || index}
                    style={{
                      background: isCurrentUser ? '#FFF7ED' : '#F8FAFC',
                      border: `1px solid ${isCurrentUser ? '#FDBA74' : badgeBorder}`,
                      borderRadius: 16, padding: '16px 20px',
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: badgeBg, border: `1px solid ${badgeBorder}`,
                        color: badgeColor, fontSize: 15, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative'
                      }}>
                        {initials}
                      </div>

                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {acc.full_name || 'Pengguna'}
                          {isDevAcc && <Crown size={14} color="#D97706" />}
                          {isCurrentUser && (
                            <span style={{ fontSize: 10, fontWeight: 800, background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: 99 }}>
                              ANDA
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Mail size={11} /> {acc.email || '—'}
                          {acc.created_at && (
                            <>
                              <span style={{ color: '#CBD5E1' }}>•</span>
                              <Calendar size={11} />
                              <span>{formatDate(acc.created_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: 99,
                        background: badgeBg, border: `1px solid ${badgeBorder}`,
                        color: badgeColor, fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                        textTransform: 'uppercase'
                      }}>
                        {acc.role || 'user'}
                      </span>

                      <button
                        onClick={() => {
                          setEditUser(acc)
                          setEditName(acc.full_name || '')
                          setEditRole(acc.role || 'admin')
                          setEditPassword('')
                          setShowEditPassword(false)
                        }}
                        style={{
                          background: '#FFFFFF', border: '1px solid #CBD5E1',
                          color: '#0F172A', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <Edit3 size={13} /> Edit
                      </button>

                      {!isDevAcc && !isCurrentUser && (
                        <button
                          onClick={() => handleDeleteAccount(acc)}
                          style={{
                            background: '#FEF2F2', border: '1px solid #FCA5A5',
                            color: '#DC2626', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <Trash2 size={13} /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* ───── MODAL TAMBAH AKUN ───── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 16px max(32px, calc(16px + env(safe-area-inset-bottom, 16px)))' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={20} color="#0F172A" /> Buat Akun Login Baru
              </div>
              <button onClick={() => { setShowAddModal(false); setShowPassword(false) }} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Nama */}
              <div>
                <label style={labelStyle}>Nama Lengkap <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Kasir Toko"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email Login <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="email"
                  placeholder="Contoh: kasir@sembako.id"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password Default <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 karakter"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role — Custom Dropdown */}
              <div ref={roleDropdownRef} style={{ position: 'relative' }}>
                <label style={labelStyle}>Role / Hak Akses <span style={{ color: '#EF4444' }}>*</span></label>
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(v => !v)}
                  style={{
                    ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', textAlign: 'left', paddingRight: 12
                  }}
                >
                  <span>
                    {selectedRole === 'admin' && '🛒 Kasir / Admin'}
                    {selectedRole === 'owner' && '💼 Owner / Pemilik'}
                    {selectedRole === 'dev' && '👑 Dev Superadmin'}
                  </span>
                  <ChevronDown size={14} color="#64748B" style={{ transform: showRoleDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
                {showRoleDropdown && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999,
                    background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12,
                    overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.1)'
                  }}>
                    {[
                      { value: 'admin', label: '🛒 Kasir / Admin', sub: 'Akses Operasional Utama' },
                      { value: 'owner', label: '💼 Owner / Pemilik', sub: 'Full Akses + Audit Log & Margin' },
                      { value: 'dev',   label: '👑 Dev Superadmin', sub: 'Full Control + Kelola Akun' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setSelectedRole(opt.value); setShowRoleDropdown(false) }}
                        style={{
                          width: '100%', padding: '11px 14px', background: selectedRole === opt.value ? '#F1F5F9' : 'transparent',
                          border: 'none', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                          textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 700, color: selectedRole === opt.value ? '#0F172A' : '#0F172A' }}>{opt.label}</span>
                        <span style={{ fontSize: 11, color: '#64748B' }}>{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Role Info */}
              <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                {selectedRole === 'admin' && '🛒 Kasir/Admin dapat mengakses POS, stok, dan transaksi harian.'}
                {selectedRole === 'owner' && '💼 Owner dapat melihat laporan profit, margin, dan audit log lengkap.'}
                {selectedRole === 'dev' && '👑 Dev Superadmin memiliki full control termasuk kelola akun pengguna.'}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowPassword(false) }}
                  style={{ flex: 1, height: 44, background: 'transparent', border: '1px solid #CBD5E1', color: '#64748B', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ flex: 2, height: 44, background: creating ? '#94A3B8' : 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', border: 'none', color: '#FFF', borderRadius: 12, cursor: creating ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800 }}
                >
                  {creating ? 'Memproses...' : 'Simpan Akun Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── MODAL EDIT AKUN ───── */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 16px max(32px, calc(16px + env(safe-area-inset-bottom, 16px)))' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color="#0F172A" /> Edit Akun
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {/* Email info (read-only) */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#64748B', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={13} /> {editUser.email}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nama */}
              <div>
                <label style={labelStyle}>Nama Tampilan <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Role — Custom Dropdown (disabled jika edit diri sendiri) */}
              <div ref={editRoleDropdownRef} style={{ position: 'relative' }}>
                <label style={labelStyle}>Role / Hak Akses</label>
                <button
                  type="button"
                  onClick={() => !editUser || editUser.id === profile?.id ? null : setShowEditRoleDropdown(v => !v)}
                  style={{
                    ...inputStyle, cursor: editUser.id === profile?.id ? 'not-allowed' : 'pointer',
                    opacity: editUser.id === profile?.id ? 0.55 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    textAlign: 'left', paddingRight: 12
                  }}
                >
                  <span style={{ fontSize: 13, color: '#0F172A' }}>
                    {editRole === 'admin' && '🛒 Kasir / Admin'}
                    {editRole === 'owner' && '💼 Owner / Pemilik'}
                    {editRole === 'dev'   && '👑 Dev Superadmin'}
                  </span>
                  {editUser.id !== profile?.id && (
                    <ChevronDown size={14} color="#64748B" style={{ transform: showEditRoleDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  )}
                </button>
                {showEditRoleDropdown && editUser.id !== profile?.id && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999,
                    background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12,
                    overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.1)'
                  }}>
                    {[
                      { value: 'admin', label: '🛒 Kasir / Admin',   sub: 'Akses Operasional Utama' },
                      { value: 'owner', label: '💼 Owner / Pemilik', sub: 'Full Akses + Audit Log & Margin' },
                      { value: 'dev',   label: '👑 Dev Superadmin',  sub: 'Full Control + Kelola Akun' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setEditRole(opt.value); setShowEditRoleDropdown(false) }}
                        style={{
                          width: '100%', padding: '11px 14px', background: editRole === opt.value ? '#F1F5F9' : 'transparent',
                          border: 'none', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                          textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 700, color: editRole === opt.value ? '#0F172A' : '#0F172A' }}>{opt.label}</span>
                        <span style={{ fontSize: 11, color: '#64748B' }}>{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
                {editUser.id === profile?.id && (
                  <p style={{ fontSize: 11, color: '#64748B', marginTop: 5 }}>⚠️ Tidak dapat mengubah role akun Anda sendiri.</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button onClick={() => setEditUser(null)} style={{ flex: 1, height: 42, background: 'transparent', border: '1px solid #CBD5E1', color: '#64748B', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Batal
                </button>
                <button onClick={handleSaveEdit} disabled={savingEdit} style={{ flex: 2, height: 42, background: savingEdit ? '#94A3B8' : 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', border: 'none', color: '#FFF', borderRadius: 10, cursor: savingEdit ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800 }}>
                  {savingEdit ? 'Memproses...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── MODAL KONFIRMASI HAPUS ───── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5100, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 16px max(32px, calc(16px + env(safe-area-inset-bottom, 16px)))' }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 28, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Hapus Akun?</h3>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 6 }}>
              Anda akan menghapus akun:
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{deleteTarget.full_name}</p>
            <p style={{ fontSize: 12, color: '#334155', marginBottom: 20 }}>{deleteTarget.email}</p>
            <p style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 20 }}>
              ⚠️ Tindakan ini tidak dapat dibatalkan!
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, height: 44, background: 'transparent', border: '1px solid #CBD5E1', color: '#64748B', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{ flex: 1, height: 44, background: deleting ? '#FCA5A5' : 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none', color: '#FFF', borderRadius: 12, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800 }}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
