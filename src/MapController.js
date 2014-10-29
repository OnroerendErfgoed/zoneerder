define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dojo/_base/lang",
    "dojo/request",
    "dojo/request/xhr",
    "dojo/_base/array",
    "dojo/json"

], function (declare, WidgetBase, lang, request, xhr, array, JSON) {
    return declare([WidgetBase], {

        mapContainer: null,

        map: null,

        mapProjection: null,

        baseClass: "oeMap",

        geoJsonLayer: null,

        readOnly: null,

        postMixInProperties: function () {
            this.inherited(arguments);
        },

        buildRendering: function () {
            this.inherited(arguments);
        },

        postCreate: function () {

            var pDef = ol.proj.get('EPSG:3857');
            var pMerc = ol.proj.get('EPSG:900913');
            var pWgs84 = ol.proj.get('EPSG:4326');
            var pLam = ol.proj.get('EPSG:31370');
            this.mapProjection = pMerc;

            var extentVlaanderen = [261640.36309339158, 6541049.685576308, 705586.6233736952, 6723275.561008167];
            var centerVlaanderen = [483613.49323354336, 6632162.6232922375];

            var view = new ol.View({
                projection: this.mapProjection,
                maxZoom: 21,
                minZoom: 8
            });

            var map = new ol.Map({
                target: this.mapContainer,
                view: view
            });
            this.map = map;

            var orthoTileLayer = this._createGrbLayer("orthoklm", "Ortho", true);
            var gewestplanTileLayer = this._createGrbLayer("gewestplan", "Gewestplan", true);
            var grbTileLayer = this._createGrbLayer("grb_bsk", "GRB-Basiskaart", true);
            var grb_grTileLayer = this._createGrbLayer("grb_bsk_gr", "GRB-Basiskaart in grijswaarden", true);
            var ferrarisTileLayer = this._createGrbLayer("ferrarisx", "Ferraris", true);
            var grbTransTileLayer = this._createGrbLayer("grb_bsk_nb", "GRB-Basiskaart overlay", false);
            var grb_gbgTileLayer = this._createGrbLayer("grb_gbg", "GRB-Gebouwenlaag", false);
            var grb_adpTileLayer = this._createGrbLayer("grb_adp", "GRB-Percelenlaag", false);

            var osmTileLayer = this._createOsmLayer('Open Streetmap');

            var beschermdWmsLayer = new ol.layer.Tile({
                title: "Beschermd Onroerend Erfgoed",
                extent: extentVlaanderen,
                source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
                    url: 'https://geo.onroerenderfgoed.be/geoserver/wms',
                    params: {
                        'LAYERS': 'vioe_geoportaal:beschermde_landschappen,vioe_geoportaal:beschermde_dorps_en_stadsgezichten,vioe_geoportaal:beschermde_archeologische_zones,vioe_geoportaal:beschermde_monumenten',
                        'TILED': true
                    }
                })),
                type: 'overlay',
                visible: false
            });

            var geojsonLayer = this._createGeojsonLayer('Selectielaag', 'blue');
            this.geoJsonLayer = geojsonLayer;
            var oeFeaturesLayer = this._createGeojsonLayer('OE Features', 'red');
            this.oeFeaturesLayer = oeFeaturesLayer;

            var baseLayers = new ol.layer.Group({
                title: 'Base maps',
                layers: [
                    orthoTileLayer,
                    gewestplanTileLayer,
                    grbTileLayer,
                    grb_grTileLayer,
                    osmTileLayer,
                    ferrarisTileLayer
                ]
            });
            map.addLayer(baseLayers);

            var layers = new ol.layer.Group({
                title: 'layers',
                layers: [
                    grbTransTileLayer,
                    grb_gbgTileLayer,
                    grb_adpTileLayer,
                    beschermdWmsLayer,
                    geojsonLayer,
                    oeFeaturesLayer
                ]
            });
            map.addLayer(layers);

            orthoTileLayer.setVisible(true);

            map.addControl(new ol.control.LayerSwitcher());
            map.addControl(new ol.control.FullScreen());
            map.addControl(new ol.control.ZoomToExtent({extent: extentVlaanderen, tipLabel: 'zoom naar Vlaanderen'}));

            // Geolocation Control
            var geolocation = new ol.Geolocation({
              projection: view.getProjection(),
              trackingOptions: {
                enableHighAccuracy: true
              }
            });
            // handle geolocation error.
            geolocation.on('error', function(error) {
                alert(error.message);
            });
            map.addControl(new ol.control.zoomtogeolocationcontrol({
                tipLabel: 'zoom naar je geolocatie',
                zoomLevel: 18,
                geolocation: geolocation
            }));

            if (!this.readOnly) {
                var drawToolbar = new ol.control.DrawToolbar({mapController: this});
                drawToolbar.on('save', function(evt) {
                    evt.features.forEach(function (feature) {
                        geojsonLayer.getSource().addFeature(feature);
                    });
                });
                var self = this;
                drawToolbar.on('clear', function() {
                    console.log(self.getValue());
                    geojsonLayer.getSource().clear();
                });
                map.addControl(drawToolbar);
            }

            map.on('moveend', this._onMoveEnd);

//            var getfeatureinfoSource = new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
//                url: 'http://localhost:6543/mapproxy/service',
//                params: {
//                    'LAYERS': 'vioe_geoportaal:beschermde_landschappen,vioe_geoportaal:beschermde_dorps_en_stadsgezichten,vioe_geoportaal:beschermde_archeologische_zones,vioe_geoportaal:beschermde_monumenten',
//                    'TILED': true
//                },
//                crossOrigin: 'anonymous'
//            }));

//            map.on('click', function(evt) {
//                var viewResolution = /** @type {number} */ (view.getResolution());
//                var url = getfeatureinfoSource.getGetFeatureInfoUrl(
//                    evt.coordinate,
//                    viewResolution,
//                    'EPSG:3857',
//                    {'INFO_FORMAT': 'text/plain'}
//                );
//                if (url) {
//                    request(url ,{
//                        headers: {
//                            "X-Requested-With": null
//                        }
//                    }).then(
//                        function(text){
//                            alert(text);
//                        },
//                        function(error){
//                            console.log("An error occurred: " + error);
//                        }
//                    );
//                }
//            });
//
            this.perceelSource = new ol.source.ImageWMS(({
                url: 'http://localhost:6543/mapproxy/service',
                params: {
                    'LAYERS': 'agiv_grb_adp:featureinfo'
                },
                crossOrigin: 'anonymous'
            }));

            view.fitExtent(
                extentVlaanderen,
                /** @type {ol.Size} */ (map.getSize())
            );

            console.log("projection:");
            console.log(map.getView().getProjection());
        },

        getPerceel: function (coordinate) {
            var viewResolution = /** @type {number} */ (this.map.getView().getResolution());
            var url = this.perceelSource.getGetFeatureInfoUrl(
                coordinate,
                viewResolution,
                'EPSG:900913',
                {'INFO_FORMAT': 'application/vnd.ogc.gml'}
            );
            if (url) {
                request(url ,{
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(
                    function(response){
                        console.debug(response);
//                        var format = new ol.format.GML();
//                        var features = format.readFeatures(response);
                    },
                    function(error){
                        console.log("An error occurred: " + error);
                    }
                );
            }
        },

        getErfgoedFeatures: function () {
            var url = 'http://localhost:6544/afbakeningen';
            var data = {};
            data.categorie = "objecten";
            data.geometrie = this.getValue();
            var response = [];
            xhr.post(url, {
                data: JSON.stringify(data),
                headers: {
                    "X-Requested-With": "",
                    "Content-Type": "application/json"
                },
                sync: true
            }).then(function (data) {
                response = JSON.parse(data);
            }, function (err) {
                console.error(err);
            });
            return response;
        },

        highLightFeatures: function(oeObjects) {
            console.log("-highlight-");
            var formatter =  new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:31370'
            });
            var oeFeaturesSource = this.oeFeaturesLayer.getSource();
            array.forEach(oeObjects, function (oeObject) {
                console.log(oeObject.naam);
                var geometry = formatter.readGeometry(oeObject.geometrie);
                var feature = new ol.Feature({
                    geometry: geometry.transform('EPSG:31370', 'EPSG:900913')
                });
                oeFeaturesSource.addFeature(feature);
            });
            this.map.getView().fitExtent(
                oeFeaturesSource.getExtent(),
                /** @type {ol.Size} */ (this.map.getSize())
            );
        },

        _onMoveEnd: function (evt) {
            var map = evt.map;
            var mapview = map.getView();
            console.log("extent & center & resolution & zoom:");
            console.log(mapview.calculateExtent(map.getSize()));
            console.log(mapview.getCenter());
            console.log(mapview.getResolution());
            console.log(mapview.getZoom());
        },

        _createOsmLayer: function (title) {
            var extentVlaanderen = [261640.36309339158, 6541049.685576308, 705586.6233736952, 6723275.561008167];

            var osmSource = new ol.source.OSM({
                url: 'https://tile.geofabrik.de/dccc92ba3f2a5a2c17189755134e6b1d/{z}/{x}/{y}.png',
                maxZoom: 18
            });

            return new ol.layer.Tile({
                title: title,
                source: osmSource,
                type: 'base',
                visible: false,
                extent: extentVlaanderen
            });
        },

        _createGrbLayer: function(grbLayerId, title, isBaselayer){
            var proj= this.mapProjection;
            var extentVlaanderen = [261640.36309339158, 6541049.685576308, 705586.6233736952, 6723275.561008167];
            var grbResolutions = [
                156543.033928041,
                78271.5169640205,
                39135.7584820102,
                19567.8792410051,
                9783.93962050256,
                4891.96981025128,
                2445.98490512564,
                1222.99245256282,
                611.49622628141,
                305.748113140705,
                152.874056570353,
                76.4370282851763,
                38.2185141425881,
                19.1092570712941,
                9.55462853564703,
                4.77731426782352,
                2.38865713391176,
                1.19432856695588,
                0.59716428347794,
                0.29858214173897,
                0.149291070869485,
                0.0746455354347424];
            var grbMatrixIds = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];

            var grbTileGrid = new ol.tilegrid.WMTS({
                origin: ol.extent.getTopLeft(proj.getExtent()),
                resolutions: grbResolutions,
                matrixIds: grbMatrixIds
            });

            var grbProperties = {
                layer: grbLayerId,
                projection: proj,
                format: "image/png",
                matrixSet: 'GoogleMapsVL',
                url: "//grb.agiv.be/geodiensten/raadpleegdiensten/geocache/wmts",
                style: "default",
                version: "1.0.0",
                tileGrid: grbTileGrid
            };

            return  new ol.layer.Tile({
                title: title,
                visible: false,
                type: isBaselayer ? 'base' : 'overlay',
                source: new ol.source.WMTS(grbProperties),
                extent: extentVlaanderen
            });
        },

        _createGeojsonLayer: function(title, color) {
            var vectorSource = new ol.source.GeoJSON(
            /** @type {olx.source.GeoJSONOptions} */ ({
              object: {
                'type': 'FeatureCollection',
                'crs': {
                  'type': 'name',
                  'properties': {
                    'name': 'EPSG:900913'
                  }
                },
                'features': []
              }
            }));

            var createPolygonStyleFunction = function() {
              return function(feature, resolution) {
                var style = new ol.style.Style({
                  stroke: new ol.style.Stroke({
                    color: color,
                    width: 1
                  }),
                  fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 255, 0.1)'
                  })
                });
                return [style];
              };
            };

            return new ol.layer.Vector({
                title: title,
                source: vectorSource,
                style: createPolygonStyleFunction(),
                type: 'overlay',
                visible: true
            });
        },

        getValue: function () {
            var geojsonSource = this.geoJsonLayer.getSource();

            var coords = geojsonSource.getFeatures().map(function(feature) {
                var clone = feature.clone();
                clone.getGeometry().transform('EPSG:900913', 'EPSG:31370');
                return clone.getGeometry().getCoordinates();
            });
            var multiPolygon = new ol.geom.MultiPolygon(coords);

            var formatter =  new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:31370'
            });
            var geojson = formatter.writeGeometry(multiPolygon, {featureProjection: 'EPSG:31370'});
            //hack to add crs. todo: remove when https://github.com/openlayers/ol3/issues/2078 is fixed
            geojson.crs = {type: "name"};
            geojson.crs.properties =  {
                "name": "urn:ogc:def:crs:EPSG::31370"
            };
            return JSON.stringify(geojson);
        },

        setValue: function (geojson) {

            var formatter =  new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:31370'
            });
            var geometry = formatter.readGeometry(geojson);
            console.log(geometry);

            var feature = new ol.Feature({
                geometry: geometry.transform('EPSG:31370', 'EPSG:900913')
            });

            var geojsonSource = this.geoJsonLayer.getSource();
            geojsonSource.addFeature(feature);

            this.map.getView().fitExtent(
                geojsonSource.getExtent(),
                /** @type {ol.Size} */ (this.map.getSize())
            );
        }

    });
});