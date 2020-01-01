
// ui hooks.
const btnSave = document.getElementById("btn-save");
btnSave.addEventListener("click", saveEntry);

const titleElement = document.getElementById("entry-title");
const textElement = document.getElementById("entry-text");

// global variable to hold a reference to the database.
let db = null;
var postDate = new Date();
var calendarData = {};

// read all current entries in the 
function getEntries(){

    // connect to the data store
    const tx = db.transaction("journal_entries","readonly");

    // read the datastore into memory
    const entries = tx.objectStore("journal_entries");

    // request a curor object to hold the results
    const request = entries.openCursor();

    // onsuccess of reading the datasore, obtain the cursor object into a variable.
    request.onsuccess = e=> {
        const cursor = e.target.result;
        if(cursor){

            //process current row
            console.log(`Journal Entry: ${cursor.value.title}, text: ${cursor.value.text}, Date: ${cursor.value.date}`);

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
    const tx = db.transaction("journal_entries", "readwrite");

    // trap and respond to errors.
    tx.onerror = e=> console.log(`Error! ${e.target.error}`);

    // read the datastore into memory.
    const jEntries = tx.objectStore("journal_entries");

    // add the record to the datastore.
    jEntries.add(entry);

    $('.toast').toast('show');
    resetForm();
}

// this process runs on page launch. the api verifies  the database and version. If it doesn't exist,
// it is created.
function openBrowserDB() {

    const dbName = "Juurnii";
    const dbVersion = "1.0";
    const request = indexedDB.open(dbName,dbVersion);
    
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

function resetForm(){
    titleElement.value = "";
    textElement.value="";
    titleElement.focus();
}


titleElement.focus();
openBrowserDB();