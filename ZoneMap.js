define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'mijit/_WidgetBase',
  'mijit/_TemplatedMixin',
  './MapController',
  './ButtonController',
  './SidebarController',
  './ErfgoedService',
  './NiscodeService',
  './PerceelService',
  'dojo/Evented',
  'dojo/when',
  'dojo/NodeList-dom'

], function (
  declare,
  lang,
  array,
  WidgetBase,
  TemplatedMixin,
  MapController,
  ButtonController,
  SidebarController,
  ErfgoedService,
  NiscodeService,
  PerceelService,
  Evented,
  when
) {
  return declare([WidgetBase, TemplatedMixin, Evented], {

    templateString: '<div data-dojo-attach-point="mapNode" class="map sidebar-map">' +
                      '<div data-dojo-attach-point="sidebarNode"></div>' +
                      '<div data-dojo-attach-point="popupNode"></div>' +
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
    },

    startup: function () {
      this.inherited(arguments);

      var zonemap = this;

      var mapController = new MapController({
        mapContainer: this.mapNode,
        popupContainer: this.popupNode
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
        sidebar.on("zone.saved", function(evt){
          zonemap.zone = evt.zone;
          zonemap.emit("zonechanged", evt.zone);
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

    resetZone: function (val) {
      this.mapController.stopAllDrawActions();
      this.mapController.geoJsonLayer.getSource().clear();
      if (val) {
        this.setZone(val);
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
        var geojson = feature.geometrie;
        this.mapController.drawErfgoedGeom(geojson, feature.id);
      }, this);
    }

  });
});
