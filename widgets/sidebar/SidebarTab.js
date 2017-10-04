define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/text!./SidebarTab.html',
  'dojo/dom-construct',
  'dojo/_base/array'
], function (
  declare,
  WidgetBase,
  TemplatedMixin,
  template,
  domConstruct,
  array
) {
  return declare([WidgetBase, TemplatedMixin], {

    label: null,
    description: null,
    templateString: template,
    children: null,

    postCreate: function () {
      this.inherited(arguments);
      //console.debug('SidebarTab::postCreate', this.label);
      this.children = [];
    },

    startup: function () {
      this.inherited(arguments);
      //console.debug('SidebarTab::startup', this.label);
    },

    getChildren: function () {
      //console.debug('SidebarTab::getChildren', this.label);
			return this.children;
		},

    addContent: function (content) {
      domConstruct.place(content, this.contentContainer);
    },

    registerWidget: function (widget) {
      this.children.push(widget);
    },

    refresh: function () {
      //console.debug('SidebarTab::refresh', this.label);
      array.forEach(this.children, function (child) {
        if (child.refresh) {
          setTimeout(function(){ child.refresh(); }, 100);
        }
      });
    },

    reset: function () {
      //console.debug('SidebarTab::reset', this.label);
      array.forEach(this.children, function (child) {
        if (child.reset) {
          child.reset();
        }
      });
    }

  });
});
