const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================


// helper functions
function timeStringToSeconds(timeString) {
    const [time, modifier] = timeString.split(" ");
    
    
    const [hStr, mStr, sStr] = time.split(":").map(part => part.padStart(2, "0"));
    const hours = parseInt(hStr);
    const minutes = parseInt(mStr);
    const seconds = parseInt(sStr);

    let hour24 = hours;
    if (modifier === "pm" && hours !== 12) {
        hour24 += 12;
    } else if (modifier === "am" && hours === 12) {
        hour24 = 0;
    }
    
    return hour24 * 3600 + minutes * 60 + seconds;
}






function durationStringToSeconds(durationStr) {
    
    if (durationStr.includes(":")) {
       
        const [hStr, mStr, sStr] = durationStr.split(":").map(part => part.padStart(2, "0"));
        return parseInt(hStr) * 3600 + parseInt(mStr) * 60 + parseInt(sStr);
    } else {
        
        const padded = durationStr.padStart(6, "0");
        const hours = parseInt(padded.slice(0, padded.length - 4)) || 0;
        const minutes = parseInt(padded.slice(-4, -2));
        const seconds = parseInt(padded.slice(-2));
        return hours * 3600 + minutes * 60 + seconds;
    }
}



function secondsToDurationString(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const remaining = totalSeconds % 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

   
    const hStr = String(hours);                    
    const mStr = String(minutes).padStart(2, "0"); 
    const sStr = String(seconds).padStart(2, "0"); 
    
    return `${hStr}:${mStr}:${sStr}`;
}





function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function

    const startSeconds = timeStringToSeconds(startTime);
    const endSeconds = timeStringToSeconds(endTime);
   let durationSeconds;

   if (endSeconds < startSeconds) {
    durationSeconds = (24 * 3600 - startSeconds) + endSeconds;
   } else {
    durationSeconds = endSeconds - startSeconds;
   }

    return secondsToDurationString(durationSeconds);

}


// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function

        const startSeconds = timeStringToSeconds(startTime);
        const endSeconds = timeStringToSeconds(endTime);
        let idleSeconds = 0;
        const deliveryStart = 8 * 3600;   //8 am
        const deliveryEnd = 22 * 3600;    // 10 pm


        // example start 7:30 = 27,000   and shift starts 28,800   . so idle is 28,800 - 27,000
      if(startSeconds<deliveryStart){
        idleSeconds+= deliveryStart-startSeconds;
      }
      
      if(endSeconds>deliveryEnd){
        idleSeconds+= endSeconds-deliveryEnd;
      }

    return secondsToDurationString(idleSeconds);

}


// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    // TODO: Implement this function
        const shiftSeconds = durationStringToSeconds(shiftDuration);
        const idleSeconds = durationStringToSeconds(idleTime);
        let activeSeconds = shiftSeconds - idleSeconds;

        if (activeSeconds < 0) {
            activeSeconds = 0;
           }
    return secondsToDurationString(activeSeconds);  

}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
     const normalQuotaSeconds=30240;
     const eidQuotaSeconds=21600;
     const secondsActive= durationStringToSeconds(activeTime)
     const year = parseInt(date.slice(0, 4));   
     const month = parseInt(date.slice(5, 7)); 
     const day = parseInt(date.slice(8, 11)); 

    if (year === 2025 && month === 4 && day >= 10 && day <= 30) {
    
      if ( secondsActive < eidQuotaSeconds) {
        return false
      }else {
        return true
      }

    }  else {
    if ( secondsActive < normalQuotaSeconds) {
        return false
      }else {
        return true
      }

    }

}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
  

const content = fs.readFileSync(textFile, 'utf8');
const lines = content.trim().split('\n'); 

const key = `${shiftObj.driverID}-${shiftObj.date}`;

// duplicate shift found
for (let line of lines) {
    const cols = line.split(',');
    if (cols[0] === shiftObj.driverID && cols[2] === shiftObj.date) {
        return {};  
    }
}
//rest of columns

const shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
const idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
const activeTime = getActiveTime(shiftDuration, idleTime);
const metQuotaResult = metQuota(shiftObj.date, activeTime);
const hasBonus = false;



//insetion 

let insertAfterIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].split(',')[0] === shiftObj.driverID) {
        insertAfterIndex = i;  
    }
}

const newRow = [
    shiftObj.driverID,
    shiftObj.driverName, 
    shiftObj.date,
    shiftObj.startTime,
    shiftObj.endTime,
    shiftDuration,
    idleTime,
    activeTime,
    metQuotaResult,
    hasBonus
].join(',');



if (insertAfterIndex === -1) {
    lines.push(newRow);  // if no driver
} else { // insert after last
    lines.splice(insertAfterIndex + 1, 0, newRow);  
}

fs.writeFileSync(textFile, lines.join('\n') + '\n');

