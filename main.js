//google map
let map;
let newMarker = null;
let googleMarkersArray = [];
let showingSearchedMarker = false;
let existingMarkerWindow = false;

function initMap() {
  //map options, center to Helsinki by default lat + lng
  let options = {
    zoom: 11,
    center: { lat: 60.192059, lng: 24.945831 }
  };
  map = new google.maps.Map(document.getElementById("map"), options);
  //gets markers from local storage and then calls another function showExistingMarker to draw the markers on the map
  getMarkersToMap();
  //new markers can be added by clicking anywhere on the map
  google.maps.event.addListener(map, "click", function(event) {
    // idNumber is for identifying markers in local storage
    markerId = generateIdNumber();
    //if newMarker and existingMarkerWindow = false, user doesn't have any other infowindows open at that time
    //--> prevents user to click open multiple windows at the same time, so data won't get mixed in the local storage
    if (!newMarker && !existingMarkerWindow) {
      addNewMarker(map, event.latLng.lat(), event.latLng.lng(), markerId);
    }
  });
}

function getMarkersToMap() {
  let markers = localStorage.getItem("markers");
  //if local storage is empty, creates an empty array
  if (markers === null) {
    markers = [];
    //if markers are found in storage, parses them
  } else {
    markers = JSON.parse(markers);
  }
  for (let index = 0; index < markers.length; index++) {
    //loops all markers and creates marker object on every index as long as there are markers left
    const markerObj = markers[index];
    //calls function to draw the markers onto the map one by one
    showExistingMarker(map, markerObj);
  }
}

function generateIdNumber() {
  //if storage is totally empty or there are an empty array the first ID will be 1
  let markersInStorage = JSON.parse(localStorage.getItem("markers"));
  if (markersInStorage === null || markersInStorage.length === 0) {
    return 1;
  }
  //if there are multiple markers in storage, checks the highest number available
  //(because after deleting some of the markers the order of the numbers might have changed) and adds 1 to it.
  let idValues = markersInStorage.map(m => m.id);
  return Math.max(...idValues) + 1;
}

function showExistingMarker(map, existingMarker) {
  //existingMarker = markerObj from getMarkersToMap()
  let marker = new google.maps.Marker({
    position: { lat: existingMarker.lat, lng: existingMarker.lng },
    map: map,
    //added own attribute to google maps marker so that every marker on the map can be indentified easily
    markerId: existingMarker.id
  });
  //shows the info of marker from storage: title, description (also lat and lng)
  //infowindow has buttons for updating info, deleting marker and closing the window
  marker.infoWindow = new google.maps.InfoWindow({
    content: `
    <form>
        <label>Title:</label>
        <br>
        <input type="text" name="title" id="title" value="${existingMarker.inputTitle}">
        <br>
        <label>Description:</label>
        <br>
        <input type="text" name="description" id="description" value="${existingMarker.inputDescription}"><br><br>
        <button onclick="updateExistingMarker(${existingMarker.id})" type="button">Update</button>
        <button onclick="deleteExistingMarker(${existingMarker.id})" type="button">Delete</button>
        <button onclick="cancelExistingMarker(${existingMarker.id})" id="cancelBtn" type="button">Cancel</button>
    </form>
    <br> 
    <div> 
        Latitude: ${existingMarker.lat}<br>
        Longitude: ${existingMarker.lng}
    </div>`
  });

  //if showingSearchedMarker=true user has searched for one specific marker
  //--> only that marker shows on the map and its infowindow opens
  if (showingSearchedMarker) {
    marker.infoWindow.open(map, marker);
    showingSearchedMarker = false;
  }
  // existing markers' infowindows can be clicked open
  //if newMarker and existingMarkerWindow = false, user doesn't have any other infowindows open at that time
  //--> prevents user to click open multiple windows at the same time, so that data won't get mixed in the local storage
  google.maps.event.addListener(marker, "click", function(event) {
    if (!newMarker && !existingMarkerWindow) {
      marker.infoWindow.open(map, marker);
      existingMarkerWindow = true;
    }
  });

  //keeps track of markers showing on the map with identifying markerId
  googleMarkersArray.push(marker);

  //if infowindow's upper corner x gets clicked, map "updates" and shows everything correctly
  // --> there was a problem with the marker icon showing wrongly etc. without doing this
  google.maps.event.addListener(marker.infoWindow, "closeclick", function() {
    existingMarkerWindow = false;
    updateMapView();
  });
}

function addNewMarker(map, lat, lng, markerId) {
  let marker = new google.maps.Marker({
    position: { lat, lng },
    map: map
  });
  //user can type in info for new marker: title, description
  //infowindow has buttons for saving info and closing the window
  marker.infoWindow = new google.maps.InfoWindow({
    content: `
    <form>
        <label>Title:</label>
        <br> 
        <input type="text" name="title" id="title">
        <br>
        <label>Description:</label>
        <br>
        <input type="text" name="description" id="description"><br><br>
        <button onclick="storeMarker(${markerId}, ${lat}, ${lng})" type="button">Save</button>
        <button onclick="cancelNewMarker()" id="cancelBtn" type="button">Cancel</button>
    </form>
    <br> 
    <div> 
        Latitude: ${lat}<br>
        Longitude: ${lng}
    </div>`
  });

  //if infowindow's upper corner x gets clicked (without saved info), this removes the marker and sets newMarker to null
  //so that user can click the map again to add new marker
  //this prevents the issue of marker icon showing wrongly etc.
  google.maps.event.addListener(marker.infoWindow, "closeclick", function() {
    newMarker.setMap(null);
    newMarker = null;
  });

  marker.infoWindow.open(map, marker);
  newMarker = marker;
}

