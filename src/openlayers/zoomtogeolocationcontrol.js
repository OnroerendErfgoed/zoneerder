goog.provide('ol.control.zoomtogeolocationcontrol');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.pointer.PointerEventHandler');
goog.require('ol.Geolocation');

/**
 * @classdesc
 * A button control which, when pressed, changes the map view to the
 * geolocation position
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param opt_options Options.
 */
ol.control.zoomtogeolocationcontrol = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {ol.Geolocation}
   * @private
   */
  this.geolocation_ = goog.isDef(options.geolocation) ? options.geolocation : null;

  this.zoomLevel_ = goog.isDef(options.zoomLevel) ? options.zoomLevel : null;

  var className = goog.isDef(options.className) ? options.className :
      'ol-zoom-geolocation';

  var tipLabel = goog.isDef(options.tipLabel) ?
      options.tipLabel : 'Geolocate';
  var tip = goog.dom.createDom(goog.dom.TagName.SPAN, {
    'role' : 'tooltip'
  }, tipLabel);
  var button = goog.dom.createDom(goog.dom.TagName.BUTTON, {
    'class': 'ol-has-tooltip'
  });
  goog.dom.appendChild(button, tip);

  var buttonHandler = new ol.pointer.PointerEventHandler(button);
  this.registerDisposable(buttonHandler);
  goog.events.listen(buttonHandler, ol.pointer.EventType.POINTERUP,
      this.handlePointerUp_, false, this);
  goog.events.listen(button, goog.events.EventType.CLICK,
      this.handleClick_, false, this);

  goog.events.listen(button, [
    goog.events.EventType.MOUSEOUT,
    goog.events.EventType.FOCUSOUT
  ], function() {
    this.blur();
  }, false);

  var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
      ol.css.CLASS_CONTROL;
  var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses, button);

  goog.base(this, {
    element: element,
    target: options.target
  });
};
goog.inherits(ol.control.zoomtogeolocationcontrol, ol.control.Control);


/**
 * @param {goog.events.BrowserEvent} event The event to handle
 * @private
 */
ol.control.zoomtogeolocationcontrol.prototype.handleClick_ = function(event) {
  if (event.screenX !== 0 && event.screenY !== 0) {
    return;
  }
  this.handleZoomToLocation_();
};


/**
 * @param {ol.pointer.PointerEvent} pointerEvent The event to handle
 * @private
 */
ol.control.zoomtogeolocationcontrol.prototype.handlePointerUp_ = function(pointerEvent) {
  pointerEvent.browserEvent.preventDefault();
  this.handleZoomToLocation_();
};


/**
 * @private
 */
ol.control.zoomtogeolocationcontrol.prototype.handleZoomToLocation_ = function() {
  var map = this.getMap();
  var view = map.getView();
  var geolocation = this.geolocation_;
  var zoomLevel = this.zoomLevel_;

  geolocation.setTracking(true);
  geolocation.once('change:position', function() {
    view.setCenter(geolocation.getPosition());
    if (zoomLevel) view.setZoom(zoomLevel);
    geolocation.setTracking(false);
  });

};
