//-------------------ARDUINOS-------------------------
const arduinos = [
    //{ id: 1, ip: "xxx.xxx.x.xx" },
    // { id: 2, ip: "xxx.xxx.x.xx" },
    //{ id: 3, ip: "xxx.xxx.x.xx" },
];

//--------------SIMPLE BUTTON CONTROL--------------------
// function to send a POST request to control the LED
function sendLedCommand(arduinoIP, led, state) {
    // construct URL based on the Arduino IP and LED
    const url = `http://${arduinoIP}/led/${led}${state}`;

    fetch(url)
        .then(response => {
            if (response.ok) {
                console.log("Control request sent successfully.");
            } else {
                console.error("Error sending control request:", response.status, response.statusText);
            }
        })
        .catch(error => {
            console.error("Error sending control request:", error);
        });
}

// function to handle the toggle state change
function handleToggleChange(arduinoIP, led, event) {
    const state = event.target.checked ? 'H' : 'L';
    sendLedCommand(arduinoIP, led, state);
}

// function to generate Arduino control table dynamically
function generateArduinoControls() {
    const table = document.getElementById("arduino-table");

    arduinos.forEach(arduino => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${arduino.id}</td>
                        <td class="led-control">
                            <label class="switch">
                                <input type="checkbox" class="led-toggle" data-arduino="${arduino.id}" data-led="R">
                                <span class="slider"></span>
                            </label>
                        </td>
                        <td class="led-control">
                            <label class="switch">
                                <input type="checkbox" class="led-toggle" data-arduino="${arduino.id}" data-led="G">
                                <span class="slider"></span>
                            </label>
                        </td>
                        <td class="led-control">
                            <label class="switch">
                                <input type="checkbox" class="led-toggle" data-arduino="${arduino.id}" data-led="B">
                                <span class="slider"></span>
                            </label>
                        </td>`;

        table.appendChild(tr);
    });

    // add event listeners for the toggle buttons after generating the table
    const toggleButtons = document.querySelectorAll('.led-toggle');
    Array.from(toggleButtons).forEach(button => {
        button.addEventListener('change', event => {
            const arduinoID = button.getAttribute('data-arduino');
            const ledColor = button.getAttribute('data-led');
            const arduinoIP = arduinos.find(arduino => arduino.id === parseInt(arduinoID)).ip;
            handleToggleChange(arduinoIP, ledColor, event);
        });
    });
}

generateArduinoControls();

//-----------------COMPLEX CONTROL COMMANDS-------------
//function to send commands in json form (data) to arduinoIP
function sendComplexCommand(arduinoIP, data) {
    fetch(`http://${arduinoIP}/command`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                console.log('Command sent successfully.');
                alert('Command sent successfully.');
            } else {
                console.error('Error sending control request:', response.status, response.statusText);
                alert('Error sending control request');
            }
        })
        .catch(error => {
            console.error('Error sending control request:', error);
            alert('Caught error');
        });
}

//function to handle command submission
function onCommandSubmit() {
    //get id input
    const idInput = document.getElementById('id-input').value;
    //find matching arduino
    const selectedArduino = arduinos.find(arduino => arduino.id === parseInt(idInput));

    //if no matching arduino id, inform user
    if (!selectedArduino) {
        alert('Invalid Arduino ID. Please enter a valid ID.');
        return;
    }

    // get values from the input boxes, parse to base 10
    const rValue = parseInt(document.getElementById('red-input').value, 10);
    const gValue = parseInt(document.getElementById('green-input').value, 10);
    const bValue = parseInt(document.getElementById('blue-input').value, 10);

    // validate command values
    if (isNaN(rValue) || isNaN(gValue) || isNaN(bValue) || rValue < 0 || rValue > 255 || gValue < 0 || gValue > 255 || bValue < 0 || bValue > 255) {
        alert('Invalid values. Please enter values between 0 and 255.');
        return;
    }

    // create the data object to be sent as JSON
    const data = {
        rvalue: rValue,
        gvalue: gValue,
        bvalue: bValue
    };

    // call sendCommand function with selected arduino's IP and data
    sendComplexCommand(selectedArduino.ip, data);

    //clear out inputs
    document.getElementById('red-input').value = "";
    document.getElementById('green-input').value = "";
    document.getElementById('blue-input').value = "";
    document.getElementById('id-input').value = "";
}
