export default function StatCard({ icon, label, value, accent = 'indigo' }) {
  const accents = {
    indigo:  'from-indigo-500/20 to-purple-500/20 border-indigo-500/20 text-indigo-400',
    cyan:    'from-cyan-500/20 to-blue-500/20 border-cyan-500/20 text-cyan-400',
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20 text-emerald-400',
    amber:   'from-amber-500/20 to-orange-500/20 border-amber-500/20 text-amber-400',
  };

  return (
    <div
      className={`rounded-xl p-5 bg-gradient-to-br ${accents[accent]} border backdrop-blur-sm transition-transform duration-200 hover:scale-[1.03]`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
