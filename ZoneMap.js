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
    buttonController: null,
    config: null,
    erfgoedService: null,
    perceelService: null,
    _startZone: null,

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

      if (this.config.sidebar) {
        this.sidebarController = new SidebarController({
          mapController: this.mapController,
          tabs: this.config.sidebar,
          crabpyUrl: this.config.crabpyUrl
        });
      }
    },

    startup: function () {
      //console.debug('ZoneMap::startup');
      this.inherited(arguments);
      this.mapController.startup();
      this.buttonController.startup();
      if (this.sidebarController) {
        var sidebar = this.sidebarController.createSidebar(this.sidebarNode);
        sidebar.on("zone.saved", lang.hitch(this, function(evt) {
          this.zone = evt.zone;
          this.emit("zonechanged", evt.zone);
        }));
        sidebar.on("zone.deleted", lang.hitch( this, function(evt) {
          this.zone = null;
          this.emit("zonechanged", null);
        }));
        sidebar.startup();
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
      this.mapController.setZone(this._startZone);
      this.mapController.zoomToZone();
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
    }

  });
});
