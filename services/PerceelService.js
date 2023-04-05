define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dojo/request/xhr',
  'ol'

], function (declare, WidgetBase, xhr, ol) {
  return declare([WidgetBase], {

    url: null,

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);
    },

    searchPerceel: function (coordinate) {

      var data = '' +
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
        '<wfs:Query typeName="GRB:ADP">' +
        '<ogc:Filter>' +
        '<ogc:Contains>' +
        '<ogc:PropertyName>SHAPE</ogc:PropertyName>' +
        '<gml:Point srsName="urn:x-ogc:def:crs:EPSG:31370">' +
        '<gml:pos srsName="urn:x-ogc:def:crs:EPSG:31370">' + coordinate[0] + ' ' + coordinate[1] + '</gml:pos>' +
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
      var formatter = new ol.format.WFS({
        featureNS: "https://geo.api.vlaanderen.be/GRB",
        featureType: "ADP"
      });
      var features = formatter.readFeatures(wfs, {});
      return features[0];
    }
  });

});