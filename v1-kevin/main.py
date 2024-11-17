import network
import time
import onewire, ds18x20
from machine import Pin
import urequests

# WiFi Configuration
# SSID = "Bối Bối"
# PASSWORD = "kimngan123"
SSID = "Bi"
PASSWORD = "biheo243"
AZURE_ENDPOINT = "http://20.238.12.185/temperature"  # Thay <YOUR_AZURE_SERVER_IP> bằng địa chỉ IP của Azure

# Kết Nối vào Mạng WiFi
def connect_to_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(SSID, PASSWORD)
    while not wlan.isconnected():
        time.sleep(1)
    print("Connected to WiFi:", wlan.ifconfig())

# Khởi Tạo Cảm Biến DS18B20
ds_pin = Pin(15)
ds_sensor = ds18x20.DS18X20(onewire.OneWire(ds_pin))

# Gửi Nhiệt Độ lên Server
def send_temperature():
    roms = ds_sensor.scan()
    ds_sensor.convert_temp()
    time.sleep(1)
    for rom in roms:
        temp = ds_sensor.read_temp(rom)
        print("Temperature: ", temp)
        # Gửi dữ liệu đến Azure server
        try:
            response = urequests.post(AZURE_ENDPOINT, json={"temperature": temp})
            print("Response: ", response.text)
        except Exception as e:
            print("Error:", e)

# Kết Nối vào WiFi
connect_to_wifi()

# Vòng Lặp gửi nhiệt độ mỗi 60 giây
while True:
    send_temperature()
    time.sleep(5)  # Gửi dữ liệu mỗi phút
