// Timetable functionality
class TimetableManager {
  constructor() {
    this.schedule = JSON.parse(localStorage.getItem('student-schedule') || '{}');
    this.selectedCell = null;
    
    this.initializeTimetable();
    this.bindEvents();
  }

  initializeTimetable() {
    this.renderSchedule();
  }

  bindEvents() {
    // Add class button
    document.getElementById('add-class-btn').addEventListener('click', () => {
      this.showAddClassModal();
    });

    // Schedule cell clicks
    document.querySelectorAll('.schedule-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        this.selectCell(e.target);
      });

      cell.addEventListener('dblclick', (e) => {
        this.editClass(e.target);
      });
    });

    // Context menu for schedule cells
    document.querySelectorAll('.schedule-cell').forEach(cell => {
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showContextMenu(e, cell);
      });
    });
  }

  selectCell(cell) {
    // Remove previous selection
    document.querySelectorAll('.schedule-cell.selected').forEach(selected => {
      selected.classList.remove('selected');
    });

    // Select current cell
    cell.classList.add('selected');
    this.selectedCell = cell;
  }

  editClass(cell) {
    const day = parseInt(cell.dataset.day);
    const time = cell.dataset.time;
    const scheduleKey = `${day}-${time}`;
    const existingClass = this.schedule[scheduleKey];

    if (existingClass) {
      this.showEditClassModal(existingClass, scheduleKey);
    } else {
      this.showAddClassModal(day, time);
    }
  }

  showAddClassModal(presetDay = null, presetTime = null) {
    const modal = this.createClassModal('Add Class', {
      day: presetDay,
      time: presetTime,
      subject: '',
      room: '',
      instructor: '',
      color: '#3b82f6'
    });

    document.body.appendChild(modal);
  }

  showEditClassModal(classData, scheduleKey) {
    const modal = this.createClassModal('Edit Class', classData, scheduleKey);
    document.body.appendChild(modal);
  }

  createClassModal(title, data, scheduleKey = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'class-modal';
    modal.style.display = 'block';

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeOptions = this.generateTimeOptions();

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="close-modal">&times;</button>
        </div>
        <form id="class-form">
          <div class="form-group">
            <label for="class-subject">Subject:</label>
            <input type="text" id="class-subject" value="${data.subject || ''}" required>
          </div>
          <div class="form-group">
            <label for="class-day">Day:</label>
            <select id="class-day" required>
              ${dayNames.map((day, index) => 
                `<option value="${index}" ${data.day === index ? 'selected' : ''}>${day}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="class-time">Time:</label>
            <select id="class-time" required>
              ${timeOptions.map(time => 
                `<option value="${time}" ${data.time === time ? 'selected' : ''}>${this.formatTimeDisplay(time)}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="class-room">Room:</label>
            <input type="text" id="class-room" value="${data.room || ''}" placeholder="Room number or location">
          </div>
          <div class="form-group">
            <label for="class-instructor">Instructor:</label>
            <input type="text" id="class-instructor" value="${data.instructor || ''}" placeholder="Instructor name">
          </div>
          <div class="form-group">
            <label for="class-color">Color:</label>
            <input type="color" id="class-color" value="${data.color || '#3b82f6'}">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel">Cancel</button>
            ${scheduleKey ? '<button type="button" class="btn-danger" id="delete-class-btn">Delete</button>' : ''}
            <button type="submit" class="btn-save">Save Class</button>
          </div>
        </form>
      </div>
    `;

    // Bind modal events
    modal.querySelector('.close-modal').addEventListener('click', () => {
      this.closeModal(modal);
    });

    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      this.closeModal(modal);
    });

    if (scheduleKey) {
      modal.querySelector('#delete-class-btn').addEventListener('click', () => {
        this.deleteClass(scheduleKey);
        this.closeModal(modal);
      });
    }

    modal.querySelector('#class-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveClass(modal, scheduleKey);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    return modal;
  }

  saveClass(modal, existingKey = null) {
    const formData = {
      subject: modal.querySelector('#class-subject').value.trim(),
      day: parseInt(modal.querySelector('#class-day').value),
      time: modal.querySelector('#class-time').value,
      room: modal.querySelector('#class-room').value.trim(),
      instructor: modal.querySelector('#class-instructor').value.trim(),
      color: modal.querySelector('#class-color').value
    };

    if (!formData.subject) {
      this.showNotification('Subject is required!', 'error');
      return;
    }

    const newKey = `${formData.day}-${formData.time}`;

    // If editing and the time/day changed, remove old entry
    if (existingKey && existingKey !== newKey) {
      delete this.schedule[existingKey];
    }

    // Check for conflicts (only if it's a new class or time/day changed)
    if (!existingKey || existingKey !== newKey) {
      if (this.schedule[newKey]) {
        this.showNotification('There is already a class scheduled at this time!', 'error');
        return;
      }
    }

    this.schedule[newKey] = formData;
    this.saveSchedule();
    this.renderSchedule();
    this.closeModal(modal);
    
    const message = existingKey ? 'Class updated successfully!' : 'Class added successfully!';
    this.showNotification(message, 'success');
  }

  deleteClass(scheduleKey) {
    if (confirm('Are you sure you want to delete this class?')) {
      delete this.schedule[scheduleKey];
      this.saveSchedule();
      this.renderSchedule();
      this.showNotification('Class deleted successfully!', 'success');
    }
  }

  renderSchedule() {
    // Clear existing schedule
    document.querySelectorAll('.schedule-cell').forEach(cell => {
      cell.innerHTML = '';
      cell.className = 'schedule-cell';
      cell.style.backgroundColor = '';
    });

    // Render scheduled classes
    Object.entries(this.schedule).forEach(([key, classData]) => {
      const cell = document.querySelector(`[data-day="${classData.day}"][data-time="${classData.time}"]`);
      if (cell) {
        cell.innerHTML = `
          <div class="class-info">
            <div class="subject-name">${classData.subject}</div>
            ${classData.room ? `<div class="room-info">${classData.room}</div>` : ''}
            ${classData.instructor ? `<div class="instructor-info">${classData.instructor}</div>` : ''}
          </div>
        `;
        cell.classList.add('has-class');
        cell.style.backgroundColor = classData.color + '20'; // Add transparency
        cell.style.borderLeft = `4px solid ${classData.color}`;
      }
    });
  }

  generateTimeOptions() {
    const times = [];
    for (let hour = 8; hour <= 17; hour++) {
      const time24 = `${hour.toString().padStart(2, '0')}:00`;
      times.push(time24);
    }
    return times;
  }

  formatTimeDisplay(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  showContextMenu(event, cell) {
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const day = parseInt(cell.dataset.day);
    const time = cell.dataset.time;
    const scheduleKey = `${day}-${time}`;
    const hasClass = this.schedule[scheduleKey];

    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';

    const menuItems = [];
    
    if (hasClass) {
      menuItems.push(
        `<div class="context-menu-item" data-action="edit">
          <i class="fas fa-edit"></i> Edit Class
        </div>`,
        `<div class="context-menu-item" data-action="delete">
          <i class="fas fa-trash"></i> Delete Class
        </div>`
      );
    } else {
      menuItems.push(
        `<div class="context-menu-item" data-action="add">
          <i class="fas fa-plus"></i> Add Class
        </div>`
      );
    }

    contextMenu.innerHTML = menuItems.join('');
    document.body.appendChild(contextMenu);

    // Handle menu item clicks
    contextMenu.addEventListener('click', (e) => {
      const action = e.target.closest('.context-menu-item')?.dataset.action;
      
      switch (action) {
        case 'add':
          this.showAddClassModal(day, time);
          break;
        case 'edit':
          this.showEditClassModal(this.schedule[scheduleKey], scheduleKey);
          break;
        case 'delete':
          this.deleteClass(scheduleKey);
          break;
      }
      
      contextMenu.remove();
    });

    // Remove menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', () => {
        if (contextMenu.parentNode) {
          contextMenu.remove();
        }
      }, { once: true });
    }, 0);
  }

  closeModal(modal) {
    modal.remove();
  }

  saveSchedule() {
    localStorage.setItem('student-schedule', JSON.stringify(this.schedule));
  }

  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }

  // Get today's schedule for dashboard
  getTodaySchedule() {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const adjustedDay = today === 0 ? 6 : today - 1; // Convert to our 0-6 system (0 = Monday)
    
    return Object.entries(this.schedule)
      .filter(([key]) => key.startsWith(`${adjustedDay}-`))
      .map(([key, classData]) => ({
        ...classData,
        timeFormatted: this.formatTimeDisplay(classData.time)
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  // Get next class for dashboard
  getNextClass() {
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1; // Convert to our system
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find classes today that haven't started yet
    const todayClasses = Object.entries(this.schedule)
      .filter(([key]) => key.startsWith(`${currentDay}-`))
      .filter(([key, classData]) => classData.time > currentTime)
      .sort(([, a], [, b]) => a.time.localeCompare(b.time));

    if (todayClasses.length > 0) {
      const [, nextClass] = todayClasses[0];
      return {
        ...nextClass,
        timeFormatted: this.formatTimeDisplay(nextClass.time),
        isToday: true
      };
    }

    // If no more classes today, find tomorrow's first class
    const tomorrowDay = (currentDay + 1) % 7;
    const tomorrowClasses = Object.entries(this.schedule)
      .filter(([key]) => key.startsWith(`${tomorrowDay}-`))
      .sort(([, a], [, b]) => a.time.localeCompare(b.time));

    if (tomorrowClasses.length > 0) {
      const [, nextClass] = tomorrowClasses[0];
      return {
        ...nextClass,
        timeFormatted: this.formatTimeDisplay(nextClass.time),
        isToday: false
      };
    }

    return null;
  }

  // Export schedule data
  exportSchedule() {
    return {
      schedule: this.schedule,
      exportDate: new Date().toISOString()
    };
  }

  // Import schedule data
  importSchedule(data) {
    if (data.schedule && typeof data.schedule === 'object') {
      this.schedule = data.schedule;
      this.saveSchedule();
      this.renderSchedule();
      this.showNotification('Schedule imported successfully!', 'success');
    }
  }

  // Clear all schedule data
  clearSchedule() {
    if (confirm('Are you sure you want to clear your entire schedule? This action cannot be undone.')) {
      this.schedule = {};
      this.saveSchedule();
      this.renderSchedule();
      this.showNotification('Schedule cleared successfully!', 'success');
    }
  }
}

// Initialize timetable manager when DOM is loaded
let timetableManager;
document.addEventListener('DOMContentLoaded', () => {
  timetableManager = new TimetableManager();
});