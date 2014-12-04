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
        erfgoedUrl: 'http://localhost:6545/afbakeningen', //TODO: change to dev when available
        perceelUrl: 'http://localhost:6543/ogcproxy?url=https://geo.agiv.be/ogc/wfs/grb'
    }
```
