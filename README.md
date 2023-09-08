# Arduino Nano RP2040 Connect WiFi Server and Sensor Reader Program

This project demonstrates how to send binary and variable commands to an Arduino Nano RP2040 Connect, and communicate with a Flask server for data transactions and real-time charts via WiFi. See the **Arduino_Server** folder for Arduino code.

## Prerequisites
- Arduino IDE
- Arduino Nano RP2040 Connect

### Libraries
- <Arduino.h> 
- [<WiFiNINA.h>](https://www.arduino.cc/reference/en/libraries/wifinina/)
- [<ArduinoJson.h>](https://arduinojson.org/?utm_source=meta&utm_medium=library.properties)
- [<NTPClient.h>](https://github.com/arduino-libraries/NTPClient)

## Installation

1. Clone this repository.
2. Open the Arduino IDE and load the **WiFiSensorServer.ino** sketch.
3. Update the WiFi credentials and server details in **secrets.h**. For enterprise WiFi, change ```WiFi.begin(ssid, password)``` to ```WiFi.beginEnterprise(ssid,username,password)``` in startWiFi().
4. Upload the sketch to your Arduino Nano RP2040 Connect.

## Usage

1. Power up the Arduino Nano RP2040 Connect.
2. The Arduino will connect to the specified WiFi network and print out its IP address on the Serial monitor.
3. Change the Arduino IP address values on the Flask server code accordingly (see section below).
4. Access the Flask server to control the LED and view real-time data.

## Flask Server

For the Flask server and database, please refer to the **flask_app** folder and details below.

___


# Flask Server for Nano RP2040 Connect

This Flask server displays a webpage, and sends commands and sensor data requests to an Arduino Nano RP2040 Connect for LED control and data transactions. It also provides real-time chart updates using a SQLite3 database and [Google Charts](https://developers.google.com/chart).

## Prerequisites

- Python 3.x
- Flask – version 2.3.2 used
- SQLite3
- requests – version 2.31.0 used (```pip install requests```)
- Jinja2 – version 3.1.2 used (```pip install Jinja2```)
- Optional: SQLite Viewer Extension by Florian Klampfer for VSCode (version 0.3.13)

Alternatively, run ```pip install -r requirements.txt``` for Flask, Jinja2 and requests installations.

## Installation

1. Clone this repository.
2. Install the required libraries.
3. Change the ip values of the “arduinos” lists in app.py and sensorcontrol.js.
```python
# arduino list
arduinos = [
    # {"id": 1, "ip": "xxx.xxx.x.xx"},
    # {"id": 2, "ip": "xxx.xxx.x.xx"},
    # {"id": 3, "ip": "xxx.xxx.x.xx"},
    # {"id": 4, "ip": "xxx.xxx.x.xx"},
]"
```
4. Update num_arduinos in sensordata.html and realtimechart.html according to the number of arduinos or sensors.
5. Adjust time interval for realtime data chart if needed in get_chartdata();
```python
 # calculate the time interval (i.e. for retrieving data from the last 6 minutes, hours = 0.10)
    timeinterval = datetime.now() - timedelta(hours=0.10)
```
6. Run **app.py**.

## Usage

1. Make sure the Arduino Nano RP2040 is connected to the same network as the Flask server.
2. Access the Flask server through the address printed on the terminal. 

### Sensor data
The sensor data can be accessed at `/` on the Flask server.

### Real-Time Chart
The real-time chart updates can be accessed at `/realtimechart` on the Flask server.

### LED Control
The control page can be accessed at `/sensorcontrol` on the Flask server.

## Flask Server Production Mode
Install gunicorn:
```
pip install gunicorn
```
Launch command:
```
gunicorn -w 4 -b 0.0.0.0:8000 flaskapp.app:app
```

#### -w <NUM_WORKERS>
<NUM_WORKERS> is the number of worker processes you want to run. 
#### -b 0.0.0.0:8000
This specifies the host (i.e. 0.0.0.0) and port (i.e. 8000) on which the Flask application will run. 
#### flaskapp12.app:app
This tells Gunicorn where to find the Flask application. flaskapp.app specifies the “app” file in the “flaskapp folder”. The “:app” refers to the Flask instance created inside your app.py file through “app = Flask(__name__)”.

___

# Additional Information
## Sending JSON Data from Arduino instead of Plain Data Example
(for single data point)
### Arduino Code
```arduino
 //----------Handle requests to send sensor data to Flask server----------
    if (request.indexOf("/sensordata") != -1 && request.indexOf("GET") != -1) {
      // create JSON document
      StaticJsonDocument<128> jsonDocument;
     
      // set multivariable JSON data
      jsonDocument["type"] = "current";
      jsonDocument["value"] = readSensor();
      jsonDocument["unit"] = "A";
     
      // serialize JSON document to a string
      String jsonData;
      serializeJson(jsonDocument, jsonData);
     
      // send the response
      String response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n" + jsonData;
      // rest of code…
```

### Flask code (in fetch_and_store_data())
```python
    # rest of code…
    # get data from arduino
    response = requests.get("http://" + arduino_ip + "/sensordata")


    if response.ok:
        # get response from arduino
        sensor_data = response.json()


        # set connection and cursor
        connection = getDbConnection()
        cursor = connection.cursor()


        # get values from dictionary
        sensor_value = sensor_data["value"]
        sensor_unit = sensor_data["unit"]
        sensor_type = sensor_data["type"]
        # rest of code…
```
## Future Considerations and Modifications

### Alternative Microcontrollers for additional features or optimization
ESP32
1. [Asynchronous Webserver](https://github.com/me-no-dev/ESPAsyncWebServer) for handling multiple connections at the same time, simplified server code, and energy efficiency.
```arduino
#include <WiFi.h>
#include <ESPAsyncWebServer.h>

AsyncWebServer server(80);

void setup() {
  // start WiFi
  WiFi.begin("ssid", "password");
  while (WiFi.status() != WL_CONNECTED) {
     Serial.println(“.”);
  }

  // set up an asynchronous web server
  server.on("/sensordata", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/plain", "Sensor data string.");
  });

  // start the server
  server.begin();
}

void loop() {
  // main loop tasks (i.e. continuously gathering data)
}
```


2. More resources and examples for [multicore programming](https://randomnerdtutorials.com/esp32-dual-core-arduino-ide/) (i.e. one core handles the server while the other deals with sensor readings) for reduced interruptions between tasks and increased speed from parallel processing.

3. [ESPmDNS library](https://github.com/espressif/arduino-esp32/blob/master/libraries/ESPmDNS/examples/mDNS_Web_Server/mDNS_Web_Server.ino) available for static address (alternative for using IP addresses to reach the server)

 




