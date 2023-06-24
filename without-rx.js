function B(callback) {
    // Do operation that takes some time
    callback('Done!');
}
function A(message) {
    console.log(message);
}
// Execute `B` with `A` as a callback
B(A)



// With rxjs
var button = document.getElementById('retrieveDataBtn');
var source1 = Rx.DOM.getJSON('/resource1').pluck('name');
var source2 = Rx.DOM.getJSON('/resource2').pluck('props', 'name');
function getResults(amount) {
    return source1.merge(source2)
        .pluck('names')
        .flatMap(function (array) { return Rx.Observable.from(array); })
        .distinct()
        .take(amount);
}
var clicks = Rx.Observable.fromEvent(button, 'click');
clicks.debounce(1000)
    .flatMap(getResults(5))
    .subscribe(
        function (value) { console.log('Received value', value); },
        function (err) { console.error(err); },
        function () { console.log('All values retrieved!'); }
    );

// without rxjs
var button = document.getElementById('retrieveDataBtn');

function getJSON(url) {
  return fetch(url).then(function(response) {
    return response.json();
  });
}

function pluck(obj, key1, key2) {
  if (key2) {
    return obj[key1][key2];
  }
  return obj[key1];
}

function mergeArrays(arr1, arr2) {
  return arr1.concat(arr2);
}

function flatMap(arr, callback) {
  return arr.map(callback).reduce(function(acc, val) {
    return acc.concat(val);
  }, []);
}

function distinct(arr) {
  return arr.filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });
}

function take(arr, amount) {
  return arr.slice(0, amount);
}

function getResults(amount) {
  var source1 = getJSON('/resource1').then(function(data) {
    return pluck(data, 'name');
  });

  var source2 = getJSON('/resource2').then(function(data) {
    return pluck(data, 'props', 'name');
  });

  return Promise.all([source1, source2]).then(function(results) {
    var merged = mergeArrays(results[0], results[1]);
    var flattened = flatMap(merged, function(array) {
      return array;
    });
    var distinctValues = distinct(flattened);
    var taken = take(distinctValues, amount);
    return taken;
  });
}

function handleClick() {
  getResults(5)
    .then(function(values) {
      values.forEach(function(value) {
        console.log('Received value', value);
      });
      console.log('All values retrieved!');
    })
    .catch(function(err) {
      console.error(err);
    });
}

button.addEventListener('click', function() {
  setTimeout(handleClick, 1000);
});
