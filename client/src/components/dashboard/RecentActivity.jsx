import { MessageCircleHeart, SmilePlus, CalendarHeart, BookOpen } from 'lucide-react';

const activities = [
  {
    icon: SmilePlus,
    text: 'You logged your mood as Happy',
    time: '2 hours ago',
    accent: 'text-mint-300',
  },
  {
    icon: MessageCircleHeart,
    text: 'Chat session with AI support',
    time: '5 hours ago',
    accent: 'text-emerald-400',
  },
  {
    icon: BookOpen,
    text: 'Completed: Breathing exercise',
    time: 'Yesterday',
    accent: 'text-emerald-300',
  },
  {
    icon: CalendarHeart,
    text: 'Counseling session booked',
    time: '2 days ago',
    accent: 'text-earth-200',
  },
];

const RecentActivity = () => {
  return (
    <div>
      <p className="section-label text-text-muted mb-1">Your history</p>
      <h3 className="text-lg font-semibold text-text-primary mb-6">Recent Activity</h3>

      <div className="relative pl-5">
        {/* Vertical timeline line */}
        <div className="absolute left-0 top-1 bottom-1 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />

        <div className="space-y-5">
          {activities.map((activity, i) => (
            <div
              key={i}
              className="relative flex items-start gap-3 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Dot on timeline */}
              <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-emerald-500/40" />
              <activity.icon size={15} className={`${activity.accent} mt-0.5 shrink-0`} strokeWidth={1.8} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary leading-snug">{activity.text}</p>
                <p className="text-xs text-text-muted mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
