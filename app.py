# BERFORE MAKING CHANGES TO summary
from flask import Flask, render_template, jsonify, request
import requests
from datetime import datetime, timedelta
import json

app = Flask(__name__)

# Load geocoded data
with open('geocoded_data.json', 'r') as json_file:
    geocoded_data = json.load(json_file)

API_HEADERS = {
    'accept': 'application/json',
    'Authorization': 'Bearer YOUR_API_HERE'
}

MONITORING_RULES = ["Nattjek for Computer Online Status", "Morgentjek for Online Status", "Detekter låst/udløbet bruger", "Nyt Keyboard Detect", "Sudo"]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/filtered_computer_events')
def get_filtered_computer_events():
    try:
        to_date = datetime.now()
        from_date = to_date - timedelta(days=30)
        to_date_str = to_date.strftime('%Y-%m-%d')
        from_date_str = from_date.strftime('%Y-%m-%d')

        events_url = f'https://os2borgerpc-admin.magenta.dk/api/system/events?from_date={from_date_str}&to_date={to_date_str}&status=NEW&limit=100&offset=0'
        events_response = requests.get(events_url, headers=API_HEADERS)
        events = events_response.json().get('items', [])

        computers_response = requests.get('https://os2borgerpc-admin.magenta.dk/api/system/computers', headers=API_HEADERS)
        computers = computers_response.json()

        location_events = {}
        for event in events:
            if event.get('monitoring_rule') in MONITORING_RULES:
                for computer in computers:
                    if computer['name'] == event['pc_name']:
                        location_key = computer['location']
                        if location_key not in location_events:
                            location_events[location_key] = {
                                'location': location_key,
                                'latitude': geocoded_data.get(location_key, {}).get('latitude'),
                                'longitude': geocoded_data.get(location_key, {}).get('longitude'),
                                'events': []
                            }
                        event_info = {
                            'pc_name': computer['name'],
                            'monitoring_rule': event.get('monitoring_rule'),
                            'level': event.get('level'),
                            'event_summary': event.get('summary')  # Include event summary
                        }
                        location_events[location_key]['events'].append(event_info)

        return jsonify(list(location_events.values()))
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
