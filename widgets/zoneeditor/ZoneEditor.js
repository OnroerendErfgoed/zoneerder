define([
  'dijit/_TemplatedMixin',
  'dijit/_WidgetBase',
  'dojo/text!./ZoneEditor.html',
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/dom-construct',
  'dojo/query',
  'dojo/NodeList-manipulate'
], function (
  TemplatedMixin,
  WidgetBase,
  template,
  declare,
  array,
  lang,
  domConstruct,
  query
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: template,
    baseClass: 'zone-editor',
    mapController: null,
    _activeTool: null,

    postCreate: function () {
      this.inherited(arguments);
      console.debug('ZoneEditor::postCreate');

    },

    startup: function () {
      this.inherited(arguments);
      console.debug('ZoneEditor::startup');
    },

    reset: function () {
      this._resetTools();
    },

    _draw: function (evt) {
      evt.preventDefault();
      console.debug('ZoneEditor::_draw');
      this._setActiveTool('draw');
    },

    _selectPerceel: function (evt) {
      evt.preventDefault();
      console.debug('ZoneEditor::_selectParcel');
      this._setActiveTool('selectPerceel');
    },

    _selectBescherming: function (evt) {
      evt.preventDefault();
      this._setActiveTool('selectBescherming');
    },

    _drawWkt: function (evt) {
      evt.preventDefault();
      console.debug('ZoneEditor::_drawWkt');
      var wkt = this._filterWktFromString(this.wktInput.value.toUpperCase());

      this._setActiveTool('drawWkt');
      if (wkt) {
        this.mapController.drawWKTzone(wkt);
      }
      else {
        alert('Het is niet mogelijk om een wkt string uit de opgegeven tekst te halen.');
      }
      this._resetTools();
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
    },

    _setActiveTool: function (toolname) {
      var toolIsActive = (this._activeTool == toolname);
      console.debug('ZoneEditor::_setActiveTool', toolname, toolIsActive);
      this._resetTools();
      this._activeTool = toolname;

      if (!toolIsActive) {
        var tool = this[toolname + "Tool"];
        var iList = query('i', tool);
        var spanList = query('span', tool);

        switch (toolname) {
          case 'draw':
            iList.removeClass('fa-pencil');
            spanList.innerHTML('Annuleer tekenen');
            this.mapController.startDraw(lang.hitch(this, this._resetTools));
            break;
          case 'selectPerceel':
            iList.removeClass('fa-hand-o-up');
            spanList.innerHTML('Annuleer perceel selecteren');
            this.mapController.startParcelSelect(lang.hitch(this, this._resetTools));
            break;
          case 'selectBescherming':
            iList.removeClass('fa-hand-o-up');
            spanList.innerHTML('Annuleer bescherming selecteren');
            this.mapController.startBeschermingSelect(lang.hitch(this, this._resetTools));
            break;
          case 'drawWkt':
            break;
          default:
        }
        query('i', tool).addClass('fa-ban');
      }
    },

    _resetTools: function () {
      console.debug('ZoneEditor::_resetTools');
      this._activeTool = null;
      query('i', this.rootNode).removeClass('fa-ban');

      this.mapController.stopDraw();
      query('i', this.drawTool).addClass('fa-pencil');
      query('span', this.drawTool).innerHTML('Teken polygoon');

      this.mapController.stopParcelSelect();
      query('i', this.selectPerceelTool).addClass('fa-hand-o-up');
      query('span', this.selectPerceelTool).innerHTML('Selecteer perceel');

      this.mapController.stopBeschermingSelect();
      query('i', this.selectBeschermingTool).addClass('fa-hand-o-up');
      query('span', this.selectBeschermingTool).innerHTML('Selecteer bescherming');


      this.wktInput.value = '';
    }

  });
});
