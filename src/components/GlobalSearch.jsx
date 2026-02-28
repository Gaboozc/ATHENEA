import { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTasks } from '../context/TasksContext';
import './GlobalSearch.css';

export const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { projects } = useSelector((state) => state.projects);
  const { notes } = useSelector((state) => state.notes);
  const { todos } = useSelector((state) => state.todos);
  const { payments } = useSelector((state) => state.payments);
  const { collaborators } = useSelector((state) => state.collaborators);
  const { workOrders } = useSelector((state) => state.workOrders);
  const { events } = useSelector((state) => state.calendar);
  const { tasks } = useTasks();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          onClose(); // Actually opens it via parent
        }
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const results = [];

    // Search Projects
    projects.forEach((project) => {
      const matches = 
        project.name?.toLowerCase().includes(searchTerm) ||
        project.clientName?.toLowerCase().includes(searchTerm) ||
        project.description?.toLowerCase().includes(searchTerm) ||
        project.siteAddress?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        results.push({
          id: project.id,
          type: 'project',
          title: project.name,
          subtitle: project.clientName,
          route: `/projects/${project.id}`,
          icon: '📋'
        });
      }
    });

    // Search Tasks
    tasks.forEach((task) => {
      const matches = 
        task.title?.toLowerCase().includes(searchTerm) ||
        task.context?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        const project = projects.find(p => p.id === task.projectId);
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: project?.name || 'My Tasks',
          route: task.projectId ? `/projects/${task.projectId}` : '/my-tasks',
          icon: '✓'
        });
      }
    });

    // Search Notes
    notes.forEach((note) => {
      const matches = 
        note.title?.toLowerCase().includes(searchTerm) ||
        note.content?.toLowerCase().includes(searchTerm) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (matches) {
        results.push({
          id: note.id,
          type: 'note',
          title: note.title,
          subtitle: note.content?.substring(0, 60),
          route: '/notes',
          icon: '📝'
        });
      }
    });

    // Search Todos
    todos.forEach((todo) => {
      const matches = 
        todo.title?.toLowerCase().includes(searchTerm) ||
        todo.notes?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        results.push({
          id: todo.id,
          type: 'todo',
          title: todo.title,
          subtitle: todo.status === 'done' ? t('Done') : t('Pending'),
          route: '/todos',
          icon: '☑'
        });
      }
    });

    // Search Payments
    payments.forEach((payment) => {
      const matches = 
        payment.name?.toLowerCase().includes(searchTerm) ||
        payment.notes?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        results.push({
          id: payment.id,
          type: 'payment',
          title: payment.name,
          subtitle: `${payment.currency} ${payment.amount} - ${payment.frequency}`,
          route: '/payments',
          icon: '💰'
        });
      }
    });

    // Search Collaborators
    collaborators.forEach((collab) => {
      const matches = 
        collab.name?.toLowerCase().includes(searchTerm) ||
        collab.email?.toLowerCase().includes(searchTerm) ||
        collab.role?.toLowerCase().includes(searchTerm) ||
        collab.specialty?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        results.push({
          id: collab.id,
          type: 'collaborator',
          title: collab.name,
          subtitle: collab.email || collab.role,
          route: '/fleet',
          icon: '👤'
        });
      }
    });

    // Search Work Orders
    workOrders.forEach((order) => {
      const matches = 
        order.title?.toLowerCase().includes(searchTerm) ||
        order.description?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        const collab = collaborators.find(c => c.id === order.collaboratorId);
        results.push({
          id: order.id,
          type: 'workorder',
          title: order.title,
          subtitle: collab?.name || 'Work Order',
          route: '/fleet',
          icon: '📄'
        });
      }
    });

    // Search Calendar Events
    events.forEach((event) => {
      const matches = 
        event.title?.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm);
      
      if (matches) {
        results.push({
          id: event.id,
          type: 'event',
          title: event.title,
          subtitle: new Date(event.startDate).toLocaleDateString(),
          route: '/calendar',
          icon: '📅'
        });
      }
    });

    return results.slice(0, 50); // Limit to 50 results
  }, [query, projects, tasks, notes, todos, payments, collaborators, workOrders, events, t]);

  const handleResultClick = (result) => {
    navigate(result.route);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-header">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search projects, tasks, notes, todos...')}
            className="global-search-input"
          />
          <button onClick={onClose} className="search-close">
            ✕
          </button>
        </div>

        <div className="global-search-results">
          {query.trim() === '' && (
            <div className="search-empty">
              <p>{t('Start typing to search...')}</p>
              <div className="search-tips">
                <span>💡 {t('Search across all your data')}</span>
                <span>⌨️ Press Ctrl+K or Cmd+K anytime</span>
              </div>
            </div>
          )}

          {query.trim() !== '' && searchResults.length === 0 && (
            <div className="search-empty">
              <p>{t('No results found for')} "{query}"</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="search-results-list">
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <span className="result-icon">{result.icon}</span>
                  <div className="result-content">
                    <div className="result-title">{result.title}</div>
                    <div className="result-subtitle">{result.subtitle}</div>
                  </div>
                  <span className="result-type">{t(result.type)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="global-search-footer">
          <span>{searchResults.length} {t('results')}</span>
          <span className="search-hint">↑↓ {t('navigate')} • ↵ {t('select')} • ESC {t('close')}</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
