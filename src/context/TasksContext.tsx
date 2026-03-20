import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { taskCompleted, updateStreak } from "../../store/slices/statsSlice";
import {
  addTask as addTaskToSlice,
  updateTask as updateTaskInSlice,
  hydrateFromStorage,
} from "../../store/slices/tasksSlice"; /* ARCH-FIX-1 */
import { unlinkFromCalendar } from "../../store/slices/calendarSlice"; /* CAL-BUG-4 fix */
import type { PriorityFactors, PriorityLevel } from "../utils/priorityEngine";

const TASKS_STORAGE_KEY = "athenea.tasks";

export type GatekeeperTask = {
  id: string;
  orgId?: string;
  assigneeId?: string | null;
  targetTeams?: string[];
  projectId: string;
  projectName: string;
  status: string;
  title: string;
  description: string;
  workstreams: string[];
  factors: PriorityFactors;
  totalScore: number;
  level: PriorityLevel;
  dueDate?: string;
  metadata: {
    questions?: string[];
    source?: string;
    category?: string;
    priority?: string;
    failedQuestion?: string;
    failedAnswer?: string;
    answer?: string;
    photos?: string[];
    workerNote?: string;
    resolutionNote?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    questionValueSum?: number;
    questionValues?: {
      id: string;
      value: number;
      checked: boolean;
    }[];
  };
  createdAt: string;
};

type TasksContextValue = {
  tasks: GatekeeperTask[];
  addTask: (task: GatekeeperTask) => void;
  updateTask: (id: string, updates: Partial<GatekeeperTask>) => void; /* ARCH-FIX-1: was missing from type */
  updateTaskStatus: (id: string, status: string) => void;
  resolveTask: (id: string, resolvedBy?: string, resolutionNote?: string) => void;
  updateTaskAssignment: (id: string, assigneeId: string | null, teamId?: string) => void;
  clearAssignmentsForUser: (userId: string) => void;
  deleteTask: (id: string) => void;
};

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<GatekeeperTask[]>([]);
  const dispatch = useDispatch();
  const currentOrgId = useSelector(
    (state: { organizations: { currentOrgId: string | null } }) =>
      state.organizations.currentOrgId
  );

  useEffect(() => {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setTasks(parsed);
        dispatch(hydrateFromStorage(parsed)); /* ARCH-FIX-1: seed Redux with existing tasks on mount */
      }
    } catch (error) {
      console.error("Failed to load tasks from storage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: GatekeeperTask) => {
    const orgId = task.orgId || currentOrgId || undefined;
    /* Always ensure a stable id so local state and Redux stay in sync */
    const id = task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newTask = { ...task, id, orgId };
    setTasks((prev) => [newTask, ...prev]);
    dispatch(addTaskToSlice(newTask)); /* ARCH-FIX-1: mirror to Redux so AgentOrchestrator sees it */
  };

  const updateTaskStatus = (id: string, status: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          // Track achievement when task is completed
          if ((status === 'Completed' || status === 'completed' || status === 'done') && 
              task.status !== 'Completed' && task.status !== 'completed' && task.status !== 'done') {
            dispatch(taskCompleted());
            dispatch(updateStreak());
          }
          return { ...task, status };
        }
        return task;
      })
    );
  };

  const resolveTask = (id: string, resolvedBy?: string, resolutionNote?: string) => {
    const resolvedAt = new Date().toISOString();
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          // Track achievement when task is resolved
          if (task.status !== 'resolved') {
            dispatch(taskCompleted());
            dispatch(updateStreak());
          }
          return {
            ...task,
            status: 'resolved',
            metadata: {
              ...task.metadata,
              resolvedBy: resolvedBy || task.metadata?.resolvedBy || 'system',
              resolvedAt,
              resolutionNote: resolutionNote || task.metadata?.resolutionNote
            }
          };
        }
        return task;
      })
    );
  };

  const updateTaskAssignment = (id: string, assigneeId: string | null, teamId?: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              assigneeId,
              targetTeams: teamId ? [teamId] : task.targetTeams
            }
          : task
      )
    );
  };

  const clearAssignmentsForUser = (userId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.assigneeId === userId ? { ...task, assigneeId: null } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    /* CAL-BUG-4 fix: clean up calendar event when task is removed */
    dispatch(unlinkFromCalendar({ relatedId: id, relatedType: 'task' }));
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const updateTask = (id: string, updates: Partial<GatekeeperTask>) => { /* W-FEAT-5 */
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      )
    );
    dispatch(updateTaskInSlice({ id, ...updates } as any)); /* ARCH-FIX-1: mirror to Redux */
  };

  const scopedTasks = useMemo(() => {
    if (!currentOrgId) return [];
    return tasks.filter((task) => task.orgId === currentOrgId);
  }, [currentOrgId, tasks]);

  const value = useMemo(
    () => ({
      tasks: scopedTasks,
      addTask,
      updateTask,
      updateTaskStatus,
      resolveTask,
      updateTaskAssignment,
      clearAssignmentsForUser,
      deleteTask
    }),
    [scopedTasks]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
};
