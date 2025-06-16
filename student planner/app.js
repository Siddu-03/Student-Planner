// ===== MAIN APPLICATION LOGIC =====

class StudentPlannerApp {
  constructor() {
    this.currentView = 'dashboard';
    this.isDarkMode = false;
    this.data = {
      tasks: [],
      events: [],
      grades: [],
      notes: [],
      timetable: {},
      settings: {
        darkMode: false,
        animations: true,
        notifications: true,
        dailyReminders: true
      }
    };
    
    this.init();
  }

  init() {
    this.loadData();
    this.setupEventListeners();
    this.setupTheme();
    this.showView('dashboard');
    this.updateDashboard();
  }

  // ===== DATA MANAGEMENT =====
  loadData() {
    try {
      const savedData = JSON.parse(window.localStorage?.getItem('studentPlannerData')) || {};
      this.data = { ...this.data, ...savedData };
    } catch (error) {
      console.warn('Could not load saved data:', error);
      // Use in-memory storage as fallback
      this.data = {
        tasks: this.generateSampleTasks(),
        events: this.generateSampleEvents(),
        grades: this.generateSampleGrades(),
        notes: this.generateSampleNotes(),
        timetable: this.generateSampleTimetable(),
        settings: {
          darkMode: false,
          animations: true,
          notifications: true,
          dailyReminders: true
        }
      };
    }
  }

  saveData() {
    try {
      if (window.localStorage) {
        window.localStorage.setItem('studentPlannerData', JSON.stringify(this.data));
      }
    } catch (error) {
      console.warn('Could not save data:', error);
    }
  }

