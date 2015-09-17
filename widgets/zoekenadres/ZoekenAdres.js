define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/query",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/form/FilteringSelect",
    "dojo/store/JsonRest",
    "dojo/text!./ZoekenAdres.html",
    'ol',
    "dojo/fx/easing",
    "dojo/_base/fx"
  ],
  function (
    declare,
    lang,
    query,
    WidgetBase,
    TemplatedMixin,
    WidgetsInTemplateMixin,
    FilteringSelect,
    JsonRest,
    template,
    ol,
    easing,
    fx
  ) {
    return declare(
      [WidgetBase, TemplatedMixin, WidgetsInTemplateMixin],
      {
        templateString: template,
        zoneMap: null,
        baseUrl: null,

        startup: function () {
          this.inherited(arguments);

          this.store = new JsonRest({
            target: this.baseUrl + '/geolocation/'
          });

          var zoekenAdres = new FilteringSelect({
            'store': this.store,
            'name': 'zoekenAdres',
            'placeholder': 'Zoom naar adres ..',
            'searchAttr': 'locatie',
            'labelAttr': 'id',
            'hasDownArrow': false,
            required: false,
            'class': 'zoekenAdres',
            'onChange': lang.hitch(this, function (val) {
              this.store.get(val).then(lang.hitch(this, function (data) {
                var lowerleft = new ol.geom.Point([data.boundingbox.lowerleft.lon, data.boundingbox.lowerleft.lat]);
                lowerleft.transform('EPSG:4326', 'EPSG:31370');
                var upperright = new ol.geom.Point([data.boundingbox.upperright.lon, data.boundingbox.upperright.lat]);
                upperright.transform('EPSG:4326', 'EPSG:31370');
                var extent = [lowerleft.getCoordinates()[0], lowerleft.getCoordinates()[1],
                  upperright.getCoordinates()[0], upperright.getCoordinates()[1]];
                this.zoneMap.mapController.zoomToExtent(extent);
                if (this.zoneMap.mapController.olMap.getView().getZoom() > 15) {
                  this.zoneMap.mapController.olMap.getView().setZoom(15);
                }
              }));

            }),
            'onFocus': lang.hitch(this, function(val) {
              fx.animateProperty({
                node: query(".zoekenAdres")[0],
                properties: {
                  width: 400
                },
                easing: easing.quadInOut
              }).play();
            }),
            'onBlur': lang.hitch(this, function(val) {
              fx.animateProperty({
                node: query(".zoekenAdres")[0],
                properties: {
                  width: 200
                },
                easing: easing.quadInOut
              }).play()
            })
          }, this.zoekenAdresNode);
          zoekenAdres.startup();
        }
      });
  });
