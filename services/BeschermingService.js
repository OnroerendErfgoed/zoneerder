define([
  'dojo/_base/declare',
  'mijit/_WidgetBase',
  'dojo/request/xhr'

], function (declare, WidgetBase, xhr) {
  return declare([WidgetBase], {

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);
    },

    searchBeschermingen: function (layer, resolution, coordinate) {
      var requestUrl = layer.getSource().getGetFeatureInfoUrl(
        coordinate,
        resolution,
        'EPSG:3857',
        {
          'info_format': 'application/vnd.ogc.gml',
          'feature_count': '10'
        }
      );

      return xhr.get(requestUrl, {
        handleAs: 'xml',
        headers: {
          "X-Requested-With": ""
        }
      })
    },

    readWfs: function (wfs) {
      try {
        var formatter = new ol.format.WFS({
          featureNS: "http://www.erfgoed.net/geoportaal",
          featureType: [
            'beschermde_landschappen',
            'beschermde_dorps_en_stadsgezichten',
            'beschermde_archeologische_zones',
            'beschermde_monumenten'
          ],
          gmlFormat: new ol.format.GML2()
        });
        return formatter.readFeatures(wfs, {
          dataProjection: 'EPSG:31370',
          featureProjection: 'EPSG:900913'
        });
      } catch (e) {
        console.error(e);
        return [];
      }
    }
  });
});