import { Zap } from 'lucide-react';

export default function BriefingPage() {
  const hour = new Date().getHours();
  const isEvening = hour >= 18;
  const isMorning = hour < 12;

  const greeting = isMorning
    ? 'Good morning'
    : isEvening
      ? 'Evening Review'
      : 'Good afternoon';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h1 text-foreground">{greeting}</h1>
        <p className="text-body text-muted-foreground mt-1">{today}</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Zap className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="text-h2 text-muted-foreground">No tasks yet</p>
        <p className="text-body text-muted-foreground/60 mt-2">
          Create your first task to see your briefing
        </p>
      </div>
    </div>
  );
}
