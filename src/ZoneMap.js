define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    './MapController',
    './ButtonController',
    './Sidebar',
    'dojo/query',
    'dojo/NodeList-dom'

], function (declare, lang, WidgetBase, TemplatedMixin, MapController, ButtonController, Sidebar, query) {
    return declare([WidgetBase, TemplatedMixin], {
        templateString: '<div class="zonemap">' +
                            '<div data-dojo-attach-point="mapNode" class="map sidebar-map"></div>' +
                            '<div data-dojo-attach-point="sidebarNode"></div>' +
                        '</div>',

        mapController: null,

        config: null,

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
                map: mapController.get('map'),
                fullExtent: mapController.fullExtent,
                mapButtons: this.config.buttons
            });
            buttonController.startup();

            if (this.config.sidebar) {
                var sidebar = new Sidebar({}, this.sidebarNode);
                query(".ol-attribution").addClass("sidebar-padding");
                sidebar.startup();
            }
        },

        getValue: function () {
            return this.mapController.getValue();
        },

        setValue: function (val) {
            this.mapController.setValue(val);
        }

    });
});
