import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useNavigate } from 'react-router-dom';
import './DashboardWidget.css';

/**
 * Dashboard Widget - Compact overview of key metrics
 * Shows: Active projects, pending tasks, upcoming payments, today's focus
 * Can be used as home screen widget or quick-view modal
 */
const DashboardWidget = ({ compact = false }) => {
  const navigate = useNavigate();
  const projects = useSelector((state) => state.projects.projects || []);
  const payments = useSelector((state) => state.payments.payments || []);
  const calendar = useSelector((state) => state.calendar.events || []);
  const todos = useSelector((state) => state.todos.todos || []);
  const { tasks } = useTasks();

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeProjects = projects.filter(
      (project) => project.status !== 'cancelled' && project.status !== 'completed'
    ).length;
    const pendingTasks = tasks?.filter((task) => {
      const status = (task.status || '').toLowerCase();
      return status !== 'done' && status !== 'completed' && status !== 'closed';
    }).length || 0;
    const completedTasks = tasks?.filter((task) => {
      const status = (task.status || '').toLowerCase();
      return status === 'done' || status === 'completed' || status === 'closed';
    }).length || 0;
    const pendingTodos = todos.filter(t => t.status !== 'done').length;
    
    // Upcoming payments (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingPayments = payments.filter(p => {
      if (!p.nextDueDate) return false;
      const dueDate = new Date(p.nextDueDate);
      return dueDate >= today && dueDate <= nextWeek;
    }).length;

    // Today's events
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const todaysEvents = calendar.filter(e => {
      if (!e.startDate) return false;
      const eventDate = new Date(e.startDate);
      return eventDate >= todayStart && eventDate < todayEnd;
    }).length;

    return {
      activeProjects,
      pendingTasks,
      completedTasks,
      pendingTodos,
      upcomingPayments,
      todaysEvents,
    };
  }, [projects, tasks, todos, payments, calendar]);

  // Get today's focus (next pending task)
  const todaysFocus = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in-progress');
    if (pending.length === 0) return null;
    
    // Sort by priority: tactical > strategic > operational
    const priorities = { tactical: 3, strategic: 2, operational: 1 };
    pending.sort((a, b) => (priorities[b.level] || 0) - (priorities[a.level] || 0));
    
    return pending[0];
  }, [tasks]);

  if (compact) {
    return (
      <div className="dashboard-widget compact">
        <div className="widget-grid">
          <div className="widget-stat" onClick={() => navigate('/projects')}>
            <span className="stat-icon">📋</span>
            <span className="stat-value">{metrics.activeProjects}</span>
            <span className="stat-label">Active</span>
          </div>
          
          <div className="widget-stat" onClick={() => navigate('/my-tasks')}>
            <span className="stat-icon">✓</span>
            <span className="stat-value">{metrics.pendingTasks}</span>
            <span className="stat-label">Tasks</span>
          </div>
          
          <div className="widget-stat" onClick={() => navigate('/payments')}>
            <span className="stat-icon">💰</span>
            <span className="stat-value">{metrics.upcomingPayments}</span>
            <span className="stat-label">Due</span>
          </div>
          
          <div className="widget-stat" onClick={() => navigate('/calendar')}>
            <span className="stat-icon">📅</span>
            <span className="stat-value">{metrics.todaysEvents}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget">
      <div className="widget-header">
        <h3>📊 Quick Overview</h3>
      </div>

      <div className="widget-metrics">
        <div className="metric-card" onClick={() => navigate('/projects')}>
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.activeProjects}</div>
            <div className="metric-label">Active Projects</div>
          </div>
        </div>

        <div className="metric-card" onClick={() => navigate('/my-tasks')}>
          <div className="metric-icon">✓</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.pendingTasks}</div>
            <div className="metric-label">Pending Tasks</div>
            <div className="metric-subtitle">{metrics.completedTasks} completed</div>
          </div>
        </div>

        <div className="metric-card" onClick={() => navigate('/todos')}>
          <div className="metric-icon">☑</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.pendingTodos}</div>
            <div className="metric-label">Todos</div>
          </div>
        </div>

        <div className="metric-card" onClick={() => navigate('/payments')}>
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.upcomingPayments}</div>
            <div className="metric-label">Upcoming Payments</div>
            <div className="metric-subtitle">Next 7 days</div>
          </div>
        </div>

        <div className="metric-card" onClick={() => navigate('/calendar')}>
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.todaysEvents}</div>
            <div className="metric-label">Today's Events</div>
          </div>
        </div>
      </div>

      {todaysFocus && (
        <div className="widget-focus">
          <div className="focus-header">🎯 Today's Focus</div>
          <div className="focus-card" onClick={() => navigate('/my-tasks')}>
            <div className="focus-title">{todaysFocus.title}</div>
            <div className="focus-meta">
              <span className={`focus-level ${todaysFocus.level}`}>
                {todaysFocus.level || 'operational'}
              </span>
              {todaysFocus.context && (
                <span className="focus-context">{todaysFocus.context.slice(0, 60)}...</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardWidget;
