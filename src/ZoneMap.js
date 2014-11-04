define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    './MapController',
    './ButtonController'

], function (declare, WidgetBase, TemplatedMixin, MapController, ButtonController) {
    return declare([WidgetBase, TemplatedMixin], {
        templateString: '<div data-dojo-attach-point="mapNode" class="map sidebar-map"></div>',

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
            if (!this.config.readOnly) this.config.readOnly = true;
            if (!this.config.buttons) this.config.buttons = {};
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
        },

        getValue: function () {
            return this.mapController.getValue();
        },

        setValue: function (val) {
            this.mapController.setValue(val);
        }

    });
});
