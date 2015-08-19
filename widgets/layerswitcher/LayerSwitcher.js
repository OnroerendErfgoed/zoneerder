define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  'dojo/_base/array'
], function (declare, WidgetBase, array) {
  return declare([WidgetBase], {

    map: null,

    mapListeners: null,

    div: null,

    postMixInProperties: function () {
      this.inherited(arguments);
    },

    buildRendering: function () {
      this.inherited(arguments);
    },

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);

      this.mapListeners = [];

      var element = this.div;
      element.className = 'layer-switcher';

      this.panel = document.createElement('div');

      element.appendChild(this.panel);

      var ul = document.createElement('ul');
      this._renderLayers(this.map, this.panel);
    },

    _renderLayers: function(lyr, elm) {
      var lyrs = lyr.getLayers().getArray().slice().reverse();
      for (var i = 0, l; i < lyrs.length; i++) {
        l = lyrs[i];
        if (l.get('title')) {
          this._renderLayer(l, elm);
        }
      }
    },

    _renderLayer: function(lyr, elm) {
      var panel = document.createElement('div');
      panel.className = 'widget-pane';
      var header = document.createElement('div');
      header.className = 'widget-pane-header';
      header.innerHTML = lyr.get('title');
      panel.appendChild(header);
      elm.appendChild(panel);

      var ul = document.createElement('ul');
      ul.className = 'small-list';
      panel.appendChild(ul);
      var self = this;

      if (lyr.getLayers) {
        array.forEach(lyr.getLayers().getArray().slice().reverse(), function (layer, idx) {
          var li = document.createElement('li');
          var lyrTitle = layer.get('title');
          var lyrId = layer.get('title').replace(' ', '-') + '_' + idx;
          var label = document.createElement('label');
          var input = document.createElement('input');

          if (layer.get('type') === 'base') {
            input.type = 'radio';
            input.name = 'base';
          } else {
            input.type = 'checkbox';
          }
          input.id = lyrId;
          input.checked = layer.get('visible');
          input.onchange = function () {
            self._toggleLayer(layer);
          };
          li.appendChild(input);

          label.htmlFor = lyrId;
          label.innerHTML = lyrTitle;
          li.appendChild(label);

          ul.appendChild(li);
        });
      }
    },

    _toggleLayer: function(lyr) {
      var map = this.map;
      lyr.setVisible(!lyr.getVisible());
      if (lyr.get('type') === 'base') {
        // Hide all other base layers regardless of grouping
        this._forEachRecursive(map, function(l, idx, a) {
          if (l.get('type') === 'base' && l != lyr) {
            l.setVisible(false);
          }
        });
      }
    },

    _forEachRecursive: function(lyr, fn) {
      var self = this;
      lyr.getLayers().forEach(function(lyr, idx, a) {
        fn(lyr, idx, a);
        if (lyr.getLayers) {
          self._forEachRecursive(lyr, fn);
        }
      });
    }

  });
});