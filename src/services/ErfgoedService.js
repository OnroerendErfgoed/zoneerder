define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dojo/request/xhr",
    "dojo/_base/array",
    "dojo/json"

], function (declare, WidgetBase, xhr, array, JSON) {
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
            var response = [];
            if (zone && zone.coordinates.length > 0) {
                var url = this.url;
                var data = {
                    categorie: "objecten",
                    geometrie: JSON.stringify(zone)
                };
                xhr.post(url, {
                    data: JSON.stringify(data),
                    headers: {
                        "X-Requested-With": "",
                        "Content-Type": "application/json"
                    },
                    sync: true
                }).then(function (data) {
                    response = JSON.parse(data);
                }, function (err) {
                    console.error(err);
                });
            }
            return response;
        }
    });
});