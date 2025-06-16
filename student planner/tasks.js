// tasks.js

const addTaskBtn = document.getElementById("add-task-btn");
const taskInput = document.getElementById("new-task-input");
const tasksList = document.getElementById("tasks-list");
const tasksSection = document.getElementById("tasks-section");
const tasksHeader = document.getElementById("tasks-header");
const collapseIcon = document.querySelector(".collapse-icon");
const tasksContainer = document.getElementById("tasks-container");

function loadTasks() {
  tasksList.innerHTML = "";
  const tasks = JSON.parse(localStorage.getItem("planner-tasks") || "[]");
  tasks.forEach((task, index) => addTaskToUI(task, index));
}

function saveTasks() {
  const taskItems = Array.from(tasksList.children).map(li => ({
    text: li.querySelector(".task-text").innerText,
    done: li.classList.contains("done")
  }));
  localStorage.setItem("planner-tasks", JSON.stringify(taskItems));
}

function addTaskToUI(task, index) {
  const li = document.createElement("li");
  li.className = task.done ? "task-item done" : "task-item";

  const span = document.createElement("span");
  span.className = "task-text";
  span.innerText = task.text;
  span.onclick = () => {
    li.classList.toggle("done");
    saveTasks();
  };

  const editBtn = document.createElement("button");
  editBtn.innerText = "✏️";
  editBtn.onclick = () => {
    const newText = prompt("Edit Task", task.text);
    if (newText) {
      span.innerText = newText;
      saveTasks();
    }
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "🗑️";
  deleteBtn.onclick = () => {
    tasksList.removeChild(li);
    saveTasks();
  };

  li.append(span, editBtn, deleteBtn);
  tasksList.appendChild(li);
}

addTaskBtn.onclick = () => {
  const text = taskInput.value.trim();
  if (text) {
    addTaskToUI({ text, done: false });
    saveTasks();
    taskInput.value = "";
  }
};

tasksHeader.onclick = () => {
  tasksContainer.classList.toggle("collapsed");
  collapseIcon.innerHTML = tasksContainer.classList.contains("collapsed") ? "&#9660;" : "&#9650;";
};

loadTasks();
