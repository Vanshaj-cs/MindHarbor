import { Sparkles } from 'lucide-react';

const WelcomeCard = ({ name = 'Vatsal' }) => {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-emerald-400" />
        <span className="section-label text-emerald-400">Welcome back</span>
      </div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-tight">
        {greeting},
        <br />
        {name} 👋
      </h1>
      <p className="text-base text-text-secondary mt-4 max-w-lg leading-relaxed">
        Take a moment to check in with yourself today. Your well-being matters,
        and we're here to support you every step of the way.
      </p>
    </div>
  );
};

export default WelcomeCard;
