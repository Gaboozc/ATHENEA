import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addEntry, updateEntry, deleteEntry } from '../../store/slices/journalSlice';
import { useLanguage } from '../context/LanguageContext';
import './Journal.css';

const MOOD_LABELS = ['', '😞', '😕', '😐', '🙂', '😊'];
const AUTOSAVE_DELAY = 2000;

export const Journal = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const entries = useSelector((s) => s.journal?.entries || []);

  const [selectedId, setSelectedId] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState(''); /* FIX-C */
  const autosaveTimer = useRef(null);

  const filteredEntries = useMemo(() => { /* FIX-C */
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.date.includes(q) ||
        (e.title || '').toLowerCase().includes(q) ||
        (e.content || '').toLowerCase().includes(q)
    );
  }, [entries, search]);

  const selectedEntry = useMemo(
    () => entries.find((e) => e.id === selectedId) || null,
    [entries, selectedId]
  );

  // Load entry into editor when selection changes
  useEffect(() => {
    if (selectedEntry) {
      setContent(selectedEntry.content);
      setTitle(selectedEntry.title);
      setMood(selectedEntry.mood);
      setDirty(false);
    }
  }, [selectedEntry]);

  // Autosave
  useEffect(() => {
    if (!dirty || !selectedId) return;
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      dispatch(updateEntry({ id: selectedId, content, title, mood }));
      setDirty(false);
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(autosaveTimer.current);
  }, [content, title, mood, dirty, selectedId, dispatch]);

  const handleNewEntry = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const existing = entries.find((e) => e.date === today);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    const id = `journal-${Date.now()}`;
    dispatch(addEntry({ id, date: today, title: '', content: '', mood: null }));
    setSelectedId(id);
  }, [entries, dispatch]);

  const handleSelectEntry = (id) => {
    // Save current before switching
    if (dirty && selectedId) {
      dispatch(updateEntry({ id: selectedId, content, title, mood }));
      setDirty(false);
    }
    setSelectedId(id);
  };

  const handleDelete = (id) => {
    if (!confirm(t('Delete this journal entry?'))) return;
    dispatch(deleteEntry(id));
    if (selectedId === id) {
      setSelectedId(null);
      setContent('');
      setTitle('');
      setMood(null);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Open today's entry by default if it exists
  useEffect(() => {
    if (entries.length > 0 && !selectedId) {
      setSelectedId(entries[0].id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="journal-container">
      <div className="journal-sidebar">
        <div className="journal-sidebar-header">
          <h2>📔 {t('Journal')}</h2>
          <button className="journal-new-btn" onClick={handleNewEntry}>
            + {t('Today')}
          </button>
        </div>
        <input /* FIX-C: search */
          className="journal-search-input"
          type="text"
          placeholder={t('Search entries…')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="journal-entry-list">
          {filteredEntries.map((entry) => (
            <li
              key={entry.id}
              className={`journal-entry-item ${entry.id === selectedId ? 'journal-entry-active' : ''}`}
              onClick={() => handleSelectEntry(entry.id)}
            >
              <div className="journal-entry-date">{entry.date}</div>
              <div className="journal-entry-preview">
                {entry.title || entry.content.slice(0, 50) || t('(empty)')}
              </div>
              <div className="journal-entry-meta">
                <span>{entry.wordCount ?? 0} {t('words')}</span>
                {entry.mood && <span>{MOOD_LABELS[entry.mood]}</span>}
              </div>
              <button
                className="journal-entry-delete"
                onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                title={t('Delete')}
              >✕</button>
            </li>
          ))}
          {filteredEntries.length === 0 && (
            <li className="journal-empty">
              {search ? t('No entries match your search.') : t('No entries yet. Create your first entry!')}
            </li>
          )}
        </ul>
      </div>

      <div className="journal-editor">
        {selectedEntry ? (
          <>
            <div className="journal-editor-toolbar">
              <input
                className="journal-title-input"
                placeholder={t('Title (optional)')}
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
              />
              <div className="journal-mood-selector">
                <span className="journal-mood-label">{t('Mood')}:</span>
                {[1, 2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    className={`journal-mood-btn ${mood === m ? 'journal-mood-active' : ''}`}
                    onClick={() => { setMood(mood === m ? null : m); setDirty(true); }}
                    title={`${m}/5`}
                  >
                    {MOOD_LABELS[m]}
                  </button>
                ))}
              </div>
              <span className="journal-autosave-indicator">
                {dirty ? `⏺ ${t('Saving…')}` : `✓ ${t('Saved')}`}
              </span>
            </div>
            <textarea
              className="journal-editor-area"
              placeholder={t('Write your thoughts for today…')}
              value={content}
              onChange={(e) => { setContent(e.target.value); setDirty(true); }}
              autoFocus
            />
            <div className="journal-editor-footer">
              <span>{selectedEntry.date}</span>
              <span>{wordCount} {t('words')}</span>
            </div>
          </>
        ) : (
          <div className="journal-editor-empty">
            <p>📔</p>
            <p>{t('Select an entry or create today\'s entry to start writing.')}</p>
            <button className="journal-new-btn" onClick={handleNewEntry}>
              + {t('New Entry')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
