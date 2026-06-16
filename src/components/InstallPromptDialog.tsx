import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import { InstallInstructions } from '@/components/InstallInstructions';
import { detectPlatform, isStandalone } from '@/lib/platform';

const SEEN_KEY = 'onesie-install-prompt-seen';

/** Shown once after first login, nudging the user to add Onesie to their home screen. */
export function InstallPromptDialog() {
  const [platform] = useState(detectPlatform);
  const [open, setOpen] = useState(() => {
    if (isStandalone()) return false; // already installed — nothing to prompt
    try { return localStorage.getItem(SEEN_KEY) !== '1'; } catch { return false; }
  });

  const close = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore storage errors */ }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-sm rounded-2xl" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-quicksand flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> Add Onesie to your Home Screen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-nunito">
            Install Onesie on your phone home screen — no address bar, just one tap.
          </p>
          <InstallInstructions platform={platform} />
          <p className="text-sm font-nunito text-foreground bg-primary/10 rounded-xl px-3 py-2.5">
            💡 You can find these steps anytime in <span className="font-semibold text-primary">Settings → Add to Home Screen</span>.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={close} className="w-full min-h-[48px] rounded-xl bg-onesie-purple hover:bg-onesie-purple/90 text-white font-nunito">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
