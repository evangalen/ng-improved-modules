ddescribe('moduleIntrospector service', function() {
    'use strict';

    beforeEach(module('ngModuleIntrospector'));


    var moduleIntrospectorFactory;

    beforeEach(inject(function(_moduleIntrospector_) {
        moduleIntrospectorFactory = _moduleIntrospector_;
    }));


    /** @const */
    var anotherProviderInstance = {};

    /** @const */
    var anotherProviderProviderInstance = {
        $get: [function() {
            return anotherProviderInstance;
        }]
    };

    /** @const */
    var anotherProviderFactory = [function() {
        return anotherProviderProviderInstance;
    }];

    /** @const */
    var anotherService = {};

    var moduleInstance;
    var moduleIntrospector;

    beforeEach(function() {
        moduleInstance = angular.module('aModule', [])
            .value('anotherService', anotherService)
            .provider('anotherProvider', anotherProviderFactory);
        moduleIntrospector = moduleIntrospectorFactory('aModule');
    });



    describe('getServiceDeclaration method', function() {

        it('should throw exception for non-existing service', function() {
            expect(function() {
                moduleIntrospector.getServiceDeclaration('aNonExistingService');
            }).toThrow('Could not find registered component "aNonExistingService" for provider: $provide');
        });

        it('should return built-in (from "ng" module) service', function() {
            var result = moduleIntrospector.getServiceDeclaration('$http');

            expect(result).toBeTruthy();
            expect(result.providerMethod).toBe('provider');
            expect(result.componentName).toBe('$http');
            expect(angular.isArray(result.rawDeclaration)).toBe(true);
            expect(angular.isFunction(result.strippedDeclaration)).toBe(true);
            expect(angular.isArray(result.injectedServices)).toBe(true);
            expect(result.injectedServices.indexOf('$httpBackend') !== -1).toBe(true);
        });

        it('should return declared service', function() {
            var service = {a: 'service'};

            moduleInstance.value('aService', service);

            moduleIntrospector = moduleIntrospectorFactory('aModule');

            var result = moduleIntrospector.getServiceDeclaration('aService');

            expect(result).toEqual(
                {
                    providerMethod: 'value',
                    componentName: 'aService',
                    rawDeclaration: {a: 'service'},
                    strippedDeclaration: { a: 'service'},
                    injectedServices: []
                });
        });

        describe('should return $get method of "provider" registered service that was registered with', function() {

            it('an object', function() {
                var $getMethod = ['anotherService', '$http', function() {
                    return {};
                }];

                var serviceProviderAsObject = {
                    $get: $getMethod
                };

                moduleInstance.provider('aService', serviceProviderAsObject);

                moduleIntrospector = moduleIntrospectorFactory('aModule');

                var result = moduleIntrospector.getServiceDeclaration('aService');

                expect(result).toEqual(
                    {
                        providerMethod: 'provider',
                        componentName: 'aService',
                        rawDeclaration: $getMethod,
                        strippedDeclaration : $getMethod[$getMethod.length - 1],
                        injectedServices: ['anotherService', '$http']
                    });
            });

            it('factory function', function() {
                var $getMethod = ['anotherService', '$http', function() {
                    return {};
                }];

                var serviceProviderAsFunction = ['anotherProviderProvider', function(anotherProviderProvider) {
                    expect(anotherProviderProvider).toBe(anotherProviderProviderInstance);

                    return {
                        $get: $getMethod
                    };
                }];

                moduleInstance.provider('aService', serviceProviderAsFunction);

                moduleIntrospector = moduleIntrospectorFactory('aModule');

                var result = moduleIntrospector.getServiceDeclaration('aService');

                expect(result).toEqual(
                    {
                        providerMethod: 'provider',
                        componentName: 'aService',
                        rawDeclaration: $getMethod,
                        strippedDeclaration : $getMethod[2],
                        injectedServices: $getMethod.slice(0, 2)
                    });
            });
        });
    });



    describe('getFilterDeclaration method', function() {

        it('should throw exception for non-existing filter', function() {
            expect(function() {
                moduleIntrospector.getFilterDeclaration('aNonExistingFilter');
            }).toThrow('Could not find registered component "aNonExistingFilter" for provider: $filterProvider');
        });

        xit('should return built-in (from "ng" module) filter', function() {
            var result = moduleIntrospector.getFilterDeclaration('filter');

            expect(result).toBeTruthy();
            expect(result.providerMethod).toBe('filter');
            expect(result.componentName).toBe('filter');
            expect(angular.isArray(result.rawDeclaration)).toBe(true);
            expect(angular.isFunction(result.strippedDeclaration)).toBe(true);
            expect(angular.isArray(result.injectedServices)).toBe(true);
////            expect(result.injectedServices.indexOf('$httpBackend') !== -1).toBe(true);
        });

        it('should return declared filter', function() {
            var filterFactory = ['anotherService', '$http', function() {
                return function() {};
            }];

            moduleInstance.filter('aFilter', filterFactory);

            moduleIntrospector = moduleIntrospectorFactory('aModule');

            var result = moduleIntrospector.getFilterDeclaration('aFilter');

            expect(result).toEqual({
                providerMethod: 'register',
                componentName: 'aFilter',
                rawDeclaration: filterFactory,
                strippedDeclaration: filterFactory[2],
                injectedServices: filterFactory.slice(0, 2)
            });
        });
    });



    describe('getControllerDeclaration method', function() {

        it('should throw exception for non-existing controller', function() {
            expect(function() {
                moduleIntrospector.getControllerDeclaration('aNonExistingController');
            }).toThrow(
                    'Could not find registered component "aNonExistingController" for provider: $controllerProvider');
        });

        it('should return declared controller', function() {
            var controllerConstructor = ['anotherService', '$http', function() {
            }];

            moduleInstance.controller('aController', controllerConstructor);

            moduleIntrospector = moduleIntrospectorFactory('aModule');

            var result = moduleIntrospector.getControllerDeclaration('aController');

            expect(result).toEqual({
                providerMethod: 'register',
                componentName: 'aController',
                rawDeclaration: controllerConstructor,
                strippedDeclaration: controllerConstructor[2],
                injectedServices: controllerConstructor.slice(0, 2)
            });
        });
    });



    describe('getDirectiveDeclaration method', function() {

        it('should throw exception for non-existing directive', function() {
            expect(function() {
                moduleIntrospector.getDirectiveDeclaration('aNonExistingDirective');
            }).toThrow('Could not find registered component "aNonExistingDirective" for provider: $compileProvider');
        });

        it('should return declared directive', function() {
            var directiveLinkFn = jasmine.createSpy();

            var directiveDeclaration = ['anotherService', '$http', function() {
                return directiveLinkFn;
            }];

            moduleInstance.directive('aDirective', directiveDeclaration);

            moduleIntrospector = moduleIntrospectorFactory('aModule');

            var result = moduleIntrospector.getDirectiveDeclaration('aDirective');

            expect(result).toEqual({
                providerMethod: 'directive',
                componentName: 'aDirective',
                rawDeclaration: directiveDeclaration,
                strippedDeclaration: directiveDeclaration[2],
                injectedServices: directiveDeclaration.slice(0, 2)
            });
        });
    });



    describe('getAnimationDeclaration method', function() {

        it('should throw exception for non-existing animation', function() {
            expect(function() {
                moduleIntrospector.getAnimationDeclaration('aNonExistingAnimation');
            }).toThrow('Could not find registered component "aNonExistingAnimation" for provider: $animateProvider');
        });

        it('should return declared animation', function() {
            var animationDeclaration = ['anotherService', '$http', function() {
                return {
                    enter: angular.noop
                };
            }];

            moduleInstance.animation('.anAnimation', animationDeclaration);

            moduleIntrospector = moduleIntrospectorFactory('aModule');

            var result = moduleIntrospector.getAnimationDeclaration('.anAnimation');

            expect(result).toEqual({
                providerMethod: 'register',
                componentName: '.anAnimation',
                rawDeclaration: animationDeclaration,
                strippedDeclaration: animationDeclaration[2],
                injectedServices: animationDeclaration.slice(0, 2)
            });
        });
    });

});