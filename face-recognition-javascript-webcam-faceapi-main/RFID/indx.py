import serial
import requests
import pygame
from tkinter import *
from tkinter import ttk
import PySimpleGUI as sg

pygame.mixer.init()

ser = serial.Serial('COM5', 9600) 

server_url = "http://localhost:4000/travel"

def get_location_by_ip():
    try:
        response = requests.get('https://ipinfo.io')
        data = response.json()
        
        location = data.get('loc')  
        if location:
            lat, lon = location.split(',')
            return float(lat), float(lon)
        else:
            return None, None
    except Exception as e:
        print(f"Error getting location by IP: {e}")
        return None, None

def show_popup(message):
    win = Tk()

    win.geometry("750x270")
    msg = f"Email: {message['user']['email']}\n" \
          f"Name: {message['user']['fullname']}\n" \
          f"Amount Deducted: {message['transact']['amount']}\n" \
          f"Source: {message['transact']['source']}\n" \
          f"Destination: {message['transact']['destination']}\n"\
          f"Updated Balance: {message['user']['balance']}"
    Label(win, text=msg ,
    font=('Helvetica 20 bold')).pack(pady=20)

    win.after(3000,lambda:win.destroy())

    win.mainloop()

def show_error(message):
    win=Tk()
    
    win.geometry("750x270")
    msg = f"Email: {message}\n"\
          f"Insufficent Balance"
    Label(win, text=msg ,
    font=('Helvetica 20 bold')).pack(pady=20)

    win.after(3000,lambda:win.destroy())

    win.mainloop()

def send_rfid_to_server(uid):
    try:
        pygame.mixer.music.load("beep-104060.mp3")
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pass  
        
        lat, lon = get_location_by_ip()
        
        if lat is not None and lon is not None:
            response = requests.post(server_url, data={'uid': uid, 'lat': lat, 'long': lon})
            if response.status_code == 200:
                data = response.json()
                print(f"Data sent to server: RFID UID = {uid}, Latitude = {lat}, Longitude = {lon}")
                
                show_popup(data)
            else:
                obj = response.json()
                if obj.get('msg') == "Insufficient balance":
                    show_error(obj.get('email'))
                print(f"Error from server: {response.status_code} - {response.text}")
        else:
            print("Could not retrieve location data.")
    except Exception as e:
        print(f"Failed to send UID to server: {e}")

while True:
    if ser.in_waiting > 0:
        rfid_data = ser.readline().decode('utf-8').strip()
        if rfid_data:
            rfid_data = rfid_data.replace(" ", "").replace("RFIDUID:", "")
            print(f"RFID UID: {rfid_data}")
            send_rfid_to_server(rfid_data)
