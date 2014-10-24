define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    './MapController'

], function (declare, WidgetBase, TemplatedMixin, MapController) {
    return declare([WidgetBase, TemplatedMixin], {
        templateString: '<div data-dojo-attach-point="mapNode" class="map"></div>',

        mapController: null,

        readOnly: true,

        postMixInProperties: function () {
            this.inherited(arguments);
        },

        buildRendering: function () {
            this.inherited(arguments);
        },

        postCreate: function () {
            this.inherited(arguments);
        },

        startup: function () {
            this.inherited(arguments);

            var mapController = new MapController({
                mapContainer: this.mapNode,
                readOnly: this.readOnly
            });
            this.mapController = mapController;
            mapController.startup();
        },

        getValue: function () {
            return this.mapController.getValue();
        }

    });
});
