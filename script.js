window.addEventListener("DOMContentLoaded", () => {
  // 1. タスクを追加する関数
  function addTask() {
    const input = document.getElementById("taskInput");
    const taskText = input.value.trim();
    if (taskText === "") return;

    const li = document.createElement("li");

    // チェックボックス
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.onchange = function () {
      if (checkbox.checked) {
        li.style.textDecoration = "line-through";
      } else {
        li.style.textDecoration = "none";
      }
    };
    li.appendChild(checkbox);

    // タスク名
    const span = document.createElement("span");
    span.textContent = taskText;
    li.appendChild(span);

    // 削除ボタン
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.onclick = function () {
      li.remove();
    };
    li.appendChild(deleteBtn);

    // リストに追加
    document.getElementById("taskList").appendChild(li);

    // 入力欄を空にする
    input.value = "";
  }

  // 2. Enterキーで追加
  const input = document.getElementById("taskInput");
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      addTask();
    }
  });

  // 追加ボタンに関数を紐付け
  const addBtn = document.querySelector("button");
  addBtn.addEventListener("click", addTask);
});
