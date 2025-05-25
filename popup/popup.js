const url = document.getElementById("url");
const title = document.getElementById("title");
const btn = document.getElementsByClassName("Btn")[0];
const enteredDate = document.getElementById("date");
const enteredTime = document.getElementById("time");
const reminderTimeText = document.getElementById("reminderTimeText");
const reminderTimeInfo = document.querySelector(".reminder-time-info");
const deleteBtns = document.querySelectorAll(".deleteBtn");
const savedItems = document.getElementsByClassName("subContainer");
const themeBtn = document.getElementById("changeTheme");
const viewAllBtn = document.getElementById("viewAllBtn");
const backBtn = document.getElementById("backBtn");
const mainScreen = document.getElementById("mainScreen");
const upcomingScreen = document.getElementById("upcomingScreen");
const allRemindersContainer = document.getElementById("allRemindersContainer");
const reminderSearch = document.getElementById("reminderSearch");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearBtn = document.getElementById("clearBtn");
const getBookmarksBtn = document.getElementById("getBookMarks")
const upcomingReminders = document.getElementById('upcomingReminders')


// Set today's date as the default date
const today = new Date();
const formattedDate = today.toISOString().split("T")[0];
enteredDate.value = formattedDate;

// Set a default time (current time + 30 minutes)
const defaultTime = new Date();
defaultTime.setMinutes(defaultTime.getMinutes() + 30);
const hours = String(defaultTime.getHours()).padStart(2, "0");
const minutes = String(defaultTime.getMinutes()).padStart(2, "0");
enteredTime.value = `${hours}:${minutes}`;

// Update reminder time text initially
updateReminderTimeText();

// Set number of reminders

// Update reminder time text when date or time changes
enteredDate.addEventListener("change", updateReminderTimeText);
enteredTime.addEventListener("change", updateReminderTimeText);
enteredTime.addEventListener("input", updateReminderTimeText);



// Function to update the reminder time text
function updateReminderTimeText() {
  if (enteredDate.value && enteredTime.value) {
    const timeUntil = getHumanReadableTimeUntil(
      enteredDate.value,
      enteredTime.value
    );
    reminderTimeText.textContent = `You will be reminded in ${timeUntil}`;
    reminderTimeInfo.classList.add("active");
  } else {
    reminderTimeText.textContent =
      "Select date and time to see when you'll be reminded";
    reminderTimeInfo.classList.remove("active");
  }
}

