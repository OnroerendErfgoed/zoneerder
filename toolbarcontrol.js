goog.provide('ol.control.Toolbar');
goog.provide('ol.control.ToolbarEvent');
goog.provide('ol.control.ToolbarEventType');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('ol.animation');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.easing');
goog.require('ol.pointer.PointerEventHandler');
goog.require('ol.interaction.Draw');
goog.require('ol.interaction.Modify');

ol.control.ToolbarEventType = {
  SAVE: 'save',
  CLEAR: 'clear'
};

ol.control.ToolbarEvent = function(type, opt_features, opt_target) {
  goog.base(this, type, opt_target);
  this.features = opt_features;
};
goog.inherits(ol.control.ToolbarEvent, goog.events.Event);


ol.control.Toolbar = function(opt_options) {

    var options = goog.isDef(opt_options) ? opt_options : {};

    var className = goog.isDef(options.className) ? options.className : 'ol-toolbar';

    var featureOverlay = goog.isDef(options.featureOverlay) ? options.featureOverlay : null;

   /**
   * @type {ol.featureOverlay}
   * @private
   */
    this.featureOverlay_ = featureOverlay;


    var tTipDraw = goog.dom.createDom(goog.dom.TagName.SPAN, {
        'role' : 'tooltip'
    }, 'Teken Polygoon');
    var drawElement = goog.dom.createDom(goog.dom.TagName.BUTTON, {
        'class': className + '-draw ol-has-tooltip',
        'type' : 'button'
    }, tTipDraw, "D");

  var drawElementHandler = new ol.pointer.PointerEventHandler(drawElement);
  this.registerDisposable(drawElementHandler);
  goog.events.listen(drawElementHandler,
      ol.pointer.EventType.POINTERUP, goog.partial(
          ol.control.Toolbar.prototype.handlePointerUp_, 'draw'), false, this);
  goog.events.listen(drawElement,
      goog.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleClick_, 'draw'), false, this);

  goog.events.listen(drawElement, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);


    var tTipModify = goog.dom.createDom(goog.dom.TagName.SPAN, {
        'role' : 'tooltip'
    }, 'Wijzig Polygoon');
    var modifyElement = goog.dom.createDom(goog.dom.TagName.BUTTON, {
        'class': className + '-modify ol-has-tooltip',
        'type' : 'button'
    }, tTipModify, "E");

  var modifyElementHandler = new ol.pointer.PointerEventHandler(modifyElement);
  this.registerDisposable(modifyElementHandler);
  goog.events.listen(modifyElementHandler,
      ol.pointer.EventType.POINTERUP, goog.partial(
          ol.control.Toolbar.prototype.handlePointerUp_, 'modify'), false, this);
  goog.events.listen(modifyElement,
      goog.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleClick_, 'modify'), false, this);

  goog.events.listen(modifyElement, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var tTipCancel = goog.dom.createDom(goog.dom.TagName.SPAN, {
        'role' : 'tooltip'
    }, 'Annuleren');
    var cancelElement = goog.dom.createDom(goog.dom.TagName.BUTTON, {
        'class': className + '-cancel ol-has-tooltip',
        'type' : 'button'
    }, tTipCancel, "C");

  var cancelElementHandler = new ol.pointer.PointerEventHandler(cancelElement);
  this.registerDisposable(cancelElementHandler);
  goog.events.listen(cancelElementHandler,
      ol.pointer.EventType.POINTERUP, goog.partial(
          ol.control.Toolbar.prototype.handlePointerUp_, 'cancel'), false, this);
  goog.events.listen(cancelElement,
      goog.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleClick_, 'cancel'), false, this);

  goog.events.listen(cancelElement, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var tTipDelete = goog.dom.createDom(goog.dom.TagName.SPAN, {
        'role' : 'tooltip'
    }, 'Alles wissen');
    var deleteElement = goog.dom.createDom(goog.dom.TagName.BUTTON, {
        'class': className + '-cancel ol-has-tooltip',
        'type' : 'button'
    }, tTipDelete, "X");

  var deleteElementHandler = new ol.pointer.PointerEventHandler(deleteElement);
  this.registerDisposable(deleteElementHandler);
  goog.events.listen(deleteElementHandler,
      ol.pointer.EventType.POINTERUP, goog.partial(
          ol.control.Toolbar.prototype.handlePointerUp_, 'delete'), false, this);
  goog.events.listen(deleteElement,
      goog.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleClick_, 'delete'), false, this);

  goog.events.listen(deleteElement, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);


    var tTipSave = goog.dom.createDom(goog.dom.TagName.SPAN, {
        'role' : 'tooltip'
    }, 'Opslaan');
    var saveElement = goog.dom.createDom(goog.dom.TagName.BUTTON, {
        'class': className + '-delete ol-has-tooltip',
        'type' : 'button'
    }, tTipSave, "S");

  var saveElementHandler = new ol.pointer.PointerEventHandler(saveElement);
  this.registerDisposable(saveElementHandler);
  goog.events.listen(saveElementHandler,
      ol.pointer.EventType.POINTERUP, goog.partial(
          ol.control.Toolbar.prototype.handlePointerUp_, 'save'), false, this);
  goog.events.listen(saveElement,
      goog.events.EventType.CLICK, goog.partial(
          ol.control.Toolbar.prototype.handleClick_, 'save'), false, this);

  goog.events.listen(saveElement, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);


  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses,
      drawElement, modifyElement, cancelElement, deleteElement, saveElement);

  goog.base(this, {
    element: element,
    target: options.target
  });

    this.drawInteraction_ = new ol.interaction.Draw({
        features: featureOverlay.getFeatures(),
        type: /** @type {ol.geom.GeometryType} */ ('Polygon')
    });

    this.modifyInteraction_ = new ol.interaction.Modify({
      features: featureOverlay.getFeatures(),
      // the SHIFT key must be pressed to delete vertices, so
      // that new vertices can be drawn at the same position
      // of existing vertices
      deleteCondition: function(event) {
        return ol.events.condition.shiftKeyOnly(event) &&
            ol.events.condition.singleClick(event);
      }
    });

};
goog.inherits(ol.control.Toolbar, ol.control.Control);