  // ===== SAMPLE DATA GENERATORS =====
  generateSampleTasks() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return [
      {
        id: 1,
        title: 'Complete Math Assignment',
        dueDate: tomorrow.toISOString().split('T')[0],
        priority: 'high',
        category: 'assignment',
        completed: false,
        createdAt: today.toISOString()
      },
      {
        id: 2,
        title: 'Study for Physics Exam',
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'high',
        category: 'study',
        completed: false,
        createdAt: today.toISOString()
      },
      {
        id: 3,
        title: 'Read Chapter 5 - History',
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        category: 'study',
        completed: true,
        createdAt: today.toISOString()
      }
    ];
  }

  generateSampleEvents() {
    const today = new Date();
    return [
      {
        id: 1,
        title: 'Math Exam',
        date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:00',
        type: 'exam',
        description: 'Final exam for Calculus I'
      },
      {
        id: 2,
        title: 'Project Presentation',
        date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '14:00',
        type: 'assignment',
        description: 'Present the final project'
      }
    ];
  }

  generateSampleGrades() {
    return [
      {
        id: 1,
        subject: 'Mathematics',
        grade: 85,
        credits: 3,
        date: '2024-05-15',
        type: 'midterm'
      },
      {
        id: 2,
        subject: 'Physics',
        grade: 92,
        credits: 4,
        date: '2024-05-20',
        type: 'assignment'
      },
      {
        id: 3,
        subject: 'English',
        grade: 88,
        credits: 3,
        date: '2024-05-18',
        type: 'quiz'
      }
    ];
  }

  generateSampleNotes() {
    return [
      {
        id: 1,
        title: 'Calculus Notes - Derivatives',
        subject: 'math',
        content: 'Key concepts about derivatives and their applications...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Physics - Newton\'s Laws',
        subject: 'science',
        content: 'Three fundamental laws of motion by Isaac Newton...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  generateSampleTimetable() {
    return {
      '1-09:00': { subject: 'Mathematics', room: 'Room 101', teacher: 'Dr. Smith' },
      '1-10:00': { subject: 'Physics', room: 'Lab 201', teacher: 'Prof. Johnson' },
      '2-09:00': { subject: 'English', room: 'Room 205', teacher: 'Ms. Brown' },
      '3-11:00': { subject: 'History', room: 'Room 301', teacher: 'Mr. Davis' }
    };
  }

  // ===== NAVIGATION =====
  setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.showView(view);
      });
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Settings modal
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModals = document.querySelectorAll('.close-modal');
    
    if (settingsBtn && settingsModal) {
      settingsBtn.addEventListener('click', () => this.openModal('settings-modal'));
    }

    closeModals.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.closeModal(modal.id);
      });
    });

    // Export functionality
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    // Settings form handlers
    this.setupSettingsHandlers();

    // Close modals on outside click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target.id);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
          this.closeModal(activeModal.id);
        }
      }
    });
  }

  showView(viewName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`)?.classList.add('active');

    this.currentView = viewName;

    // Update view-specific content
    switch (viewName) {
      case 'dashboard':
        this.updateDashboard();
        break;
      case 'calendar':
        if (window.calendarManager) {
          window.calendarManager.render();
        }
        break;
      case 'tasks':
        if (window.taskManager) {
          window.taskManager.render();
        }
        break;
      case 'grades':
        if (window.gradesManager) {
          window.gradesManager.render();
        }
        break;
      case 'notes':
        if (window.notesManager) {
          window.notesManager.render();
        }
        break;
    }
  }

  // ===== DASHBOARD UPDATES =====
  updateDashboard() {
    this.updateStats();
    this.updateTodaySchedule();
    this.updateUpcomingDeadlines();
    this.updateProgressChart();
  }

  updateStats() {
    const totalTasks = this.data.tasks.length;
    const completedTasks = this.data.tasks.filter(task => task.completed).length;
    const overdueTasks = this.data.tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return !task.completed && dueDate < today;
    }).length;
    
    const avgGrade = this.data.grades.length > 0 
      ? Math.round(this.data.grades.reduce((sum, grade) => sum + grade.grade, 0) / this.data.grades.length)
      : 0;

    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('overdue-tasks').textContent = overdueTasks;
    document.getElementById('avg-grade').textContent = avgGrade;
  }

  updateTodaySchedule() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayEvents = this.data.events.filter(event => event.date === todayStr);
    
    const scheduleContainer = document.getElementById('today-schedule');
    if (!scheduleContainer) return;

    if (todayEvents.length === 0) {
      scheduleContainer.innerHTML = '<p class="text-muted">No events scheduled for today</p>';
      return;
    }

    scheduleContainer.innerHTML = todayEvents.map(event => `
      <div class="schedule-item">
        <div class="schedule-time">${event.time}</div>
        <div class="schedule-content">
          <h4>${event.title}</h4>
          <p>${event.description || ''}</p>
        </div>
        <div class="schedule-type ${event.type}">${event.type}</div>
      </div>
    `).join('');
  }

  updateUpcomingDeadlines() {
    const today = new Date();
    const upcomingTasks = this.data.tasks
      .filter(task => !task.completed && new Date(task.dueDate) >= today)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    const deadlinesContainer = document.getElementById('upcoming-deadlines');
    if (!deadlinesContainer) return;

    if (upcomingTasks.length === 0) {
      deadlinesContainer.innerHTML = '<p class="text-muted">No upcoming deadlines</p>';
      return;
    }

    deadlinesContainer.innerHTML = upcomingTasks.map(task => {
      const dueDate = new Date(task.dueDate);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      return `
        <div class="deadline-item priority-${task.priority}">
          <div class="deadline-content">
            <h4>${task.title}</h4>
            <p>${task.category}</p>
          </div>
          <div class="deadline-time">
            <span class="days-until">${daysUntil}</span>
            <span class="days-label">days</span>
          </div>
        </div>
      `;
    }).join('');
  }

  updateProgressChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [65, 78, 90, 81, 87, 75, 82]; // Sample data

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up chart
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / days.length;
    const maxValue = Math.max(...data);

    // Draw bars
    ctx.fillStyle = '#3b82f6';
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * barWidth + barWidth * 0.2;
      const y = canvas.height - padding - barHeight;
      const width = barWidth * 0.6;

      ctx.fillRect(x, y, width, barHeight);
    });

    // Draw labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    days.forEach((day, index) => {
      const x = padding + index * barWidth + barWidth * 0.5;
      const y = canvas.height - 10;
      ctx.fillText(day, x, y);
    });
  }

  // ===== THEME MANAGEMENT =====
  setupTheme() {
    const savedTheme = this.data.settings.darkMode;
    if (savedTheme) {
      this.isDarkMode = true;
      document.documentElement.setAttribute('data-theme', 'dark');
      const themeIcon = document.querySelector('#theme-toggle i');
      if (themeIcon) {
        themeIcon.className = 'fas fa-sun';
      }
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const themeIcon = document.querySelector('#theme-toggle i');
    
    if (this.isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.className = 'fas fa-sun';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) themeIcon.className = 'fas fa-moon';
    }

    this.data.settings.darkMode = this.isDarkMode;
    this.saveData();
  }

  // ===== MODAL MANAGEMENT =====
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('no-scroll');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }
  }

  // ===== SETTINGS MANAGEMENT =====
  setupSettingsHandlers() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const animationsToggle = document.getElementById('animations-toggle');
    const deadlineNotifications = document.getElementById('deadline-notifications');
    const dailyReminders = document.getElementById('daily-reminders');

    if (darkModeToggle) {
      darkModeToggle.checked = this.data.settings.darkMode;
      darkModeToggle.addEventListener('change', () => {
        this.data.settings.darkMode = darkModeToggle.checked;
        if (darkModeToggle.checked !== this.isDarkMode) {
          this.toggleTheme();
        }
        this.saveData();
      });
    }

    if (animationsToggle) {
      animationsToggle.checked = this.data.settings.animations;
      animationsToggle.addEventListener('change', () => {
        this.data.settings.animations = animationsToggle.checked;
        document.documentElement.style.setProperty(
          '--transition-duration',
          animationsToggle.checked ? '0.2s' : '0s'
        );
        this.saveData();
      });
    }

    if (deadlineNotifications) {
      deadlineNotifications.checked = this.data.settings.notifications;
      deadlineNotifications.addEventListener('change', () => {
        this.data.settings.notifications = deadlineNotifications.checked;
        this.saveData();
      });
    }

    if (dailyReminders) {
      dailyReminders.checked = this.data.settings.dailyReminders;
      dailyReminders.addEventListener('change', () => {
        this.data.settings.dailyReminders = dailyReminders.checked;
        this.saveData();
      });
    }

    // Data management buttons
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataBtn = document.getElementById('import-data-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');

    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => this.exportData());
    }

    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => this.clearAllData());
    }
  }

  // ===== DATA EXPORT/IMPORT =====
  exportData() {
    const dataStr = JSON.stringify(this.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-planner-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification('Data exported successfully!', 'success');
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      this.data = {
        tasks: [],
        events: [],
        grades: [],
        notes: [],
        timetable: {},
        settings: {
          darkMode: false,
          animations: true,
          notifications: true,
          dailyReminders: true
        }
      };
      this.saveData();
      this.showNotification('All data cleared!', 'success');
      this.updateDashboard();
      this.closeModal('settings-modal');
    }
  }

  // ===== NOTIFICATIONS =====
  showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(notification);

    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });

    // Auto remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  // ===== UTILITY METHODS =====
  generateId() {
    return Math.max(...Object.values(this.data).flat().map(item => item.id || 0), 0) + 1;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(timeString) {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isOverdue(dateString) {
    return new Date(dateString) < new Date();
  }

  getDaysUntil(dateString) {
    const target = new Date(dateString);
    const today = new Date();
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// ===== INITIALIZE APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StudentPlannerApp();
  
  // Make app globally available for other modules
  window.plannerData = window.app.data;
  window.saveData = () => window.app.saveData();
  window.showNotification = (message, type, duration) => 
    window.app.showNotification(message, type, duration);
  window.generateId = () => window.app.generateId();
});