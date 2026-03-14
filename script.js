window.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("taskInput");
    const dateInput = document.getElementById("taskDate");
    const timeInput = document.getElementById("taskTime");
    const prioritySelect = document.getElementById("priority");
    const repeatSelect = document.getElementById("repeat");
    const tagsInput = document.getElementById("tags");
    const addBtn = document.getElementById("addBtn");
    const taskList = document.getElementById("taskList");
    const filterBtns = document.querySelectorAll(".filters button");
    const searchInput = document.getElementById("searchInput");
    const calendarDiv = document.getElementById("calendar");
  
    let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    let currentFilter = "all";
    let searchQuery = "";
  
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  
    function saveTasks() {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  
    function sortTasks() {
      const priorityOrder = { "urgent": 0, "important": 1, "normal": 2 };
      tasks.sort((a,b) => priorityOrder[a.priority]-priorityOrder[b.priority]);
    }
  
    function renderTasks() {
      taskList.innerHTML = "";
      const now = new Date().getTime();
  
      sortTasks();
  
      tasks.forEach((task, index) => {
        // フィルター
        if (currentFilter==="active" && task.completed) return;
        if (currentFilter==="completed" && !task.completed) return;
  
        // 検索
        if (searchQuery && !task.text.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !(task.tags && task.tags.some(tag=>tag.toLowerCase().includes(searchQuery.toLowerCase())))) return;
  
        const li = document.createElement("li");
        li.dataset.index = index;
        li.draggable = true;
        li.classList.add(task.priority);
        if(task.completed) li.classList.add("completed");
  
        // 残日数計算
        let taskDateTime = null;
        let daysLeftText = "";
        if(task.date){
          taskDateTime = new Date(task.date+"T"+(task.time||"00:00")).getTime();
          const diffDays = Math.floor((taskDateTime-now)/(1000*60*60*24));
          if(!task.completed && taskDateTime<now) li.classList.add("overdue");
          daysLeftText = diffDays>=0 ? `あと${diffDays}日` : "期限切れ";
        }
  
        // チェックボックス
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        li.appendChild(checkbox);
  
        // タスク名
        const span = document.createElement("span");
        span.textContent = task.text;
        li.appendChild(span);
  
        // タグ表示
        if(task.tags && task.tags.length>0){
          const tagsSpan = document.createElement("span");
          tagsSpan.textContent = task.tags.join(", ");
          tagsSpan.classList.add("tags");
          li.appendChild(tagsSpan);
        }
  
        // 期限表示
        if(task.date){
          const dateSpan = document.createElement("span");
          dateSpan.textContent = task.date;
          dateSpan.classList.add("date");
          li.appendChild(dateSpan);
  
          if(task.time){
            const timeSpan = document.createElement("span");
            timeSpan.textContent = task.time;
            timeSpan.classList.add("time");
            li.appendChild(timeSpan);
          }
  
          const daysSpan = document.createElement("span");
          daysSpan.textContent = daysLeftText;
          daysSpan.classList.add("daysLeft");
          li.appendChild(daysSpan);
  
          // 通知
          if(!task.completed && "Notification" in window && Notification.permission==="granted"){
            const timeDiff = taskDateTime - now;
            if(timeDiff>0 && !task.notified){
              setTimeout(()=>{
                new Notification(`TODOリマインダー: ${task.text}`, {body:`期限: ${task.date} ${task.time||""}`});
                task.notified=true;
                saveTasks();
              }, timeDiff);
            } else if(timeDiff<=0 && !task.notified){
              new Notification(`TODO期限過ぎ: ${task.text}`, {body:`期限: ${task.date} ${task.time||""}`});
              task.notified=true;
            }
          }
        }
  
        // 削除ボタン
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "削除";
        li.appendChild(deleteBtn);
  
        taskList.appendChild(li);
      });
  
      addDragAndDrop();
      renderCalendar();
    }
  
    function addTask(){
      const text = input.value.trim();
      const date = dateInput.value;
      const time = timeInput.value;
      const priority = prioritySelect.value;
      const repeat = repeatSelect.value;
      const tags = tagsInput.value ? tagsInput.value.split(",").map(t=>t.trim()) : [];
      if(!text) return;
      tasks.push({text,date,time,priority,repeat,tags,completed:false,notified:false});
      saveTasks();
      renderTasks();
      input.value=""; dateInput.value=""; timeInput.value=""; prioritySelect.value="normal"; repeatSelect.value="none"; tagsInput.value="";
    }
  
    taskList.addEventListener("click", e=>{
      const li=e.target.closest("li");
      if(!li) return;
      const index = li.dataset.index;
      if(e.target.tagName==="INPUT" && e.target.type==="checkbox"){ tasks[index].completed=e.target.checked; saveTasks(); renderTasks(); }
      if(e.target.tagName==="BUTTON"){ tasks.splice(index,1); saveTasks(); renderTasks(); }
    });
  
    input.addEventListener("keypress", e=>{ if(e.key==="Enter") addTask(); });
    addBtn.addEventListener("click", addTask);
  
    filterBtns.forEach(btn=>{
      btn.addEventListener("click", ()=>{
        currentFilter=btn.dataset.filter;
        filterBtns.forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        renderTasks();
      });
    });
  
    searchInput.addEventListener("input", ()=>{
      searchQuery=searchInput.value.trim();
      renderTasks();
    });
  
    // ドラッグ＆ドロップ、カレンダーの処理は先ほどと同じ
    function addDragAndDrop(){
      const lis = taskList.querySelectorAll("li");
      lis.forEach(li=>{
        li.addEventListener("dragstart", ()=>li.classList.add("dragging"));
        li.addEventListener("dragend", ()=>{
          li.classList.remove("dragging");
          const newTasks=[];
          taskList.querySelectorAll("li").forEach(l=>newTasks.push(tasks[l.dataset.index]));
          tasks=newTasks;
          saveTasks();
          renderTasks();
        });
        li.addEventListener("dragover", e=>{
          e.preventDefault();
          const dragging=taskList.querySelector(".dragging");
          const afterElement=getDragAfterElement(taskList,e.clientY);
          if(!afterElement) taskList.appendChild(dragging);
          else taskList.insertBefore(dragging,afterElement);
        });
      });
    }
  
    function getDragAfterElement(container,y){
      const draggable=[...container.querySelectorAll("li:not(.dragging)")];
      return draggable.reduce((closest,child)=>{
        const box=child.getBoundingClientRect();
        const offset=y-box.top-box.height/2;
        return (offset<0 && offset>closest.offset)?{offset,element:child}:closest;
      },{offset:Number.NEGATIVE_INFINITY}).element;
    }
  
    function renderCalendar(){
      calendarDiv.innerHTML="";
      const today=new Date();
      const year=today.getFullYear();
      const month=today.getMonth();
      const firstDay=new Date(year,month,1);
      const lastDay=new Date(year,month+1,0);
      const startDay=firstDay.getDay();
  
      for(let i=0;i<startDay;i++){ calendarDiv.appendChild(document.createElement("div")); }
  
      for(let day=1;day<=lastDay.getDate();day++){
        const dayDiv=document.createElement("div"); dayDiv.classList.add("calendar-day");
        const dayHeader=document.createElement("h3"); dayHeader.textContent=day; dayDiv.appendChild(dayHeader);
        const currentDateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  
        tasks.forEach(task=>{
          if(task.date===currentDateStr){
            const taskSpan=document.createElement("span"); taskSpan.textContent=task.text; taskSpan.style.display="block";
            taskSpan.style.color=task.priority==="urgent"?"red":task.priority==="important"?"orange":"black"; dayDiv.appendChild(taskSpan);
          }
          if(task.repeat!=="none" && task.date){
            const taskDate=new Date(task.date); const dayDate=new Date(currentDateStr);
            if(task.repeat==="daily" && dayDate>=taskDate){
              const taskSpan=document.createElement("span"); taskSpan.textContent=task.text+" (毎日)"; taskSpan.style.display="block"; dayDiv.appendChild(taskSpan);
            }
            if(task.repeat==="weekly" && dayDate>=taskDate && dayDate.getDay()===taskDate.getDay()){
              const taskSpan=document.createElement("span"); taskSpan.textContent=task.text+" (毎週)"; taskSpan.style.display="block"; dayDiv.appendChild(taskSpan);
            }
            if(task.repeat==="monthly" && dayDate>=taskDate && dayDate.getDate()===taskDate.getDate()){
              const taskSpan=document.createElement("span"); taskSpan.textContent=task.text+" (毎月)"; taskSpan.style.display="block"; dayDiv.appendChild(taskSpan);
            }
          }
        });
  
        calendarDiv.appendChild(dayDiv);
      }
    }
  
    renderTasks();
  });