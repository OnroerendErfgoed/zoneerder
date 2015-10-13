define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/Evented',
  'dstore/Memory',
  'dstore/Trackable',
  'ol',
  './widgets/popup/Popup'
], function (
  declare,
  WidgetBase,
  lang,
  array,
  Evented,
  Memory,
  Trackable,
  ol,
  Popup
) {
  return declare([WidgetBase, Evented], {

    mapContainer: null,
    popupContainer: null,
    olMap: null,
    mapProjection: null,
    zoneLayer: null,
    oeFeaturesLayer: null,
    flashLayer: null,
    fullExtent: null,
    erfgoedFeatures: null,
    mapInteractions: null,
    polygonStore: null,
    perceelService: null,
    beschermingService: null,
    beschermingUrl: null,
    _drawPolygonIndex: 1,

    postCreate: function () {
      this.inherited(arguments);
      var TrackedemoryStore = declare([Memory, Trackable]);
      this.polygonStore = new TrackedemoryStore({
        data: [],
        idProperty: 'id'
      });

      var projection = this.mapProjection = this._defineProjection();
      var map = this.olMap = this._createMap(projection, this.mapContainer);
      this._createLayers(map);

      this.geoJsonFormatter =  new ol.format.GeoJSON({
        defaultDataProjection: this.mapProjection
      });

      map.addControl(new ol.control.ScaleLine());
      map.addControl(new ol.control.Attribution({
        collapsible: false
      }));

      this._createInteractions();
      this._createPopup();
      //map.on('moveend', this._onMoveEnd);

      this.zoomToExtent(projection.getExtent());
    },

    _defineProjection: function () {
      proj4.defs("EPSG:31370", "+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.869,52.2978,-103.724,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs"); //epsg.io

      // Define aliases
      proj4.defs('urn:ogc:def:crs:EPSG::31370', proj4.defs('EPSG:31370'));
      proj4.defs('urn:ogc:def:crs:EPSG:6.9:31370', proj4.defs('EPSG:31370'));
      proj4.defs('urn:x-ogc:def:crs:EPSG:31370', proj4.defs('EPSG:31370'));
      proj4.defs('http://www.opengis.net/gml/srs/epsg.xml#31370', proj4.defs('EPSG:31370'));

      var proj = ol.proj.get('EPSG:31370');
      proj.setExtent([9928.0, 66928.0, 272072.0, 329072.0]);
      return proj;
    },

    _createMap: function (projection, container) {
      return new ol.Map({
        target: container,
        view: new ol.View({
          projection: projection
        }),
        controls: ol.control.defaults({
          attribution: false,
          rotate: false,
          zoom: false
        }),
        logo: false
      });
    },

    _createLayers: function(map) {

      /* base layers */
      var orthoTileLayer = this._createGrbLayer("orthoklm", "Ortho", true);
      var gewestplanTileLayer = this._createGrbLayer("gewestplan", "Gewestplan", true);
      var grbTileLayer = this._createGrbLayer("grb_bsk", "GRB-Basiskaart", true);
      var grb_grTileLayer = this._createGrbLayer("grb_bsk_gr", "GRB-Basiskaart in grijswaarden", true);
      var ferrarisTileLayer = this._createGrbLayer("ferrarisx", "Ferraris", true);

      map.addLayer(new ol.layer.Group({
        title: 'Basislagen',
        layers: [
          orthoTileLayer,
          gewestplanTileLayer,
          grbTileLayer,
          grb_grTileLayer,
          ferrarisTileLayer
        ]
      }));

      grbTileLayer.setVisible(true);

      /* overlays */
      var grbTransTileLayer = this._createGrbLayer("grb_bsk_nb", "GRB-Basiskaart overlay", false);
      var grb_gbgTileLayer = this._createGrbLayer("grb_gbg", "GRB-Gebouwenlaag", false);
      var grb_adpTileLayer = this._createGrbLayer("grb_adp", "GRB-Percelenlaag", false);
      var beschermdWmsLayer = new ol.layer.Tile({
        title: "Beschermd Onroerend Erfgoed",
        extent: this.mapProjection.getExtent(),
        source: new ol.source.TileWMS(({
          url: this.beschermingUrl,
          params: {
            'LAYERS': 'vioe_geoportaal:beschermde_landschappen,' +
            'vioe_geoportaal:beschermde_dorps_en_stadsgezichten,' +
            'vioe_geoportaal:beschermde_archeologische_zones,' +
            'vioe_geoportaal:beschermde_monumenten,' +
            'vioe_geoportaal:dibe_geheel,' +
            'vioe_geoportaal:dibe_relict,' +
            'vioe_geoportaal:ile_park,' +
            'vioe_geoportaal:ile_boom',
            'TILED': true
          },
          attributions: [new ol.Attribution({
            html: '© <a href="https://www.onroerenderfgoed.be">Onroerend Erfgoed</a>'
          })]
        })),
        type: 'overlay',
        visible: false
      });
      var zoneLayer = this._createVectorLayer({
        title: 'Zone',
        color: 'rgb(39, 146, 195)',
        fill:  'rgba(39, 146, 195, 0.3)'
      });
      this.zoneLayer = zoneLayer;
      var oeFeaturesLayer = this._createVectorLayer({
        title: 'Erfgoed Objecten',
        color: 'rgb(124, 47, 140)',
        fill:  'rgba(124, 47, 140, 0.3)'
      });
      this.oeFeaturesLayer = oeFeaturesLayer;

      map.addLayer( new ol.layer.Group({
        title: 'Overlays',
        layers: [
          grbTransTileLayer,
          grb_gbgTileLayer,
          grb_adpTileLayer,
          beschermdWmsLayer,
          zoneLayer,
          oeFeaturesLayer
        ]
      }));

      /* other layers */
      this.drawLayer = new ol.layer.Vector({
        source: new ol.source.Vector({}),
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({color: 'rgb(255, 255, 255)', width: 1}),
          fill: new ol.style.Fill({color: 'rgba(255, 255, 255, 0.3)'})
        })
      });
      map.addLayer(this.drawLayer);

      this.flashLayer = new ol.layer.Vector({
        source: new ol.source.Vector({}),
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({color: 'rgba(255,0,255, 1)', width: 1}),
          fill: new ol.style.Fill({color: 'rgba(255,0,255, 0.4)'})
        })
      });
      map.addLayer(this.flashLayer);
    },

    startup: function () {
      this.inherited(arguments);
      this.popup.startup();
      this._observePolygonStore(this.polygonStore);
    },

    resize: function () {
      this.olMap.updateSize();
    },

    getFullExtent: function () {
      return this.mapProjection.getExtent();
    },

    clearFeatures: function () {
      this.oeFeaturesLayer.getSource().clear();
    },

    clearZone: function () {
      this.polygonStore.filter().forEach(function (polygon) {
        this.polygonStore.remove(polygon.id);
      }, this);
    },

    addErfgoedFeature: function (geoJsonFeature) {
      var geometry = this.geoJsonFormatter.readGeometry(geoJsonFeature.geometrie);
      var feature = new ol.Feature({
        geometry: geometry,
        name: geoJsonFeature.naam,
        naam: geoJsonFeature.naam,
        id: geoJsonFeature.id,
        type: geoJsonFeature.type,
        uri: geoJsonFeature.uri,
        description: geoJsonFeature.description
      });
      this.oeFeaturesLayer.getSource().addFeature(feature);
    },

    drawBescherming: function (olFeature) {
      if (olFeature) {
        var xyCoords = this._transformXyzToXy(olFeature.getGeometry().getCoordinates());
        var xyGeom = new ol.geom.MultiPolygon(xyCoords, 'XY');
        var name = olFeature.get('NAAM');
        olFeature.set('name', name);
        olFeature.setGeometry(xyGeom);
        this.polygonStore.add({id: name, naam: name, feature: olFeature});
      }
      else {
        alert('Er werd geen bescherming gevonden op deze locatie');
      }
    },

    drawPerceel: function (olFeature) {
      if (olFeature) {
        var xyCoords = this._transformXyzToXy(olFeature.getGeometry().getCoordinates());
        var xyGeom = new ol.geom.MultiPolygon(xyCoords, 'XY');
        var name = "Perceel " + olFeature.get('CAPAKEY');
        olFeature.set('name', name);
        olFeature.setGeometry(xyGeom);
        this.polygonStore.add({id: name, naam: name, feature: olFeature});
      }
      else {
        alert('Er werd geen perceel gevonden op deze locatie');
      }
    },

    drawWKTzone: function (wkt) {
      var wktParser = new ol.format.WKT();
      try {
        var featureFromWKT = wktParser.readFeature(wkt);

        var name = 'Polygoon ' + this._drawPolygonIndex++;
        featureFromWKT.setProperties({
          'name': name
        });
        this.polygonStore.put({id: name, naam: name, feature: featureFromWKT});
      }
      catch (error) {
        alert("Dit is een ongeldige WKT geometrie.")
      }
    },

    flashFeature: function(olFeature){
      this._flashFeaturesInVectorLayer([olFeature], 1000, 1);
    },

    flashFeatures: function(olFeatures){
      this._flashFeaturesInVectorLayer(olFeatures, 1000, 1);
    },

    _flashFeaturesInVectorLayer: function(olFeatures, timeout, maxCount, count) {
      count ? ++count : count=1;

      var flashLayerSource = this.flashLayer.getSource();
      var allFeatures = flashLayerSource.getFeatures();
      if(allFeatures.length === 0){
        flashLayerSource.addFeatures(olFeatures);
      }

      setTimeout(
        lang.hitch(this, function() {
          flashLayerSource.clear();
          if (count < maxCount) {
            setTimeout(
              lang.hitch(this, function() {
                this._flashFeaturesInVectorLayer(olFeatures, timeout, maxCount, count);
              }),
              timeout
            );
          }
        }),
        timeout
      );
    },

    _onMoveEnd: function (evt) {
      var olMap = evt.map;
      var mapview = olMap.getView();
      console.log("extent & center & resolution & zoom:");
      console.log(mapview.calculateExtent(olMap.getSize()));
      console.log(mapview.getCenter());
      console.log(mapview.getResolution());
      console.log(mapview.getZoom());
    },

    _createOsmLayer: function (title) {
      var osmSource = new ol.source.OSM({
        url: 'https://tile.geofabrik.de/dccc92ba3f2a5a2c17189755134e6b1d/{z}/{x}/{y}.png',
        maxZoom: 18,
        attributions: [
          new ol.Attribution({
            html: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          })
        ]
      });

      return new ol.layer.Tile({
        title: title,
        source: osmSource,
        type: 'base',
        visible: false
      });
    },

    _createGrbLayer: function (grbLayerId, title, isBaselayer) {
      //retrieved with readCapabilties.html
      var resolutions = [1024,512,256,128,64,32,16,8,4,2,1,0.5,0.25,0.125,0.0625,0.03125];
      var matrixIds = ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"];

      var grbSource = new ol.source.WMTS({
        url: 'http://grb.agiv.be/geodiensten/raadpleegdiensten/geocache/wmts/',
        layer: grbLayerId,
        matrixSet: 'BPL72VL',
        format: 'image/png',
        projection: this.mapProjection,
        style: "default",
        version: "1.0.0",
        tileGrid: new ol.tilegrid.WMTS({
          origin: ol.extent.getTopLeft(this.mapProjection.getExtent()),
          resolutions: resolutions,
          matrixIds: matrixIds
        }),
        attributions: [
          new ol.Attribution({
            html: '© <a href="http://www.agiv.be" title="AGIV" class="copyrightLink copyAgiv">AGIV</a>'
          })
        ]
      });

      return new ol.layer.Tile({
        title: title,
        visible: false,
        type: isBaselayer ? 'base' : 'overlay',
        source: grbSource,
        extent: this.mapProjection.getExtent()
      });
    },

    _createVectorLayer: function (options) {
      var vectorSource = new ol.source.Vector({});

      var textStyleFunction = function (feature, resolution) {
        //var text = (resolution < 3 && feature.get('name') ) ? feature.get('name') : '';
        var text = feature.get('name') ? feature.get('name') : '?';
        return new ol.style.Text({
          font: '10px Verdana',
          text: text,
          fill: new ol.style.Fill({
            color: options.color
          }),
          stroke: new ol.style.Stroke({
            color: '#fff',
            width: 3
          })
        });
      };

      var styleFunction = function (feature, resolution) {
        var type = feature.getGeometry().getType();
        var styleText = textStyleFunction(feature, resolution);

        var style;
        if (type == 'MultiPoint' || type == 'Point') {
          style = new ol.style.Style({
            image: new ol.style.Circle({
              radius: resolution < 3 ? 10 : 5,
              fill: new ol.style.Fill({
                color: options.color
              }),
              stroke: new ol.style.Stroke({
                color: options.color,
                width: 1
              })
            }),
            text: styleText
          })
        }
        else {
          style = new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: options.color,
              width: 1
            }),
            fill: new ol.style.Fill({
              color: options.fill
            }),
            text: styleText
          });
        }

        return [style];
      };

      return new ol.layer.Vector({
        title: options.title,
        source: vectorSource,
        style: styleFunction,
        type: 'overlay',
        visible: true
      });
    },

    getZone: function () {
      //create empty zone multiPolygon
      var multiPolygon = new ol.geom.MultiPolygon([], 'XY');

      //add all polygons and multiPolygons from zone layer
      array.forEach(this.zoneLayer.getSource().getFeatures(), function (feature) {
        var cloneGeom = feature.clone().getGeometry();
        if (cloneGeom instanceof ol.geom.Polygon) {
          multiPolygon.appendPolygon(cloneGeom);
        }
        else if (cloneGeom instanceof ol.geom.MultiPolygon) {
          array.forEach(cloneGeom.getPolygons(), function (polygon) {
            multiPolygon.appendPolygon(polygon);
          });
        }
      });

      if (multiPolygon.getCoordinates().length > 0) {

        //transform to geojson
        var geojson = this.geoJsonFormatter.writeGeometryObject(multiPolygon);
        //hack to add crs. todo: remove when https://github.com/openlayers/ol3/issues/2078 is fixed
        geojson.crs = {type: "name"};
        geojson.crs.properties = {
          "name": "urn:ogc:def:crs:EPSG::31370"
        };

        return geojson;
      }
      else {
        return null;
      }
    },

    setZone: function (geojson) {
      try {
        this.polygonStore.add({
          id: 'zone',
          naam: 'Zone',
          feature:  new ol.Feature({
            geometry: this.geoJsonFormatter.readGeometry(geojson),
            name: 'Zone'
          })
        });
      } catch (e) {
        console.warn("the zone was already added to the map!");
      }
    },

    getCenterOfExtent: function(Extent){
      var X = Extent[0] + (Extent[2]-Extent[0])/2;
      var Y = Extent[1] + (Extent[3]-Extent[1])/2;
      return [X, Y];
    },

    readGeomtryFromGeoJson: function(geoJson){
      var format = new ol.format.GeoJSON();
      return format.readGeometry(geoJson);
    },

    getFeatures: function () {
      return this.erfgoedFeatures;
    },

    _transformXyzToXy: function (xyzCoords) {
      var xyCoords = [];
      //make coordinates 'XY' instead of 'XYZ'. coordinates: Array.<Array.<Array.<ol.Coordinate>>>
      array.forEach(xyzCoords, function (level1) {
        var level1Array = [];
        xyCoords.push(level1Array);
        array.forEach(level1, function (level2) {
          var level2Array = [];
          level1Array.push(level2Array);
          array.forEach(level2, function (xyzCoords) {
            var xyArray = [xyzCoords[0], xyzCoords[1]];
            level2Array.push(xyArray);
          });
        });
      });
      return xyCoords;
    },


    transformExtent: function (extent, source, destination) {
      return ol.proj.transformExtent(extent, source, destination);
    },

    zoomToZone: function () {
      this.zoomToExtent(this.zoneLayer.getSource().getExtent());
    },

    zoomToExtent: function (extent) {
      this.olMap.getView().fitExtent(
        extent,
        /** @type {ol.Size} */ (this.olMap.getSize())
      );
    },

    zoomToFeatures: function () {
      var oeFeaturesSource = this.oeFeaturesLayer.getSource();
      this.zoomToExtent(oeFeaturesSource.getExtent());
    },

    zoomToPolygon: function (polygon) {
      this.zoomToExtent(polygon.getGeometry().getExtent());
    },

    startDraw: function (onEnd) {
      //console.debug('Mapcontroller::startDraw');
      this.popup.disable();
      this.drawLayer.getSource().clear();

      var drawInteraction = this.mapInteractions.draw;
      drawInteraction.setActive(true);

      this.mapInteractions.drawKey = drawInteraction.once('drawend', function (evt) {
        //console.debug('Mapcontroller::startDraw::drawend');
        var name = 'Polygoon ' + this._drawPolygonIndex++;
        evt.feature.setProperties({
          'name': name
        });
        this.polygonStore.put({id: name, naam: name, feature: evt.feature});
        window.setTimeout(lang.hitch(this, function () { //set timeout to prevent zoom after double click to end drawing
          this.stopDraw();
          this.popup.enable();
          onEnd();
        }, 0));
      }, this);
    },

    stopDraw: function () {
      this.drawLayer.getSource().clear();
      if (this.mapInteractions.draw.getActive()) {
        this.mapInteractions.draw.setActive(false);
      }
      if (this.mapInteractions.drawKey) {
        this.mapInteractions.draw.unByKey(this.mapInteractions.drawKey);
        this.mapInteractions.drawKey = null;
      }
      this.popup.enable();
    },

    startParcelSelect: function (onEnd) {
      this.popup.disable();

      var controller = this,
          map = this.olMap,
          popup = this.popup,
          perceelService = this.perceelService;

      var eventKey = map.on('click', function (evt) {
        map.unByKey(eventKey);
        perceelService.searchPerceel(evt.coordinate).then(function (wfsresponse) {
          var perceel = perceelService.readWfs(wfsresponse);
          controller.drawPerceel(perceel);
        }, function (err) {
          console.error(err);
        }).always(function () {
          onEnd();
          popup.enable();
        });
      });
      this.mapInteractions.selectParcelKey = eventKey;
    },

    stopParcelSelect: function () {
      if (this.mapInteractions.selectParcelKey) {
        this.olMap.unByKey(this.mapInteractions.selectParcelKey);
      }
      this.popup.enable();
    },

    startBeschermingSelect: function (onEnd) {
      this.popup.disable();

      var controller = this,
          map = this.olMap,
          popup = this.popup,
          projectionName = this.mapProjection.getCode(),
          beschermingService = this.beschermingService;

      var eventKey = map.on('click', function (evt) {
        map.unByKey(eventKey);
        beschermingService.searchBeschermingenGet(evt.coordinate, projectionName).then(
          function(result){
            var beschermingen = beschermingService.readWfs(result);
            array.forEach(beschermingen, function(bescherming) {
              controller.drawBescherming(bescherming);
            }, this);
          }, function (err) {
            console.error(err);
          }
        ).always(function () {
          onEnd();
          popup.enable();
        });
      });
      this.mapInteractions.selectBschermingKey = eventKey;
    },

    stopBeschermingSelect: function () {
      //console.debug('MapController::stopBeschermingSelect');
      if (this.mapInteractions.selectBschermingKey) {
        this.olMap.unByKey(this.mapInteractions.selectBschermingKey);
      }
      this.popup.enable();
    },

    stopAllEditActions: function () {
      this.stopDraw();
      this.stopParcelSelect();
      this.stopBeschermingSelect();
    },

    _createInteractions: function () {
      //console.debug("MapController::_createInteractions");
      var drawInteraction = new ol.interaction.Draw({
          source: this.drawLayer.getSource(),
          type: /** @type {ol.geom.GeometryType} */ ('Polygon')
      });
      this.olMap.addInteraction(drawInteraction);
      drawInteraction.setActive(false);

      this.mapInteractions = {
        draw: drawInteraction
      };
    },

    _createPopup: function () {
      this.popup = new Popup({
        map: this.olMap,
        layer: this.oeFeaturesLayer
      }, this.popupContainer);
    },

    _observePolygonStore: function (store) {
      store.on('delete', lang.hitch(this, function(event){
        console.debug("ROW delete", event.target);
        this._removePolygonFromZone(event.target.feature);
        if (event.target.id!='zone') {
          this.emit("zonechanged", {zone: this.getZone()});
        }
      }));
      store.on('add', lang.hitch(this, function(event){
        console.debug("Row add", event.target);
        this._addPolygonToZone(event.target.feature);
        if (event.target.id!='zone') {
          this.emit("zonechanged", {zone: this.getZone()});
        }
      }));
      store.on('update', lang.hitch(this, function(event){
        console.debug("Row 'update'", event.target);
        this._addPolygonToZone(event.target.feature);
        if (event.target.id!='zone') {
          this.emit("zonechanged", {zone: this.getZone()});
        }
      }));
    },

    _removePolygonFromZone: function (polygon) {
      this.zoneLayer.getSource().removeFeature(polygon);
    },

    _addPolygonToZone: function (polygon) {
      this.zoneLayer.getSource().addFeature(polygon);
    }
  });
});