define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/text!./OnZoneClickPopup.html',
  'ol'
], function (
  declare,
  WidgetBase,
  TemplatedMixin,
  template,
  ol
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: template,
    map: null,
    layer: null,
    enabled: false,
    _overlay: null,

    postCreate: function () {
      this.inherited(arguments);
      this._overlay = this._createOverlay(this.popup);
      this.map.addOverlay(this._overlay);
    },

    startup: function () {
      this.inherited(arguments);
    },

    enable: function () {
      this.enabled = true;
    },

    disable: function () {
      this.enabled = false;
    },

    /**
     * Add a click handler to the map to render the popup.
     */
    openPopup: function (location, html) {
      this.enable();
      this.setContent(html);
      this._overlay.setPosition(location);
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

     closePopup: function() {
      //console.debug('Popup::_closePopup');
      this.disable();
      this._overlay.setPosition(undefined);
    },

    setContent: function (content) {
      //console.debug('Popup::_setContent');
      this.popupcontent.innerHTML = content;
    }

  });
});
