const CLASS_MAP: Record<string, string> = {
  gut:      'bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400',
  mittel:   'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  schlecht: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400',
};

interface Props {
  score: string | null | undefined;
  size?: 'sm' | 'md';
}

export function ScoreBadge({ score, size = 'md' }: Props) {
  if (!score || !CLASS_MAP[score]) return null;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${CLASS_MAP[score]}`}>
      {score}
    </span>
  );
}
