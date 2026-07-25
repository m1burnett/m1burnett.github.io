// Note that a lot of the code and comments here are relics from the sap flow scripts. Proceed with caution...

//////////////////////////////     Load libraries     /////////////////////////////////////////////////

#include <Wire.h>

#include <Adafruit_ADS1X15.h>     //Adafruit ADS1115 library-this controls the analog to digital converter      
// sets I2C address for the ADC    
Adafruit_ADS1115 ads1115a;
Adafruit_ADS1115 ads1115b;//one of 4 addresses

#include "SPI.h"                          //SD Card Libraries
#include <SD.h>
File myFile;
const int chipSelect = 15;


#include "uRTCLib.h"              //Library to run the RTC alarm -- there are other libraries available but this seemed most straightforward for just setting the alarm
#define URTCLIB_MODEL_DS3231 2        //RTC model
uRTCLib rtc(0x68);                    //RTC I2C address

//#include <Adafruit_INA219.h>     //For Current Meter if desired 
//Adafruit_INA219 ina219;


//////////////////////////////     Setup     ////////////////////////////////////////////////////////

// The setup() code below should run each time the sensor wakes up

void setup() {
  pinMode(0, OUTPUT);
  Serial.begin(9600);
  Wire.begin();
  digitalWrite( SDA, LOW);      //This may not be necessary but could recover I2C if shut down incorrectly
  digitalWrite( SCL, LOW);
  SD.begin(15);                 //Set SD Card CS pin number and begin function

//////////////////////////////     Set up DS3231 clock     /////////////////////////////////////////

    rtc.set_model(URTCLIB_MODEL_DS3231);
    rtc.set_rtc_address(0x68);
    rtc.alarmSet(URTCLIB_ALARM_TYPE_1_FIXED_MS, 0, 0, 0, 1); //Alarm for every hour on the hour
    rtc.alarmSet(URTCLIB_ALARM_TYPE_2_FIXED_M, 0, 30, 0, 1); //Alarm for every hour at the 30 minute mark

    //rtc.alarmSet(URTCLIB_ALARM_TYPE_1_FIXED_S, 30, 0, 0, 1); // this sets the alarm to turn the system on and run code every minute on the minute
    //rtc.alarmSet(URTCLIB_ALARM_TYPE_2_ALL_M, 0, 0, 0, 1); 
        // other alarm types are  URTCLIB_ALARM_TYPE_1_ALL_S - Every second
                                //URTCLIB_ALARM_TYPE_1_FIXED_S - Every minute at given second
                                //URTCLIB_ALARM_TYPE_1_FIXED_MS - Every hour at given Minute:Second
                                //URTCLIB_ALARM_TYPE_1_FIXED_HMS - Every day at given Hour:Minute:Second
                                //URTCLIB_ALARM_TYPE_1_FIXED_DHMS - Every month at given DAY-Hour:Minute:Second
                                //URTCLIB_ALARM_TYPE_1_FIXED_WHMS - Every week at given DOW + Hour:Minute:Second
                                //URTCLIB_ALARM_TYPE_2_ALL_M - Every minute at 00 Seconds
                                //URTCLIB_ALARM_TYPE_2_FIXED_M - Every hour at given Minute(:00)
                                //URTCLIB_ALARM_TYPE_2_FIXED_HM - Every day at given Hour:Minute(:00)
                                //URTCLIB_ALARM_TYPE_2_FIXED_DHM - Every month at given DAY-Hour:Minute(:00)
                                //URTCLIB_ALARM_TYPE_2_FIXED_WHM - Every week at given DOW + Hour:Minute(:00)
        // for _FIXED_ alarms, the integers set the time of the alarm -- second, minute, hour, dayofweek
            //so for an alarm every hour at :30, (URTCLIB_ALARM_TYPE_1_FIXED_MS, 0, 30, 0, 1)
        // the library uses 1 as default for dayofweek so I haven't changed that but it doesn't affect most alarms
        // should be possible to alternate alarms 1 and 2 for more intervals but I haven't gotten that working

//////////////////////////////     ADS1115 analog to digital converter     /////////////////////////////////////////

 //Each ADS1115 can operate 4 thermistors and up to 4 ADS1115's can be operated by a single microcontroller
 //see the datasheet for further instructions
 
    ads1115a.begin(0x48);    
    ads1115a.setGain(GAIN_SIXTEEN); //set gain on the ADC
    pinMode(LED_BUILTIN, OUTPUT);

//////////////////////////////     Set Variables for readings     /////////////////////////////////////////

  //dV variables
  float mV1;
  float mV2;
  float ADCout1;
  float ADCout2;
  float SERIESRESISTOR = 10000.000;
  float maxADC = 19434;

  //Voltage Variables
  float vout;
  float vin;
  float R1 = 100000.0; // resistance of R1 (100K)
  float R2 = 10000.0; // resistance of R2 (10K)
  int value = 0;


//////////////////////////////         Skip undersired hours     /////////////////////////////////////////


//Set time for each reading
      rtc.refresh(); //update time from the rtc
      int mi  = rtc.minute();
      
      int y  = rtc.year();
      int mo = rtc.month();
      int d  = rtc.day();
      int hr  = rtc.hour();
      int m  = rtc.minute();
      float s  = rtc.second();
      int ms = 0;
/*
    //The following code chunk can shut the system off at hours we don't want to sample.
        if((hr == 21) or (hr == 23) or (hr == 0) or (hr == 1) or (hr == 3)){  
    //This code shuts the system off if the hour is equal to one of the above values.      
    //System will turn on for < 1s.  
        
          if(mi == 0){
          rtc.alarmClearFlag(URTCLIB_ALARM_1);
          }
          if(mi == 30){
          rtc.alarmClearFlag(URTCLIB_ALARM_2);
          }
        
    }
        if((hr == 22) or (hr == 2)){  
    //This code shuts the system off if the hour is equal to one of the above values.      
    //System will turn on for < 1s.  
        
          
          if(mi == 30){
          rtc.alarmClearFlag(URTCLIB_ALARM_2);
          }
        
    }
*/  


//////////////////////////////     Battery overdischarge protection     /////////////////////////////////////////
      
// The goal of this section is that if battery voltage is ever approaching dangerous lows (4V), the heating and logging cycle will be skipped.
  //measure voltage using resistor bridge
      value = analogRead(A0);
      vout = (value * 3.04153) / 1024.0; // The value of 2.97 is the calibrated Arduino ADC reference voltage (nominally 3.3V).  Worth double checking using a AC->DC converter. MWB: I calculated that it should be 3.31 based on multimeter measurements of a battery hooked up to the logger...
      vin = vout / (R2/(R1+R2));  

       if(vin < 4.4){           

        //rtc.alarmSet(URTCLIB_ALARM_TYPE_1_FIXED_HMS, 0, 0, 10, 1); //1 pm alarm daily
        //rtc.alarmSet(URTCLIB_ALARM_TYPE_2_FIXED_HM, 0, 0, 10, 1); //1 pm alarm daily
        myFile= SD.open("SAPFLUX.txt", FILE_WRITE); // open SD file
        myFile.print(y);       //Year
        myFile.print(",");
        myFile.print(mo);      //Month
        myFile.print(",");
        myFile.print(d);       //Day
        myFile.print(",");
        myFile.print(hr);      //Hour
        myFile.print(",");
        myFile.print(m);       //Minute
        myFile.print(",");
        myFile.print(s);       //Second
        myFile.print(",");
        myFile.print(": Low voltage alarm triggered: Vin reading ");
        myFile.print(vin);  
        myFile.println("V; skipping read cycle,,,,,,,,,");
        myFile.close();       
    

      }else{     
    
//////////////////////////////     Set time between temperature readings (ms)     /////////////////////////////////////////

//Just Change samplingfrequency!!!!!!!!!!!!!!!!!!! (500 for a temp reading every half second and 1000 for every second)
      int samplingfrequency = 1; //Input desired sampling frequency (ms)
      
      int reps = 1000 / samplingfrequency; //Adjusts for sampling frequency

//////////////////////////////     Adjust for computational Delay     /////////////////////////////////////////

      int compdelay = 77; //Mean computer processing delay in milliseconds
      int rep = samplingfrequency - compdelay; //measuring frequency in milliseconds minus a small correction for computer processing time
      
//////////////////////////////     SET DESIRED HEATING and MEASURING LENGTHS     /////////////////////////////////////////

//Just change the numbers!!!!!!!!!!!!!!!!!!!!!!!!!

      int cycle = 0.01 * reps;      //Measurement length (s)
      //int heattime = 5 * reps;     //Heating length (s)
      int basetime = 0.01 * reps;     //Baseline measurement (s)
   

//////////////////////////////     Loop for baseline temp data     /////////////////////////////////////////

 //Baseline data before applying the heatpulse helps identify the pulse and adjust for weird measurements 
 //occuring during the pulse, likely due to the current spike.

while(basetime >0){
      
  //Turn Heater off
      digitalWrite(LED_BUILTIN, LOW);
      digitalWrite(0,LOW);

  //measure voltage using resitor bridge
      value = analogRead(A0);
      vout = (value * 3.04153) / 1024.0; // The value of 2.97 is the calibrated Arduino ADC reference voltage (nominally 3.3V).  Worth double checking using a AC->DC converter.
      vin = vout / (R2/(R1+R2));    
 
  //Read differential voltage
  ADCout1 = ads1115a.readADC_Differential_0_1();
  ADCout2 = ads1115a.readADC_Differential_2_3();

 
  //Voltage conversion
  mV1 = ADCout1*0.0078125;
  mV2 = ADCout2*0.0078125*(100000+1000)/1000;
      
  // write sensor data to file
      //Open SD card file    
     
myFile = SD.open("psi.txt", FILE_WRITE); // open SD file   
      myFile.print(y);       //Year
      myFile.print(",");
      myFile.print(mo);      //Month
      myFile.print(",");
      myFile.print(d);       //Day
      myFile.print(",");
      myFile.print(hr);      //Hour
      myFile.print(",");
      myFile.print(m);       //Minute
      myFile.print(",");
      myFile.print(s);       //Second
      myFile.print(",");
      myFile.print(ms);       //Milliecond
      myFile.print(",");
      myFile.print(mV1, 3);   //dV in mV
      myFile.print(",");
      myFile.print(mV2, 3);   //input voltage (excitation) in mV
      myFile.print(",");
      myFile.print(vin);     //Voltage
      myFile.print(",");
      myFile.println("b");   //Flag for Baseline measurement
        myFile.close();
      //delay(rep);
      ms = ms + 1;
      s = s + 0.5;
      if(ms > 998){
        ms = 0;
        s = s+1;
      }
      basetime = basetime-1;
  }

//////////////////////////////     Loop to turn on heater for set amount of time     /////////////////////////////////////////

 while(cycle > 0){
      
      //Turn heater on
      digitalWrite(0,HIGH);
      digitalWrite(LED_BUILTIN, HIGH);

   //Read differential voltage
  ADCout1 = ads1115a.readADC_Differential_0_1();
  ADCout2 = ads1115a.readADC_Differential_2_3();

 
  //Voltage conversion
  mV1 = ADCout1*0.0078125;
  mV2 = ADCout2*0.0078125*(100000+1000)/1000;

  // write sensor data to file
      //Open SD card file    
     
myFile = SD.open("psi.txt", FILE_WRITE); // open SD file   
      myFile.print(y);       //Year
      myFile.print(",");
      myFile.print(mo);      //Month
      myFile.print(",");
      myFile.print(d);       //Day
      myFile.print(",");
      myFile.print(hr);      //Hour
      myFile.print(",");
      myFile.print(m);       //Minute
      myFile.print(",");
      myFile.print(s);       //Second
      myFile.print(",");
      myFile.print(ms);       //Milliecond
      myFile.print(",");
      myFile.print(mV1, 3);   //dV in mV
      myFile.print(",");
      myFile.print(mV2, 3);   //dV in mV
      myFile.print(",");
      myFile.print(vin);     //Voltage
      myFile.print(",");
      myFile.println("b");   //Flag for Baseline measurement
        myFile.close();
      //delay(rep);
      ms = ms + 1;
      s = s + 0.5;
      if(ms > 998){
        ms = 0;
        s = s+1;
      }
      cycle = cycle-1;
  }

      }
//////////////////////////////     Reset clock flag to turn power off     /////////////////////////////////////////
   

      rtc.alarmClearFlag(URTCLIB_ALARM_1);
      rtc.alarmClearFlag(URTCLIB_ALARM_2);
      
      
//////////////////////////////     Error warning if the alarm doesn't work to turn off     /////////////////////////////////////////    

      
myFile= SD.open("SAPFLUX.txt", FILE_WRITE); // open SD file   
  myFile.println("err1");
  myFile.close();                                    // Err1 = ESP did not turn off after clearing the alarm flag. 
                                                    //This will appear once in data when ESP is plugged in because it cannot power off
  
  ESP.deepSleep(60e6); //this can be used instead of ESP.restart if D0 is connected to rst
  ESP.restart();
    
}

//////////////////////////////     Microcontroller should never reach this point     /////////////////////////////////////////
void loop() {
  }