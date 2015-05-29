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

    postCreate: function () {
      //console.debug('Sidebar::postCreate');
      this.inherited(arguments);
    },

    startup: function () {
      //console.debug('Sidebar::startup');
      this.inherited(arguments);
    },

    openTab: function (tabPane) {
      //console.debug('Sidebar::open', tabPane);
      domClass.remove(this.containerNode, 'collapsed');
      query('.sidebar-pane.active', this.paneNode).removeClass('active');
      domClass.add(tabPane, 'active');
    },

    collapse: function() {
      //console.debug('Sidebar::collapse');
      domClass.add(this.containerNode, 'collapsed');
      query('.sidebar-pane.active', this.paneNode).removeClass('active');
      query('.sidebar-tabs >li.active', this.tablist).removeClass('active');
    },

    createTab: function (label, iconClass, description) {
      //console.debug('Sidebar::createTab', label);

      //add tab pane to paneNode
      var pane = domConstruct.create('div', {
        'class': 'sidebar-pane'
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

      var contentContainer = domConstruct.create('div', {
        'class': 'pane-content'
      }, paneBody);

      //add tab button to buttonNode
      var btn = new SidebarButton({
        tab: pane,
        label: label,
        iconClass: iconClass
      }).placeAt(this.buttonNode);

      on(btn, 'click', lang.hitch(this, function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this._tabButtonClick(evt.target, evt.tab);
      }));

      return contentContainer;

    },

    _tabButtonClick: function (tabButton, tabPane) {
      //console.debug('Sidebar::_tabButtonClick', tabButton);
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
