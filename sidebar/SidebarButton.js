define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin'
], function (
  declare,
  WidgetBase,
  TemplatedMixin
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: ''
      + '<li data-dojo-attach-point="buttonContainer">'
      +   '<a href="#${tempId}" data-dojo-attach-event="onclick: _onClick" role="tab" title="${label}">'
      +     '<i class="fa fa-lg ${iconClass}"></i>'
      +   '</a>'
      + '</li>',

    tempId: null,
    label: null,
    iconClass: null,

    postCreate: function () {
      this.inherited(arguments);
      console.debug('SidebarButton::postCreate', this.label);
    },

    startup: function () {
      this.inherited(arguments);
      console.debug('SidebarButton::startup', this.label);
    },

    _onClick: function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      console.debug('SidebarButton::_onClick', this.label);
      this.emit('click');
    }

  });
});
