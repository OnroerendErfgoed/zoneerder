define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    "dojo/query",
    "dojo/NodeList-dom"
], function (declare, WidgetBase, query) {
    return declare([WidgetBase], {

        map: null,

        mapButtons: null,

        fullExtent: null,

        postCreate: function () {
            this.inherited(arguments);
            //Set default values
            if (!this.mapButtons) this.mapButtons = {};
            if (this.mapButtons.fullScreen == undefined) this.mapButtons.fullScreen = false;
            if (this.mapButtons.zoomInOut == undefined) this.mapButtons.zoomInOut = true;
            if (!this.mapButtons.zoomFullExtent == undefined) this.mapButtons.zoomFullExtent = false;
            if (!this.mapButtons.zoomGeolocation == undefined) this.mapButtons.zoomGeolocation = false;
            if (!this.mapButtons.rotate == undefined) this.mapButtons.rotate = false;
        },

        startup: function () {
            this.inherited(arguments);
            if (this.mapButtons) {
                this._addZoomButtons(this.mapButtons);
            }
        },

        _addZoomButtons: function(zoomButtons) {
            var topPadding = 0.5;
            var buttonHeight = 2.2;

            if (zoomButtons.fullScreen) {
                console.log('FullScreen');
                this.map.addControl(new ol.control.FullScreen({
                    tipLabel: "Vergroot / verklein het scherm",
                    className: "full-screen"
                }));
                query(".full-screen").style({top: topPadding + "em"}).addClass("left-bar");
                topPadding += buttonHeight;

            }
            if (zoomButtons.zoomInOut) {
                console.log('zoomInOut');
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
                    console.log('zoomFullExtent');
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
                console.log('rotate');
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
