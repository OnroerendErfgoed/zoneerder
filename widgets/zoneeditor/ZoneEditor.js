define([
  'dijit/_TemplatedMixin',
  'dijit/_WidgetBase',
  'dojo/_base/declare',
  'dojo/text!./ZoneEditor.html',
  'dojo/dom-construct',
  'dojo/_base/lang'
], function (
  TemplatedMixin,
  WidgetBase,
  declare,
  template,
  domConstruct,
  lang
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: template,
    baseClass: 'zone-editor',

    postCreate: function () {
      this.inherited(arguments);
      console.debug('ZoneEditor::postCreate');

    },

    startup: function () {
      this.inherited(arguments);
      console.debug('ZoneEditor::startup');

    },

    _draw: function (evt) {
      evt.preventDefault();
      console.debug('ZoneEditor::_draw');
      this.mapController.startDraw();
    },

    _selectPerceel: function (evt) {
      evt.preventDefault();
      console.debug('ZoneEditor::_selectParcel');
      this.mapController.startParcelSelect(this.perceelService);
    },

    _selectBescherming: function (evt) {
      evt.preventDefault();
      console.debug('ZoneEditor::_selectBescherming TODO');
    },

    _drawWkt: function (evt) {
      evt.preventDefault();
      console.debug('ZoneEditor::_drawWkt');
      this.mapController.startInputWKT(this.wktInput.value);
      this.wktInput.value = '';
    }

  });
});
