describe('moduleIntrospector service', function() {
    'use strict';

    //TODO: remove once "module.prefix" + "module.suffix" is used
    /** @const */
    var serviceRegistrationMethodNames = ['provider', 'factory', 'service', 'value', 'constant'];

    var moduleInvokeQueueItemInfoExtractor;

    beforeEach(module('ngModuleIntrospector', function($provide) {
        moduleInvokeQueueItemInfoExtractor = {
            findInvokeQueueItemInfo: jasmine.createSpy()
        };

        $provide.value('moduleInvokeQueueItemInfoExtractor', moduleInvokeQueueItemInfoExtractor);
    }));

    var moduleIntrospectorFactory;

    beforeEach(inject(function(_moduleIntrospector_) {
        moduleIntrospectorFactory = _moduleIntrospector_;
    }));

    /** @const */
    var anotherService = {};

    /** @const */
    var ngModule = angular.module('ng');

    var moduleInstance;
    var moduleIntrospector;
    var injector;

    beforeEach(function() {
        moduleInstance = angular.module('aModule', [])
            .value('anotherService', anotherService);
        moduleIntrospector = moduleIntrospectorFactory('aModule');
        injector = angular.injector(['ng', 'aModule']);
    });



    describe('getServiceDeclaration method', function() {

        it('should throw exception for non-existing service', function() {
            expect(function() {
                moduleIntrospector.getServiceDeclaration('aNonExistingService');
            }).toThrow('Could not find service with name: aNonExistingService');
        });

        it('should throw exception for non-overridden built-in (from "ng" module) service', function() {
            expect(function() {
                moduleIntrospector.getServiceDeclaration('$http');
            }).toThrow('Could not find declaration of service with name: $http');
        });

        it('should return declared service', function() {
            var service = {a: 'service'};

            moduleInstance.value('aService', service);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andReturn({module: moduleInstance, providerMethod: 'value', declaration: service});

            var result = moduleIntrospector.getServiceDeclaration('aService');

            expect(result).toEqual({module: moduleInstance, providerMethod: 'value', declaration: service});

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo)
                .toHaveBeenCalledWith(moduleInstance, '$provide', serviceRegistrationMethodNames, 'aService');
        });
    });



    describe('getServiceDependencies method', function() {

        it('should throw exception for non-existing service', function() {
            expect(function() {
                moduleIntrospector.getServiceDependencies(injector, 'aNonExistingService');
            }).toThrow('Could not find service with name: aNonExistingService');
        });

        it('should throw exception for non-overridden built-in (from "ng" module) service', function() {
            expect(function() {
                moduleIntrospector.getServiceDependencies(injector, '$http');
            }).toThrow('Could not find declaration of service with name: $http');
        });

        it('should return dependencies for service', function() {
            var serviceFactory = ['anotherService', '$http', function() {
                return {};
            }];

            moduleInstance.factory('aService', serviceFactory);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andCallFake(function(module, providerName, providerMethods, itemName) {
                    if (itemName === 'aService') {
                        return {module: module, providerMethod: 'factory', declaration: serviceFactory};
                    } else if (itemName === 'anotherService') {
                        return {module: module, providerMethod: 'value', declaration: anotherService};
                    }
                });

            var result = moduleIntrospector.getServiceDependencies(injector, 'aService');

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls.length).toBe(3);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[0].args)
                .toEqual([moduleInstance, '$provide', serviceRegistrationMethodNames, 'aService']);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[1].args)
                .toEqual([moduleInstance, '$provide', serviceRegistrationMethodNames, 'anotherService']);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[2].args)
                .toEqual([moduleInstance, '$provide', serviceRegistrationMethodNames, '$http']);

            expect(result).toBeDefined();
            expect(Object.getOwnPropertyNames(result).length).toBe(2);
            expect(result.anotherService).toEqual({module: moduleInstance, instance: anotherService});
            expect(result.$http).toEqual({module: ngModule, instance: injector.get('$http')});
        });
    });



    describe('getFilterDependencies method', function() {

        it('should throw exception for non-existing filter', function() {
            expect(function() {
                moduleIntrospector.getFilterDependencies(injector, 'aNonExistingFilter');
            }).toThrow('Could not find filter with name: aNonExistingFilter');
        });

        it('should throw exception for non-overridden built-in (from "ng" module) filter', function() {
            expect(function() {
                moduleIntrospector.getFilterDependencies(injector, 'currency');
            }).toThrow('Could not find declaration of filter with name: currency');
        });

        it('should return dependencies for filter', function() {
            var filterFactory = ['anotherService', '$http', function() {
                return function() {};
            }];

            moduleInstance.filter('aFilter', filterFactory);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andCallFake(function(module, providerName, providerMethods, itemName) {
                    if (itemName === 'aFilter') {
                        return {module: module, providerMethod: 'register', declaration: filterFactory};
                    } else if (itemName === 'anotherService') {
                        return {module: module, providerMethod: 'value', declaration: anotherService};
                    }
                });

            var result = moduleIntrospector.getFilterDependencies(injector, 'aFilter');

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls.length).toBe(3);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[0].args)
                .toEqual([moduleInstance, '$filterProvider', 'register', 'aFilter']);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[1].args)
                .toEqual([moduleInstance, '$provide', serviceRegistrationMethodNames, 'anotherService']);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[2].args)
                .toEqual([moduleInstance, '$provide', serviceRegistrationMethodNames, '$http']);

            expect(result).toBeDefined();
            expect(Object.getOwnPropertyNames(result).length).toBe(2);
            expect(result.anotherService).toEqual({module: moduleInstance, instance: anotherService});
            expect(result.$http).toEqual({module: ngModule, instance: injector.get('$http')});
        });
    });



    describe('getControllerDependencies method', function() {

        it('should throw exception for non-existing controller', function() {
            expect(function() {
                moduleIntrospector.getControllerDependencies(injector, 'aNonExistingController');
            }).toThrow('Could not find controller with name: aNonExistingController');
        });

        it('should return dependencies for controller', function() {
            var ACtrl = ['$scope', 'anotherService', '$http', angular.noop];

            moduleInstance.controller('aController', ACtrl);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andCallFake(function(module, providerName, providerMethods, itemName) {
                    if (itemName === 'aController') {
                        return {module: module, providerMethod: 'register', declaration: ACtrl};
                    } else if (itemName === 'anotherService') {
                        return {module: module, providerMethod: 'value', declaration: anotherService};
                    }
                });

            var result = moduleIntrospector.getControllerDependencies(injector, 'aController');

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls.length).toBe(3);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[0].args)
                .toEqual([moduleInstance, '$controllerProvider', 'register', 'aController']);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[1].args)
                .toEqual([moduleInstance, '$provide', serviceRegistrationMethodNames, 'anotherService']);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[2].args)
                .toEqual([moduleInstance, '$provide', serviceRegistrationMethodNames, '$http']);

            expect(result).toBeDefined();
            expect(Object.getOwnPropertyNames(result).length).toBe(2);
            expect(result.anotherService).toEqual({module: moduleInstance, instance: anotherService});
            expect(result.$http).toEqual({module: ngModule, instance: injector.get('$http')});
        });
    });

});