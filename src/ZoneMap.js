define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'mijit/_WidgetBase',
    'mijit/_TemplatedMixin',
    './MapController',
    './ButtonController',
    './SidebarController',
    './services/ErfgoedService',
    './services/PerceelService',
    'dojo/query',
    'dojo/Evented',
    'dojo/NodeList-dom'

], function (declare, lang, array, WidgetBase, TemplatedMixin, MapController, ButtonController, SidebarController,
             ErfgoedService, PerceelService, query, Evented) {
    return declare([WidgetBase, TemplatedMixin, Evented], {
        templateString: '<div data-dojo-attach-point="mapNode" class="map sidebar-map">' +
                            '<div data-dojo-attach-point="sidebarNode"></div>' +
                        '</div>',

        mapController: null,

        config: null,

        erfgoedService: null,

        perceelService: null,

        zone: null,

        postMixInProperties: function () {
            this.inherited(arguments);
        },

        buildRendering: function () {
            this.inherited(arguments);
        },

        postCreate: function () {
            this.inherited(arguments);
            //Set default config
            if (!this.config) this.config = {};
            this._setDefaultParam(this.config, "buttons", {});
            this._setDefaultParam(this.config.buttons, "buttons", {});
//            this._setDefaultParam(this.config, "sidebar", {});

            this.erfgoedService = new ErfgoedService({
                url: 'http://localhost:6545/afbakeningen'  //todo: move to config & change to dev version
            });
            this.perceelService = new PerceelService({
                url: 'http://localhost:6543/ogcproxy?url=https://geo.agiv.be/ogc/wfs/grb'  //todo: move to config & change to dev version
//                url: 'https://dev-geo.onroerenderfgoed.be/ogcproxy?url=https://geo.agiv.be/ogc/wfs/grb'
            });
        },

        _setDefaultParam: function(object, field, defValue){
            if (!lang.exists(field, object)){
                lang.setObject(field, defValue, object);
            }
        },

        startup: function () {
            this.inherited(arguments);

            var zonemap = this;

            var mapController = new MapController({
                mapContainer: this.mapNode
            });
            this.mapController = mapController;
            mapController.startup();

            var buttonController = new ButtonController({
                map: mapController.olMap,
                fullExtent: mapController.fullExtent,
                mapButtons: this.config.buttons
            });
            buttonController.startup();

            if (this.config.sidebar) {
                var sidebarController = new SidebarController({
                    mapController: mapController,
                    perceelService: this.perceelService,
                    tabs: this.config.sidebar
                });
                var sidebar = sidebarController.createSidebar(this.sidebarNode);
                sidebar.startup();
                sidebar.on("zone.saved", function(zone){
                    zonemap.emit("zonechanged", zone);
                });
                sidebar.on("zone.deleted", function(){
                    zonemap.emit("zonechanged", null);
                });
            }
        },

        resize: function() {
            this.mapController.olMap.updateSize();
        },

        getZone: function () {
            return this.zone;
        },

        setZone: function (val) {
            this.mapController.setZone(val);
            this.zone = this.mapController.getZone();
            this.mapController.zoomToZone();
        },

        getFeaturesInZone: function () {
            var promise = this.erfgoedService.searchErfgoedFeatures(this.mapController.getZone());
            return promise.then(function (data) {
                var features = JSON.parse(data);
                return array.map(features, function(feature){
                    return {
                        id: feature.id,
                        naam: feature.naam,
                        uri: feature.uri
                    };
                });
            });
        },

        setFeatures: function(features) {
            this.mapController.clearFeatures();
            array.forEach(features, lang.hitch(this, function (feature) {
                var geojson = feature.locatie.geometry;
                //hack to set correct casing for geometry types (camelcase)
                //TODO: remove when fixed in inventaris, ex:
                // https://inventaris.onroerenderfgoed.be/dibe/relict/4877
                var upperType = feature.locatie.geometry.type.toUpperCase();
                if (upperType == 'MULTIPOINT') {
                    feature.locatie.geometry.type = 'MultiPoint';
                }
                else if (upperType == 'MULTIPOLYGON') {
                    feature.locatie.geometry.type = 'MultiPolygon';
                }

                //hack to add crs. todo: remove when https://github.com/openlayers/ol3/issues/2078 is fixed
                geojson.crs = {type: "name"};
                geojson.crs.properties =  {
                    "name": "urn:ogc:def:crs:EPSG::4326"
                };
                this.mapController.drawErfgoedGeom(geojson, feature.id);
            }));
        }

    });
});
