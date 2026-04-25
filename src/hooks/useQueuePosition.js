import { useQueue } from '../context/QueueContext';
import { calculateETA, getStatus } from '../utils/queueHelpers';

/**
 * Convenience hook: given a queue entry id, returns derived info about that
 * entry's position, ETA, and status.
 */
export function useQueuePosition(queueId) {
  const { queue, currentServingIndex } = useQueue();

  const index = queue.findIndex((q) => q.id === queueId);
  if (index === -1) {
    return { position: null, peopleAhead: 0, eta: 0, status: null };
  }

  const peopleAhead = Math.max(0, index - currentServingIndex);
  return {
    position: index + 1,
    peopleAhead,
    eta: calculateETA(peopleAhead),
    status: getStatus(index, currentServingIndex),
  };
}
