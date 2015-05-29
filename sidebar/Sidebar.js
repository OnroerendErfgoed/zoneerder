define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/text!./Sidebar.html',
  'dojo/_base/lang',
  'dojo/query',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/on',
  './SidebarButton'
], function (
  declare,
  WidgetBase,
  TemplatedMixin,
  template,
  lang,
  query,
  domClass,
  domConstruct,
  on,
  SidebarButton
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: template,
    tabContainer: null,
    tabs: null,
    tabButtons: null,

    postCreate: function () {
      console.debug('Sidebar::postCreate');
      this.inherited(arguments);
    },

    startup: function () {
      console.debug('Sidebar::startup');
      this.inherited(arguments);

      this.tabs = query('.sidebar-tabs', this.containerNode).at(0);
      this.tabContainer = query('.sidebar-content', this.containerNode).at(0);
    },

    openTab: function (tabPane) {
      console.debug('Sidebar::open', tabPane);
      domClass.remove(this.containerNode, 'collapsed');
      query('.sidebar-pane.active', this.paneNode).removeClass('active');
      domClass.add(tabPane, 'active');
    },

    collapse: function() {
      console.debug('Sidebar::collapse');
      domClass.add(this.containerNode, 'collapsed');
    },

    addTab: function (id, label, iconClass, description) {
      console.debug('Sidebar::addTab', id);

      //add tab pane to paneNode
      /*
       <div class="sidebar-pane" id="Kaartlagen">
       <h2>Kaartlagen</h2>
       <p class="description">
       Hier kan je kiezen welke lagen er op de kaart moeten getoond worden en welke niet.
       </p>
       <div data-dojo-attach-point="layerNode"></div>
       </div>
       */
      var pane = domConstruct.create('div', {
        'class': 'sidebar-pane',
        'id': id
      }, this.paneNode);

      domConstruct.create('h2', {
        'innerHTML': label
      }, pane);

      var paneBody = domConstruct.create('div', {
        'class': 'pane-body'
      }, pane);

      domConstruct.create('div', {
        'innerHTML': description,
        'class': 'pane-description'
      }, paneBody);

      domConstruct.create('div', {
        'id': id + 'content',
        'class': 'pane-content'
      }, paneBody);

      //add tab button to buttonNode
      var btn = new SidebarButton({
        tab: pane,
        label: label,
        iconClass: iconClass
      }).placeAt(this.buttonNode);

      on(btn, 'click', lang.hitch(this, function (evt) {
        console.debug('Sidebar::addTab click', evt);
        evt.preventDefault();
        evt.stopPropagation();
        this._tabButtonClick(evt.target, evt.tab);
      }));

    },

    _tabButtonClick: function (tabButton, tabPane) {
      console.debug('Sidebar::_tabButtonClick', tabButton);
      var tabActive = domClass.contains(tabButton, 'active');
      query('.sidebar-tabs >li.active', this.tablist).removeClass('active');

      if (tabActive) {
        this.collapse();
      }
      else {
        domClass.add(tabButton, 'active');
        this.openTab(tabPane);
      }
    }

  });

});
