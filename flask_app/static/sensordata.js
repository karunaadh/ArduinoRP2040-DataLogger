//--------------SENSOR DATA UPDATING AND FILTERING----------------------
//filter values
let currentIdFilter = "";
let currentDateFilter = "";

//--------------INITIAL FILTERING--------------------
//set default date as current date on loading of window
function setDefaultDate() {
    const today = new Date();
    const dateInput = document.getElementById('date-filter');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const defaultDate = `${year}-${month}-${day}`;
    //fill in input with current date initially
    dateInput.value = defaultDate;
    //apply current date as filter initially
    currentDateFilter = defaultDate;

    //apply filter
    applyFilters();
}


//apply filters by setting the date input value and id input when button is pressed
function applyFilters() {
    currentDateFilter = document.getElementById('date-filter').value;
    currentIdFilter = document.getElementById('id-filter').value;

    //update the table with filter queries
    updateTable();
}

// function to update the table with new sensor data and filter the table
// (called every x seconds (see sensordata.html) for updating the site with new data and whenever the filters are applied)
function updateTable() {
    // fetch the page to get the updated data from flask program
    const url = `/?id=${currentIdFilter}&date=${currentDateFilter}`;
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const newDocument = parser.parseFromString(html, "text/html");
            //received html content
            const updatedTable = newDocument.querySelector('#sensor-table tbody');
            //current table body
            const existingTable = document.querySelector('#sensor-table tbody');
            //update table
            existingTable.innerHTML = updatedTable.innerHTML;
        })
        .catch(error => console.error('Error fetching data:', error));

}


//---------------WINDOW ONLOAD--------------------------
//run default date and update table onload
window.onload = function () {
    setDefaultDate();
}