return {
    driverID: shiftObj.driverID,
    driverName: shiftObj.driverName,
    date: shiftObj.date,
    startTime: shiftObj.startTime,
    endTime: shiftObj.endTime,
    shiftDuration,
    idleTime,
    activeTime,
    metQuota: metQuotaResult,
    hasBonus
};

}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
  const content = fs.readFileSync(textFile, 'utf8');
  const lines = content.trim().split('\n');
    
for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(',');

    if (cols[0] === driverID && cols[2] === date) {
        cols[9] = newValue;
        lines[i] = cols.join(',');
        break;
    }
}

fs.writeFileSync(textFile, lines.join('\n') + '\n');

}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    const content = fs.readFileSync(textFile, 'utf8');
    const lines = content.trim().split('\n');

    const targetMonth = parseInt(month, 10);

    let bonusCount = 0;
    let driverFound = false;

    for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(',');

        if (cols[0] === driverID) {
            driverFound = true;

            const rowMonth = parseInt(cols[2].slice(5, 7), 10);
            const hasBonus = cols[9].trim() === "true";

            if (rowMonth === targetMonth && hasBonus) {
                bonusCount++;
            }
        }
    }

    if (!driverFound) {
        return -1;
    }

    return bonusCount;
}


// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    const content = fs.readFileSync(textFile, 'utf8');
    const lines = content.trim().split('\n');
  
    const targetMonth = parseInt(month, 10);

    let totalSeconds=0;

     for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(',');

        if (cols[0] === driverID && parseInt(cols[2].slice(5, 7), 10) == targetMonth) {  
           totalSeconds+= durationStringToSeconds(cols[7])
        }
    }
   

    return secondsToDurationString(totalSeconds);



}


// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function

    const rates = fs.readFileSync(rateFile, 'utf8');
    const content = fs.readFileSync(textFile, 'utf8');
    const lines = content.trim().split('\n');
    const rateslines = rates.trim().split('\n');
    const normalQuotaSeconds=30240;
    const eidQuotaSeconds=21600;
    let dayOff=" ";
    let requiredHours=0;
    for (let i = 0; i < rateslines.length; i++){
        const cols = rateslines[i].split(',');
        if(cols[0] == driverID){
            dayOff=cols[1];
        }
    }
    // loop shifts
    for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (new Date(cols[2]).toLocaleDateString('en-US', { weekday: 'long' })!=dayOff && cols[0] === driverID && parseInt(cols[2].slice(5, 7), 10) == month) {
          
          const year = parseInt(cols[2].slice(0,4));
          const monthNum = parseInt(cols[2].slice(5,7));
          const day = parseInt(cols[2].slice(8,10));

          if (year === 2025 && monthNum === 4 && day >= 10 && day <= 30) {
            requiredHours+=eidQuotaSeconds;
          }
          else {
            requiredHours+=normalQuotaSeconds;
          }

        }

    }

    // bonus reduction
    

    requiredHours -= bonusCount * 7200;

    if (requiredHours < 0) {
    requiredHours = 0;
    }


   return secondsToDurationString(requiredHours);
    
}




// ========================
// ====================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function

const rates = fs.readFileSync(rateFile, 'utf8');
const rateslines = rates.trim().split('\n');
let tier="";
let netPay=0;   
let deductionRateperHour=0;
let missingHours=0;
let basePay=0;
for (let i = 0; i < rateslines.length; i++){
        const cols = rateslines[i].split(',').map(col => col.trim());
        if(cols[0] == driverID){
            tier=cols[3];
            basePay=parseInt(cols[2]);
            deductionRateperHour=parseInt(cols[2])/185;
        }
    }
if (durationStringToSeconds(actualHours) >= durationStringToSeconds(requiredHours)) {
    return basePay;
} else if (durationStringToSeconds(actualHours) < durationStringToSeconds(requiredHours)) {
 
      missingHours = secondsToDurationString(durationStringToSeconds(requiredHours) - durationStringToSeconds(actualHours));
      if (tier === "1") {
          missingHours = durationStringToSeconds(missingHours);
          if (missingHours <=180000) {
            missingHours=0;
          } else if (missingHours > 180000 ) {
            missingHours-=180000;
          }
        } else if (tier === "2") {
          missingHours = durationStringToSeconds(missingHours);
            if (missingHours <= 72000) {
                missingHours=0;
            } else if (missingHours > 72000) {
                missingHours-=72000;
            }
        } else if (tier === "3") {
            missingHours = durationStringToSeconds(missingHours);
            if (missingHours <= 36000) {   
                missingHours=0;
            } else if (missingHours > 36000) {
                missingHours-=36000;
            }
        }
        else if (tier === "4") {    
            missingHours = durationStringToSeconds(missingHours);
            if (missingHours <= 10800) {
                missingHours=0;
            } else if (missingHours > 10800) {
                missingHours-=10800;
            }
        }
    }

       const netpay = basePay - (Math.floor(missingHours / 3600) * deductionRateperHour);


return Math.round(netpay);
    
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
