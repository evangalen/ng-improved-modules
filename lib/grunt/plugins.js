var util = require('./utils.js');

module.exports = function(grunt) {

    grunt.registerMultiTask('build', 'build JS files', function(){
        util.build.call(util, this.data, this.async());
    });


    grunt.registerTask('buildall', 'build all the JS files in parallel', function(){
        var builds = grunt.config('build');
        builds = Object.keys(builds).map(function(key){ return builds[key]; });
        grunt.util.async.forEach(builds, util.build.bind(util), this.async());
    });
};
