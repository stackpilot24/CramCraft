import { cn } from '@/lib/utils';

type BadgeVariant = 'concept' | 'definition' | 'example' | 'relationship' | 'edge_case' | 'default';

const variantStyles: Record<BadgeVariant, string> = {
  concept: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  definition: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  example: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  relationship: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  edge_case: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const labels: Record<BadgeVariant, string> = {
  concept: 'Concept',
  definition: 'Definition',
  example: 'Example',
  relationship: 'Relationship',
  edge_case: 'Edge Case',
  default: 'Card',
};

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  className?: string;
}

export default function Badge({ variant = 'default', label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-sans',
        variantStyles[variant],
        className
      )}
    >
      {label ?? labels[variant]}
    </span>
  );
}
