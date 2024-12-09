#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9
MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(9600);      // Initialize serial communication at a baud rate of 9600
  SPI.begin();             // Initialize SPI bus
  rfid.PCD_Init();         // Initialize the RFID reader
}

void loop() {
  // Look for a new RFID card
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Print the UID of the card
  Serial.print("RFID UID: ");
  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(rfid.uid.uidByte[i], HEX);
  }
  Serial.println();
  
  delay(1000);  // Wait 1 second before scanning again
}
