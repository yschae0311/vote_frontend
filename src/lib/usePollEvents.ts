import { useEffect, useRef } from 'react';

export type PollEventType = 'poll_updated' | 'results_updated' | 'voters_updated';

type Handlers = Partial<Record<PollEventType, () => void>>;

export function usePollEvents(pollId: number, handlers: Handlers, adminToken?: string | null) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!pollId) return;

    const url = adminToken
      ? `/api/admin/polls/${pollId}/events?token=${encodeURIComponent(adminToken)}`
      : `/api/polls/${pollId}/events`;

    const es = new EventSource(url);

    const bind = (type: PollEventType) => {
      es.addEventListener(type, () => {
        handlersRef.current[type]?.();
      });
    };

    bind('poll_updated');
    bind('results_updated');
    bind('voters_updated');

    return () => es.close();
  }, [pollId, adminToken]);
}
