// ===== Student Planner Pro: Main JS =====

class StudentPlannerApp {
  constructor() {
    this.views = ['dashboard', 'calendar', 'tasks', 'grades', 'notes'];
    this.currentView = 'dashboard';
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
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      themeToggle.classList.toggle('active');
    });
  }

  setupModalLogic() {
    // General modal overlay logic
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalContent = document.getElementById('modal-content');
    // Close modal on overlay click
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });
    // Settings modal
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

// Initialize app on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.studentPlannerApp = new StudentPlannerApp();
}); 