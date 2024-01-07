// Works with everything we wanted Sunday
// Custom icons for each severity level
var customIcons = {
    'Critical': new L.Icon({
        iconUrl: 'static/red-icon.png', // Path to your red icon
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }),
    'High': new L.Icon({
        iconUrl: 'static/orange-icon.png', // Path to your orange icon
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    }),
    'Normal': new L.Icon({
        iconUrl: 'static/green-icon.png', // Path to your green icon
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    })
};

// Initialize the Leaflet map centered on Aarhus, Denmark
var cityMap = L.map('city-map').setView([56.1629, 10.2039], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: '© OpenStreetMap contributors'
}).addTo(cityMap);

// Create an array to store marker coordinates
var markerCoordinates = [];

// Function to process data and organize by severity and monitoring rule
function processEventData(data) {
    let locationData = {};

    data.forEach(location => {
        const locationKey = `${location.latitude}_${location.longitude}`;
        let highestSeverity = "Normal"; // Default severity
        let ruleGroups = {};

        location.events.forEach(event => {
            // Update highest severity
            if (event.level === 'Critical' || (event.level === 'High' && highestSeverity !== 'Critical')) {
                highestSeverity = event.level;
            }

            // Group by monitoring rule
            const ruleKey = event.monitoring_rule;
            if (!ruleGroups[ruleKey]) {
                ruleGroups[ruleKey] = new Set();
            }

            let eventEntry = event.pc_name;
            if (event.level === 'High' || event.level === 'Critical') {
                eventEntry += ` (Summary: ${event.event_summary})`;
            }
            ruleGroups[ruleKey].add(eventEntry);
        });

        locationData[locationKey] = {
            level: highestSeverity,
            ruleGroups: ruleGroups
        };
    });

    return locationData;
}

// Function to update the markers on the map
function updateCityMapMarkers() {
    fetch('/api/filtered_computer_events')
        .then(response => response.json())
        .then(data => {
            cityMap.eachLayer(layer => {
                if (!!layer.toGeoJSON) cityMap.removeLayer(layer);
            });

            const processedData = processEventData(data);

            markerCoordinates = []; // Clear the markerCoordinates array

            Object.entries(processedData).forEach(([locationKey, locationInfo]) => {
                const [latitude, longitude] = locationKey.split('_');
                const icon = customIcons[locationInfo.level] || new L.Icon.Default();

                let popupContent = '';
                Object.keys(locationInfo.ruleGroups).forEach(rule => {
                    let eventDetails = Array.from(locationInfo.ruleGroups[rule]).join('<br>');
                    popupContent += `<strong>${rule}</strong>:<br>${eventDetails}<br><hr>`;
                });

                const marker = L.marker([parseFloat(latitude), parseFloat(longitude)], { icon: icon })
                    .addTo(cityMap)
                    .bindPopup(popupContent, { maxHeight: 200 });

                // Add the marker's coordinates to the array
                markerCoordinates.push(marker.getLatLng());
            });

            // Use fitBounds to zoom and pan the map to fit all marker coordinates
            if (markerCoordinates.length > 0) {
                var bounds = L.latLngBounds(markerCoordinates);
                cityMap.fitBounds(bounds);
            } else {
                // If there are no markers, set a default zoom and center
                cityMap.setView([56.1629, 10.2039], 12);
            }
        })
        .catch(error => console.error('Error:', error));
}

updateCityMapMarkers();
setInterval(updateCityMapMarkers, 60000); // Update every 60 seconds

// Function to fetch and display event data
function fetchAndDisplayEventData() {
    fetch('/api/filtered_computer_events') // Replace with your API endpoint
        .then(response => response.json())
        .then(data => {
            const eventListContent = document.getElementById('event-list-content');
            eventListContent.innerHTML = ''; // Clear previous data

            // Group events by location, event rule, and count
            const eventsByLocation = {};

            data.forEach(location => {
                location.events.forEach(event => {
                    const locationName = location.location;
                    const rule = event.monitoring_rule;
                    if (!eventsByLocation[locationName]) {
                        eventsByLocation[locationName] = {};
                    }
                    if (!eventsByLocation[locationName][rule]) {
                        eventsByLocation[locationName][rule] = 0;
                    }
                    eventsByLocation[locationName][rule]++;
                });
            });

            // Loop through locations and their events to create HTML elements
            for (const locationName in eventsByLocation) {
                const locationData = eventsByLocation[locationName];

                const locationDiv = document.createElement('div');
                locationDiv.classList.add('location');

                const locationHeader = document.createElement('h3');
                locationHeader.textContent = `${locationName}`;
                locationDiv.appendChild(locationHeader);

                for (const rule in locationData) {
                    const ruleCount = locationData[rule];

                    const ruleDiv = document.createElement('div');
                    ruleDiv.classList.add('event-rule');

                    const ruleHeader = document.createElement('h4');
                    ruleHeader.textContent = `${rule} Count: ${ruleCount}`;
                    ruleDiv.appendChild(ruleHeader);

                    locationDiv.appendChild(ruleDiv);
                }

                eventListContent.appendChild(locationDiv);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Call the fetchAndDisplayEventData function to populate the event list
fetchAndDisplayEventData();
// Update the event list every 60 seconds (adjust the interval as needed)
setInterval(fetchAndDisplayEventData, 60000); // Update every 60 seconds
