define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dojo/request/xhr",
    "dojo/when"

], function (declare, WidgetBase, xhr, when) {
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

        searchNiscodes: function (zone) {
            if (zone && zone.coordinates.length > 0) {
                var url = this.url;
                var data = {
									  type: 'gemeente',
                    geef_geometrie: 0,
                    geometrie: zone
                };
                return xhr.post(url, {
									  handleAs:"json",
                    data: JSON.stringify(data),
                    headers: {
                        "X-Requested-With": "",
											  "Accept": "application/json",
                        "Content-Type": "application/json"
                    }
                });
            }
            return when("[]");
        }
    });
});