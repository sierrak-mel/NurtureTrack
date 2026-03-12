import { useApp } from '@/context/AppContext';
import { useState } from 'react';
import type { Side } from '@/types';

export default function SettingsPage() {
  const { profile, setProfile } = useApp();
  const [name, setName] = useState(profile?.name || '');
  const [dob, setDob] = useState(profile?.dateOfBirth || '');
  const [side, setSide] = useState<Side>(profile?.defaultStartSide || 'left');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setProfile({ name, dateOfBirth: dob, defaultStartSide: side });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-quicksand font-bold text-foreground mb-6">Settings</h1>

        <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-quicksand font-bold text-lg text-foreground">Baby Profile</h2>

          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Baby's Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter baby's name"
            />
          </div>

          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary"
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
                    side === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
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
      </div>
    </div>
  );
}