// Function to get human-readable time until reminder
function getHumanReadableTimeUntil(date, time) {
  const now = new Date();
  const reminderDate = new Date(date + "T" + time);
  const diffMs = reminderDate - now;

  // If the date is in the past
  if (diffMs < 0) {
    return "in the past";
  }

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Less than 1 minute
  if (diffMins < 1) {
    return "in less than a minute";
  }

  // Less than 1 hour
  if (diffMins < 60) {
    return `in ${diffMins} minute${diffMins === 1 ? "" : "s"}`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
  }

  // Less than 7 days
  if (diffDays < 7) {
    return `in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  }

  // More than 7 days - show the actual date
  const options = { weekday: "long", month: "short", day: "numeric" };
  return `on ${reminderDate.toLocaleDateString(undefined, options)}`;
}

// Screen navigation
viewAllBtn.addEventListener("click", () => {
  mainScreen.classList.remove("active");
  upcomingScreen.classList.add("active");
  displayAllReminders();
});



backBtn.addEventListener("click", () => {
  upcomingScreen.classList.remove("active");
  mainScreen.classList.add("active");
});

// Filter buttons
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    const filter = button.getAttribute("data-filter");
    filterReminders(filter);
  });
});

// Search functionality
reminderSearch.addEventListener("input", () => {
  const searchTerm = reminderSearch.value.toLowerCase();
  searchReminders(searchTerm);
});

// Current Tab url
chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
  url.value = tabs[0].url;
});

// No longer need to display reminders on the main page
clearBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear all reminders?")) {
    clearToWatchList(() => {
      displayAllReminders();
    });
    chrome.runtime.sendMessage({
      msg: "removeAllAlarms",
    });
    upcomingReminders.textContent = `All Upcoming Reminders`
  }
});

//get the theme at start
chrome.storage.sync.get("theme", (data) => {
  if (data.theme === "dark") {
    themeBtn.querySelector("span").textContent = "Light";
    document.body.setAttribute("data-theme", "dark");
  } else if (data.theme === "light") {
    themeBtn.querySelector("span").textContent = "Dark";
    document.body.removeAttribute("data-theme");
  }
});

themeBtn.addEventListener("click", () => {
  if (themeBtn.querySelector("span").textContent === "Dark") {
    document.body.setAttribute("data-theme", "dark");
    chrome.storage.sync.set({ theme: "dark" });
    themeBtn.querySelector("span").textContent = "Light";
  } else if (themeBtn.querySelector("span").textContent === "Light") {
    document.body.removeAttribute("data-theme");
    chrome.storage.sync.set({ theme: "light" });
    themeBtn.querySelector("span").textContent = "Dark";
  }
});


btn.addEventListener("click", () => {
  if (url.value != "" && title.value != "") {
    const tempUrl = url.value;
    const tempTitle = title.value;
    const tempDate = enteredDate.value;
    const tempTime = enteredTime.value;
    saveToWatchItem(tempTitle, tempUrl, tempTime, tempDate, () => {
      // No longer need to display reminders on the main page
    });
    url.value = "";
    title.value = "";

    // send Time for timer
    if (enteredDate.value != "" && enteredTime.value != "") {
      chrome.runtime.sendMessage({
        msg: "get_time",
        id: tempTitle,
        data: {
          val: timeDifference(tempDate, tempTime),
        },
      });
    }
  } else {
    alert("Please fill out all the required fields");
  }
});


//Functions
function saveToWatchItem(title, url, time, date, callback) {
  const newItem = { title, url, time, date };

  chrome.storage.local.get(["toWatchList"], (result) => {
    const currentList = result.toWatchList || [];
    currentList.push(newItem);
    chrome.storage.local.set({ toWatchList: currentList }, () => {
      console.log("Saved:", newItem);
      if (callback) callback();
    });
  });
}

function displayAllReminders() {
  chrome.storage.local.get(["toWatchList"], (result) => {
    const container = allRemindersContainer;
    container.innerHTML = "";

    const list = result.toWatchList || [];

    // Sort by date and time
    list.sort((a, b) => {
      const dateA = new Date(a.date + "T" + a.time);
      const dateB = new Date(b.date + "T" + b.time);
      return dateA - dateB;
    });

    if (list.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.innerHTML = `
        <i class="fa-regular fa-calendar"></i>
        <p>No reminders found</p>
      `;
      container.appendChild(emptyState);
      return;
    }

    list.forEach((item) => {
      const subContainer = document.createElement("div");
      subContainer.className = "subContainer";
      subContainer.dataset.date = item.date;

      const titleElem = document.createElement("h3");
      titleElem.textContent = item.title;

      const urlElem = document.createElement("a");
      urlElem.target = "_blank";
      urlElem.textContent = item.url;
      urlElem.href = item.url;

      const timeElem = document.createElement("p");
      timeElem.textContent = formatDateTime(item.date, item.time);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "";
      deleteBtn.className = "deleteBtn";
      deleteBtn.onclick = () => {
        deleteReminder(item);
      };

      // const editBtn = document.createElement("button")
      // editBtn.className = "editBtn";
      // editBtn.textContent = "Dupe";
      // editBtn.onclick = ()=>{
      //   editBtn.id = "removeThis"
      //   upcomingScreen.classList.remove("active");
      //   mainScreen.classList.add("active");
      //   title.value = item.title
      //   url.value = item.url
      //   enteredDate.value = item.date
      //   enteredTime.value = item.time

      //   chrome.runtime.onMessage.addListener(
      //     async function(request, sender, sendResponse) {
      //       if (request.msg === "alarmFinished"){
      //         console.log('reminderList')
      //         console.log(request.name)
      //         chrome.storage.local.get(['toWatchList'], (result) => {
      //           let currentlyList = result.toWatchList || []
      //           let neededList = []
      //           for (let i = 0;i<currentlyList.length;i++){
      //             if (currentlyList[i].title !== item.name){ 
      //               neededList.push(currentlyList[i])
      //             }
      //           }
      //           chrome.storage.local.set({ toWatchList: neededList })
      //         })

      //       }
      //       displayAllReminders()
      //   })

      // }

      container.prepend(subContainer);
      subContainer.appendChild(titleElem);
      subContainer.appendChild(urlElem);
      subContainer.appendChild(timeElem);
      //subContainer.appendChild(editBtn)
      subContainer.appendChild(deleteBtn);

    });
  });
}

function deleteReminder(item) {
  chrome.storage.local.get(["toWatchList"], (result) => {
    const currentList = result.toWatchList || [];
    const newList = currentList.filter(
      (reminder) =>
        !(reminder.title === item.title && reminder.url === item.url)
    );

    chrome.storage.local.set({ toWatchList: newList }, () => {
      // Remove the alarm
      chrome.runtime.sendMessage({
        msg: "removeAlarm",
        id: item.title,
      });

      // Refresh both displays
      if (upcomingScreen.classList.contains("active")) {
        displayAllReminders();
      }
    });
  });
}

function clearToWatchList(callback) {
  chrome.storage.local.clear(() => {
    if (chrome.runtime.lastError) {
      console.error("Error clearing local storage:", chrome.runtime.lastError);
    } else {
      console.log("Local storage cleared.");
      if (callback) callback();
    }
  });
}

function timeDifference(date, time) {
  const currentDate = new Date();
  const givenDate = new Date(date + `T${time}`);
  const difference = givenDate - currentDate;
  return difference / 60000;
}

function formatDateTime(date, time) {
  const reminderDate = new Date(date + "T" + time);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = reminderDate.toDateString() === now.toDateString();
  const isTomorrow = reminderDate.toDateString() === tomorrow.toDateString();

  const timeString = reminderDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Today at ${timeString}`;
  } else if (isTomorrow) {
    return `Tomorrow at ${timeString}`;
  } else {
    return `${reminderDate.toLocaleDateString()} at ${timeString}`;
  }
}

