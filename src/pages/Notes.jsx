import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom'; /* Block 5: deep-link from PersonalHub */
import useModalClose from '../hooks/useModalClose'; /* FIX UX-9 */
import { useDispatch, useSelector } from 'react-redux';
import { addNote, updateNote, deleteNote, togglePinNote, addTag } from '../../store/slices/notesSlice';
import { linkNoteToCalendar, unlinkFromCalendar } from '../../store/slices/calendarSlice';
import { clearGhostWriteDraft, setGhostWriteDraft } from '../modules/intelligence';
import { useLanguage } from '../context/LanguageContext';
import './Notes.css';

const NOTE_COLORS = [
  { value: '#1ec9ff', label: 'Blue' },
  { value: '#d4af37', label: 'Gold' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f97316', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#64748b', label: 'Gray' },
];

export const Notes = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const location = useLocation(); /* Block 5 */
  const { notes, tags } = useSelector((state) => state.notes);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    color: '#1ec9ff',
    reminderDate: '',
  });
  const [filterTag, setFilterTag] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'notas' | 'recordatorios'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!showModal) {
      clearGhostWriteDraft();
      return;
    }

    setGhostWriteDraft({
      noteId: editingNote,
      title: formData.title,
      content: formData.content,
      tags: formData.tags
    });
  }, [showModal, editingNote, formData.title, formData.content, formData.tags]);

  /* Block 5: deep-link — open note passed via navigate('/notes', { state: { openNoteId } }) */
  useEffect(() => {
    const openNoteId = location.state?.openNoteId;
    if (!openNoteId) return;
    const target = (notes || []).find((n) => n.id === openNoteId);
    if (target) handleOpenModal(target);
    // Clear location state so re-renders don't re-open
    window.history.replaceState({}, document.title);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openNoteId]);

  const handleOpenModal = (note = null) => {
    if (note) {
      setEditingNote(note.id);
      setFormData({
        title: note.title,
        content: note.content,
        tags: note.tags,
        color: note.color,
        reminderDate: note.reminderDate ? new Date(note.reminderDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        tags: [],
        color: '#1ec9ff',
        reminderDate: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = useCallback(() => { /* FIX UX-9 */
    setShowModal(false);
    setEditingNote(null);
  }, []);
  const { handleBackdropClick } = useModalClose(handleCloseModal); /* FIX UX-9 */

  const handleSubmit = (e) => {
    e.preventDefault();
    const noteData = {
      ...formData,
      reminderDate: formData.reminderDate || null,
    };
    
    if (editingNote) {
      dispatch(updateNote({ id: editingNote, ...noteData }));
      // Update calendar link
      if (noteData.reminderDate) {
        dispatch(linkNoteToCalendar({
          noteId: editingNote,
          noteTitle: noteData.title,
          date: noteData.reminderDate,
          color: noteData.color,
        }));
      } else {
        dispatch(unlinkFromCalendar({ relatedId: editingNote, relatedType: 'note' }));
      }
    } else {
      const newNoteId = Date.now().toString();
      dispatch(addNote({ ...noteData, id: newNoteId }));
      // Link to calendar if date is set
      if (noteData.reminderDate) {
        dispatch(linkNoteToCalendar({
          noteId: newNoteId,
          noteTitle: noteData.title,
          date: noteData.reminderDate,
          color: noteData.color,
        }));
      }
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (confirm(t('Delete this note?'))) {
      /* CAL-FIX-1: unlink orphan calendar event before deleting note */
      const note = (notes || []).find((n) => n.id === id);
      if (note?.reminderDate) {
        dispatch(unlinkFromCalendar({ relatedId: id, relatedType: 'note' }));
      }
      dispatch(deleteNote(id));
    }
  };

  const handleTogglePin = (id) => {
    dispatch(togglePinNote(id));
  };

  const handleToggleTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const filteredNotes = notes
    .filter((note) => {
      if (filterType === 'notas' && note.reminderDate) return false;
      if (filterType === 'recordatorios' && !note.reminderDate) return false;
      if (filterTag !== 'all' && !note.tags.includes(filterTag)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Recordatorios próximos primero dentro de su grupo
      if (a.reminderDate && b.reminderDate)
        return new Date(a.reminderDate) - new Date(b.reminderDate);
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  return (
    <div className="notes-container">
      <header className="notes-header">
        <h1>{t('Notas & Recordatorios')}</h1>
        <p>{t('Sin fecha = nota. Con fecha = recordatorio activo en notificaciones.')}</p>
      </header>

      <div className="notes-controls">
        <input
          type="text"
          placeholder={t('Search notes...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="notes-search"
        />
        {/* Tabs de tipo */}
        <div className="notes-type-tabs">
          <button className={`notes-type-tab${filterType === 'all' ? ' active' : ''}`} onClick={() => setFilterType('all')}>
            {t('Todas')}
          </button>
          <button className={`notes-type-tab${filterType === 'notas' ? ' active' : ''}`} onClick={() => setFilterType('notas')}>
            📝 {t('Notas')}
          </button>
          <button className={`notes-type-tab notes-type-tab--reminder${filterType === 'recordatorios' ? ' active' : ''}`} onClick={() => setFilterType('recordatorios')}>
            🔔 {t('Recordatorios')}
            {notes.filter((n) => n.reminderDate).length > 0 && (
              <span className="notes-type-count">{notes.filter((n) => n.reminderDate).length}</span>
            )}
          </button>
        </div>
        {/* Tags */}
        <div className="notes-filters">
          <button className={`notes-filter ${filterTag === 'all' ? 'active' : ''}`} onClick={() => setFilterTag('all')}>
            {t('All')}
          </button>
          {tags.map((tag) => (
            <button key={tag} className={`notes-filter ${filterTag === tag ? 'active' : ''}`} onClick={() => setFilterTag(tag)}>
              #{tag}
            </button>
          ))}
        </div>
        <button className="notes-create-btn" onClick={() => handleOpenModal()}>
          + {t('Nueva')}
        </button>
      </div>

      <div className="notes-grid">
        {filteredNotes.length === 0 ? (
          <div className="notes-empty">
            {searchQuery || filterTag !== 'all'
              ? t('No notes found.')
              : t('No notes yet. Create your first note!')}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isReminder = Boolean(note.reminderDate);
            const reminderDate = isReminder ? new Date(note.reminderDate) : null;
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const diffDays = reminderDate
              ? Math.ceil((reminderDate - today) / 86400000)
              : null;
            const isOverdue = diffDays !== null && diffDays < 0;
            const isDueToday = diffDays === 0;
            return (
              <div
                key={note.id}
                className={`note-card${isReminder ? ' note-card--reminder' : ''}${isOverdue ? ' note-card--overdue' : ''}${isDueToday ? ' note-card--today' : ''}`}
                style={{ borderLeft: `4px solid ${note.color}` }}
              >
                {isReminder && (
                  <div className="note-reminder-banner">
                    <span className="note-reminder-icon">🔔</span>
                    <span className="note-reminder-date">
                      {isOverdue
                        ? `⚠️ ${t('Vencido')} — ${reminderDate.toLocaleDateString()}`
                        : isDueToday
                          ? `📅 ${t('Hoy')}`
                          : `📅 ${reminderDate.toLocaleDateString()}${diffDays <= 3 ? ` (${diffDays}d)` : ''}`}
                    </span>
                  </div>
                )}
                <div className="note-card-header">
                  <h3>{note.title}</h3>
                  <div className="note-card-actions">
                    <button className={`note-pin-btn ${note.pinned ? 'pinned' : ''}`} onClick={() => handleTogglePin(note.id)} title={t('Pin note')}>📌</button>
                    <button onClick={() => handleOpenModal(note)} title={t('Edit')}>✏️</button>
                    <button onClick={() => handleDelete(note.id)} title={t('Delete')}>🗑️</button>
                  </div>
                </div>
                <p className="note-card-content">{note.content}</p>
                {note.tags.length > 0 && (
                  <div className="note-card-tags">
                    {note.tags.map((tag) => <span key={tag} className="note-tag">#{tag}</span>)}
                  </div>
                )}
                <div className="note-card-meta">
                  <div>{new Date(note.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="notes-modal-overlay" onClick={handleBackdropClick}>
          <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notes-modal-header">
              <h2>{editingNote ? t('Edit Note') : t('New Note')}</h2>
              <button onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="notes-form-group">
                <label>{t('Title')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('Enter note title')}
                  required
                />
              </div>
              <div className="notes-form-group">
                <label>{t('Content')}</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={t('Write your note...')}
                  rows="8"
                  required
                />
              </div>
              <div className="notes-form-group">
                <label>{t('Color')}</label>
                <div className="notes-color-picker">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`notes-color-option ${
                        formData.color === color.value ? 'selected' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={t(color.label)}
                    />
                  ))}
                </div>
              </div>
              <div className="notes-form-group">
                <label>{t('Tags')}</label>
                <div className="notes-tags-picker">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`notes-tag-option ${
                        formData.tags.includes(tag) ? 'selected' : ''
                      }`}
                      onClick={() => handleToggleTag(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="notes-form-group">
                <label>
                  🔔 {t('Fecha de recordatorio')}
                  <span className="notes-label-hint"> — {t('opcional. Si la añades, esta nota se convierte en recordatorio y aparecerá en Notificaciones.')}</span>
                </label>
                <input
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                />
                {formData.reminderDate && (
                  <p className="notes-reminder-hint">
                    🔔 {t('Esta nota se activará como recordatorio el')} {new Date(formData.reminderDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="notes-form-actions">
                <button type="button" onClick={handleCloseModal}>
                  {t('Cancel')}
                </button>
                <button type="submit">{t('Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
