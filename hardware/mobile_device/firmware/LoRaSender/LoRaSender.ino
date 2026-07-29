#include <SPI.h>
#include <LoRa.h>

int counter = 1;

const int lora_nss   = 7;
const int lora_rst   = 4;
const int lora_dio0  = 2;

void setup() {
  Serial.begin(9600);
  while (!Serial);

  LoRa.setPins(lora_nss, lora_rst, lora_dio0);
  LoRa.setSPIFrequency(1E6);

  Serial.println("LoRa Sender");

  if (!LoRa.begin(433E6)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }
}

void loop() {
  Serial.print("Sending packet: ");
  Serial.println(counter);

  // send packet
  LoRa.beginPacket();
  //LoRa.print("aaaaaa");
  LoRa.print(counter % 100);
  LoRa.endPacket();

  counter++;

  delay(1000);
}
