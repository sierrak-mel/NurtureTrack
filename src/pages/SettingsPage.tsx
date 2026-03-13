import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Side } from '@/types';
import { LogOut, UserPlus, Trash2, Crown, User } from 'lucide-react';

export default function SettingsPage() {
  const { profile, setProfile, caregiver, caregivers, familyId } = useApp();
  const { user, signOut } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [dob, setDob] = useState(profile?.dateOfBirth || '');
  const [side, setSide] = useState<Side>(profile?.defaultStartSide || 'left');
  const [saved, setSaved] = useState(false);

  // Caregiver invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  const isOwner = caregiver?.role === 'owner';

  const handleSave = () => {
    setProfile({ name, dateOfBirth: dob, defaultStartSide: side });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleInvite = async () => {
    if (!familyId || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg('');

    // Check if user exists in auth
    // For now, create a placeholder caregiver that will be linked when they sign up
    // We store the invite_email so the system can match on signup
    const { error } = await supabase.from('caregivers').insert({
      family_id: familyId,
      user_id: user!.id, // Temporary - will be updated when invited user signs up
      display_name: inviteName || inviteEmail.split('@')[0],
      role: 'member' as const,
      invite_email: inviteEmail.trim().toLowerCase(),
    });

    if (error) {
      setInviteMsg(error.message.includes('duplicate') ? 'This person is already in your family.' : error.message);
    } else {
      setInviteMsg(`Invited ${inviteEmail}!`);
      setInviteEmail('');
      setInviteName('');
    }
    setInviting(false);
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
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground rounded-xl py-3 font-semibold font-nunito text-sm min-h-[48px] hover:bg-secondary/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Baby Profile */}
        <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-quicksand font-bold text-lg text-foreground">Baby Profile</h2>
          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Baby's Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter baby's name"
            />
          </div>
          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Default Starting Side</label>
            <div className="flex gap-2">
              {(['left', 'right'] as Side[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold font-nunito min-h-[48px] transition-colors ${
                    side === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-base min-h-[48px] hover:opacity-90 transition-opacity"
          >
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
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-nunito font-semibold text-foreground truncate">{cg.display_name}</p>
                  {cg.invite_email && <p className="text-xs text-muted-foreground font-nunito truncate">{cg.invite_email}</p>}
                </div>
                {cg.role === 'owner' && <Crown className="w-4 h-4 text-primary" />}
                {isOwner && cg.id !== caregiver?.id && (
                  <button
                    onClick={() => handleRemoveCaregiver(cg.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isOwner && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-nunito font-semibold text-foreground">Invite a Caregiver</h3>
              <input
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Their name (e.g. Grandma)"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Their email address"
              />
              {inviteMsg && <p className="text-sm font-nunito text-muted-foreground">{inviteMsg}</p>}
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="w-full flex items-center justify-center gap-2 bg-nurture-teal text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-sm min-h-[48px] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
