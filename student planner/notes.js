// notes.js - Study Notes Management System

class NotesManager {
  constructor() {
    this.notes = this.loadNotes();
    this.currentEditingId = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderNotes();
  }

  bindEvents() {
    // Add note button
    document.getElementById('add-note-btn').addEventListener('click', () => {
      this.openNoteModal();
    });

    // Note form submission
    document.getElementById('note-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNote();
    });

    // Search functionality
    document.getElementById('notes-search-input').addEventListener('input', (e) => {
      this.searchNotes(e.target.value);
    });

    // Editor toolbar buttons
    document.querySelectorAll('.editor-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const command = btn.dataset.command;
        document.execCommand(command, false, null);
        document.getElementById('note-content').focus();
      });
    });

    // Modal close events
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('#note-modal')) {
          this.closeNoteModal();
        }
      });
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('#note-modal')) {
          this.closeNoteModal();
        }
      });
    });

    // Close modal on outside click
    document.getElementById('note-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeNoteModal();
      }
    });
  }

  openNoteModal(noteId = null) {
    const modal = document.getElementById('note-modal');
    const modalTitle = document.getElementById('note-modal-title');
    const noteTitle = document.getElementById('note-title');
    const noteSubject = document.getElementById('note-subject');
    const noteContent = document.getElementById('note-content');

    if (noteId) {
      // Edit existing note
      const note = this.notes.find(n => n.id === noteId);
      if (note) {
        this.currentEditingId = noteId;
        modalTitle.textContent = 'Edit Note';
        noteTitle.value = note.title;
        noteSubject.value = note.subject;
        noteContent.innerHTML = note.content;
      }
    } else {
      // Create new note
      this.currentEditingId = null;
      modalTitle.textContent = 'New Note';
      noteTitle.value = '';
      noteSubject.value = 'general';
      noteContent.innerHTML = '';
    }

    modal.classList.add('active');
    noteTitle.focus();
  }

  closeNoteModal() {
    const modal = document.getElementById('note-modal');
    modal.classList.remove('active');
    this.currentEditingId = null;
  }

  saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const subject = document.getElementById('note-subject').value;
    const content = document.getElementById('note-content').innerHTML.trim();

    if (!title) {
      this.showNotification('Please enter a note title', 'error');
      return;
    }

    if (!content || content === '<br>' || content === '<div><br></div>') {
      this.showNotification('Please enter note content', 'error');
      return;
    }

    const now = new Date();
    
    if (this.currentEditingId) {
      // Update existing note
      const noteIndex = this.notes.findIndex(n => n.id === this.currentEditingId);
      if (noteIndex !== -1) {
        this.notes[noteIndex] = {
          ...this.notes[noteIndex],
          title,
          subject,
          content,
          lastModified: now.toISOString()
        };
        this.showNotification('Note updated successfully', 'success');
      }
    } else {
      // Create new note
      const newNote = {
        id: this.generateId(),
        title,
        subject,
        content,
        created: now.toISOString(),
        lastModified: now.toISOString()
      };
      this.notes.unshift(newNote);
      this.showNotification('Note created successfully', 'success');
    }

    this.saveNotes();
    this.renderNotes();
    this.closeNoteModal();
  }

  deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
      this.notes = this.notes.filter(n => n.id !== noteId);
      this.saveNotes();
      this.renderNotes();
      this.showNotification('Note deleted successfully', 'success');
    }
  }

  duplicateNote(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      const duplicatedNote = {
        ...note,
        id: this.generateId(),
        title: `${note.title} (Copy)`,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      this.notes.unshift(duplicatedNote);
      this.saveNotes();
      this.renderNotes();
      this.showNotification('Note duplicated successfully', 'success');
    }
  }

  searchNotes(query) {
    const searchTerm = query.toLowerCase().trim();
    const noteCards = document.querySelectorAll('.note-card');
    
    noteCards.forEach(card => {
      const title = card.querySelector('.note-title').textContent.toLowerCase();
      const content = card.querySelector('.note-preview').textContent.toLowerCase();
      const subject = card.querySelector('.note-subject').textContent.toLowerCase();
      
      const isVisible = title.includes(searchTerm) || 
                       content.includes(searchTerm) || 
                       subject.includes(searchTerm);
      
      card.style.display = isVisible ? 'block' : 'none';
    });
  }

  renderNotes() {
    const notesGrid = document.getElementById('notes-grid');
    
    if (this.notes.length === 0) {
      notesGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-sticky-note"></i>
          <h3>No notes yet</h3>
          <p>Create your first study note to get started!</p>
        </div>
      `;
      return;
    }

    notesGrid.innerHTML = this.notes.map(note => this.createNoteCard(note)).join('');

    // Bind events to note cards
    notesGrid.querySelectorAll('.note-card').forEach(card => {
      const noteId = card.dataset.noteId;
      
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.note-actions')) {
          this.openNoteModal(noteId);
        }
      });

      // Edit button
      card.querySelector('.edit-note').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openNoteModal(noteId);
      });

      // Delete button
      card.querySelector('.delete-note').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteNote(noteId);
      });

      // Duplicate button
      card.querySelector('.duplicate-note').addEventListener('click', (e) => {
        e.stopPropagation();
        this.duplicateNote(noteId);
      });
    });
  }

  createNoteCard(note) {
    const created = new Date(note.created);
    const lastModified = new Date(note.lastModified);
    const isModified = lastModified.getTime() !== created.getTime();
    
    // Extract plain text from HTML content for preview
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const preview = plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;

    const subjectColors = {
      general: '#6c757d',
      math: '#007bff',
      science: '#28a745',
      english: '#dc3545',
      history: '#fd7e14',
      other: '#6f42c1'
    };

    return `
      <div class="note-card" data-note-id="${note.id}">
        <div class="note-header">
          <h4 class="note-title">${this.escapeHtml(note.title)}</h4>
          <div class="note-actions">
            <button class="note-action-btn edit-note" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="note-action-btn duplicate-note" title="Duplicate">
              <i class="fas fa-copy"></i>
            </button>
            <button class="note-action-btn delete-note" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="note-subject" style="color: ${subjectColors[note.subject] || '#6c757d'}">
          <i class="fas fa-tag"></i> ${this.capitalizeFirst(note.subject)}
        </div>
        <div class="note-preview">${this.escapeHtml(preview)}</div>
        <div class="note-meta">
          <small class="note-date">
            <i class="fas fa-clock"></i>
            ${isModified ? 'Modified' : 'Created'} ${this.formatDate(isModified ? lastModified : created)}
          </small>
          <small class="word-count">
            ${this.getWordCount(plainText)} words
          </small>
        </div>
      </div>
    `;
  }

  getWordCount(text) {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'today';
    } else if (diffDays === 2) {
      return 'yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  showNotification(message, type = 'info') {
    // This will be implemented in the main app.js file
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  loadNotes() {
    try {
      const saved = JSON.parse(localStorage.getItem('studentPlanner_notes')) || [];
      return saved;
    } catch (error) {
      console.warn('Failed to load notes:', error);
      return [];
    }
  }

  saveNotes() {
    try {
      localStorage.setItem('studentPlanner_notes', JSON.stringify(this.notes));
    } catch (error) {
      console.error('Failed to save notes:', error);
      this.showNotification('Failed to save notes', 'error');
    }
  }

  // Public API methods
  getAllNotes() {
    return this.notes;
  }

  getNotesBySubject(subject) {
    return this.notes.filter(note => note.subject === subject);
  }

  getRecentNotes(limit = 5) {
    return this.notes
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, limit);
  }

  exportNotes() {
    const dataStr = JSON.stringify(this.notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-notes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.showNotification('Notes exported successfully', 'success');
  }

  clearAllNotes() {
    if (confirm('Are you sure you want to delete all notes? This action cannot be undone.')) {
      this.notes = [];
      this.saveNotes();
      this.renderNotes();
      this.showNotification('All notes cleared', 'success');
    }
  }
}

// Initialize notes manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.notesManager = new NotesManager();
});