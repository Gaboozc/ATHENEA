export const PRIORITY_LEVELS = [
  "Critical",
  "High Velocity",
  "Steady Flow",
  "Low Friction",
  "Backlog"
];

const PRIORITY_WEIGHTS: Record<string, number> = {
  Critical: 5,
  "High Velocity": 4,
  "Steady Flow": 3,
  "Low Friction": 2,
  Backlog: 1
};

const COMPLETED_STATUSES = new Set(["Completed", "Done", "Closed", "Resolved"]);

export const getPriorityDistribution = (tasks: any[]) => {
  const counts = PRIORITY_LEVELS.reduce((acc, level) => {
    acc[level] = tasks.filter((task) => task.level === level).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(1, ...Object.values(counts));
  return { counts, maxCount };
};

export const getSystemHealth = (tasks: any[]) => {
  if (tasks.length === 0) {
    return { healthScore: 0, status: "No Data" };
  }
  const weightedTotal = tasks.reduce(
    (sum, task) => sum + (PRIORITY_WEIGHTS[task.level] || 1),
    0
  );
  const density = weightedTotal / Math.max(1, tasks.length * 5);
  const healthScore = Math.max(0, Math.round(100 - density * 100));
  const status = healthScore > 80 ? "Stable" : healthScore > 55 ? "Elevated" : "Degraded";
  return { healthScore, status };
};

export const getProjectHealth = (projects: any[], tasks: any[]) =>
  projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    if (projectTasks.length === 0) {
      return {
        projectId: project.id,
        name: project.name,
        healthScore: 0,
        status: "No Data",
        totalTasks: 0
      };
    }
    const weightedTotal = projectTasks.reduce(
      (sum, task) => sum + (PRIORITY_WEIGHTS[task.level] || 1),
      0
    );
    const density = weightedTotal / Math.max(1, projectTasks.length * 5);
    const healthScore = Math.max(0, Math.round(100 - density * 100));
    const status = healthScore > 80 ? "Stable" : healthScore > 55 ? "Elevated" : "Degraded";
    return {
      projectId: project.id,
      name: project.name,
      healthScore,
      status,
      totalTasks: projectTasks.length
    };
  });

export const getThroughput = (projects: any[], tasks: any[]) =>
  projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const completed = projectTasks.filter((task) => COMPLETED_STATUSES.has(task.status)).length;
    return {
      projectId: project.id,
      name: project.name,
      created: projectTasks.length,
      completed
    };
  });
