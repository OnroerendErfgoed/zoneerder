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
        erfgoedUrl: 'https://dev-geo.onroerenderfgoed.be/zoekdiensten/afbakeningen',
        perceelUrl: 'https://dev-geo.onroerenderfgoed.be/ogcproxy?url=https://geo.agiv.be/ogc/wfs/grb',
        crabpyUrl: 'https://dev-geo.onroerenderfgoed.be'
    };
```
