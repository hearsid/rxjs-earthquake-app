(function () {
    var QUAKE_URL = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/' +
        'summary/all_day.geojsonp';

    function loadJSONP(url) {
        var script = document.createElement('script');
        script.src = url;
        var head = document.getElementsByTagName('head')[0];
        head.appendChild(script);
    }

    function createToaster(content) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';

        const span = document.createElement('span');
        span.innerHTML = content;

        alertDiv.appendChild(span);
        document.getElementById('quakes_info').appendChild(alertDiv);
    }

    var map = L.map('map').setView([33.858631, -118.279602], 7);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

    var quakes = rxjs.Observable.create(function (observer) {
        window.eqfeed_callback = function (response) {
            var quakes = response.features;
            quakes.forEach(function (quake, index) {
                //  do next for each response in 500ms with rxjs 
                const duration = 1000;
                setTimeout(() => {
                    observer.next(quake);
                }, duration * (index + 1)); // 500ms delay
            });
        };
        loadJSONP(QUAKE_URL);
    });
    quakes.subscribe(function (quake) {
        var coords = quake.geometry.coordinates;
        var size = quake.properties.mag * 10000;
        const circle = L.circle([coords[1], coords[0]], size).addTo(map);
        const place = "Place: "+quake.properties.place;
        const mag = "Magnitude: "+ quake.properties.mag;
        const content = place + "<br/>" + mag;
        circle.bindTooltip(content).openTooltip();
        createToaster(content);
    });
})(); // just to contain the scope