ol.control.Toolbar.prototype.handleClick_ = function(tool, event) {
  if (event.screenX !== 0 && event.screenY !== 0) {
    return;
  }
  this.selectTool_(tool);
};

ol.control.Toolbar.prototype.handlePointerUp_ = function(tool, pointerEvent) {
  pointerEvent.browserEvent.preventDefault();
  this.selectTool_(tool);
};

ol.control.Toolbar.prototype.selectTool_ = function(tool) {
    var map = this.getMap();

    map.removeInteraction(this.drawInteraction_);
    map.removeInteraction(this.modifyInteraction_);

    if (tool == 'draw'){
        map.addInteraction(this.drawInteraction_);
    }
    if (tool == 'modify'){
        map.addInteraction(this.modifyInteraction_);
    }
    if (tool == 'delete'){
        this.clearFeatures_();
    }
    if (tool == 'save'){
        this.saveFeatures_();
        this.clearFeatures_();
    }
};

ol.control.Toolbar.prototype.saveFeatures_ = function() {
    var cloneFeatures = [];
    var features = this.featureOverlay_.getFeatures();
    features.forEach(function (feature) {
        var clone = feature.clone();
        cloneFeatures.push(clone);
    });
    console.log(cloneFeatures);
    this.dispatchEvent(
        new ol.control.ToolbarEvent(ol.control.ToolbarEventType.SAVE, cloneFeatures, this)
    );

};

ol.control.Toolbar.prototype.clearFeatures_  = function() {
    this.featureOverlay_.getFeatures().clear();
    this.dispatchEvent(
        new ol.control.ToolbarEvent(ol.control.ToolbarEventType.CLEAR, null, this)
    );
};
