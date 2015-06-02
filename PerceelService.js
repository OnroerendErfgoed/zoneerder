define([
  'dojo/_base/declare',
  'mijit/_WidgetBase',
  'dojo/request/xhr',
  'ol'

], function (declare, WidgetBase, xhr, ol) {
  return declare([WidgetBase], {

    url: null,
    buffer: 0.00000000001,

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);
    },

    searchPerceel: function (coordinate) {
      var url = this.url;
      var bbox = [
        coordinate[0] - this.buffer,
        coordinate[1] - this.buffer,
        coordinate[0] + this.buffer,
        coordinate[1] + this.buffer
      ];
      //do call in Lambert72, there is a projection error when using web mercator (on the AGIV server?)
      var bboxLambert = ol.proj.transformExtent(bbox, 'EPSG:900913', 'EPSG:31370');

      var wfsCall = new ol.format.WFS().writeGetFeature({
        maxFeatures: 10,
        srsName: 'urn:x-ogc:def:crs:EPSG:31370',
        featureNS: 'http://www.openplans.org/topp',
        featurePrefix: 'grb',
        featureTypes: ['GRB_-_Adp_-_administratief_perceel'],
        geometryName: 'SHAPE',
        bbox: bboxLambert
      });

      return xhr.post(url, {
        data: (new XMLSerializer()).serializeToString(wfsCall),
        headers: {
          "X-Requested-With": "",
          "Content-Type": "application/xml"
        }
      });
    },

    readWfs: function (wfs) {
      var formatter = new ol.format.WFS({
        featureNS: "https://geo.agiv.be/ogc/wfs/grb",
        featureType: "GRB_-_Adp_-_administratief_perceel"
      });
      var features = formatter.readFeatures(wfs, {
        dataProjection: 'EPSG:31370',
        featureProjection: 'EPSG:900913'
      });
      return features[0];
    }
  });

});