import { toast } from '@/lib/toast';

export interface OfflineQueueItem {
  id: string;
  type: 'appointment' | 'expense' | 'sale';
  action: 'create' | 'update';
  url: string;
  method: string;
  body: any;
  pending_sync: boolean;
}

const QUEUE_KEY = 'offline_sync_queue';

export function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const q = localStorage.getItem(QUEUE_KEY);
    return q ? JSON.parse(q) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineQueueItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    // Dispatch a custom event to notify components that the queue has changed
    window.dispatchEvent(new CustomEvent('offline-queue-changed'));
  } catch (e) {
    console.error('Failed to save offline queue', e);
  }
}

export function addToOfflineQueue(
  type: 'appointment' | 'expense' | 'sale',
  action: 'create' | 'update',
  url: string,
  method: string,
  body: any
): string {
  const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
  const queue = getOfflineQueue();
  queue.push({
    id,
    type,
    action,
    url,
    method,
    body,
    pending_sync: true,
  });
  saveOfflineQueue(queue);
  return id;
}

export async function syncOfflineQueue() {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;

  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log('Starting background sync for offline items:', queue.length);
  let successCount = 0;
  const remainingQueue: OfflineQueueItem[] = [];

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });

      if (response.ok) {
        successCount++;
      } else {
        // Keep in queue if server error occurs (we can retry next time)
        remainingQueue.push(item);
      }
    } catch (err) {
      console.error('Failed to sync item:', item, err);
      remainingQueue.push(item);
    }
  }

  saveOfflineQueue(remainingQueue);

  if (successCount > 0) {
    toast.success("ئینتەرنێت گەڕایەوە، داتاکان هاوکات کرانەوە");
    // Dispatch event to active pages to refresh their data
    window.dispatchEvent(new CustomEvent('offline-sync-complete'));
  }
}
