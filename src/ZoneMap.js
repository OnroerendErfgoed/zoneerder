define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'mijit/_WidgetBase',
    'mijit/_TemplatedMixin',
    './MapController',
    './ButtonController',
    './sidebar/Sidebar',
    './services/ErfgoedService',
    'dojo/query',
    'dojo-form-controls/Button',
    'dojo/dom-construct',
    "dojo/Evented",
    "crabpy_dojo/CrabpyWidget",
    'dojo/NodeList-dom'

], function (declare, lang, array, WidgetBase, TemplatedMixin,
             MapController, ButtonController, Sidebar, ErfgoedService, query, Button, domConstruct, Evented, CrabpyWidget) {
    return declare([WidgetBase, TemplatedMixin, Evented], {
        templateString: '<div data-dojo-attach-point="mapNode" class="map sidebar-map">' +
                            '<div data-dojo-attach-point="sidebarNode"></div>' +
                        '</div>',

        mapController: null,

        config: null,

        erfgoedService: null,

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
            this._setDefaultParam(this.config, "readOnly", true);
            this._setDefaultParam(this.config, "buttons", {});
            this._setDefaultParam(this.config.buttons, "buttons", {});
            this._setDefaultParam(this.config, "sidebar", false);

            this.erfgoedService = new ErfgoedService({
                url: 'http://localhost:6545/afbakeningen'  //todo: move to config & change to dev version
            })
        },

        _setDefaultParam: function(object, field, defValue){
            if (!lang.exists(field, object)){
                lang.setObject(field, defValue, object);
            }
        },

        startup: function () {
            this.inherited(arguments);

            var mapController = new MapController({
                mapContainer: this.mapNode,
                readOnly: this.config.readOnly
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
                this._createSidebar(this.sidebarNode);
            }
        },

        getZone: function () {
            return this.zone;
        },

        setZone: function (val) {
            this.zone = val;
            this.mapController.setZone(val);
            this.mapController.zoomToZone();
        },

        getFeaturesInZone: function () {
            var features = this.erfgoedService.searchErfgoedFeatures(this.mapController.getZone());
            this.mapController.drawErfgoedFeatures(features);

            //return light objects for list
            return array.map(features, function(feature){
                var returnObject = {};
                returnObject.id = feature.id;
                returnObject.naam = feature.naam;
                returnObject.uri = feature.uri;
                return returnObject;
            });
        },

        setFeatures: function(features) {
            array.forEach(features, lang.hitch(this, function (feature) {
                var geojson = feature.locatie.geometry;
               //hack to add crs. todo: remove when https://github.com/openlayers/ol3/issues/2078 is fixed
                geojson.crs = {type: "name"};
                geojson.crs.properties =  {
                    "name": "urn:ogc:def:crs:EPSG::4326"
                };
                this.mapController.drawErfgoedGeom(geojson, feature.id);
            }));
        },

        _createSidebar:function(node) {
           var sidebar = new Sidebar({}, node);
            query(".ol-attribution").addClass("sidebar-padding");

            sidebar.addTab('kaartlagen', 'Kaartlagen', 'layericon',
                'Hier kan je kiezen welke lagen er op de kaart moeten getoond worden en welke niet.');

            var layerSwitcher = new ol.control.LayerSwitcher({
                target: document.getElementById('kaartlagencontent')
            });
            this.mapController.olMap.addControl(layerSwitcher);

            sidebar.addTab('zoom', 'Zoom naar', 'zoomicon',
                'Hier kan je naar een perceel of adres zoomen (je moet minstens een gemeente kiezen).');

            var crabpyWidget = new CrabpyWidget({
                name: "location",
                baseUrl: "https://dev-geo.onroerenderfgoed.be" //todo: move to config
            });

            var crabNode = domConstruct.create("div");
            domConstruct.place(crabNode, "zoomcontent");
            var crabZoomer = crabpyWidget.createCrabZoomer(crabNode);
            var self = this;
            var zoomButton = new Button({
                label: "Zoom naar adres",
                class: "sidebar-button",
                onClick: function(){
                    var bbox = crabZoomer.getBbox();
                    if (bbox) {
                        var extent = ol.proj.transformExtent(bbox, 'EPSG:31370', 'EPSG:900913');
                        self.mapController.zoomToExtent(extent);
                        crabZoomer.reset();
                        sidebar.close();
                    }
                }
            });
            domConstruct.place(zoomButton.domNode, "zoomcontent");

            var capakeyNode = domConstruct.create("div");
            domConstruct.place(capakeyNode, "zoomcontent");
            var capakeyZoomer = crabpyWidget.createCapakeyZoomer(capakeyNode);
            var capakeyZoomButton = new Button({
                label: "Zoom naar perceel",
                class: "sidebar-button",
                onClick: function(){
                    var bbox = capakeyZoomer.getBbox();
                    if (bbox) {
                        var extent = ol.proj.transformExtent(bbox, 'EPSG:31370', 'EPSG:900913');
                        self.mapController.zoomToExtent(extent);
                        capakeyZoomer.reset();
                        sidebar.close();
                    }
                }
            });
            domConstruct.place(capakeyZoomButton.domNode, "zoomcontent");

            if (!this.config.readOnly) {
                sidebar.addTab('zone', 'Bepaal zone', 'zoneicon', 'Baken een zone af voor het beheersplan. ' +
                    'Je kan één of meerdere polygonen intekenen en/of percelen selecteren.');

                var drawTitle = domConstruct.create("h3",{innerHTML: "Polygoon tekenen:"});
                domConstruct.place(drawTitle, "zonecontent");

                var toolbarNode = domConstruct.create("div");
                domConstruct.place(toolbarNode, "zonecontent");

                var drawToolbar = new ol.control.DrawToolbar({
                    mapController: self.mapController,
                    target: toolbarNode
                });
                drawToolbar.on('save', function (evt) {
                    evt.features.forEach(function (feature) {
                        self.mapController.geoJsonLayer.getSource().addFeature(feature);
                    });
                });
                drawToolbar.on('clear', function () {
                    self.mapController.geoJsonLayer.getSource().clear();
                });
                self.mapController.olMap.addControl(drawToolbar);

                var parcelTitle = domConstruct.create("h3",{innerHTML: "Perceel selecteren:"});
                domConstruct.place(parcelTitle, "zonecontent");

                var parcelButton = new Button({
                    label: "Selecteer perceel",
                    class: "sidebar-button",
                    onClick: lang.hitch(this, function(){
                        var controller = this.mapController;
                        var map = controller.olMap;
                        var eventKey = map.on('click', function(evt) {
                            map.unByKey(eventKey);
                            var perceel = controller.getPerceel(evt.coordinate);
                            controller.drawPerceel(perceel);
                        });
                    })
                });
                domConstruct.place(parcelButton.domNode, "zonecontent");

                var buttonNode = domConstruct.create("div", {class: "button-bar"});
                domConstruct.place(buttonNode, "zonecontent");
                var saveButton = new Button({
                    label: "Zone bewaren",
                    class: "sidebar-button",
                    onClick: lang.hitch(this, function(){
                        var zone = this.mapController.getZone();
                        if (zone) {
                            this.zone = zone;
                            this.emit("zonechanged", zone);
                        }
                        else {
                            alert("Er is nog geen zone beschikbaar om op te slaan.");
                        }
                    })
                });
                domConstruct.place(saveButton.domNode, buttonNode);

                var deleteButton = new Button({
                    label: "Zone verwijderen",
                    class: "sidebar-button",
                    onClick: lang.hitch(this, function(){
                        this.mapController.geoJsonLayer.getSource().clear();
                        this.zone = null;
                        this.emit("zonechanged", null);
                    })
                });
                domConstruct.place(deleteButton.domNode, buttonNode);
            }

            sidebar.addTab('help', 'Help', 'helpicon', 'help desc');
            sidebar.startup();
        }

    });
});
