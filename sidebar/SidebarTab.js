define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/text!./SidebarTab.html',
  'dojo/dom-construct'
], function (
  declare,
  WidgetBase,
  TemplatedMixin,
  template,
  domConstruct
) {
  return declare([WidgetBase, TemplatedMixin], {

    label: null,
    description: null,
    templateString: template,

    postCreate: function () {
      this.inherited(arguments);
      console.debug('SidebarTab::postCreate', this.label);
    },

    startup: function () {
      this.inherited(arguments);
      console.debug('SidebarTab::startup', this.label);
    },

    addContent: function (content) {
      domConstruct.place(content, this.contentContainer);
    }

  });
});
