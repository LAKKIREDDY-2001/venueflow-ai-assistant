// VenueFlow AI - script.js
// Replace YOUR_*_KEY with your Google API keys

class VenueFlowAI {
  constructor() {
    this.map = null;
    this.userMarker = null;
    this.heatmap = null;
    this.directionsService = null;
    this.directionsRenderer = null;
    this.placesService = null;
    this.geminiApiKey = 'YOUR_GEMINI_KEY'; // gemini.google.com/app/api-key
    this.venueData = {
      wembley: {
        center: {lat: 51.5558, lng: -0.2795},
        name: 'Wembley Stadium',
        gates: ['Gate A', 'Gate 5', 'Concession North']
      },
      sofi: {
        center: {lat: 33.9535, lng: -118.3392},
        name: 'SoFi Stadium'
      }
    };
    this.userContext = {}; // loc, time, etc.
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindEvents();
      document.getElementById('loadVenue').click();
    });
  }

  bindEvents() {
    document.getElementById('loadVenue').onclick = () => this.loadVenue();
    document.getElementById('getDirections').onclick = () => this.getDirections();
    document.getElementById('sendChat').onclick = () => this.sendChat();
    document.getElementById('chatInput').onkeypress = (e) => {
      if (e.key === 'Enter') this.sendChat();
    };
  }

  async loadVenue() {
    const venueKey = document.getElementById('venueSelect').value;
    const venue = this.venueData[venueKey];
    document.getElementById('status').textContent = `Loading ${venue.name}...`;

    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: venue.center,
      mapTypeId: 'satellite', // Venue view
      mapId: 'venueflow-map' // Optional styling
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.map);
    this.placesService = new google.maps.places.PlacesService(this.map);

    // Simulated crowd heatmap data (lat,lng,weight 0-1)
    const crowdData = this.generateCrowdData(venue.center);
    this.heatmap = new google.maps.visualization.HeatmapLayer({
      data: crowdData,
      map: this.map,
      dissipating: true,
      radius: 20
    });

    this.getUserLocation();
    document.getElementById('status').textContent = `Welcome to ${venue.name}! Use chat or destination input.`;
  }

  generateCrowdData(center, count = 200) {
    const data = [];
    for (let i = 0; i < count; i++) {
      const lat = center.lat + (Math.random() - 0.5) * 0.01;
      const lng = center.lng + (Math.random() - 0.5) * 0.01;
      const weight = Math.random(); // 0 low, 1 high crowd
      data.push(new google.maps.LatLng(lat, lng, weight));
    }
    return data;
  }

  getUserLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {lat: pos.coords.latitude, lng: pos.coords.longitude};
        this.userContext.location = loc;
        if (this.userMarker) this.userMarker.setMap(null);
        this.userMarker = new google.maps.Marker({
          position: loc,
          map: this.map,
          title: 'You',
          icon: {url: 'data:image/svg+xml;base64,...blue-dot', scaledSize: new google.maps.Size(32,32)} // Simple
        });
        this.map.panTo(loc);
      },
      () => document.getElementById('status').textContent += ' Use manual loc.'
    );
  }

  getDirections() {
    const dest = document.getElementById('destination').value;
    if (!dest || !this.userContext.location) return alert('Set loc/dest.');

    this.placesService.textSearch({query: dest + ' Wembley Stadium', location: this.userContext.location}, (places, status) => {
      if (status === 'OK' &amp;&amp; places[0]) {
        const request = {
          origin: this.userContext.location,
          destination: places[0].geometry.location,
          travelMode: 'WALKING',
          avoid: ['highways'] // Sim crowd avoid
        };
        this.directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            this.directionsRenderer.setDirections(result);
            this.estimateWait(places[0]);
          }
        });
      }
    });
  }

  estimateWait(place) {
    // Places popular times for wait est (requires backend for real-time, sim here)
    const hour = new Date().getHours();
    const baseWait = Math.floor(Math.random() * 10 + 5); // 5-15min
    const est = `${baseWait} min wait (peak ${hour > 17 ? 'high' : 'low'})`;
    document.getElementById('status').textContent = `Est. ${est} at ${place.name}`;
  }

  async sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    this.appendChat('You', msg);
    input.value = '';

    // Spinner
    const btn = document.getElementById('sendChat');
    btn.innerHTML = '<span class="loading"></span>';

    try {
      const context = {
        ...this.userContext,
        time: new Date().toLocaleString(),
        crowdLevel: 'medium' // From heatmap avg
      };
      const prompt = `You are VenueFlow AI for sporting venues. User at ${JSON.stringify(context)}. Query: ${msg}. Advise on crowd avoidance, waits, paths, coord. Be concise, actionable.`;
      const response = await this.callGemini(prompt);
      this.appendChat('AI', response);
    } catch (e) {
      this.appendChat('AI', 'Error: Check Gemini key/network.');
    }
    btn.textContent = 'Send';
  }

  appendChat(sender, msg) {
    const chat = document.getElementById('chatHistory');
    const div = document.createElement('div');
    div.innerHTML = `<strong>${sender}:</strong> ${msg.replace(/\\n/g, '<br>')}<br><small>${new Date().toLocaleTimeString()}</small>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  async callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({contents: [{parts: [{text: prompt}]}]})
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }
}

// Init app
const app = new VenueFlowAI();
