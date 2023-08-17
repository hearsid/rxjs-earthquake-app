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
  
    toggleDragging() {
      var draggingEnabled = true;
      var toggleDragButton = document.getElementById('toggle-drag');
  
      // Function to toggle map dragging and update button text
      const toggleMapDragging = () => {
        if (draggingEnabled) {
          this.map.dragging.disable();
          draggingEnabled = false;
          toggleDragButton.textContent = 'Disable Drawing';
        } else {
          this.map.dragging.enable();
          draggingEnabled = true;
          toggleDragButton.textContent = 'Enable Drawing';
        }
      }
  
      // Event listener for the toggle-drag button
      toggleDragButton.addEventListener('click', toggleMapDragging);
    }
  
    getEarthQuakeData() {
      const quakes = new myrxjs.Observable((observer) => {
        window.eqfeed_callback = (response) => {
          const quakes = response.features;
          quakes.forEach((quake, index) => {
            const duration = 1000;
            const timeout = setTimeout(() => {
              observer.next(quake);
            }, duration * (index + 1));
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
        if (this.isInsideCircle(coords[1], coords[0])) {
          this.notification.createErrorToaster(content);
        } else {
          this.notification.createToaster(content);
        }
      });
    }
  
    isInsideCircle(latitude, longitude) {
      if (!this.circle) {
        return false; // Circle not created yet, consider it as inside the circle
      }
  
      const point = L.latLng(latitude, longitude);
      const distance = this.circle.getLatLng().distanceTo(point);
      const radius = this.circle.getRadius();
  
      return distance < radius;
    }
  
    activateCircleZoneCreationOnMap() {
      let startPoint, endPoint;
  
      const createCircle = () => {
        if (this.circle) {
          this.map.removeLayer(this.circle);
        }
        const radius = startPoint.distanceTo(endPoint);
        this.circle = L.circle(startPoint, { radius }).addTo(this.map);
      }
    
      const handleMouseHover = () => {
        console.log('Mouse is hovering over the circle');
      }
    
      const handleMouseDown = (e) => {
        startPoint = e.latlng;
      }
    
      const handleMouseUp = (e) => {
        endPoint = e.latlng;
        createCircle();
      }
    
      this.map.on('mousedown', handleMouseDown);
      this.map.on('mouseup', handleMouseUp);
    
      this.map.on('load', () => {
        const circleElement = document.querySelector('.leaflet-interactive');
        if (circleElement) {
          circleElement.addEventListener('mouseover', handleMouseHover);
        }
      });
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
  
  const myrxjs = {
    Observable: class {
      constructor(subscribe) {
        this._subscribe = subscribe;
      }
  
      subscribe(observer) {
        return this._subscribe({ next: (quakeData) => observer.call(this, quakeData) });
      }
  
      pipe(...fns) {
        return fns.reduce((prev, curr) => curr(prev), this);
      }
    },
  
    timer: (duration) => {
      return new myrxjs.Observable((observer) => {
        const timeout = setTimeout(() => {
          observer.next(0);
          observer.complete();
        }, duration);
  
        return {
          unsubscribe() {
            clearTimeout(timeout);
          }
        };
      });
    },
  
    fromEvent: (element, eventName) => {
      return new myrxjs.Observable((observer) => {
        const handler = (event) => observer.next(event);
  
        element.addEventListener(eventName, handler);
  
        return {
          unsubscribe() {
            element.removeEventListener(eventName, handler);
          }
        };
      });
    }
  };
  
  const map = new Map();
  map.createMap();
  map.getEarthQuakeData();
  map.activateCircleZoneCreationOnMap();
  map.toggleDragging();