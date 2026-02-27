import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNote, updateNote, deleteNote, togglePinNote, addTag } from '../store/slices/notesSlice';
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
  const { notes, tags } = useSelector((state) => state.notes);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    color: '#1ec9ff',
  });
  const [filterTag, setFilterTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenModal = (note = null) => {
    if (note) {
      setEditingNote(note.id);
      setFormData({
        title: note.title,
        content: note.content,
        tags: note.tags,
        color: note.color,
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        tags: [],
        color: '#1ec9ff',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNote(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingNote) {
      dispatch(updateNote({ id: editingNote, ...formData }));
    } else {
      dispatch(addNote(formData));
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (confirm(t('Delete this note?'))) {
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
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  return (
    <div className="notes-container">
      <header className="notes-header">
        <h1>{t('Personal Notes')}</h1>
        <p>{t('Your quick notes and ideas.')}</p>
      </header>

      <div className="notes-controls">
        <input
          type="text"
          placeholder={t('Search notes...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="notes-search"
        />
        <div className="notes-filters">
          <button
            className={`notes-filter ${filterTag === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTag('all')}
          >
            {t('All')}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              className={`notes-filter ${filterTag === tag ? 'active' : ''}`}
              onClick={() => setFilterTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
        <button className="notes-create-btn" onClick={() => handleOpenModal()}>
          {t('New Note')}
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
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="note-card"
              style={{ borderLeft: `4px solid ${note.color}` }}
            >
              <div className="note-card-header">
                <h3>{note.title}</h3>
                <div className="note-card-actions">
                  <button
                    className={`note-pin-btn ${note.pinned ? 'pinned' : ''}`}
                    onClick={() => handleTogglePin(note.id)}
                    title={t('Pin note')}
                  >
                    📌
                  </button>
                  <button onClick={() => handleOpenModal(note)} title={t('Edit')}>
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(note.id)} title={t('Delete')}>
                    🗑️
                  </button>
                </div>
              </div>
              <p className="note-card-content">{note.content}</p>
              {note.tags.length > 0 && (
                <div className="note-card-tags">
                  {note.tags.map((tag) => (
                    <span key={tag} className="note-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="note-card-meta">
                {new Date(note.updatedAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="notes-modal-overlay" onClick={handleCloseModal}>
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
                      title={color.label}
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
