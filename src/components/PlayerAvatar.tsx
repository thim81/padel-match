import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  'hsl(211, 100%, 50%)',   // blue
  'hsl(142, 71%, 45%)',    // green
  'hsl(280, 67%, 55%)',    // purple
  'hsl(38, 92%, 50%)',     // orange
  'hsl(350, 80%, 55%)',    // red
  'hsl(180, 60%, 45%)',    // teal
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface PlayerAvatarProps {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function PlayerAvatar({ name, size = 'md', className }: PlayerAvatarProps) {
  const color = getColorForName(name);
  const initials = getInitials(name);

  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white shrink-0',
        sizeClasses,
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
