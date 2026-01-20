import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface SponsorCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
  sponsor: string;
  className?: string;
}

// Pre-configured sponsor cards (can be fetched from API later)
const DEFAULT_SPONSORS = [
  {
    id: 'financial-tips',
    title: 'Financial Tips',
    description: 'Learn smart saving strategies',
    icon: '📊',
    link: '#',
    sponsor: 'Partner',
  },
];

export function SponsorCard({
  title,
  description,
  icon,
  link,
  sponsor,
  className = '',
}: SponsorCardProps) {
  return (
    <motion.a
      href={link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`block bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20 hover:border-primary/40 transition-all group ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground truncate">{title}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-primary/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Sponsored by {sponsor}
        </span>
      </div>
    </motion.a>
  );
}

// Component that shows sponsor cards based on configuration
export function SponsorSection() {
  const sponsors = DEFAULT_SPONSORS;
  const isEnabled = import.meta.env.VITE_ENABLE_SPONSORS === 'true';

  if (!isEnabled || sponsors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {sponsors.map((sponsor) => (
        <SponsorCard key={sponsor.id} {...sponsor} />
      ))}
    </div>
  );
}
