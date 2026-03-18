import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Side, UnitPreference } from '@/types';
import { LogOut, Link2, Trash2, Crown, User, Copy, Check, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { profile, setProfile, caregiver, caregivers, familyId } = useApp();
  const { user, signOut, claimInvite } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [dob, setDob] = useState(profile?.dateOfBirth || '');
  const [side, setSide] = useState<Side>(profile?.defaultStartSide || 'left');
  const [unitPref, setUnitPref] = useState<UnitPreference>(profile?.unitPreference || 'oz');
  const [saved, setSaved] = useState(false);

  const [inviteCode, setInviteCode] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  const isOwner = caregiver?.role === 'owner';

  useEffect(() => {
    if (familyId && isOwner) loadActiveInvite();
  }, [familyId, isOwner]);

  const loadActiveInvite = async () => {
    const { data } = await supabase
      .from('family_invites').select('invite_code')
      .eq('family_id', familyId!).eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }).limit(1).single();
    if (data) setInviteCode(data.invite_code);
  };

  const handleGenerateInvite = async () => {
    if (!familyId) return;
    setInviteLoading(true); setInviteMsg('');
    const { data, error } = await supabase
      .from('family_invites').insert({ family_id: familyId, created_by: user!.id })
      .select('invite_code').single();
    if (error) setInviteMsg(error.message);
    else if (data) setInviteCode(data.invite_code);
    setInviteLoading(false);
  };

  const inviteLink = inviteCode ? `${window.location.origin}/auth?invite=${inviteCode}` : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setProfile({ name, dateOfBirth: dob, defaultStartSide: side, unitPreference: unitPref });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setJoinMsg('');
    const { error } = await claimInvite(joinCode.trim());
    if (error) setJoinMsg(error.message);
    else { setJoinMsg('Successfully joined the family! Reload to see changes.'); setJoinCode(''); }
    setJoining(false);
  };

  const handleRemoveCaregiver = async (id: string) => {
    await supabase.from('caregivers').delete().eq('id', id);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <h1 className="text-2xl font-quicksand font-bold text-foreground mb-6">Settings</h1>

        {/* Account */}
        <div className="bg-card rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-quicksand font-bold text-lg text-foreground">Account</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-nunito font-semibold text-foreground truncate">{caregiver?.display_name || 'You'}</p>
              <p className="text-xs text-muted-foreground font-nunito truncate">{user?.email}</p>
            </div>
            {isOwner && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-nunito font-semibold">
                <Crown className="w-3 h-3" /> Owner
              </span>
            )}
          </div>
          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground rounded-xl py-3 font-semibold font-nunito text-sm min-h-[48px] hover:bg-secondary/80 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Baby Profile */}
        <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-quicksand font-bold text-lg text-foreground">Baby Profile</h2>
          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Baby's Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Enter baby's name" />
          </div>
          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Date of Birth</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Default Starting Side</label>
            <div className="flex gap-2">
              {(['left', 'right'] as Side[]).map(s => (
                <button key={s} onClick={() => setSide(s)} className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold font-nunito min-h-[48px] transition-colors ${side === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Volume Units</label>
            <div className="flex gap-2">
              {(['oz', 'ml'] as UnitPreference[]).map(u => (
                <button key={u} onClick={() => setUnitPref(u)} className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold font-nunito min-h-[48px] transition-colors ${unitPref === u ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {u === 'oz' ? 'Ounces (oz)' : 'Milliliters (ml)'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-base min-h-[48px] hover:opacity-90 transition-opacity">
            {saved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </div>

        {/* Caregivers */}
        <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-quicksand font-bold text-lg text-foreground">Caregivers</h2>
          <p className="text-sm text-muted-foreground font-nunito">Everyone who can log and view {profile?.name || "baby"}'s data.</p>
          <div className="space-y-2">
            {caregivers.map(cg => (
              <div key={cg.id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-nunito font-semibold text-foreground truncate">{cg.display_name}</p></div>
                {cg.role === 'owner' && <Crown className="w-4 h-4 text-primary" />}
                {isOwner && cg.id !== caregiver?.id && (
                  <button onClick={() => handleRemoveCaregiver(cg.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>

          {isOwner && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-nunito font-semibold text-foreground flex items-center gap-2"><Link2 className="w-4 h-4" /> Invite a Caregiver</h3>
              <p className="text-xs text-muted-foreground font-nunito">Generate a unique invite link. Share it with anyone you want to join your family. Links expire in 7 days.</p>
              {inviteCode ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input readOnly value={inviteLink} className="flex-1 rounded-xl border border-input bg-muted px-3 py-3 text-xs font-nunito min-h-[48px] focus:outline-none truncate" />
                    <button onClick={handleCopy} className="shrink-0 flex items-center gap-1 bg-primary text-primary-foreground rounded-xl px-4 py-3 font-semibold font-nunito text-sm min-h-[48px] hover:opacity-90 transition-opacity">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <button onClick={handleGenerateInvite} disabled={inviteLoading} className="flex items-center gap-2 text-sm text-muted-foreground font-nunito hover:text-foreground transition-colors"><RefreshCw className="w-3 h-3" /> Generate new link</button>
                </div>
              ) : (
                <button onClick={handleGenerateInvite} disabled={inviteLoading} className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground rounded-xl py-3 font-semibold font-nunito text-sm min-h-[48px] hover:opacity-90 transition-opacity disabled:opacity-50">
                  <Link2 className="w-4 h-4" />{inviteLoading ? 'Generating...' : 'Generate Invite Link'}
                </button>
              )}
              {inviteMsg && <p className="text-sm font-nunito text-destructive">{inviteMsg}</p>}
            </div>
          )}

          {!isOwner && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-nunito font-semibold text-foreground">Join a Family</h3>
              <p className="text-xs text-muted-foreground font-nunito">Enter an invite code to join another family's tracking.</p>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-wider" placeholder="Enter invite code" />
              {joinMsg && <p className="text-sm font-nunito text-muted-foreground">{joinMsg}</p>}
              <button onClick={handleJoinFamily} disabled={joining || !joinCode.trim()} className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-sm min-h-[48px] hover:opacity-90 transition-opacity disabled:opacity-50">
                {joining ? 'Joining...' : 'Join Family'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
