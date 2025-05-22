
let url = document.getElementById('url')
let title = document.getElementById('title')
const btn = document.getElementsByClassName('Btn')[0]
const towatchContainer = document.getElementById('SaveContainer')
const clearBtn = document.getElementById('clearBtn')
let enteredDate = document.getElementById('date')
let enteredTime = document.getElementById('time')
let deleteBtns = document.querySelectorAll('.deleteBtn');
let savedItems = document.getElementsByClassName('subContainer')
let themeBtn = document.getElementById('changeTheme')

chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    url.value = tabs[0].url
});

displayToWatchItems()
clearBtn.addEventListener('click',()=>{
  savedItems = document.getElementsByClassName('subContainer')
  clearToWatchList(()=>{
    displayToWatchItems()
  })
  chrome.runtime.sendMessage({
                msg:'removeAllAlarms'
              })
})

//get the theme at start
chrome.storage.sync.get('theme', (data)=>{
  if (data.theme === 'dark'){
    themeBtn.textContent = 'Light'
    document.body.setAttribute('data-theme', 'dark')
  }else if(data.theme === 'light'){
    themeBtn.textContent = 'Dark'
    document.body.removeAttribute('data-theme')
  }
})


themeBtn.addEventListener('click',()=>{
  if (themeBtn.textContent === 'Dark'){
    document.body.setAttribute('data-theme', 'dark')
    chrome.storage.sync.set({ theme:'dark' });
    themeBtn.textContent = 'Light'
  }else if (themeBtn.textContent === 'Light'){
     document.body.removeAttribute('data-theme')
     chrome.storage.sync.set({ theme:'light' });
     themeBtn.textContent = 'Dark'
  }
})

btn.addEventListener('click',()=>{
  if(url.value != '' && title.value != ''){
    tempUrl = url.value
    tempTitle = title.value
    tempDate = enteredDate.value
    tempTime = enteredTime.value
    saveToWatchItem(tempTitle,tempUrl, tempTime, tempDate,()=>{
      displayToWatchItems()
    })
    url.value = ''
    title.value = ''

    // send Time for timer
    if (enteredDate.value != '' && enteredTime.value != ''){
      chrome.runtime.sendMessage({
        msg: "get_time",
        id: tempTitle, 
        data: {
            val:timeDifference(tempDate,tempTime)
        }
      });
    }

  }else{
    alert('fill out all the fields')
  }
});


//Functions
function saveToWatchItem(title, url, time,date, callback) {
    const newItem = { title, url, time, date };
    
    chrome.storage.local.get(['toWatchList'], (result) => {
        const currentList = result.toWatchList || [];
        currentList.push(newItem);
        chrome.storage.local.set({ toWatchList: currentList }, () => {
            console.log('Saved:', newItem);
            if (callback) callback()
        });
    });
}

function displayToWatchItems() {
    chrome.storage.local.get(['toWatchList'], (result) => {
        const container = document.getElementById('SaveContainer');
        container.innerHTML = '';
        
        const list = result.toWatchList || [];
        list.forEach(item => {
            const subContainer = document.createElement('div')
            subContainer.className = 'subContainer'

            const titleElem = document.createElement('h3');
            titleElem.textContent = item.title;

            const urlElem = document.createElement('a');
            urlElem.target = '_blank';
            urlElem.textContent = item.url;
            urlElem.href = item.url;

            const timeElem = document.createElement('p')
            timeElem.textContent = item.date +', '+ item.time;

            const deleteBtn = document.createElement('button')
            deleteBtn.textContent = 'delete'
            deleteBtn.className = 'deleteBtn'
            deleteBtn.onclick = ()=>{
              let currentList = []
              let newList = []

              chrome.storage.local.get(['toWatchList'],(result)=>{
                currentList = result.toWatchList || [];
              })
              for (let i=0;i<currentList.length;i++){
                if (currentList[i].url === item.url){
                  newList = currentList.slice(i,1)
                }
              }
              chrome.storage.local.set({ toWatchList: newList })

              //Remove the alarm
              chrome.runtime.sendMessage({
                msg:'removeAlarm',
                id:item.title
              })

              deleteBtn.parentElement.remove()
            }

            container.appendChild(subContainer)
            subContainer.appendChild(titleElem);
            subContainer.appendChild(urlElem);
            subContainer.appendChild(timeElem)
            subContainer.appendChild(deleteBtn)
            
        });
    });
}

function clearToWatchList(callback){
  chrome.storage.local.clear(() => {
  if (chrome.runtime.lastError) {
    console.error('Error clearing local storage:', chrome.runtime.lastError);
  } else {
    console.log('Local storage cleared.');
    if (callback) callback()
  }
});
}

function timeDifference(date,time){
  let currentDate = new Date()
  let givenDate = new Date(date + `T${time}`)
  let difference = givenDate - currentDate
  return difference/60000
}

