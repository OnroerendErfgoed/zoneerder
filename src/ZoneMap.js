define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    './MapController',
    './ButtonController',
    './sidebar/Sidebar',
    './services/ErfgoedService',
    'dojo/query',
    'dijit/form/Button',
    'dojo/dom-construct',
    "crabpy_dojo/CrabpyWidget",
    'dojo/NodeList-dom'

], function (declare, lang, array, WidgetBase, TemplatedMixin,
             MapController, ButtonController, Sidebar, ErfgoedService, query, Button, domConstruct, CrabpyWidget) {
    return declare([WidgetBase, TemplatedMixin], {
        templateString: '<div data-dojo-attach-point="mapNode" class="map sidebar-map">' +
                            '<div data-dojo-attach-point="sidebarNode"></div>' +
                        '</div>',

        mapController: null,

        config: null,

        erfgoedService: null,

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
                url: 'http://localhost:6544/afbakeningen'
            })
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
                var sidebar = new Sidebar({}, this.sidebarNode);
                query(".ol-attribution").addClass("sidebar-padding");

                sidebar.addTab('kaartlagen', 'Kaartlagen', 'layericon',
                    'Hier kan je kiezen welke lagen er op de kaart moeten getoond worden en welke niet.');

                sidebar.addTab('zoom', 'Zoom naar', 'zoomicon',
                    'Hier kan je naar een perceel of adres zoomen. Het is niet verplicht om alle velden in te vullen,' +
                        ' je kan bijvoorbeeld enkel een gemeente en straat kiezen en daar naar toe zoomen.');

                if (!this.config.readOnly) {
                    sidebar.addTab('zone', 'Bepaal zone', 'zoneicon', 'Baken een zone af voor het beheersplan');

                    var drawToolbar = new ol.control.DrawToolbar({
                        mapController: mapController,
                        target: document.getElementById('zonecontent')
                    });
                    drawToolbar.on('save', function (evt) {
                        evt.features.forEach(function (feature) {
                            mapController.geoJsonLayer.getSource().addFeature(feature);
                        });
                    });
                    drawToolbar.on('clear', function () {
                        mapController.geoJsonLayer.getSource().clear();
                    });
                    mapController.olMap.addControl(drawToolbar);
                }

                sidebar.addTab('help', 'Help', 'helpicon', 'help desc');
                sidebar.startup();

                var myButton = new Button({
                    label: "get features",
                    onClick: lang.hitch(this, function(){
                        var features = this.getFeaturesInZone();
                        array.forEach(features, function(feature) {
                            console.log(feature);
                        });
                    })
                });//, "helpcontent").startup();
                myButton.startup();
                domConstruct.place(myButton.domNode, "helpcontent");
                var myButton2 = new Button({
                    label: "set features",
                    onClick: lang.hitch(this, function(){
//                        var uriList = ['https://inventaris.onroerenderfgoed.be/erfgoed/node/dibe_geheel.25465'];
//                        this.setFeatures(uriList);
//                        var testfeature = {"id":"dibe_geheel.25465","type":"dibe_geheel","omschrijving":"Arbeiderswoningen, Blauwputgang","vastgesteld":true,"primaire_foto":{"id":120972,"sizes":{"small":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=small","medium":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=medium","full":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=full"}},"fotos":[{"id":120972,"label":"Blauwputgang_001_007_en_008_011 (Thomas, Hans, 28-10-2009, &#169;vlaamse gemeenschap)","sizes":{"small":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=small","medium":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=medium","full":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=full"}}],"locatie":{"provincie":"Vlaams-Brabant","gemeente":"Leuven","deelgemeente":"Leuven","straat":"Blauwputgang","omschrijving":"Blauwputgang 1-11 (Leuven)","geometry_center":{"type":"Point","coordinates":["4.71151634620906","50.8821039197682"]},"geometry":{"type":"MultiPolygon","coordinates":[[[["4.71131726565774","50.8822120240408"],["4.71151185623049","50.8822775277555"],["4.71172284919352","50.8820793205714"],["4.71160580140116","50.8820464919016"],["4.71164310241687","50.8819978303301"],["4.71167083614661","50.8819622495352"],["4.71161517448011","50.8819485776036"],["4.71161982026677","50.8819426219335"],["4.71163420614093","50.8819103074532"],["4.71157826395604","50.8818990724848"],["4.71155904522719","50.8819486879456"],["4.71152244709776","50.881943841822"],["4.71151087072727","50.8819678327628"],["4.71153574152198","50.8819760213517"],["4.7115266649318","50.8819843002904"],["4.71145332355543","50.8819683697105"],["4.7113960938094","50.8820706580554"],["4.71131726565774","50.8822120240408"]]]]}},"beschermingen":[{"id":"OB001042","link":{"type":"text\/html","href":"https:\/\/beschermingen.onroerenderfgoed.be\/object\/id\/OB001042\/"}}],"externe_links":[{"naam":"Blauwputgang, Leuven on Flickr - Photo Sharing!","link":{"type":"text\/html","href":"http:\/\/www.flickr.com\/photos\/erfgoed\/125910236"}},{"naam":"Blauwputgang, Leuven on Flickr - Photo Sharing!","link":{"type":"text\/html","href":"http:\/\/www.flickr.com\/photos\/erfgoed\/4115927184"}}],"primaire_tekst":{"id":128701,"titel":"blauwputgang (herinventarisatie)","tekst":"<p>Twee reeksen arbeidershuisjes (nummers 1-11) die dateren van rond 1850 en opgetrokken werden met twee bouwlagen en telkens twee travee\u00ebn, de deurtravee blind in de bovenbouw. Nrs. 1-4 en 9-11 zijn afgedekt door pannen lessenaarsdaken; nrs. 5-8 zijn opgevat als rug aan rug huizen, onder een pannen zadeldak. De deels verankerde bakstenen gevels zijn, behalve bij de recent gerenoveerde nrs. 1-4, witgekalkt boven een gepikte plint en afgelijnd door zinken gootlijsten onder een licht overkragende dakrand. De rechthoekige, al dan niet gekoppelde deuren en de vensters zijn voorzien van  - deels vernieuwde - houten bovendorpels en arduinen benedendorpels of lekdrempels.<\/p>\n\n<div><ul><li>Afdeling ROHM Vlaams-Brabant, Cel Monumenten en Landschappen: beschermingsdossier Blauwputgang\/Diestsestraat nr. 215 (M.B.  Stadsgezicht 23.07.1989).<\/li><\/ul><p><\/p>\n<ul><li> \nDE COOMAN M., <em>De Leuvense gangen<\/em>, onuitgegeven licentiaatverhandeling K.U.Leuven, 1980, p. 47-50.\n<\/li><\/ul><\/div>","datum":0,"auteurs":[{"id":133,"type":"persoon","omschrijving":"Mondelaers, Lydie"},{"id":214,"type":"persoon","omschrijving":"Verloove, Claartje"}]},"typologie":[{"id":29,"term":"arbeiderswoningen","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/typologie\/29"}},{"id":57,"term":"beluiken","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/typologie\/57"}}],"datering":[{"id":1065,"term":"derde kwart 19de eeuw","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/datering\/1065"}},{"id":1063,"term":"tweede kwart 19de eeuw","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/datering\/1063"}}],"relaties":[{"id":"bes_bescherming.1341","type":{"id":"RO","omschrijving":"is gerelateerd aan"},"omschrijving":"Arbeiderswoningen Blauwputgang en handelsgebouw","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/bes\/bescherming\/1341"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/bes_bescherming.1341.json"}]},{"id":"dibe_relict.42287","type":{"id":"RO","omschrijving":"is gerelateerd aan"},"omschrijving":"Stadswoning met toegang tot Blauwputgang","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/dibe\/relict\/42287"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/dibe_relict.42287.json"}]},{"id":"dibe_geheel.25353","type":{"id":"DV","omschrijving":"maakt deel uit van"},"omschrijving":"Blauwputgang","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/dibe\/geheel\/25353"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/dibe_geheel.25353.json"}]}],"korte_beschrijving":"Twee reeksen arbeidershuisjes (nummers 1-11) die dateren van rond 1850 en opgetrokken werden met twee bouwlagen en telkens twee travee\u00ebn, de deurtravee blind in de bovenbouw."};
                        var testfeature = {"id":"dibe_geheel.25465","type":"dibe_geheel","omschrijving":"Arbeiderswoningen, Blauwputgang","vastgesteld":true,"primaire_foto":{"id":120972,"sizes":{"small":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=small","medium":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=medium","full":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=full"}},"fotos":[{"id":120972,"label":"Blauwputgang_001_007_en_008_011 (Thomas, Hans, 28-10-2009, &#169;vlaamse gemeenschap)","sizes":{"small":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=small","medium":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=medium","full":"https:\/\/inventaris.onroerenderfgoed.be\/afbeeldingen\/120972?size=full"}}],"locatie":{"provincie":"Vlaams-Brabant","gemeente":"Leuven","deelgemeente":"Leuven","straat":"Blauwputgang","omschrijving":"Blauwputgang 1-11 (Leuven)","geometry_center":{"type":"Point","coordinates":["4.71151634620906","50.8821039197682"]},"geometry":{"type":"MultiPolygon","coordinates":[[[[4.71131726565774,50.8822120240408],[4.71151185623049,50.8822775277555],[4.71172284919352,50.8820793205714],[4.71160580140116,50.8820464919016],[4.71164310241687,50.8819978303301],[4.71167083614661,50.8819622495352],[4.71161517448011,50.8819485776036],[4.71161982026677,50.8819426219335],[4.71163420614093,50.8819103074532],[4.71157826395604,50.8818990724848],[4.71155904522719,50.8819486879456],[4.71152244709776,50.881943841822],[4.71151087072727,50.8819678327628],[4.71153574152198,50.8819760213517],[4.7115266649318,50.8819843002904],[4.71145332355543,50.8819683697105],[4.7113960938094,50.8820706580554],[4.71131726565774,50.8822120240408]]]]}},"beschermingen":[{"id":"OB001042","link":{"type":"text\/html","href":"https:\/\/beschermingen.onroerenderfgoed.be\/object\/id\/OB001042\/"}}],"externe_links":[{"naam":"Blauwputgang, Leuven on Flickr - Photo Sharing!","link":{"type":"text\/html","href":"http:\/\/www.flickr.com\/photos\/erfgoed\/125910236"}},{"naam":"Blauwputgang, Leuven on Flickr - Photo Sharing!","link":{"type":"text\/html","href":"http:\/\/www.flickr.com\/photos\/erfgoed\/4115927184"}}],"primaire_tekst":{"id":128701,"titel":"blauwputgang (herinventarisatie)","tekst":"<p>Twee reeksen arbeidershuisjes (nummers 1-11) die dateren van rond 1850 en opgetrokken werden met twee bouwlagen en telkens twee travee\u00ebn, de deurtravee blind in de bovenbouw. Nrs. 1-4 en 9-11 zijn afgedekt door pannen lessenaarsdaken; nrs. 5-8 zijn opgevat als rug aan rug huizen, onder een pannen zadeldak. De deels verankerde bakstenen gevels zijn, behalve bij de recent gerenoveerde nrs. 1-4, witgekalkt boven een gepikte plint en afgelijnd door zinken gootlijsten onder een licht overkragende dakrand. De rechthoekige, al dan niet gekoppelde deuren en de vensters zijn voorzien van  - deels vernieuwde - houten bovendorpels en arduinen benedendorpels of lekdrempels.<\/p>\n\n<div><ul><li>Afdeling ROHM Vlaams-Brabant, Cel Monumenten en Landschappen: beschermingsdossier Blauwputgang\/Diestsestraat nr. 215 (M.B.  Stadsgezicht 23.07.1989).<\/li><\/ul><p><\/p>\n<ul><li> \nDE COOMAN M., <em>De Leuvense gangen<\/em>, onuitgegeven licentiaatverhandeling K.U.Leuven, 1980, p. 47-50.\n<\/li><\/ul><\/div>","datum":0,"auteurs":[{"id":133,"type":"persoon","omschrijving":"Mondelaers, Lydie"},{"id":214,"type":"persoon","omschrijving":"Verloove, Claartje"}]},"typologie":[{"id":29,"term":"arbeiderswoningen","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/typologie\/29"}},{"id":57,"term":"beluiken","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/typologie\/57"}}],"datering":[{"id":1065,"term":"derde kwart 19de eeuw","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/datering\/1065"}},{"id":1063,"term":"tweede kwart 19de eeuw","link":{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/thesaurus\/datering\/1063"}}],"relaties":[{"id":"bes_bescherming.1341","type":{"id":"RO","omschrijving":"is gerelateerd aan"},"omschrijving":"Arbeiderswoningen Blauwputgang en handelsgebouw","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/bes\/bescherming\/1341"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/bes_bescherming.1341.json"}]},{"id":"dibe_relict.42287","type":{"id":"RO","omschrijving":"is gerelateerd aan"},"omschrijving":"Stadswoning met toegang tot Blauwputgang","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/dibe\/relict\/42287"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/dibe_relict.42287.json"}]},{"id":"dibe_geheel.25353","type":{"id":"DV","omschrijving":"maakt deel uit van"},"omschrijving":"Blauwputgang","links":[{"type":"text\/html","href":"https:\/\/inventaris.onroerenderfgoed.be\/dibe\/geheel\/25353"},{"type":"application\/json","href":"https:\/\/inventaris.onroerenderfgoed.be\/erfgoed\/node\/dibe_geheel.25353.json"}]}],"korte_beschrijving":"Twee reeksen arbeidershuisjes (nummers 1-11) die dateren van rond 1850 en opgetrokken werden met twee bouwlagen en telkens twee travee\u00ebn, de deurtravee blind in de bovenbouw."};
                        this.setFeatures([testfeature]);

                    })
                });
                domConstruct.place(myButton2.domNode, "helpcontent");
                myButton2.startup();
            }
        },

        getZone: function () {
            return this.mapController.getZone();
        },

        setZone: function (val) {
            this.mapController.setZone(val);
        },

        getFeaturesInZone: function () {
            var features = this.erfgoedService.searchErfgoedFeatures(this.mapController.getZone());
            this.mapController.drawErfgoedFeatures(features);

            //return light objects for list
            return array.map(features, function(feature){
                var returnObject = {};
                returnObject.id = feature.id;
                returnObject.naam = feature.naam;
                returnObject.uri = feature.uri;
                return returnObject;
            });
        },

        setFeatures: function(features) {
            //https://inventaris.onroerenderfgoed.be/erfgoed/node/dibe_geheel.25465
            array.forEach(features, lang.hitch(this, function (feature) {
                console.log(feature);
                var geojson = feature.locatie.geometry;
               //hack to add crs. todo: remove when https://github.com/openlayers/ol3/issues/2078 is fixed
                geojson.crs = {type: "name"};
                geojson.crs.properties =  {
                    "name": "urn:ogc:def:crs:EPSG::4326"
                };
                this.mapController.drawErfgoedGeom(geojson);
            }));
        }

    });
});
