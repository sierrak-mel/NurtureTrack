import { FeedingCard } from '@/components/FeedingCard';
import { DiaperCard } from '@/components/DiaperCard';
import { SleepCard } from '@/components/SleepCard';
import { ActiveSessionBanner } from '@/components/ActiveSessionBanner';
import { useApp } from '@/context/AppContext';

const Index = () => {
  const { profile } = useApp();

  return (
    <div className="min-h-screen bg-background pb-20">
      <ActiveSessionBanner />
      <div className="max-w-lg mx-auto px-4 pt-6">
        <header className="mb-6">
          <h1 className="text-2xl font-quicksand font-bold text-foreground">
            {profile ? `Hi there 👋` : 'NurtureTrack'}
          </h1>
          {profile && (
            <p className="text-sm text-muted-foreground font-nunito mt-0.5">
              Tracking {profile.name}'s day
            </p>
          )}
        </header>
        <div className="space-y-4">
          <FeedingCard />
          <DiaperCard />
          <SleepCard />
        </div>
      </div>
    </div>
  );
};

export default Index;
