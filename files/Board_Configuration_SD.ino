// Run this code once to set the clock and configure the SPIFFS
// Before starting, go to Tools -> Flash Size and select "4M (3M SPIFFS)"
// Open com before starting to be able to see when configuration is complete

#include "SPI.h"
#include <Wire.h>
#include "RTClib.h" // this library is used to set the clock; the code here is based on its example sketch
#include <SD.h>
RTC_DS3231 rtc;

File myFile;
char daysOfTheWeek[7][12] = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};

// change this to match your SD shield or module;
const int chipSelect = 15;

void setup () {
  Serial.begin(115200);
  Wire.begin();
  pinMode(0, OUTPUT);
  digitalWrite(0,LOW);


  delay(3000); // wait for console opening

// FOR RTC
  //#ifndef ESP8266
    //while (!Serial); // for Leonardo/Micro/Zero
  //#endifhttps://github.com/adafruit/Adafruit_ADS1X15/actions

  if (! rtc.begin()) {
    Serial.println("Couldn't find RTC");
    while (1);
  }

    rtc.adjust(DateTime(F(__DATE__), F(__TIME__))); //this line sets the time--comment out if not needed 


    DateTime now = rtc.now(); //sets time in the ESP8266 to the time on the RTC
    
    Serial.print(now.year(), DEC); //prints the time -- this is useful even if not setting the time to check that RTC is functioning properly
    Serial.print('/');
    Serial.print(now.month(), DEC);
    Serial.print('/');
    Serial.print(now.day(), DEC);
    Serial.print(" (");
    Serial.print(daysOfTheWeek[now.dayOfTheWeek()]);
    Serial.print(") ");
    Serial.print(now.hour(), DEC);
    Serial.print(':');
    Serial.print(now.minute(), DEC);
    Serial.print(':');
    Serial.print(now.second(), DEC);
    Serial.println();

    delay(3000);

Serial.print("Initializing SD card...");

  for (;!SD.begin(15);) {
    Serial.println("initialization failed!");
    delay(5000);
    SD.begin(15);
  }
  Serial.println("initialization done.");


// open the file. note that only one file can be open at a time,
  // so you have to close this one before opening another.
  myFile = SD.open("test.txt", FILE_WRITE);
    // if the file opened okay, write to it:


    Serial.print("Writing to test.txt...");
    myFile.println("testing 1, 2, 3.");
    // close the file:
    myFile.close();
    Serial.println("done.");



  myFile = SD.open("SAPFLUX.txt", FILE_WRITE);

      myFile.print("Year");          //Year
      myFile.print(",");
      myFile.print("Month");         //Month
      myFile.print(",");
      myFile.print("Day");           //Day
      myFile.print(",");
      myFile.print("Hour");          //Hour
      myFile.print(",");
      myFile.print("Minute");        //Minute
      myFile.print(",");
      myFile.print("Second");        //Second
      myFile.print(",");
      myFile.print("Thermistor_1");  //Temp (C) from Thermistor 1
      myFile.print(",");
      myFile.print("Thermistor_2");  //Temp (C) from Thermistor 2
      myFile.print(",");
      myFile.print("Thermistor_3");  //Temp (C) from Thermistor 3
      myFile.print(",");
      myFile.print("Thermistor_4");  //Temp (C) from Thermistor 4
      myFile.print(",");
      myFile.print("Thermistor_5");  //Temp (C) from Thermistor 1
      myFile.print(",");
      myFile.print("Thermistor_6");  //Temp (C) from Thermistor 2
      myFile.print(",");
      myFile.print("Thermistor_7");  //Temp (C) from Thermistor 3
      myFile.print(",");
      myFile.print("Thermistor_8");  //Temp (C) from Thermistor 4
      myFile.print(",");
      myFile.print("Voltage");       //Voltage
      myFile.print(",");
      myFile.print("Flag");         //Flag
      myFile.print(",");
      myFile.println("EMU");        //Description
      myFile.close(); // close the file
    
    Serial.println("Current time: ");
    Serial.print(now.year(), DEC); //prints the time -- this is useful even if not setting the time to check that RTC is functioning properly
    Serial.print('/');
    Serial.print(now.month(), DEC);
    Serial.print('/');
    Serial.print(now.day(), DEC);
    Serial.print(" (");
    Serial.print(daysOfTheWeek[now.dayOfTheWeek()]);
    Serial.print(") ");
    Serial.print(now.hour(), DEC);
    Serial.print(':');
    Serial.print(now.minute(), DEC);
    Serial.print(':');
    Serial.print(now.second(), DEC);
    Serial.println();
}

void loop () {
    //
}
