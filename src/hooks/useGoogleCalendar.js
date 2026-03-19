import { useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useDispatch, useSelector } from 'react-redux';
import { setGoogleToken, clearGoogleToken, getGoogleToken } from '../services/googleCalendar';
import { syncExternalEvents } from '../../store/slices/calendarSlice';

const syncRange = () => {
  const now = new Date();
  return {
    timeMin: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    timeMax: new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString(),
  };
};

export const useGoogleCalendar = () => {
  const dispatch = useDispatch();
  const syncStatus = useSelector((s) => s.calendar.externalSyncStatus);
  const lastSyncAt = useSelector((s) => s.calendar.lastExternalSyncAt);
  const [isConnected, setIsConnected] = useState(() => Boolean(getGoogleToken()));

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: (response) => {
      setGoogleToken(response.access_token);
      setIsConnected(true);
      dispatch(syncExternalEvents(syncRange()));
    },
    onError: (err) => {
      console.error('[GoogleCalendar] Login failed:', err);
    },
  });

  const disconnect = useCallback(() => {
    clearGoogleToken();
    setIsConnected(false);
  }, []);

  const sync = useCallback(() => {
    dispatch(syncExternalEvents(syncRange()));
  }, [dispatch]);

  return { isConnected, login, disconnect, sync, syncStatus, lastSyncAt };
};
