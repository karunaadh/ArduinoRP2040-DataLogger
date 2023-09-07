#include <Arduino.h>
#include <WiFiNINA.h>
#include <ArduinoJson.h>
#include "secrets.h"
#include <NTPClient.h>

// create server instance
WiFiServer server(80);

//set up NTPClient for realtime
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

//--------------------------------------------------------------------------
//data variables
int sensorReading;
String dataPacket = "";

//delay variables
long lastUpdateTime = 0;

//datetime variables
String timeStamp;

//----------------------------Setup-------------------------------
void setup() {
  //start serial monitor
  Serial.begin(9600);

  //setup built-in LEDs (for control)
  pinMode(LEDR, OUTPUT);
  pinMode(LEDG, OUTPUT);  
  pinMode(LEDB, OUTPUT);

  //set up wifi
  startWiFi();
  
  // start server
  server.begin();
  Serial.println("Server started.");

  //set up analog input
  pinMode(A0, INPUT);

  //start time client
  timeClient.begin();
  //set offset from GMT in seconds
  //for EDT, offset is -14400 seconds
  //for EST, offset is -18000 seconds
  timeClient.setTimeOffset(-14400);

}

//---------------------------------------Loop-------------------------
void loop() {
  // check for incoming clients
  WiFiClient client = server.available();
  
  if (client) {
    Serial.println("New client connected!");
    
    // read client request
    String request = client.readStringUntil('\r');
    client.readStringUntil('\n');
    
    // print request
    Serial.print("Request: ");
    Serial.println(request);

    //------------------Handle requests to send sensor data to Flask server-----------------------
    if (request.indexOf("/sensordata") != -1 && request.indexOf("GET") != -1) {
      Serial.println(dataPacket);
      
      // send the response
      String response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n" + dataPacket;
      client.print(response);
      Serial.println("Response sent to client.");

      //clear datapacket
      dataPacket = "";
    }
   //------------------Handle simple on/off commands-----------------------
    else if (request.indexOf("/led") != -1 && request.indexOf("GET") != -1) {
      // check the endpoint for controlling each LED
      if (request.indexOf("/RH") != -1) {
        digitalWrite(LEDR, HIGH);
        Serial.println("RH");
      } else if (request.indexOf("/RL") != -1) {
        digitalWrite(LEDR, LOW);
        Serial.println("RL");
      } else if (request.indexOf("/GH") != -1) {
        digitalWrite(LEDG, HIGH);
        Serial.println("GH");
      } else if (request.indexOf("/GL") != -1) {
        digitalWrite(LEDG, LOW);
        Serial.println("GL");
      } else if (request.indexOf("/BH") != -1) {
        digitalWrite(LEDB, HIGH);
        Serial.println("BH");
      } else if (request.indexOf("/BL") != -1) {
        digitalWrite(LEDB, LOW);
        Serial.println("BL");
      }

      // send client response
      String response = "HTTP/1.1 200 OK\r\n";
      response += "Content-Type: application/json\r\n";
      // allow requests from any domain (*). Alternative: += "Access-Control-Allow-Origin: https://www.eecg.utoronto.ca\r\n"; 
      response += "Access-Control-Allow-Origin: *\r\n"; 
      response += "\r\n";
      client.print(response);

   //------------------Handle complex commands (configuration values)-----------------------
    } else if (request.indexOf("/command") != -1 && request.startsWith("POST")){
      // read entire HTTP request, including headers and JSON payload
      String httpRequest = "";
      while (client.available()) {
        char c = client.read();
        httpRequest += c;
      }

      // extract the JSON payload from HTTP request
      int jsonPayloadStart = httpRequest.indexOf("\n\r\n") + 3;
      String jsonPayload = httpRequest.substring(jsonPayloadStart);

      // handle received JSON data
      StaticJsonDocument<256> jsonDocument;

      // parse JSON and check for errors
      DeserializationError error = deserializeJson(jsonDocument, jsonPayload);

      // check if parsing was successful
      if (error) {
        Serial.print(F("Error parsing JSON: "));
        Serial.println(error.c_str());
        return;
      }

      //if no error, extract values from json payload
      int rValue = jsonDocument["rvalue"].as<int>();
      int gValue = jsonDocument["gvalue"].as<int>();
      int bValue = jsonDocument["bvalue"].as<int>();

      //print extracted values
      Serial.print("R: ");
      Serial.print(rValue);
      Serial.print(", G: ");
      Serial.print(gValue);
      Serial.print(", B: ");
      Serial.println(bValue);

      //program LED
      analogWrite(LEDR, rValue);
      analogWrite(LEDG, gValue);
      analogWrite(LEDB, bValue);

      // send client response
      String response = "HTTP/1.1 200 OK\r\n";
      response += "Content-Type: application/json\r\n";
      // allow requests from any domain (*). Alternative: += "Access-Control-Allow-Origin: https://www.eecg.utoronto.ca\r\n"; 
      response += "Access-Control-Allow-Origin: *\r\n"; 
      response += "\r\n";
      client.print(response);
      Serial.println("Response sent to client.");

    // ---------------------Handle OPTIONS request (occurs before POST requests)------------
    } else if (request.indexOf("OPTIONS")!= -1){
      client.println("HTTP/1.1 204 No Content");
      // allow requests from any domain (*). Alternative: += "Access-Control-Allow-Origin: https://www.eecg.utoronto.ca\r\n"; 
      client.println("Access-Control-Allow-Origin: *");
      client.println("Access-Control-Allow-Methods: POST");
      client.println("Access-Control-Allow-Headers: Content-Type");
      client.println();
    }
    
    // close client connection
    client.stop();
    Serial.println("Client disconnected.");
  } else if (millis() - lastUpdateTime >= 500) {
      // get sensor data
      sensorReading = readSensor();

      //update timeclient
      timeClient.update();
      //get time
      timeStamp = timeClient.getFormattedTime();

      //append time and reading to data packet
      dataPacket += timeStamp;
      dataPacket += "-";
      dataPacket += sensorReading;
      dataPacket += ",";

      //update last update time for delay function
      lastUpdateTime = millis();
    }
}

//----------------wifi starting function----------
void startWiFi(){
  // connect to Wi-Fi
  WiFi.begin(ssid, password);

  //use this if using enterprise WiFi:
  //WiFi.beginEnterprise(ssid,username,password);

  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("");
  
  // print nano IP address
  Serial.print("Connected to WiFi. IP address: ");
  Serial.println(WiFi.localIP());
}

//-------------sensor reading function------------------
int readSensor(){
  //get sensor reading
  int data = analogRead(A0);

  //check data
  Serial.println(data);

  //return reading
  return data;
}



