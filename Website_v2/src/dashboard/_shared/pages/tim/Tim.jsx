import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/logger/supabaseLogger';
import { useAuth } from '@/lib/hooks/useAuth';
import { isSuperadmin, isOwner as checkIsOwner } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscriptionUtils';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter 
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Trash2, X, Plus, UserPlus, Users, Clock, Copy, Pencil, Save, AlertCircle, Menu, Shield } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { TimSkeleton } from '@/components/ui/BrokerPageSkeleton'
import { BROKER_SEMBAKO_TIM_CONFIG } from './timConfigs'

export default function Tim({ hideMobileHeader = false, roleConfig }) {
  const cfg = roleConfig || BROKER_SEMBAKO_TIM_CONFIG
  const ROLE_BADGE_MAP = cfg.roleBadgeMap
  const accent = cfg.accent || '#0F172A'
  const cardRadius = cfg.cardRadius || '18px'
  const cardBg = cfg.cardBg || '#FFFFFF'
  const inputBg = cfg.inputBg || '#F8FAFC'
  const _inviteRoles = cfg.inviteRoles || []
  const _defaultInviteRole = cfg.defaultInviteRole || 'admin'
  const _inviteCodeTitle = cfg.inviteCodeTitle || 'Kode Undangan Tim ERP'
  const { profile, tenant: authTenant, refetchProfile } = useAuth();
  const sub = getSubscriptionStatus(authTenant);
  const queryClient = useQueryClient();
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    phone: '',
    location: ''
  });
  
  const isOwner = checkIsOwner(profile) || isSuperadmin(profile);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { setSidebarOpen } = useOutletContext() || {};

  const tenant = authTenant;
  const loadingTenant = false;

  // Sync form when tenant data loads or edit mode starts
  React.useEffect(() => {
    if (tenant) {
      setProfileForm({
        business_name: tenant.business_name || '',
        phone: tenant.phone || '',
        location: tenant.location || ''
      });
      
      // Auto-edit if name is missing (new user)
      if (!tenant.business_name && isOwner) {
        setIsEditingProfile(true);
      }
    }
  }, [tenant, isOwner]);

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['peternak-team', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const [{ data: profileMembers, error }, { data: membershipMembers }] = await Promise.all([
        supabase.from('profiles').select('*').eq('tenant_id', profile.tenant_id),
        supabase.from('tenant_memberships').select('*').eq('tenant_id', profile.tenant_id),
      ]);
      if (error) throw error;
      const combined = [...(profileMembers || [])];
      const membershipOnly = [];
      for (const m of (membershipMembers || [])) {
        const existing = combined.find(p => p.auth_user_id === m.auth_user_id);
        if (!existing) {
          combined.push(m);
          membershipOnly.push(m.auth_user_id);
        } else if (!existing.full_name && m.full_name) {
          // Profile row exists but has no name — patch from membership
          existing.full_name = m.full_name;
          if (!existing.avatar_url) existing.avatar_url = m.avatar_url;
        }
      }
      // Enrich membership-only members with full_name from their profiles in other tenants
      if (membershipOnly.length > 0) {
        const { data: nameData } = await supabase
          .from('profiles')
          .select('auth_user_id, full_name, avatar_url')
          .in('auth_user_id', membershipOnly);
        for (const m of combined) {
          if (!m.full_name) {
            const np = nameData?.find(n => n.auth_user_id === m.auth_user_id);
            if (np) { m.full_name = np.full_name; m.avatar_url = np.avatar_url; }
          }
        }
      }
      return combined.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    },
    enabled: !!profile?.tenant_id,
  });

  const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['peternak-invites', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const [inviteCode, setInviteCode] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);   // member object
  const [confirmCancel, setConfirmCancel] = useState(null);   // invite object

  // --- MUTATIONS ---
  const inviteMutation = useMutation({
    mutationFn: async (payload) => {
      // Generate kode 6 karakter uppercase alphanumeric
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('team_invitations')
        .insert([{
          tenant_id: profile.tenant_id,
          invited_by: profile.profile_id ?? profile.id,
          token: code,
          role: payload.role,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }])
        .select()
        .single();
        
      if (error) {
        logSupabaseError(error, { table: 'team_invitations', operation: 'insert', component: 'Tim', actionName: 'team.invite.create', tenantId: profile?.tenant_id });
        throw error;
      }
      return { ...data, code };
    },
    onSuccess: (data) => {
      setInviteCode(data.code);
      setShowCode(true);
      toast.success('Kode undangan berhasil dibuat');
      queryClient.invalidateQueries(['peternak-invites']);
    },
    onError: (error) => {
      toast.error('Gagal membuat kode undangan', { description: error.message });
    }
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('tenants')
        .update(payload)
        .eq('id', profile.tenant_id);
      if (error) {
        logSupabaseError(error, { table: 'tenants', operation: 'update', component: 'Tim', actionName: 'team.tenant.update', tenantId: profile?.tenant_id });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Profil bisnis berhasil disimpan');
      refetchProfile();
      setIsEditingProfile(false);
    },
    onError: (error) => {
      toast.error('Gagal menyimpan profil', { description: error.message });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (member) => {
      const authUserId = member.auth_user_id;
      // Remove from tenant_memberships (no RLS, always works)
      const { error: errorMem } = await supabase.from('tenant_memberships')
        .delete()
        .eq('auth_user_id', authUserId)
        .eq('tenant_id', profile.tenant_id);
      
      if (errorMem) {
        logSupabaseError(errorMem, { table: 'tenant_memberships', operation: 'delete', component: 'Tim', actionName: 'team.member.remove', tenantId: profile?.tenant_id });
        throw errorMem;
      }

      // Remove profiles row for this tenant (only if user has multiple tenants)
      const { error: errorProf } = await supabase.from('profiles')
        .delete()
        .eq('auth_user_id', authUserId)
        .eq('tenant_id', profile.tenant_id);
        
      if (errorProf) {
        logSupabaseError(errorProf, { table: 'profiles', operation: 'delete', component: 'Tim', actionName: 'team.member.remove', tenantId: profile?.tenant_id });
        throw errorProf;
      }
    },
    onSuccess: () => {
      toast.success('Anggota berhasil dihapus');
      queryClient.invalidateQueries(['peternak-team']);
    },
    onError: (error) => {
      toast.error('Gagal menghapus anggota', { description: error.message });
    }
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId) => {
      // Set status to expired instead of deleting row completely
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', inviteId)
        .eq('tenant_id', profile.tenant_id);
      if (error) {
        logSupabaseError(error, { table: 'team_invitations', operation: 'update', component: 'Tim', actionName: 'team.invite.cancel', tenantId: profile?.tenant_id });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Undangan dibatalkan');
      queryClient.invalidateQueries(['peternak-invites']);
    },
    onError: (error) => {
      toast.error('Gagal membatalkan undangan', { description: error.message });
    }
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (loadingTenant || loadingMembers) return <TimSkeleton />

  const isStarter = sub.plan === 'starter' && sub.status !== 'trial'
  const _memberLimit = isStarter ? 1 : sub.plan === 'business' ? Infinity : 3

  const handleInviteClick = () => {
    const totalMembers = members.length + invitations.length;
    if (isStarter) {
      toast.error('Fitur Tim tidak tersedia di Starter', { description: 'Upgrade ke Pro untuk mengundang hingga 3 anggota tim.' });
      return;
    }
    if (sub.plan !== 'business' && totalMembers >= 3) {
      toast.error('Kapasitas Tim Penuh', { description: 'Plan Pro dibatasi maksimal 3 anggota. Upgrade ke Business untuk anggota unlimited!' });
      return;
    }
    setIsInviteSheetOpen(true);
  };

  return (
    <div className={cn("max-w-5xl mx-auto", isDesktop ? "p-8 space-y-8 pb-32" : "space-y-5 pb-24")}>
      {/* Mobile sticky header — hidden when embedded inside TimManajemenPage */}
      {!hideMobileHeader && (
        <header className="h-14 px-4 flex items-center gap-3 justify-between sticky top-0 bg-white/90 dark:bg-[#06090F]/80 backdrop-blur-md z-30 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen?.(true)}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
            >
              <Menu size={16} className="text-[#94A3B8]" />
            </button>
            <h1 className="font-display text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Tim & Akses</h1>
          </div>
          {isOwner && (
            <button
              onClick={handleInviteClick}
              className="h-9 px-3 text-[11px] font-black text-white rounded-xl flex items-center gap-1.5 uppercase tracking-widest transition-all active:scale-95"
              style={{ background: accent }}
            >
              <UserPlus size={13} /> Undang
            </button>
          )}
        </header>
      )}

      {/* Desktop Header */}
      {isDesktop && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-tx-1">Tim & Akses</h1>
            <p className="text-tx-3 mt-1 text-sm">
              {members.length} anggota aktif {invitations.length > 0 && `• ${invitations.length} undangan tertunda`}
              {sub.plan !== 'business' && (
                <span className={`ml-2 font-bold ${isStarter ? 'text-red-400' : 'text-amber-500'}`}>
                  {isStarter
                    ? '(Starter: hanya owner)'
                    : `(Kapasitas Plan: ${members.length + invitations.length} / 3)`}
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={handleInviteClick}
            className="text-white font-semibold rounded-xl"
            style={{ background: accent }}
          >
            <UserPlus size={18} className="mr-2" />
            Undang Anggota
          </Button>
        </div>
      )}

      {/* Mobile subtitle */}
      {!isDesktop && (
        <p className="text-tx-3 text-xs px-4 pt-1">
          {members.length} anggota aktif {invitations.length > 0 && `• ${invitations.length} undangan tertunda`}
          {sub.plan !== 'business' && (
            <span className={`ml-2 font-bold ${isStarter ? 'text-red-400' : 'text-amber-500'}`}>
              {isStarter ? '(Starter: hanya owner)' : `(${members.length + invitations.length}/3)`}
            </span>
          )}
        </p>
      )}

      {isStarter && (
        <div className={cn("flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20", isDesktop ? "" : "mx-4")}>
          <div className="flex items-center gap-2.5">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-[12px] font-bold text-red-400">
              Plan Starter hanya untuk 1 akun (owner). Upgrade ke Pro untuk mengundang tim.
            </p>
          </div>
          <Link to="/upgrade" className="shrink-0 text-[10px] font-black text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors whitespace-nowrap">
            Upgrade
          </Link>
        </div>
      )}

      <div className={cn(isDesktop ? "" : "px-4")}>
      {!isOwner && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-500 text-sm">
          Anda masuk sebagai <strong>{ROLE_BADGE_MAP[profile?.role]?.label || profile?.role}</strong>. Hanya owner yang dapat mengelola undangan dan akses.
        </div>
      )}

      {/* Section: Profil Bisnis */}
      {isOwner && !tenant?.business_name && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-amber-500 text-sm font-medium">
            Lengkapi profil bisnis kamu agar semua fitur dapat digunakan.
          </p>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-tx-2 flex items-center gap-2">
            <Badge variant="outline" className="bg-em-500/10 text-em-400 border-em-500/20 p-1 rounded-md">
              <Users size={16} />
            </Badge>
            Profil Bisnis
          </h2>
          {isOwner && !isEditingProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingProfile(true)}
              className={cn("text-tx-3 hover:text-tx-1 hover:bg-white/5 rounded-lg px-2", isDesktop ? "h-8" : "h-10")}
            >
              <Pencil size={14} className="mr-2" />
              Edit Profil
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          {loadingTenant ? (
            <div className="py-8 flex justify-center text-muted-foreground"><Loader2 className="animate-spin" /></div>
          ) : isEditingProfile ? (
            <div className="p-4 md:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Nama Bisnis</label>
                  <Input
                    value={profileForm.business_name}
                    onChange={(e) => setProfileForm({...profileForm, business_name: e.target.value})}
                    placeholder="Contoh: Toko Berkah Mandiri"
                    className="h-10 rounded-xl text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-amber-500/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">No HP Bisnis</label>
                  <PhoneInput
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    placeholder="0812..."
                    className="h-10 rounded-xl text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-amber-500/40"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Lokasi / Kota</label>
                <Input
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                  placeholder="Contoh: Boyolali, Jawa Tengah"
                  className="h-10 rounded-xl text-sm bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-amber-500/40"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={() => updateTenantMutation.mutate(profileForm)}
                  disabled={updateTenantMutation.isPending || !profileForm.business_name}
                  className="text-white font-semibold h-9 px-5 rounded-xl text-sm"
                  style={{ background: accent }}
                >
                  {updateTenantMutation.isPending ? <Loader2 size={15} className="animate-spin mr-1.5" /> : <Save size={15} className="mr-1.5" />}
                  Simpan
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditingProfile(false);
                    if (tenant) setProfileForm({ business_name: tenant.business_name || '', phone: tenant.phone || '', location: tenant.location || '' });
                  }}
                  disabled={updateTenantMutation.isPending}
                  className="text-muted-foreground hover:text-foreground h-9 px-4 rounded-xl text-sm"
                >
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {[
                { label: 'Nama Bisnis', value: tenant?.business_name },
                { label: 'No HP',       value: tenant?.phone },
                { label: 'Lokasi',      value: tenant?.location },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value || <span className="text-muted-foreground/50 font-normal">—</span>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section: Pemilik Bisnis */}
      {(() => {
        const ownerMember = members.find(m => m.role === 'owner')
        if (!ownerMember) return null
        return (
          <section className="space-y-4">
            <h2 className="font-display font-semibold text-lg text-tx-2 flex items-center gap-2">
              <Shield size={18} className="text-em-400" />
              Pemilik Bisnis
            </h2>
            <div className="bg-bg-2 border border-border-def rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-bg-3 border border-border-def flex items-center justify-center font-display font-bold text-tx-2 text-sm flex-shrink-0">
                    {getInitials(ownerMember.full_name || ownerMember.email)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-tx-1">{ownerMember.full_name || 'User Baru'}</span>
                    <span className="text-sm text-tx-3">{ownerMember.email}</span>
                  </div>
                </div>
                <Badge variant="outline" className={ROLE_BADGE_MAP['owner']?.class || ''}>
                  {ROLE_BADGE_MAP['owner']?.label || 'Owner'}
                </Badge>
              </div>
            </div>
          </section>
        )
      })()}

      {/* Section: Anggota Aktif */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-tx-2 flex items-center gap-2">
          <Users size={18} className="text-em-400" />
          Anggota Aktif
        </h2>

        <div className="bg-bg-2 border border-border-def rounded-2xl overflow-hidden shadow-sm">
          {loadingMembers ? (
            <div className="p-12 flex justify-center text-tx-3"><Loader2 className="animate-spin" /></div>
          ) : members.filter(m => m.role !== 'owner').length === 0 ? (
            <div className="p-8 text-center text-tx-3 italic rounded-2xl">Belum ada anggota lain.</div>
          ) : (
            <div className="divide-y divide-border-sub">
              {members.filter(m => m.role !== 'owner').map(member => (
                <div key={member.id} className="p-4 md:px-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-bg-3 border border-border-def flex items-center justify-center font-display font-bold text-tx-2 text-sm flex-shrink-0">
                      {getInitials(member.full_name || member.email)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-tx-1">{member.full_name || 'User Baru'}</span>
                      <span className="text-sm text-tx-3">{member.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={ROLE_BADGE_MAP[member.role]?.class || 'bg-gray-500/10 text-gray-400'}>
                      {ROLE_BADGE_MAP[member.role]?.label || member.role}
                    </Badge>
                    {isOwner && member.id !== profile.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-tx-3 hover:text-red hover:bg-red/10 rounded-xl transition-colors"
                        onClick={() => setConfirmRemove(member)}
                        disabled={removeMemberMutation.isPending}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section: Undangan Tertunda */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-tx-2 flex items-center gap-2">
          <Clock size={18} className="text-gold" />
          Undangan Tertunda
          {invitations.length > 0 && (
            <span className="text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 ml-1">
              {invitations.length} slot
            </span>
          )}
        </h2>

        <div className="space-y-2">
          {loadingInvitations ? (
            <div className="p-12 flex justify-center text-tx-3 bg-bg-2 border border-border-def rounded-2xl">
              <Loader2 className="animate-spin" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="p-6 text-center text-tx-3 text-sm bg-bg-2 border border-dashed border-white/8 rounded-2xl">
              Belum ada undangan aktif.
            </div>
          ) : (
            invitations.map(invite => {
              const daysLeft = differenceInDays(new Date(invite.expires_at), new Date());
              const isExpiringSoon = daysLeft <= 2;
              const roleInfo = ROLE_BADGE_MAP[invite.role];

              return (
                <div
                  key={invite.id}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] transition-colors"
                >
                  {/* Ghost avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#1A2535] border-2 border-dashed border-amber-500/30 flex items-center justify-center">
                      <UserPlus size={15} className="text-amber-500/60" />
                    </div>
                    {/* Pulse dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#06090F] animate-pulse" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white/60 italic">Menunggu pendaftaran…</span>
                      <Badge variant="outline" className={cn('text-[10px] py-0', roleInfo?.class ?? 'bg-gray-500/10 text-gray-400')}>
                        {roleInfo?.label ?? invite.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => { navigator.clipboard.writeText(invite.token); toast.success('Kode disalin') }}
                        className="flex items-center gap-1.5 group"
                        title="Salin kode undangan"
                      >
                        <span className="font-mono text-xs font-black tracking-[0.2em] text-amber-400 group-hover:text-amber-300 transition-colors">
                          {invite.token}
                        </span>
                        <Copy size={11} className="text-[#4B6478] group-hover:text-amber-400 transition-colors" />
                      </button>
                      <span className="text-[#4B6478] text-[10px]">·</span>
                      <span className={cn('text-[10px] font-medium', isExpiringSoon ? 'text-red-400' : 'text-[#4B6478]')}>
                        {daysLeft > 0 ? `sisa ${daysLeft} hari` : 'berakhir hari ini'}
                      </span>
                    </div>
                  </div>

                  {/* Cancel */}
                  {isOwner && (
                    <button
                      onClick={() => setConfirmCancel(invite)}
                      disabled={cancelInviteMutation.isPending}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[#4B6478] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Batalkan undangan"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      </div>

      {/* Confirm: hapus anggota */}
      <AlertDialog open={!!confirmRemove} onOpenChange={v => !v && setConfirmRemove(null)}>
        <AlertDialogContent className="bg-white dark:bg-[#0C1319] border border-slate-200 dark:border-white/8 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white">Hapus Anggota?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#4B6478]">
              <span className="font-bold text-white/70">{confirmRemove?.full_name || confirmRemove?.email}</span> akan dihapus dari tim dan kehilangan akses ke bisnis ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/8 text-slate-300 hover:bg-white/10 rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500/90 hover:bg-red-500 text-white rounded-xl"
              onClick={() => { removeMemberMutation.mutate(confirmRemove); setConfirmRemove(null) }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: batalkan undangan */}
      <AlertDialog open={!!confirmCancel} onOpenChange={v => !v && setConfirmCancel(null)}>
        <AlertDialogContent className="bg-white dark:bg-[#0C1319] border border-slate-200 dark:border-white/8 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white">Batalkan Undangan?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#4B6478]">
              Kode <span className="font-mono font-black text-amber-400">{confirmCancel?.token}</span> akan dinonaktifkan dan tidak bisa digunakan lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/8 text-slate-300 hover:bg-white/10 rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500/90 hover:bg-red-500 text-white rounded-xl"
              onClick={() => { cancelInviteMutation.mutate(confirmCancel.id); setConfirmCancel(null) }}
            >
              Batalkan Undangan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InviteSheet
        isOpen={isInviteSheetOpen}
        onClose={() => {
          setIsInviteSheetOpen(false);
          setShowCode(false);
          setInviteCode(null);
        }}
        onSubmit={(data) => inviteMutation.mutate(data)}
        isPending={inviteMutation.isPending}
        showCode={showCode}
        inviteCode={inviteCode}
        roleConfig={roleConfig}
      />

    </div>
  );
}

function InviteSheet({ isOpen, onClose, onSubmit, isPending, showCode, inviteCode, roleConfig }) {
  const cfg = roleConfig || BROKER_SEMBAKO_TIM_CONFIG
  const accent = cfg.accent || '#0F172A'
  const inviteRoles = cfg.inviteRoles || []
  const defaultInviteRole = cfg.defaultInviteRole || 'admin'
  const _inviteCodeTitle = cfg.inviteCodeTitle || 'Kode Undangan Tim ERP'
  const [role, setRole] = useState(defaultInviteRole);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ role });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Kode disalin');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <SheetContent 
        side={isDesktop ? 'right' : 'bottom'} 
        className="bg-white dark:bg-[#0C1319] border-l border-slate-200 dark:border-border/10 flex flex-col"
        style={{
          width: isDesktop ? '520px' : '100%',
          maxWidth: '100vw',
          maxHeight: isDesktop ? '100vh' : '90dvh',
          padding: 0,
          borderRadius: isDesktop ? '0' : '24px 24px 0 0',
        }}
      >
        <SheetHeader className={cn("text-left pb-0", isDesktop ? "p-8" : "p-5")}>
          <SheetTitle className="font-display text-xl font-bold text-tx-1">Undang Anggota</SheetTitle>
          <SheetDescription className="text-tx-3 text-sm">
            {showCode
              ? "Kode berhasil dibuat. Bagikan ke anggota yang ingin diundang."
              : "Generate kode undangan untuk anggota baru bergabung ke bisnis Anda."}
          </SheetDescription>
        </SheetHeader>

        <div className={cn("flex-1 flex flex-col gap-6 pt-4", isDesktop ? "p-8" : "p-5")}>
          {!showCode ? (
            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-tx-3 uppercase tracking-wider">Level Akses (Role) <span className="text-red">*</span></Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-full bg-bg-2 border-border-def h-12 rounded-xl text-tx-1 focus-visible:ring-1 focus-visible:ring-em-400">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-bg-1 border border-border-def rounded-xl shadow-xl">
                    {inviteRoles.map(r => (
                      <SelectItem key={r.value} value={r.value} className="focus:bg-bg-2 cursor-pointer py-3 rounded-lg mx-1 my-0.5">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-tx-1">{r.label}</span>
                          <span className="text-[11px] text-tx-3">{r.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-auto pt-6 border-t border-border-sub">
                <Button
                  type="submit"
                  className={cn("w-full text-white font-bold rounded-xl transition-all", isDesktop ? "h-12 text-[15px]" : "h-11 text-[14px]")}
                  style={{ background: accent }}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />}
                  {isPending ? "Generating..." : "Generate Kode Undangan"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="w-full bg-slate-50 dark:bg-[#0C1319] border border-[#10B981]/30 rounded-2xl p-8 text-center space-y-6 shadow-xl shadow-emerald-500/5">
                <h3 className="text-tx-3 text-xs font-bold uppercase tracking-[0.2em]">Kode Undangan Tim</h3>
                
                <div className="font-display text-4xl font-black text-[#10B981] tracking-[0.4em] py-6 bg-[#10B981]/5 rounded-2xl border border-[#10B981]/10">
                  {inviteCode}
                </div>

                <div className="space-y-1">
                  <p className="text-[#4B6478] text-xs font-medium">Berlaku 7 hari · Hanya 1x pakai</p>
                </div>

                <Button
                  onClick={copyToClipboard}
                  className={cn("w-full text-white font-bold rounded-xl transition-all shadow-lg", isDesktop ? "h-12" : "h-11")}
                  style={{ background: accent }}
                >
                  <Copy size={16} className="mr-2" />
                  Salin Kode
                </Button>
              </div>

              <div className="space-y-4 px-4 text-center">
                <p className="text-[#94A3B8] text-sm leading-relaxed">
                  Bagikan kode ini via <strong>WhatsApp atau chat</strong> ke anggota yang ingin diundang.
                </p>
                <div className="p-3 bg-bg-2 border border-border-sub rounded-xl text-xs text-tx-3 text-left">
                  <p>💡 Calon staff dapat mendaftar sendiri menggunakan kode ini tanpa perlu input data bisnis.</p>
                </div>
              </div>

              <Button 
                variant="ghost" 
                onClick={onClose}
                className="text-tx-3 hover:text-tx-1"
              >
                Selesai
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
