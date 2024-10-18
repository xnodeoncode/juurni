"use strict";

// ui hooks.
const saveButton = document
  .getElementById("btn-save")
  .addEventListener("click", saveEntry);

const titleElement = document.getElementById("entry-title");
const textElement = document.getElementById("entry-text");
const calendarElement = document.getElementById("calendar");
const postListContainer = document.getElementById("postList");
const postIdElement = document.getElementById("entry-id");
const entryListElement = document.getElementById("entry-list");

// application metadata
const appName = "Juurnii";
const appVersion = "2.0";
const databaseName = "journal_entries";

// global variables to pass values between functions.
var postDate = new Date();
var calendarData = {};
var dailyEntries = [];
var journalDb = {};
var index = {};

// application constants
const defaultTitle = "Untitled";
const emptyBodyWarning = "warning: entries with no text are not saved.";
const calendarElementId = "#calendar";

// read all current entries from the local storage.
function getEntries() {
  let entries = window.localStorage.getItem("journal_entries");

  if (entries !== null) {
    console.log("Journal entries found: ", JSON.parse(entries));
    dailyEntries = JSON.parse(entries);
    postListContainer.innerHTML = "";

    dailyEntries.sort((a, b) => {
      return b.date - a.date;
    });

    dailyEntries.forEach((entry) => {
      let li = document.createElement("li");
      li.innerText = entry.title;
      li.className = "list-group-item";
      li.setAttribute("style", "cursor:pointer");

      postListContainer.append(li);

      li.addEventListener("click", function () {
        titleElement.value = entry.title;
        textElement.value = entry.text;
        postIdElement.value = entry.id;
      });
    });
  }
}

function loadEntriesForDate(postDate) {
  let entries = window.localStorage.getItem("journal_entries");
  let entriesForDate = [];

  if (entries !== null) {
    dailyEntries = JSON.parse(entries);

    entriesForDate = dailyEntries.filter((entry) => {
      let entryDate = new Date(entry.date);
      return entryDate.toDateString() === postDate.toDateString();
    });

    entriesForDate.sort((a, b) => {
      return b.date - a.date;
    });

    entryListElement.innerHTML = "";

    entriesForDate.forEach((entry) => {
      let li = document.createElement("li");
      li.innerText = entry.title;
      li.className = "list-group-item";
      li.setAttribute("style", "cursor:pointer");

      entryListElement.append(li);

      li.addEventListener("click", function () {
        titleElement.value = entry.title;
        textElement.value = entry.text;
        postIdElement.value = entry.id;
      });
    });
  }
}

function saveEntry() {
  //read from ui elements.
  let entryTitle = titleElement.value;
  let entryText = textElement.value;
  let postId = postIdElement.value;

  // set the key field value based on the current date/time.
  // the calendar provides the post date, the time is calculated based on the current time.
  let now = new Date();
  let keyField = now.getTime();

  // set the time for the postDate to the current time
  postDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

  // if no title is provided then name it untitled.
  if (entryTitle.length === 0) entryTitle = defaultTitle;

  //if the entry text is blank, just return don't save a blank record.
  if (entryText.length === 0 || entryText === "") {
    console.log(emptyBodyWarning);
    return;
  }

  // create an entry object
  const entry = {
    id: postId > 0 ? postId : new Date().getTime(),
    logdate: keyField,
    title: entryTitle,
    date: postDate.toString(),
    text: entryText,
    modified: new Date().toString(),
  };

  if (postId > 0) {
    let index = dailyEntries.findIndex((entry) => entry.id == postId);
    let oldEntry = dailyEntries[index];
    entry.logdate = oldEntry.logdate;
    entry.date = oldEntry.date;
    entry.id = oldEntry.id;
    dailyEntries[index] = entry;
  } else {
    dailyEntries.push(entry);
  }

  dailyEntries.sort((a, b) => {
    return b.date - a.date;
  });

  window.localStorage.setItem("journal_entries", JSON.stringify(dailyEntries));

  $(".toast").toast("show");

  resetForm();
  getEntries();
  loadEntriesForDate(postDate);
}

function resetForm() {
  titleElement.value = "";
  textElement.value = "";
  titleElement.focus();
  postIdElement.value = 0;
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
    view: "date",
    data: data,
    monthArray: [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ],
    weekArray: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
    date: new Date(year, month, day),
    onSelected: function (view, date, data) {
      console.log("view:" + view);
      console.log("date:" + date);
      console.log("data:" + (data || ""));

      // update the post date on calendar item selection.
      postDate = new Date(date);

      loadEntriesForDate(postDate);

      // re-focus after selecting a date.
      titleElement.value = "";
      textElement.value = "";
      titleElement.focus();
    },
    viewChange: function (view, y, m) {
      console.log(view, y, m);
    },
  });
  getEntries();
  loadEntriesForDate(postDate);
  titleElement.focus();
});
