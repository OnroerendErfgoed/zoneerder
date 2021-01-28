define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dojo/request/xhr',
  'ol'

], function (declare, WidgetBase, xhr, ol) {
  return declare([WidgetBase], {

    beschermingWfsUrl: null,

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);
    },

    searchBeschermingenGet: function (coordinate, srsname) {
      //console.debug('searchBeschermingenGet', coordinate, srsname);

      var featureTypes = [
        'vioe_geoportaal:bes_landschap',
        'vioe_geoportaal:bes_sd_gezicht',
        'vioe_geoportaal:bes_arch_site',
        'vioe_geoportaal:bes_monument',
        'vioe_geoportaal:erfgoedls'
      ];

      var getUrl = this.beschermingWfsUrl + "?service=wfs&version=1.1.0&request=GetFeature";
      getUrl += "&srsname=" + srsname;
      getUrl += "&bbox=" + this._createBbox(coordinate).join(',');
      getUrl += "&typename=" + featureTypes.join(',');

      return xhr.get(getUrl, {
        headers: {
          "X-Requested-With": ""
        }
      });
    },

    readWfs: function (wfs) {
      try {
        return new ol.format.WFS({
          featureNS: "http://www.erfgoed.net/geoportaal",
          featureType: [
            'bes_landschap',
            'bes_sd_gezicht',
            'bes_arch_site',
            'bes_monument',
            'erfgoedls'
          ]
        }).readFeatures(wfs, {});
      } catch (e) {
        console.error(e);
        return [];
      }
    },

    _createBbox: function (coordinate) {
      var buffer = 0.5;
      return [
        coordinate[0] - buffer,
        coordinate[1] - buffer,
        coordinate[0] + buffer,
        coordinate[1] + buffer
      ];
    }
  });
});
