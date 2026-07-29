#include <SPI.h>
#include <LoRa.h>

const int lora_nss   = 8;
const int lora_rst   = 4;
const int lora_dio0  = 2;

void setup() {
  Serial.begin(9600);
  while (!Serial);

  LoRa.setPins(lora_nss, lora_rst, lora_dio0);
  LoRa.setSPIFrequency(1E6);
  
  Serial.println("LoRa Receiver");

  if (!LoRa.begin(433E6)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  } else {
    Serial.println("Success");
  }
}

void loop() {
  // try to parse packet
  int packetSize = LoRa.parsePacket();
  //Serial.println(packetSize);
  if (packetSize) {
    // received a packet
    Serial.print("Received packet '");

    // read packet
    while (LoRa.available()) {
      Serial.print((char)LoRa.read());
    }

    // print RSSI of packet
    Serial.print("' with RSSI ");
    Serial.println(LoRa.packetRssi());
  }
}
