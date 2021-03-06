define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
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
          categorie: "aanduidingsobjecten",
          geometrie: zone,
          'geef_geometrie': 0
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