import { getStatus } from '../utils/queueHelpers';

const STATUS_STYLES = {
  Completed:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Now Serving': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse-slow',
  'Almost There':'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Waiting:      'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

export default function QueueCard({ person, index, currentServingIndex, isAdmin = false }) {
  const status = getStatus(index, currentServingIndex);
  const isActive = index === currentServingIndex;

  return (
    <div
      className={`
        relative rounded-xl p-4 transition-all duration-300
        ${isActive
          ? 'glass border-2 border-indigo-500/60 shadow-lg shadow-indigo-500/10 scale-[1.02]'
          : 'glass-card hover:bg-white/8'}
      `}
    >
      {/* Active glow */}
      {isActive && (
        <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-sm -z-10" />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Position badge */}
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
              ${isActive ? 'gradient-primary text-white' : 'bg-white/10 text-gray-300'}
            `}
          >
            {index + 1}
          </div>

          {/* Info */}
          <div>
            <p className={`font-semibold ${isActive ? 'text-white' : 'text-gray-200'}`}>
              {person.name}
            </p>
            <p className="text-xs text-gray-500">Joined at {person.joinedAt}</p>
          </div>
        </div>

        {/* Status pill */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      </div>
    </div>
  );
}
