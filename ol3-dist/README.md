# OpenLayers 3 build voor de zoneerder
[doc](https://github.com/openlayers/ol3/tree/master/tasks)
[extra info](http://boundlessgeo.com/2014/10/openlayers-custom-builds-revisited/)

##builden:
```
cd <project dir>/zoneerder/ol3
node tasks/build.js ../ol3-dist/build.json  ../ol3-dist/ol-full.min.js
amd:
node tasks/build.js ../ol3-dist/amd-build.json  ../ol3-dist/ol.js
```

+ Copy the ol.css from ol3/css to the ol3-dist folder
