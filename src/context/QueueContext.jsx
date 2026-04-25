import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchQueue, apiJoinQueue, apiNextCustomer, apiSkipCustomer } from '../services/apiService';
import { useAuth } from './AuthContext';

const QueueContext = createContext(null);

const POLL_INTERVAL = 3000; // Poll backend every 3 seconds for near-real-time updates

export function QueueProvider({ children }) {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [currentServingIndex, setCurrentServingIndex] = useState(0);

  /** Fetch latest queue data from the backend (MySQL) */
  const refreshQueue = useCallback(async () => {
    try {
      const data = await fetchQueue();
      setQueue(data.queue);
      setCurrentServingIndex(data.currentServingIndex);
    } catch (err) {
      // Backend might not be running — silently fail
      console.warn('Could not fetch queue:', err.message);
    }
  }, []);

  // Initial fetch + polling for real-time updates
  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshQueue]);

  /** Customer: join the queue (writes to MySQL via backend) */
  async function joinQueue(name, email) {
    try {
      const entry = await apiJoinQueue(name, email);
      await refreshQueue(); // Refresh to get updated list
      return entry;
    } catch (err) {
      console.error('Failed to join queue:', err);
      return null;
    }
  }

  /** Admin: serve next customer (updates MySQL via backend) */
  async function nextCustomer() {
    if (!user?._credentials) return;
    try {
      const [email, password] = atob(user._credentials).split(':');
      await apiNextCustomer(email, password);
      await refreshQueue();
    } catch (err) {
      console.error('Failed to advance queue:', err);
    }
  }

  /** Admin: skip current customer (updates MySQL via backend) */
  async function skipCustomer() {
    if (!user?._credentials) return;
    try {
      const [email, password] = atob(user._credentials).split(':');
      await apiSkipCustomer(email, password);
      await refreshQueue();
    } catch (err) {
      console.error('Failed to skip customer:', err);
    }
  }

  return (
    <QueueContext.Provider
      value={{ queue, currentServingIndex, nextCustomer, skipCustomer, joinQueue }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used within QueueProvider');
  return ctx;
}
