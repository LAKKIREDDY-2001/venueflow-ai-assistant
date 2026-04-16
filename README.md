# VenueFlow AI Assistant 🚀

## Chosen Vertical
Improve physical event experience at large-scale sporting venues (crowd movement, waiting times, real-time coordination).

## Approach and Logic
- **Smart Dynamic Assistant**: Gemini AI processes user context (location, destination, time) for personalized advice (e.g., \"Take north path, 4min low crowd\").
- **Google Services**: Maps JS API (interactive venue map, heatmaps for crowds, DirectionsService paths), Places API (wait est. via popular times), Gemini (decision-making).
- **Features**:
  | Feature | Description | Google Service |
  |---------|-------------|----------------|
  | Venue Map & Navigation | Stadium map, user pin, optimal paths avoiding crowds | Maps JS, Directions |
  | Crowd Heatmap | Simulated real-time density | Maps HeatmapLayer |
  | Wait Times | Est. for concessions/restrooms | Places Nearby/Popular Times |
  | AI Chat | Natural lang queries/advice | Gemini API |
  | Coord | Share loc w/friends | Geolocation + share links |
- **User Flow**: Select event/venue, get loc, query dest/chat, get AI-guided route/wait info.
- **Demo**: Wembley Stadium sample. Responsive/mobile.

## How to Run
1. Get Google API key(s):
   - Go https://console.cloud.google.com/apis/library
   - Enable: Maps JavaScript, Places, Generative Language (Gemini).
   - Create key, restrict to APIs/domains.
2. Clone repo: `git clone https://github.com/LAKKIREDDY-2001/venueflow-ai-assistant.git`
3. Replace `YOUR_MAPS_KEY`, `YOUR_PLACES_KEY`, `YOUR_GEMINI_KEY` in `script.js`.
4. Open `index.html` in browser (Chrome best).
5. Allow geolocation, interact!

## Assumptions
- Demo data (crowd sim, Wembley coords).
- Frontend-only (no backend for prod scale).
- User provides real API keys.

## Evaluation Alignment
- **Code Quality**: Modular JS, semantic HTML, CSS vars.
- **Security**: Key placeholders (restrict in prod).
- **Efficiency**: Client-side only.
- **Testing**: Console/debug.
- **Accessibility**: ARIA, keyboard nav.
- **Google Integration**: Core to features.

Repo: Public, single main branch, <1MB.
