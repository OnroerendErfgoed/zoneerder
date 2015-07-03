define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'mijit/_WidgetBase',
  'dojo/Evented',
  "dojo/query",
  './sidebar/Sidebar',
  './layerswitcher/LayerSwitcher',
  'crabpy_dojo/CrabpyWidget',
  'dojo/dom-construct',
  'dojo-form-controls/Button',
  'dojo-form-controls/Textarea',
  "dojo/dom", "dojo/_base/fx", "dojo/on", "dojo/dom-style",
  'dojo/NodeList-dom'
], function (declare, lang, WidgetBase, Evented, query, Sidebar, LayerSwitcher, CrabpyWidget, domConstruct, Button, TextArea,
dom, fx, on, domStyle
) {
  return declare([WidgetBase, Evented], {

    mapController: null,

    perceelService: null,

    tabs: null,

    crabpyUrl: null,

    postCreate: function () {
      this.inherited(arguments);
      //Set default values
      this._setDefaultParam(this.tabs, "layers", false);
      this._setDefaultParam(this.tabs, "zoom", true);
      this._setDefaultParam(this.tabs, "draw", false);
      this._setDefaultParam(this.tabs, "help", true);
    },

    startup: function () {
      this.inherited(arguments);
    },

    _setDefaultParam: function (object, field, defValue) {
      if (!lang.exists(field, object)) {
        lang.setObject(field, defValue, object);
      }
    },

    createSidebar: function (node) {
      var sidebar = new Sidebar({}, node);
      query(".ol-attribution").addClass("sidebar-padding");

      if (this.tabs.layers) {
        var layerTab = sidebar.createTab('Kaartlagen', 'fa-list',
          'Hier kan je kiezen welke lagen er op de kaart moeten getoond worden en welke niet.');

        var layerNode = domConstruct.create("div");
        domConstruct.place(layerNode, layerTab);

        var layerSwitcher = new LayerSwitcher ({
          map: this.mapController.olMap,
          div: layerNode
        });
        layerSwitcher.startup();
      }

      if (this.tabs.zoom) {
        var ZoomTab = sidebar.createTab('Zoom naar', 'fa-search',
          'Hier kan je naar een perceel of adres zoomen (je moet minstens een gemeente kiezen).');

        var crabpyWidget = new CrabpyWidget({
          name: "location",
          baseUrl: this.crabpyUrl
        });

        var crabNode = domConstruct.create("div");
        domConstruct.place(crabNode, ZoomTab);
        var crabZoomer = crabpyWidget.createCrabZoomer(crabNode);
        var self = this;
        var zoomButton = new Button({
          label: "Zoom naar adres",
          'class': "sidebar-button",
          onClick: function () {
            var bbox = crabZoomer.getBbox();
            if (bbox) {
              var extent = self.mapController.transformExtent(bbox,  'EPSG:31370', 'EPSG:900913');
              self.mapController.zoomToExtent(extent);
              crabZoomer.reset();
              sidebar.collapse();
            }
          }
        });
        domConstruct.place(zoomButton.domNode, ZoomTab);

        var capakeyNode = domConstruct.create("div");
        domConstruct.place(capakeyNode, ZoomTab);
        var capakeyZoomer = crabpyWidget.createCapakeyZoomer(capakeyNode);
        var capakeyZoomButton = new Button({
          label: "Zoom naar perceel",
          'class': "sidebar-button",
          onClick: function () {
            var bbox = capakeyZoomer.getBbox();
            if (bbox) {
              var extent = self.mapController.transformExtent(bbox,  'EPSG:31370', 'EPSG:900913');
              self.mapController.zoomToExtent(extent);
              capakeyZoomer.reset();
              sidebar.collapse();
            }
          }
        });
        domConstruct.place(capakeyZoomButton.domNode, ZoomTab);
      }

      if (this.tabs.draw) {
        var drawTab = sidebar.createTab('Bepaal zone', 'fa-pencil', 'Baken een zone af voor het beheersplan.');

        /* ZONE */
        var zonePane = domConstruct.create('div', {'class': 'zoneerder-pane'}, drawTab);

        var zoneHeader = domConstruct.create('div', {
          'class': 'zoneerder-pane-header',
          innerHTML: 'Zone'
        }, zonePane);

        domConstruct.create('a', {
          title: 'Verwijder de volledige zone',
          href: '#',
          innerHTML: '<i class="fa fa-trash"></i> ',
          onclick: lang.hitch(this, function (evt) {
            evt.preventDefault();
             console.info('zone::delete');
            this.mapController.stopAllDrawActions();
            this.mapController.geoJsonLayer.getSource().clear();
            this.zone = null;
            sidebar.emit("zone.deleted");
          })
        }, zoneHeader);

        domConstruct.create('a', {
          title: 'Zoom naar de zone',
          href: '#',
          innerHTML: '<i class="fa fa-search"></i> ',
          onclick: lang.hitch(this, function (evt) {
            evt.preventDefault();
            console.info('TODO: implement zoom to zone');
          })
        }, zoneHeader);

        domConstruct.create('a', {
          title: 'Flash de zone',
          href: '#',
          innerHTML: '<i class="fa fa-flash"></i> ',
          onclick: lang.hitch(this, function (evt) {
            evt.preventDefault();
            console.info('TODO: implement flash zone');
          })
        }, zoneHeader);

        domConstruct.create('div', {
          'class': 'zoneerder-pane-content',
          innerHTML: 'content'
        }, zonePane);

        /* TOEVOEGEN */
        var addPane = domConstruct.create('div', {'class': 'zoneerder-pane'}, drawTab);

        domConstruct.create('div', {
          'class': 'zoneerder-pane-header',
          innerHTML: 'Toevoegen'
        }, addPane);

        var addContent = domConstruct.create('div', {
          'class': 'zoneerder-pane-content'
        }, addPane);

        domConstruct.create('span', {
          'class': 'zoneerder-actionlist-header',
          innerHTML: 'Voeg een polygoon toe aan de zone: '
        }, addContent);

        var actionList = domConstruct.create('ul', {
          'class': 'zoneerder-actionlist'
        }, addContent);

        domConstruct.create('a', {
          title: 'Teken een polygoon',
          href: '#',
          innerHTML: '<i class="fa fa-pencil"></i> Teken polygoon',
          onclick: lang.hitch(this, function (evt) {
            evt.preventDefault();
            this.mapController.startDraw();
          })
        }, domConstruct.create('li', {}, actionList));

        if (this.perceelService){
          domConstruct.create('a', {
            title: 'Selecteer een perceel',
            href: '#',
            innerHTML: '<i class="fa  fa-hand-o-up"></i> Selecteer perceel',
            onclick: lang.hitch(this, function (evt) {
              evt.preventDefault();
              console.info('zone::select perceel');
              this.mapController.startParcelSelect(this.perceelService);
            })
          }, domConstruct.create('li', {}, actionList));
        }
        else {
          console.warn("No parcel service available, please add 'perceelUrl' to config.");
        }

        domConstruct.create('a', {
          title: 'Selecteer een bescherming',
          href: '#',
          innerHTML: '<i class="fa  fa-hand-o-up"></i> Selecteer bescherming',
          onclick: lang.hitch(this, function (evt) {
            evt.preventDefault();
             console.info('zone::select bescherming');
          })
        }, domConstruct.create('li', {}, actionList));

        var wktLi = domConstruct.create('li', {}, actionList);
        domConstruct.create('a', {
          title: 'Gebruik de WKT string',
          'class': 'button',
          href: '#',
          innerHTML: 'WKT',
          onclick: lang.hitch(this, function (evt) {
            evt.preventDefault();
            this.mapController.startInputWKT(wktInput.value);
          })
        }, wktLi);
        var wktInput = domConstruct.create('input', {
          type: 'text',
          title: 'Vul de WKT (Well Known Text) van een polygoon in (projectie in Lambert 72)',
          placeholder: 'WKT string (Lambert72)'
        }, wktLi);


        //var removeTitle = domConstruct.create("div", {innerHTML: "Verwijder een polygoon uit de selectie"});
        //domConstruct.place(removeTitle, drawTab);
        //
        //var toolbarNode2 = domConstruct.create("div", {'class': 'buttons'});
        //domConstruct.place(toolbarNode2, drawTab);
        //
        //var selectButton = new Button({
        //  label: "Kies polygoon",
        //  'class': "sidebar-button",
        //  onClick: lang.hitch(this, function () {
        //    this.mapController.startSelect();
        //  })
        //});
        //domConstruct.place(selectButton.domNode, toolbarNode2);
        //
        //var removeButton = new Button({
        //  label: "Verwijderen",
        //  'class': "sidebar-button",
        //  onClick: lang.hitch(this, function () {
        //    this.mapController.removeSelectedItems();
        //  })
        //});
        //domConstruct.place(removeButton.domNode, toolbarNode2);
        //
        //var cancelRemoveButton = new Button({
        //  label: "Annuleren",
        //  'class': "sidebar-button",
        //  onClick: lang.hitch(this, function () {
        //    this.mapController.stopSelect();
        //  })
        //});
        //domConstruct.place(cancelRemoveButton.domNode, toolbarNode2);
        //

        /* BUTTONS */
        var bottomButtonsNode = domConstruct.create("div", {'class': 'zoneerder-draw-buttons'}, drawTab);

        new Button({
          label: "Bewaar",
          'class': "sidebar-button",
          onClick: lang.hitch(this, function () {
            var zone = this.mapController.getZone();
            this.mapController.stopAllDrawActions();
            if (zone) {
              this.zone = zone;
              sidebar.emit("zone.saved", {zone: zone});
            }
            else {
              alert("Er is nog geen zone beschikbaar om op te slaan.");
            }
          })
        }).placeAt(bottomButtonsNode);

        new Button({
          label: "Annuleer",
          'class': "sidebar-button",
          onClick: lang.hitch(this, function () {
            console.info('TODO: implement cancel');
            this.mapController.stopDraw();
            this.mapController.stopParcelSelect();
          })
        }).placeAt(bottomButtonsNode);
      }

      if (this.tabs.help) {
        sidebar.createTab('Help', 'fa-question-circle', 'I need somebody </br> ... </br> <small>(to provide help content)</small>');
      }

      return sidebar;
    }
  });
});
