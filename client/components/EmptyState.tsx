import Link from 'next/link';
import { RiArrowRightLine } from 'react-icons/ri';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card p-14 text-center border-dashed">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-600 flex items-center justify-center mx-auto mb-5 text-2xl">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
      <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary inline-flex">
          {actionLabel} <RiArrowRightLine size={15} />
        </Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary inline-flex">
          {actionLabel} <RiArrowRightLine size={15} />
        </button>
      )}
    </div>
  );
}
