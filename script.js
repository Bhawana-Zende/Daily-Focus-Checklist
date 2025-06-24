// Daily Focus Checklist App
class DailyFocusApp {
    constructor() {
        this.goals = [];
        this.gameData = {
            totalPoints: 0,
            dailyStreak: 0,
            lastActiveDate: null
        };
        this.pointValues = {
            'low': 10,
            'medium': 20,
            'high': 30
        };
        this.init();
    }

    init() {
        this.loadGameData();
        this.loadGoals();
        this.updateStreak();
        this.bindEvents();
        this.render();
        this.updateGameDisplay();
    }

    // Bind event listeners
    bindEvents() {
        const addButton = document.getElementById('addButton');
        const goalInput = document.getElementById('goalInput');

        // Add goal on button click
        addButton.addEventListener('click', () => this.addGoal());

        // Add goal on Enter key press
        goalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addGoal();
            }
        });

        // Enable/disable add button based on input
        goalInput.addEventListener('input', () => {
            const hasText = goalInput.value.trim().length > 0;
            addButton.disabled = !hasText;
        });

        // Set initial button state
        addButton.disabled = true;
    }

    // Add a new goal
    addGoal() {
        const goalInput = document.getElementById('goalInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const timeInput = document.getElementById('timeInput');
        
        const goalText = goalInput.value.trim();
        const priority = prioritySelect.value;
        const estimatedTime = timeInput.value.trim();

        if (!goalText) {
            return;
        }

        // Check for duplicate goals
        if (this.goals.some(goal => goal.text.toLowerCase() === goalText.toLowerCase())) {
            this.showNotification('This goal already exists!', 'warning');
            return;
        }

        const newGoal = {
            id: Date.now().toString(),
            text: goalText,
            priority: priority,
            estimatedTime: estimatedTime,
            completed: false,
            completionNote: '',
            createdAt: new Date().toISOString()
        };

        this.goals.push(newGoal);
        this.sortGoalsByPriority();
        this.saveGoals();
        this.render();

        // Clear inputs and focus
        goalInput.value = '';
        timeInput.value = '';
        prioritySelect.value = 'medium'; // Reset to default
        goalInput.focus();
        document.getElementById('addButton').disabled = true;

        this.showNotification('Goal added successfully!', 'success');
    }

    // Sort goals by priority (high -> medium -> low)
    sortGoalsByPriority() {
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        this.goals.sort((a, b) => {
            // First sort by completion status (incomplete first)
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            // Then by priority
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    // Toggle goal completion status
    toggleGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            const wasCompleted = goal.completed;
            goal.completed = !goal.completed;
            
            if (goal.completed && !wasCompleted) {
                // Goal just completed - add points and celebrate!
                const points = this.pointValues[goal.priority];
                this.gameData.totalPoints += points;
                this.updateDailyActivity();
                this.saveGameData();
                this.celebrateCompletion(goalId, points);
                
                // Show completion note input after celebration
                setTimeout(() => {
                    this.showCompletionNoteInput(goalId);
                }, 500);
            } else if (!goal.completed && wasCompleted) {
                // Goal uncompleted - subtract points and clear note
                const points = this.pointValues[goal.priority];
                this.gameData.totalPoints = Math.max(0, this.gameData.totalPoints - points);
                goal.completionNote = '';
                this.saveGameData();
            }
            
            this.sortGoalsByPriority();
            this.saveGoals();
            this.render();
            this.updateGameDisplay();
            
            const message = goal.completed ? `Mini win completed! +${this.pointValues[goal.priority]} points` : 'Goal reopened';
            this.showNotification(message, goal.completed ? 'success' : 'info');
        }
    }

    // Delete a goal
    deleteGoal(goalId) {
        const goalElement = document.querySelector(`[data-goal-id="${goalId}"]`);
        const goal = this.goals.find(g => g.id === goalId);
        
        if (goalElement && goal) {
            goalElement.classList.add('removing');
            
            setTimeout(() => {
                // If the goal was completed, subtract points
                if (goal.completed) {
                    const points = this.pointValues[goal.priority];
                    this.gameData.totalPoints = Math.max(0, this.gameData.totalPoints - points);
                    this.saveGameData();
                    this.updateGameDisplay();
                }
                
                this.goals = this.goals.filter(g => g.id !== goalId);
                this.saveGoals();
                this.render();
                
                const message = goal.completed ? `Mini win deleted (-${this.pointValues[goal.priority]} points)` : 'Goal deleted';
                this.showNotification(message, 'info');
            }, 300);
        }
    }

    // Render the goals list
    render() {
        const goalsList = document.getElementById('goalsList');
        const emptyState = document.getElementById('emptyState');

        if (this.goals.length === 0) {
            goalsList.innerHTML = '';
            emptyState.classList.add('show');
            return;
        }

        emptyState.classList.remove('show');

        const goalsHTML = this.goals.map(goal => {
            const priorityEmoji = {
                'high': '🔴',
                'medium': '🟠',
                'low': '🟢'
            };
            
            const priorityText = {
                'high': 'High',
                'medium': 'Medium',
                'low': 'Low'
            };
            
            return `
            <li class="goal-item ${goal.completed ? 'completed' : ''} priority-${goal.priority}" data-goal-id="${goal.id}">
                <div class="goal-checkbox ${goal.completed ? 'checked' : ''}" 
                     onclick="app.toggleGoal('${goal.id}')"
                     role="checkbox" 
                     aria-checked="${goal.completed}"
                     tabindex="0"
                     onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.toggleGoal('${goal.id}');}">
                </div>
                <div class="goal-content">
                    <span class="goal-text">${this.escapeHtml(goal.text)}</span>
                    <div class="goal-meta">
                        <span class="goal-priority ${goal.priority}">
                            ${priorityEmoji[goal.priority]} ${priorityText[goal.priority]}
                        </span>
                        ${goal.estimatedTime ? `<span class="goal-time">${this.escapeHtml(goal.estimatedTime)}</span>` : ''}
                    </div>
                    ${goal.completed && goal.completionNote ? `<div class="completion-note">${this.escapeHtml(goal.completionNote)}</div>` : ''}
                </div>
                <button class="delete-button" 
                        onclick="app.deleteGoal('${goal.id}')"
                        title="Delete goal"
                        aria-label="Delete goal: ${this.escapeHtml(goal.text)}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14c0,1-1,2-2,2H7c-1,0-2-1-2-2V6m3,0V4c0-1,1-2,2-2h4c1,0,2,1,2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </li>
        `;
        }).join('');

        goalsList.innerHTML = goalsHTML;
    }

    // Save goals to localStorage
    saveGoals() {
        try {
            localStorage.setItem('dailyFocusGoals', JSON.stringify(this.goals));
        } catch (error) {
            console.error('Failed to save goals:', error);
            this.showNotification('Failed to save goals', 'error');
        }
    }

    // Game data management
    loadGameData() {
        try {
            const savedGameData = localStorage.getItem('dailyFocusGameData');
            if (savedGameData) {
                const parsed = JSON.parse(savedGameData);
                this.gameData = { 
                    totalPoints: parsed.totalPoints || 0,
                    dailyStreak: parsed.dailyStreak || 0,
                    lastActiveDate: parsed.lastActiveDate || null
                };
            }
        } catch (error) {
            console.error('Failed to load game data:', error);
            // Reset to defaults if corrupted
            this.gameData = {
                totalPoints: 0,
                dailyStreak: 0,
                lastActiveDate: null
            };
        }
    }

    saveGameData() {
        try {
            localStorage.setItem('dailyFocusGameData', JSON.stringify(this.gameData));
        } catch (error) {
            console.error('Failed to save game data:', error);
        }
    }

    updateGameDisplay() {
        document.getElementById('totalPoints').textContent = this.gameData.totalPoints;
        document.getElementById('dailyStreak').textContent = this.gameData.dailyStreak;
    }

    updateDailyActivity() {
        const today = new Date().toDateString();
        if (this.gameData.lastActiveDate !== today) {
            // First activity of the day - increment streak
            if (this.gameData.dailyStreak === 0) {
                this.gameData.dailyStreak = 1;
            }
            this.gameData.lastActiveDate = today;
            this.saveGameData();
            this.updateGameDisplay();
        }
    }

    updateStreak() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();
        
        if (this.gameData.lastActiveDate === todayStr) {
            // Already active today, keep streak
            return;
        } else if (this.gameData.lastActiveDate === yesterdayStr) {
            // Was active yesterday, increment streak
            this.gameData.dailyStreak += 1;
            this.gameData.lastActiveDate = todayStr;
            this.saveGameData();
        } else if (this.gameData.lastActiveDate && this.gameData.lastActiveDate !== todayStr) {
            // Broke streak, reset to 0
            this.gameData.dailyStreak = 0;
            this.gameData.lastActiveDate = null;
            this.saveGameData();
        } else if (!this.gameData.lastActiveDate) {
            // First time using app - start at 0
            this.gameData.dailyStreak = 0;
            this.gameData.lastActiveDate = null;
            this.saveGameData();
        }
    }

    // Completion note functionality
    showCompletionNoteInput(goalId) {
        const goalElement = document.querySelector(`[data-goal-id="${goalId}"] .goal-content`);
        if (!goalElement) return;

        // Check if note input already exists
        if (goalElement.querySelector('.completion-note-input')) return;

        const noteInputContainer = document.createElement('div');
        noteInputContainer.innerHTML = `
            <textarea 
                class="completion-note-input" 
                placeholder="Add a note about completing this mini win (e.g., 'Took 30min, felt great!')"
                maxlength="200"
            ></textarea>
            <div class="completion-note-actions">
                <button class="note-save-btn" onclick="app.saveCompletionNote('${goalId}')">Save Note</button>
                <button class="note-cancel-btn" onclick="app.cancelCompletionNote('${goalId}')">Skip</button>
            </div>
        `;

        goalElement.appendChild(noteInputContainer);
        
        // Focus the textarea
        const textarea = noteInputContainer.querySelector('.completion-note-input');
        textarea.focus();
        
        // Handle Enter key to save (Shift+Enter for new line)
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveCompletionNote(goalId);
            } else if (e.key === 'Escape') {
                this.cancelCompletionNote(goalId);
            }
        });
    }

    saveCompletionNote(goalId) {
        const goalElement = document.querySelector(`[data-goal-id="${goalId}"]`);
        const textarea = goalElement.querySelector('.completion-note-input');
        
        if (!textarea) return;

        const noteText = textarea.value.trim();
        const goal = this.goals.find(g => g.id === goalId);
        
        if (goal) {
            goal.completionNote = noteText;
            this.saveGoals();
            
            if (noteText) {
                this.showNotification('Completion note saved!', 'success');
            }
        }

        // Remove the input container
        const inputContainer = textarea.parentElement;
        inputContainer.remove();
        
        // Re-render to show the saved note
        this.render();
    }

    cancelCompletionNote(goalId) {
        const goalElement = document.querySelector(`[data-goal-id="${goalId}"]`);
        const inputContainer = goalElement.querySelector('.completion-note-input').parentElement;
        
        if (inputContainer) {
            inputContainer.remove();
        }
    }

    // Celebration effects
    celebrateCompletion(goalId, points) {
        // Play sound
        this.playCompletionSound();
        
        // Add celebration animation to goal
        const goalElement = document.querySelector(`[data-goal-id="${goalId}"]`);
        if (goalElement) {
            goalElement.classList.add('celebrating');
            setTimeout(() => {
                goalElement.classList.remove('celebrating');
            }, 1000);
        }
        
        // Show confetti
        this.showConfetti();
        
        // Show points notification
        this.showNotification(`🎉 +${points} points! Mini win achieved!`, 'success');
    }

    playCompletionSound() {
        try {
            // Create a simple success sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Fallback: try to play the embedded audio element
            try {
                const audio = document.getElementById('completionSound');
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(() => {}); // Ignore play errors
                }
            } catch (e) {
                // Silent fail if audio doesn't work
            }
        }
    }

    showConfetti() {
        const container = document.getElementById('confetti-container');
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        
        // Create 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            container.appendChild(confetti);
            
            // Remove confetti piece after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, 5000);
        }
    }

    // Load goals from localStorage
    loadGoals() {
        try {
            const savedGoals = localStorage.getItem('dailyFocusGoals');
            if (savedGoals) {
                this.goals = JSON.parse(savedGoals);
                
                // Validate and migrate loaded data
                this.goals = this.goals.filter(goal => 
                    goal && 
                    typeof goal.id === 'string' && 
                    typeof goal.text === 'string' && 
                    typeof goal.completed === 'boolean'
                ).map(goal => ({
                    ...goal,
                    // Add default values for new properties if they don't exist
                    priority: goal.priority || 'medium',
                    estimatedTime: goal.estimatedTime || '',
                    completionNote: goal.completionNote || ''
                }));
                
                // Sort goals after loading
                this.sortGoalsByPriority();
            }
        } catch (error) {
            console.error('Failed to load goals:', error);
            this.goals = [];
            this.showNotification('Failed to load saved goals', 'error');
        }
    }

    // Show notification to user
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add notification styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            fontSize: '14px',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        });

        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get app statistics
    getStats() {
        const total = this.goals.length;
        const completed = this.goals.filter(g => g.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { 
            total, 
            completed, 
            pending, 
            completionRate,
            totalPoints: this.gameData.totalPoints,
            dailyStreak: this.gameData.dailyStreak
        };
    }

    // Clear all goals (for testing or reset)
    clearAllGoals() {
        if (confirm('Are you sure you want to delete all goals? This cannot be undone.')) {
            this.goals = [];
            this.saveGoals();
            this.render();
            this.showNotification('All goals cleared', 'info');
        }
    }

    // Export goals as JSON
    exportGoals() {
        const dataStr = JSON.stringify(this.goals, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `daily-focus-goals-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Goals exported successfully', 'success');
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DailyFocusApp();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to add goal from anywhere
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            document.getElementById('goalInput').focus();
        }
        
        // Escape to clear input
        if (e.key === 'Escape') {
            const goalInput = document.getElementById('goalInput');
            if (goalInput === document.activeElement) {
                goalInput.value = '';
                goalInput.blur();
                document.getElementById('addButton').disabled = true;
            }
        }
    });

    // Add console commands for debugging
    window.debugApp = {
        stats: () => window.app.getStats(),
        clear: () => window.app.clearAllGoals(),
        export: () => window.app.exportGoals(),
        goals: () => window.app.goals
    };

    console.log('Mini Wins Checklist loaded! Use debugApp.stats() to see statistics.');
});

// Service Worker registration for offline support (optional enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Could register a service worker here for offline functionality
        // navigator.serviceWorker.register('/sw.js');
    });
}
