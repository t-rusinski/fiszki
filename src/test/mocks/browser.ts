import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Setup MSW worker for browser environment (development)
 * This is useful for testing in the browser during development
 */
export const worker = setupWorker(...handlers);
