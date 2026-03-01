import { BookOpen, Headphones, Video, ArrowUpRight } from 'lucide-react';

const resources = [
  {
    title: 'Managing Exam Stress',
    type: 'Article',
    icon: BookOpen,
    accent: 'text-emerald-400',
    duration: '5 min read',
  },
  {
    title: 'Guided Breathing Exercise',
    type: 'Audio',
    icon: Headphones,
    accent: 'text-mint-300',
    duration: '10 min',
  },
  {
    title: 'Understanding Anxiety',
    type: 'Video',
    icon: Video,
    accent: 'text-emerald-300',
    duration: '12 min watch',
  },
];

const RecommendedResources = () => {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="section-label text-text-muted mb-1">Curated for you</p>
          <h3 className="text-lg font-semibold text-text-primary">Recommended Resources</h3>
        </div>
        <a
          href="/resources"
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all →
        </a>
      </div>
      <div className="section-rule mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <a
            key={resource.title}
            href="#"
            className="group block"
          >
            <div className="flex items-center gap-2 mb-2">
              <resource.icon size={15} className={`${resource.accent}`} strokeWidth={1.8} />
              <span className="text-xs text-text-muted uppercase tracking-wider">
                {resource.type}
              </span>
            </div>
            <h4 className="text-base font-medium text-text-primary group-hover:text-emerald-300 transition-colors leading-snug">
              {resource.title}
              <ArrowUpRight
                size={13}
                className="inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </h4>
            <p className="text-xs text-text-muted mt-1">{resource.duration}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default RecommendedResources;
