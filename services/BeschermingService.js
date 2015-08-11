define([
  'dojo/_base/declare',
  'mijit/_WidgetBase',
  'dojo/request/xhr'

], function (declare, WidgetBase, xhr) {
  return declare([WidgetBase], {

    url: null,

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);
    },

    searchErfgoed: function (layer, resolution, coordinate) {
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

    readFeatures: function (coordinate) {

      var data =
        '<wfs:GetFeature xmlns:topp="http://www.openplans.org/topp" ' +
        'xmlns:wfs="http://www.opengis.net/wfs" ' +
        'xmlns:ogc="http://www.opengis.net/ogc" ' +
        'xmlns:gml="http://www.opengis.net/gml" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'service="WFS" ' +
        'version="1.1.0"  ' +
        'maxFeatures="10" ' +
        'xsi:schemaLocation="http://www.opengis.net/wfs ' +
        'http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">' +
        '<wfs:Query typeName="vioe_geoportaal:beschermde_monumenten, vioe_geoportaal:beschermde_dorps_en_stadsgezichten,' +
        'vioe:beschermde_archeologische_sites, vioe:beschermde_dorps_en_stadsgezichten, vioe:beschermde_landschappen, vioe_geoportaal:beschermde_archeologische_zones,' +
        'vioe_geoportaal:beschermde_landschappen">' +
        '<ogc:Filter>' +
        '<ogc:Contains>' +
        '<ogc:PropertyName>SHAPE</ogc:PropertyName>' +
        '<gml:Point srsName="urn:x-ogc:def:crs:EPSG:3857">' +
        '<gml:pos srsName="urn:x-ogc:def:crs:EPSG:3857">' + coordinate[0] + ' ' + coordinate[1] + '</gml:pos>' +
        '</gml:Point>' +
        '</ogc:Contains>' +
        '</ogc:Filter>' +
        '  </wfs:Query>' +
        '</wfs:GetFeature>';

      return xhr.post(this.url, {
        data: data,
        headers: {
          "X-Requested-With": "",
          "Content-Type": "application/xml"
        }
      });
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
          ]
        });
        var features = formatter.readFeatures(wfs, {
          dataProjection: 'EPSG:31370',
          featureProjection: 'EPSG:900913'
        });
        return features[0];
      } catch (e) {
        console.error(e);
        return [];
      }
    }
  });
});