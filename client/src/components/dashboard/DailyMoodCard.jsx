import { useState } from 'react';

const moods = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😢', label: 'Anxious' },
];

const DailyMoodCard = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <p className="text-sm text-text-secondary mb-3">How are you feeling right now?</p>
      <div className="flex gap-3 flex-wrap">
        {moods.map((mood, i) => (
          <button
            key={mood.label}
            onClick={() => setSelected(i)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full
              transition-all duration-200 text-sm
              ${
                selected === i
                  ? 'bg-emerald-400/15 text-emerald-300 scale-105'
                  : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary'
              }
            `}
          >
            <span className="text-xl">{mood.emoji}</span>
            <span className="font-medium">{mood.label}</span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <p className="text-sm text-emerald-400/80 mt-4 animate-fade-in">
          Feeling {moods[selected].label.toLowerCase()} — that's completely okay 💜
        </p>
      )}
    </div>
  );
};

export default DailyMoodCard;
