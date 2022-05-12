'use strict';

// ui hooks.
const saveButton = document.getElementById("btn-save")
                        .addEventListener("click", saveEntry);

const titleElement = document.getElementById("entry-title");
const textElement = document.getElementById("entry-text");
const calendarElement = document.getElementById("#calendrier");
const postListContainer = document.getElementById("postList");


// global variable to hold a reference to the database.
const dbName = "Juurnii";
const dbVersion = "1.0";
const objectStoreName = "journal_entries";
const keyPathField = "logdate";
const dbTransactionModes = {
    ReadWrite:"readwrite",
    ReadOnly:"read"
}
var db = null;

// global variables to pass values between functions.
var postDate = new Date();
var calendarData = {};
var dailyEntries = [];
var journalDb = {};
var index = {};
var tdate = new Date();

// application constants
const defaultTitle = "Untitled";
const emptyBodyWarning = "warning: entries with no text are not saved.";
const calendarElementId = "#calendrier";

// this process runs on page launch. the api verifies the database and version. If it doesn't exist,
// it is created.
function initiateIndexDB() {
    
    let request = indexedDB.open(dbName,dbVersion);
    
    //databases and datastores (tables) are created in this callback.
    request.onupgradeneeded = e => {
        
        db = e.target.result;

        // create the datastore and define the key field.
        db.createObjectStore(objectStoreName,{keyPath:keyPathField})
            .createIndex("by_date","date",{unique: false});
        
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

// read all current entries in the indexedDB
function getEntries(){

    // connect to the datastore
    let tx = db.transaction(objectStoreName)
                .objectStore(objectStoreName);
    
    postListContainer.innerHTML = "";

    // request a cursor object to hold the results
    // onsuccess of reading the datastore, obtain the cursor object into a variable.
    tx.openCursor().onsuccess = e => {
        let cursor = e.target.result;
        if(cursor){

            //process current row
            console.log(`Journal Entry: ${cursor.value.title}, text: ${cursor.value.text}, Date: ${cursor.value.date}`);

            // add the current value to the collection.
            dailyEntries.push(cursor.value);

            let li = document.createElement("li");
            li.innerText = cursor.value.title;
            li.className="list-group-item";

            postListContainer.append(li);

            // go to next row. call required for iteration.
            cursor.continue();
        } else{
            console.log("no entries remaining.")
        }
    };
}

// add a record to the datastore using a indexeddb transaction.
function saveEntry(){
    
    //entry template
    /* journalEntry = {
        logdate:now.getTime() | current date/time in milliseconds since January 1, 1970
        title:"Title",
        text: "What happened today?",
        date: postDate.getDate() | the current date or the selected date from calendar plug in.
    }*/

    //read from ui elements.
    let entryTitle = titleElement.value;
    let entryText = textElement.value;

    // set the key field value based on the current date/time.
    // the calendar provides the post date, the time is calculated based on the current time.
    let now = new Date();
    let keyField = now.getTime();

    // set the time for the postDate to the current time
    postDate.setHours(now.getHours(),now.getMinutes(),now.getSeconds());


    // if no title is provided then name it untitled.
    if(entryTitle.length === 0)
        entryTitle = defaultTitle;
        
    //if the entry text is blank, just return don't save a blank record.
    if(entryText.length === 0 || entryText === ""){
        console.log(emptyBodyWarning);
        return;
    }

    // create an entry object
    const entry = {
        logdate: keyField,
        title: entryTitle,
        date: postDate.toString(),
        text: entryText
    };

    // connect to the datastore that was created in the onupgradeneeded callback.
    let tx = db.transaction(objectStoreName, dbTransactionModes.ReadWrite);

    // trap and respond to errors.
    tx.onerror = e=> console.log(`Error! ${e.target.error}`);

    // read the datastore into memory.
    let entries = tx.objectStore(objectStoreName);

    // add the record to the datastore.
    entries.add(entry);

    $('.toast').toast('show');

    //persist database
    document.cookie = "journal_entries=" + entries.toString();

    console.log(entries.toString());

    resetForm();
    getEntries();
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
    let $ca = $(calendarElementId).calendar({
        view: 'date',
        data: data,
        monthArray: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
        weekArray:['sun','mon','tue','wed','thu','fri','sat'],
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

    getEntries();
    titleElement.focus();

});