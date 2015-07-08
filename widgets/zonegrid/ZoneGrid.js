define([
  'dijit/_TemplatedMixin',
  'dijit/_WidgetBase',
  'dojo/_base/declare',
  'dojo/text!./ZoneGrid.html',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dgrid/OnDemandGrid',
  'dgrid/Selection',
  'dgrid/extensions/DijitRegistry',
  'dgrid/extensions/ColumnResizer',
  'ol'
], function (
  TemplatedMixin,
  WidgetBase,
  declare,
  template,
  domConstruct,
  lang,
  OnDemandGrid,
  Selection,
  DijitRegistry,
  ColumnResizer,
  ol
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: template,
    baseClass: 'zone-grid',
    polygonStore: null,
    _grid: null,

    postCreate: function () {
      this.inherited(arguments);
      console.debug('ZoneGrid::postCreate');

      this._grid = this._createGrid({
        store: this.polygonStore
      }, this.gridNode);
    },

    startup: function () {
      this.inherited(arguments);
      console.debug('ZoneGrid::startup');
      this._grid.startup();
    },

    refresh: function() {
      console.debug('ZoneGrid::refresh');
      this._grid.resize();
    },

    /**
     * Bouwt het grid en de kolommen op.
     * @param {Object} options Options voor het grid
     * @param {Object} node De container voor het grid
     * @private
     */
    _createGrid: function (options, node) {
      var columns = {
        naam: 'Polygoon',
        flash: {
          label: "",
          resizable: false,
          sortable: false,
          className: 'action-column',
          renderCell: lang.hitch(this, function (object, value, node, options) {
            return this._createActionColumn("Flash deze polygoon", "fa-flash", lang.hitch(this, function (evt) {
                evt.preventDefault();
                this._flashPolygon(object.feature);
              }));
          })
        },
        zoom: {
          label: "",
          resizable: false,
          sortable: false,
          className: 'action-column',
          renderCell: lang.hitch(this, function (object, value, node, options) {
            return this._createActionColumn("Zoom naar deze polygoon", "fa-search", lang.hitch(this, function (evt) {
              evt.preventDefault();
              this._zoomToPolygon(object.feature);
            }));
          })
        },
        remove: {
          label: "",
          resizable: false,
          sortable: false,
          className: 'action-column',
          renderCell: lang.hitch(this, function (object, value, node, options) {
            return this._createActionColumn("Verwijder deze polygoon", "fa-trash", lang.hitch(this, function (evt) {
              evt.preventDefault();
              this._deletePolygon(object);
            }));
          })
        }
      };

      return new (declare([OnDemandGrid, Selection, DijitRegistry, ColumnResizer]))({
        store: options.store,
        selectionMode: 'single',
        columns: columns,
        sort: [{ attribute: 'naam' }],
        noDataMessage: 'geen polygonen beschikbaar',
        loadingMessage: "data aan het ophalen..."
      }, node);
    },

    _createActionColumn: function (title, iconClass, action) {
        var div = domConstruct.create("div", {'innerHTML': '' });
        var a = domConstruct.create("a", {
          href: "#",
          title: title,
          'class': "fa " + iconClass,
          innerHTML: '',
          onclick: action
        }, div);
        return div;
    },

    /* UI triggered events */

    _deleteZone: function (evt) {
      evt.preventDefault();
      this.polygonStore.query().forEach(function (polygon) {
        this.polygonStore.remove(polygon.id);
      }, this);
      this.emit('click.zone', {action: 'delete'});
    },

    makeMultiPolygon: function(){
      var poly = new ol.geom.MultiPolygon([], 'XY');
      this.polygonStore.query().forEach(function (polygon) {
        poly.appendPolygon(new ol.geom.Polygon(polygon.feature.getGeometry().getCoordinates(), 'XY'));
      });
      var feature = new ol.Feature({
        geometry: poly,
        name: 'flash multiPolygon'
      });
      return feature;
    },

    _zoomToZone: function (evt) {
      evt.preventDefault();
      this.emit('click.zone', {action: 'zoom'});
    },

    _flashZone: function (evt) {
      evt.preventDefault();
      this.emit('click.zone', {action: 'flash'});
    },

    _deletePolygon: function (polygonToDelete) {
      this.polygonStore.query().forEach(function (polygon) {
        if (polygonToDelete.id == polygon.id) {
          this.polygonStore.remove(polygonToDelete.id);
        }
      }, this);
    },

    _zoomToPolygon: function (polygon) {
      this.emit('click.polygon', {
        action: 'zoom',
        polygon: polygon
      });
    },

    _flashPolygon: function (polygon) {
      this.emit('click.polygon', {
        action: 'flash',
        polygon: polygon
      });
    }
  });
});
