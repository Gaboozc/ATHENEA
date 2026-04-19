export const resetAllData = () => {
  localStorage.clear();
  sessionStorage.clear();
  console.log('ATHENEA: reset completo ejecutado');
};

export const exportDataBeforeReset = () => {
  const backup = {};
  Object.keys(localStorage).forEach((key) => {
    try {
      backup[key] = JSON.parse(localStorage.getItem(key));
    } catch {
      backup[key] = localStorage.getItem(key);
    }
  });
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `athenea-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
