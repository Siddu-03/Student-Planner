// calendar.js

// Get today's date
const today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

const calendar = document.getElementById("calendar");

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function renderCalendar(month, year) {
  calendar.innerHTML = "";

  const firstDay = new Date(year, month).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const header = document.createElement("div");
  header.className = "calendar-header";
  header.innerHTML = `
    <button id="prev-month">←</button>
    <h3>${months[month]} ${year}</h3>
    <button id="next-month">→</button>
  `;
  calendar.appendChild(header);

  const daysRow = document.createElement("div");
  daysRow.className = "calendar-days-row";
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day-name";
    dayDiv.innerText = day;
    daysRow.appendChild(dayDiv);
  });
  calendar.appendChild(daysRow);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    dayCell.className = "calendar-day";
    dayCell.innerText = day;

    const key = `${year}-${month + 1}-${day}`;
    if (localStorage.getItem(key)) {
      dayCell.classList.add("has-task");
    }

    dayCell.addEventListener("click", () => {
      const task = prompt("Enter event/task for " + key, localStorage.getItem(key) || "");
      if (task !== null) {
        if (task.trim()) {
          localStorage.setItem(key, task);
          dayCell.classList.add("has-task");
        } else {
          localStorage.removeItem(key);
          dayCell.classList.remove("has-task");
        }
      }
    });

    grid.appendChild(dayCell);
  }

  calendar.appendChild(grid);

  document.getElementById("prev-month").onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
  };

  document.getElementById("next-month").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  };
}

// Initial render
renderCalendar(currentMonth, currentYear);
