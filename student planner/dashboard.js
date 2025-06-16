// Dashboard Management System
class Dashboard {
  constructor() {
    this.progressChart = null;
    this.isInitialized = false;
    this.isUpdating = false; // Add flag to prevent recursive updates
    this.updateTimeout = null; // Debounce updates
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Initialize global data store if it doesn't exist
    if (!window.plannerData) {
      window.plannerData = {
        tasks: [
          {
            id: 1,
            text: "Complete Math Assignment",
            dueDate: "2025-06-16",
            priority: "high",
            category: "assignment",
            completed: false,
            createdDate: "2025-06-15T10:00:00Z"
          },
          {
            id: 2,
            text: "Study for History Exam",
            dueDate: "2025-06-18",
            priority: "medium",
            category: "study",
            completed: true,
            completedDate: "2025-06-15T15:30:00Z",
            createdDate: "2025-06-14T09:00:00Z"
          }
        ],
        grades: [
          {
            id: 1,
            subject: "Mathematics",
            value: 85,
            creditHours: 3,
            date: "2025-06-10",
            type: "midterm"
          },
          {
            id: 2,
            subject: "History",
            value: 92,
            creditHours: 3,
            date: "2025-06-12",
            type: "assignment"
          }
        ],
        events: [
          {
            id: 1,
            title: "Physics Lab",
            date: "2025-06-16",
            time: "14:00",
            eventType: "class",
            description: "Laboratory session for Physics 101"
          },
          {
            id: 2,
            title: "Chemistry Exam",
            date: "2025-06-17",
            time: "09:00",
            eventType: "exam",
            description: "Final exam for Chemistry"
          }
        ]
      };
    }

    this.bindEvents();
    this.debouncedUpdate();
    this.initProgressChart();
    this.isInitialized = true;
  }

  bindEvents() {
    // Use event delegation and prevent duplicate listeners
    if (this.eventsbound) return;
    this.eventsbound = true;

    // Refresh dashboard when switching to dashboard view
    document.addEventListener('viewChanged', (e) => {
      if (e.detail && e.detail.view === 'dashboard') {
        this.debouncedUpdate();
      }
    }, { once: false, passive: true });

    // Listen for data changes from other modules with debouncing
    document.addEventListener('tasksUpdated', () => {
      this.debouncedUpdate();
    }, { once: false, passive: true });

    document.addEventListener('gradesUpdated', () => {
      this.debouncedUpdateStats();
    }, { once: false, passive: true });

    document.addEventListener('eventsUpdated', () => {
      this.debouncedUpdateSchedule();
    }, { once: false, passive: true });
  }

