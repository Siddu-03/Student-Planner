// Calendar functionality
class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.events = JSON.parse(localStorage.getItem('calendar-events') || '[]');
    this.selectedDate = null;
    
    this.initializeCalendar();
    this.bindEvents();
  }

  initializeCalendar() {
    this.renderCalendar();
    this.updateMonthYear();
  }

  bindEvents() {
    // Navigation buttons
    document.getElementById('prev-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
      this.updateMonthYear();
    });

    document.getElementById('next-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
      this.updateMonthYear();
    });

    // Event form
    document.getElementById('event-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addEvent();
    });

    // Modal controls
    document.querySelector('#event-modal .close-modal').addEventListener('click', () => {
      this.closeEventModal();
    });

    document.querySelector('#event-modal .btn-cancel').addEventListener('click', () => {
      this.closeEventModal();
    });

    // Close modal on outside click
    document.getElementById('event-modal').addEventListener('click', (e) => {
      if (e.target.id === 'event-modal') {
        this.closeEventModal();
      }
    });
  }

  renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // Create calendar header
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-header-row';
    
    daysOfWeek.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      headerRow.appendChild(dayHeader);
    });
    calendar.appendChild(headerRow);

    // Get first day of month and number of days
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Create calendar grid
    const today = new Date();
    let currentWeek = document.createElement('div');
    currentWeek.className = 'calendar-week';

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);

      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      
      // Add classes for styling
      if (cellDate.getMonth() !== this.currentDate.getMonth()) {
        dayCell.classList.add('other-month');
      }
      
      if (this.isSameDate(cellDate, today)) {
        dayCell.classList.add('today');
      }

      // Day number
      const dayNumber = document.createElement('div');
      dayNumber.className = 'day-number';
      dayNumber.textContent = cellDate.getDate();
      dayCell.appendChild(dayNumber);

      // Events for this day
      const dayEvents = this.getEventsForDate(cellDate);
      if (dayEvents.length > 0) {
        dayCell.classList.add('has-events');
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';
        
        dayEvents.slice(0, 3).forEach(event => {
          const eventDot = document.createElement('div');
          eventDot.className = `event-dot event-${event.type}`;
          eventDot.title = event.title;
          eventsContainer.appendChild(eventDot);
        });

        if (dayEvents.length > 3) {
          const moreIndicator = document.createElement('div');
          moreIndicator.className = 'more-events';
          moreIndicator.textContent = `+${dayEvents.length - 3}`;
          eventsContainer.appendChild(moreIndicator);
        }

        dayCell.appendChild(eventsContainer);
      }

      // Click handler
      dayCell.addEventListener('click', () => {
        this.selectDate(cellDate);
      });

      currentWeek.appendChild(dayCell);

      // Start new week
      if ((i + 1) % 7 === 0) {
        calendar.appendChild(currentWeek);
        currentWeek = document.createElement('div');
        currentWeek.className = 'calendar-week';
      }
    }
  }

  updateMonthYear() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthYear = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    document.getElementById('current-month-year').textContent = monthYear;
  }

  selectDate(date) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });

    // Add selection to clicked day
    event.currentTarget.classList.add('selected');
    
    this.selectedDate = new Date(date);
    this.openEventModal(date);
  }

  openEventModal(date) {
    const modal = document.getElementById('event-modal');
    const dateInput = document.getElementById('event-date');
    
    if (date) {
      dateInput.value = this.formatDateForInput(date);
    }
    
    modal.style.display = 'block';
    document.getElementById('event-title').focus();
  }

  closeEventModal() {
    const modal = document.getElementById('event-modal');
    modal.style.display = 'none';
    document.getElementById('event-form').reset();
  }

  addEvent() {
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const type = document.getElementById('event-type').value;
    const description = document.getElementById('event-description').value;

    const newEvent = {
      id: Date.now(),
      title,
      date,
      time,
      type,
      description,
      createdAt: new Date().toISOString()
    };

    this.events.push(newEvent);
    this.saveEvents();
    this.renderCalendar();
    this.closeEventModal();
    
    this.showNotification('Event added successfully!', 'success');
  }

  getEventsForDate(date) {
    const dateStr = this.formatDateForInput(date);
    return this.events.filter(event => event.date === dateStr);
  }

  deleteEvent(eventId) {
    this.events = this.events.filter(event => event.id !== eventId);
    this.saveEvents();
    this.renderCalendar();
    this.showNotification('Event deleted successfully!', 'success');
  }

  saveEvents() {
    localStorage.setItem('calendar-events', JSON.stringify(this.events));
  }

  formatDateForInput(date) {
    return date.toISOString().split('T')[0];
  }

  isSameDate(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  showNotification(message, type = 'info') {
    // This will be implemented in the main app
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }

  // Get events for external use (dashboard, etc.)
  getUpcomingEvents(days = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= futureDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  getTodayEvents() {
    const today = this.formatDateForInput(new Date());
    return this.events
      .filter(event => event.date === today)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }
}

// Initialize calendar when DOM is loaded
let calendarManager;
document.addEventListener('DOMContentLoaded', () => {
  calendarManager = new CalendarManager();
});