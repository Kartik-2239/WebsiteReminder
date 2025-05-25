
let userAlarms = []

chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        if (request.msg === "get_time") {
            //  To do something
            console.log(request.data.val)
            userAlarms.push({
                name: request.id,
                delay:request.data.val
            })
            chrome.alarms.create(request.id, {
                delayInMinutes: request.data.val
            });
            console.log(`saved alarm ${request.id}`)


        }else if(request.msg === "removeAlarm"){
            userAlarms = userAlarms.filter(alarm => alarm.name !== request.id)
            chrome.alarms.clear(request.id)
            console.log(`removed alarm ${request.id}`)

        }else if(request.msg === "removeAllAlarms"){
            chrome.alarms.clearAll()

        }else{
            console.log('failure')
        }
    }
);

    
chrome.alarms.onAlarm.addListener((alarm) => {

    console.log('Alarm fired:', alarm.name);
        chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon-48.png',
        title: `Reminder ${alarm.name}`,
        message: `Reminder "${alarm.name}" has ended.`,
        priority: 2
    });


    console.log('reminderList')
    console.log(alarm.name)
    chrome.storage.local.get(['toWatchList'], (result) => {
        let currentlyList = result.toWatchList || []
        for (let i = 0;i<currentlyList.length;i++){
        if (currentlyList[i].title === alarm.name){ 
            currentlyList[i].title += ' ✓'
        }
        }
        chrome.storage.local.set({ toWatchList: currentlyList })
    })
});


