define([
    "dojo/_base/declare",
    "mijit/_WidgetBase",
    "dojo/request/xhr",
    "dojo/_base/array",
    "dojo/json",
    "dojo/when"

], function (declare, WidgetBase, xhr, array, JSON, when) {
    return declare([WidgetBase], {

        url: null,

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
        },

        searchErfgoedFeatures: function (zone) {
            if (zone && zone.coordinates.length > 0) {
                var url = this.url;
                var data = {
                    categorie: "objecten",
                    geometrie: JSON.stringify(zone)
                };
                return xhr.post(url, {
                    data: JSON.stringify(data),
                    headers: {
                        "X-Requested-With": "",
                        "Content-Type": "application/json"
                    }
                });
            }
            return when("[]");
        }
    });
});