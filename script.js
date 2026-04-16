// VenueFlow AI - script.js
// Replace YOUR_MAPS_KEY, YOUR_GEMINI_KEY with your Google API keys from console.cloud.google.com

class VenueFlowAI {
  constructor() {
    this.map = null;
    this.userMarker = null;
    this.heatmap = null;
    this.directionsService = null;
    this.directionsRenderer = null;
    this.placesService = null;
    this.geminiApiKey = 'YOUR_GEMINI_KEY';
    this.mapsKey = 'YOUR_MAPS_KEY';
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
    this.userContext = {};
    this.init();
  }

  init() {
    this.bindEvents();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('loadVenue').click();
      });
    } else {
      document.getElementById('loadVenue').click();
    }
  }

  bindEvents() {
    const loadBtn = document.getElementById('loadVenue');
    if (loadBtn) loadBtn.onclick = () => this.loadVenue();

    const dirBtn = document.getElementById('getDirections');
    if (dirBtn) dirBtn.onclick = () => this.getDirections();

    const chatBtn = document.getElementById('sendChat');
    if (chatBtn) chatBtn.onclick = () => this.sendChat();

    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.onkeypress = (e) => {
      if (e.key === 'Enter') this.sendChat();
    };
  }

  loadVenue() {
    const venueKey = document.getElementById('venueSelect').value;
    const venue = this.venueData[venueKey];
    const statusEl = document.getElementById('status');
    statusEl.textContent = `Loading ${venue.name}... (Replace API keys to use)`;

    if (typeof google === 'undefined' || !google.maps) {
      statusEl.textContent = 'Replace YOUR_MAPS_KEY in index.html <script src> and reload.';
      return;
    }

    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: venue.center,
      mapTypeId: 'satellite'
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.map);
    this.placesService = new google.maps.places.PlacesService(this.map);

    const crowdData = this.generateCrowdData(venue.center);
    this.heatmap = new google.maps.visualization.HeatmapLayer({
      data: crowdData,
      map: this.map,
      dissipating: true,
      radius: 20
    });

    this.getUserLocation();
    statusEl.textContent = `${venue.name} loaded! (Demo mode - add keys for full func: Maps, Places, Gemini)`;
  }

  generateCrowdData(center) {
    const data = [];
    for (let i = 0; i < 200; i++) {
      const lat = center.lat + (Math.random() - 0.5) * 0.01;
      const lng = center.lng + (Math.random() - 0.5) * 0.01;
      const weight = Math.random();
      data.push(new google.maps.LatLng(lat, lng, weight));
    }
    return data;
  }

  getUserLocation() {
    if (!navigator.geolocation) {
      document.getElementById('status').textContent += ' Geoloc not supported.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.userContext.location = loc;
        if (this.map && this.userMarker) this.userMarker.setMap(null);
        if (this.map) {
          this.userMarker = new google.maps.Marker({
            position: loc,
            map: this.map,
            title: 'You are here'
          });
          this.map.panTo(loc);
        }
      },
      (err) => {
        console.log('Geoloc error:', err);
        document.getElementById('status').textContent += ' Enable geoloc.';
      }
    );
  }

  getDirections() {
    const dest = document.getElementById('destination').value;
    if (!dest || !this.userContext.location) {
      alert('Load map and allow location first.');
      return;
    }
    if (!this.placesService) {
      alert('Places API needs key.');
      return;
    }

    const query = dest + ' near ' + this.venueData.wembley.name; // Default Wembley for demo
    this.placesService.textSearch({ query: query, location: this.userContext.location }, (places, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && places[0]) {
        const request = {
          origin: this.userContext.location,
          destination: places[0].geometry.location,
          travelMode: google.maps.TravelMode.WALKING
        };
        this.directionsService.route(request, (result, dstatus) => {
          if (dstatus === google.maps.DirectionsStatus.OK) {
            this.directionsRenderer.setDirections(result);
            this.estimateWait(places[0]);
          }
        });
      } else {
        alert('Dest not found. Try "gate".');
      }
    });
  }

  estimateWait(place) {
    const hour = new Date().getHours();
    const baseWait = Math.floor(Math.random() * 10 + 5);
    const est = `${baseWait} min estimated wait (demo). Peak: ${hour > 17 ? 'high' : 'low'}`;
    document.getElementById('status').textContent = est + ' at ' + place.name;
  }

  async sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    this.appendChat('You', msg);
    input.value = '';
    const btn = document.getElementById('sendChat');
    const original = btn.textContent;
    btn.innerHTML = '<span class="loading"></span> Sending...';

    try {
      const contextStr = JSON.stringify({
        location: this.userContext.location,
        time: new Date().toLocaleString(),
        crowd: 'medium (heatmap)'
      });
      const prompt = `VenueFlow AI: Sporting venue assistant. Context: ${contextStr}. User: ${msg}. Give short, practical advice on paths, crowds, waits, friends meetup.`;
      const response = await this.callGemini(prompt);
      this.appendChat('VenueFlow AI', response);
    } catch (e) {
      this.appendChat('VenueFlow AI', 'Setup Gemini key at aistudio.google.com/app/apikey for chat.');
    }
    btn.textContent = original;
  }

  appendChat(sender, msg) {
    const chat = document.getElementById('chatHistory');
    const div = document.createElement('div');
    div.innerHTML = `<strong>${sender}:</strong> ${msg.replace(/\\n/g, '<br>')}<br><small>${new Date().toLocaleTimeString()}</small>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  async callGemini(prompt) {
    if (this.geminiApiKey === 'YOUR_GEMINI_KEY') throw new Error('Key needed');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.geminiApiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }
}

const app = new VenueFlowAI();
