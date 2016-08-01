'use strict';

describe('moduleIntrospector service', function() {

    beforeEach(module('ngModuleIntrospector'));


    var moduleIntrospectorFactory;

    beforeEach(inject(function(_moduleIntrospector_) {
        moduleIntrospectorFactory = _moduleIntrospector_;
    }));


    var moduleInstance;
    var anotherModuleInstance;

    beforeEach(function() {
        anotherModuleInstance = angular.module('anotherModule', []);
        moduleInstance = angular.module('aModule', ['anotherModule']);
    });

    /** @const */
    var originalValue = Object.freeze({original: 'service'});

    /** @const */
    var overriddenValue = Object.freeze({overridden: 'service'});

    /** @const */
    var originalService = function() {
        return originalValue;
    };

    /** @const */
    var overriddenService = Object.freeze(
            ['aService1', 'aService2', function(aService1, aService2) { //jshint unused:false
                return overriddenValue;
            }]);

    /** @const */
    var originalFactory = function() {
        return originalValue;
    };

    /** @const */
    var overriddenFactory = Object.freeze(
            ['aService1', 'aService2', function(aService1, aService2) { //jshint unused:false
                return overriddenValue;
            }]);

    /** @const */
    var originalProvider$GetFn = Object.freeze(
            ['aService1', 'aService2', function(aService1, aService2) { //jshint unused:false
                return originalValue;
            }]);

    /** @const */
    var originalProviderObject = Object.freeze({
        $get: originalProvider$GetFn
    });

    /** @const */
    var originalProviderConstructor = Object.freeze(
            ['$provide', '$compileProvider', function($provide, $compileProvider) { //jshint unused:false
                angular.extend(this, originalProviderObject);
            }]);

    /** @const */
    var overriddenProvider$GetFn = Object.freeze(
            ['aService1', 'aService2', function(aService1, aService2) { //jshint unused:false
                return originalValue;
            }]);

    /** @const */
    var overriddenProviderObject = Object.freeze({
        $get: overriddenProvider$GetFn
    });

    /** @const */
    var overriddenProviderConstructor = Object.freeze(
            ['$provide', '$compileProvider', function($provide, $compileProvider) { //jshint unused:false
                angular.extend(this, overriddenProviderObject);
            }]);



    describe('getProviderComponentDeclarations method', function() {

        it('should throw exception for unknown provider name', function() {
            expect(function() {
                moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('anUnknownProvider', 'aComponentName');
            }).toThrow('Could not find registered component "aComponentName" for provider: anUnknownProvider');
        });


        describe('for $provide', function() {

            it('should throw an exception for a non existing service', function() {
                expect(function() {
                    moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$provide', 'nonExistingService');
                }).toThrow('Could not find registered component "nonExistingService" for provider: $provide');
            });

            describe('constant component', function() {
                var expectedRawDeclaration;

                it('should return first registered constant in the same module', function() {
                    moduleInstance
                        .constant('aService', originalValue)
                        .constant('aService', overriddenValue);

                    expectedRawDeclaration = originalValue;
                });

                it('should return overridden constant instead of original constant from another module', function() {
                    anotherModuleInstance
                        .constant('aService', originalValue);
                    moduleInstance
                        .constant('aService', overriddenValue);

                    expectedRawDeclaration = overriddenValue;
                });

                afterEach(function() {
                    var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$provide', 'aService');

                    expect(result.length).toBe(1);
                    expect(result[0].providerMethod).toBe('constant');
                    expect(result[0].componentName).toBe('aService');
                    expect(result[0].rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result[0].strippedDeclaration).toBe(expectedRawDeclaration);
                    expect(result[0].injectedServices).toEqual([]);
                    expect(result[0].builtIn).toBe(false);
                });

            });


            describe('value component', function() {
                var expectedProviderMethod;
                var expectedRawDeclaration;

                beforeEach(function() {
                    expectedProviderMethod = 'value';
                });


                describe('should return constant', function() {
                    beforeEach(function() {
                        expectedProviderMethod = 'constant';
                    });

                    it('instead of original value in the same module', function() {
                        moduleInstance
                            .value('aService', originalValue)
                            .constant('aService', overriddenValue);

                        expectedRawDeclaration = overriddenValue;
                    });

                    it('instead of overridden value in the same module', function() {
                        moduleInstance
                            .constant('aService', originalValue)
                            .value('aService', overriddenValue);

                        expectedRawDeclaration = originalValue;
                    });

                    it('from another module instead of value', function() {
                        anotherModuleInstance.constant('aService', originalValue);
                        moduleInstance.value('aService', overriddenValue);

                        expectedRawDeclaration = originalValue;
                    });
                });


                describe('should allow overriding', function() {
                    beforeEach(function() {
                        expectedRawDeclaration = overriddenValue;
                    });

                    afterEach(function() {
                        moduleInstance.value('aService', overriddenValue);
                    });


                    describe('from another module', function() {
                        it('a value', function() {
                            anotherModuleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            anotherModuleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            anotherModuleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            anotherModuleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            anotherModuleInstance.provider('aService', originalProviderConstructor);
                        });
                    });

                    describe('from the same module', function() {
                        it('a value', function() {
                            moduleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            moduleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            moduleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            moduleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            moduleInstance.provider('aService', originalProviderConstructor);
                        });
                    });
                });

                afterEach(function() {
                    var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$provide', 'aService');

                    expect(result.length).toBe(1);
                    expect(result[0].providerMethod).toBe(expectedProviderMethod);
                    expect(result[0].componentName).toBe('aService');
                    expect(result[0].rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result[0].strippedDeclaration).toBe(expectedRawDeclaration);
                    expect(result[0].injectedServices).toEqual([]);
                    expect(result[0].builtIn).toBe(false);
                });

            });


            describe('service component', function() {
                var expectedProviderMethod;
                var expectedRawDeclaration;
                var expectedStrippedDeclaration;
                var expectedInjectedServices;

                beforeEach(function() {
                    expectedProviderMethod = 'service';
                });


                describe('should return constant', function() {
                    beforeEach(function() {
                        expectedProviderMethod = 'constant';
                    });

                    it('instead of original value in the same module', function() {
                        moduleInstance
                            .service('aService', originalService)
                            .constant('aService', overriddenValue);

                        expectedRawDeclaration = overriddenValue;
                    });

                    it('instead of overridden value in the same module', function() {
                        moduleInstance
                            .constant('aService', originalValue)
                            .service('aService', overriddenService);

                        expectedRawDeclaration = originalValue;
                    });

                    it('from another module instead of value', function() {
                        anotherModuleInstance.constant('aService', originalValue);
                        moduleInstance.service('aService', overriddenService);

                        expectedRawDeclaration = originalValue;
                    });
                });

                describe('should allow overriding', function() {
                    beforeEach(function() {
                        expectedRawDeclaration = overriddenService;
                        expectedStrippedDeclaration = overriddenService[overriddenService.length - 1];
                        expectedInjectedServices = ['aService1', 'aService2'];
                    });

                    afterEach(function() {
                        moduleInstance.service('aService', overriddenService);
                    });


                    describe('from another module', function() {
                        it('a value', function() {
                            anotherModuleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            anotherModuleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            anotherModuleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            anotherModuleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            anotherModuleInstance.provider('aService', originalProviderConstructor);
                        });
                    });

                    describe('from the same module', function() {
                        it('a value', function() {
                            moduleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            moduleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            moduleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            moduleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            moduleInstance.provider('aService', originalProviderConstructor);
                        });
                    });
                });



                afterEach(function() {
                    var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$provide', 'aService');

                    expect(result.length).toBe(1);
                    expect(result[0].providerMethod).toBe(expectedProviderMethod);
                    expect(result[0].componentName).toBe('aService');
                    expect(result[0].rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result[0].strippedDeclaration).toBe(expectedStrippedDeclaration || expectedRawDeclaration);
                    expect(result[0].injectedServices).toEqual(expectedInjectedServices || []);
                    expect(result[0].builtIn).toEqual(false);
                });

            });


            describe('factory component', function() {
                var expectedProviderMethod;
                var expectedRawDeclaration;
                var expectedStrippedDeclaration;
                var expectedInjectedServices;

                beforeEach(function() {
                    expectedProviderMethod = 'factory';
                });


                describe('should return constant', function() {
                    beforeEach(function() {
                        expectedProviderMethod = 'constant';
                    });

                    it('instead of original value in the same module', function() {
                        moduleInstance
                            .factory('aService', originalFactory)
                            .constant('aService', overriddenValue);

                        expectedRawDeclaration = overriddenValue;
                    });

                    it('instead of overridden value in the same module', function() {
                        moduleInstance
                            .constant('aService', originalValue)
                            .factory('aService', overriddenFactory);

                        expectedRawDeclaration = originalValue;
                    });

                    it('from another module instead of value', function() {
                        anotherModuleInstance.constant('aService', originalValue);
                        moduleInstance.factory('aService', overriddenFactory);

                        expectedRawDeclaration = originalValue;
                    });
                });


                describe('should allow overriding', function() {
                    beforeEach(function() {
                        expectedRawDeclaration = overriddenFactory;
                        expectedStrippedDeclaration = overriddenFactory[overriddenFactory.length - 1];
                        expectedInjectedServices = ['aService1', 'aService2'];
                    });

                    afterEach(function() {
                        moduleInstance.factory('aService', overriddenFactory);
                    });


                    describe('from another module', function() {
                        it('a value', function() {
                            anotherModuleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            anotherModuleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            anotherModuleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            anotherModuleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            anotherModuleInstance.provider('aService', originalProviderConstructor);
                        });
                    });

                    describe('from the same module', function() {
                        it('a value', function() {
                            moduleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            moduleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            moduleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            moduleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            moduleInstance.provider('aService', originalProviderConstructor);
                        });
                    });
                });


                afterEach(function() {
                    var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$provide', 'aService');

                    expect(result.length).toBe(1);
                    expect(result[0].providerMethod).toBe(expectedProviderMethod);
                    expect(result[0].componentName).toBe('aService');
                    expect(result[0].rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result[0].strippedDeclaration).toBe(expectedStrippedDeclaration || expectedRawDeclaration);
                    expect(result[0].injectedServices).toEqual(expectedInjectedServices || []);
                    expect(result[0].builtIn).toBe(false);
                });

            });


            describe('provider component', function() {
                var expectedProviderMethod;
                var expectedComponentName;
                var expectedRawDeclaration;
                var expectedStrippedDeclaration;
                var expectedInjectedServices;

                beforeEach(function() {
                    expectedProviderMethod = 'provider';
                    expectedComponentName = 'aService';
                });


                describe('should return constant', function() {
                    beforeEach(function() {
                        expectedProviderMethod = 'constant';
                    });

                    it('instead of original provider object in the same module', function() {
                        moduleInstance
                            .provider('aService', originalProviderObject)
                            .constant('aService', overriddenValue);

                        expectedRawDeclaration = overriddenValue;
                    });

                    it('instead of original provider constructor in the same module', function() {
                        moduleInstance
                            .provider('aService', originalProviderConstructor)
                            .constant('aService', overriddenValue);

                        expectedRawDeclaration = overriddenValue;
                    });

                    it('instead of overridden provider object in the same module', function() {
                        moduleInstance
                            .constant('aService', originalValue)
                            .provider('aService', overriddenProviderObject);

                        expectedRawDeclaration = originalValue;
                    });

                    it('instead of overridden provider object in the same module', function() {
                        moduleInstance
                            .constant('aService', originalValue)
                            .provider('aService', overriddenProviderConstructor);

                        expectedRawDeclaration = originalValue;
                    });

                    it('from another module instead of provider object', function() {
                        anotherModuleInstance.constant('aService', originalValue);
                        moduleInstance.factory('aService', overriddenProviderObject);

                        expectedRawDeclaration = originalValue;
                    });

                    it('from another module instead of provider constructor', function() {
                        anotherModuleInstance.constant('aService', originalValue);
                        moduleInstance.factory('aService', overriddenProviderConstructor);

                        expectedRawDeclaration = originalValue;
                    });
                });


                describe('a provider object should allow overriding', function() {
                    beforeEach(function() {
                        expectedRawDeclaration = overriddenProvider$GetFn;
                        expectedStrippedDeclaration = overriddenProvider$GetFn[overriddenProvider$GetFn.length - 1];
                        expectedInjectedServices = ['aService1', 'aService2'];
                    });

                    afterEach(function() {
                        moduleInstance.provider('aService', overriddenProviderObject);
                    });


                    describe('from another module', function() {
                        it('a value', function() {
                            anotherModuleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            anotherModuleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            anotherModuleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            anotherModuleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            anotherModuleInstance.provider('aService', originalProviderConstructor);
                        });
                    });

                    describe('from the same module', function() {
                        it('a value', function() {
                            moduleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            moduleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            moduleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            moduleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            moduleInstance.provider('aService', originalProviderConstructor);
                        });
                    });
                });

                describe('a provider constructor should allow overriding', function() {
                    beforeEach(function() {
                        expectedRawDeclaration = overriddenProvider$GetFn;
                        expectedStrippedDeclaration = overriddenProvider$GetFn[overriddenProvider$GetFn.length - 1];
                        expectedInjectedServices = ['aService1', 'aService2'];
                    });

                    afterEach(function() {
                        moduleInstance.provider('aService', overriddenProviderConstructor);
                    });


                    describe('from another module', function() {
                        it('a value', function() {
                            anotherModuleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            anotherModuleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            anotherModuleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            anotherModuleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            anotherModuleInstance.provider('aService', originalProviderConstructor);
                        });
                    });

                    describe('from the same module', function() {
                        it('a value', function() {
                            moduleInstance.value('aService', originalValue);
                        });

                        it('a service', function() {
                            moduleInstance.service('aService', originalService);
                        });

                        it('a factory', function() {
                            moduleInstance.factory('aService', originalFactory);
                        });

                        it('a provider object', function() {
                            moduleInstance.provider('aService', originalProviderObject);
                        });

                        it('a provider constructor', function() {
                            moduleInstance.provider('aService', originalProviderConstructor);
                        });
                    });
                });

                it('should property handle a non-annotated provider constructor', function() {
                    moduleInstance.provider('aService', function() {
                        this.$get = originalProvider$GetFn[originalProvider$GetFn.length - 1];
                    });

                    expectedRawDeclaration = originalProvider$GetFn[originalProvider$GetFn.length - 1];
                    expectedStrippedDeclaration = originalProvider$GetFn[originalProvider$GetFn.length - 1];
                    expectedInjectedServices = ['aService1', 'aService2'];
                });

                describe('should properly handle multiple registered providers', function() {
                    beforeEach(function() {
                        moduleInstance.provider({
                            aService: originalProviderObject,
                            anotherService: overriddenProviderConstructor
                        });
                    });

                    it('and register the first', function() {
                        expectedRawDeclaration = originalProvider$GetFn;
                        expectedStrippedDeclaration = originalProvider$GetFn[originalProvider$GetFn.length - 1];
                        expectedInjectedServices = ['aService1', 'aService2'];
                    });

                    it('and register the second', function() {
                        expectedComponentName = 'anotherService';
                        expectedRawDeclaration = overriddenProvider$GetFn;
                        expectedStrippedDeclaration = overriddenProvider$GetFn[overriddenProvider$GetFn.length - 1];
                        expectedInjectedServices = ['aService1', 'aService2'];
                    });
                });


                afterEach(function() {
                    var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$provide', expectedComponentName);

                    expect(result.length).toBe(1);
                    expect(result[0].providerMethod).toBe(expectedProviderMethod);
                    expect(result[0].componentName).toBe(expectedComponentName);
                    expect(result[0].rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result[0].strippedDeclaration).toBe(expectedStrippedDeclaration || expectedRawDeclaration);
                    expect(result[0].injectedServices).toEqual(expectedInjectedServices || []);
                    expect(result[0].builtIn).toEqual(false);
                });

            });


        });


        describe('for $filterProvider', function() {
            it('should throw exception for non-existing filter', function() {
                expect(function() {
                    moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$filterProvider', 'aNonExistingFilter');
                }).toThrow('Could not find registered component "aNonExistingFilter" for provider: $filterProvider');
            });

            it('should return built-in (from "ng" module) filter', function() {
                var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$filterProvider', 'currency');

                expect(result.length).toBe(1);
                expect(result[0].providerMethod).toBe('register');
                expect(result[0].componentName).toBe('currency');
                expect(angular.isFunction(result[0].rawDeclaration)).toBe(true);
                expect(result[0].rawDeclaration.$inject).toEqual(['$locale']);
                expect(result[0].strippedDeclaration).toBe(result[0].rawDeclaration);
                expect(result[0].injectedServices).toEqual(['$locale']);
                expect(result[0].builtIn).toBe(true);
            });

            it('should return declared filter', function() {
                var filterFactory = ['anotherService', '$http', function() {
                    return function() {};
                }];

                moduleInstance.filter('aFilter', filterFactory);

                var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$filterProvider', 'aFilter');

                expect(result).toEqual([{
                    providerMethod: 'register',
                    componentName: 'aFilter',
                    rawDeclaration: filterFactory,
                    strippedDeclaration: filterFactory[2],
                    injectedServices: filterFactory.slice(0, 2),
                    builtIn: false
                }]);
            });
        });


        describe('for $controllerProvider', function() {

            it('should throw exception for non-existing controller', function() {
                expect(function() {
                    moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations(
                            '$controllerProvider', 'aNonExistingController');
                }).toThrow('Could not find registered component "aNonExistingController" for provider: $controllerProvider');
            });

            it('should return declared controller', function() {
                var controllerConstructor = ['anotherService', '$http', function() {
                }];

                moduleInstance.controller('aController', controllerConstructor);

                var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$controllerProvider', 'aController');

                expect(result).toEqual([{
                    providerMethod: 'register',
                    componentName: 'aController',
                    rawDeclaration: controllerConstructor,
                    strippedDeclaration: controllerConstructor[2],
                    injectedServices: controllerConstructor.slice(0, 2),
                    builtIn: false
                }]);
            });
        });


        describe('for $compileProvider', function() {

            it('should throw exception for non-existing directive', function() {
                expect(function() {
                    moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$compileProvider', 'aNonExistingDirective');
                }).toThrow('Could not find registered component "aNonExistingDirective" for provider: $compileProvider');
            });

            it('should return built-in (from "ng" module) directive', function() {
                var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$compileProvider', 'option');

                expect(result.length).toBe(1);
                expect(result[0].providerMethod).toBe('directive');
                expect(result[0].componentName).toBe('option');
                expect(angular.isArray(result[0].rawDeclaration)).toBe(true);
                expect(result[0].rawDeclaration.length).toBe(2);
                expect(result[0].rawDeclaration[0]).toBe('$interpolate');
                expect(angular.isFunction(result[0].rawDeclaration[1])).toBe(true);
                expect(result[0].strippedDeclaration).toBe(result[0].rawDeclaration[1]);
                expect(result[0].injectedServices).toEqual(['$interpolate']);
                expect(result[0].builtIn).toBe(true);
            });

            it('should return directive that was declared only once', function() {
                var directiveLinkFn = jasmine.createSpy();

                var directiveDeclaration = ['anotherService', '$http', function() {
                    return directiveLinkFn;
                }];

                moduleInstance.directive('aDirective', directiveDeclaration);

                var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$compileProvider', 'aDirective');

                expect(result).toEqual([{
                    providerMethod: 'directive',
                    componentName: 'aDirective',
                    rawDeclaration: directiveDeclaration,
                    strippedDeclaration: directiveDeclaration[2],
                    injectedServices: directiveDeclaration.slice(0, 2),
                    builtIn: false
                }]);
            });

            it('should return directive with multiple declarations', function() {
                var directiveLinkFn = jasmine.createSpy();

                var directiveDeclaration = ['anotherService', '$http', function() {
                    return directiveLinkFn;
                }];

                moduleInstance.directive('input', directiveDeclaration);

                var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$compileProvider', 'input');

                expect(result.length).toBe(2);
                expect(result[0].builtIn).toBe(true);
                expect(result[1]).toEqual({
                    providerMethod: 'directive',
                    componentName: 'input',
                    rawDeclaration: directiveDeclaration,
                    strippedDeclaration: directiveDeclaration[2],
                    injectedServices: directiveDeclaration.slice(0, 2),
                    builtIn: false
                });
            });

            it('should return options object for an AngularJS 1.5 `.component`', function() {
                if (!moduleInstance.component) {
                    return;
                }

                var componentControllerFn = jasmine.createSpy();

                var componentDefinition = {
                    controller: [function () {
                        return componentControllerFn;
                    }]
                };

                moduleInstance.component('aNg15Component', componentDefinition);

                var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$compileProvider', 'aNg15Component');

                expect(result).toEqual([{
                    providerMethod: 'component',
                    componentName: 'aNg15Component',
                    rawDeclaration: componentDefinition,
                    strippedDeclaration: componentDefinition,
                    injectedServices: [],
                    builtIn: false
                }]);

            });
        });


        describe('for $animateProvider', function() {

            it('should throw exception for non-existing animation', function() {
                expect(function() {
                    moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$animateProvider', 'aNonExistingAnimation');
                }).toThrow('Could not find registered component "aNonExistingAnimation" for provider: $animateProvider');
            });

            it('should return declared animation', function() {
                var animationDeclaration = ['anotherService', '$http', function() {
                    return {
                        enter: angular.noop
                    };
                }];

                moduleInstance.animation('.anAnimation', animationDeclaration);

                var result = moduleIntrospectorFactory(['aModule']).getProviderComponentDeclarations('$animateProvider', '.anAnimation');

                expect(result).toEqual([{
                    providerMethod: 'register',
                    componentName: '.anAnimation',
                    rawDeclaration: animationDeclaration,
                    strippedDeclaration: animationDeclaration[2],
                    injectedServices: animationDeclaration.slice(0, 2),
                    builtIn: false
                }]);
            });
        });


        it('should include an additional module', function() {
            var factoryFn = function() {
                return {};
            };
            var annotatedFactoryFn = ['$http', factoryFn];

            angular.module('anAdditionalModule', [])
                .factory('serviceFromAdditionalModule', annotatedFactoryFn);

            expect(moduleIntrospectorFactory(['aModule', 'anAdditionalModule']).getProviderComponentDeclarations(
                    '$provide', 'serviceFromAdditionalModule')).toEqual([
                    {
                        providerMethod: 'factory',
                        componentName: 'serviceFromAdditionalModule',
                        rawDeclaration: annotatedFactoryFn,
                        strippedDeclaration : factoryFn,
                        injectedServices: ['$http'],
                        builtIn: false
                    }]);
        });

        it('should include key - value pairs provided as an object', function() {
            var moduleIntrospector = moduleIntrospectorFactory(['aModule', {aKey1: 'aValue1', aKey2: 'aValue2'}]);

            expect(moduleIntrospector.getProviderComponentDeclarations('$provide', 'aKey1')).toEqual([{
                        providerMethod: 'value', componentName: 'aKey1', rawDeclaration: 'aValue1', strippedDeclaration : 'aValue1',
                        injectedServices: [], builtIn: false
                    }]);
            expect(moduleIntrospector.getProviderComponentDeclarations('$provide', 'aKey2')).toEqual([{
                        providerMethod: 'value', componentName: 'aKey2', rawDeclaration: 'aValue2', strippedDeclaration : 'aValue2',
                        injectedServices: [], builtIn: false
                    }]);

        });

        it('should return service instance of provider registered in config fn', function() {
            var stripped$GetMethod = function() {
                return {};
            };
            var annotated$GetMethod = ['$http', stripped$GetMethod];
            var moduleIntrospector = moduleIntrospectorFactory(['aModule', function($provide) {
                    $provide.provider('aProviderRegisteredInConfigFn', {
                        $get: annotated$GetMethod
                    });
                }]);

            expect(moduleIntrospector.getProviderComponentDeclarations('$provide', 'aProviderRegisteredInConfigFn')).toEqual([
                    {
                        providerMethod: 'provider', componentName: 'aProviderRegisteredInConfigFn', rawDeclaration: annotated$GetMethod,
                        strippedDeclaration: stripped$GetMethod, injectedServices: ['$http'], builtIn: false
                    }]);
        });
    });



    describe('getProviderDeclaration method', function() {
        it('should throw exception for unknown provider name', function() {
            expect(function() {
                moduleIntrospectorFactory(['aModule']).getProviderDeclaration('anUnknownProvider');
            }).toThrow('Could not find provider: anUnknownProvider');
        });

        it('should return provider object', function() {
            moduleInstance.provider('aService', originalProviderObject);

            expect(moduleIntrospectorFactory(['aModule']).getProviderDeclaration('aServiceProvider')).toEqual({
                rawDeclaration: originalProviderObject,
                strippedDeclaration: originalProviderObject,
                injectedProviders: [],
                builtIn: false
            });
        });

        describe('should return provider constructor', function() {
            it('when its non-annotated', function() {
                moduleInstance.provider('aService',
                        originalProviderConstructor[originalProviderConstructor.length - 1]);

                expect(moduleIntrospectorFactory(['aModule']).getProviderDeclaration('aServiceProvider')).toEqual({
                    rawDeclaration: originalProviderConstructor[originalProviderConstructor.length - 1],
                    strippedDeclaration: originalProviderConstructor[originalProviderConstructor.length - 1],
                    injectedProviders: ['$provide', '$compileProvider'],
                    builtIn: false
                });
            });

            it('when its annotated', function() {
                moduleInstance.provider('aService', originalProviderConstructor);

                expect(moduleIntrospectorFactory(['aModule']).getProviderDeclaration('aServiceProvider')).toEqual({
                    rawDeclaration: originalProviderConstructor,
                    strippedDeclaration: originalProviderConstructor[originalProviderConstructor.length - 1],
                    injectedProviders: ['$provide', '$compileProvider'],
                    builtIn: false
                });
            });
        });


        describe('a provider object should allow overriding', function() {
            afterEach(function() {
                moduleInstance.provider('aService', originalProviderObject);

                expect(moduleIntrospectorFactory(['aModule']).getProviderDeclaration('aServiceProvider')).toEqual({
                    rawDeclaration: originalProviderObject,
                    strippedDeclaration: originalProviderObject,
                    injectedProviders: [],
                    builtIn: false
                });
            });


            describe('from another module', function() {
                it('a value', function() {
                    anotherModuleInstance.value('aService', originalValue);
                });

                it('a service', function() {
                    anotherModuleInstance.service('aService', originalService);
                });

                it('a factory', function() {
                    anotherModuleInstance.factory('aService', originalFactory);
                });

                it('a provider object', function() {
                    anotherModuleInstance.provider('aService', originalProviderObject);
                });

                it('a provider constructor', function() {
                    anotherModuleInstance.provider('aService', originalProviderConstructor);
                });
            });

            describe('from the same module', function() {
                it('a value', function() {
                    moduleInstance.value('aService', originalValue);
                });

                it('a service', function() {
                    moduleInstance.service('aService', originalService);
                });

                it('a factory', function() {
                    moduleInstance.factory('aService', originalFactory);
                });

                it('a provider object', function() {
                    moduleInstance.provider('aService', originalProviderObject);
                });

                it('a provider constructor', function() {
                    moduleInstance.provider('aService', originalProviderConstructor);
                });
            });
        });

        describe('a provider constructor should allow overriding', function() {
            afterEach(function() {
                moduleInstance.provider('aService', overriddenProviderConstructor);

                expect(moduleIntrospectorFactory(['aModule']).getProviderDeclaration('aServiceProvider')).toEqual({
                    rawDeclaration: overriddenProviderConstructor,
                    strippedDeclaration: overriddenProviderConstructor[originalProviderConstructor.length - 1],
                    injectedProviders: ['$provide', '$compileProvider'],
                    builtIn: false
                });
            });


            describe('from another module', function() {
                it('a value', function() {
                    anotherModuleInstance.value('aService', originalValue);
                });

                it('a service', function() {
                    anotherModuleInstance.service('aService', originalService);
                });

                it('a factory', function() {
                    anotherModuleInstance.factory('aService', originalFactory);
                });

                it('a provider object', function() {
                    anotherModuleInstance.provider('aService', originalProviderObject);
                });

                it('a provider constructor', function() {
                    anotherModuleInstance.provider('aService', originalProviderConstructor);
                });
            });

            describe('from the same module', function() {
                it('a value', function() {
                    moduleInstance.value('aService', originalValue);
                });

                it('a service', function() {
                    moduleInstance.service('aService', originalService);
                });

                it('a factory', function() {
                    moduleInstance.factory('aService', originalFactory);
                });

                it('a provider object', function() {
                    moduleInstance.provider('aService', originalProviderObject);
                });

                it('a provider constructor', function() {
                    moduleInstance.provider('aService', originalProviderConstructor);
                });
            });
        });


        describe('should properly handle multiple registered providers', function() {
            beforeEach(function() {
                moduleInstance.provider({
                    aService: originalProviderConstructor,
                    anotherService: overriddenProviderConstructor
                });
            });

            it('and register the first', function() {
                expect(moduleIntrospectorFactory(['aModule']).getProviderDeclaration('aServiceProvider')).toEqual({
                    rawDeclaration: originalProviderConstructor,
                    strippedDeclaration: originalProviderConstructor[originalProviderConstructor.length - 1],
                    injectedProviders: ['$provide', '$compileProvider'],
                    builtIn: false
                });
            });

            it('and register the second', function() {
                expect(moduleIntrospectorFactory(['aModule']).getProviderDeclaration('anotherServiceProvider')).toEqual({
                    rawDeclaration: overriddenProviderConstructor,
                    strippedDeclaration: overriddenProviderConstructor[overriddenProviderConstructor.length - 1],
                    injectedProviders: ['$provide', '$compileProvider'],
                    builtIn: false
                });
            });
        });


        it('should return provider registered in config fn', function() {
            var ProviderConstructor = function() {
                this.$get = function() {
                    return {};
                };
            };
            var annotatedProviderFactoryFn = ['$httpProvider', ProviderConstructor];

            var moduleIntrospector = moduleIntrospectorFactory(['aModule', function($provide) {
                    $provide.provider('aProviderRegisteredInConfigFn', annotatedProviderFactoryFn);
                }]);

            expect(moduleIntrospector.getProviderDeclaration('aProviderRegisteredInConfigFnProvider')).toEqual(
                    {
                        rawDeclaration: annotatedProviderFactoryFn, strippedDeclaration: ProviderConstructor,
                        injectedProviders: ['$httpProvider'], builtIn: false
                    });
        });
    });



    describe('getBuiltInProviderNames method', function() {
        var moduleIntrospector;

        beforeEach(function() {
            moduleInstance
                .constant('aConstantService', {})
                .value('aValueService', {})
                .service('aServiceService', angular.noop)
                .factory('aServiceFactory', function() {
                    return {};
                })
                .provider('aServiceProvider', {
                    $get: function() {
                        return {};
                    }
                });

            moduleIntrospector = moduleIntrospectorFactory(['aModule']);
        });


        it('should return an array that contains "$filterProvider"', function() {
            expect(moduleIntrospector.getBuiltInProviderNames()).toContain('$filterProvider');
        });

        it('should return an array that contains "$controllerProvider"', function() {
            expect(moduleIntrospector.getBuiltInProviderNames()).toContain('$controllerProvider');
        });

        it('should return an array that contains "$compileProvider"', function() {
            expect(moduleIntrospector.getBuiltInProviderNames()).toContain('$compileProvider');
        });

        it('should return an array that contains "$animateProvider"', function() {
            expect(moduleIntrospector.getBuiltInProviderNames()).toContain('$animateProvider');
        });

        it('should return an array that contains "$logProvider"', function() {
            expect(moduleIntrospector.getBuiltInProviderNames()).toContain('$logProvider');
        });

        it('should return an array that does not contain any on the non built-in service', function() {
            var result = moduleIntrospector.getBuiltInProviderNames();

            expect(result).not.toContain('aServiceConstantProvider');
            expect(result).not.toContain('aServiceValueProvider');
            expect(result).not.toContain('aServiceServiceProvider');
            expect(result).not.toContain('aServiceFactoryProvider');
            expect(result).not.toContain('aServiceProviderProvider');
        });
    });



    describe('getProviderMetadata method', function() {
        var moduleIntrospector;

        beforeEach(function() {
            moduleIntrospector = moduleIntrospectorFactory(['aModule']);
        });


        it('should return correct metadata for $provide', function() {
            expect(moduleIntrospector.getProviderMetadata('$provide')).toEqual({
                providerMethods: ['constant', 'value', 'service', 'factory', 'provider'],
                overridesEarlierRegistrations: true
            });
        });

        it('should return correct metadata for $filterProvider', function() {
            expect(moduleIntrospector.getProviderMetadata('$filterProvider'))
                .toEqual({providerMethods: ['register'], overridesEarlierRegistrations: true});
        });

        it('should return correct metadata for $controllerProvider', function() {
            expect(moduleIntrospector.getProviderMetadata('$controllerProvider'))
                .toEqual({providerMethods: ['register'], overridesEarlierRegistrations: true});
        });

        it('should return correct metadata for $compileProvider', function() {
            expect(moduleIntrospector.getProviderMetadata('$compileProvider'))
                .toEqual({providerMethods: ['directive', 'component'], overridesEarlierRegistrations: false});
        });

        it('should return correct metadata for $animateProvider', function() {
            expect(moduleIntrospector.getProviderMetadata('$animateProvider'))
                .toEqual({providerMethods: ['register'], overridesEarlierRegistrations: true});
        });

        it('should return null when no metadata is available', function() {
            expect(moduleIntrospector.getProviderMetadata('$logProvider')).toBe(null);
        });
    });
});