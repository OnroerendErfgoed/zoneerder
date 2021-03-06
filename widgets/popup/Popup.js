define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/text!./Popup.html',
  'dojo/_base/lang',
  'ol'
], function (
  declare,
  WidgetBase,
  TemplatedMixin,
  template,
  lang,
  ol
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: template,
    map: null,
    layer: null,
    _enabled: true,
    _overlay: null,

    postCreate: function () {
      //console.debug('Popup::postCreate');
      this.inherited(arguments);
      this._overlay = this._createOverlay(this.popup);
      this.map.addOverlay(this._overlay);
      this._createClickHandler(this.map);
    },

    startup: function () {
      this.inherited(arguments);
      //console.debug('Popup::startup');
    },

    enable: function () {
      this._enabled = true;
    },

    disable: function () {
      this._enabled = false;
    },

    /**
     * Add a click handler to the map to render the popup.
     */
    _createClickHandler: function (map) {
      map.on('singleclick', lang.hitch( this, function (evt) {
        //console.debug('Popup::clickhandler');
        if (this._enabled) {
          var clickLayer = this.layer;
          var feature = map.forEachFeatureAtPixel(evt.pixel,
            function(feature, layer) {
              if (layer == clickLayer) {
                return feature;
              }
            });
          if (feature) {
            var html =
              "<h5>" + feature.get('naam') + "</h5>" +
              "<ul>" +
              "   <li>id:<em> " + feature.get('id') + "</em></li>" +
              "   <li>type:<em> " + feature.get('type') + "</em></li>" +
              "   <li><a href='" + feature.get('uri') + "' target='_blank'>detail pagina</a> <i class='fa fa-external-link'></i></li>" +
              "</ul>";
            this.setContent(html);
            this._overlay.setPosition(evt.coordinate);
          }
        }
      }));
    },

    /**
     * Create an overlay to anchor the popup to the map.
     * @return {ol.Overlay} the created overlay
     */
    _createOverlay: function (element) {
      //console.debug('Popup::_createOverlay');
      return new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
        element: element,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      }));
    },

    /**
     * Add a click handler to hide the popup.
     * @return {boolean} Don't follow the href.
     */
    _closePopup: function(evt) {
      //console.debug('Popup::_closePopup');
      evt.preventDefault();
      this._overlay.setPosition(undefined);
      this.popupcloser.blur();
      return false;
    },

    setContent: function (content) {
      //console.debug('Popup::_setContent');
      this.popupcontent.innerHTML = content;
    }

  });
});
