define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'mijit/_WidgetBase',
    'dojo/Evented',
    "dojo/query",
    './sidebar/Sidebar',
    './layerswitcher/LayerSwitcher',
    'crabpy_dojo/CrabpyWidget',
    'dojo/dom-construct',
    'dojo-form-controls/Button',
    'dojo/NodeList-dom'
], function (declare, lang, WidgetBase, Evented, query, Sidebar, LayerSwitcher, CrabpyWidget, domConstruct, Button) {
    return declare([WidgetBase, Evented], {

        mapController: null,

        perceelService: null,

        tabs: null,

        postCreate: function () {
            this.inherited(arguments);
            //Set default values
            this._setDefaultParam(this.tabs, "layers", false);
            this._setDefaultParam(this.tabs, "zoom", true);
            this._setDefaultParam(this.tabs, "draw", false);
            this._setDefaultParam(this.tabs, "help", true);
        },

        startup: function () {
            this.inherited(arguments);
        },

        _setDefaultParam: function (object, field, defValue) {
            if (!lang.exists(field, object)) {
                lang.setObject(field, defValue, object);
            }
        },

        createSidebar: function (node) {
            var sidebar = new Sidebar({}, node);
            query(".ol-attribution").addClass("sidebar-padding");

            if (this.tabs.layers) {
                sidebar.addTab('kaartlagen', 'Kaartlagen', 'layericon',
                    'Hier kan je kiezen welke lagen er op de kaart moeten getoond worden en welke niet.');

                var layerNode = domConstruct.create("div");
                domConstruct.place(layerNode, "kaartlagencontent");

                var layerSwitcher = new LayerSwitcher ({
                    map: this.mapController.olMap,
                    div: layerNode
                });
                layerSwitcher.startup();
            }

            if (this.tabs.zoom) {
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
                    onClick: function () {
                        var bbox = crabZoomer.getBbox();
                        if (bbox) {
                            var extent = self.mapController.transformExtent(bbox,  'EPSG:31370', 'EPSG:900913');
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
                    onClick: function () {
                        var bbox = capakeyZoomer.getBbox();
                        if (bbox) {
                            var extent = self.mapController.transformExtent(bbox,  'EPSG:31370', 'EPSG:900913');
                            self.mapController.zoomToExtent(extent);
                            capakeyZoomer.reset();
                            sidebar.close();
                        }
                    }
                });
                domConstruct.place(capakeyZoomButton.domNode, "zoomcontent");
            }

            if (this.tabs.draw) {
                sidebar.addTab('zone', 'Bepaal zone', 'zoneicon', 'Baken een zone af voor het beheersplan. ' +
                    'Je kan één of meerdere polygonen intekenen en/of percelen selecteren.');

                var drawTitle = domConstruct.create("h3", {innerHTML: "Polygoon tekenen:"});
                domConstruct.place(drawTitle, "zonecontent");

                var toolbarNode = domConstruct.create("div");
                domConstruct.place(toolbarNode, "zonecontent");

//                this.drawInteraction_ = new ol.interaction.Draw({
//                    features: this.geoJsonLayer.getFeatures(),
//                    type: /** @type {ol.geom.GeometryType} */ ('Polygon')
//                });
//                var drawButton = new Button({
//                    label: "Teken polygoon",
//                    class: "sidebar-button",
//                    onClick: lang.hitch(this, function () {
//                        var controller = this.mapController;
//                        var map = controller.olMap;
//                        map.addInteraction(this.drawInteraction_);
//                    })
//                });
//                domConstruct.place(parcelButton.domNode, "zonecontent");

//                var drawToolbar = new ol.control.DrawToolbar({
//                    mapController: self.mapController,
//                    target: toolbarNode
//                });
//                drawToolbar.on('save', function (evt) {
//                    evt.features.forEach(function (feature) {
//                        self.mapController.geoJsonLayer.getSource().addFeature(feature);
//                    });
//                });
//                drawToolbar.on('clear', function () {
//                    self.mapController.geoJsonLayer.getSource().clear();
//                });
//                self.mapController.olMap.addControl(drawToolbar);

                var parcelTitle = domConstruct.create("h3", {innerHTML: "Perceel selecteren:"});
                domConstruct.place(parcelTitle, "zonecontent");

                if (this.perceelService){
                    var parcelButton = new Button({
                        label: "Selecteer perceel",
                        class: "sidebar-button",
                        onClick: lang.hitch(this, function () {
                            var controller = this.mapController;
                            var perceelService = this.perceelService;
                            var map = controller.olMap;
                            var eventKey = map.on('click', function (evt) {
                                map.unByKey(eventKey);
                                perceelService.searchPerceel(evt.coordinate).then(function (wfsresponse) {
                                    var perceel = perceelService.readWfs(wfsresponse);
                                    controller.drawPerceel(perceel);
                                }, function (err) {
                                    console.error(err);
                                })
                            });
                        })
                    });
                    domConstruct.place(parcelButton.domNode, "zonecontent");
                }
                else {
                    console.warn("No parcel service available, please add 'perceelUrl' to config.");
                }

                var buttonNode = domConstruct.create("div", {class: "button-bar"});
                domConstruct.place(buttonNode, "zonecontent");
                var saveButton = new Button({
                    label: "Zone bewaren",
                    class: "sidebar-button",
                    onClick: lang.hitch(this, function () {
                        var zone = this.mapController.getZone();
                        if (zone) {
                            this.zone = zone;
                            sidebar.emit("zone.saved", zone);
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
                    onClick: lang.hitch(this, function () {
                        this.mapController.geoJsonLayer.getSource().clear();
                        this.zone = null;
                        sidebar.emit("zone.deleted");
                    })
                });
                domConstruct.place(deleteButton.domNode, buttonNode);
            }

            if (this.tabs.help) {
                sidebar.addTab('help', 'Help', 'helpicon', 'help desc');
            }

            return sidebar;
        }
    });
});
