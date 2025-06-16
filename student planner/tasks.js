// Task Management functionality
class TaskManager {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('student-tasks') || '[]');
    this.currentFilter = 'all';
    
    this.initializeTasks();
    this.bindEvents();
  }

  initializeTasks() {
    this.renderTasks();
    this.updateTaskStats();
    this.renderTaskChart();
  }

  bindEvents() {
    // Add task button
    document.getElementById('add-task-btn').addEventListener('click', () => {
      this.addTask();
    });

    // Enter key on task input
    document.getElementById('new-task-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addTask();
      }
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setFilter(e.target.dataset.filter);
      });
    });
  }

  addTask() {
    const taskInput = document.getElementById('new-task-input');
    const dueDateInput = document.getElementById('task-due-date');
    const prioritySelect = document.getElementById('task-priority');
    const categorySelect = document.getElementById('task-category');

    const taskText = taskInput.value.trim();
    if (!taskText) return;

    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      dueDate: dueDateInput.value || null,
      priority: prioritySelect.value,
      category: categorySelect.value,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.tasks.unshift(newTask);
    this.saveTasks();
    this.renderTasks();
    this.updateTaskStats();
    this.renderTaskChart();

    // Clear inputs
    taskInput.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'low';
    categorySelect.value = 'assignment';

    this.showNotification('Task added successfully!', 'success');
  }

  toggleTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      
      this.saveTasks();
      this.renderTasks();
      this.updateTaskStats();
      this.renderTaskChart();

      const message = task.completed ? 'Task completed!' : 'Task marked as pending';
      this.showNotification(message, 'success');
    }
  }

  deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.saveTasks();
      this.renderTasks();
      this.updateTaskStats();
      this.renderTaskChart();
      this.showNotification('Task deleted successfully!', 'success');
    }
  }

  editTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newText = prompt('Edit task:', task.text);
    if (newText && newText.trim()) {
      task.text = newText.trim();
      this.saveTasks();
      this.renderTasks();
      this.showNotification('Task updated successfully!', 'success');
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    this.renderTasks();
  }

  getFilteredTasks() {
    const now = new Date();
    
    switch (this.currentFilter) {
      case 'completed':
        return this.tasks.filter(task => task.completed);
      case 'pending':
        return this.tasks.filter(task => !task.completed);
      case 'overdue':
        return this.tasks.filter(task => {
          if (!task.dueDate || task.completed) return false;
          return new Date(task.dueDate) < now;
        });
      default:
        return this.tasks;
    }
  }

  renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      tasksList.innerHTML = `
        <li class="no-tasks">
          <i class="fas fa-clipboard-check"></i>
          <p>No tasks found</p>
        </li>
      `;
      return;
    }

    tasksList.innerHTML = filteredTasks.map(task => {
      const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
      const dueDateFormatted = task.dueDate ? this.formatDate(new Date(task.dueDate)) : '';

      return `
        <li class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
          <div class="task-content">
            <div class="task-main">
              <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                     onchange="taskManager.toggleTask(${task.id})">
              <span class="task-text" ondblclick="taskManager.editTask(${task.id})">${task.text}</span>
              <span class="task-category ${task.category}">${task.category}</span>
            </div>
            <div class="task-meta">
              <span class="task-priority priority-${task.priority}">
                <i class="fas fa-flag"></i> ${task.priority}
              </span>
              ${task.dueDate ? `<span class="task-due-date">
                <i class="fas fa-calendar"></i> ${dueDateFormatted}
              </span>` : ''}
              ${isOverdue ? '<span class="overdue-indicator"><i class="fas fa-exclamation-triangle"></i> Overdue</span>' : ''}
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-icon edit-btn" onclick="taskManager.editTask(${task.id})" title="Edit task">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon delete-btn" onclick="taskManager.deleteTask(${task.id})" title="Delete task">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </li>
      `;
    }).join('');
  }

  updateTaskStats() {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(t => t.completed).length;
    const overdueTasks = this.getOverdueTasks().length;

    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('overdue-tasks').textContent = overdueTasks;

    // Update productivity score
    const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('productivity-score').textContent = productivityScore;
  }

  renderTaskChart() {
    const ctx = document.getElementById('taskChart');
    if (!ctx) return;

    const categories = ['assignment', 'study', 'project', 'personal'];
    const categoryCounts = categories.map(category => 
      this.tasks.filter(task => task.category === category).length
    );

    // Destroy existing chart if it exists
    if (window.taskChart) {
      window.taskChart.destroy();
    }

    window.taskChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Assignments', 'Study', 'Projects', 'Personal'],
        datasets: [{
          data: categoryCounts,
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  getOverdueTasks() {
    const now = new Date();
    return this.tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      return new Date(task.dueDate) < now;
    });
  }

  getUpcomingTasks(days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.tasks
      .filter(task => {
        if (!task.dueDate || task.completed) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= futureDate;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  getTodayTasks() {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks
      .filter(task => task.dueDate === today)
      .sort((a, b) => a.completed - b.completed);
  }

  saveTasks() {
    localStorage.setItem('student-tasks', JSON.stringify(this.tasks));
  }

  formatDate(date) {
    const options = { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    return date.toLocaleDateString('en-US', options);
  }

  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }

  // Export tasks data
  exportTasks() {
    return {
      tasks: this.tasks,
      exportDate: new Date().toISOString()
    };
  }

  // Import tasks data
  importTasks(data) {
    if (data.tasks && Array.isArray(data.tasks)) {
      this.tasks = data.tasks;
      this.saveTasks();
      this.renderTasks();
      this.updateTaskStats();
      this.renderTaskChart();
      this.showNotification('Tasks imported successfully!', 'success');
    }
  }
}

// Initialize task manager when DOM is loaded
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
  taskManager = new TaskManager();
});