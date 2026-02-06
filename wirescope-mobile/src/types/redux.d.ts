import { Store } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Redux types
export interface AppDispatch {
  <T extends any>(action: T): T;
}

export interface TypedUseSelectorHook<TState> {
  <TSelected>(selector: (state: TState) => TSelected): TSelected;
}

// Extend the Window interface for global Redux store (for debugging)
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
  }
}

// Redux Toolkit Immer types
export type Draft<T> = T;

// Common async action types
export interface AsyncActionPending {
  type: string;
  meta: {
    requestId: string;
    requestStatus: 'pending';
  };
}

export interface AsyncActionFulfilled<T> {
  type: string;
  payload: T;
  meta: {
    requestId: string;
    requestStatus: 'fulfilled';
  };
}

export interface AsyncActionRejected {
  type: string;
  error: {
    message?: string;
    name?: string;
    stack?: string;
  };
  meta: {
    requestId: string;
    requestStatus: 'rejected';
    aborted: boolean;
    condition: boolean;
  };
  payload?: any;
}