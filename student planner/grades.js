// Grades Management functionality
class GradesManager {
  constructor() {
    this.grades = JSON.parse(localStorage.getItem('student-grades') || '[]');
    this.subjects = this.getUniqueSubjects();
    
    this.initializeGrades();
    this.bindEvents();
  }

  initializeGrades() {
    this.renderGrades();
    this.updateGradeStats();
    this.renderGradeChart();
  }

  bindEvents() {
    // Add grade button
    document.getElementById('add-grade-btn').addEventListener('click', () => {
      this.openGradeModal();
    });

    // Grade form submission
    document.getElementById('grade-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addGrade();
    });

    // Modal controls
    document.querySelector('#grade-modal .close-modal').addEventListener('click', () => {
      this.closeGradeModal();
    });

    document.querySelector('#grade-modal .btn-cancel').addEventListener('click', () => {
      this.closeGradeModal();
    });

    // Close modal on outside click
    document.getElementById('grade-modal').addEventListener('click', (e) => {
      if (e.target.id === 'grade-modal') {
        this.closeGradeModal();
      }
    });
  }

  openGradeModal() {
    const modal = document.getElementById('grade-modal');
    modal.style.display = 'block';
    document.getElementById('subject-name').focus();
  }

  closeGradeModal() {
    const modal = document.getElementById('grade-modal');
    modal.style.display = 'none';
    document.getElementById('grade-form').reset();
  }

  addGrade() {
    const subjectName = document.getElementById('subject-name').value.trim();
    const gradeValue = parseFloat(document.getElementById('grade-value').value);
    const creditHours = parseInt(document.getElementById('credit-hours').value);
    const gradeDate = document.getElementById('grade-date').value;
    const gradeType = document.getElementById('grade-type').value;

    if (!subjectName || isNaN(gradeValue) || isNaN(creditHours) || !gradeDate) {
      this.showNotification('Please fill in all required fields!', 'error');
      return;
    }

    if (gradeValue < 0 || gradeValue > 100) {
      this.showNotification('Grade must be between 0 and 100!', 'error');
      return;
    }

    const newGrade = {
      id: Date.now(),
      subject: subjectName,
      grade: gradeValue,
      creditHours: creditHours,
      date: gradeDate,
      type: gradeType,
      gpa: this.calculateGPA(gradeValue),
      letterGrade: this.getLetterGrade(gradeValue),
      createdAt: new Date().toISOString()
    };

    this.grades.push(newGrade);
    this.saveGrades();
    this.subjects = this.getUniqueSubjects();
    this.renderGrades();
    this.updateGradeStats();
    this.renderGradeChart();
    this.closeGradeModal();

    this.showNotification('Grade added successfully!', 'success');
  }

  deleteGrade(gradeId) {
    if (confirm('Are you sure you want to delete this grade?')) {
      this.grades = this.grades.filter(grade => grade.id !== gradeId);
      this.saveGrades();
      this.subjects = this.getUniqueSubjects();
      this.renderGrades();
      this.updateGradeStats();
      this.renderGradeChart();
      this.showNotification('Grade deleted successfully!', 'success');
    }
  }

  editGrade(gradeId) {
    const grade = this.grades.find(g => g.id === gradeId);
    if (!grade) return;

    // Pre-fill the form with existing data
    document.getElementById('subject-name').value = grade.subject;
    document.getElementById('grade-value').value = grade.grade;
    document.getElementById('credit-hours').value = grade.creditHours;
    document.getElementById('grade-date').value = grade.date;
    document.getElementById('grade-type').value = grade.type;

    // Change form behavior to edit mode
    const form = document.getElementById('grade-form');
    form.dataset.editId = gradeId;
    
    // Update modal title
    document.querySelector('#grade-modal h3').textContent = 'Edit Grade';
    
    this.openGradeModal();
  }

  updateGrade(gradeId) {
    const grade = this.grades.find(g => g.id === gradeId);
    if (!grade) return;

    const subjectName = document.getElementById('subject-name').value.trim();
    const gradeValue = parseFloat(document.getElementById('grade-value').value);
    const creditHours = parseInt(document.getElementById('credit-hours').value);
    const gradeDate = document.getElementById('grade-date').value;
    const gradeType = document.getElementById('grade-type').value;

    if (!subjectName || isNaN(gradeValue) || isNaN(creditHours) || !gradeDate) {
      this.showNotification('Please fill in all required fields!', 'error');
      return;
    }

    grade.subject = subjectName;
    grade.grade = gradeValue;
    grade.creditHours = creditHours;
    grade.date = gradeDate;
    grade.type = gradeType;
    grade.gpa = this.calculateGPA(gradeValue);
    grade.letterGrade = this.getLetterGrade(gradeValue);

    this.saveGrades();
    this.subjects = this.getUniqueSubjects();
    this.renderGrades();
    this.updateGradeStats();
    this.renderGradeChart();
    this.closeGradeModal();

    this.showNotification('Grade updated successfully!', 'success');
  }

  renderGrades() {
    const container = document.getElementById('subjects-container');
    
    if (this.subjects.length === 0) {
      container.innerHTML = `
        <div class="no-grades">
          <i class="fas fa-chart-line"></i>
          <p>No grades recorded yet</p>
          <p>Click "Add Grade" to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.subjects.map(subject => {
      const subjectGrades = this.grades.filter(g => g.subject === subject);
      const avgGrade = this.calculateSubjectAverage(subject);
      const avgGPA = this.calculateGPA(avgGrade);
      const letterGrade = this.getLetterGrade(avgGrade);
      const totalCredits = subjectGrades.reduce((sum, grade) => sum + grade.creditHours, 0);

      return `
        <div class="subject-card">
          <div class="subject-header">
            <h3>${subject}</h3>
            <div class="subject-stats">
              <span class="grade-display ${this.getGradeColorClass(avgGrade)}">${avgGrade.toFixed(1)}%</span>
              <span class="letter-grade">${letterGrade}</span>
              <span class="gpa-display">GPA: ${avgGPA.toFixed(2)}</span>
            </div>
          </div>
          <div class="subject-details">
            <p><i class="fas fa-book"></i> ${subjectGrades.length} assignment(s)</p>
            <p><i class="fas fa-clock"></i> ${totalCredits} credit hour(s)</p>
          </div>
          <div class="grades-list">
            ${subjectGrades.map(grade => `
              <div class="grade-item">
                <div class="grade-info">
                  <span class="grade-type">${grade.type}</span>
                  <span class="grade-date">${this.formatDate(new Date(grade.date))}</span>
                </div>
                <div class="grade-score">
                  <span class="grade-value ${this.getGradeColorClass(grade.grade)}">${grade.grade}%</span>
                  <span class="grade-letter">${grade.letterGrade}</span>
                </div>
                <div class="grade-actions">
                  <button class="btn-icon edit-btn" onclick="gradesManager.editGrade(${grade.id})" title="Edit grade">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon delete-btn" onclick="gradesManager.deleteGrade(${grade.id})" title="Delete grade">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  updateGradeStats() {
    const overallGPA = this.calculateOverallGPA();
    const semesterGPA = this.calculateSemesterGPA();
    const totalCredits = this.calculateTotalCredits();
    const avgGrade = this.calculateOverallAverage();

    document.getElementById('overall-gpa').textContent = isFinite(overallGPA) && !isNaN(overallGPA) ? overallGPA.toFixed(2) : '0.00';
    document.getElementById('semester-gpa').textContent = isFinite(semesterGPA) && !isNaN(semesterGPA) ? semesterGPA.toFixed(2) : '0.00';
    document.getElementById('total-credits').textContent = totalCredits;
    document.getElementById('avg-grade').textContent = isFinite(avgGrade) && !isNaN(avgGrade) ? avgGrade.toFixed(1) : '0.0';
  }

  renderGradeChart() {
    const ctx = document.getElementById('gradesChart');
    if (!ctx) return;

    // Get grade trends over time
    const sortedGrades = [...this.grades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedGrades.map(grade => this.formatDate(new Date(grade.date)));
    const gradeData = sortedGrades.map(grade => grade.grade);
    const gpaData = sortedGrades.map(grade => grade.gpa * 25); // Scale GPA to match grade scale

    // Destroy existing chart if it exists
    if (window.gradesChart) {
      window.gradesChart.destroy();
    }

    window.gradesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Grades (%)',
            data: gradeData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'GPA (scaled)',
            data: gpaData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  calculateGPA(grade) {
    if (grade >= 97) return 4.0;
    if (grade >= 93) return 3.7;
    if (grade >= 90) return 3.3;
    if (grade >= 87) return 3.0;
    if (grade >= 83) return 2.7;
    if (grade >= 80) return 2.3;
    if (grade >= 77) return 2.0;
    if (grade >= 73) return 1.7;
    if (grade >= 70) return 1.3;
    if (grade >= 67) return 1.0;
    if (grade >= 65) return 0.7;
    return 0.0;
  }

  getLetterGrade(grade) {
    if (grade >= 97) return 'A+';
    if (grade >= 93) return 'A';
    if (grade >= 90) return 'A-';
    if (grade >= 87) return 'B+';
    if (grade >= 83) return 'B';
    if (grade >= 80) return 'B-';
    if (grade >= 77) return 'C+';
    if (grade >= 73) return 'C';
    if (grade >= 70) return 'C-';
    if (grade >= 67) return 'D+';
    if (grade >= 65) return 'D';
    return 'F';
  }

  getGradeColorClass(grade) {
    if (grade >= 90) return 'excellent';
    if (grade >= 80) return 'good';
    if (grade >= 70) return 'average';
    if (grade >= 60) return 'below-average';
    return 'poor';
  }

  calculateOverallGPA() {
    if (this.grades.length === 0) return 0;
    
    const totalGradePoints = this.grades.reduce((sum, grade) => 
      sum + (grade.gpa * grade.creditHours), 0);
    const totalCredits = this.grades.reduce((sum, grade) => 
      sum + grade.creditHours, 0);
    
    return totalCredits > 0 ? totalGradePoints / totalCredits : 0;
  }

  calculateSemesterGPA() {
    // Calculate GPA for current semester (last 4 months)
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    
    const recentGrades = this.grades.filter(grade => 
      new Date(grade.date) >= fourMonthsAgo);
    
    if (recentGrades.length === 0) return 0;
    
    const totalGradePoints = recentGrades.reduce((sum, grade) => 
      sum + (grade.gpa * grade.creditHours), 0);
    const totalCredits = recentGrades.reduce((sum, grade) => 
      sum + grade.creditHours, 0);
    
    return totalCredits > 0 ? totalGradePoints / totalCredits : 0;
  }

  calculateTotalCredits() {
    return this.grades.reduce((sum, grade) => sum + grade.creditHours, 0);
  }

  calculateOverallAverage() {
    if (this.grades.length === 0) return 0;
    return this.grades.reduce((sum, grade) => sum + grade.grade, 0) / this.grades.length;
  }

  calculateSubjectAverage(subject) {
    const subjectGrades = this.grades.filter(g => g.subject === subject);
    if (subjectGrades.length === 0) return 0;
    return subjectGrades.reduce((sum, grade) => sum + grade.grade, 0) / subjectGrades.length;
  }

  getUniqueSubjects() {
    const subjects = [...new Set(this.grades.map(grade => grade.subject))];
    return subjects.sort();
  }

  formatDate(date) {
    const options = { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    return date.toLocaleDateString('en-US', options);
  }

  saveGrades() {
    localStorage.setItem('student-grades', JSON.stringify(this.grades));
  }

  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }

  // Export grades data
  exportGrades() {
    return {
      grades: this.grades,
      exportDate: new Date().toISOString()
    };
  }

  // Import grades data
  importGrades(data) {
    if (data.grades && Array.isArray(data.grades)) {
      this.grades = data.grades;
      this.subjects = this.getUniqueSubjects();
      this.saveGrades();
      this.renderGrades();
      this.updateGradeStats();
      this.renderGradeChart();
      this.showNotification('Grades imported successfully!', 'success');
    }
  }
}

// Initialize grades manager when DOM is loaded
let gradesManager;
document.addEventListener('DOMContentLoaded', () => {
  gradesManager = new GradesManager();
});