'use strict';

describe('angular.Module', function() {
    /** @const */
    var originalService = Object.freeze({original: 'service'});

    /** @const */
    var overriddenService = Object.freeze({overridden: 'service'});


    it('should allow overriding non-constant services in the same module', function() {
        angular.module('aModule', [])
            .value('aService', originalService)
            .value('aService', overriddenService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(overriddenService);
        });
    });

    it('should allow overriding non-constant service from anothermodule', function() {
        angular.module('anotherModule', [])
            .value('aService', originalService);
        angular.module('aModule', ['anotherModule'])
            .value('aService', overriddenService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(overriddenService);
        });
    });

    it('should not allow overriding a constant service with a non-constant service in the same module', function() {
        angular.module('aModule', [])
            .constant('aService', originalService)
            .value('aService', overriddenService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(originalService);
        });
    });

    it('should not allow overriding a constant service from another module with a non-constant service', function() {
        angular.module('anotherModule', [])
            .constant('aService', originalService);
        angular.module('aModule', ['anotherModule'])
            .value('aService', overriddenService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(originalService);
        });
    });

    it('should not allow overriding a constant service with a constant service in the same module', function() {
        angular.module('aModule', [])
            .constant('aService', originalService)
            .constant('aService', overriddenService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(originalService);
        });
    });

    it('should allow overriding a constant service from another module', function() {
        angular.module('anotherModule', [])
            .constant('aService', originalService);
        angular.module('aModule', ['anotherModule'])
            .constant('aService', overriddenService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(overriddenService);
        });
    });

    it('should allow overriding a non-constant service from another module to be overridden wih a constant ' +
            'service', function() {
        angular.module('anotherModule', [])
            .value('aService', originalService);
        angular.module('aModule', ['anotherModule'])
            .constant('aService', overriddenService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(overriddenService);
        });
    });

    it('should not allow overriding a constant service from another module to be overridden with a non-constant ' +
            'service', function() {
        angular.module('anotherModule', [])
            .constant('aService', originalService);
        angular.module('aModule', ['anotherModule'])
            .value('aService', overriddenService);
        angular.mock.module('aModule');

        inject(function(aService) {
            expect(aService).toBe(originalService);
        });
    });

    it('should not allow a provider declared in the same module to be used in a module config function', function() {
        angular.module('aModule', [])
            .config(['myService', angular.noop])
            .provider('myService', {
                $get: function() {
                    return {};
                }
            });
        angular.mock.module('aModule');

        try {
            inject(['myService', angular.noop]);
        } catch (e) {
            expect(e instanceof Error).toBe(true);
            expect(e.message.indexOf('Unknown provider: myService') !== -1).toBe(true);
        }
    });

    it('should allow a constant declared in the same module to be used in a module config function', function() {
        var configFn = jasmine.createSpy();

        angular.module('aModule', [])
            .config(['aConstant', configFn])

            .constant('aConstant', 'aConstantValue');
        angular.mock.module('aModule');

        inject();

        expect(configFn).toHaveBeenCalled();
        expect(configFn).toHaveBeenCalledWith('aConstantValue');
    });

});