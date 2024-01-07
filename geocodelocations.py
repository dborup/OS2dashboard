from geopy.geocoders import Nominatim
import time
import json

geolocator = Nominatim(user_agent="your_app_name")

locations = ["Dokk1 Bibliotek", "Bavnehoj Skole", "Beder-Malling Bibliotek", "Gellerup Bibliotek", "Harlev Bibliotek", "Hasle Bibliotek", "Hjortshøj Kombi-bibliotek", "Højbjerg Bibliotek", "Lystrup Bibliotek", "Risskov Bibliotek", "Sabro Bibliotek", "Skødstrup Bibliotek", "Solbjerg Bibliotek", "Tilst Bibliotek", "Tranbjerg Bibliotek", "Trige Kombi-bibliotek", "Viby Bibliotek", "Åby Bibliotek"]  # Replace with your locations
geocoded_data = {}

for location in locations:
    try:
        geo_data = geolocator.geocode(location)
        if geo_data:
            geocoded_data[location] = {'latitude': geo_data.latitude, 'longitude': geo_data.longitude}
        else:
            geocoded_data[location] = {'latitude': 'Not Found', 'longitude': 'Not Found'}
    except Exception as e:
        geocoded_data[location] = {'latitude': 'Error', 'longitude': str(e)}
    time.sleep(1)  # To prevent service time-out due to too many requests

# Write the data to a JSON file
with open('geocoded_data.json', 'w') as json_file:
    json.dump(geocoded_data, json_file, indent=4)

print("Geocoded data has been saved to 'geocoded_data.json'")