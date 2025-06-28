// ===== Student Planner Pro: Main JS =====

class StudentPlannerApp {
  constructor() {
    this.views = ['dashboard', 'calendar', 'tasks', 'grades', 'notes'];
    this.currentView = 'dashboard';
    this.data = {
      tasks: JSON.parse(localStorage.getItem('planner_tasks')) || [],
      grades: JSON.parse(localStorage.getItem('planner_grades')) || [],
      notes: JSON.parse(localStorage.getItem('planner_notes')) || [],
      events: JSON.parse(localStorage.getItem('planner_events')) || []
    };
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupThemeToggle();
    this.setupModalLogic();
    this.showView(this.currentView);
  }

  setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = btn.dataset.view;
        this.showView(view);
      });
    });
  }

  showView(view) {
    this.views.forEach(v => {
      document.getElementById(`${v}-view`).classList.remove('active');
      document.querySelector(`.nav-btn[data-view="${v}"]`).classList.remove('active');
    });
    document.getElementById(`${view}-view`).classList.add('active');
    document.querySelector(`.nav-btn[data-view="${view}"]`).classList.add('active');
    this.currentView = view;
    
    switch(view) {
      case 'dashboard': this.loadDashboard(); break;
      case 'calendar': this.loadCalendar(); break;
      case 'tasks': this.loadTasks(); break;
      case 'grades': this.loadGrades(); break;
      case 'notes': this.loadNotes(); break;
    }
  }

  loadDashboard() {
    const dashboard = document.getElementById('dashboard-view');
    const today = new Date();
    const upcomingTasks = this.data.tasks.filter(task => 
      new Date(task.dueDate) >= today && !task.completed
    ).slice(0, 5);
    const recentGrades = this.data.grades.slice(-3);
    const todayEvents = this.data.events.filter(event => 
      new Date(event.date).toDateString() === today.toDateString()
    );

    dashboard.innerHTML = `
      <div class="dashboard-grid">
        <div class="card">
          <h2><i class="fas fa-chart-line"></i> Quick Stats</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">${this.data.tasks.filter(t => !t.completed).length}</div>
              <div class="stat-label">Pending Tasks</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${this.data.grades.length}</div>
              <div class="stat-label">Grades Recorded</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${this.data.notes.length}</div>
              <div class="stat-label">Notes</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${this.data.events.filter(e => new Date(e.date) >= today).length}</div>
              <div class="stat-label">Upcoming Events</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h2><i class="fas fa-tasks"></i> Upcoming Tasks</h2>
          ${upcomingTasks.length > 0 ? `
            <div class="task-list">
              ${upcomingTasks.map(task => `
                <div class="task-item ${task.priority}">
                  <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-due">Due: ${new Date(task.dueDate).toLocaleDateString()}</div>
                  </div>
                  <button class="btn-secondary btn-sm" onclick="studentPlannerApp.completeTask('${task.id}')">
                    <i class="fas fa-check"></i>
                  </button>
                </div>
              `).join('')}
            </div>
          ` : '<p class="empty-state">No upcoming tasks</p>'}
          <button class="btn-add" onclick="studentPlannerApp.showView('tasks')">
            <i class="fas fa-plus"></i> Add Task
          </button>
        </div>

        <div class="card">
          <h2><i class="fas fa-calendar-day"></i> Today's Events</h2>
          ${todayEvents.length > 0 ? `
            <div class="event-list">
              ${todayEvents.map(event => `
                <div class="event-item">
                  <div class="event-time">${event.time}</div>
                  <div class="event-title">${event.title}</div>
                </div>
              `).join('')}
            </div>
          ` : '<p class="empty-state">No events today</p>'}
          <button class="btn-add" onclick="studentPlannerApp.showView('calendar')">
            <i class="fas fa-plus"></i> Add Event
          </button>
        </div>

        <div class="card">
          <h2><i class="fas fa-chart-line"></i> Recent Grades</h2>
          ${recentGrades.length > 0 ? `
            <div class="grade-list">
              ${recentGrades.map(grade => `
                <div class="grade-item">
                  <div class="grade-subject">${grade.subject}</div>
                  <div class="grade-score">${grade.score}%</div>
                  <div class="grade-date">${new Date(grade.date).toLocaleDateString()}</div>
                </div>
              `).join('')}
            </div>
          ` : '<p class="empty-state">No grades recorded</p>'}
          <button class="btn-add" onclick="studentPlannerApp.showView('grades')">
            <i class="fas fa-plus"></i> Add Grade
          </button>
        </div>
      </div>
    `;
  }

  loadTasks() {
    const tasks = document.getElementById('tasks-view');
    const pendingTasks = this.data.tasks.filter(task => !task.completed);
    const completedTasks = this.data.tasks.filter(task => task.completed);
    
    tasks.innerHTML = `
      <div class="tasks-header">
        <h2><i class="fas fa-tasks"></i> Tasks</h2>
        <button class="btn-add" onclick="studentPlannerApp.showAddTaskModal()">
          <i class="fas fa-plus"></i> Add Task
        </button>
      </div>
      
      <div class="tasks-content">
        <div class="tasks-section">
          <h3>Pending Tasks (${pendingTasks.length})</h3>
          <div id="pending-tasks" class="task-list">
            ${pendingTasks.map(task => this.renderTaskItem(task)).join('')}
          </div>
        </div>
        
        <div class="tasks-section">
          <h3>Completed Tasks (${completedTasks.length})</h3>
          <div id="completed-tasks" class="task-list">
            ${completedTasks.map(task => this.renderTaskItem(task)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderTaskItem(task) {
    return `
      <div class="task-item ${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-checkbox">
          <input type="checkbox" ${task.completed ? 'checked' : ''} 
                 onchange="studentPlannerApp.toggleTask('${task.id}')">
        </div>
        <div class="task-content">
          <div class="task-title">${task.title}</div>
          <div class="task-description">${task.description}</div>
          <div class="task-meta">
            <span class="task-due">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
            <span class="task-priority">${task.priority}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-danger btn-sm" onclick="studentPlannerApp.deleteTask('${task.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  loadGrades() {
    const grades = document.getElementById('grades-view');
    const averageGrade = this.data.grades.length > 0 ? 
      (this.data.grades.reduce((sum, grade) => sum + grade.score, 0) / this.data.grades.length).toFixed(1) : 0;
    
    grades.innerHTML = `
      <div class="grades-header">
        <h2><i class="fas fa-chart-line"></i> Grades</h2>
        <div class="grades-summary">
          <div class="grade-stat">
            <div class="stat-number">${averageGrade}%</div>
            <div class="stat-label">Average Grade</div>
          </div>
          <div class="grade-stat">
            <div class="stat-number">${this.data.grades.length}</div>
            <div class="stat-label">Total Grades</div>
          </div>
        </div>
        <button class="btn-add" onclick="studentPlannerApp.showAddGradeModal()">
          <i class="fas fa-plus"></i> Add Grade
        </button>
      </div>
      
      <div class="grades-content">
        <div class="grades-list">
          <h3>All Grades</h3>
          <div id="grades-list-container">
            ${this.data.grades.map(grade => this.renderGradeItem(grade)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderGradeItem(grade) {
    const gradeColor = grade.score >= 90 ? 'excellent' : grade.score >= 80 ? 'good' : grade.score >= 70 ? 'average' : 'poor';
    return `
      <div class="grade-item ${gradeColor}" data-id="${grade.id}">
        <div class="grade-subject">${grade.subject}</div>
        <div class="grade-score">${grade.score}%</div>
        <div class="grade-type">${grade.type}</div>
        <div class="grade-date">${new Date(grade.date).toLocaleDateString()}</div>
        <div class="grade-actions">
          <button class="btn-danger btn-sm" onclick="studentPlannerApp.deleteGrade('${grade.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  loadNotes() {
    const notes = document.getElementById('notes-view');
    
    notes.innerHTML = `
      <div class="notes-header">
        <h2><i class="fas fa-sticky-note"></i> Notes</h2>
        <div class="notes-controls">
          <input type="text" id="notes-search" placeholder="Search notes..." 
                 onkeyup="studentPlannerApp.searchNotes(this.value)">
        </div>
        <button class="btn-add" onclick="studentPlannerApp.showAddNoteModal()">
          <i class="fas fa-plus"></i> Add Note
        </button>
      </div>
      
      <div class="notes-grid" id="notes-grid">
        ${this.data.notes.map(note => this.renderNoteItem(note)).join('')}
      </div>
    `;
  }

  renderNoteItem(note) {
    return `
      <div class="note-item" data-id="${note.id}">
        <div class="note-header">
          <h3 class="note-title">${note.title}</h3>
          <div class="note-actions">
            <button class="btn-danger btn-sm" onclick="studentPlannerApp.deleteNote('${note.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="note-content">${note.content}</div>
        <div class="note-meta">
          <span class="note-subject">${note.subject}</span>
          <span class="note-date">${new Date(note.date).toLocaleDateString()}</span>
        </div>
      </div>
    `;
  }

  loadCalendar() {
    const calendar = document.getElementById('calendar-view');
    
    calendar.innerHTML = `
      <div class="calendar-header">
        <h2><i class="fas fa-calendar-alt"></i> Calendar</h2>
        <button class="btn-add" onclick="studentPlannerApp.showAddEventModal()">
          <i class="fas fa-plus"></i> Add Event
        </button>
      </div>
      
      <div class="upcoming-events">
        <h3>Upcoming Events</h3>
        <div id="events-list"></div>
      </div>
    `;
    
    this.renderEventsList();
  }

  renderEventsList() {
    const eventsList = document.getElementById('events-list');
    const upcomingEvents = this.data.events
      .filter(event => new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    eventsList.innerHTML = upcomingEvents.length > 0 ? 
      upcomingEvents.map(event => `
        <div class="event-item">
          <div class="event-date">${new Date(event.date).toLocaleDateString()}</div>
          <div class="event-time">${event.time}</div>
          <div class="event-title">${event.title}</div>
          <div class="event-actions">
            <button class="btn-danger btn-sm" onclick="studentPlannerApp.deleteEvent('${event.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('') : '<p class="empty-state">No upcoming events</p>';
  }

  showAddTaskModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>Add New Task</h3>
        <button class="close-modal" onclick="studentPlannerApp.closeModal()">×</button>
      </div>
      <form onsubmit="studentPlannerApp.addTask(event)">
        <div class="form-group">
          <label>Title</label>
          <input type="text" name="title" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea name="description" rows="3"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" name="dueDate" required>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select name="priority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="studentPlannerApp.closeModal()">Cancel</button>
          <button type="submit" class="btn-save">Save Task</button>
        </div>
      </form>
    `;
    this.openModal(modalContent);
  }

  showAddEventModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>Add New Event</h3>
        <button class="close-modal" onclick="studentPlannerApp.closeModal()">×</button>
      </div>
      <form onsubmit="studentPlannerApp.addEvent(event)">
        <div class="form-group">
          <label>Event Title</label>
          <input type="text" name="title" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" name="date" required>
          </div>
          <div class="form-group">
            <label>Time</label>
            <input type="time" name="time" required>
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea name="description" rows="3"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="studentPlannerApp.closeModal()">Cancel</button>
          <button type="submit" class="btn-save">Save Event</button>
        </div>
      </form>
    `;
    this.openModal(modalContent);
  }

  showAddGradeModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>Add New Grade</h3>
        <button class="close-modal" onclick="studentPlannerApp.closeModal()">×</button>
      </div>
      <form onsubmit="studentPlannerApp.addGrade(event)">
        <div class="form-group">
          <label>Subject</label>
          <input type="text" name="subject" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Score (%)</label>
            <input type="number" name="score" min="0" max="100" required>
          </div>
          <div class="form-group">
            <label>Type</label>
            <select name="type">
              <option value="Assignment">Assignment</option>
              <option value="Quiz">Quiz</option>
              <option value="Test">Test</option>
              <option value="Exam">Exam</option>
              <option value="Project">Project</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date" required>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="studentPlannerApp.closeModal()">Cancel</button>
          <button type="submit" class="btn-save">Save Grade</button>
        </div>
      </form>
    `;
    this.openModal(modalContent);
  }

  showAddNoteModal() {
    const modalContent = `
      <div class="modal-header">
        <h3>Add New Note</h3>
        <button class="close-modal" onclick="studentPlannerApp.closeModal()">×</button>
      </div>
      <form onsubmit="studentPlannerApp.addNote(event)">
        <div class="form-group">
          <label>Title</label>
          <input type="text" name="title" required>
        </div>
        <div class="form-group">
          <label>Subject</label>
          <input type="text" name="subject" required>
        </div>
        <div class="form-group">
          <label>Content</label>
          <textarea name="content" rows="8" required></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="studentPlannerApp.closeModal()">Cancel</button>
          <button type="submit" class="btn-save">Save Note</button>
        </div>
      </form>
    `;
    this.openModal(modalContent);
  }

  addTask(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const task = {
      id: Date.now().toString(),
      title: formData.get('title'),
      description: formData.get('description'),
      dueDate: formData.get('dueDate'),
      priority: formData.get('priority'),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    this.data.tasks.push(task);
    this.saveData('tasks');
    this.closeModal();
    this.showView('tasks');
    this.showNotification('Task added successfully!', 'success');
  }

  addEvent(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const calendarEvent = {
      id: Date.now().toString(),
      title: formData.get('title'),
      description: formData.get('description'),
      date: formData.get('date'),
      time: formData.get('time'),
      createdAt: new Date().toISOString()
    };
    
    this.data.events.push(calendarEvent);
    this.saveData('events');
    this.closeModal();
    this.showView('calendar');
    this.showNotification('Event added successfully!', 'success');
  }

  addGrade(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const grade = {
      id: Date.now().toString(),
      subject: formData.get('subject'),
      score: parseInt(formData.get('score')),
      type: formData.get('type'),
      date: formData.get('date'),
      createdAt: new Date().toISOString()
    };
    
    this.data.grades.push(grade);
    this.saveData('grades');
    this.closeModal();
    this.showView('grades');
    this.showNotification('Grade added successfully!', 'success');
  }

  addNote(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const note = {
      id: Date.now().toString(),
      title: formData.get('title'),
      subject: formData.get('subject'),
      content: formData.get('content'),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    this.data.notes.push(note);
    this.saveData('notes');
    this.closeModal();
    this.showView('notes');
    this.showNotification('Note added successfully!', 'success');
  }

  toggleTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveData('tasks');
      this.showView('tasks');
    }
  }

  completeTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = true;
      this.saveData('tasks');
      this.showView('dashboard');
      this.showNotification('Task completed!', 'success');
    }
  }

  deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
      this.saveData('tasks');
      this.showView('tasks');
      this.showNotification('Task deleted!', 'success');
    }
  }

  deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.data.events = this.data.events.filter(e => e.id !== eventId);
      this.saveData('events');
      this.showView('calendar');
      this.showNotification('Event deleted!', 'success');
    }
  }

  deleteGrade(gradeId) {
    if (confirm('Are you sure you want to delete this grade?')) {
      this.data.grades = this.data.grades.filter(g => g.id !== gradeId);
      this.saveData('grades');
      this.showView('grades');
      this.showNotification('Grade deleted!', 'success');
    }
  }

  deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
      this.data.notes = this.data.notes.filter(n => n.id !== noteId);
      this.saveData('notes');
      this.showView('notes');
      this.showNotification('Note deleted!', 'success');
    }
  }

  searchNotes(query) {
    const notesGrid = document.getElementById('notes-grid');
    const filteredNotes = this.data.notes.filter(note => 
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase()) ||
      note.subject.toLowerCase().includes(query.toLowerCase())
    );
    
    notesGrid.innerHTML = filteredNotes.map(note => this.renderNoteItem(note)).join('');
  }

  saveData(type) {
    localStorage.setItem(`planner_${type}`, JSON.stringify(this.data[type]));
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
      <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.getElementById('notification-container').appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      themeToggle.classList.toggle('active');
    });
  }

  setupModalLogic() {
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalContent = document.getElementById('modal-content');
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    settingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('active');
    });
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) settingsModal.classList.remove('active');
    });
  }

  openModal(contentHtml) {
    this.modalContent.innerHTML = contentHtml;
    this.modalOverlay.classList.add('active');
    this.modalOverlay.classList.remove('hidden');
  }

  closeModal() {
    this.modalOverlay.classList.remove('active');
    this.modalOverlay.classList.add('hidden');
    this.modalContent.innerHTML = '';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.studentPlannerApp = new StudentPlannerApp();
}); 