//when user clicks save button
function storeMarker(markerId, lat, lng) {
  let markersInStorage = JSON.parse(localStorage.getItem("markers"));
  if (markersInStorage === null) {
    markersInStorage = [];
  }
  // gets input values user has typed in
  let inputTitle = document.getElementById("title").value;
  let inputDescription = document.getElementById("description").value;

  //pushes new marker to the end of the markers array
  markersInStorage.push({
    id: markerId,
    inputTitle: inputTitle,
    inputDescription: inputDescription,
    lat: lat,
    lng: lng
  });

  //puts markers into local storage
  localStorage.setItem("markers", JSON.stringify(markersInStorage));
  newMarker.infoWindow.close();
  newMarker.setMap(null);
  newMarker = null;
  //updates the view of the map --> user is able to click the marker open that was just added to the map
  updateMapView();
}

//empties the google map view of markers
function clearAllMarkers() {
  for (var i = 0; i < googleMarkersArray.length; i++) {
    googleMarkersArray[i].setMap(null);
  }
  googleMarkersArray.length = 0;
}

//user deletes a marker
function deleteExistingMarker(markerId) {
  let markersInStorage = JSON.parse(localStorage.getItem("markers"));
  if (markersInStorage === null) {
    markersInStorage = [];
  }
  //keep all that fits in this -->  marker.id !== markerId
  markersInStorage = markersInStorage.filter(marker => marker.id !== markerId);
  //puts the above ones back to storage
  localStorage.setItem("markers", JSON.stringify(markersInStorage));
  existingMarkerWindow = false;
  var marker = googleMarkersArray.find(m => m.markerId === markerId);
  marker.setMap(null);
  //updates the view of the map
  updateMapView();
}

//removes the new marker from the map (if no data is saved) when cancel button is clicked
function cancelNewMarker() {
  newMarker.setMap(null);
  newMarker = null;
}

//user updates marker's info data
function updateExistingMarker(markerId) {
  let markersInStorage = JSON.parse(localStorage.getItem("markers"));
  for (let index = 0; index < markersInStorage.length; index++) {
    const markerObj = markersInStorage[index];
    //finds the right marker with the given ID and changes info with the given new values
    if (markerId == markerObj.id) {
      markerObj.inputTitle = document.getElementById("title").value;
      markerObj.inputDescription = document.getElementById("description").value;
    }
  }
  localStorage.setItem("markers", JSON.stringify(markersInStorage));
  existingMarkerWindow = false;
  var marker = googleMarkersArray.find(m => m.markerId === markerId);
  marker.infoWindow.close();
  //updates the view of the map
  updateMapView();
}

//closes the infowindow for existing marker that has been clicked open
function cancelExistingMarker(markerId) {
  //finds the right id
  var marker = googleMarkersArray.find(m => m.markerId === markerId);
  existingMarkerWindow = false;
  marker.infoWindow.close();
  //updates the view of the map
  updateMapView();
}

function updateMapView() {
  clearAllMarkers();
  getMarkersToMap();
}

function searchPlaces() {
  let foundMatch = false;
  //gets query from search bar
  let query = document.getElementById("searchPlaces").value;
  //clears search bar
  document.getElementById("searchPlaces").value = "";
  let markersInStorage = JSON.parse(localStorage.getItem("markers"));
  if (markersInStorage !== null) {
    for (let index = 0; index < markersInStorage.length; index++) {
      const markerObj = markersInStorage[index];
      //finds the matching title for query
      // sets everything to lower case so it's not case sensitive
      let toLowCaseQuery = query.toLowerCase();
      let toLowCaseTitle = markerObj.inputTitle.toLowerCase();
      if (toLowCaseQuery == toLowCaseTitle) {
        foundMatch = true;
        //Updates the view of the map and shows only the searched marker/place
        showingSearchedMarker = true;
        clearAllMarkers();
        showExistingMarker(map, markerObj);
      }
    }
    // if no matching title to query
    if (!foundMatch) {
      alert("Sorry no matches with: '" + query + "'");
    }
  } else {
    // if no marker/s in storage 
    alert("Sorry no matches with: '" + query + "'");
  }
}
//shows little info how to use the app
function getInfo() {
  alert(
    "Start adding new places by clicking on the map. Please don't give the same title for multiple places." +
    " You can update information on existing place or remove the place from the map." +
    " You can also search from added places by the title. Please use the whole title when searching."
  );
}

//user can get their current location on the map
function findMe() {
  // try geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        var homeMarker = new google.maps.Marker({
          position: pos,
          map: map,
          icon:
            "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png"
        });
        var infoWindow = new google.maps.InfoWindow({
          content: "You are here!"
        });
        //centers map to users location and opens infowindow
        map.setCenter(pos);
        infoWindow.open(map, homeMarker);
      },
      function() {
        //user has prevented the use of geolocation
        handleLocationError(true, map.getCenter());
      }
    );
  } else {
    // user's browser doesn't support geolocation
    handleLocationError(false, map.getCenter());
  }
}

function handleLocationError(browserHasGeolocation, pos) {
  //depending on the cause, showing error message on the map
  var infoWindow = new google.maps.InfoWindow({
    content: browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  });
  infoWindow.setPosition(pos);
  infoWindow.open(map);
}
