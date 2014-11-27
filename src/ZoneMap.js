define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'mijit/_WidgetBase',
    'mijit/_TemplatedMixin',
    './MapController',
    './ButtonController',
    './sidebar/Sidebar',
    './services/ErfgoedService',
    './services/PerceelService',
    'dojo/query',
    'dojo-form-controls/Button',
    'dojo/dom-construct',
    'dojo/Evented',
    'crabpy_dojo/CrabpyWidget',
    'dojo/NodeList-dom'

], function (declare, lang, array, WidgetBase, TemplatedMixin, MapController, ButtonController, Sidebar,
             ErfgoedService, PerceelService, query, Button, domConstruct, Evented, CrabpyWidget) {
    return declare([WidgetBase, TemplatedMixin, Evented], {
        templateString: '<div data-dojo-attach-point="mapNode" class="map sidebar-map">' +
                            '<div data-dojo-attach-point="sidebarNode"></div>' +
                        '</div>',

        mapController: null,

        config: null,

        erfgoedService: null,

        perceelService: null,

        zone: null,

        postMixInProperties: function () {
            this.inherited(arguments);
        },

        buildRendering: function () {
            this.inherited(arguments);
        },

        postCreate: function () {
            this.inherited(arguments);
            //Set default config
            if (!this.config) this.config = {};
            this._setDefaultParam(this.config, "readOnly", true);
            this._setDefaultParam(this.config, "buttons", {});
            this._setDefaultParam(this.config.buttons, "buttons", {});
            this._setDefaultParam(this.config, "sidebar", false);

            this.erfgoedService = new ErfgoedService({
                url: 'http://localhost:6545/afbakeningen'  //todo: move to config & change to dev version
            });
            this.perceelService = new PerceelService({
                url: 'http://localhost:6543/ogcproxy?url=https://geo.agiv.be/ogc/wfs/grb'  //todo: move to config & change to dev version
//                url: 'https://dev-geo.onroerenderfgoed.be/ogcproxy?url=https://geo.agiv.be/ogc/wfs/grb'
            });
        },

        _setDefaultParam: function(object, field, defValue){
            if (!lang.exists(field, object)){
                lang.setObject(field, defValue, object);
            }
        },

        startup: function () {
            this.inherited(arguments);

            var mapController = new MapController({
                mapContainer: this.mapNode,
                readOnly: this.config.readOnly
            });
            this.mapController = mapController;
            mapController.startup();

            var buttonController = new ButtonController({
                map: mapController.olMap,
                fullExtent: mapController.fullExtent,
                mapButtons: this.config.buttons
            });
            buttonController.startup();

            if (this.config.sidebar) {
                this._createSidebar(this.sidebarNode);
            }
        },

        resize: function() {
            this.mapController.olMap.updateSize();
        },

        getZone: function () {
            return this.zone;
        },

        setZone: function (val) {
            this.mapController.setZone(val);
            this.zone = this.mapController.getZone();
            this.mapController.zoomToZone();
        },

        getFeaturesInZone: function () {
            var promise = this.erfgoedService.searchErfgoedFeatures(this.mapController.getZone());
            return promise.then(function (data) {
                var features = JSON.parse(data);
                return array.map(features, function(feature){
                    return {
                        id: feature.id,
                        naam: feature.naam,
                        uri: feature.uri
                    };
                });
            });
        },

        setFeatures: function(features) {
            this.mapController.clearFeatures();
            array.forEach(features, lang.hitch(this, function (feature) {
                var geojson = feature.locatie.geometry;
                //hack to set correct casing for geometry types (camelcase)
                //TODO: remove when fixed in inventaris, ex:
                // https://inventaris.onroerenderfgoed.be/dibe/relict/4877
                var upperType = feature.locatie.geometry.type.toUpperCase();
                if (upperType == 'MULTIPOINT') {
                    feature.locatie.geometry.type = 'MultiPoint';
                }
                else if (upperType == 'MULTIPOLYGON') {
                    feature.locatie.geometry.type = 'MultiPolygon';
                }

                //hack to add crs. todo: remove when https://github.com/openlayers/ol3/issues/2078 is fixed
                geojson.crs = {type: "name"};
                geojson.crs.properties =  {
                    "name": "urn:ogc:def:crs:EPSG::4326"
                };
                this.mapController.drawErfgoedGeom(geojson, feature.id);
            }));
        },

        _createSidebar:function(node) {
           var sidebar = new Sidebar({}, node);
            query(".ol-attribution").addClass("sidebar-padding");

            sidebar.addTab('kaartlagen', 'Kaartlagen', 'layericon',
                'Hier kan je kiezen welke lagen er op de kaart moeten getoond worden en welke niet.');

            var layerSwitcher = new ol.control.LayerSwitcher({
                target: document.getElementById('kaartlagencontent')
            });
            this.mapController.olMap.addControl(layerSwitcher);

            sidebar.addTab('zoom', 'Zoom naar', 'zoomicon',
                'Hier kan je naar een perceel of adres zoomen (je moet minstens een gemeente kiezen).');

            var crabpyWidget = new CrabpyWidget({
                name: "location",
                baseUrl: "https://dev-geo.onroerenderfgoed.be" //todo: move to config
            });

            var crabNode = domConstruct.create("div");
            domConstruct.place(crabNode, "zoomcontent");
            var crabZoomer = crabpyWidget.createCrabZoomer(crabNode);
            var self = this;
            var zoomButton = new Button({
                label: "Zoom naar adres",
                class: "sidebar-button",
                onClick: function(){
                    var bbox = crabZoomer.getBbox();
                    if (bbox) {
                        var extent = ol.proj.transformExtent(bbox, 'EPSG:31370', 'EPSG:900913');
                        self.mapController.zoomToExtent(extent);
                        crabZoomer.reset();
                        sidebar.close();
                    }
                }
            });
            domConstruct.place(zoomButton.domNode, "zoomcontent");

            var capakeyNode = domConstruct.create("div");
            domConstruct.place(capakeyNode, "zoomcontent");
            var capakeyZoomer = crabpyWidget.createCapakeyZoomer(capakeyNode);
            var capakeyZoomButton = new Button({
                label: "Zoom naar perceel",
                class: "sidebar-button",
                onClick: function(){
                    var bbox = capakeyZoomer.getBbox();
                    if (bbox) {
                        var extent = ol.proj.transformExtent(bbox, 'EPSG:31370', 'EPSG:900913');
                        self.mapController.zoomToExtent(extent);
                        capakeyZoomer.reset();
                        sidebar.close();
                    }
                }
            });
            domConstruct.place(capakeyZoomButton.domNode, "zoomcontent");

            if (!this.config.readOnly) {
                sidebar.addTab('zone', 'Bepaal zone', 'zoneicon', 'Baken een zone af voor het beheersplan. ' +
                    'Je kan één of meerdere polygonen intekenen en/of percelen selecteren.');

                var drawTitle = domConstruct.create("h3",{innerHTML: "Polygoon tekenen:"});
                domConstruct.place(drawTitle, "zonecontent");

                var toolbarNode = domConstruct.create("div");
                domConstruct.place(toolbarNode, "zonecontent");

                var drawToolbar = new ol.control.DrawToolbar({
                    mapController: self.mapController,
                    target: toolbarNode
                });
                drawToolbar.on('save', function (evt) {
                    evt.features.forEach(function (feature) {
                        self.mapController.geoJsonLayer.getSource().addFeature(feature);
                    });
                });
                drawToolbar.on('clear', function () {
                    self.mapController.geoJsonLayer.getSource().clear();
                });
                self.mapController.olMap.addControl(drawToolbar);

                var parcelTitle = domConstruct.create("h3",{innerHTML: "Perceel selecteren:"});
                domConstruct.place(parcelTitle, "zonecontent");

                var parcelButton = new Button({
                    label: "Selecteer perceel",
                    class: "sidebar-button",
                    onClick: lang.hitch(this, function(){
                        var controller = this.mapController;
                        var perceelService = this.perceelService;
                        var map = controller.olMap;
                        var eventKey = map.on('click', function(evt) {
                            map.unByKey(eventKey);
                            perceelService.searchPerceel(evt.coordinate).then(function(wfsresponse) {
                                var perceel = perceelService.readWfs(wfsresponse);
                                controller.drawPerceel(perceel);
                            }, function (err) {
                                console.error(err);
                            })
                        });
                    })
                });
                domConstruct.place(parcelButton.domNode, "zonecontent");

                var buttonNode = domConstruct.create("div", {class: "button-bar"});
                domConstruct.place(buttonNode, "zonecontent");
                var saveButton = new Button({
                    label: "Zone bewaren",
                    class: "sidebar-button",
                    onClick: lang.hitch(this, function(){
                        var zone = this.mapController.getZone();
                        if (zone) {
                            this.zone = zone;
                            this.emit("zonechanged", zone);
                        }
                        else {
                            alert("Er is nog geen zone beschikbaar om op te slaan.");
                        }
                    })
                });
                domConstruct.place(saveButton.domNode, buttonNode);

                var deleteButton = new Button({
                    label: "Zone verwijderen",
                    class: "sidebar-button",
                    onClick: lang.hitch(this, function(){
                        this.mapController.geoJsonLayer.getSource().clear();
                        this.zone = null;
                        this.emit("zonechanged", null);
                    })
                });
                domConstruct.place(deleteButton.domNode, buttonNode);
            }

            sidebar.addTab('help', 'Help', 'helpicon', 'help desc');
            var myButton = new Button({
                label: "get features",
                onClick: lang.hitch(this, function(){
                    this.getFeaturesInZone().then(function (features){
                        console.log("Click callback");
                        console.log(features);
                    });
                })
            });
            domConstruct.place(myButton.domNode, "helpcontent");
            myButton.startup();
            var myButton2 = new Button({
                label: "set features",
                onClick: lang.hitch(this, function(){
                    var testfeature1 = {"id":"dibe_geheel.25465","type":"dibe_geheel","omschrijving":"Arbeiderswoningen, Blauwputgang","vastgesteld":true,"primaire_foto":{"id":120972,"sizes":{"small":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=small","medium":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=medium","full":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=full"}},"fotos":[{"id":120972,"label":"Blauwputgang_001_007_en_008_011 (Thomas, Hans, 28-10-2009, &#169;vlaamse gemeenschap)","sizes":{"small":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=small","medium":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=medium","full":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=full"}}],"locatie":{"provincie":"Vlaams-Brabant","gemeente":"Leuven","deelgemeente":"Leuven","straat":"Blauwputgang","omschrijving":"Blauwputgang 1-11 (Leuven)","geometry_center":{"type":"Point","coordinates":["4.71151634620906","50.8821039197682"]},"geometry":{"type":"MultiPolygon","coordinates":[[[[4.71131726565774,50.8822120240408],[4.71151185623049,50.8822775277555],[4.71172284919352,50.8820793205714],[4.71160580140116,50.8820464919016],[4.71164310241687,50.8819978303301],[4.71167083614661,50.8819622495352],[4.71161517448011,50.8819485776036],[4.71161982026677,50.8819426219335],[4.71163420614093,50.8819103074532],[4.71157826395604,50.8818990724848],[4.71155904522719,50.8819486879456],[4.71152244709776,50.881943841822],[4.71151087072727,50.8819678327628],[4.71153574152198,50.8819760213517],[4.7115266649318,50.8819843002904],[4.71145332355543,50.8819683697105],[4.7113960938094,50.8820706580554],[4.71131726565774,50.8822120240408]]]]}},"beschermingen":[{"id":"OB001042","link":{"type":"text\/html","href":"https:\/\/beschermingen.onroerenderfgoed.be\/object\/id\/OB001042\/"}}],"externe_links":[{"naam":"Blauwputgang, Leuven on Flickr - Photo Sharing!","link":{"type":"text\/html","href":"http:\/\/www.flickr.com\/photos\/erfgoed\/125910236"}},{"naam":"Blauwputgang, Leuven on Flickr - Photo Sharing!","link":{"type":"text\/html","href":"http:\/\/www.flickr.com\/photos\/erfgoed\/4115927184"}}],"primaire_tekst":{"id":128701,"titel":"blauwputgang (herinventarisatie)","tekst":"<p>Twee reeksen arbeidershuisjes (nummers 1-11) die dateren van rond 1850 en opgetrokken werden met twee bouwlagen en telkens twee travee\u00ebn, de deurtravee blind in de bovenbouw. Nrs. 1-4 en 9-11 zijn afgedekt door pannen lessenaarsdaken; nrs. 5-8 zijn opgevat als rug aan rug huizen, onder een pannen zadeldak. De deels verankerde bakstenen gevels zijn, behalve bij de recent gerenoveerde nrs. 1-4, witgekalkt boven een gepikte plint en afgelijnd door zinken gootlijsten onder een licht overkragende dakrand. De rechthoekige, al dan niet gekoppelde deuren en de vensters zijn voorzien van  - deels vernieuwde - houten bovendorpels en arduinen benedendorpels of lekdrempels.<\/p>\n\n<div><ul><li>Afdeling ROHM Vlaams-Brabant, Cel Monumenten en Landschappen: beschermingsdossier Blauwputgang\/Diestsestraat nr. 215 (M.B.  Stadsgezicht 23.07.1989).<\/li><\/ul><p><\/p>\n<ul><li> \nDE COOMAN M., <em>De Leuvense gangen<\/em>, onuitgegeven licentiaatverhandeling K.U.Leuven, 1980, p. 47-50.\n<\/li><\/ul><\/div>","datum":0,"auteurs":[{"id":133,"type":"persoon","omschrijving":"Mondelaers, Lydie"},{"id":214,"type":"persoon","omschrijving":"Verloove, Claartje"}]},"typologie":[{"id":29,"term":"arbeiderswoningen","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/typologie\/29"}},{"id":57,"term":"beluiken","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/typologie\/57"}}],"datering":[{"id":1065,"term":"derde kwart 19de eeuw","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/datering\/1065"}},{"id":1063,"term":"tweede kwart 19de eeuw","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/datering\/1063"}}],"relaties":[{"id":"bes_bescherming.1341","type":{"id":"RO","omschrijving":"is gerelateerd aan"},"omschrijving":"Arbeiderswoningen Blauwputgang en handelsgebouw","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/bes\/bescherming\/1341"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/bes_bescherming.1341.json"}]},{"id":"dibe_relict.42287","type":{"id":"RO","omschrijving":"is gerelateerd aan"},"omschrijving":"Stadswoning met toegang tot Blauwputgang","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/dibe\/relict\/42287"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/dibe_relict.42287.json"}]},{"id":"dibe_geheel.25353","type":{"id":"DV","omschrijving":"maakt deel uit van"},"omschrijving":"Blauwputgang","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/dibe\/geheel\/25353"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/dibe_geheel.25353.json"}]}],"korte_beschrijving":"Twee reeksen arbeidershuisjes (nummers 1-11) die dateren van rond 1850 en opgetrokken werden met twee bouwlagen en telkens twee travee\u00ebn, de deurtravee blind in de bovenbouw."};
                    var testfeature2 = {"id":"dibe_relict.4877","type":"dibe_relict","omschrijving":"Hoekhuis Ghulden Roose","vastgesteld":true,"primaire_foto":{"id":20712,"sizes":{"small":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/20712?size=small","medium":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/20712?size=medium","full":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/20712?size=full"}},"fotos":[{"id":20712,"label":"Antwerpen Bredestraat 2 (Pauwels, Oswald, 01-01-1992, &#169;Vlaamse Gemeenschap)","sizes":{"small":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/20712?size=small","medium":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/20712?size=medium","full":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/20712?size=full"}},{"id":37867,"label":"BREDESTR_02 (Vandevorst, Kris, 01-01-2006, &#169;VIOE)","sizes":{"small":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/37867?size=small","medium":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/37867?size=medium","full":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/37867?size=full"}}],"locatie":{"provincie":"Antwerpen","gemeente":"Antwerpen","deelgemeente":"Antwerpen","straat":"Bredestraat_AN","omschrijving":"Bredestraat_AN 2, Antwerpen (Antwerpen)","geometry_center":{"type":"Point","coordinates":[4.4020653517011,51.215194340337]},"geometry":{"type":"Multipoint","coordinates":[[4.4020653517011,51.215194340337]]}},"beschermingen":[{"id":"OA002146","link":{"type":"text\/html","href":"https:\/\/beschermingen.onroerenderfgoed.be\/object\/id\/OA002146\/"}},{"id":"OA002151","link":{"type":"text\/html","href":"https:\/\/beschermingen.onroerenderfgoed.be\/object\/id\/OA002151\/"}}],"primaire_tekst":{"id":4877,"titel":"Hoekhuis, vml. z.g. \"Ghulden Roose\"","tekst":"  <p>* Nr. 2. Voormalige woning z.g. \"Ghulden Roose\". Hoekhuis  (Happaertstraat nr. 40) van drie trav. en drie bouwl. afgedekt met  zadeldak (Vlaamse pannen, n \u22a5 straat); oudste vermelding in 1564.  Trapgevel in traditionele bak- en zandsteenstijl (zes tr. + aanzet van  overhoeks topstuk), grotendeels verborgen achter reclameborden. Alleen de  top is zichtbaar: drie rechth., wigvormig ontlaste vensters - het  middelste met latei op consooltjes - en een gedicht luik. Oudere foto's  tonen ons een gecementeerde gevel met winkelpui uit XIX en rechth.  aangepaste vensters op doorlopende lekdrempels. Zijgevel Happaertstraat:  bakstenen lijstgevel van vijf trav. en drie bouwl.; sporen van speklagen  en ankers met gekrulde spie. Boven de holronde zandstenen daklijst, een  getrapte dakkapel (drie tr. + restant van topstuk) met schouderstukken  waarin rechth. venster met waterlijst (fig. 23).<\/p>   ","datum":0,"auteurs":[{"id":104,"type":"persoon","omschrijving":"Manderyck, Madeleine"},{"id":101,"type":"persoon","omschrijving":"Plomteux, Greet"},{"id":102,"type":"persoon","omschrijving":"Steyaert, Rita"}]},"typologie":[{"id":409,"term":"stadswoningen","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/typologie\/409"}}],"datering":[{"id":16,"term":"16de eeuw","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/datering\/16"}},{"id":19,"term":"19de eeuw","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/datering\/19"}}],"stijl":[{"id":1,"term":"traditioneel","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/stijl\/1"}}],"relaties":[{"id":"dibe_geheel.12849","type":{"id":"DV","omschrijving":"maakt deel uit van"},"omschrijving":"Bredestraat (Antwerpen)","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/dibe\/geheel\/12849"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/dibe_geheel.12849.json"}]}],"korte_beschrijving":"  * Nr. 2. Voormalige woning z.g. \"Ghulden Roose\". Hoekhuis  (Happaertstraat nr. 40) van drie trav. en drie bouwl. afgedekt met  zadeldak (Vlaamse pannen, n \u22a5 straat); oudste vermelding in 1564.  Trapgevel in traditionele bak- en zandsteenstijl (zes tr. + aanzet van  overhoeks topstuk), grotendeels verborgen achter reclameborden. Alleen de  top is zichtbaar: drie rechth., wigvormig ontlaste venst"};
                    this.setFeatures([testfeature2, testfeature1]);
                    this.mapController.zoomToFeatures();

                })
            });
            domConstruct.place(myButton2.domNode, "helpcontent");
            myButton2.startup();

            sidebar.startup();
        }

    });
});
