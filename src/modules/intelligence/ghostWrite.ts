import { useSyncExternalStore } from 'react';

export interface GhostDraft {
  noteId?: string | null;
  title: string;
  content: string;
  tags: string[];
}

const listeners = new Set<() => void>();

let draftState: GhostDraft = {
  noteId: null,
  title: '',
  content: '',
  tags: []
};

let cachedSnapshot: {
  draft: GhostDraft;
  suggestedTags: string[];
  hasDraft: boolean;
};

const TAG_HINTS: Array<{ tag: string; keywords: string[] }> = [
  { tag: 'ideas', keywords: ['idea', 'brainstorm', 'invent', 'prototype', 'vision'] },
  { tag: 'work', keywords: ['project', 'meeting', 'deadline', 'client', 'deliverable'] },
  { tag: 'personal', keywords: ['family', 'home', 'habit', 'health', 'life'] },
  { tag: 'todo', keywords: ['todo', 'task', 'pending', 'checklist', 'next'] },
  { tag: 'finance', keywords: ['budget', 'expense', 'payment', 'invoice', 'money'] },
  { tag: 'important', keywords: ['urgent', 'critical', 'important', 'priority', 'asap'] }
];

function emit() {
  listeners.forEach((listener) => listener());
}

function buildSnapshot() {
  const text = `${draftState.title} ${draftState.content}`.toLowerCase();
  const suggestions = TAG_HINTS.filter((entry) =>
    entry.keywords.some((kw) => text.includes(kw))
  ).map((entry) => entry.tag);

  const deduped = Array.from(new Set(suggestions)).filter(
    (tag) => !(draftState.tags || []).map((t) => String(t).toLowerCase()).includes(tag)
  );

  return {
    draft: draftState,
    suggestedTags: deduped,
    hasDraft: text.trim().length > 10
  };
}

cachedSnapshot = buildSnapshot();

export function setGhostWriteDraft(draft: Partial<GhostDraft>) {
  draftState = {
    ...draftState,
    ...draft,
    title: String(draft.title ?? draftState.title ?? ''),
    content: String(draft.content ?? draftState.content ?? ''),
    tags: Array.isArray(draft.tags) ? draft.tags : draftState.tags
  };
  cachedSnapshot = buildSnapshot();
  emit();
}

export function clearGhostWriteDraft() {
  draftState = {
    noteId: null,
    title: '',
    content: '',
    tags: []
  };
  cachedSnapshot = buildSnapshot();
  emit();
}

export function getGhostWriteSnapshot() {
  return cachedSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshotForHook() {
  return getGhostWriteSnapshot();
}

export function useGhostWriteSuggestions() {
  return useSyncExternalStore(subscribe, snapshotForHook, snapshotForHook);
}
