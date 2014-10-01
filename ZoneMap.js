define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',

], function (declare, WidgetBase, TemplatedMixin) {
    return declare([WidgetBase, TemplatedMixin], {
        templateString: '<div data-dojo-attach-point="mapNode" id="map"></div>',
        map: null,

        postMixInProperties: function () {
            this.inherited(arguments);
        },

        buildRendering: function () {
            this.inherited(arguments);
        },

        postCreate: function () {
            this.inherited(arguments);

            var projection = ol.proj.get('EPSG:900913');

            var osm = new ol.layer.Tile({
                source: new ol.source.OSM()
            });

            var grb_source = new ol.source.TileWMS({
                url: 'http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB-basiskaart/wms',
                params: {
                    LAYERS: 'GRB_BASISKAART',
                    VERSION: '1.3.0'
                }
            });
            var grb_wms = new ol.layer.Tile({
                source: grb_source
            });
            var drawsource = new ol.source.Vector();
            var drawvector = new ol.layer.Vector({
              source: drawsource,
              style: new ol.style.Style({
                fill: new ol.style.Fill({
                  color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                  color: '#ffcc33',
                  width: 2
                }),
                image: new ol.style.Circle({
                  radius: 7,
                  fill: new ol.style.Fill({
                    color: '#ffcc33'
                  })
                })
              })
            });

            var orthoklm = new ol.layer.Tile({
                source: new ol.source.TileWMS({
//                    url: 'http://ogc.beta.agiv.be/ogc/wms/omkl',
                    url: 'http://ogc.beta.agiv.be/ogc/wms/orthoklm',
                    params: {
                        LAYERS: '0',
                        VERSION: '1.3.0'
                    }
                })
            });

            var layers = [
                grb_wms, drawvector
            ];

            var scaleline = new ol.control.ScaleLine();

            var draw = new ol.interaction.Draw({
                source: drawsource,
                type: 'Polygon'
            });

            var map = new ol.Map({
                layers: layers,
                controls: ol.control.defaults().extend([scaleline]),
                interactions: ol.interaction.defaults().extend([draw]),
                target: this.mapNode,
                view: new ol.View({
//                    center: [120765.84, 179946.10],
                    center: ol.proj.transform([120765.84, 179946.10], 'EPSG:31370', 'EPSG:900913'),
                    zoom: 10,
                    projection: projection
                })
            });
        },

        startup: function () {
            this.inherited(arguments);
        },

        getValue: function () {
            return '{' +
                '"type": "MultiPolygon",' +
                '"coordinates": [[[[152184.01399999947, 212331.8648750011], [152185.94512499947, 212318.6137500011],' +
                '                  [152186.13837499946, 212318.6326250011], [152186.86699999947, 212313.9570000011],' +
                '                  [152186.91462499945, 212313.65187500112], [152192.45099999948, 212314.2943750011],' +
                '                  [152190.69212499948, 212319.2656250011], [152199.58799999946, 212319.5248750011],' +
                '                  [152197.85312499947, 212327.9388750011], [152197.57199999946, 212327.8978750011],' +
                '                  [152197.08099999945, 212333.2668750011], [152184.01399999947, 212331.8648750011]]]],' +
                '"crs": {' +
                '    "type": "name",' +
                '    "properties": {' +
                '        "name": "urn:ogc:def:crs:EPSG::31370"' +
                '        # "name": "EPSG:31370"' +
                '    }' +
                '}' +
            '}'
        }

    });
});
