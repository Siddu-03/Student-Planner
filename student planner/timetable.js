// timetable.js

const timetable = document.getElementById("timetable");

function loadTimetable() {
  const savedData = JSON.parse(localStorage.getItem("planner-timetable") || "{}");
  Array.from(timetable.rows).forEach((row, rIdx) => {
    if (rIdx === 0) return; // Skip header
    Array.from(row.cells).forEach((cell, cIdx) => {
      if (cIdx === 0) return; // Skip Day column
      const key = `${rIdx}-${cIdx}`;
      if (savedData[key]) cell.innerText = savedData[key];
      cell.onclick = () => {
        const subject = prompt("Enter Subject:", cell.innerText);
        if (subject !== null) {
          cell.innerText = subject;
          savedData[key] = subject;
          localStorage.setItem("planner-timetable", JSON.stringify(savedData));
        }
      };
    });
  });
}

loadTimetable();
