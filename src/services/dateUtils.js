// utils/dateUtils.js
function combineDateWithCurrentTime(dateString) {
    // Parse the date string from the frontend
    const inputDate = new Date(dateString);
  
    // Get the current time
    const currentTime = new Date();
  
    // Combine the date from the frontend with the current time
    inputDate.setHours(currentTime.getHours());
    inputDate.setMinutes(currentTime.getMinutes());
    inputDate.setSeconds(currentTime.getSeconds());
    inputDate.setMilliseconds(currentTime.getMilliseconds());
  
    return inputDate;
  }
  
  module.exports = { combineDateWithCurrentTime };
  