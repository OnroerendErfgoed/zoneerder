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
  './SidebarButton',
  './SidebarTab'
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
  SidebarButton,
  SidebarTab
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: template,

    postCreate: function () {
      console.debug('Sidebar::postCreate');
      this.inherited(arguments);
    },

    startup: function () {
      console.debug('Sidebar::startup');
      this.inherited(arguments);
    },

    openTab: function (tabPane) {
      console.debug('Sidebar::open', tabPane);
      domClass.remove(this.containerNode, 'collapsed');
      query('.sidebar-pane.active', this.paneNode).removeClass('active');
      domClass.add(tabPane.domNode, 'active');
      tabPane.refresh();
    },

    collapse: function() {
      //console.debug('Sidebar::collapse');
      domClass.add(this.containerNode, 'collapsed');
      query('.sidebar-pane.active', this.paneNode).removeClass('active');
      query('li.active', this.buttonNode).removeClass('active');
    },

    createTab: function (label, iconClass, description) {
      //console.debug('Sidebar::createTab', label);

      //add tab pane to paneNode
      var tab = new SidebarTab({
        label: label,
        description: description
      }).placeAt(this.paneNode);

      //add tab button to buttonNode
      var btn = new SidebarButton({
        label: label,
        iconClass: iconClass,
        onClick: lang.hitch(this, function() {
          console.warn('SidebarButton::onClick');
          this._tabButtonClick(btn, tab);
        })
      }).placeAt(this.buttonNode);

      return tab;

    },

    _tabButtonClick: function (tabButton, tabPane) {
      //console.debug('Sidebar::_tabButtonClick', tabButton, tabPane, domClass.contains(tabButton, 'active'));
      var tabActive = domClass.contains(tabButton.domNode, 'active');
      query('li.active', this.buttonNode).removeClass('active');

      if (tabActive) {
        this.collapse();
      }
      else {
        domClass.add(tabButton.domNode, 'active');
        this.openTab(tabPane);
      }
    }

  });

});
