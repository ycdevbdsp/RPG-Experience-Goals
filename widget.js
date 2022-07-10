let index, goal, fieldData, currency, userLocale, prevCount, timeout;

function setGoal() {
    if (fieldData['eventType'] === 'tip') {
        if (goal % 1) {
            $("#goal").html(goal.toLocaleString(userLocale, { style: 'currency', currency: currency }));
        } else {
            $("#goal").html(goal.toLocaleString(userLocale, {
                minimumFractionDigits: 0,
                style: 'currency',
                currency: currency
            }));
        }
    } else {
        $("#goal").html(goal);
    }
}

window.addEventListener('onWidgetLoad', async function (obj) {
    fieldData = obj.detail.fieldData;
    console.log(fieldData);
    console.log(obj);
    goal = fieldData["goal"];
    userLocale = fieldData["userLocale"];
    currency = obj["detail"]["currency"]["code"];
    index = fieldData['eventType'] + "-" + fieldData['eventPeriod'];
    if (fieldData['eventType'] === "subscriber-points") {
        index = fieldData['eventType'];
    }
    let count = 0;

    if (typeof obj["detail"]["session"]["data"][index] !== 'undefined') {
        if (fieldData['eventPeriod'] === 'goal' || fieldData['eventType'] === 'cheer' || fieldData['eventType'] === 'tip' || fieldData['eventType'] === 'subscriber-points') {
            count = obj["detail"]["session"]["data"][index]['amount'];
        } else {
            count = obj["detail"]["session"]["data"][index]['count'];
        }
    }
    if (fieldData['botCounter']) {
        goal = await getCounterValue(obj.detail.channel.apiToken);
    }
    setGoal();
    updateBar(fieldData['startXP']);
    prevCount = +fieldData['startXP'];
  
  	/*$("#xpCount").on('webkitAnimationEnd', function() {
      console.log('animation ended');
      $("#xpCount").css('-webkit-animation', 'fadeout 4s linear forwards');
    }, false);*/
  
});

let getCounterValue = apiKey => {
    return new Promise(resolve => {
        fetch("https://api.streamelements.com/kappa/v2/channels/me", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "authorization": `apikey ${apiKey}`
            }, "method": "GET"
        }).then(response => response.json()).then(obj => {
            fetch(`https://api.streamelements.com/kappa/v2/bot/${obj._id}/counters/goal`).then(response => response.json()).then(data => {
                resolve(data.value)
            })
        });
    })
};

window.addEventListener('onSessionUpdate', function (obj) {
    if (typeof obj["detail"]["session"][index] !== 'undefined') {
        if (fieldData['eventPeriod'] === 'goal' || fieldData['eventType'] === 'cheer' || fieldData['eventType'] === 'tip' || fieldData['eventType'] === 'subscriber-points') {
            count = obj["detail"]["session"][index]['amount'];
        } else {
            count = obj["detail"]["session"][index]['count'];
        }
    }
    //updateBar(count);
    console.log("session updated");
});

window.addEventListener('onEventReceived', function (obj) {
    const listener = obj.detail.listener;
    const data = obj.detail.event;

    if (listener === 'bot:counter' && data.counter === "goal") {
        goal = data.value;
        setGoal();
        updateBar(count);
    }

    if (listener === 'subscriber-latest') {
        console.log('new subscriber');
        let xp = data.amount;

        // Determine multiplier

        if (data.gifted === true) {
            console.log("gift xp = " + (xp * fieldData['giftSubWeight']));

            xp *= fieldData['giftSubWeight'];
        }
        else {
            // xp higher than 1 means it's a resub

            if (xp > 1) {
                xp *= fieldData['resubWeight'];
            }
            else
                xp *= fieldData['subWeight'];

            // apply tier multiplier

            if (data.tier === "prime")
                xp *= 1;
            else
                xp *= (data.tier / 1000);  //tiers are 1000, 2000, 3000
        }
    	addXP(xp);
    }

    else if (listener === 'tip-latest') {
        let xp = data.amount;
        xp *= fieldData['tipWeight'];
        console.log("tip xp = " + xp);
    	addXP(xp);
    }

    else if (listener === 'cheer-latest') {
        let xp = data.amount;
        xp *= fieldData['cheerWeight'];
        console.log("cheer XP = " + xp);
      	addXP(xp);
    }
});

function addXP(count) {
    if (count >= goal) {
        if (fieldData['autoIncrement'] > 0 && fieldData.onGoalReach === "increment") {
            goal += fieldData['autoIncrement'];
            setGoal();
            updateBar(prevCount + count);
            return;
        } else if (fieldData.onGoalReach === "reset") {
            fieldData.onGoalReach === "reset";
            count = count % goal;
        }
    }
    clearTimeout(timeout);
    $("body").fadeTo("slow", 1);
    let percentage = Math.min(100, ((prevCount + count) / goal * 100).toPrecision(3));
    $("#bar").css('width', percentage + "%");
    if (fieldData['eventType'] === 'tip') {
        if (count % 1) {
            count = count.toLocaleString(userLocale, { style: 'currency', currency: currency })
        } else {
            count = count.toLocaleString(userLocale, { minimumFractionDigits: 0, style: 'currency', currency: currency })
        }
    }
    xpUp = `+${count}`;
  	el = $("#xpCount");
  	xpClone = el.clone(true);
  	el.before(xpClone);
    $("." + el.attr("class") + ":last").remove();
    $("#xpCount").html(xpUp);
    $("#count").html(+prevCount + count);
    prevCount += count;
    if (fieldData.fadeoutAfter) {
        timeout = setTimeout(() => {
            $("body").fadeTo("slow", 0);
        }, fieldData.fadeoutAfter * 1000);
    }
}

function updateBar(count) {
    if (count === prevCount) return;
    if (count >= goal) {
        if (fieldData['autoIncrement'] > 0 && fieldData.onGoalReach === "increment") {
            goal += fieldData['autoIncrement'];
            setGoal();
            updateBar(count);
            return;
        } else if (fieldData.onGoalReach === "reset") {
            fieldData.onGoalReach === "reset";
            count = count % goal;
        }
    }
    clearTimeout(timeout);
    prevCount = count;
    $("body").fadeTo("slow", 1);
    let percentage = Math.min(100, (count / goal * 100).toPrecision(3));
    $("#bar").css('width', percentage + "%");
    if (fieldData['eventType'] === 'tip') {
        if (count % 1) {
            count = count.toLocaleString(userLocale, { style: 'currency', currency: currency })
        } else {
            count = count.toLocaleString(userLocale, { minimumFractionDigits: 0, style: 'currency', currency: currency })
        }
    }
    $("#count").html(count);
    if (fieldData.fadeoutAfter) {
        timeout = setTimeout(() => {
            $("body").fadeTo("slow", 0);
        }, fieldData.fadeoutAfter * 1000);
    }
}