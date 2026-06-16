import { Share, MoreVertical, PlusSquare } from 'lucide-react';
import type { Platform } from '@/lib/platform';

/** Platform-aware "add to home screen" steps, shared by Settings and the first-login prompt. */
export function InstallInstructions({ platform }: { platform: Platform }) {
  return (
    <div className="space-y-3">
      {(platform === 'ios' || platform === 'other') && (
        <div className="space-y-2">
          <p className="text-sm font-nunito font-semibold text-foreground flex items-center gap-1.5">
            <Share className="w-4 h-4 text-primary" /> iPhone / iPad (Safari)
          </p>
          <ol className="text-sm text-muted-foreground font-nunito space-y-1.5 list-decimal pl-5">
            <li>Open <span className="font-semibold text-foreground">onesie.vercel.app</span> in Safari.</li>
            <li>Tap the <span className="font-semibold text-foreground">Share</span> button (the square with an up arrow) at the bottom of the screen.</li>
            <li>Scroll down and tap <span className="font-semibold text-foreground">Add to Home Screen</span>.</li>
            <li>Tap <span className="font-semibold text-foreground">Add</span> in the top-right.</li>
          </ol>
        </div>
      )}

      {(platform === 'android' || platform === 'other') && (
        <div className="space-y-2">
          <p className="text-sm font-nunito font-semibold text-foreground flex items-center gap-1.5">
            <MoreVertical className="w-4 h-4 text-primary" /> Android (Chrome)
          </p>
          <ol className="text-sm text-muted-foreground font-nunito space-y-1.5 list-decimal pl-5">
            <li>Open <span className="font-semibold text-foreground">onesie.vercel.app</span> in Chrome.</li>
            <li>Tap the <span className="font-semibold text-foreground">⋮</span> menu in the top-right.</li>
            <li>Tap <span className="font-semibold text-foreground">Add to Home screen</span> (or <span className="font-semibold text-foreground">Install app</span>).</li>
            <li>Tap <span className="font-semibold text-foreground">Add</span> to confirm.</li>
          </ol>
        </div>
      )}

      <p className="text-xs text-muted-foreground/80 font-nunito flex items-center gap-1.5">
        <PlusSquare className="w-3.5 h-3.5 shrink-0" /> The Onesie icon will appear on your home screen, just like any other app.
      </p>
    </div>
  );
}
