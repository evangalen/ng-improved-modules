describe('$provide', function() {
    'use strict';

    /** const */
    var knownMethods = ['provider', 'factory', 'service', 'value', 'constant', 'decorator'];

    var $provide;

    beforeEach(module('ng', ['$provide', function(_$provide_) {
        $provide = _$provide_;
    }]));

    beforeEach(function() {
        // trigger angular injector creation
        inject();
    });



    it('should only contain the methods: ' + knownMethods, function() {
        var ownEnumerablePropertyNames = getOwnEnumerablePropertyNames($provide);

        expect(ownEnumerablePropertyNames.length).toBe(knownMethods.length);
        for (var i = 0; i < knownMethods.length; i++) {
            expect(ownEnumerablePropertyNames.indexOf(knownMethods[i]) !== -1).toBe(true);
        }
    });



    function getOwnEnumerablePropertyNames(obj) {
        var result = [];

        for (var propertyName in obj) {
            if (obj.hasOwnProperty(propertyName)) {
                result.push(propertyName);
            }
        }

        return result;
    }

});
