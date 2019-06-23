/*** Create a map ***/
var map;

function initMap() {
  
    /** start map **/
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -19.7549969,
            lng: -47.9658842,
        },
        zoom: 17,
        styles: [
            {
              "featureType": "poi.business",
              "stylers": [
                {
                  "visibility": "off"
                }
              ]
            },
            {
              "featureType": "poi.park",
              "elementType": "labels.text",
              "stylers": [
                {
                  "visibility": "off"
                }
              ]
            }
        ]
    });

  /** Load view model **/
  ko.applyBindings(ViewModel());
}

/*** Data ***/
var foodPlaces = [
    {
        id : 1,
        name: 'Macarrão e Cia',
        type: 'restaurante',
        lat: -19.755696, 
        lng: -47.965363,
        description: 'Casa de massas.',
        pic: 'images/macarrao.jpg',
        iconPic: 'images/spaghetti.png',
        woeid: '455916',
    },
    {
        id: 2,
        name: 'Hard Burguer',
        type: 'lanchonete',
        lat: -19.754954, 
        lng: -47.964873,
        description: 'Burguers ao estilo rock!',
        pic: 'images/burguer2.jpg',
        iconPic: 'images/burger.png',
        woeid: '455916', 
    },
    {
        id: 3,
        name: 'Ikezawa',
        type: 'padaria',
        lat: -19.753851,
        lng: -47.965149,
        description: 'Melhor pão da cidade!',
        pic: 'images/pao.jpg',
        iconPic: 'images/bread.png',
        woeid: '455916',
    },
    {
        id: 4,
        name: 'Italiana delivery',
        type: 'restaurante',
        lat: -19.756039,
        lng: -47.966087,
        description: 'Entregas de comida italiada.' ,
        pic: 'images/pizza.jpg',
        iconPic: 'images/pizza.png',
        woeid: '455916',  
    },
    {
        id: 5,
        name: 'Mr. Bull Burguers',
        type: 'lanchonete',
        lat: -19.754246, 
        lng: -47.964854,
        description: 'Infarte ou seu dinheiro de volta!',
        pic: 'images/burguer1.jpg',
        iconPic: 'images/fries.png',
        woeid: '455916',
    }
];

/*** Model ***/
var Place = function(data) {

    var self = this;

    self.id = ko.observable(data.id);
    self.name = ko.observable(data.name);
    self.type = ko.observable(data.type);
    self.lat = ko.observable(data.lat);
    self.lng = ko.observable(data.lng);
    self.description = ko.observable(data.description);
    self.pic = ko.observable(data.pic);
    self.iconPic = ko.observable(data.iconPic);
    self.woied = ko.observable(data.woeid);
}

/*** View model ***/
function ViewModel() {

    /** Some vars ***/
    var self = this;
    var infoWindow = new google.maps.InfoWindow();
    var temp;
    var HGBRASIL_API_KEY = 'YOUR_HGBRASIL_API_KEY';

    /** All places **/
    self.allPlaces = ko.observable([]);
    foodPlaces.forEach(function(place) {
        self.allPlaces().push(new Place(place));
    });

    /** Create markers **/
    self.allPlaces().forEach(function(place) {

        // Ajax to get temp from Uberaba
        $.ajax({
            url: 'https://api.hgbrasil.com/weather?format=json-cors' +
                '&key=' + HGBRASIL_API_KEY +
                '?woeid=' + place.woied(),
            dataType: 'json',
            async: true,
            success: function(data) {
                temp = data.results.temp;
                place.contentString = '<h3>' + place.name() + '</h3>' +
                '<p class="text-muted">Temperatura de ' + temp + ' C°</p>' +
                '<p>' + place.description() + '</p>' +
                '<img src="' + place.pic() + '" width="150px">';
            },
            error: function(e) {
                infoWindow.setContent('<h3>' + place.name() + '</h3>' +
                '<p class="text-muted">Falha em obter temperatura.</p>' +
                '<p>' + place.description() + '</p>' +
                '<img src="' + place.pic() + '" width="150px">');
            }
        });

        /* Create marker */
        var marker = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP,
            position: new google.maps.LatLng(
                place.lat(), place.lng()
            )
        });

        /* Adjust to marker bounds */
        var bounds = new google.maps.LatLngBounds();
        bounds.extend(marker.position);

        /* Keep infoWindow and marker */
        marker.infoWindow = infoWindow;
        marker.setIcon(place.iconPic());
        place.marker = marker;
        
        /* Set marker attribute to place */
        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.open(map, this);
            place.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
              place.marker.setAnimation(null);
            }, 1200);
            infoWindow.setContent(place.contentString);
        });
    });

    /** List functions **/
    this.animateById = function(placeId) {

        /* Stop active animations */
        self.allPlaces().forEach(function(place) {
            place.marker.setAnimation(null);
        });

        /* Close open info windows */
        self.allPlaces().forEach(function(place){
            place.marker.infoWindow.close();
        });

        /* Get clicked place */
        place = self.allPlaces()[placeId-1];

        /* Open info window from clicked place */
        place.marker.infoWindow.setContent(place.contentString);
        place.marker.infoWindow.open(map, place.marker);

        /* Animate cliked place */
        place.marker.setAnimation(google.maps.Animation.BOUNCE);       
    }

    /** Restart Map **/
    this.restartMap = function() {

        /* Stop active animations */
        self.allPlaces().forEach(function(place) {
            place.marker.setAnimation(null);
        });

        /* Close openned info windows */
        self.allPlaces().forEach(function(place){
            place.marker.infoWindow.close();
        });

        /* Reset center */
        map.setCenter({
            lat: -19.7549969,
            lng: -47.9658842,
        });

        /* Reset zoom */
        map.setZoom(17);
    }

    /** Visible tracks **/
    self.showRestaurantes = ko.observable(true);
    self.showLanchonetes = ko.observable(true);
    self.showPadarias = ko.observable(true);

    /** Filter list and set visible by visible tracks **/
    this.updateList = function(placeType) {
        
        /* Restart map */
        self.restartMap();
        if (placeType == 'restaurante'){
            // Show just restaurantes
            self.showRestaurantes(true);
            self.showPadarias(false);
            self.showLanchonetes(false);        
        } else if (placeType == 'padaria') {
            // Show just padarias
            self.showRestaurantes(false);
            self.showPadarias(true);
            self.showLanchonetes(false);
        } else if (placeType == 'lanchonete') {
            // Show just lanchonetes
            self.showRestaurantes(false);
            self.showPadarias(false);
            self.showLanchonetes(true);            
        } else {
            // Show all
            self.showRestaurantes(true);
            self.showPadarias(true);
            self.showLanchonetes(true);             
        }
        /* Animate filtered markers */
        self.allPlaces().forEach(function(place){
            if (place.type() == placeType) {
                place.marker.setAnimation(google.maps.Animation.BOUNCE);
            } else {
                place.marker.setAnimation(null);
            }
        }); 
    }
};

