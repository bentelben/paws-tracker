#include <SPI.h>
#include <LoRa.h>

const int lora_nss   = 8;
const int lora_rst   = 4;
const int lora_dio0  = 2;

void setup() {
  Serial.begin(9600);
  while (!Serial);

  LoRa.setPins(lora_nss, lora_rst, lora_dio0);
  //LoRa.setSPIFrequency(1E6);


  Serial.println("LoRa Sender");

  if (!LoRa.begin(433E6)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }
}

void loop() {
  int counter = 0;
  Serial.println("Sending packet: ");

  //delay(20);

  LoRa.beginPacket();
  LoRa.print("a");
  LoRa.endPacket();
  unsigned long last_time = micros();
  unsigned long elapsed = 0;

  while (counter < 100) {
    while (!LoRa.parsePacket());

    elapsed += micros() - last_time;
    counter++;
    Serial.println(counter);

    while(LoRa.available()) {
      Serial.print((char)LoRa.read());
    }
    
    //delay(100);
    //Serial.println(counter);

    LoRa.beginPacket();
    LoRa.print("a");
    LoRa.endPacket();
    last_time = micros();

    //Serial.println(counter);
  }

  Serial.println("elapsed time");
  Serial.println(elapsed - 2776000);
}