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
    ggaLayer: false,
    historicLayers: null,
    defaultBaseLayer: null,
    _drawPolygonIndex: 1,
    _informatieVlaanderenAttribution: '© <a href="https://www.vlaanderen.be/digitaal-vlaanderen" ' +
      'title="Informatie Vlaanderen" class="copyrightLink copyAgiv"> Digitaal Vlaanderen</a>',

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

      this.geoJsonFormatterDefault =  new ol.format.GeoJSON({
      });

      map.addControl(new ol.control.ScaleLine());
      map.addControl(new ol.control.Attribution({
        collapsible: false
      }));

      this._createInteractions();
      this._createPopup();
      //map.on('moveend', this._onMoveEnd);

      this.zoomToExtent([16072, 128624, 272072, 256624]);
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
          projection: projection,
          extent: projection.getExtent()
        }),
        controls: ol.control.defaults({
          attribution: false,
          rotate: false,
          zoom: false
        }),
        logo: false
      });
    },

    transformGeometryToLambert: function(geometry){
      var geom = this.geoJsonFormatterDefault.readGeometry(geometry, {
        featureProjection: 'EPSG:31370'
      });
      return this.geoJsonFormatter.writeGeometry(geom);
    },

    transformBoundingboxToMapExtent: function(boundingbox) {
      var lowerleft = this.transformLatLonToPoint(boundingbox.lowerleft.lat, boundingbox.lowerleft.lon);
      var upperright = this.transformLatLonToPoint(boundingbox.upperright.lat, boundingbox.upperright.lon);
      return ([lowerleft.getCoordinates()[0], lowerleft.getCoordinates()[1],
        upperright.getCoordinates()[0], upperright.getCoordinates()[1]]);
    },

    transformLatLonToPoint: function(lat, lon) {
      var point = new ol.geom.Point([ lon, lat ]);
      return (point.transform('EPSG:4326', 'EPSG:31370'));
    },

    _createLayers: function(map) {
      /* base layers */
      var baseLayers = [];
      if (this.historicLayers) {
        baseLayers.push(this._createGrbLayer('ferraris', 'HISTCART', 'Ferraris',
          this.defaultBaseLayer === 'ferraris'));
        baseLayers.push(this._createGrbLayer('popp', 'HISTCART', 'Popp',
          this.defaultBaseLayer === 'popp'));
        baseLayers.push(this._createGrbLayer('vandermaelen', 'HISTCART', 'Vandermaelen',
          this.defaultBaseLayer === 'vandermaelen'));
        baseLayers.push(this._createGrbLayer('abw', 'HISTCART', 'Atlas der Buurtwegen',
          this.defaultBaseLayer === 'abw'));
      }
      // DHMV layers
      baseLayers.push(this._createGrbLayer('DHMV_II_HILL_25cm', 'DHMV', 'DHMV II, multidirectionale hillshade 0,25m',
        this.defaultBaseLayer === 'DHMV_II_HILL_25cm'));
      baseLayers.push(this._createGrbLayer('DHMV_II_SVF_25cm', 'DHMV', 'DHMV II, skyview factor 0,25m',
        this.defaultBaseLayer === 'DHMV_II_SVF_25cm'));
      // ORTHO layer
      baseLayers.push(this._createGrbLayer('omwrgbmrvl', 'OMWRGBMRVL', 'Orthofoto\'s',
        this.defaultBaseLayer === 'omwrgbmrvl'));
      // GEWESTPLAN layer
      baseLayers.push(this._createMercatorWmtsLayer('lu:lu_gwp_rv_raster', 'Gewestplan',
        this.defaultBaseLayer === 'gewestplan'));
      // GRB layers
      baseLayers.push(this._createGrbLayer('grb_bsk_grijs', 'GRB', 'GRB-Basiskaart in grijswaarden',
        this.defaultBaseLayer === 'grb_bsk_grijs'));
      baseLayers.push(this._createGrbLayer('grb_bsk', 'GRB', 'GRB-Basiskaart',
        this.defaultBaseLayer === 'grb_bsk'));

      map.addLayer(new ol.layer.Group({
        title: 'Basislagen',
        layers: baseLayers
      }));

      /* overlays */
      var grbTransTileLayer = this._createGrbWMSLayer('GRB_ADP_GRENS,GRB_GBG,GRB_SBN,GRB_TRN,GRB_WBN,GRB_WTZ,GRB_WLAS,GRB_KNW,' +
        'GRB_GBA,GRB_WGA,GRB_WVB,GRB_WGR,GRB_WGO,GRB_WLI,GRB_WTI,GRB_WRL,GRB_WRI,GRB_WPI,GRB_WKN,GRB_ADT,GRB_HNR_ADP,GRB_HNR_KNW,' +
        'GRB_HNR_GBG,GRB_WNM,GRB_SNM,GEM_GRENS', 'GRB-Basiskaart overlay', false);
      var grb_gbgTileLayer = this._createGrbWMSLayer('GRB_GBG', 'GRB-Gebouwenlaag', false);
      var grb_adpTileLayer = this._createGrbWMSLayer('GRB_ADP_GRENS', 'GRB-Percelenlaag', false);

      var beschermdWmsLayer = new ol.layer.Tile({
        title: "Beschermd Onroerend Erfgoed",
        extent: this.mapProjection.getExtent(),
        source: new ol.source.TileWMS(({
          url: this.beschermingUrl,
          params: {
            'LAYERS': 'vioe_geoportaal:bes_landschap,' +
              'vioe_geoportaal:bes_sd_gezicht,' +
              'vioe_geoportaal:bes_arch_site,' +
              'vioe_geoportaal:bes_monument,' +
              'vioe_geoportaal:bes_overgangszone,' +
              'vioe_geoportaal:erfgoedls',
            'TILED': true
          },
          attributions: [new ol.Attribution({
            html: '© <a href="https://www.onroerenderfgoed.be">Onroerend Erfgoed</a>'
          })]
        })),
        type: 'overlay',
        visible: false
      });

      var gebiedenGeenArcheologieLayer = new ol.layer.Tile({
        title: 'Gebieden geen archeologie',
        extent: this.mapProjection.getExtent(),
        source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */({
          url: this.beschermingUrl,
          params: { 'LAYERS': 'vioe_geoportaal:gga_gewestelijk,vioe_geoportaal:gga_gemeentelijk', 'TILED': true },
          attributions: [new ol.Attribution({
            html: '© <a href="https://www.onroerenderfgoed.be">Onroerend Erfgoed</a>'
          })]
        })),
        type: 'overlay',
        visible: !!this.ggaLayer
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
          gebiedenGeenArcheologieLayer,
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
        var xyCoords = this._transformXyzToXy(olFeature.getGeometry());
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
        url: '//tile.geofabrik.de/dccc92ba3f2a5a2c17189755134e6b1d/{z}/{x}/{y}.png',
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

    _createGrbLayer: function (grbLayerId, type, title, visible) {
      //retrieved with readCapabilties.html
      var resolutions = [1024,512,256,128,64,32,16,8,4,2,1,0.5,0.25,0.125,0.0625,0.03125];
      var matrixIds = ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15'];

      var grbSource = new ol.source.WMTS({
        url: '//geo.api.vlaanderen.be/' + type + '/wmts',
        layer: grbLayerId,
        matrixSet: 'BPL72VL',
        format: 'image/png',
        projection: this.mapProjection,
        style: grbLayerId == 'gewestplan' ? ',,,,,,,,,,' : '', //TODO: remove this fix after update gewestplan layer
        version: '1.0.0',
        tileGrid: new ol.tilegrid.WMTS({
          origin: ol.extent.getTopLeft(this.mapProjection.getExtent()),
          resolutions: resolutions,
          matrixIds: matrixIds
        }),
        attributions: [
          new ol.Attribution({
            html: this._informatieVlaanderenAttribution
          })
        ]
      });

      return new ol.layer.Tile({
        title: title,
        visible: visible,
        type: 'base',
        source: grbSource,
        extent: this.mapProjection.getExtent()
      });
    },

    _createMercatorWmtsLayer: function (layerId, title, visible) {
      //retrieved with readCapabilties.html
      var resolutions = [1024,512,256,128,64,32,16,8,4,2,1,0.5,0.25,0.125,0.0625,0.03125];
      var matrixIds = ['BPL72VL:0','BPL72VL:1','BPL72VL:2','BPL72VL:3','BPL72VL:4','BPL72VL:5','BPL72VL:6','BPL72VL:7','BPL72VL:8','BPL72VL:9','BPL72VL:10','BPL72VL:11','BPL72VL:12','BPL72VL:13','BPL72VL:14','BPL72VL:15'];

      var mercatorSource = new ol.source.WMTS({
        url: '//www.mercator.vlaanderen.be/raadpleegdienstenmercatorgeocachepubliek/service/wmts/',
        layer: layerId,
        matrixSet: 'BPL72VL',
        format: 'image/png',
        projection: this.mapProjection,
        requestEncoding: 'KVP',
        wrapX: false,
        tileGrid: new ol.tilegrid.WMTS({
          origin: ol.extent.getTopLeft(this.mapProjection.getExtent()),
          resolutions: resolutions,
          matrixIds: matrixIds,
          maxZoom: 15,
          minZoom: 0
        }),
        attributions: [
          new ol.Attribution({
            html: this._informatieVlaanderenAttribution
          })
        ]
      });

      return new ol.layer.Tile({
        title: title,
        visible: visible,
        type: 'base',
        source: mercatorSource,
        extent: this.mapProjection.getExtent()
      });
    },

    _createGrbWMSLayer: function(wmsLayers, title, isBaseLayer) {
      return new ol.layer.Tile({
        title: title,
        extent: this.mapProjection.getExtent(),
        source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
          url: '//geo.api.vlaanderen.be/GRB/wms',
          params: {'LAYERS': wmsLayers ,'TILED': true},
          serverType: 'geoserver'
        })),
        type: isBaseLayer ? 'base' : 'overlay',
        maxResolution: 2000,
        visible: false
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

    getZoneArea: function() {
      var area = 0;
      array.forEach(this.zoneLayer.getSource().getFeatures(), function (feature) {
        area += feature.getGeometry().getArea();
      });
      return area;
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

    _transformXyzToXy: function (geom) {
      console.debug('MapController::_transformXyzToXy', geom.getType(), geom.getLayout());
      var coords = geom.getCoordinates();
      if (geom.getLayout() === 'XYZ') {
        var xyCoords = [];
        // //make coordinates 'XY' instead of 'XYZ'. coordinates: Array.<Array.<ol.Coordinate>>
        array.forEach(coords, function (level1) {
          var level1Array = [];
          xyCoords.push(level1Array);
          array.forEach(level1, function (level2) {
            if (geom.getType() === 'Polygon') {
              level1Array.push([level2[0], level2[1]]);
            }
            else {
              var level2Array = [];
              level1Array.push(level2Array);
              array.forEach(level2, function (level3) {
                level2Array.push([level3[0], level3[1]]);
              });
            }
          });
        });
        if (geom.getType() === 'Polygon') {
          return [xyCoords];
        } else {
          return xyCoords;
        }
      } else {
        return coords;
      }
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

    startDraw: function () {
      //console.debug('Mapcontroller::startDraw');
      this.popup.disable();
      this.drawLayer.getSource().clear();

      var drawInteraction = this.mapInteractions.draw;
      drawInteraction.setActive(true);

      this.mapInteractions.drawKey = drawInteraction.on('drawend', function (evt) {
        //console.debug('Mapcontroller::startDraw::drawend');
        var name = 'Polygoon ' + this._drawPolygonIndex++;
        evt.feature.setProperties({
          'name': name
        });
        this.polygonStore.put({id: name, naam: name, feature: evt.feature});
        window.setTimeout(lang.hitch(this, function () { //set timeout to prevent zoom after double click to end drawing
          this.drawLayer.getSource().clear();
          this.popup.enable();
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

    startParcelSelect: function () {
      this.popup.disable();

      var controller = this,
        map = this.olMap,
        popup = this.popup,
        perceelService = this.perceelService;

      var eventKey = map.on('click', function (evt) {
        perceelService.searchPerceel(evt.coordinate).then(function (wfsresponse) {
          var perceel = perceelService.readWfs(wfsresponse);
          controller.drawPerceel(perceel);
        }, function (err) {
          console.error(err);
        }).always(function () {
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

    startBeschermingSelect: function () {
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
          var zone = this.getZone();
          var opp = this.getZoneArea();
          this.emit("zonechanged", {zone: zone, oppervlakte: opp});
        }
      }));
      store.on('add', lang.hitch(this, function(event){
        console.debug("Row add", event.target);
        this._addPolygonToZone(event.target.feature);
        if (event.target.id!='zone') {
          var zone = this.getZone();
          var opp = this.getZoneArea();
          this.emit("zonechanged", {zone: zone, oppervlakte: opp});
        }
      }));
      store.on('update', lang.hitch(this, function(event){
        console.debug("Row 'update'", event.target);
        this._addPolygonToZone(event.target.feature);
        if (event.target.id!='zone') {
          var zone = this.getZone();
          var opp = this.getZoneArea();
          this.emit("zonechanged", {zone: zone, oppervlakte: opp});
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