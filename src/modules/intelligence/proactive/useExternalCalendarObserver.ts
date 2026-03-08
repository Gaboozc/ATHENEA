import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { syncExternalEvents } from '../../../../store/slices/calendarSlice.js';

const DEFAULT_SYNC_INTERVAL_MS = 1000 * 60 * 20;

export function useExternalCalendarObserver(enabled = true): void {
  const dispatch = useDispatch();
  const syncStatus = useSelector((state: any) => state?.calendar?.externalSyncStatus);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    if (!mountedRef.current) {
      mountedRef.current = true;
      dispatch(syncExternalEvents({ forceInteractiveAuth: false }));
    }

    const interval = window.setInterval(() => {
      if (syncStatus === 'loading') return;
      dispatch(syncExternalEvents({ forceInteractiveAuth: false }));
    }, DEFAULT_SYNC_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [dispatch, enabled, syncStatus]);
}

export default useExternalCalendarObserver;
