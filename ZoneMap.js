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
  './widgets/zoekenadres/ZoekenAdres',
  'crabpy_dojo/CrabpyWidget',
  'dojo/when',
  'dojo/query',
  'dojo/dom-construct',
  './widgets/popup/OnZoneClickPopup',
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
  ZoekenAdres,
  CrabpyWidget,
  when,
  query,
  domConstruct,
  OnZoneClickPopup
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: '<div data-dojo-attach-point="mapNode" class="map sidebar-map">' +
    '<div data-dojo-attach-point="adresNode"></div>' +
    '<div data-dojo-attach-point="sidebarNode"></div>' +
    '<div data-dojo-attach-point="popupNode"></div>' +
    '</div>',
    mapController: null,
    doubleClickPopup: null,
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
          crabpyUrl: null,
          beschermingUrl: null,
          beschermingWfsUrl: null,
          ogcproxyUrl: null,
          buttons: null,
          sidebar: null,
          tools: null
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

      if (this.config.beschermingWfsUrl && this.config.ogcproxyUrl) {
        this.beschermingService = new BeschermingService({
          beschermingWfsUrl: this.config.beschermingWfsUrl,
          ogcproxyUrl: this.config.ogcproxyUrl
        });
      }


      this.mapController = new MapController({
        mapContainer: this.mapNode,
        popupContainer: this.popupNode,
        perceelService: this.perceelService,
        beschermingService: this.beschermingService,
        beschermingUrl: this.config.beschermingUrl,
        historicLayers: this.config.historicLayers || false,
        defaultBaseLayer: this.config.defaultBaseLayer || 'grb_bsk' // default
      });

      this.buttonController = new ButtonController({
        map: this.mapController.olMap,
        fullExtent: this.mapController.getFullExtent(),
        mapButtons: this.config.buttons
      });
    },

    startup: function () {
      //console.debug('ZoneMap::startup');
      this.inherited(arguments);

      this.mapController.startup();
      this.mapController.on("zonechanged", lang.hitch(this, function(evt) {
        this.emit("zonechanged", {zone: evt.zone, oppervlakte: evt.oppervlakte});
      }));

      this.buttonController.startup();

      if (!this.config.tools) {
        this.config.tools = {};
      }
      this._setDefaultParam(this.config.tools, "selectBescherming", true);
      this._setDefaultParam(this.config.tools, "selectPerceel", true);
      this._setDefaultParam(this.config.tools, "drawPolygon", true);
      this._setDefaultParam(this.config.tools, "drawWKT", true);

      if (this.config.sidebar) {
        this._setDefaultParam(this.config.sidebar, "layers", false);
        this._setDefaultParam(this.config.sidebar, "zoom", true);
        this._setDefaultParam(this.config.sidebar, "draw", false);
        this._setDefaultParam(this.config.sidebar, "help", true);
        this._sidebar = this._createSidebar(this.sidebarNode);
        this._sidebar.startup();
      }

      if (this.config.zoekenadres) {
        this._adresZoeken = new ZoekenAdres({
          zoneMap: this,
          baseUrl: this.config.crabpyUrl
        }, this.adresNode);
        this._adresZoeken.startup();
      }

      if(this.config.onZoneClickPopup){
        this.OnZoneClickPopup = new OnZoneClickPopup({
          map: this.mapController.olMap,
          layer: this.mapController.oeFeaturesLayer
        }, this.popupNode);
      }
    },

    resize: function() {
      this.mapController.resize();
    },

    initOnZoneClickPopup: function(location, html){
      var map = this.mapController.olMap;
      map.on("click", lang.hitch(this, function(e) {
        map.forEachFeatureAtPixel(e.pixel, lang.hitch(this, function (feature) {
          if(this.OnZoneClickPopup.enabled){
            this.OnZoneClickPopup.closePopup();
          } else {
            this.OnZoneClickPopup.openPopup(this.mapController.getCenterOfExtent(feature.getGeometry().getExtent()), html);
          }
        }));
      }));
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

    transformGeometryToLambert: function(geometry){
      return this.mapController.transformGeometryToLambert(geometry);
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

        var crabpyWidget = new CrabpyWidget({
          name: "location",
          baseUrl: this.config.crabpyUrl
        });

        var crabNode = domConstruct.create("div");
        ZoomTab.addContent(crabNode);
        var crabZoomer = crabpyWidget.createCrabZoomer(crabNode);
        var self = this;

        var zoomButton = domConstruct.create("a", {
          href: "#",
          title: "Zoom naar adres",
          'class': "button tiny expand",
          innerHTML: "Zoom naar adres",
          onclick: function (evt) {
            evt.preventDefault();
            var bbox = crabZoomer.getBbox();
            if (bbox) {
              self.mapController.zoomToExtent(bbox);
              if (self.mapController.olMap.getView().getZoom() > 15) {
                self.mapController.olMap.getView().setZoom(15);
              }
              crabZoomer.reset();
              sidebar.collapse();
            }
          }
        });
        ZoomTab.addContent(zoomButton);

        var capakeyNode = domConstruct.create("div");
        ZoomTab.addContent(capakeyNode);
        var capakeyZoomer = crabpyWidget.createCapakeyZoomer(capakeyNode);
        var capakeyZoomButton = domConstruct.create("a", {
          href: "#",
          title: "Zoom naar perceel",
          'class': "button tiny expand",
          innerHTML: "Zoom naar perceel",
          onclick: function (evt) {
            evt.preventDefault();
            var bbox = capakeyZoomer.getBbox();
            if (bbox) {
              self.mapController.zoomToExtent(bbox);
              capakeyZoomer.reset();
              sidebar.collapse();
            }
          }
        });
        ZoomTab.addContent(capakeyZoomButton);
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
          perceelService: this.perceelService,
          tools: this.config.tools
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