  // Debounced update methods to prevent rapid-fire updates
  debouncedUpdate() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(() => {
      if (!this.isUpdating) {
        this.updateDashboard();
      }
    }, 100);
  }

  debouncedUpdateStats() {
    if (this.statsTimeout) {
      clearTimeout(this.statsTimeout);
    }
    
    this.statsTimeout = setTimeout(() => {
      if (!this.isUpdating) {
        this.updateStats();
      }
    }, 100);
  }

  debouncedUpdateSchedule() {
    if (this.scheduleTimeout) {
      clearTimeout(this.scheduleTimeout);
    }
    
    this.scheduleTimeout = setTimeout(() => {
      if (!this.isUpdating) {
        this.updateTodaySchedule();
        this.updateUpcomingDeadlines();
      }
    }, 100);
  }

  updateDashboard() {
    // Prevent recursive updates
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      this.updateStats();
      this.updateTodaySchedule();
      this.updateUpcomingDeadlines();
      this.updateProgressChart();
    } catch (error) {
      console.error('Error updating dashboard:', error);
    } finally {
      // Always reset the flag
      this.isUpdating = false;
    }
  }

  updateStats() {
    if (this.isUpdating && this.statsUpdating) return;
    this.statsUpdating = true;

    try {
      const tasks = this.getTasks();
      const grades = this.getGrades();
      
      // Calculate task statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const overdueTasks = tasks.filter(task => 
        !task.completed && new Date(task.dueDate) < new Date()
      ).length;
      
      // Calculate average grade
      const avgGrade = grades.length > 0 
        ? Math.round(grades.reduce((sum, grade) => sum + grade.value, 0) / grades.length)
        : 0;

      // Update DOM elements safely with requestAnimationFrame
      requestAnimationFrame(() => {
        this.updateStatElement('total-tasks', totalTasks);
        this.updateStatElement('completed-tasks', completedTasks);
        this.updateStatElement('overdue-tasks', overdueTasks);
        this.updateStatElement('avg-grade', avgGrade);
      });
    } catch (error) {
      console.error('Error updating stats:', error);
    } finally {
      this.statsUpdating = false;
    }
  }

  updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element && element.textContent !== (typeof value === 'number' && id === 'avg-grade' ? value + '%' : value.toString())) {
      element.textContent = typeof value === 'number' && id === 'avg-grade' ? value + '%' : value;
    }
  }

  updateTodaySchedule() {
    const scheduleContainer = document.getElementById('today-schedule');
    if (!scheduleContainer) return;

    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const events = this.getEvents().filter(event => 
        event.date === todayStr
      );
      
      const tasks = this.getTasks().filter(task => 
        task.dueDate === todayStr && !task.completed
      );
      
      // Combine and sort events and tasks by time
      const scheduleItems = [
        ...events.map(event => ({
          ...event,
          type: 'event',
          time: event.time || '00:00'
        })),
        ...tasks.map(task => ({
          ...task,
          type: 'task',
          time: '23:59',
          title: task.text
        }))
      ].sort((a, b) => a.time.localeCompare(b.time));
      
      const newContent = scheduleItems.length === 0 
        ? `<div class="empty-state" style="text-align: center; padding: 20px; color: #6b7280;">
             <i class="fas fa-calendar-check" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
             <p>No events or tasks scheduled for today</p>
           </div>`
        : scheduleItems.map(item => `
            <div class="schedule-item" style="display: flex; align-items: center; padding: 12px; margin: 8px 0; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div class="schedule-time" style="min-width: 80px; font-weight: 600; color: #4f46e5;">${this.formatTime(item.time)}</div>
              <div class="schedule-content" style="flex: 1; margin-left: 12px;">
                <div class="schedule-title" style="font-weight: 600; margin-bottom: 4px;">${item.title}</div>
                ${item.description ? `<div class="schedule-description" style="font-size: 0.9rem; color: #6b7280;">${item.description}</div>` : ''}
                <div class="schedule-meta" style="margin-top: 4px;">
                  <span class="schedule-type" style="background: #f3f4f6; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${item.type === 'event' ? item.eventType || 'Event' : 'Task'}</span>
                  ${item.priority ? `<span class="priority-badge" style="background: ${this.getPriorityColor(item.priority)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 8px;">${item.priority}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('');

      // Only update if content has changed
      if (scheduleContainer.innerHTML !== newContent) {
        scheduleContainer.innerHTML = newContent;
      }
    } catch (error) {
      console.error('Error updating today schedule:', error);
    }
  }

  updateUpcomingDeadlines() {
    const deadlinesContainer = document.getElementById('upcoming-deadlines');
    if (!deadlinesContainer) return;

    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const tasks = this.getTasks().filter(task => {
        if (task.completed) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= nextWeek;
      });
      
      const events = this.getEvents().filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= nextWeek && 
               (event.eventType === 'assignment' || event.eventType === 'exam');
      });
      
      const deadlines = [
        ...tasks.map(task => ({
          ...task,
          type: 'task',
          title: task.text,
          date: task.dueDate
        })),
        ...events.map(event => ({
          ...event,
          type: 'event'
        }))
      ].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const newContent = deadlines.length === 0 
        ? `<div class="empty-state" style="text-align: center; padding: 20px; color: #6b7280;">
             <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
             <p>No upcoming deadlines this week</p>
           </div>`
        : deadlines.slice(0, 5).map(deadline => `
            <div class="deadline-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin: 8px 0; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div class="deadline-content">
                <div class="deadline-title" style="font-weight: 600; margin-bottom: 4px;">${deadline.title}</div>
                <div class="deadline-meta">
                  <span class="deadline-date" style="color: #6b7280; font-size: 0.9rem;">${this.formatRelativeDate(deadline.date)}</span>
                  ${deadline.priority ? `<span class="priority-badge" style="background: ${this.getPriorityColor(deadline.priority)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 8px;">${deadline.priority}</span>` : ''}
                </div>
              </div>
              <div class="deadline-countdown" style="background: #f3f4f6; padding: 8px 12px; border-radius: 8px; font-weight: 600; color: #4f46e5;">
                ${this.getDaysUntil(deadline.date)} days
              </div>
            </div>
          `).join('');

      // Only update if content has changed
      if (deadlinesContainer.innerHTML !== newContent) {
        deadlinesContainer.innerHTML = newContent;
      }
    } catch (error) {
      console.error('Error updating upcoming deadlines:', error);
    }
  }

  initProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx || this.progressChart) return;
    
    try {
      this.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.getWeekLabels(),
          datasets: [{
            label: 'Tasks Completed',
            data: this.getWeeklyCompletionData(),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }, {
            label: 'Tasks Added',
            data: this.getWeeklyTaskData(),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false, // Disable animations to prevent issues
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            x: {
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }

  updateProgressChart() {
    if (!this.progressChart || this.chartUpdating) return;
    this.chartUpdating = true;
    
    try {
      const newLabels = this.getWeekLabels();
      const newCompletionData = this.getWeeklyCompletionData();
      const newTaskData = this.getWeeklyTaskData();

      // Only update if data has actually changed
      const labelsChanged = JSON.stringify(this.progressChart.data.labels) !== JSON.stringify(newLabels);
      const completionDataChanged = JSON.stringify(this.progressChart.data.datasets[0].data) !== JSON.stringify(newCompletionData);
      const taskDataChanged = JSON.stringify(this.progressChart.data.datasets[1].data) !== JSON.stringify(newTaskData);

      if (labelsChanged || completionDataChanged || taskDataChanged) {
        this.progressChart.data.labels = newLabels;
        this.progressChart.data.datasets[0].data = newCompletionData;
        this.progressChart.data.datasets[1].data = newTaskData;
        this.progressChart.update('none');
      }
    } catch (error) {
      console.error('Error updating chart:', error);
    } finally {
      this.chartUpdating = false;
    }
  }

  getWeekLabels() {
    const labels = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    
    return labels;
  }

  getWeeklyCompletionData() {
    const data = [];
    const today = new Date();
    const tasks = this.getTasks();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const completedCount = tasks.filter(task => 
        task.completed && 
        task.completedDate && 
        task.completedDate.split('T')[0] === dateStr
      ).length;
      
      data.push(completedCount);
    }
    
    return data;
  }

  getWeeklyTaskData() {
    const data = [];
    const today = new Date();
    const tasks = this.getTasks();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const addedCount = tasks.filter(task => 
        task.createdDate && 
        task.createdDate.split('T')[0] === dateStr
      ).length;
      
      data.push(addedCount);
    }
    
    return data;
  }

  // Utility methods for data access
  getTasks() {
    return (window.plannerData && window.plannerData.tasks) ? window.plannerData.tasks : [];
  }

  getGrades() {
    return (window.plannerData && window.plannerData.grades) ? window.plannerData.grades : [];
  }

  getEvents() {
    return (window.plannerData && window.plannerData.events) ? window.plannerData.events : [];
  }

  // Utility formatting methods
  formatTime(timeStr) {
    if (!timeStr || timeStr === '23:59') return 'End of day';
    
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatRelativeDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  getDaysUntil(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  getPriorityColor(priority) {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }

  // Public methods for external access
  refresh() {
    this.debouncedUpdate();
  }

  getProductivityScore() {
    const tasks = this.getTasks();
    if (tasks.length === 0) return 0;
    
    const completed = tasks.filter(task => task.completed).length;
    const overdue = tasks.filter(task => 
      !task.completed && new Date(task.dueDate) < new Date()
    ).length;
    
    const completionRate = (completed / tasks.length) * 100;
    const overdueRate = (overdue / tasks.length) * 100;
    
    // Calculate productivity score (0-100)
    const score = Math.max(0, Math.min(100, completionRate - (overdueRate * 2)));
    
    return Math.round(score);
  }

  // Cleanup method
  destroy() {
    if (this.updateTimeout) clearTimeout(this.updateTimeout);
    if (this.statsTimeout) clearTimeout(this.statsTimeout);
    if (this.scheduleTimeout) clearTimeout(this.scheduleTimeout);
    if (this.progressChart) {
      this.progressChart.destroy();
      this.progressChart = null;
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure Chart.js is loaded
  setTimeout(() => {
    if (typeof Chart !== 'undefined') {
      if (window.dashboard) {
        window.dashboard.destroy();
      }
      window.dashboard = new Dashboard();
    } else {
      console.error('Chart.js not loaded');
    }
  }, 500);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.dashboard) {
    window.dashboard.destroy();
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dashboard;
}