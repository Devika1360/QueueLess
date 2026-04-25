import { AVG_SERVICE_TIME } from '../services/mockData';

/**
 * Calculate estimated wait time for a customer.
 * @param {number} peopleAhead – number of people ahead in queue
 * @returns {number} estimated wait in minutes
 */
export function calculateETA(peopleAhead) {
  return peopleAhead * AVG_SERVICE_TIME;
}

/**
 * Derive a human-friendly status label based on position relative to the
 * currently-serving index.
 */
export function getStatus(customerIndex, currentServingIndex) {
  if (customerIndex < currentServingIndex) return 'Completed';
  if (customerIndex === currentServingIndex) return 'Now Serving';
  if (customerIndex === currentServingIndex + 1) return 'Almost There';
  return 'Waiting';
}
