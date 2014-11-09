describe('moduleIntrospector service', function() {
    'use strict';

    //TODO: remove once "module.prefix" + "module.suffix" is used
    /** @const */
    var serviceRegistrationMethodNames = ['provider', 'factory', 'service', 'value', 'constant'];

    /** @const */
    var angular1_0 = angular.version.full.indexOf('1.0.') === 0;

    var moduleInvokeQueueItemInfoExtractor;

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

    /** @const */
    var ngModule = angular.module('ng');

    var moduleInstance;
    var moduleIntrospector;
    var injector;

    beforeEach(function() {
        moduleInstance = angular.module('aModule', [])
            .value('anotherService', anotherService)
            .provider('anotherProvider', anotherProviderFactory);
        moduleIntrospector = moduleIntrospectorFactory('aModule');
//        injector = angular.injector(['ng', 'aModule']);
    });



    ddescribe('getServiceDeclaration method', function() {

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
                        strippedDeclaration : $getMethod[$getMethod.length - 1],
                        injectedServices: ['anotherService', '$http']
                    });
            });
        });
    });



    xdescribe('getServiceDependencies method', function() {

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

        it('should support service registered with the "provider" method with an object', function() {
            var serviceProviderAsObject = {
                $get: ['anotherService', '$http', function() {
                    return {};
                }]
            };

            moduleInstance.provider('aService', serviceProviderAsObject);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andReturn({module: moduleInstance, providerMethod: 'provider', declaration: serviceProviderAsObject});

            var result = moduleIntrospector.getServiceDependencies(injector, 'aService');

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo)
                .toHaveBeenCalledWith(moduleInstance, '$provide', serviceRegistrationMethodNames, 'aService');

            expect(result).toBeDefined();
            expect(Object.getOwnPropertyNames(result).length).toBe(2);
            expect(result.anotherService).toEqual({module: moduleInstance, instance: anotherService});
            expect(result.$http.module).toBe(moduleInstance);
            expect(result.$http.instance).toBe(injector.get('$http'));
        });

        it('should support service registered with the "provider" method with an function', function() {
            var serviceProviderAsFunction = ['anotherProviderProvider', function(anotherProviderProvider) {
                expect(anotherProviderProvider).toBe(anotherProviderProviderInstance);

                return {
                    $get: ['anotherService', '$http', function() {
                        return {};
                    }]
                };
            }];

            moduleInstance.provider('aService', serviceProviderAsFunction);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.andReturn(
                    {module: moduleInstance, providerMethod: 'provider', declaration: serviceProviderAsFunction});

            var result = moduleIntrospector.getServiceDependencies(injector, 'aService');

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo)
                .toHaveBeenCalledWith(moduleInstance, '$provide', serviceRegistrationMethodNames, 'aService');

            expect(result).toBeDefined();
            expect(Object.getOwnPropertyNames(result).length).toBe(2);
            expect(result.anotherService).toEqual({module: moduleInstance, instance: anotherService});
            expect(result.$http.module).toBe(moduleInstance);
            expect(result.$http.instance).toBe(injector.get('$http'));
        });
    });



    describe('getFilterDeclaration method', function() {

        xit('should throw exception for non-existing filter', function() {
            expect(function() {
                moduleIntrospector.getFilterDeclaration('aNonExistingFilter');
            }).toThrow('Could not find filter with name: aNonExistingFilter');
        });

        xit('should return built-in (from "ng" module) filter', function() {
            var result = moduleIntrospector.getFilterDeclaration('filter');

            expect(result).toBeTruthy();
            expect(result.providerMethod).toBe('filter');
            expect(result.componentName).toBe('filter');
            expect(angular.isArray(result.rawDeclaration)).toBe(true);
            expect(angular.isFunction(result.strippedDeclaration)).toBe(true);
            expect(angular.isArray(result.injectedServices)).toBe(true);
//            expect(result.injectedServices.indexOf('$httpBackend') !== -1).toBe(true);
        });

        xit('should return declared filter', function() {
            var filterFactory = ['anotherService', '$http', function() {
                return function() {};
            }];

            moduleInstance.filter('aFilter', filterFactory);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andReturn({module: moduleInstance, providerMethod: 'filter', declaration: filterFactory});

            var result = moduleIntrospector.getFilterDeclaration('aFilter');

            expect(result).toEqual({
                module: moduleInstance,
                providerName: '$filterProvider',
                providerMethod: 'filter',
                declaration: filterFactory
            });

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo)
                .toHaveBeenCalledWith(moduleInstance, '$filterProvider', ['register'], 'aFilter');
        });
    });



    xdescribe('getFilterDependencies method', function() {

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
                .toEqual([moduleInstance, '$filterProvider', ['register'], 'aFilter']);
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



    xdescribe('getControllerDeclaration method', function() {

        it('should throw exception for non-existing controller', function() {
            expect(function() {
                moduleIntrospector.getControllerDeclaration('aNonExistingController');
            }).toThrow('Could not find controller with name: aNonExistingController');
        });

        it('should return declared controller', function() {
            var controllerConstructor = ['anotherService', '$http', function() {
            }];

            moduleInstance.controller('aController', controllerConstructor);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andReturn({module: moduleInstance, providerMethod: 'register', declaration: controllerConstructor});

            var result = moduleIntrospector.getControllerDeclaration('aController');

            expect(result).toEqual({
                module: moduleInstance,
                providerName: '$controllerProvider',
                providerMethod: 'register',
                declaration: controllerConstructor
            });

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo)
                .toHaveBeenCalledWith(moduleInstance, '$controllerProvider', ['register'], 'aController');
        });
    });



    xdescribe('getControllerDependencies method', function() {

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
                .toEqual([moduleInstance, '$controllerProvider', ['register'], 'aController']);
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



    xdescribe('getDirectiveDeclaration method', function() {

        it('should throw exception for non-existing directive', function() {
            expect(function() {
                moduleIntrospector.getDirectiveDeclaration('aNonExistingDirective');
            }).toThrow('Could not find directive with name: aNonExistingDirective');
        });

        it('should return declared directive', function() {
            var directiveLinkFn = jasmine.createSpy();

            var directiveDeclaration = ['anotherService', '$http', function() {
                return directiveLinkFn;
            }];

            moduleInstance.directive('aDirective', directiveDeclaration);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andReturn({module: moduleInstance, providerMethod: 'directive', declaration: directiveDeclaration});

            var result = moduleIntrospector.getDirectiveDeclaration('aDirective');

            expect(result).toEqual({
                module: moduleInstance,
                providerName: '$compileProvider',
                providerMethod: 'directive',
                declaration: directiveDeclaration
            });

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo)
                .toHaveBeenCalledWith(moduleInstance, '$compileProvider', ['directive'], 'aDirective');
        });
    });



    describe('getDirectiveDependencies method', function() {

        xit('should throw exception for non-existing directive', function() {
            expect(function() {
                moduleIntrospector.getDirectiveDependencies(injector, 'aNonExistingDirective');
            }).toThrow('Could not find directive with name: aNonExistingDirective');
        });

        it('should return dependencies for directive', function() {
            var directiveDeclaration = ['anotherService', '$http', angular.noop];

            moduleInstance.directive('aDirective', directiveDeclaration);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andCallFake(function(module, providerName, providerMethods, itemName) {
                    if (itemName === 'aDirective') {
                        return {module: module, providerMethod: 'directive', declaration: directiveDeclaration};
                    } else if (itemName === 'anotherService') {
                        return {module: module, providerMethod: 'value', declaration: anotherService};
                    }
                });

            var result = moduleIntrospector.getDirectiveDependencies(injector, 'aDirective');

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls.length).toBe(3);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[0].args)
                .toEqual([moduleInstance, '$compileProvider', ['directive'], 'aDirective']);
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



    xdescribe('getAnimationDeclaration method' + (angular1_0 ? ' (not supported by angular 1.0) ' : ''), function() {

        it('should throw exception for non-existing animation', function() {
            if (angular1_0) {
                return;
            }


            expect(function() {
                moduleIntrospector.getAnimationDeclaration('aNonExistingAnimation');
            }).toThrow('Could not find animation with name: aNonExistingAnimation');
        });

        it('should return declared animation', function() {
            if (angular1_0) {
                return;
            }


            var animationDeclaration = ['anotherService', '$http', function() {
                return {
                    enter: angular.noop
                };
            }];

            moduleInstance.animation('.anAnimation', animationDeclaration);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andReturn({module: moduleInstance, providerMethod: 'register', declaration: animationDeclaration});

            var result = moduleIntrospector.getAnimationDeclaration('.anAnimation');

            expect(result).toEqual({
                module: moduleInstance,
                providerName: '$animateProvider',
                providerMethod: 'register',
                declaration: animationDeclaration
            });

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo)
                .toHaveBeenCalledWith(moduleInstance, '$animateProvider', ['register'], '.anAnimation');
        });
    });



    xdescribe('getAnimationDependencies method' + (angular1_0 ? ' (not supported by angular 1.0) ' : ''), function() {

        it('should throw exception for non-existing animation', function() {
            if (angular1_0) {
                return;
            }


            expect(function() {
                moduleIntrospector.getAnimationDependencies(injector, 'aNonExistingAnimation');
            }).toThrow('Could not find animation with name: aNonExistingAnimation');
        });

        it('should return dependencies for animation', function() {
            if (angular1_0) {
                return;
            }


            var animationDeclaration = ['anotherService', '$http', function() {
                return {
                    enter: angular.noop
                };
            }];

            moduleInstance.animation('.anAnimation', animationDeclaration);

            moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo
                .andCallFake(function(module, providerName, providerMethods, itemName) {
                    if (itemName === '.anAnimation') {
                        return {module: module, providerMethod: 'register', declaration: animationDeclaration};
                    } else if (itemName === 'anotherService') {
                        return {module: module, providerMethod: 'value', declaration: anotherService};
                    }
                });

            var result = moduleIntrospector.getAnimationDependencies(injector, '.anAnimation');

            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls.length).toBe(3);
            expect(moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo.calls[0].args)
                .toEqual([moduleInstance, '$animateProvider', ['register'], '.anAnimation']);
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