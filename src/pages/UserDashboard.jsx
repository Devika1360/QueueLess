import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { calculateETA, getStatus } from '../utils/queueHelpers';
import QueueCard from '../components/QueueCard';
import StatCard from '../components/StatCard';
import { useToast, ToastContainer } from '../components/Toast';

// Notification thresholds — user gets alerted at these positions
const NOTIFY_AT_POSITIONS = [5, 3];

export default function UserDashboard() {
  const { user } = useAuth();
  const { queue, currentServingIndex, joinQueue } = useQueue();
  const { toasts, addToast, removeToast } = useToast();

  const [joining, setJoining] = useState(false);

  // Track which notifications have already been shown so they don't repeat
  const notifiedRef = useRef(new Set());

  // ── Auto-detect if user is already in queue (survives refresh) ──
  const myEntry = useMemo(
    () => queue.find((q) => q.email === user.email),
    [queue, user.email]
  );
  const myIndex = myEntry ? queue.indexOf(myEntry) : -1;
  const isInQueue = myIndex !== -1;

  // Derived stats
  const peopleAhead = isInQueue ? Math.max(0, myIndex - currentServingIndex) : 0;
  const myStatus = isInQueue ? getStatus(myIndex, currentServingIndex) : null;
  const eta = calculateETA(peopleAhead);

  // Counts
  const totalInQueue = queue.length;
  const served = currentServingIndex;
  const waiting = Math.max(0, totalInQueue - currentServingIndex);

  async function handleJoinQueue() {
    setJoining(true);
    await joinQueue(user.name, user.email);
    setJoining(false);
    notifiedRef.current = new Set();
  }

  // ── Notification logic ──
  useEffect(() => {
    if (!isInQueue) return;

    // "It's your turn!" — position 0 ahead
    if (peopleAhead === 0 && myStatus === 'Now Serving' && !notifiedRef.current.has('turn')) {
      notifiedRef.current.add('turn');
      addToast("🎉 It's your turn! Please proceed to the counter.", 'success', 7000);
      tryBrowserNotification("It's Your Turn!", "Please proceed to the counter now.");
    }

    // Threshold positions (5, 3)
    NOTIFY_AT_POSITIONS.forEach((pos) => {
      if (peopleAhead === pos && !notifiedRef.current.has(`pos-${pos}`)) {
        notifiedRef.current.add(`pos-${pos}`);
        const etaMin = calculateETA(pos);
        addToast(
          `You're ${pos} position${pos > 1 ? 's' : ''} away! Estimated wait: ~${etaMin} minutes.`,
          pos <= 3 ? 'warning' : 'info',
          6000
        );
        tryBrowserNotification(
          `QueueLess — ${pos} positions away`,
          `Estimated wait: ~${etaMin} minutes. Get ready!`
        );
      }
    });
  }, [peopleAhead, myStatus, isInQueue, addToast]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Welcome, {user.name}</h1>
          <p className="text-gray-400">Monitor your queue status in real time.</p>
        </div>

        {/* ── Queue Stats (always visible) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon="👥" label="In Queue" value={totalInQueue} accent="indigo" />
          <StatCard icon="✅" label="Served" value={served} accent="emerald" />
          <StatCard icon="⏳" label="Waiting" value={waiting} accent="amber" />
          {isInQueue && (
            <StatCard icon="📍" label="Your Position" value={`#${myIndex + 1}`} accent="cyan" />
          )}
          {!isInQueue && (
            <StatCard icon="📍" label="Your Position" value="—" accent="cyan" />
          )}
        </div>

        {/* ── Your Queue Status (if in queue) ── */}
        {isInQueue && (
          <>
            {/* Position Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard icon="👥" label="People Ahead" value={peopleAhead} accent="cyan" />
              <StatCard icon="⏱️" label="Est. Wait" value={`${eta} min`} accent="amber" />
              <StatCard
                icon={myStatus === 'Completed' ? '✅' : '🔔'}
                label="Status"
                value={myStatus}
                accent={myStatus === 'Now Serving' ? 'emerald' : myStatus === 'Almost There' ? 'amber' : 'indigo'}
              />
            </div>

            {/* Status Banner */}
            <div className={`rounded-xl p-5 mb-8 border transition-all duration-300 ${
              myStatus === 'Now Serving'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : myStatus === 'Almost There'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : myStatus === 'Completed'
                    ? 'bg-gray-500/10 border-gray-500/20'
                    : 'bg-indigo-500/10 border-indigo-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {myStatus === 'Now Serving' ? '🎉' :
                   myStatus === 'Almost There' ? '⚡' :
                   myStatus === 'Completed' ? '✅' : '⏳'}
                </span>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {myStatus === 'Now Serving' ? "It's your turn!" :
                     myStatus === 'Almost There' ? 'Get ready — you\'re next!' :
                     myStatus === 'Completed' ? 'You have been served.' : 'Hang tight — you\'re in the queue.'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Status: <span className="font-medium text-gray-300">{myStatus}</span>
                    {peopleAhead > 0 && ` · ${peopleAhead} ahead of you · ~${eta} min wait`}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Join Queue (if not in queue) ── */}
        {!isInQueue && (
          <div className="glass rounded-2xl p-8 mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/15 mb-5">
              <span className="text-3xl">🎫</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Ready to join the queue?</h2>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto text-sm">
              Join the virtual queue and we'll notify you when it's almost your turn.
            </p>
            <button
              onClick={handleJoinQueue}
              disabled={joining}
              className="px-8 py-3 rounded-xl font-semibold text-white gradient-primary hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join Queue'}
            </button>
          </div>
        )}

        {/* ── Queue Overview (always visible) ── */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Queue Overview
            <span className="text-gray-500 font-normal text-sm ml-2">({totalInQueue} total)</span>
          </h2>
          {queue.length === 0 ? (
            <div className="glass-card rounded-xl p-10 text-center">
              <span className="text-4xl mb-3 block">📋</span>
              <p className="text-gray-400">The queue is empty. Be the first to join!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((person, idx) => (
                <QueueCard
                  key={person.id}
                  person={person}
                  index={idx}
                  currentServingIndex={currentServingIndex}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Try to send a browser notification (requires user permission).
 */
function tryBrowserNotification(title, body) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.svg' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg' });
      }
    });
  }
}
