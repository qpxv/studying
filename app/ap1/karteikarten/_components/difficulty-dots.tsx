interface Props {
  difficulty: number;
}

export function DifficultyDots({ difficulty }: Props) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((level) => (
        <div
          key={level}
          className={`w-2 h-2 rounded-full ${
            level <= difficulty
              ? 'bg-zinc-700 dark:bg-zinc-300'
              : 'border border-zinc-300 dark:border-zinc-600'
          }`}
        />
      ))}
    </div>
  );
}
