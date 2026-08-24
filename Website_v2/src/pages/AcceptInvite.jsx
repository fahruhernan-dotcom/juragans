import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, LogIn, ArrowLeft, ShieldCheck, Mail, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { logError } from '@/lib/logger/errorLogger';
import { logSupabaseError } from '@/lib/logger/supabaseLogger';

import SEO from '@/components/SEO';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState('input'); // 'input', 'choice', 'register', 'login'
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') ?? '');
  const [invitation, setInvitation] = useState(null);

  // Fix Bug 1: confirmation state when existing user is switching tenants
  const [confirmingSwitch, setConfirmingSwitch] = useState(false);
  const [pendingUpdateFn, setPendingUpdateFn] = useState(null);

  // H-2: rate limit lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Detect already-authenticated session (e.g. Google OAuth)
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUser(data.user);
    });
  }, []);

  // Auto-verify if code came pre-filled from onboarding URL param
  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl && codeFromUrl.length === 6) {
      verifyCode(null, codeFromUrl)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fix Bug 3: email match helper ──────────────────────────────────────────
  const checkEmailMatch = () => {
    if (invitation?.email?.trim()) {
      if (formData.email.toLowerCase() !== invitation.email.toLowerCase()) {
        toast.error(
          'Email tidak sesuai dengan undangan. Gunakan email: ' +
          invitation.email.substring(0, 3) + '***'
        );
        return false;
      }
    }
    return true;
  };

  const verifyCode = async (e, overrideCode) => {
    if (e) e.preventDefault();
    const code = overrideCode ?? inviteCode
    if (code.length !== 6) {
      return toast.error('Kode harus 6 karakter');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-invite-code', {
        body: { code: code.trim().toUpperCase() }
      });

      if (error) {
        logError({
          level: 'error',
          source: 'auth',
          component: 'AcceptInvite',
          actionName: 'auth.invite.verify_code',
          error: error,
          metadata: {
            token_length: code?.length,
            status: error.status ?? error?.context?.status,
          }
        });
        const status = error.status ?? error?.context?.status;
        if (status === 429) {
          const retryAfter = data?.retryAfter ?? 1800;
          const retryMinutes = Math.ceil(retryAfter / 60);
          toast.error(`Terlalu banyak percobaan. Coba lagi dalam ${retryMinutes} menit.`);
          setIsLocked(true);
          setLockMessage(`Terlalu banyak percobaan. Tunggu ${retryMinutes} menit.`);
          return;
        }
        toast.error(data?.error ?? 'Kode undangan tidak valid atau sudah kadaluarsa');
        return;
      }

      if (!data?.success || !data?.invitation) {
        toast.error('Kode undangan tidak valid atau sudah kadaluarsa');
        return;
      }

      setInvitation(data.invitation);
      if (data.invitation.email) {
        setFormData(prev => ({ ...prev, email: data.invitation.email }));
      }
      setView('choice');
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'AcceptInvite',
        actionName: 'auth.invite.verify_code',
        error: err,
        metadata: { token_length: code?.length }
      });
      toast.error('Gagal memverifikasi kode');
    } finally {
      setLoading(false);
    }
  };

  // ── Accept invite with already-authenticated account (e.g. Google OAuth) ───
  const handleAcceptWithCurrentAccount = async () => {
    if (!currentUser || !invitation) return;
    setIsSubmitting(true);
    try {
      const { data: existingProfile, error: existProfileError } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('auth_user_id', currentUser.id)
        .maybeSingle();

      if (existProfileError) {
        logSupabaseError(existProfileError, {
          table: 'profiles',
          operation: 'select',
          component: 'AcceptInvite',
          actionName: 'auth.invite.accept_current',
        });
        throw existProfileError;
      }

      // Block only if they already own THIS specific tenant
      if (existingProfile?.role === 'owner' && existingProfile?.tenant_id === invitation.tenant_id) {
        toast.error('Kamu sudah menjadi owner di bisnis ini.');
        return;
      }

      const { data: ownerProfile, error: ownerProfileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('tenant_id', invitation.tenant_id)
        .eq('role', 'owner')
        .limit(1)
        .maybeSingle();

      if (ownerProfileError) {
        logSupabaseError(ownerProfileError, {
          table: 'profiles',
          operation: 'select',
          component: 'AcceptInvite',
          actionName: 'auth.invite.accept_current',
        });
        throw ownerProfileError;
      }

      const userType = ownerProfile?.user_type || 'peternak';

      // 1. Create/Update membership association
      const { error: memberError } = await supabase
        .from('tenant_memberships')
        .upsert({
          tenant_id: invitation.tenant_id,
          auth_user_id: currentUser.id,
          role: invitation.role || 'staff',
          full_name: currentUser.user_metadata?.full_name || '',
        }, { onConflict: 'auth_user_id,tenant_id' });

      if (memberError) {
        logSupabaseError(memberError, {
          table: 'tenant_memberships',
          operation: 'upsert',
          component: 'AcceptInvite',
          actionName: 'auth.invite.accept_current',
          tenantId: invitation.tenant_id,
        });
        throw memberError;
      }

      // 2. Update/Create profile session for this tenant
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          auth_user_id: currentUser.id,
          tenant_id: invitation.tenant_id,
          role: invitation.role || 'staff',
          user_type: userType,
          business_model_selected: true,
          onboarded: true,
        }, { onConflict: 'auth_user_id,tenant_id' });

      if (profileError) {
        logSupabaseError(profileError, {
          table: 'profiles',
          operation: 'upsert',
          component: 'AcceptInvite',
          actionName: 'auth.invite.accept_current',
          tenantId: invitation.tenant_id,
        });
        throw profileError;
      }

      const { error: inviteError } = await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) {
        logSupabaseError(inviteError, {
          table: 'team_invitations',
          operation: 'update',
          component: 'AcceptInvite',
          actionName: 'auth.invite.accept_current',
          tenantId: invitation.tenant_id,
        });
        throw inviteError;
      }

      toast.success('Berhasil bergabung dengan tim!');
      navigate(`/${userType === 'rpa' ? 'rpa-buyer' : userType}/beranda`);
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'AcceptInvite',
        actionName: 'auth.invite.accept_current',
        error: err,
        metadata: {
          tenant_id: invitation?.tenant_id,
          invitation_role: invitation?.role,
        }
      });
      toast.error(err.message || 'Gagal bergabung');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Fix Bug 2: pass invite_token + remove manual profiles.upsert ───────────
  const handleRegister = async (e) => {
    e.preventDefault();

    // Fix Bug 3: email match check
    if (!checkEmailMatch()) return;

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Konfirmasi password tidak cocok');
    }
    if (formData.password.length < 8) {
      return toast.error('Password minimal 8 karakter');
    }

    setIsSubmitting(true);
    try {
      // 1. Sign Up — pass invite_token so handle_new_user() trigger joins tenant automatically
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            invite_token: invitation.token,   // ← trigger uses this to join tenant
            full_name: formData.fullName || ''
          }
        }
      });
      if (signUpError) {
        logError({
          level: 'error',
          source: 'auth',
          component: 'AcceptInvite',
          actionName: 'auth.invite.register_submit',
          error: signUpError,
          metadata: {
            tenant_id: invitation?.tenant_id,
            invitation_role: invitation?.role,
            token_length: invitation?.token?.length
          }
        });
        throw signUpError;
      }

      const user = authData.user;
      if (!user) throw new Error('Gagal membuat user');

      // 2. Mark invitation as accepted
      //    (profiles.upsert skipped — handle_new_user() DB trigger handles it via invite_token)
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) {
        logSupabaseError(inviteError, {
          table: 'team_invitations',
          operation: 'update',
          component: 'AcceptInvite',
          actionName: 'auth.invite.register_submit',
          tenantId: invitation?.tenant_id,
        });
        throw inviteError;
      }

      // 3. Navigate — derive rolePath from tenant owner's user_type
      const { data: ownerProfile, error: ownerProfileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('tenant_id', invitation.tenant_id)
        .eq('role', 'owner')
        .limit(1)
        .maybeSingle();

      if (ownerProfileError) {
        logSupabaseError(ownerProfileError, {
          table: 'profiles',
          operation: 'select',
          component: 'AcceptInvite',
          actionName: 'auth.invite.register_submit',
        });
        throw ownerProfileError;
      }

      const userType = ownerProfile?.user_type || 'broker';
      const rolePath = userType === 'rpa' ? 'rpa-buyer' : userType;

      toast.success('Pendaftaran berhasil! Bergabung dengan tim.');
      navigate(`/${rolePath}/beranda`);
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'AcceptInvite',
        actionName: 'auth.invite.register_submit',
        error: err,
        metadata: {
          tenant_id: invitation?.tenant_id,
          invitation_role: invitation?.role,
        }
      });
      toast.error(err.message || 'Gagal membuat akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Fix Bug 1: protect existing user from tenant hijack ───────────────────
  const handleLogin = async (e) => {
    e.preventDefault();

    // Fix Bug 3: email match check
    if (!checkEmailMatch()) return;

    setIsSubmitting(true);
    try {
      // 1. Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      if (signInError) throw signInError;

      const { data: { user } } = await supabase.auth.getUser();

      // 2. Fetch existing profile
      const { data: existingProfile, error: profileSelectError } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileSelectError) {
        logSupabaseError(profileSelectError, {
          table: 'profiles',
          operation: 'select',
          component: 'AcceptInvite',
          actionName: 'auth.invite.login_submit',
        });
        throw profileSelectError;
      }

      // 2a. Block only if they already own THIS specific tenant
      if (existingProfile?.role === 'owner' && existingProfile?.tenant_id === invitation.tenant_id) {
        await supabase.auth.signOut({ scope: 'local' });
        toast.error('Kamu sudah menjadi owner di bisnis ini.');
        return;
      }

      // 2b. Already in this tenant — skip update, just navigate
      if (existingProfile?.tenant_id === invitation.tenant_id) {
        const { error: inviteUpdateError } = await supabase
          .from('team_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitation.id);

        if (inviteUpdateError) {
          logSupabaseError(inviteUpdateError, {
            table: 'team_invitations',
            operation: 'update',
            component: 'AcceptInvite',
            actionName: 'auth.invite.login_submit',
            tenantId: invitation.tenant_id,
          });
          throw inviteUpdateError;
        }

        const { data: ownerProfile, error: ownerProfileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('tenant_id', invitation.tenant_id)
          .eq('role', 'owner')
          .limit(1)
          .maybeSingle();

        if (ownerProfileError) {
          logSupabaseError(ownerProfileError, {
            table: 'profiles',
            operation: 'select',
            component: 'AcceptInvite',
            actionName: 'auth.invite.login_submit',
          });
          throw ownerProfileError;
        }

        const userType = ownerProfile?.user_type || 'broker';
        toast.success('Kamu sudah terdaftar di tim ini!');
        navigate(`/${userType === 'rpa' ? 'rpa-buyer' : userType}/beranda`);
        return;
      }

      // 2c. Different tenant — require explicit confirmation before overwriting
      const doUpdate = async () => {
        const { data: ownerProfile, error: ownerProfileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('tenant_id', invitation.tenant_id)
          .eq('role', 'owner')
          .limit(1)
          .maybeSingle();

        if (ownerProfileError) {
          logSupabaseError(ownerProfileError, {
            table: 'profiles',
            operation: 'select',
            component: 'AcceptInvite',
            actionName: 'auth.invite.switch_tenant',
          });
          throw ownerProfileError;
        }

        const userType = ownerProfile?.user_type || 'broker';

        // 1. Create/Update membership association
        const { error: memberError } = await supabase
          .from('tenant_memberships')
          .upsert({
            tenant_id: invitation.tenant_id,
            auth_user_id: user.id,
            role: invitation.role || 'staff',
            full_name: user.user_metadata?.full_name || '',
          }, { onConflict: 'auth_user_id,tenant_id' });

        if (memberError) {
          logSupabaseError(memberError, {
            table: 'tenant_memberships',
            operation: 'upsert',
            component: 'AcceptInvite',
            actionName: 'auth.invite.switch_tenant',
            tenantId: invitation.tenant_id,
          });
          throw memberError;
        }

        // 2. Update/Create profile session for this tenant
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            auth_user_id: user.id,
            tenant_id: invitation.tenant_id,
            role: invitation.role || 'staff',
            user_type: userType,
            business_model_selected: true,
            onboarded: true
          }, { onConflict: 'auth_user_id,tenant_id' });

        if (profileError) {
          logSupabaseError(profileError, {
            table: 'profiles',
            operation: 'upsert',
            component: 'AcceptInvite',
            actionName: 'auth.invite.switch_tenant',
            tenantId: invitation.tenant_id,
          });
          throw profileError;
        }

        const { error: inviteUpdateError } = await supabase
          .from('team_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitation.id);

        if (inviteUpdateError) {
          logSupabaseError(inviteUpdateError, {
            table: 'team_invitations',
            operation: 'update',
            component: 'AcceptInvite',
            actionName: 'auth.invite.switch_tenant',
            tenantId: invitation.tenant_id,
          });
          throw inviteUpdateError;
        }

        toast.success('Berhasil bergabung dengan tim!');
        navigate(`/${userType === 'rpa' ? 'rpa-buyer' : userType}/beranda`);
      };

      // Store update fn and show confirmation UI
      setPendingUpdateFn(() => doUpdate);
      setConfirmingSwitch(true);

    } catch (_err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'AcceptInvite',
        actionName: 'auth.invite.login_submit',
        error: _err,
        metadata: {
          tenant_id: invitation?.tenant_id,
          invitation_role: invitation?.role,
        }
      });
      toast.error('Gagal masuk. Periksa kembali password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSwitch = async () => {
    if (!pendingUpdateFn) return;
    setIsSubmitting(true);
    try {
      await pendingUpdateFn();
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'AcceptInvite',
        actionName: 'auth.invite.switch_tenant',
        error: err,
        metadata: {
          tenant_id: invitation?.tenant_id,
          invitation_role: invitation?.role,
        }
      });
      toast.error('Gagal memindahkan akses: ' + (err.message || ''));
      await supabase.auth.signOut({ scope: 'local' });
      setConfirmingSwitch(false);
      setPendingUpdateFn(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSwitch = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setConfirmingSwitch(false);
    setPendingUpdateFn(null);
    toast.info('Pemindahan dibatalkan.');
  };

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center p-6 sm:p-8">
      <SEO 
        title="Terima Undangan Tim TernakOS | Masuk ke Platform Peternakan"
        description="Bergabung dengan tim peternakan Anda di platform TernakOS. Kelola operasional, pantau data, dan tingkatkan produktivitas bersama tim."
        path="/accept-invite"
      />

      {/* ── Input View ── */}
      {view === 'input' && (
        <div className="bg-[#0C1319] border border-white/8 rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-[#021a02]/10 rounded-2xl flex items-center justify-center border border-[#021a02]/20">
              <UserPlus className="text-[#021a02]" size={32} />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-[#F1F5F9] text-2xl font-bold mb-2">Masukkan Kode</h1>
            <p className="text-[#4B6478] text-sm">Minta kode dari owner tim yang mengundangmu</p>
          </div>

          {isLocked && (
            <div className="flex items-start gap-3 p-4 bg-amber-400/10 border border-amber-400/25 rounded-xl mb-6">
              <Lock className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-amber-400 text-sm font-semibold leading-relaxed">{lockMessage}</p>
            </div>
          )}

          <form onSubmit={verifyCode} className="space-y-6">
            <Input
              placeholder="CONTOH: A3K9FZ"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
              disabled={isLocked}
              className="h-16 text-center text-3xl font-bold tracking-[0.3em] uppercase bg-[#111C24] border-white/10 text-white rounded-xl focus:ring-[#021a02]/20 focus:border-[#021a02]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              disabled={loading || inviteCode.length !== 6 || isLocked}
              className="w-full h-14 bg-[#021a02] hover:bg-[#021a02] text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : isLocked ? 'Terkunci' : 'Verifikasi Kode'}
            </Button>
          </form>

          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full mt-6 text-[#4B6478] hover:text-[#F1F5F9]"
          >
            Kembali ke Beranda
          </Button>
        </div>
      )}

      {/* ── Choice View ── */}
      {view === 'choice' && (
        <div className="bg-[#0C1319] border border-white/8 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <img
                src="/logo.png"
                alt="TernakOS"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>

          <div className="text-center mb-10">
            <p className="text-[#4B6478] text-sm uppercase tracking-widest font-bold mb-2">Undangan Tim</p>
            <h1 className="text-[#F1F5F9] text-xl font-medium mb-1">Berhasil Verifikasi! Bergabung ke</h1>
            <h2 className="text-[#021a02] text-3xl font-extrabold tracking-tight">
              {invitation.tenants?.business_name}
            </h2>
            <div className="flex justify-center mt-3">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
                {invitation.role || 'Staff'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Already logged in — show primary CTA */}
            {currentUser && (
              <Button
                onClick={handleAcceptWithCurrentAccount}
                disabled={isSubmitting}
                className="w-full h-14 bg-[#021a02] hover:bg-[#021a02] text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting
                  ? <Loader2 size={20} className="animate-spin" />
                  : <ShieldCheck size={20} />}
                Terima dengan Akun Ini
              </Button>
            )}
            {currentUser && (
              <p className="text-center text-[11px] text-[#4B6478]">
                {currentUser.email}
              </p>
            )}

            {/* Divider if showing both sections */}
            {currentUser && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] text-[#4B6478] uppercase tracking-widest">atau</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            )}

            <Button
              onClick={() => setView('register')}
              className={`w-full h-14 font-bold rounded-xl flex items-center justify-center gap-3 transition-all ${
                currentUser
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/8'
                  : 'bg-[#021a02] hover:bg-[#021a02] text-white shadow-lg shadow-emerald-500/20'
              }`}
            >
              <UserPlus size={20} /> Buat Akun Baru
            </Button>
            <Button
              onClick={() => setView('login')}
              variant="outline"
              className="w-full h-14 bg-transparent border-white/10 hover:bg-white/5 text-[#F1F5F9] font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
            >
              <LogIn size={20} /> Masuk dengan Akun yang Ada
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => setView('input')}
            className="w-full mt-6 text-[#4B6478] hover:text-[#F1F5F9]"
          >
            Bukan tim ini? Gunakan kode lain
          </Button>
        </div>
      )}

      {/* ── Register View ── */}
      {view === 'register' && (
        <div className="bg-[#0C1319] border border-white/8 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-right duration-300">
          <button
            onClick={() => setView('choice')}
            className="flex items-center gap-2 text-[#4B6478] hover:text-[#F1F5F9] mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> <span className="text-sm font-medium">Batal</span>
          </button>

          <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2 font-display">Lengkapi Akun</h2>
          <p className="text-[#4B6478] text-sm mb-8 leading-relaxed">
            Hanya butuh beberapa detik untuk mulai berkolaborasi dengan tim{' '}
            <span className="text-emerald-400 font-bold">{invitation.tenants?.business_name}</span>.
          </p>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Email</Label>
              <div className="relative">
                <Input
                  required
                  type="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 bg-[#111C24] border-white/10 text-white pl-10 focus:ring-emerald-500/20"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Nama Lengkap</Label>
              <Input
                required
                placeholder="Budi Santoso"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-12 bg-[#111C24] border-white/10 text-white focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Password Baru</Label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 bg-[#111C24] border-white/10 text-white focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Konfirmasi Password</Label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="h-12 bg-[#111C24] border-white/10 text-white focus:ring-emerald-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#021a02] hover:bg-[#021a02] text-white font-bold rounded-xl mt-4 shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" size={20} />}
              {isSubmitting ? 'Memproses...' : 'Terima Undangan'}
            </Button>
          </form>
        </div>
      )}

      {/* ── Login View ── */}
      {view === 'login' && (
        <div className="bg-[#0C1319] border border-white/8 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-right duration-300">
          <button
            onClick={() => {
              setConfirmingSwitch(false);
              setPendingUpdateFn(null);
              setView('choice');
            }}
            className="flex items-center gap-2 text-[#4B6478] hover:text-[#F1F5F9] mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> <span className="text-sm font-medium">Batal</span>
          </button>

          {/* Tenant-switch confirmation card (shown after login if different tenant detected) */}
          {confirmingSwitch ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-amber-400/10 border border-amber-400/25 rounded-xl">
                <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-amber-400 font-bold text-sm mb-1">Konfirmasi Pindah Tim</p>
                  <p className="text-[#94A3B8] text-sm leading-relaxed">
                    Kamu sudah terdaftar di bisnis lain. Bergabung ke undangan ini akan
                    memindahkan aksesmu ke{' '}
                    <span className="text-[#F1F5F9] font-bold">{invitation.tenants?.business_name}</span>.
                    Lanjutkan?
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleConfirmSwitch}
                  disabled={isSubmitting}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                  {isSubmitting ? 'Memproses...' : 'Ya, pindahkan akses saya'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancelSwitch}
                  disabled={isSubmitting}
                  className="w-full h-12 text-[#4B6478] hover:text-[#F1F5F9]"
                >
                  Batal, tetap di tim saya sekarang
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2 font-display">Masuk Akun</h2>
              <p className="text-[#4B6478] text-sm mb-8 leading-relaxed">
                Gunakan akun Anda untuk masuk dan menerima akses tim.
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Email</Label>
                  <div className="relative">
                    <Input
                      required
                      type="email"
                      placeholder="nama@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 bg-[#111C24] border-white/10 text-white pl-10 focus:ring-emerald-500/20"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest font-bold text-[#4B6478] ml-1">Password</Label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-12 bg-[#111C24] border-white/10 text-white focus:ring-emerald-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#021a02] hover:bg-[#021a02] text-white font-bold rounded-xl mt-4 shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2" size={20} />}
                  {isSubmitting ? 'Memverifikasi...' : 'Masuk & Terima'}
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
