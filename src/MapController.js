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

        olMap: null,

        mapProjection: null,

        geoJsonLayer: null,

        readOnly: null,

        fullExtent: null,

        erfgoedFeatures: null,

        postMixInProperties: function () {
            this.inherited(arguments);
        },

        buildRendering: function () {
            this.inherited(arguments);
        },

        postCreate: function () {
            this.inherited(arguments);

            proj4.defs('EPSG:31370', "+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.869,52.2978,-103.724,0.33657,-0.456955,1.84218,-1.2747 +units=m +no_defs");

            var pDef = ol.proj.get('EPSG:3857');
            var pMerc = ol.proj.get('EPSG:900913');
            var pWgs84 = ol.proj.get('EPSG:4326');
            var pLam = ol.proj.get('EPSG:31370');
            this.mapProjection = pMerc;

            var extentVlaanderen = [261640.36309339158, 6541049.685576308, 705586.6233736952, 6723275.561008167];
            var centerVlaanderen = [483613.49323354336, 6632162.6232922375];
            this.fullExtent = extentVlaanderen;

            this.geoJsonFormatter =  new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:31370'
            });

            var view = new ol.View({
                projection: this.mapProjection,
                maxZoom: 21,
                minZoom: 8
            });

            var olMap = new ol.Map({
                target: this.mapContainer,
                view: view,
                controls: ol.control.defaults({
                    attribution: false,
                    rotate: false,
                    zoom: false
                }),
                logo: false
            });
            this.olMap = olMap;

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
                    },
                    attributions: [new ol.Attribution({
                        html: '© <a href="https://www.onroerenderfgoed.be">Onroerend Erfgoed</a>'
                    })]
                })),
                type: 'overlay',
                visible: false
            });

            var geoJsonLayer = this._createGeojsonLayer('Selectielaag', 'blue');
            this.geoJsonLayer = geoJsonLayer;
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
            olMap.addLayer(baseLayers);

            var layers = new ol.layer.Group({
                title: 'layers',
                layers: [
                    grbTransTileLayer,
                    grb_gbgTileLayer,
                    grb_adpTileLayer,
                    beschermdWmsLayer,
                    geoJsonLayer,
                    oeFeaturesLayer
                ]
            });
            olMap.addLayer(layers);

            orthoTileLayer.setVisible(true);

            olMap.addControl(new ol.control.ScaleLine());
            olMap.addControl(new ol.control.Attribution({
                collapsible: false
            }));
            olMap.addControl(new ol.control.LayerSwitcher());

            olMap.on('moveend', this._onMoveEnd);

            view.fitExtent(
                extentVlaanderen,
                /** @type {ol.Size} */ (olMap.getSize())
            );

            console.log("projection:");
            console.log(olMap.getView().getProjection());
        },

        startup: function () {
            this.inherited(arguments);
        },

        getPerceel: function (coordinate) {
            var url = "http://localhost:6543/ogcproxy?url=https://geo.agiv.be/ogc/wfs/grb";
            var data = '' +
                '<wfs:GetFeature xmlns:topp="http://www.openplans.org/topp" ' +
                'xmlns:wfs="http://www.opengis.net/wfs" ' +
                'xmlns:ogc="http://www.opengis.net/ogc" ' +
                'xmlns:gml="http://www.opengis.net/gml" ' +
                'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                'service="WFS" ' +
                'version="1.1.0"  ' +
                'maxFeatures="10" ' +
                'xsi:schemaLocation="http://www.opengis.net/wfs ' +
                'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">' +
                '<wfs:Query typeName="grb:GRB_-_Adp_-_administratief_perceel">' +
                '<ogc:Filter>' +
                '<ogc:Contains>' +
                '<ogc:PropertyName>SHAPE</ogc:PropertyName>' +
                '<gml:Point srsName="urn:x-ogc:def:crs:EPSG:3857">' +
                '<gml:pos srsName="urn:x-ogc:def:crs:EPSG:3857">' + coordinate[0] + ' ' + coordinate[1] + '</gml:pos>' +
                '</gml:Point>' +
                '</ogc:Contains>' +
                '</ogc:Filter>' +
                '  </wfs:Query>' +
                '</wfs:GetFeature>';

            var mock_response = "<wfs:FeatureCollection xsi:schemaLocation='https://geo.agiv.be/ogc/wfs/grb http://geo.agiv.be/Arcgis/services/grbwfs/MapServer/WFSServer?request=Descr…eFeatureType%26version=1.1.0%26typename=GRB_-_Adp_-_administratief_perceel http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd' xmlns:grb='https://geo.agiv.be/ogc/wfs/grb' xmlns:gml='http://www.opengis.net/gml' xmlns:wfs='http://www.opengis.net/wfs' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'><gml:boundedBy><gml:Envelope srsName='urn:ogc:def:crs:EPSG:6.9:31370'><gml:lowerCorner>22282.325400002301 153053.63879999891</gml:lowerCorner><gml:upperCorner>258866.46169999987 244026.45450000092</gml:upperCorner></gml:Envelope></gml:boundedBy><gml:featureMember><grb:GRB_-_Adp_-_administratief_perceel gml:id='F-1__344666'><grb:UIDN>364232</grb:UIDN><grb:OIDN>344666</grb:OIDN><grb:CAPAKEY>42016B0160/00B000</grb:CAPAKEY><grb:NISCODE>42006</grb:NISCODE><grb:TOESTDATUM>2013-01-01T00:00:00</grb:TOESTDATUM><grb:LENGTE>360.67000000000002</grb:LENGTE><grb:OPPERVL>3147.5100000000002</grb:OPPERVL><grb:SHAPE><gml:MultiSurface><gml:surfaceMember><gml:Polygon><gml:exterior><gml:LinearRing><gml:posList> 127952.15869999677 189344.60020000115 127949.53769999743 189349.15799999982 127802.93169999868 189288.80090000108 127805.05900000036 189282.25189999864 127808.7248999998 189270.96330000088 127959.84579999745 189331.23189999908 127952.15869999677 189344.60020000115</gml:posList></gml:LinearRing></gml:exterior></gml:Polygon></gml:surfaceMember></gml:MultiSurface></grb:SHAPE></grb:GRB_-_Adp_-_administratief_perceel></gml:featureMember></wfs:FeatureCollection> ";

            var feature = null;
            xhr.post(url, {
                data: data,
                headers: {
                    "X-Requested-With": "",
                    "Content-Type": "application/xml"
                },
                sync: true
            }).then(function (response) {
                    console.log(response);
                var format = new ol.format.WFS({
                    featureNS: "https://geo.agiv.be/ogc/wfs/grb",
                    featureType: "GRB_-_Adp_-_administratief_perceel"
                });
                var features = format.readFeatures(response);
                console.log(features);
                feature = features[0];

            }, function (err) {
                console.error(err);
            });

            return feature;
        },

        drawErfgoedFeatures: function(oeObjects) {
            var oeFeaturesSource = this.oeFeaturesLayer.getSource();
            oeFeaturesSource.clear();
            var formatter = this.geoJsonFormatter;

            array.forEach(oeObjects, function (oeObject) {
                var geometry = formatter.readGeometry(oeObject.geometrie);
                var feature = new ol.Feature({
                    geometry: geometry.transform('EPSG:31370', 'EPSG:900913')
                });
                oeFeaturesSource.addFeature(feature);
            });

            this.olMap.getView().fitExtent(
                oeFeaturesSource.getExtent(),
                /** @type {ol.Size} */ (this.olMap.getSize())
            );
        },

        highLightPerceel: function(olFeature) {
            console.log("-highlight perceel-");
            var perceelSource = this.geoJsonLayer.getSource();
            olFeature.getGeometry().transform('EPSG:31370', 'EPSG:900913');
            perceelSource.addFeature(olFeature);

            this.olMap.getView().fitExtent(
                perceelSource.getExtent(),
                /** @type {ol.Size} */ (this.olMap.getSize())
            );
        },

        _onMoveEnd: function (evt) {
            var olMap = evt.map;
            var mapview = olMap.getView();
            console.log("extent & center & resolution & zoom:");
            console.log(mapview.calculateExtent(olMap.getSize()));
            console.log(mapview.getCenter());
            console.log(mapview.getResolution());
            console.log(mapview.getZoom());
        },

        _createOsmLayer: function (title) {
            var osmSource = new ol.source.OSM({
                url: 'https://tile.geofabrik.de/dccc92ba3f2a5a2c17189755134e6b1d/{z}/{x}/{y}.png',
                maxZoom: 18,
                attributions: [
                    new ol.Attribution({
                        html: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    })
                ]
            });

            return new ol.layer.Tile({
                title: title,
                source: osmSource,
                type: 'base',
                visible: false
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
                tileGrid: grbTileGrid,
                attributions: [
                    new ol.Attribution({
                      html: '© <a href="http://www.agiv.be" title="AGIV" class="copyrightLink copyAgiv">AGIV</a>'
                    })
                ]

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

        getZone: function () {
            var geojsonSource = this.geoJsonLayer.getSource();

            var coords = geojsonSource.getFeatures().map(function(feature) {
                var clone = feature.clone();
                clone.getGeometry().transform('EPSG:900913', 'EPSG:31370');
                return clone.getGeometry().getCoordinates();
            });
            var multiPolygon = new ol.geom.MultiPolygon(coords);

            var geojson = this.geoJsonFormatter.writeGeometry(multiPolygon, {featureProjection: 'EPSG:31370'});
            //hack to add crs. todo: remove when https://github.com/openlayers/ol3/issues/2078 is fixed
            geojson.crs = {type: "name"};
            geojson.crs.properties =  {
                "name": "urn:ogc:def:crs:EPSG::31370"
            };
            return geojson;
        },

        setZone: function (geojson) {
            var geometry = this.geoJsonFormatter.readGeometry(geojson);
            console.log(geometry);

            var feature = new ol.Feature({
                geometry: geometry.transform('EPSG:31370', 'EPSG:900913')
            });

            var geojsonSource = this.geoJsonLayer.getSource();
            geojsonSource.addFeature(feature);

            this.olMap.getView().fitExtent(
                geojsonSource.getExtent(),
                /** @type {ol.Size} */ (this.olMap.getSize())
            );
        },

        getFeatures: function () {
            return this.erfgoedFeatures;
        }

    });
});