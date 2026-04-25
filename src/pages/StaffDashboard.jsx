import { useQueue } from '../context/QueueContext';
import QueueCard from '../components/QueueCard';
import StatCard from '../components/StatCard';

export default function StaffDashboard() {
  const { queue, currentServingIndex, nextCustomer, skipCustomer } = useQueue();

  const currentPerson = queue[currentServingIndex] || null;
  const totalInQueue = queue.length;
  const served = currentServingIndex;
  const remaining = Math.max(0, totalInQueue - currentServingIndex - 1);
  const allDone = currentServingIndex >= totalInQueue;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Staff Dashboard</h1>
          <p className="text-gray-400">Manage the queue — you're in control.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon="👥" label="Total" value={totalInQueue} accent="indigo" />
          <StatCard icon="✅" label="Served" value={served} accent="emerald" />
          <StatCard icon="⏳" label="Remaining" value={remaining} accent="amber" />
          <StatCard icon="📍" label="Position" value={`#${currentServingIndex + 1}`} accent="cyan" />
        </div>

        {/* Now Serving + Controls */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Now Serving
          </h2>

          {allDone ? (
            <div className="text-center py-8">
              <span className="text-5xl mb-4 block">🎉</span>
              <p className="text-xl font-semibold text-white mb-1">All done!</p>
              <p className="text-gray-400">Every customer has been served.</p>
            </div>
          ) : currentPerson ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Current person */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <span className="text-white text-xl font-bold">
                    {currentPerson.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{currentPerson.name}</p>
                  <p className="text-gray-400 text-sm">{currentPerson.email}</p>
                  <p className="text-gray-500 text-xs">Joined at {currentPerson.joinedAt}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={nextCustomer}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold text-white gradient-success hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  ✓ Next Customer
                </button>
                <button
                  onClick={skipCustomer}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold text-white gradient-danger hover:opacity-90 transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  ⏭ Skip Customer
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Full Queue List */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Full Queue</h2>
          {queue.length === 0 ? (
            <div className="glass-card rounded-xl p-10 text-center">
              <p className="text-gray-400">No one in the queue yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((person, idx) => (
                <QueueCard
                  key={person.id}
                  person={person}
                  index={idx}
                  currentServingIndex={currentServingIndex}
                  isAdmin
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
