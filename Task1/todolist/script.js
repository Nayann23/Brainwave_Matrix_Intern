let taskCount = 0;

function addTask() {
    const taskContent = document.getElementById("taskContent").value;
    if (!taskContent) {
        alert("Please enter a task!");
        return;
    }

    taskCount++;
    const date = new Date();
    const taskDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    const taskList = document.getElementById("taskList");

    
    const taskCard = document.createElement("div");
    taskCard.classList.add("task-card");


    const taskNumber = document.createElement("div");
    taskNumber.classList.add("task-number");
    taskNumber.innerText = `Task ${taskCount}`;


    const taskContentDiv = document.createElement("div");
    taskContentDiv.classList.add("task-content");
    taskContentDiv.innerText = taskContent;


    const taskDateDiv = document.createElement("div");
    taskDateDiv.classList.add("task-date");
    taskDateDiv.innerText = `Created on: ${taskDate}`;


    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerText = "Delete";
    deleteBtn.onclick = function () {
        taskList.removeChild(taskCard);
    };

    taskCard.appendChild(taskNumber);
    taskCard.appendChild(taskContentDiv);
    taskCard.appendChild(taskDateDiv);
    taskCard.appendChild(deleteBtn);

    taskList.appendChild(taskCard);

    document.getElementById("taskContent").value = "";
}


