import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Mon', mood: 4 },
  { day: 'Tue', mood: 3 },
  { day: 'Wed', mood: 5 },
  { day: 'Thu', mood: 4 },
  { day: 'Fri', mood: 3 },
  { day: 'Sat', mood: 4 },
  { day: 'Sun', mood: 5 },
];

const moodLabels = { 1: '😢', 2: '😔', 3: '😐', 4: '😌', 5: '😊' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const moodVal = payload[0].value;
    return (
      <div className="card-elevated px-3 py-2 text-xs">
        <p className="font-medium text-text-primary">{label}</p>
        <p className="text-text-secondary">
          {moodLabels[moodVal] || '😐'} Mood: {moodVal}/5
        </p>
      </div>
    );
  }
  return null;
};

const MoodTrendChart = () => {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="section-label text-text-muted mb-1">This week</p>
          <h3 className="text-lg font-semibold text-text-primary">Mood Trend</h3>
        </div>
        <span className="text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors">
          View all →
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3bcc88" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3bcc88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#637d70' }}
            />
            <YAxis domain={[1, 5]} hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="mood"
              stroke="#3bcc88"
              strokeWidth={2}
              fill="url(#moodGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MoodTrendChart;
