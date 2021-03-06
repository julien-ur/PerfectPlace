(function(window) {
	'use strict';
	
	function MapView() {
		// // creates a map in the "map" div, set the view to a given place and zoom
		// this.map = L.map('map').setView([49.017222, 12.096944], 14);
		//
		// // adding MapQuest tile layer, must give proper OpenStreetMap attribution according to MapQuest terms
		// L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
		// 	maxZoom: PerfectPlaceConfig.MAP_MAX_ZOOM,
		// 	subdomains: '1234',
		// 	attribution: '&copy; <a href="http://info.mapquest.com/terms-of-use/">MapQuest</a> | &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		// }).addTo(this.map);

		var mapLayer = MQ.mapLayer();

		this.map = L.map('map', {
			layers: mapLayer,
			center: [ 49.017222, 12.096944 ],
			zoom: 14
		});

		this.paramLayers = L.layerGroup();
		this.paramLayers.addTo(this.map);

		var that = this;
		var updatingData = false;
		var socket = io.connect('http://localhost:8040');

		var $updateDataBtn = $('#server-precache');

		$updateDataBtn.on('click', function() {
			if(!updatingData) updateOSMData();
		});

        $updateDataBtn.html("TileServer unavailable");
        $updateDataBtn.attr("disabled", true);

		function updateOSMData() {

			$updateDataBtn.html("Updating Data. Please wait..");

			updatingData = true;

			var actMapBounds = that.map.getBounds();
			var bbox = {
				west: actMapBounds.getWest(),
				south: actMapBounds.getSouth(),
				east: actMapBounds.getEast(),
				north: actMapBounds.getNorth()
			};
			socket.emit('updateOSMData', bbox);
		}

		socket.on('dataUpdated', function() {
			$updateDataBtn.html("Update OSM Data");
			updatingData = false;
		});

        socket.on('dataUpdating', function() {
            $updateDataBtn.html("Currently updated by another client");
        });

        socket.on('connect', function() {
            $updateDataBtn.html("Update OSM Data");
            $updateDataBtn.attr("disabled", false);
        });

		socket.on('disconnect', function() {
            $updateDataBtn.html("TileServer unavailable");
            $updateDataBtn.attr("disabled", true);
		});
	}

	MapView.prototype.addLayer = function(opacity, renderFunct) {
		var that = this;
		var canvasTileLayer = L.tileLayer.canvas({
			tileSize: PerfectPlaceConfig.PARAM_LAYER_TILE_SIZE
		});

		canvasTileLayer.drawTile = function(canvas, tilePoint, zoom) {
		    renderFunct(canvas, tilePoint, zoom, that.map.getBounds(), that.map.getCenter());
		};

		this.paramLayers.addLayer(canvasTileLayer);

		var $canvasTileLayer = $(canvasTileLayer.getContainer());
		$canvasTileLayer.css({
			"mix-blend-mode": "multiply",
			"opacity": opacity
		});

		return canvasTileLayer._leaflet_id;
	};

	MapView.prototype.updateLayerOpacity = function(opacity) {
		this.paramLayers.eachLayer(function(layer) {
			layer.setOpacity(opacity);
		});
	};

	MapView.prototype.redrawLayer = function(layerId){
		this.paramLayers.getLayer(layerId).redraw();
	};

	MapView.prototype.removeLayer = function(layerId) {
		this.paramLayers.removeLayer(layerId);
	};

	window.PerfectPlace = window.PerfectPlace || {};
	window.PerfectPlace.MapView = MapView;

})(window);