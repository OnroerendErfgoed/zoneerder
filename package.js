var miniExcludes = {
		"zoneerder/README.md": 1
	},
	amdExcludes = {
	},
	isJsRe = /\.js$/,
	isTestRe = /\/testspackage.json\//;

var profile = {
	resourceTags: {
		test: function(filename, mid){
			return isTestRe.test(filename);
		},

		miniExclude: function(filename, mid){
			return isTestRe.test(filename) || mid in miniExcludes;
		},

		amd: function(filename, mid){
			return isJsRe.test(filename) && !(mid in amdExcludes);
		}
	}
};