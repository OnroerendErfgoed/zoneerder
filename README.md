zoneerder
===========

Dojo widget met een configureerbare Openlayers 3 kaart.

Voorbeeld config:

```
    var zoneMapConfig = {
        buttons: {
            fullScreen: true,
            zoomInOut: true,
            zoomFullExtent: true,
            zoomGeolocation: true,
            rotate: true
        },
        sidebar: {
            layers: true,
            zoom: true,
            draw: true,
            help: true
        },
        tools: {
            selectBescherming: true,
            selectPerceel: true,
            drawPolygon: true,
            drawWKT: true
        },        
        onZoneClickPopup: true,
        historicLayers: true,
        erfgoedUrl: 'https://dev-geo.onroerenderfgoed.be/zoekdiensten/afbakeningen',
        niscodeUrl: 'https://dev-geo.onroerenderfgoed.be/zoekdiensten/administratievegrenzen',
        perceelUrl: 'https://geoservices.informatievlaanderen.be/overdrachtdiensten/GRB/wfs',
        crabpyUrl: 'https://dev-geo.onroerenderfgoed.be',
        beschermingUrl: 'https://dev-geo.onroerenderfgoed.be/geoserver/wms',
        beschermingWfsUrl: 'https://dev-geo.onroerenderfgoed.be/geoserver/wfs',
        ogcproxyUrl: 'https://dev-geo.onroerenderfgoed.be/ogcproxy?url='
    };
```
