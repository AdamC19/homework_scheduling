// Copyright 2017 Adam Cordingley
//


/**
 *  Intended to be called by an On Form Submit Trigger, does the main work of the script
 *
 *  @return {void}
 */

function main() {
  var calendarID   = "main_calendar_id";
  var hwCalendarID = "homework_calendar_id";
  var form         = FormApp.getActiveForm();
  var allResponses = form.getResponses();
  
  Logger.clear();
  //most recent response is appended to the end of the list
  
  try{
    
    var response      = allResponses[allResponses.length - 1];
    var itemResponses = response.getItemResponses();
    
    var descrip = itemResponses[0].getResponse();
    var class   = itemResponses[1].getResponse();
    var dueDate = itemResponses[2].getResponse();
    var details = itemResponses[3].getResponse();
    Logger.log(descrip + " for " + class + " due: " + dueDate);
    
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
    
    Logger.log(events.length+" events between ("+startTime+") and ("+endTime+")" );
    
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
    Logger.log(e);
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
    return text+" is due today at "+time.getHours()+":"+time.getMinutes()+"\n\n"+dets;
  }catch(e){
    Logger.log(e);
    return "Homework is due today.\n\n";
  }
  
}
