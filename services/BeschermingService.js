define([
  'dojo/_base/declare',
  'mijit/_WidgetBase',
  'dojo/request/xhr',
  'ol'

], function (declare, WidgetBase, xhr, ol) {
  return declare([WidgetBase], {

    beschermingWfsUrl: null,
    ogcproxyUrl: null,

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);
    },

    searchBeschermingenGet: function (coordinate, srsname) {
      //console.debug('searchBeschermingenGet', coordinate, srsname);

      var featureTypes = [
        'vioe_geoportaal:beschermde_landschappen',
        'vioe_geoportaal:beschermde_dorps_en_stadsgezichten',
        'vioe_geoportaal:beschermde_archeologische_zones',
        'vioe_geoportaal:beschermde_monumenten'
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

    searchBeschermingenPost: function (coordinate, srsname) {
      //console.debug('searchBeschermingenPost', coordinate, srsname);

      var featureTypes = [
        'beschermde_landschappen',
        'beschermde_dorps_en_stadsgezichten',
        'beschermde_archeologische_zones',
        'beschermde_monumenten'
      ];

      var getFeature = new ol.format.WFS().writeGetFeature({
        featureTypes: featureTypes,
        featureNS: 'http://www.erfgoed.net/geoportaal',
        featurePrefix: 'vioe_geoportaal',
        srsName: srsname,
        bbox: this._createBbox(coordinate),
        geometryName: 'geom'
      });

      var postUrl = this.ogcproxyUrl + this.beschermingWfsUrl;

      return xhr.post(postUrl, {
        data: new XMLSerializer().serializeToString(getFeature),
        headers: {
          "X-Requested-With": "",
          "Content-Type": "application/xml"
        }
      });
    },

    readWfs: function (wfs) {
      try {
        return new ol.format.WFS({
          featureNS: "http://www.erfgoed.net/geoportaal",
          featureType: [
            'beschermde_landschappen',
            'beschermde_dorps_en_stadsgezichten',
            'beschermde_archeologische_zones',
            'beschermde_monumenten'
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