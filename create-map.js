class Map {
    QUAKE_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp';
    map;
    circle;
  
    constructor() {
      this.notification = new Notification();
    }
  
    createMap() {
      this.map = L.map('map').setView([33.858631, -118.279602], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    }
  
    getEarthQuakeData() {
      const quakes = rxjs.Observable.create((observer) => {
        window.eqfeed_callback = (response) => {
          const quakes = response.features;
          quakes.forEach((quake, index) => {
            const duration = 1000;
            const timeout$ = rxjs.timer(duration * (index + 1));
            timeout$.subscribe(() => {
              observer.next(quake);
            });
          });
        };
        this.loadJSONP(this.QUAKE_URL);
      });
  
      quakes.subscribe((quake) => {
        const coords = quake.geometry.coordinates;
        const size = quake.properties.mag * 10000;
        const circle = L.circle([coords[1], coords[0]], size).addTo(this.map);
        const place = "Place: " + quake.properties.place;
        const mag = "Magnitude: " + quake.properties.mag;
        const content = place + "<br/>" + mag;
        circle.bindTooltip(content).openTooltip();
        if (this.isOutsideCircle(coords[1], coords[0])) {
          this.notification.createErrorToaster(content);
        } else {
          this.notification.createToaster(content);
        }
      });
    }
  
    isOutsideCircle(latitude, longitude) {
      if (!this.circle) {
        return false; // Circle not created yet, consider it as inside the circle
      }
  
      const point = L.latLng(latitude, longitude);
      const distance = this.circle.getLatLng().distanceTo(point);
      const radius = this.circle.getRadius();
  
      return distance > radius;
    }
  
    activateCircleZoneCreationOnMap() {
      let startPoint, endPoint;
  
      const createCircle = () => {
        if (this.circle) {
          this.map.removeLayer(this.circle);
        }
        const radius = startPoint.distanceTo(endPoint);
        this.circle = L.circle(startPoint, { radius }).addTo(this.map);
      };
  
      const handleMouseHover = () => {
        console.log('Mouse is hovering over the circle');
      };
  
      const handleMouseDown = (e) => {
        startPoint = e.latlng;
      };
  
      const handleMouseUp = (e) => {
        endPoint = e.latlng;
        createCircle();
      };
  
      this.map.on('mousedown', handleMouseDown);
      this.map.on('mouseup', handleMouseUp);
  
      const circleElement = document.querySelector('.leaflet-interactive');
      const mouseHover$ = rxjs.fromEvent(circleElement, 'mouseover');
      mouseHover$.subscribe(handleMouseHover);
    }
  
    loadJSONP(url) {
      const script = document.createElement('script');
      script.src = url;
      const head = document.getElementsByTagName('head')[0];
      head.appendChild(script);
    }
  }
  
  class Notification {
    createToaster(content) {
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-success';
  
      const span = document.createElement('span');
      span.innerHTML = content;
  
      alertDiv.appendChild(span);
      document.getElementById('quakes_info').appendChild(alertDiv);
    }
  
    createErrorToaster(content) {
      const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-error';

        const span = document.createElement('span');
        span.innerHTML = content;

        alertDiv.appendChild(span);
        document.getElementById('quakes_info').appendChild(alertDiv);
    }
}

const map = new Map();
map.createMap();
map.getEarthQuakeData();
map.activateCircleZoneCreationOnMap();