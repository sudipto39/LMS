import { useState, useEffect } from 'react';
import { GitCommit, Award, CheckCircle2, Terminal } from 'lucide-react';

interface ActivityItem {
  id: string;
  icon: typeof GitCommit;
  iconColor: string;
  badge: string;
  badgeBg: string;
  message: string;
  time: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    icon: GitCommit,
    iconColor: '#0891b2',
    badge: 'Git Telemetry',
    badgeBg: 'rgba(8, 145, 178, 0.12)',
    message: 'Roll 21CS042 pushed 4 commits to feature/auth-gateway [23 additions, 4 deletions]',
    time: 'Just now',
  },
  {
    id: '2',
    icon: Award,
    iconColor: '#059669',
    badge: 'Capstone Rubric',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    message: 'Prof. Davis graded Milestone 3: IoT Sensor Network — Awarded Grade A (96.5%)',
    time: '2m ago',
  },
  {
    id: '3',
    icon: Terminal,
    iconColor: '#7c3aed',
    badge: 'Sandbox Runner',
    badgeBg: 'rgba(124, 58, 237, 0.12)',
    message: 'Automated test container executed 14 unit test suites in 162ms (Pass: 14/14)',
    time: '4m ago',
  },
  {
    id: '4',
    icon: CheckCircle2,
    iconColor: '#0284c7',
    badge: 'Milestone Sync',
    badgeBg: 'rgba(2, 132, 199, 0.12)',
    message: 'Team "CyberShield" unlocked Final Capstone Defense milestone approval',
    time: '7m ago',
  },
];

export default function LiveActivityTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ACTIVITIES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const current = ACTIVITIES[currentIndex];
  const Icon = current.icon;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="inline-flex items-center gap-2.5 px-3.5 h-[30px] rounded-full border border-[#c2dfea] bg-white/80 backdrop-blur-md shadow-sm text-[12px] text-[#4a7280] transition-[border-color,box-shadow] duration-200 hover:shadow-md hover:border-[#0891b2]/50 max-w-[420px] overflow-hidden select-none"
    >
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
        </span>
        <span
          className="px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider text-[#0e7490]"
          style={{ background: current.badgeBg }}
        >
          {current.badge}
        </span>
      </div>

      <div className="flex items-center gap-1.5 truncate">
        <Icon size={14} style={{ color: current.iconColor }} className="flex-shrink-0" />
        <span className="truncate text-[#0f2a33] font-medium transition-opacity duration-300">
          {current.message}
        </span>
      </div>

      <span className="text-[11px] text-[#769ba8] ml-auto pl-1 flex-shrink-0">
        {current.time}
      </span>
    </div>
  );
}
