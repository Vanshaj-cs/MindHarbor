import { useNavigate } from 'react-router-dom';
import { MessageCircleHeart, SmilePlus, CalendarHeart, ArrowRight } from 'lucide-react';

const actions = [
  {
    icon: MessageCircleHeart,
    label: 'Talk to AI',
    description: 'Have a supportive conversation',
    accent: 'text-emerald-400',
    to: '/chat',
  },
  {
    icon: SmilePlus,
    label: 'Log Mood',
    description: 'Record how you feel right now',
    accent: 'text-mint-300',
    to: '/mood',
  },
  {
    icon: CalendarHeart,
    label: 'Book Session',
    description: 'Connect with a counselor',
    accent: 'text-emerald-300',
    to: '/counselor',
  },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div>
      <p className="section-label text-text-muted mb-4">Quick actions</p>
      <div className="flex flex-col sm:flex-row gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.to)}
            className="group flex items-center gap-3 px-5 py-3.5 rounded-2xl
              bg-white/[0.03] hover:bg-white/[0.06]
              transition-all duration-200 text-left flex-1
              focus:outline-none focus:ring-2 focus:ring-forest-600"
          >
            <action.icon size={18} className={action.accent} strokeWidth={1.8} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{action.label}</p>
              <p className="text-xs text-text-muted">{action.description}</p>
            </div>
            <ArrowRight
              size={14}
              className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
