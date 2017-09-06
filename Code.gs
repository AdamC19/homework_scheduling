/** Copyright 2017 Adam Cordingley
 *
 *  This code is provided as is. No guarantees.
 *
 */


/**
 *  Intended to be called by an On Form Submit Trigger, does the main work of the script
 *
 *  @return {void}
 */

function main() {
  var calendarID   = secrets.MAIN_CALENDAR_ID; // define in separate file
  var hwCalendarID = secrets.HW_CALENDAR_ID;   // define in separate file
  var form         = FormApp.getActiveForm();
  var allResponses = form.getResponses();
  
  //most recent response is appended to the end of the list
  
  try{
    
    var response      = allResponses[allResponses.length - 1];
    var itemResponses = response.getItemResponses();
    
    var descrip = itemResponses[0].getResponse();
    var class   = itemResponses[1].getResponse();
    var dueDate = itemResponses[2].getResponse();
    var details = itemResponses[3].getResponse();
    
    //retrieve calendar
    
    var calendar   = CalendarApp.getCalendarById(calendarID);
    var hwCalendar = CalendarApp.getCalendarById(hwCalendarID);
    
    var startTime = new Date(dueDate);              //when to begin the search
    startTime.setHours(startTime.getHours()+4);     //correct for time zones
    var endTime   = new Date(startTime.toString()); //when to end search
    endTime.setDate(startTime.getDate() + 1);       //set to 24hr in future
    
    var events    = calendar.getEvents(startTime, 
                                       endTime, 
                                       {search: class.toString()}); //get array of events
    
    var event;
    
    if(events.length > 0){
      //at least one event exists
      event = events[0];    
      
      //create an event on the Homework Calendar
      var hwEvent = hwCalendar.createEvent("Homework for "+class+" is due", event.getStartTime(), event.getEndTime(), makeDescrip(event.getStartTime(),descrip, details));
      
    }else{
      //create Homework event at midnight on the due date
      var endAt = new Date(startTime.toString());
      endAt.setMinutes(endAt.getMinutes()+50);
      
      //create an event on the Homework calendar
      event = hwCalendar.createEvent("Homework due for " + class, startTime, endAt);
    }
    
    //modify event
    var currentDescrip = event.getDescription();
    event.setDescription(currentDescrip+"\n"+makeDescrip(event.getStartTime(),descrip, details));
    event.addPopupReminder(24*60); //reminder 1 day before homework is due
    
    
  }catch(e){
    //Log to spreadsheet
    logError(e);
    
  }
  
  
}

/**
 * Constructs a description for a calendar event
 * 
 * @param {Date} time the time that the event occurs
 * @param {String} text description of the homework
 * @param {String} dets extra details to include
 * 
 * @return {String} the description
 */
function makeDescrip(time, text, dets){
  try{  
    return text+" is due today at "+formatTime(time)+"\n\n"+dets;//time.getHours()+":"+time.getMinutes()
  }catch(e){
    logError(e);
    return "Homework is due today.\n\n";
  }
  
}

/**
 * Formats a date using Java's SimpleDateFormat.
 *
 * @param {Date} time A javascript Date object.
 * @return {String} a String representation of the time formatted correctly
 */
function formatTime(time){
  return Utilities.formatDate(time, "America/New_York", "H:mm");
}

/**
 * This method records the an error in a spreadsheet, on a sheet defined in a secrets object
 *
 * @param e {Error} the error to be logged in the spreadsheet
 */
function logError(e){
  //indexed by row, then column
  var time  = new Date();
  var data  = [ [time.toString(), e.message(), e] ]; 
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(secrets.ERROR_SHEET_NAME);
  
  //Add data to spreadsheet
  var row   = 1;
  var col   = 1;
  var nRows = 1;
  var nCols = 3;
  
  while(sheet.getRange(row,col).getValue() !== ""){
    row++;
  }
  
  var range = sheet.getRange(row,col,nRows,nCols);
  range.setValues(data);
  
}
