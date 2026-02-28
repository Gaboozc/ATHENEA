import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const useDataExport = () => {
  const auth = useSelector((state) => state.auth);
  const projects = useSelector((state) => state.projects);
  const organizations = useSelector((state) => state.organizations);
  const notes = useSelector((state) => state.notes);
  const calendar = useSelector((state) => state.calendar);
  const todos = useSelector((state) => state.todos);
  const payments = useSelector((state) => state.payments);
  const routines = useSelector((state) => state.routines);
  const budget = useSelector((state) => state.budget);
  const collaborators = useSelector((state) => state.collaborators);
  const workOrders = useSelector((state) => state.workOrders);
  const { tasks } = useTasks();

  /**
   * Export ALL data to JSON (for restore)
   */
  const exportToJSON = () => {
    const fullBackup = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data: {
        auth,
        projects,
        organizations,
        notes,
        calendar,
        todos,
        payments,
        routines,
        budget,
        collaborators,
        workOrders,
        tasks,
      },
    };

    const dataStr = JSON.stringify(fullBackup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `athenea-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    return true;
  };

  /**
   * Export ALL data to comprehensive PDF
   */
  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Helper to add new page if needed
    const checkPageBreak = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // Helper to add section header
    const addSectionHeader = (title) => {
      checkPageBreak(15);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin, yPos);
      yPos += 10;
      doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
    };

    // Title Page
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('ATHENEA', doc.internal.pageSize.width / 2, 40, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Complete Data Backup', doc.internal.pageSize.width / 2, 50, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, doc.internal.pageSize.width / 2, 60, { align: 'center' });
    
    // Add JSON backup instructions
    yPos = 80;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('IMPORTANT: Restore Instructions', margin, yPos);
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    const instructions = [
      '1. This PDF contains a complete backup of your data',
      '2. At the end of this document, you will find a JSON backup code',
      '3. To restore: Go to Settings > Import Data',
      '4. Copy the JSON code and paste it in the import field',
      '5. All your projects, tasks, notes, and data will be restored',
      '',
      'Keep this PDF safe - it contains ALL your work!'
    ];
    instructions.forEach((line) => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    doc.addPage();
    yPos = 20;

    // SUMMARY STATISTICS
    addSectionHeader('📊 Summary Statistics');
    doc.text(`Total Projects: ${projects.projects?.length || 0}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Tasks: ${tasks?.length || 0}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Notes: ${notes.notes?.length || 0}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Todos: ${todos.todos?.length || 0}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Payments: ${payments.payments?.length || 0}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Collaborators: ${collaborators.collaborators?.length || 0}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Work Orders: ${workOrders.workOrders?.length || 0}`, margin, yPos);
    yPos += 6;
    doc.text(`Total Calendar Events: ${calendar.events?.length || 0}`, margin, yPos);
    yPos += 12;

    // PROJECTS
    if (projects.projects && projects.projects.length > 0) {
      addSectionHeader('📋 Projects');
      
      projects.projects.forEach((project, index) => {
        checkPageBreak(40);
        
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${project.name || 'Untitled'}`, margin, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        
        if (project.clientName) {
          doc.text(`   Client: ${project.clientName}`, margin, yPos);
          yPos += 5;
        }
        if (project.status) {
          doc.text(`   Status: ${project.status}`, margin, yPos);
          yPos += 5;
        }
        if (project.startDate) {
          doc.text(`   Start: ${new Date(project.startDate).toLocaleDateString()}`, margin, yPos);
          yPos += 5;
        }
        if (project.endDate) {
          doc.text(`   End: ${new Date(project.endDate).toLocaleDateString()}`, margin, yPos);
          yPos += 5;
        }
        if (project.description) {
          const lines = doc.splitTextToSize(`   Description: ${project.description}`, doc.internal.pageSize.width - 2 * margin);
          lines.forEach(line => {
            checkPageBreak();
            doc.text(line, margin, yPos);
            yPos += 5;
          });
        }
        yPos += 3;
      });
    }

    // TASKS
    if (tasks && tasks.length > 0) {
      doc.addPage();
      yPos = 20;
      addSectionHeader('✓ Tasks');
      
      tasks.slice(0, 100).forEach((task, index) => {
        checkPageBreak(25);
        
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${task.title || 'Untitled'}`, margin, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        
        doc.text(`   Level: ${task.level || 'N/A'} | Status: ${task.status || 'pending'}`, margin, yPos);
        yPos += 5;
        
        if (task.context) {
          const lines = doc.splitTextToSize(`   ${task.context}`, doc.internal.pageSize.width - 2 * margin);
          lines.slice(0, 3).forEach(line => {
            doc.text(line, margin, yPos);
            yPos += 5;
          });
        }
        yPos += 2;
      });
      
      if (tasks.length > 100) {
        doc.text(`... and ${tasks.length - 100} more tasks`, margin, yPos);
        yPos += 8;
      }
    }

    // NOTES
    if (notes.notes && notes.notes.length > 0) {
      doc.addPage();
      yPos = 20;
      addSectionHeader('📝 Notes');
      
      notes.notes.forEach((note, index) => {
        checkPageBreak(30);
        
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${note.title || 'Untitled'}`, margin, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        
        if (note.content) {
          const lines = doc.splitTextToSize(note.content, doc.internal.pageSize.width - 2 * margin);
          lines.slice(0, 5).forEach(line => {
            checkPageBreak();
            doc.text(line, margin, yPos);
            yPos += 5;
          });
        }
        
        if (note.tags && note.tags.length > 0) {
          doc.text(`   Tags: ${note.tags.join(', ')}`, margin, yPos);
          yPos += 5;
        }
        yPos += 3;
      });
    }

    // TODOS
    if (todos.todos && todos.todos.length > 0) {
      doc.addPage();
      yPos = 20;
      addSectionHeader('☑ Todos');
      
      todos.todos.forEach((todo, index) => {
        checkPageBreak(15);
        
        const checkbox = todo.status === 'done' ? '☑' : '☐';
        doc.text(`${checkbox} ${todo.title || 'Untitled'}`, margin, yPos);
        yPos += 6;
      });
    }

    // PAYMENTS
    if (payments.payments && payments.payments.length > 0) {
      doc.addPage();
      yPos = 20;
      addSectionHeader('💰 Payments');
      
      payments.payments.forEach((payment, index) => {
        checkPageBreak(20);
        
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${payment.name || 'Untitled'}`, margin, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        
        doc.text(`   Amount: ${payment.currency} ${payment.amount}`, margin, yPos);
        yPos += 5;
        doc.text(`   Frequency: ${payment.frequency}`, margin, yPos);
        yPos += 5;
        if (payment.nextDueDate) {
          doc.text(`   Next Due: ${new Date(payment.nextDueDate).toLocaleDateString()}`, margin, yPos);
          yPos += 5;
        }
        yPos += 2;
      });
    }

    // COLLABORATORS
    if (collaborators.collaborators && collaborators.collaborators.length > 0) {
      doc.addPage();
      yPos = 20;
      addSectionHeader('👥 Collaborators');
      
      collaborators.collaborators.forEach((collab, index) => {
        checkPageBreak(20);
        
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${collab.name || 'Untitled'}`, margin, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        
        if (collab.email) {
          doc.text(`   Email: ${collab.email}`, margin, yPos);
          yPos += 5;
        }
        if (collab.phone) {
          doc.text(`   Phone: ${collab.phone}`, margin, yPos);
          yPos += 5;
        }
        if (collab.role) {
          doc.text(`   Role: ${collab.role}`, margin, yPos);
          yPos += 5;
        }
        yPos += 2;
      });
    }

    // CALENDAR EVENTS
    if (calendar.events && calendar.events.length > 0) {
      doc.addPage();
      yPos = 20;
      addSectionHeader('📅 Calendar Events');
      
      calendar.events.forEach((event, index) => {
        checkPageBreak(20);
        
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. ${event.title || 'Untitled'}`, margin, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        
        if (event.startDate) {
          doc.text(`   Date: ${new Date(event.startDate).toLocaleDateString()}`, margin, yPos);
          yPos += 5;
        }
        if (event.type) {
          doc.text(`   Type: ${event.type}`, margin, yPos);
          yPos += 5;
        }
        yPos += 2;
      });
    }

    // JSON BACKUP SECTION
    doc.addPage();
    yPos = 20;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('🔐 JSON BACKUP CODE', margin, yPos);
    yPos += 10;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Copy the entire JSON code below to restore your data:', margin, yPos);
    yPos += 8;

    // Add JSON backup (compressed)
    const fullBackup = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data: {
        auth,
        projects,
        organizations,
        notes,
        calendar,
        todos,
        payments,
        routines,
        budget,
        collaborators,
        workOrders,
        tasks,
      },
    };

    const jsonString = JSON.stringify(fullBackup);
    doc.setFontSize(6);
    const jsonLines = doc.splitTextToSize(jsonString, doc.internal.pageSize.width - 2 * margin);
    
    jsonLines.forEach((line) => {
      checkPageBreak(4);
      doc.text(line, margin, yPos);
      yPos += 3.5;
    });

    // Save PDF
    doc.save(`athenea-complete-backup-${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  };

  /**
   * Import data from JSON backup
   */
  const importFromJSON = (jsonString) => {
    try {
      const backup = JSON.parse(jsonString);
      
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup format');
      }

      // Return the data to be dispatched by the component
      return {
        success: true,
        data: backup.data,
        version: backup.version,
        exportDate: backup.exportDate,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  };

  return {
    exportToJSON,
    exportToPDF,
    importFromJSON,
  };
};
