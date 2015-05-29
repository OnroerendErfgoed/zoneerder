define([
    "dojo/_base/declare",
    "dijit/_WidgetBase"
], function (declare, WidgetBase) {
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
            this.panel.className = 'layerpanel';

            element.appendChild(this.panel);

            var ul = document.createElement('ul');
            this.panel.appendChild(ul);
            this._renderLayers(this.map, ul);
        },


        _renderLayers: function(lyr, elm) {
            var lyrs = lyr.getLayers().getArray().slice().reverse();
            for (var i = 0, l; i < lyrs.length; i++) {
                l = lyrs[i];
                if (l.get('title')) {
                    elm.appendChild(this._renderLayer(l, i));
                }
            }
        },

        _renderLayer: function(lyr, idx) {

            var self = this;
            var li = document.createElement('li');

            var lyrTitle = lyr.get('title');
            var lyrId = lyr.get('title').replace(' ', '-') + '_' + idx;

            var label = document.createElement('label');

            if (lyr.getLayers) {

                li.className = 'group';
                label.innerHTML = lyrTitle;
                li.appendChild(label);
                var ul = document.createElement('ul');
                li.appendChild(ul);

                this._renderLayers(lyr, ul);

            } else {

                var input = document.createElement('input');
                if (lyr.get('type') === 'base') {
                    input.type = 'radio';
                    input.name = 'base';
                } else {
                    input.type = 'checkbox';
                }
                input.id = lyrId;
                input.checked = lyr.get('visible');
                input.onchange = function () {
                    self._toggleLayer(lyr);
                };
                li.appendChild(input);

                label.htmlFor = lyrId;
                label.innerHTML = lyrTitle;
                li.appendChild(label);

            }

            return li;
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