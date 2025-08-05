// Modern To-Do App with Advanced Features
class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.currentFilter = 'all';
    this.editingTaskId = null;
    this.searchQuery = '';
    this.sortOrder = 'newest'; // newest, oldest, alphabetical
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    
    this.initializeElements();
    this.initializeTheme();
    this.bindEvents();
    this.renderTasks();
    this.updateStats();
    this.showEmptyState();
  }

  initializeElements() {
    // Core elements
    this.taskInput = document.getElementById('task-input');
    this.categorySelect = document.getElementById('category-select');
    this.prioritySelect = document.getElementById('priority-select');
    this.addBtn = document.getElementById('add-btn');
    this.taskList = document.getElementById('task-list');
    this.emptyState = document.getElementById('empty-state');
    this.searchInput = document.getElementById('search-input');
    
    // Stats elements
    this.totalTasks = document.getElementById('total-tasks');
    this.completedTasks = document.getElementById('completed-tasks');
    this.activeTasks = document.getElementById('active-tasks');
    
    // Filter elements
    this.filterBtns = document.querySelectorAll('.filter-btn');
    
    // Action elements
    this.clearCompletedBtn = document.getElementById('clear-completed');
    this.clearAllBtn = document.getElementById('clear-all');
    this.sortTasksBtn = document.getElementById('sort-tasks');
    
    // Theme toggle
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    // Modal elements
    this.taskModal = document.getElementById('task-modal');
    this.taskDetails = document.getElementById('task-details');
    this.closeModal = document.querySelector('.close-modal');
    
    // Toast
    this.toast = document.getElementById('toast');
  }

  initializeTheme() {
    if (this.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.documentElement.removeAttribute('data-theme');
      this.themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }

  bindEvents() {
    // Add task events
    this.addBtn.addEventListener('click', () => this.addTask());
    this.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });

    // Filter events
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setFilter(e.currentTarget.dataset.filter);
      });
    });

    // Action events
    this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
    this.clearAllBtn.addEventListener('click', () => this.clearAll());
    this.sortTasksBtn.addEventListener('click', () => this.toggleSortOrder());
    
    // Search event
    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput.value.trim().toLowerCase();
      this.renderTasks();
    });
    
    // Theme toggle event
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    
    // Modal events
    this.closeModal.addEventListener('click', () => this.hideTaskModal());
    window.addEventListener('click', (e) => {
      if (e.target === this.taskModal) this.hideTaskModal();
    });
    
    // Handle click outside editing task
    document.addEventListener('click', (e) => {
      if (this.editingTaskId && !e.target.closest('.task-text')) {
        const taskElement = document.querySelector(`[data-task-id="${this.editingTaskId}"] .task-text`);
        if (taskElement) {
          this.saveTaskEdit(this.editingTaskId, taskElement.textContent.trim());
        }
      }
    });
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  addTask() {
    const taskText = this.taskInput.value.trim();
    if (!taskText) {
      this.showToast('Please enter a task!', 'warning');
      return;
    }

    const task = {
      id: this.generateId(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
      category: this.categorySelect.value || 'other',
      priority: this.prioritySelect.value || 'medium'
    };

    this.tasks.unshift(task);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.showEmptyState();
    
    this.taskInput.value = '';
    this.categorySelect.value = '';
    this.prioritySelect.value = '';
    this.taskInput.focus();
    
    this.showToast('Task added successfully!', 'success');
  }

  toggleTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      
      const message = task.completed ? 'Task completed!' : 'Task marked as active!';
      this.showToast(message, 'success');
    }
  }

  editTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const taskText = taskElement.querySelector('.task-text');
    
    if (this.editingTaskId === taskId) {
      // Save edit
      this.saveTaskEdit(taskId, taskText.textContent.trim());
    } else {
      // Start editing
      if (this.editingTaskId) {
        // Cancel previous edit
        const prevElement = document.querySelector(`[data-task-id="${this.editingTaskId}"] .task-text`);
        if (prevElement) {
          this.saveTaskEdit(this.editingTaskId, prevElement.textContent.trim());
        }
      }
      
      this.editingTaskId = taskId;
      taskText.contentEditable = true;
      taskText.classList.add('editing');
      taskText.focus();
      
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(taskText);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  saveTaskEdit(taskId, newText) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const taskElement = document.querySelector(`[data-task-id="${taskId}"] .task-text`);
    if (!taskElement) return;
    
    taskElement.contentEditable = false;
    taskElement.classList.remove('editing');
    
    if (newText && newText !== task.text) {
      task.text = newText;
      this.saveTasks();
      this.showToast('Task updated!', 'success');
    }
    
    this.editingTaskId = null;
  }

  deleteTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    taskElement.style.animation = 'slideOut 0.3s ease-out forwards';
    
    setTimeout(() => {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      this.showEmptyState();
      this.showToast('Task deleted!', 'success');
    }, 300);
  }

  showTaskDetails(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const createdDate = new Date(task.createdAt);
    const formattedDate = createdDate.toLocaleString();
    
    this.taskDetails.innerHTML = `
      <div class="detail-item">
        <span class="detail-label">Task</span>
        <span class="detail-value">${this.escapeHtml(task.text)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Status</span>
        <span class="detail-value">${task.completed ? 'Completed' : 'Active'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Category</span>
        <span class="detail-value">${this.capitalizeFirstLetter(task.category || 'None')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Priority</span>
        <span class="detail-value">${this.capitalizeFirstLetter(task.priority || 'None')}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Created</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
    `;
    
    this.taskModal.classList.add('show');
  }

  hideTaskModal() {
    this.taskModal.classList.remove('show');
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active filter button
    this.filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    this.renderTasks();
  }

  toggleSortOrder() {
    // Cycle through sort orders: newest -> oldest -> alphabetical -> newest
    if (this.sortOrder === 'newest') {
      this.sortOrder = 'oldest';
      this.showToast('Sorted by oldest first', 'success');
    } else if (this.sortOrder === 'oldest') {
      this.sortOrder = 'alphabetical';
      this.showToast('Sorted alphabetically', 'success');
    } else {
      this.sortOrder = 'newest';
      this.showToast('Sorted by newest first', 'success');
    }
    
    this.renderTasks();
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode);
    
    if (this.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.documentElement.removeAttribute('data-theme');
      this.themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    this.showToast(`${this.darkMode ? 'Dark' : 'Light'} mode enabled`, 'success');
  }

  clearCompleted() {
    const completedCount = this.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      this.showToast('No completed tasks to clear!', 'warning');
      return;
    }

    this.tasks = this.tasks.filter(t => !t.completed);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.showEmptyState();
    this.showToast(`Cleared ${completedCount} completed task(s)!`, 'success');
  }

  clearAll() {
    if (this.tasks.length === 0) {
      this.showToast('No tasks to clear!', 'warning');
      return;
    }

    if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
      this.tasks = [];
      this.saveTasks();
      this.renderTasks();
      this.updateStats();
      this.showEmptyState();
      this.showToast('All tasks cleared!', 'success');
    }
  }

  renderTasks() {
    this.taskList.innerHTML = '';
    
    let filteredTasks = [...this.tasks];
    
    // Apply filter
    switch (this.currentFilter) {
      case 'active':
        filteredTasks = filteredTasks.filter(t => !t.completed);
        break;
      case 'completed':
        filteredTasks = filteredTasks.filter(t => t.completed);
        break;
    }
    
    // Apply search
    if (this.searchQuery) {
      filteredTasks = filteredTasks.filter(t => 
        t.text.toLowerCase().includes(this.searchQuery) ||
        (t.category && t.category.toLowerCase().includes(this.searchQuery)) ||
        (t.priority && t.priority.toLowerCase().includes(this.searchQuery))
      );
    }
    
    // Apply sorting
    switch (this.sortOrder) {
      case 'newest':
        filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filteredTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'alphabetical':
        filteredTasks.sort((a, b) => a.text.localeCompare(b.text));
        break;
    }

    filteredTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.taskId = task.id;
      li.dataset.priority = task.priority || '';
      li.dataset.category = task.category || '';
      
      if (task.completed) {
        li.classList.add('completed');
      }

      const createdDate = new Date(task.createdAt);
      const formattedDate = createdDate.toLocaleDateString();

      li.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTask('${task.id}')">
          <i class="fas fa-check"></i>
        </div>
        <div class="task-content">
          <span class="task-text">${this.escapeHtml(task.text)}</span>
          <div class="task-meta">
            ${task.category ? `<span class="task-category"><i class="fas fa-tag"></i> ${this.capitalizeFirstLetter(task.category)}</span>` : ''}
            ${task.priority ? `<span class="task-priority"><i class="fas fa-flag"></i> ${this.capitalizeFirstLetter(task.priority)}</span>` : ''}
            <span class="task-date"><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="action-icon info" onclick="app.showTaskDetails('${task.id}')" title="View details">
            <i class="fas fa-info-circle"></i>
          </button>
          <button class="action-icon edit" onclick="app.editTask('${task.id}')" title="Edit task">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-icon delete" onclick="app.deleteTask('${task.id}')" title="Delete task">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      this.taskList.appendChild(li);
    });
    
    // Show empty state if needed
    this.showEmptyState(filteredTasks.length === 0);
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const active = total - completed;
    
    this.totalTasks.textContent = total;
    this.completedTasks.textContent = completed;
    this.activeTasks.textContent = active;
    
    // Animate stats
    this.animateNumber(this.totalTasks, total);
    this.animateNumber(this.completedTasks, completed);
    this.animateNumber(this.activeTasks, active);
  }

  animateNumber(element, targetValue) {
    const currentValue = parseInt(element.textContent);
    const increment = (targetValue - currentValue) / 10;
    let current = currentValue;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
        element.textContent = targetValue;
        clearInterval(timer);
      } else {
        element.textContent = Math.round(current);
      }
    }, 50);
  }

  showEmptyState(isEmpty = null) {
    const hasTasks = this.tasks.length > 0;
    const hasFilteredTasks = this.taskList.children.length > 0;
    
    if (isEmpty === null) {
      isEmpty = !hasTasks || !hasFilteredTasks;
    }
    
    if (isEmpty) {
      this.emptyState.classList.add('show');
      this.emptyState.innerHTML = `
        <i class="fas fa-clipboard-list"></i>
        <h3>${!hasTasks ? 'No tasks yet' : 'No tasks match your filter'}</h3>
        <p>${!hasTasks ? 'Add your first task to get started!' : 'Try changing your filter or add a new task!'}</p>
      `;
    } else {
      this.emptyState.classList.remove('show');
    }
  }

  showToast(message, type = 'success') {
    // Clear any existing timeout
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    // Set toast content and class
    this.toast.querySelector('.toast-message').textContent = message;
    this.toast.className = `toast ${type} show`;
    
    // Add click event to close button
    const closeBtn = this.toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.toast.classList.remove('show');
    });
    
    // Auto hide after 3 seconds
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }
}

// Initialize the app
const app = new TodoApp();

// Add some sample tasks for demonstration if no tasks exist
if (app.tasks.length === 0) {
  const sampleTasks = [
    { text: 'Welcome to TaskFlow! 🎉', category: 'other', priority: 'medium' },
    { text: 'Click on a task to mark it complete', category: 'work', priority: 'high' },
    { text: 'Try the filters to organize your tasks', category: 'personal', priority: 'medium' },
    { text: 'Edit tasks by clicking the edit icon', category: 'work', priority: 'low' },
    { text: 'Your tasks are automatically saved', category: 'personal', priority: 'high' }
  ];
  
  sampleTasks.forEach((task, index) => {
    setTimeout(() => {
      app.taskInput.value = task.text;
      app.categorySelect.value = task.category;
      app.prioritySelect.value = task.priority;
      app.addTask();
    }, index * 500);
  });
}
