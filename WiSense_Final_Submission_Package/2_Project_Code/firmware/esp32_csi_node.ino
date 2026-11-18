/*
  ESP32-S3 Wi-Fi CSI Node Firmware
  ---------------------------------
  Captures Wi-Fi Channel State Information (CSI) subcarrier packets
  and streams them over UDP to a laptop running the Python Backend.
  
  Board: ESP32-S3 Dev Module
  IDE: Arduino IDE / PlatformIO
*/

#include <WiFi.h>
#include <WiFiUdp.h>
#include "esp_wifi.h"

// ================= CONFIGURATION =================
const char* WIFI_SSID = "Your_College_WiFi";
const char* WIFI_PASS = "Your_WiFi_Password";

const char* LAPTOP_IP = "192.168.1.100"; // Replace with your laptop's IP address
const int UDP_PORT = 5005;

WiFiUDP udp;
uint32_t packet_seq = 0;

// Magic Header (4 bytes)
const uint32_t MAGIC_HEADER = 0xC5110001;

// CSI Callback Function called by ESP-IDF whenever a packet arrives
void wifi_csi_cb(void *ctx, wifi_csi_info_t *info) {
    if (!info || !info->buf) return;

    int8_t *csi_raw = (int8_t *)info->buf;
    uint16_t len = info->len;
    uint16_t num_subcarriers = len / 2; // Each subcarrier has I and Q byte

    // Prepare Packet Header
    uint8_t packet_buffer[1024];
    
    // Header format: Magic(4B) + Seq(4B) + SubcarrierCount(2B)
    memcpy(packet_buffer, &MAGIC_HEADER, 4);
    memcpy(packet_buffer + 4, &packet_seq, 4);
    memcpy(packet_buffer + 8, &num_subcarriers, 2);

    // Copy IQ raw bytes
    uint16_t payload_len = num_subcarriers * 2;
    if (payload_len > 1000) payload_len = 1000;
    
    memcpy(packet_buffer + 10, csi_raw, payload_len);

    // Send UDP packet to Laptop Server
    udp.beginPacket(LAPTOP_IP, UDP_PORT);
    udp.write(packet_buffer, 10 + payload_len);
    udp.endPacket();

    packet_seq++;
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n🚀 Initializing ESP32-S3 CSI Node...");

    // Connect to Wi-Fi Network
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\n✅ Connected! IP: " + WiFi.localIP().toString());

    // Configure ESP32 CSI Callback
    wifi_csi_config_t csi_config = {
        .lltf_en = true,
        .htltf_en = true,
        .stbc_ltf2_en = true,
        .ltf_merge_en = true,
        .channel_filter_en = false,
        .manu_scale = false,
        .shift = false
    };

    ESP_ERROR_CHECK(esp_wifi_set_csi_config(&csi_config));
    ESP_ERROR_CHECK(esp_wifi_set_csi_rx_cb(wifi_csi_cb, NULL));
    ESP_ERROR_CHECK(esp_wifi_set_csi(true));

    Serial.println("📡 Wi-Fi CSI Streaming started on UDP port 5005!");
}

void loop() {
    // Keep Wi-Fi active
    delay(100);
}
