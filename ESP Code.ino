#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char *ssid = "kamal";
const char *password = "kamal12345";
const char *server_ip = "192.168.88.185";
const int server_port = 80;
const char* server_address = "http://192.168.88.185/status";

const int ledPin = 2;

const int numSamples = 1000;
int esamples[numSamples];
int psamples[numSamples];

bool recordingStarted = false;

void setup() {    
  pinMode(41, INPUT); // Setup for leads off detection LO +
  pinMode(40, INPUT); // Setup for leads off detection LO -
  pinMode(ledPin, OUTPUT);
  //pinMode(32, INPUT_PULLUP);
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  checkServerStatus();
  // Check server status to determine whether to start or stop recording
  if (recordingStarted) {
    // Start recording data
    recordData();
    delay(1000);
  }
}

void checkServerStatus() {
  // Send request to Flask server
  HTTPClient http;
  http.begin(server_address);
  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println(payload);

    // Check if server flag is true
    if (payload.indexOf("true") != -1) {
      recordingStarted = true;
      digitalWrite(ledPin, HIGH);
    } else {
      recordingStarted = false;
      digitalWrite(ledPin, LOW);
    }
  } else {
    Serial.printf("HTTP request failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

void recordData() {
  int eval = 0;
  int pval = 0;
  
  // Collect samples
  for (int i = 0; i < numSamples; i++) {
    if ((digitalRead(40) == 1) || (digitalRead(41) == 1)) {
      eval = 0;
    } else {
      eval = analogRead(32);
    }
    pval = analogRead(36);
    delay(1);
    esamples[i] = eval;
    psamples[i] = pval;
    Serial.print(esamples[i]);      //the first variable for plotting
    Serial.print(",");              //seperator
    Serial.println(psamples[i]);          //the second variable for plotting including line break
    delay(20);
    }

    checkServerStatus();

    if(recordingStarted==false){
      HTTPClient http;


      http.begin("http://192.168.88.185/check_stop");
      int httpResponseCode = http.POST(""); // Send an empty body for POST
      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("HTTP Response code: " + String(httpResponseCode));
        Serial.println(response);
      } else {
        Serial.println("Error on HTTP request");
      }
      http.end();
        }
      

  // Send data to the server
  sendToServer(esamples, psamples, numSamples);
}

void sendToServer(int edata[], int pdata[], int dataSize) {
  WiFiClient client;
  if (client.connect(server_ip, server_port)) {
    DynamicJsonDocument jsonDoc(32768); // Increased document size to accommodate both ECG and PPG data
    JsonArray ejsonArray = jsonDoc.createNestedArray("ecg_data");
    JsonArray pjsonArray = jsonDoc.createNestedArray("ppg_data");

    for (int i = 0; i < dataSize; i++) {
      ejsonArray.add(edata[i]);
      pjsonArray.add(pdata[i]);
    }

    String jsonPayload;
    serializeJson(jsonDoc, jsonPayload);
    String httpRequest = "POST /send_data HTTP/1.1\r\n";
    httpRequest += "Host: " + String(server_ip) + "\r\n";
    httpRequest += "Content-Type: application/json\r\n";
    httpRequest += "Content-Length: " + String(jsonPayload.length()) + "\r\n";
    httpRequest += "Connection: close\r\n\r\n";
    httpRequest += jsonPayload;

    client.print(httpRequest);

    Serial.println("Data sent to server");
    client.stop();
    Serial.println("Connection closed");
  } else {
    Serial.println("Failed to connect to server");
  }
}
