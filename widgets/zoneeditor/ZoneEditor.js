define([
  'dijit/_TemplatedMixin',
  'dijit/_WidgetBase',
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/text!./ZoneEditor.html',
  'dojo/dom-construct',
  'dojo/_base/lang'
], function (
  TemplatedMixin,
  WidgetBase,
  declare,
  array,
  template,
  domConstruct,
  lang
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: template,
    baseClass: 'zone-editor',
    mapController: null,

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
      var wkt = this._filterWktFromString(this.wktInput.value.toUpperCase());

      if (wkt) {
        this.mapController.drawWKTzone(wkt);
      }
      else {
        alert('Het is niet mogelijk om een wkt string uit de opgegeven tekst te halen.');
      }

      this.wktInput.value = '';
    },

    _filterWktFromString: function (stringWithWkt) {
      var supportedGeometries = ["MULTIPOLYGON", "POLYGON"];
      var wkt = null;
      var wktFound;

      //first check: clean wkt string
      wktFound = array.some(supportedGeometries, function (geometryType) {
        if (stringWithWkt.lastIndexOf(geometryType, 0) === 0) {
          wkt = stringWithWkt;
          return true;
        }
      });
      if (wktFound) {
        return wkt;
      }

      //second check: see if input is tab delimited (QGIS)
      var mySplitStringArray = stringWithWkt.split(/\s{2,}|\t|\n/); //split on 2 or more spaces OR tab OR newline
      wktFound = array.some(mySplitStringArray, lang.hitch(this, function (part) {
        return array.some(supportedGeometries, function (geometryType) {
          if (part.lastIndexOf(geometryType, 0) === 0) {
            wkt = part;
            return true;
          }
        })
      }));
      if (wktFound) {
        return wkt;
      }

      //last check: find geometry type in the string and iterate over characters after it, counting the bracket pairs
      wktFound = array.some(supportedGeometries, function (geometryType) {
        var geometryTypeIdx = stringWithWkt.indexOf(geometryType);
        if (geometryTypeIdx > -1) {
          var split = stringWithWkt.split(geometryType);
          if (split[1]) {
            var polygonStart = split[1].trim();
            var bracketPairs = 0;
            wkt = geometryType;
            for (var x = 0; x < polygonStart.length; x++) {
              var c = polygonStart.charAt(x);
              if (c == '(') {
                bracketPairs++;
              } else if (c == ')') {
                bracketPairs--;
              }
              wkt += c;
              if (bracketPairs === 0) {
                return true;
              }
            }
          }
        }
      });
      if (wktFound) {
        return wkt;
      }

      return null;
    }

  });
});
