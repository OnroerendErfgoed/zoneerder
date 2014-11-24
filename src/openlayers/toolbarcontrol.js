goog.provide('ol.control.DrawToolbar');
goog.provide('ol.control.DrawToolbarEvent');
goog.provide('ol.control.DrawToolbarEventType');

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
goog.require('ol.source.TileWMS');


ol.control.DrawToolbarEventType = {
    SAVE: 'save'
};


ol.control.DrawToolbarEvent = function(type, opt_features, opt_target) {
    goog.base(this, type, opt_target);
    this.features = opt_features;
};
goog.inherits(ol.control.DrawToolbarEvent, goog.events.Event);


ol.control.DrawToolbar = function(opt_options) {
    var options = goog.isDef(opt_options) ? opt_options : {};
    var className = goog.isDef(options.className) ? options.className : 'ol-toolbar';

    //temp
    this.mapController = goog.isDef(options.mapController) ? options.mapController : null;

    //draw
    var drawElement = this.createTool_('draw', 'Teken polygoon', className);
    this.attachEvents_(drawElement, 'draw', true);

    //edit
    var modifyElement = this.createTool_('modify', 'Wijzig polygoon', className);
    this.attachEvents_(modifyElement, 'modify', true);

    //cancel
    var cancelElement = this.createTool_('cancel', 'Annuleren', className);
    this.attachEvents_(cancelElement, 'cancel', false);

    //save
    var saveElement = this.createTool_('save', 'Sla polygoon op', className);
    this.attachEvents_(saveElement, 'save', false);

    var cssClasses = className + ' ' + ol.css.CLASS_UNSELECTABLE + ' ' +
        ol.css.CLASS_CONTROL;
    var element = goog.dom.createDom(goog.dom.TagName.DIV, cssClasses,
        drawElement, modifyElement, cancelElement, saveElement);

    goog.base(this, {
        element: element,
        target: options.target
    });
};
goog.inherits(ol.control.DrawToolbar, ol.control.Control);


ol.control.DrawToolbar.prototype.setMap = function(map) {
    goog.base(this, 'setMap', map);
    if (!goog.isNull(map)) {
        map.render();
    }
    if (!this.toolbarInitialized_) {
        this.initDrawToolbar_();
    }
};

ol.control.DrawToolbar.prototype.initDrawToolbar_ = function() {
    var featureOverlay = new ol.FeatureOverlay({
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        })
    });
    featureOverlay.setMap(this.getMap());
    this.featureOverlay_ = featureOverlay;

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

    this.toolbarInitialized_ = true;
};


ol.control.DrawToolbar.prototype.handleClick_ = function(tool, event) {
    if (event.screenX !== 0 && event.screenY !== 0) {
        return;
    }
    this.selectTool_(tool);
};

ol.control.DrawToolbar.prototype.handlePointerUp_ = function(tool, pointerEvent) {
    pointerEvent.browserEvent.preventDefault();
    this.selectTool_(tool);
};

ol.control.DrawToolbar.prototype.selectTool_ = function(tool) {
    var map = this.getMap();

    map.removeInteraction(this.drawInteraction_);
    map.removeInteraction(this.modifyInteraction_);

    if (tool == 'draw'){
        map.addInteraction(this.drawInteraction_);
    }
    else if (tool == 'modify'){
        map.addInteraction(this.modifyInteraction_);
    }
    else if (tool == 'cancel'){
        this.clearFeatures_();
    }
    else if (tool == 'save'){
        this.saveFeatures_();
        this.clearFeatures_();
    }
};

ol.control.DrawToolbar.prototype.saveFeatures_ = function() {
    var cloneFeatures = [];
    var features = this.featureOverlay_.getFeatures();
    features.forEach(function (feature) {
        var clone = feature.clone();
        cloneFeatures.push(clone);
    });
    this.dispatchEvent(
        new ol.control.DrawToolbarEvent(ol.control.DrawToolbarEventType.SAVE, cloneFeatures, this)
    );
};

ol.control.DrawToolbar.prototype.clearFeatures_ = function() {
    this.featureOverlay_.getFeatures().clear();
};


ol.control.DrawToolbar.prototype.createTool_ = function(type, tooltipLabel, baseClass) {
    var toolTip = goog.dom.createDom(goog.dom.TagName.SPAN, {
        'role': 'tooltip'
    }, tooltipLabel);
    var element = goog.dom.createDom(goog.dom.TagName.BUTTON, {
        'class': baseClass + '-' + type + ' ol-has-tooltip',
        'type': 'button'
    }, toolTip, "");

    return element;
};

ol.control.DrawToolbar.prototype.attachEvents_ = function(tool, type, isSelectable) {
    var elementHandler = new ol.pointer.PointerEventHandler(tool);

    this.registerDisposable(elementHandler);

    goog.events.listen(elementHandler,
        ol.pointer.EventType.POINTERUP, goog.partial(
            ol.control.DrawToolbar.prototype.handlePointerUp_, type), false, this);
    goog.events.listen(tool,
        goog.events.EventType.CLICK, goog.partial(
            ol.control.DrawToolbar.prototype.handleClick_, type), false, this);

    if (!isSelectable){
        goog.events.listen(tool, [
            goog.events.EventType.MOUSEOUT,
            goog.events.EventType.FOCUSOUT
        ], function() {
            this.blur();
        }, false);
    }
};



