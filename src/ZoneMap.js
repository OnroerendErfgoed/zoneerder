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
    'dojo/Evented',
    'dojo/when',
    'dojo/NodeList-dom'

], function (declare, lang, array, WidgetBase, TemplatedMixin, MapController, ButtonController, SidebarController,
             ErfgoedService, PerceelService, Evented, when) {
    return declare([WidgetBase, TemplatedMixin, Evented], {
        templateString: '<div data-dojo-attach-point="mapNode" class="map sidebar-map">' +
                            '<div data-dojo-attach-point="sidebarNode"></div>' +
                        '</div>',

        mapController: null,

        config: null,

        erfgoedService: null,

        perceelService: null,

        zone: null,

        postCreate: function () {
            this.inherited(arguments);
            if (!this.config) {
                this.config = {
                    erfgoedUrl: null,
                    perceelUrl: null,
                    buttons: null,
                    sidebar: null
                };
            }

            if (this.config.erfgoedUrl) {
                this.erfgoedService = new ErfgoedService({ url: this.config.erfgoedUrl });
            }

            if (this.config.perceelUrl) {
                this.perceelService = new PerceelService({ url: this.config.perceelUrl });
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
                    tabs: this.config.sidebar,
                    crabpyUrl: this.config.crabpyUrl
                });
                var sidebar = sidebarController.createSidebar(this.sidebarNode);
                sidebar.startup();
                sidebar.on("zone.saved", function(zone){
                    zonemap.zone = zone;
                    zonemap.emit("zonechanged", zone);
                });
                sidebar.on("zone.deleted", function(){
                    zonemap.zone = null;
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
            if (this.erfgoedService) {
                var promise = this.erfgoedService.searchErfgoedFeatures(this.mapController.getZone());
                return promise.then(function (data) {
                    var features = JSON.parse(data);
                    return array.map(features, function (feature) {
                        return {
                            id: feature.id,
                            naam: feature.naam,
                            uri: feature.uri
                        };
                    });
                });
            }
            else {
                return  when(console.error("No search service available for erfgoed features. Please add 'erfgoedUrl' to config"));
            }
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
