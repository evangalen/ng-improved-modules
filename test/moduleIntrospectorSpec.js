/* global angular, inject, describe, beforeEach, it, spyOn, expect, module, jasmine */
'use strict';

describe('moduleIntrospector service', function() {

    var moduleInvokeQueueItemInfoExtractor;

    beforeEach(module('ngImprovedModules', function($provide) {
        moduleInvokeQueueItemInfoExtractor = {
            findInvokeQueueItemInfo: jasmine.createSpy()
        };

        $provide.value('moduleInvokeQueueItemInfoExtractor', moduleInvokeQueueItemInfoExtractor);
    }));

    var moduleIntrospectorFactory;

    beforeEach(inject(function(_moduleIntrospector_) {
        moduleIntrospectorFactory = _moduleIntrospector_;
    }));


    describe('getServiceDeclaration method', function() {

        it('should throw exception for non-overridden built-in (from "ng" module) service', function() {
            var moduleIntrospector = moduleIntrospectorFactory('ng');

            expect(function() {
                moduleIntrospector.getServiceDeclaration('$http');
            }).toThrow('Could not find declaration of service with name: $http');
        });

        it('should throw exception for non existing service', function() {
            angular.module('aModule', []);
            var moduleIntrospector = moduleIntrospectorFactory('aModule');

            expect(function() {
                moduleIntrospector.getServiceDeclaration('aService');
            }).toThrow('Could not find service with name: aService');
        });

        it('should return declared service', function() {
            var service = {a: 'service'};

            var module = angular.module('aModule', [])
                .value('aService', service);

            var moduleIntrospector = moduleIntrospectorFactory('aModule');

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andReturn({module: module, providerMethod: 'value', declaration: service});

            moduleIntrospector.getServiceDeclaration('aService');
        });
    });


    describe('getServiceDependencies method', function() {
        it('should throw exception for non-overridden built-in (from "ng" module) service', function() {
            var moduleIntrospector = moduleIntrospectorFactory('ng');

            var injector = angular.injector(['ng']);

            expect(function() {
                moduleIntrospector.getServiceDependencies(injector, '$http');
            }).toThrow('Could not find declaration of service with name: $http');
        });

        it('should throw exception for non existing service', function() {
            angular.module('aModule', []);
            var injector = angular.injector(['aModule']);

            var moduleIntrospector = moduleIntrospectorFactory('aModule');

            expect(function() {
                moduleIntrospector.getServiceDependencies(injector, 'aService');
            }).toThrow('Could not find service with name: aService');
        });

        it('should return dependencies for service', function() {
            var anotherService = {};

            var serviceFactory = ['anotherService', '$http', function() {
                return {};
            }];

            var module = angular.module('aModule', [])
                .value('anotherService', anotherService)
                .factory('aService', serviceFactory);
            var injector = angular.injector(['ng', 'aModule']);

            var moduleIntrospector = moduleIntrospectorFactory('aModule');

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andCallFake(function(module, providerName, providerMethods, itemName) {
                    if (itemName === 'aService') {
                        return {module: module, providerMethod: 'factory', declaration: serviceFactory};
                    } else if (itemName === 'anotherService') {
                        return {module: module, providerMethod: 'value', declaration: anotherService};
                    }
                });

            var result = moduleIntrospector.getServiceDependencies(injector, 'aService');
            expect(result).toBeDefined();
            expect(Object.getOwnPropertyNames(result).length).toBe(2);
            expect(angular.equals(result.anotherService, {module: module, instance: anotherService})).toBe(true);
            expect(angular.equals(result.$http, {module: angular.module('ng'), instance: injector.get('$http')}))
                .toBe(true);
        });
    });
});