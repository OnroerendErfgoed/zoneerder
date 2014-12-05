var dojoConfig = {
    async: 1,
    cacheBust: 1,
    'routing-map': {
        pathPrefix: '',
        layers: {}
    },
    packages: [
        { name: 'dojo-form-controls', location: '../dojo-form-controls' },
        { name: 'mijit', location: '../mijit' },
        { name: 'zoneerder', location: '../src' },
        { name: 'crabpy_dojo', location: '../crabpy_dojo' },
        { name: 'ol3-dist', location: '../ol3-dist', main: 'ol' }
    ]
};