import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Building2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { logSupabaseError } from '@/lib/logger/supabaseLogger';
import { logError } from '@/lib/logger/errorLogger';

export default function Invite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null); // 'invalid', 'expired', 'accepted', etc
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      try {
        setLoading(true);
        const { data: rows, error } = await supabase
          .rpc('get_invitation_by_token', { p_token: token });
        const data = rows?.[0] ?? null;

        if (error) {
          logError({
            level: 'error',
            source: 'auth',
            component: 'Invite',
            actionName: 'auth.invite.verify_token',
            error: error,
            metadata: {
              token_length: token?.length,
            }
          });
          setErrorStatus('invalid');
          return;
        }

        if (!data) {
          logError({
            level: 'warning',
            source: 'auth',
            component: 'Invite',
            actionName: 'auth.invite.verify_token',
            error: new Error('No invitation found for token'),
            metadata: {
              token_length: token?.length,
            }
          });
          setErrorStatus('invalid');
          return;
        }

        if (data.status === 'accepted') {
          setErrorStatus('accepted');
          return;
        }

        if (data.status === 'expired' || new Date(data.expires_at) < new Date()) {
          setErrorStatus('expired');
          return;
        }

        setInviteData(data);
        setErrorStatus(null);
      } catch (err) {
        logError({
          level: 'error',
          source: 'auth',
          component: 'Invite',
          actionName: 'auth.invite.verify_token',
          error: err,
          metadata: {
            token_length: token?.length,
          }
        });
        console.error("Token verification error:", err);
        setErrorStatus('invalid');
      } finally {
        setLoading(false);
      }
    }

    if (token) verifyToken();
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!user || !profile || !inviteData) return;
    setIsAccepting(true);

    try {
      // 1. Update Profile (tenant_id and role)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          tenant_id: inviteData.tenant_id,
          role: inviteData.role,
          business_model_selected: true,
          user_type: 'broker', // Assume broker since team feature is requested for broker
          onboarded: true
        })
        .eq('id', profile.id);

      if (profileError) {
        logSupabaseError(profileError, { table: 'profiles', operation: 'update', component: 'Invite', actionName: 'invite.accept.profile_update' });
        throw profileError;
      }

      // 2. Mark invite as accepted
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', inviteData.id);

      if (inviteError) {
        logSupabaseError(inviteError, { table: 'team_invitations', operation: 'update', component: 'Invite', actionName: 'invite.accept.mark_accepted' });
        throw inviteError;
      }

      toast.success('Berhasil bergabung ke tim!');
      navigate(getBrokerBasePath({ sub_type: inviteData.tenant_sub_type }) + '/beranda');
      
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'Invite',
        actionName: 'auth.invite.accept_token_submit',
        error: err,
        metadata: {
          tenant_id: inviteData?.tenant_id,
          role: inviteData?.role,
        }
      });
      console.error(err);
      toast.error('Gagal menerima undangan', { description: err.message });
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-em-400 w-8 h-8" />
      </div>
    );
  }

  // Handle Error States
  if (errorStatus) {
    return (
      <div className="min-h-screen bg-bg-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-bg-2 border border-border-def rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-red/10 flex items-center justify-center text-red mb-6">
            <XCircle size={32} />
          </div>
          <h1 className="font-display text-2xl font-bold text-tx-1 mb-2">
            {errorStatus === 'invalid' && 'Undangan Tidak Valid'}
            {errorStatus === 'accepted' && 'Undangan Sudah Digunakan'}
            {errorStatus === 'expired' && 'Undangan Kedaluwarsa'}
          </h1>
          <p className="text-tx-3 mb-8">
            {errorStatus === 'invalid' && 'Token undangan tidak dikenali atau salah. Silakan minta admin Anda untuk mengirim ulang undangan baru.'}
            {errorStatus === 'accepted' && 'Link undangan ini sudah pernah diklaim sebelumnya oleh pengguna lain atau Anda sendiri.'}
            {errorStatus === 'expired' && 'Batas waktu link undangan ini telah habis (lebih dari 7 hari).'}
          </p>
          <Button onClick={() => navigate('/')} className="w-full bg-bg-3 text-tx-1 border border-border-strong hover:bg-white/[0.05]">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  // Handle Valid Invite State
  return (
    <div className="min-h-screen bg-bg-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-bg-2 border border-em-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_10px_40px_rgba(2, 26, 2,0.1)] flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-em-500/10 border border-em-500/20 flex items-center justify-center text-em-400 mb-6 relative">
          <Building2 size={32} />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-bg-2 border border-border-def flex items-center justify-center shadow-lg">
            <CheckCircle2 size={16} className="text-em-400" />
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-tx-1 mb-2">Undangan Bergabung</h1>
        <p className="text-tx-3 mb-6">
          Anda diundang untuk bergabung ke tim bisnis <strong className="text-tx-1">{inviteData?.tenant_business_name || 'TernakOS'}</strong> sebagai <Badge variant="outline" className="ml-1 uppercase tracking-wider text-[10px] bg-em-500/10 text-em-400">{inviteData?.role}</Badge>
        </p>

        {!user ? (
          <div className="w-full space-y-4">
            <div className="p-4 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] flex items-start text-left gap-3">
              <AlertTriangle size={18} className="text-gold flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-gold/90">
                Silakan masuk atau buat akun baru terlebih dahulu untuk menerima undangan ini. Setelah masuk, buka kembali link ini.
              </p>
            </div>
            <div className="flex gap-4 w-full">
              <Button asChild className="flex-1 bg-em-500 hover:bg-em-600 text-white font-bold h-12 rounded-xl">
                <Link to="/login">Masuk Akun</Link>
              </Button>
              <Button asChild className="flex-1 bg-bg-3 border border-border-strong text-tx-1 hover:bg-white/[0.05] font-bold h-12 rounded-xl">
                <Link to="/register">Daftar</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="p-4 rounded-xl bg-bg-3 border border-border-def text-sm text-tx-2 text-left">
              <strong>Info Akun:</strong> Anda masuk sebagai <span className="text-em-400">{user.email}</span>. Pastikan ini adalah akun yang ingin menerima akses tim.
            </div>
            <Button 
              onClick={handleAcceptInvite} 
              disabled={isAccepting}
              className="w-full bg-em-500 hover:bg-em-600 text-white font-bold h-12 rounded-xl text-[15px] transition-all"
            >
              {isAccepting ? <Loader2 className="animate-spin mr-2" /> : null}
              {isAccepting ? "Memproses..." : "Terima Undangan"}
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="ghost" 
              className="w-full text-tx-3 hover:text-tx-1 hover:bg-white/[0.02]"
            >
              Nanti Saja
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
