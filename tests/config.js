var dojoConfig = {
  async: 1,
  cacheBust: 0,
  'routing-map': {
    pathPrefix: '',
    layers: {}
  },
  packages: [
    { name: 'dijit', location: '../dijit' },
    { name: 'zoneerder', location: '..' },
    { name: 'crabpy_dojo', location: '../crabpy_dojo' },
    { name: 'ol', location: '../ol', main: 'ol-debug' }
  ]
};