define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "dojo/dom-style"

], function (declare, WidgetBase, TemplatedMixin, domStyle) {
    return declare([WidgetBase, TemplatedMixin], {
        templateString: '<div data-dojo-attach-point="mapNode" id="map"></div>',
        mapwidth: "300px",
        mapheight: "100px",
        map: null,


        postMixInProperties: function () {
            this.inherited(arguments);
            console.log(this.mapwidth);
            console.log(this.mapheight);
        },

        buildRendering: function () {
            this.inherited(arguments);
            domStyle.set(this.mapNode, "width", this.mapwidth);
            domStyle.set(this.mapNode, "height", this.mapheight);
            domStyle.set(this.mapNode, "border", "1px solid pink");
        },

        postCreate: function () {
            this.inherited(arguments);
            var map = new ol.Map({
                target: this.mapNode,
                layers: [
                    new ol.layer.Group({
                        'title': 'Base maps',
                        layers: [
                            new ol.layer.Tile({
                                title: 'OSM',
                                type: 'base',
                                visible: false,
                                source: new ol.source.OSM()
                            }),
                            new ol.layer.Tile({
                                title: 'Satellite',
                                type: 'base',
                                source: new ol.source.MapQuest({layer: 'sat'})
                            })
                        ]
                    }),
                    new ol.layer.Group({
                        title: 'Overlays',
                        layers: [
                            new ol.layer.Tile({
                                title: 'Countries',
                                source: new ol.source.TileWMS({
                                    url: 'http://demo.opengeo.org/geoserver/wms',
                                    params: {'LAYERS': 'ne:ne_10m_admin_1_states_provinces_lines_shp'},
                                    serverType: 'geoserver'
                                })
                            })
                        ]
                    })
                ],
                view: new ol.View({
                    center: ol.proj.transform([-0.92, 52.96], 'EPSG:4326', 'EPSG:3857'),
                    zoom: 6
                })
            });
        },

        startup: function () {
            this.inherited(arguments);
        }
    });
});
