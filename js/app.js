
// ui hooks.
const btnCreateDb = document.getElementById("btn-create-db");
btnCreateDb.addEventListener("click", createWebDatabase);

const btnNewEntry = document.getElementById("btn-new-entry");
btnNewEntry.addEventListener("click", addEntry);

const btnViewEntries = document.getElementById("btn-view-entries");
btnViewEntries.addEventListener("click", getEntries);

// global variable to hold a reference to the database.
let db = null;

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
            console.log(`Journal Entry: ${cursor.value.title}, text: ${cursor.value.text}, Date: ${cursor.key}`);

            // go to next row. call required for iteration.
            cursor.continue();
        }
    };
}

// add a record to the datastor using a indexdb transaction.
function addEntry(){
    var today = new Date();
    const entry = {
        title: "My first journal entry",
        date: today,
        text: "this is my first journal entry."
    };

    // connect to the datastore that was created in the onupgradeneeded callback.
    const tx = db.transaction("journal_entries", "readwrite");

    // trap and respond to errors.
    tx.onerror = e=> console.log(`Error! ${e.target.error}`);

    // read the datastore into memory.
    const jEntries = tx.objectStore("journal_entries");

    // add the record to the datastore.
    jEntries.add(entry);
}

// this process runs on every call. the api verifies  the database and version. If it doesn't exist,
// it is created.
function createWebDatabase() {

    const dbName = document.getElementById("database-name").value;
    const dbVersion = document.getElementById("database-version").value;
    const request = indexedDB.open(dbName,dbVersion);
    
    //databases and datastores (tables) are created in this callback.
    request.onupgradeneeded = e => {
        db = e.target.result;

        /* journalEntry = {
            title:"Title",
            text: "What happened today?",
            date: getDate()
        }*/

        // creat the data store and define the key field.
        const journalEntry = db.createObjectStore("journal_entries",{keyPath:"date"});
        
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