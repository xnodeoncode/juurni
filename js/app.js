
// ui hooks.
const btnSave = document.getElementById("btn-save");
btnSave.addEventListener("click", saveEntry);

const titleElement = document.getElementById("entry-title");
const textElement = document.getElementById("entry-text");

// global variable to hold a reference to the database.

var postDate = new Date();
var calendarData = {};
var dailyEntries = [];
var db = null;

// this process runs on page launch. the api verifies  the database and version. If it doesn't exist,
// it is created.
function initiateIndexDB() {

    const dbName = "Juurnii";
    const dbVersion = "1.0";
    let request = indexedDB.open(dbName,dbVersion);
    
    //databases and datastores (tables) are created in this callback.
    request.onupgradeneeded = e => {
        
        db = e.target.result;

        // create the data store and define the key field.
        db.createObjectStore("journal_entries",{keyPath:"logdate"});
        
        console.log(`upgrade is called on database name: ${db.name} version : ${db.version}`);
    };

    // the datastore can be read/viewed at during this callback.
    request.onsuccess = e => {

        db = e.target.result;
        console.log(`success is called on database name: ${db.name} version : ${db.version}`);
    };

    // there has been an error accessing the database or the datastore.
    request.onerror = e => {
        console.log('error');
    };
}

initiateIndexDB();

// read all current entries in the indexDB
function getEntries(){

    // connect to the data store
    var tx = db.transaction("journal_entries","readonly");
    
    // read the datastore into memory
    var entries = tx.objectStore("journal_entries");

    // request a curor object to hold the results
    var request = entries.openCursor();

    // onsuccess of reading the datasore, obtain the cursor object into a variable.
    request.onsuccess = e=> {
        var cursor = e.target.result;
        if(cursor){

            //process current row
            console.log(`Journal Entry: ${cursor.value.title}, text: ${cursor.value.text}, Date: ${cursor.value.date}`);

            // add the current value to the collection.
            dailyEntries.push(cursor.value);

            // go to next row. call required for iteration.
            cursor.continue();
        }
    };
}

// add a record to the datastor using a indexdb transaction.
function saveEntry(){
    
    //entry template
    /* journalEntry = {
        logdate: "getMonth()+getDate()+getFullYear()+getHours()+getMinutes()" 070519731213 (July 5, 1973 12:13 pm) non-utc
        title:"Title",
        text: "What happened today?",
        date: getDate()
    }*/

    //read from ui elements.
    let entryTitle = titleElement.value;
    let entryText = textElement.value;

    // build the long date from the selected post date.
    let dateString = postDate.toDateString();
    let timeString = postDate.toTimeString();
    let fullDateString = dateString + " " + timeString;
    
    //build the timestamp from date parts
    let mm = (postDate.getMonth() + 1).toString();
    let dd = postDate.getDate().toString();
    let yy = postDate.getFullYear().toString();

    // the calendar provides the date, the time is calculated based on the current time.
    let now = new Date();
    let hh = now.getHours().toString();
    let min = now.getMinutes().toString();

    // append time to the postDate variable
    postDate.setHours(now.getHours());
    postDate.setMinutes(now.getMinutes());

    let keyField = mm + dd + yy + hh + min;

    // if no title is provided then name it untitled.
    if(entryTitle.length === 0)
        entryTitle = "Untitled";
        
    //if the entry text is blank, just return don't save a blank record.
    if(entryText.length === 0 || entryText === ""){
        console.log("warning: entries with no text are not saved.");
        return;
    }

    // create an entry object
    const entry = {
        logdate: keyField,
        title: entryTitle,
        date: fullDateString,
        text: entryText
    };

    // connect to the datastore that was created in the onupgradeneeded callback.
    var tx = db.transaction("journal_entries", "readwrite");

    // trap and respond to errors.
    tx.onerror = e=> console.log(`Error! ${e.target.error}`);

    // read the datastore into memory.
    var jEntries = tx.objectStore("journal_entries");

    // add the record to the datastore.
    jEntries.add(entry);

    $('.toast').toast('show');
    resetForm();
}

function resetForm(){
    titleElement.value = "";
    textElement.value="";
    titleElement.focus();
}

// set up the calendar
$(document).ready(function () {
    let data = calendarData;
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();

    // inline
    let $ca = $('#calendrier').calendar({
        view: 'date',
        data: data,
        monthArray: ['jan', 'fev', 'mar', 'avr', 'mai', 'jui', 'juil', 'aou', 'sep', 'oct', 'nov', 'dec'],
        weekArray:['dim','lun','mar','mer','jeu','ven','sam'],
        date: new Date(year,month,day),
        onSelected: function (view, date, data) {
            console.log('view:' + view);
            console.log('date:' + date);
            console.log('data:' + (data || ''));
            
            // update the post date on calendar item selection.
            postDate = new Date(date);

            // re-focus after selecting a date.
            titleElement.focus();
        },
        viewChange: function (view, y, m) {
            console.log(view, y, m);
        }
    });

    // feather.replace()
    getEntries();
    titleElement.focus();

});