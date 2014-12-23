var dojoConfig = {
    async: 1,
    cacheBust: 0,
    'routing-map': {
        pathPrefix: '',
        layers: {}
    },
    packages: [
        { name: 'dojo-form-controls', location: '../dojo-form-controls' },
        { name: 'mijit', location: '../mijit' },
        { name: 'zoneerder', location: '..' },
        { name: 'crabpy_dojo', location: '../crabpy_dojo' },
        { name: 'ol', location: '../ol3-amd', main: 'ol' }
    ]
};