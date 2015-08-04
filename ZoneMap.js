define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  './MapController',
  './ButtonController',
  './services/ErfgoedService',
  './services/NiscodeService',
  './services/PerceelService',
  './services/BeschermingService',
  './widgets/sidebar/Sidebar',
  './widgets/layerswitcher/LayerSwitcher',
  './widgets/zonegrid/ZoneGrid',
  './widgets/zoneeditor/ZoneEditor',
  'crabpy_dojo/CrabpyWidget',
  'dojo/when',
  'dojo/query',
  'dojo/dom-construct',
  'dojo-form-controls/Button',
  'dojo/NodeList-dom'

], function (
  declare,
  lang,
  array,
  WidgetBase,
  TemplatedMixin,
  MapController,
  ButtonController,
  ErfgoedService,
  NiscodeService,
  PerceelService,
  BeschermingService,
  Sidebar,
  LayerSwitcher,
  ZoneGrid,
  ZoneEditor,
  CrabpyWidget,
  when,
  query,
  domConstruct,
  Button
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: '<div data-dojo-attach-point="mapNode" class="map sidebar-map">' +
                      '<div data-dojo-attach-point="sidebarNode"></div>' +
                      '<div data-dojo-attach-point="popupNode"></div>' +
                    '</div>',
    mapController: null,
    buttonController: null,
    config: null,
    erfgoedService: null,
    perceelService: null,
    beschermingService: null,
    _startZone: null,
    _sidebar: null,

    postCreate: function () {
      //console.debug('ZoneMap::postCreate');
      this.inherited(arguments);
      if (!this.config) {
        this.config = {
          erfgoedUrl: null,
          niscodeUrl: null,
          perceelUrl: null,
          buttons: null,
          sidebar: null
        };
      }

      if (this.config.erfgoedUrl) {
        this.erfgoedService = new ErfgoedService({ url: this.config.erfgoedUrl });
      }

      if (this.config.niscodeUrl) {
        this.niscodeService = new NiscodeService({ url: this.config.niscodeUrl });
      }

      if (this.config.perceelUrl) {
        this.perceelService = new PerceelService({ url: this.config.perceelUrl });
      }
      
      if (this.config.beschermingUrl) {
        this.beschermingService = new BeschermingService({ url: this.config.beschermingUrl });
      }
    

      this.mapController = new MapController({
        mapContainer: this.mapNode,
        popupContainer: this.popupNode,
        perceelService: this.perceelService
      });

      this.buttonController = new ButtonController({
        map: this.mapController.olMap,
        fullExtent: this.mapController.fullExtent,
        mapButtons: this.config.buttons
      });
    },

    startup: function () {
      //console.debug('ZoneMap::startup');
      this.inherited(arguments);

      this.mapController.startup();
      this.mapController.on("zonechanged", lang.hitch(this, function(evt) {
        this.emit("zonechanged", {zone: evt.zone});
      }));

      this.buttonController.startup();

      if (this.config.sidebar) {
        this._setDefaultParam(this.config.sidebar, "layers", false);
        this._setDefaultParam(this.config.sidebar, "zoom", true);
        this._setDefaultParam(this.config.sidebar, "draw", false);
        this._setDefaultParam(this.config.sidebar, "help", true);
        this._sidebar = this._createSidebar(this.sidebarNode);
        this._sidebar.startup();
      }
    },

    resize: function() {
      this.mapController.resize();
    },

    getZone: function () {
      return this.mapController.getZone();
    },

    setZone: function (val) {
      this._startZone = val;
      this.mapController.setZone(val);
      this.mapController.zoomToZone();
    },

    resetZone: function () {
      this.mapController.stopAllEditActions();
      this.mapController.clearFeatures();
      this.mapController.clearZone();
      this._sidebar.reset();

      if (this._startZone) {
        this.mapController.setZone(this._startZone);
        this.mapController.zoomToZone();
      }
    },

    getFeaturesInZone: function () {
      if (this.erfgoedService) {
        var promise = this.erfgoedService.searchErfgoedFeatures(this.mapController.getZone());
        return promise.then(function (data) {
          return data;
        });
      }
      else {
        return  when(console.error("No search service available for erfgoed features. Please add 'erfgoedUrl' to config"));
      }
    },

    getNiscodesInZone: function () {
      if (this.niscodeService) {
        var promise = this.niscodeService.searchNiscodes(this.mapController.getZone());
        return promise.then(function (data) {
          return data;
        });
      }
      else {
        return  when(console.error("No search service available for niscodes. Please add 'niscodeUrl' to config"));
      }
    },

    setFeatures: function(features) {
      this.mapController.clearFeatures();
      array.forEach(features, function (feature) {
        this.mapController.addErfgoedFeature(feature);
      }, this);
    },

    _setDefaultParam: function (object, field, defValue) {
      if (!lang.exists(field, object)) {
        lang.setObject(field, defValue, object);
      }
    },

    _createSidebar: function (node) {
      var sidebar = new Sidebar({}, node);
      query(".ol-attribution").addClass("sidebar-padding");

      if (this.config.sidebar.layers) {
        var layerTab = sidebar.createTab('Kaartlagen', 'fa-list',
          'Hier kan je kiezen welke lagen er op de kaart moeten getoond worden en welke niet.');

        var layerNode = domConstruct.create("div");
        layerTab.addContent(layerNode);

        var layerSwitcher = new LayerSwitcher ({
          map: this.mapController.olMap,
          div: layerNode
        });
        layerTab.registerWidget(layerSwitcher);
      }

      if (this.config.sidebar.zoom) {
        var ZoomTab = sidebar.createTab('Zoom naar', 'fa-search',
          'Hier kan je naar een perceel of adres zoomen (je moet minstens een gemeente kiezen).');

        console.log(this.crabpyUrl);
        console.log(this.config.crabpyUrl);
        var crabpyWidget = new CrabpyWidget({
          name: "location",
          baseUrl: this.config.crabpyUrl
        });

        var crabNode = domConstruct.create("div");
        ZoomTab.addContent(crabNode);
        var crabZoomer = crabpyWidget.createCrabZoomer(crabNode);
        var self = this;
        var zoomButton = new Button({
          label: "Zoom naar adres",
          'class': "button tiny expand",
          onClick: function () {
            var bbox = crabZoomer.getBbox();
            if (bbox) {
              var extent = self.mapController.transformExtent(bbox,  'EPSG:31370', 'EPSG:900913');
              self.mapController.zoomToExtent(extent);
              crabZoomer.reset();
              sidebar.collapse();
            }
          }
        });
        ZoomTab.addContent(zoomButton.domNode);

        var capakeyNode = domConstruct.create("div");
        ZoomTab.addContent(capakeyNode);
        var capakeyZoomer = crabpyWidget.createCapakeyZoomer(capakeyNode);
        var capakeyZoomButton = new Button({
          label: "Zoom naar perceel",
          'class': "button tiny expand",
          onClick: function () {
            var bbox = capakeyZoomer.getBbox();
            if (bbox) {
              var extent = self.mapController.transformExtent(bbox,  'EPSG:31370', 'EPSG:900913');
              self.mapController.zoomToExtent(extent);
              capakeyZoomer.reset();
              sidebar.collapse();
            }
          }
        });
        ZoomTab.addContent(capakeyZoomButton.domNode);
      }

      if (this.config.sidebar.draw) {
        var drawTab = sidebar.createTab('Bepaal zone', 'fa-connectdevelop', 'Bepaal hier de zone.');

        /* ZONE */
        var zonePane = domConstruct.create('div');
        drawTab.addContent(zonePane);
        var zoneGrid = new ZoneGrid({
          polygonStore: this.mapController.polygonStore,
          mapController: this.mapController
        }, zonePane);
        drawTab.registerWidget(zoneGrid);

        /* TOEVOEGEN */
        var zoneEditPane = domConstruct.create('div');
        drawTab.addContent(zoneEditPane);
        var zoneEditor = new ZoneEditor({
          mapController: this.mapController,
          perceelService: this.perceelService
        }, zoneEditPane);
        drawTab.registerWidget(zoneEditor);
      }

      if (this.config.sidebar.help) {
        sidebar.createTab('Help', 'fa-question-circle', 'I need somebody');
      }

      return sidebar;
    }

  });
});
