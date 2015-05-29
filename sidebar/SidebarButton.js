define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/Evented'
], function (
  declare,
  WidgetBase,
  TemplatedMixin,
  Evented
) {
  return declare([WidgetBase, TemplatedMixin, Evented], {

    tab: null,
    label: null,
    iconClass: null,
    templateString: ''
      + '<li data-dojo-attach-point="buttonContainer">'
      +   '<a href="#" data-dojo-attach-event="onClick: _tabClick" role="tab" title="${label}">'
      +     '<i class="fa fa-lg ${iconClass}"></i>'
      +   '</a>'
      + '</li>',

    postCreate: function () {
      this.inherited(arguments);
      //console.debug('SidebarButton::postCreate', this.label);
    },

    startup: function () {
      this.inherited(arguments);
      //console.debug('SidebarButton::startup', this.label);
    },

    _tabClick: function (evt) {
      evt.preventDefault();
      //console.debug('SidebarButton::_onClick', this.label);
      this.emit('tabClick', {tab: this.tab});
    }

  });
});
