define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'mijit/_WidgetBase',
    "dojo/query",
    "ol",
    "dojo/NodeList-dom"
], function (declare, lang, WidgetBase, query, ol) {
    return declare([WidgetBase], {

        map: null,

        mapButtons: null,

        fullExtent: null,

        postCreate: function () {
            this.inherited(arguments);
            //Set default values
            if (!this.mapButtons) this.mapButtons = {};
            this._setDefaultParam(this.mapButtons, "fullScreen", false);
            this._setDefaultParam(this.mapButtons, "zoomInOut", true);
            this._setDefaultParam(this.mapButtons, "zoomFullExtent", false);
            this._setDefaultParam(this.mapButtons, "zoomGeolocation", false);
            this._setDefaultParam(this.mapButtons, "rotate", false);
        },

        startup: function () {
            this.inherited(arguments);
            if (this.mapButtons) {
                this._addZoomButtons(this.mapButtons);
            }
        },

        _setDefaultParam: function(object, field, defValue){
            if (!lang.exists(field, object)){
                lang.setObject(field, defValue, object);
            }
        },

        _addZoomButtons: function(zoomButtons) {
            var topPadding = 0.5;
            var buttonHeight = 2.2;

            if (zoomButtons.fullScreen) {
                this.map.addControl(new ol.control.FullScreen({
                    tipLabel: "Vergroot / verklein het scherm",
                    className: "full-screen"
                }));
                query(".full-screen").style({top: topPadding + "em"}).addClass("left-bar");
                topPadding += buttonHeight;

            }
            if (zoomButtons.zoomInOut) {
                this.map.addControl(new ol.control.Zoom({
                    zoomInTipLabel: "Zoom in",
                    zoomOutTipLabel: "Zoom uit",
                    className: "zoom"
                }));
                query(".zoom").style({top: topPadding + "em"}).addClass("left-bar");
                query(".zoom span[role=tooltip]").style({top: "1.1em"});
                topPadding += 3.8;
            }
            if (zoomButtons.zoomFullExtent) {
                if (this.fullExtent) {
                    this.map.addControl(new ol.control.ZoomToExtent({
                        extent: this.fullExtent,
                        tipLabel: 'Zoom naar Vlaanderen',
                        className: "fullextent"
                    }));
                    query(".fullextent").style({top: topPadding + "em"}).addClass("left-bar");
                    topPadding += buttonHeight;
                }
                else {
                    console.error("No Full Extent in ButtonController configuration");
                }
            }
            if (zoomButtons.zoomGeolocation) {
                // Geolocation Control
                var geolocation = new ol.Geolocation({
                    projection: this.map.getView().getProjection(),
                    trackingOptions: {
                        enableHighAccuracy: true
                    }
                });
                // handle geolocation error.
                geolocation.on('error', function(error) {
                    alert(error.message);
                });
                this.map.addControl(new ol.control.zoomtogeolocationcontrol({
                    tipLabel: 'Zoom naar je geolocatie',
                    zoomLevel: 18,
                    geolocation: geolocation
                }));
                query(".ol-zoom-geolocation").style({top: topPadding + "em"}).addClass("left-bar");
                topPadding += buttonHeight;
            }
            if (zoomButtons.rotate) {
                this.map.addControl(new ol.control.Rotate({
                    tipLabel: "Draai de kaart naar het noorden",
                    className: "rotate"
                }));
                query(".rotate").style({top: topPadding + "em"}).addClass("left-bar");
                //topPadding += buttonHeight;
            }
        }

    });
});
