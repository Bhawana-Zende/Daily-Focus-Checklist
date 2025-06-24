// Load goals from localStorage
let goals = JSON.parse(localStorage.getItem('dailyGoals') || '[]');

// Elements
const goalInput = document.getElementById('goalInput');
const addGoalButton = document.getElementById('addGoal');
const goalsList = document.getElementById('goalsList');

// Save to localStorage
function saveGoals() {
  localStorage.setItem('dailyGoals', JSON.stringify(goals));
}

// Render goals
function renderGoals() {
  goalsList.innerHTML = '';
  goals.forEach((goal, index) => {
    const li = document.createElement('li');
    li.classList.toggle('completed', goal.completed);

    const text = document.createElement('span');
    text.textContent = goal.text;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = goal.completed;
    checkbox.addEventListener('change', () => {
      goals[index].completed = checkbox.checked;
      saveGoals();
      renderGoals();
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    goalsList.appendChild(li);
  });
}

// Add new goal
addGoalButton.addEventListener('click', () => {
  const text = goalInput.value.trim();
  if (text) {
    goals.push({ text, completed: false });
    goalInput.value = '';
    saveGoals();
    renderGoals();
  }
});

// Initial render
renderGoals();