function filterReminders(filter) {
  const reminders = allRemindersContainer.querySelectorAll(".subContainer");
  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  reminders.forEach((reminder) => {
    const reminderDate = new Date(reminder.dataset.date);

    if (filter === "all") {
      reminder.style.display = "block";
    } else if (filter === "today") {
      reminder.style.display =
        reminderDate.toDateString() === now.toDateString() ? "block" : "none";
    } else if (filter === "week") {
      reminder.style.display = reminderDate <= weekFromNow ? "block" : "none";
    }
  });

}

function searchReminders(searchTerm) {
  const reminders = allRemindersContainer.querySelectorAll(".subContainer");
  let visibleCount = 0;

  reminders.forEach((reminder) => {
    const title = reminder.querySelector("h3").textContent.toLowerCase();
    const url = reminder.querySelector("a").textContent.toLowerCase();

    if (title.includes(searchTerm) || url.includes(searchTerm)) {
      reminder.style.display = "block";
      visibleCount++;
    } else {
      reminder.style.display = "none";
    }
  });

  // Remove existing empty state
  const existingEmptyState =
    allRemindersContainer.querySelector(".empty-state");
  if (existingEmptyState) {
    existingEmptyState.remove();
  }

  // Show empty state if no reminders are visible
  if (visibleCount === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <i class="fa-solid fa-search"></i>
      <p>No reminders match your search</p>
    `;
    allRemindersContainer.appendChild(emptyState);
  }
}


function getAllBookmarks() {
    let bookmarks = [];
    chrome.bookmarks.getTree(tree => {
      let arrs = tree[0].children;

      for (let arr of arrs) {
        for (let subarr of arr.children) {
          if (subarr.children) {
            for (let subsubarr of subarr.children) {
              bookmarks.push({
                title: subsubarr.title,
                url: subsubarr.url
              });
            }
          } else {
            bookmarks.push({
              title: subarr.title,
              url: subarr.url
            });
          }
        }
      }

    });
    return bookmarks
}


function asyncSaveToWatchItem(title, url, time, date, callback) {
  return new Promise((resolve, reject) => {
    const newItem = { title, url, time, date };

    chrome.storage.local.get(['toWatchList'], (result) => {
      const currentList = result.toWatchList || [];
      const titles = currentList.map(item => item.title);
      currentList.push(newItem);

      if(!titles.includes(title)){
          chrome.storage.local.set({ toWatchList: currentList }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            console.log('Saved:', newItem);
            if (callback) callback();
            resolve(); 
          }
        });
      }
    });
  });
}

const bookmarks2 = getAllBookmarks()
const bookmarkBtn = document.getElementById('getBookMarks')
bookmarkBtn.addEventListener('click',async ()=>{
  
  console.log(bookmarks2)

  for (i = 0;i<bookmarks2.length;i++){
    const bookmark = bookmarks2[i]
    console.log
    await asyncSaveToWatchItem(bookmark.title,bookmark.url,'','',()=>{displayAllReminders()})
  }
  alert('bookmarks imported')
})


