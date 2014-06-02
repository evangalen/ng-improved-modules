describe('angular.Module', function() {
    'use strict';

    /** @const */
    var firstService = {first: angular.noop};

    /** @const */
    var secondService = {second: angular.noop};

    it('should allow overriding non-constant services in the same module', function() {
        angular.module('aModule', [])
            .value('aService', firstService)
            .value('aService', secondService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(secondService);
        });
    });

    it('should allow overriding non-constant service from anothermodule', function() {
        angular.module('anotherModule', [])
            .value('aService', firstService);
        angular.module('aModule', ['anotherModule'])
            .value('aService', secondService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(secondService);
        });
    });

    it('should not allow overriding a constant service with a non-constant service in the same module', function() {
        angular.module('aModule', [])
            .constant('aService', firstService)
            .value('aService', secondService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(firstService);
        });
    });

    it('should not allow overriding a constant service from another module with a non-constant service', function() {
        angular.module('anotherModule', [])
            .constant('aService', firstService);
        angular.module('aModule', ['anotherModule'])
            .value('aService', secondService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(firstService);
        });
    });

    it('should not allow overriding a constant service with a constant service in the same module', function() {
        angular.module('aModule', [])
            .constant('aService', firstService)
            .constant('aService', secondService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(firstService);
        });
    });

    it('should allow overriding a constant service from another module', function() {
        angular.module('anotherModule', [])
            .constant('aService', firstService);
        angular.module('aModule', ['anotherModule'])
            .constant('aService', secondService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(secondService);
        });
    });

    it('should allow overriding a non-constant service from another module to be overridden wih a constant ' +
            'service', function() {
        angular.module('anotherModule', [])
            .value('aService', firstService);
        angular.module('aModule', ['anotherModule'])
            .constant('aService', secondService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(secondService);
        });
    });

    it('should not allow overriding a constant service from another module to be overridden with a non-constant ' +
            'service', function() {
        angular.module('anotherModule', [])
            .constant('aService', firstService);
        angular.module('aModule', ['anotherModule'])
            .value('aService', secondService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(firstService);
        });
    });

});
