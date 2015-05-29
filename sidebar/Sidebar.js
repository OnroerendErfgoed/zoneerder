define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/text!./Sidebar.html',
  'dojo/query',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/html'
], function (
  declare,
  WidgetBase,
  TemplatedMixin,
  template,
  query,
  domClass,
  domConstruct,
  html
) {
  return declare([WidgetBase, TemplatedMixin], {

    templateString: template,
    tabContainer: null,
    tabs: null,

    startup: function () {
      this.inherited(arguments);

      this.tabs = query('.sidebar-tabs', this.containerNode).at(0);
      this.tabContainer = query('.sidebar-content', this.containerNode).at(0);
      var sidebar = this;

      query('.sidebar-tabs >li > a', this.containerNode).on("click", function(evt) {
        evt.preventDefault();
        var tab = this.parentNode;
        if (domClass.contains(tab, 'active')) {
          sidebar.close();
        }
        else {
          sidebar.open(tab);
        }
      });
    },

    open: function (tab) {
      var siderbar = this.containerNode;
      var id = "";
      var a = (query('a', tab).forEach(function(node){
        id = node.hash.slice(1);
      }));

      // close all tabs & show new tab
      query('.sidebar-pane.active', siderbar).removeClass('active');
      query('#' + id, this.containerNode).addClass('active');

      // set correct link active
      query('.sidebar-tabs >li.active', siderbar).removeClass('active');
      domClass.add(tab, "active");

      if (domClass.contains(siderbar, 'collapsed')) {
        // open sidebar
        domClass.remove(siderbar, "collapsed");
      }

    },

    close: function() {
      var siderbar = this.containerNode;
      // remove old active highlights
      query('.sidebar-tabs >li.active', siderbar).removeClass('active');

      if (!domClass.contains(siderbar, 'collapsed')) {
        domClass.add(siderbar, "collapsed");
      }
    },

    setTabContent: function (content, tabname){
      if (tabname == "layers") {
        content.placeAt(this.layerNode);
      }
      else if (tabname == "addlayer") {
        content.placeAt(this.addlayerNode);
      }
      else if (tabname == "capazoom") {
        content.placeAt(this.capazoomNode);
      }
      else if (tabname == "crabzoom") {
        content.placeAt(this.crabzoomNode);
      }
      else if (tabname == "ehreport") {
        html.set(this.erfgoedNode, content);
        this._openReportTab();
      }
      else if (tabname == "grbreport") {
        html.set(this.grbNode, content);
        this._openReportTab();
      }
      else if (tabname == "rcereport") {
        html.set(this.rceNode, content);
        this._openReportTab();
      }
      else if (tabname == "help") {
        html.set(this.helpNode, content);
      }
    },

    _openReportTab: function () {
      var nodes = query('.sidebar-tabs >li > a.reporticon', this.containerNode);
      var tab = nodes[0].parentNode;
      this.open(tab);
    },

    addTab: function (id, label, iconClass, description) {
      //add tab nav to buttonNode
      domConstruct.create('li', {
        'innerHTML': '' +
        '<a href="#' + id + '" role="tab" title="' + label + '">' +
        ' <i class="fa fa-lg ' + iconClass + '"></i>' +
        '</a>'
      }, this.buttonNode);

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

    }

  });

});
