
/**
 * Life Blueprinted - Templates API
 * Deploy this as a Web App in Google Apps Script attached to your Template Spreadsheet.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const path = e.parameter.path || 'blueprints';
  const blueprint_id = e.parameter.blueprint_id;
  const timeline_id = e.parameter.timeline_id;

  try {
    let result;
    switch(path) {
      case 'blueprints':
        result = getSheetData('Blueprints');
        break;
      case 'timelines':
        result = getSheetData('Timelines').filter(t => !blueprint_id || t.blueprint_id === blueprint_id);
        break;
      case 'timeline':
        if (!timeline_id) throw new Error('timeline_id is required');
        result = getTimelineFullData(timeline_id);
        break;
      case 'syncTask':
        const title = e.parameter.title;
        const details = e.parameter.details;
        const dateStr = e.parameter.date;
        if (!title || !dateStr) throw new Error('title and date are required for sync');
        
        // Robust date parsing for all-day events
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        
        const event = CalendarApp.getDefaultCalendar().createAllDayEvent(title, date, { description: details });
        result = { success: true, eventId: event.getId() };
        break;
      case 'exportAll':
        result = {
          blueprints: getSheetData('Blueprints'),
          timelines: getSheetData('Timelines'),
          tasklists: getSheetData('TaskLists'),
          tasks: getSheetData('Tasks')
        };
        break;
      default:
        throw new Error('Invalid endpoint');
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      let val = row[i];
      // Type conversions
      if (header === 'sort_order' || header === 'offset_days' || header === 'suggested_window_days') {
        val = parseInt(val) || 0;
      } else if (header === 'is_optional') {
        val = !!val;
      }
      obj[header] = val;
    });
    return obj;
  });
}

function getTimelineFullData(timelineId) {
  const timelines = getSheetData('Timelines');
  const timeline = timelines.find(t => t.timeline_id === timelineId);
  if (!timeline) throw new Error('Timeline not found');

  const tasklists = getSheetData('TaskLists').filter(tl => tl.timeline_id === timelineId);
  const tlIds = tasklists.map(tl => tl.tasklist_id);
  const tasks = getSheetData('Tasks').filter(t => tlIds.includes(t.tasklist_id));

  return {
    timeline,
    tasklists,
    tasks
  };
}
