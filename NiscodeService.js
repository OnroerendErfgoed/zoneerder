define([
    "dojo/_base/declare",
    "mijit/_WidgetBase",
    "dojo/request/xhr",
    "dojo/when",
		"dojo/Deferred"

], function (declare, WidgetBase, xhr, when, Deferred) {
    return declare([WidgetBase], {

        url: null,
        mockNiscodes: [{id:"44021"},{id:"40000"}],

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
                    geometrie: zone
                };
                //return xhr.post(url, {
                //    data: data,
                //    headers: {
                //        "X-Requested-With": "",
                //        "Content-Type": "application/json"
                //    }
                //});
							  // mocken
								var deferred = new Deferred();
							  deferred.resolve(this.mockNiscodes);
                return deferred.promise
            }
            //return when("[]");
					  //  mocken
					  else {
							var deferred = new Deferred();
							deferred.resolve([]);
							return deferred.promise;
						}
        }
    });
});