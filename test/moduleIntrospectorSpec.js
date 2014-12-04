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



    describe('getProviderComponentDeclaration method', function() {

        it('should throw exception for unknown provider name', function() {
            expect(function() {
                moduleIntrospectorFactory('aModule').getProviderComponentDeclaration('anUnknownProvider', 'aComponentName');
            }).toThrow('Could not find registered component "aComponentName" for provider: anUnknownProvider');
        });


        describe('for $provide', function() {

            it('should throw an exception for a non existing service', function() {
                expect(function() {
                    moduleIntrospectorFactory('aModule').getProviderComponentDeclaration('$provide', 'nonExistingService');
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
                    var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration('$provide', 'aService');

                    expect(result).toBeTruthy();
                    expect(result.providerMethod).toBe('constant');
                    expect(result.componentName).toBe('aService');
                    expect(result.rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result.strippedDeclaration).toBe(expectedRawDeclaration);
                    expect(result.injectedServices).toEqual([]);
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
                    var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration('$provide', 'aService');

                    expect(result).toBeTruthy();
                    expect(result.providerMethod).toBe(expectedProviderMethod);
                    expect(result.componentName).toBe('aService');
                    expect(result.rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result.strippedDeclaration).toBe(expectedRawDeclaration);
                    expect(result.injectedServices).toEqual([]);
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
                    var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration('$provide', 'aService');

                    expect(result).toBeTruthy();
                    expect(result.providerMethod).toBe(expectedProviderMethod);
                    expect(result.componentName).toBe('aService');
                    expect(result.rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result.strippedDeclaration).toBe(expectedStrippedDeclaration || expectedRawDeclaration);
                    expect(result.injectedServices).toEqual(expectedInjectedServices || []);
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
                    var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration('$provide', 'aService');

                    expect(result).toBeTruthy();
                    expect(result.providerMethod).toBe(expectedProviderMethod);
                    expect(result.componentName).toBe('aService');
                    expect(result.rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result.strippedDeclaration).toBe(expectedStrippedDeclaration || expectedRawDeclaration);
                    expect(result.injectedServices).toEqual(expectedInjectedServices || []);
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
                    var result =
                        moduleIntrospectorFactory('aModule').getProviderComponentDeclaration('$provide', expectedComponentName);

                    expect(result).toBeTruthy();
                    expect(result.providerMethod).toBe(expectedProviderMethod);
                    expect(result.componentName).toBe(expectedComponentName);
                    expect(result.rawDeclaration).toBe(expectedRawDeclaration);
                    expect(result.strippedDeclaration).toBe(expectedStrippedDeclaration || expectedRawDeclaration);
                    expect(result.injectedServices).toEqual(expectedInjectedServices || []);
                });

            });


        });


        describe('for $filterProvider', function() {
            it('should throw exception for non-existing filter', function() {
                expect(function() {
                    moduleIntrospectorFactory('aModule')
                        .getProviderComponentDeclaration('$filterProvider', 'aNonExistingFilter');
                }).toThrow('Could not find registered component "aNonExistingFilter" for provider: $filterProvider');
            });

            it('should return built-in (from "ng" module) filter', function() {
                var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration(
                        '$filterProvider', 'currency');

                expect(result).toBeTruthy();
                expect(result.providerMethod).toBe('register');
                expect(result.componentName).toBe('currency');
                expect(angular.isFunction(result.rawDeclaration)).toBe(true);
                expect(result.rawDeclaration.$inject).toEqual(['$locale']);
                expect(result.strippedDeclaration).toBe(result.rawDeclaration);
                expect(result.injectedServices).toEqual(['$locale']);
                expect(result.builtIn).toBe(true);
            });

            it('should return declared filter', function() {
                var filterFactory = ['anotherService', '$http', function() {
                    return function() {};
                }];

                moduleInstance.filter('aFilter', filterFactory);

                var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration(
                        '$filterProvider', 'aFilter');

                expect(result).toEqual({
                    providerMethod: 'register',
                    componentName: 'aFilter',
                    rawDeclaration: filterFactory,
                    strippedDeclaration: filterFactory[2],
                    injectedServices: filterFactory.slice(0, 2),
                    builtIn: false
                });
            });
        });


        describe('for $controllerProvider', function() {

            it('should throw exception for non-existing controller', function() {
                expect(function() {
                    moduleIntrospectorFactory('aModule')
                        .getProviderComponentDeclaration('$controllerProvider', 'aNonExistingController');
                }).toThrow('Could not find registered component "aNonExistingController" for provider: ' +
                        '$controllerProvider');
            });

            it('should return declared controller', function() {
                var controllerConstructor = ['anotherService', '$http', function() {
                }];

                moduleInstance.controller('aController', controllerConstructor);

                var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration(
                        '$controllerProvider', 'aController');

                expect(result).toEqual({
                    providerMethod: 'register',
                    componentName: 'aController',
                    rawDeclaration: controllerConstructor,
                    strippedDeclaration: controllerConstructor[2],
                    injectedServices: controllerConstructor.slice(0, 2),
                    builtIn: false
                });
            });
        });


        describe('for $compileProvider', function() {

            it('should throw exception for non-existing directive', function() {
                expect(function() {
                    moduleIntrospectorFactory('aModule')
                        .getProviderComponentDeclaration('$compileProvider', 'aNonExistingDirective');
                }).toThrow('Could not find registered component "aNonExistingDirective" for provider: ' +
                        '$compileProvider');
            });

            it('should return built-in (from "ng" module) directive', function() {
                var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration(
                        '$compileProvider', 'option');

                expect(result).toBeTruthy();
                expect(result.providerMethod).toBe('directive');
                expect(result.componentName).toBe('option');
                expect(angular.isArray(result.rawDeclaration)).toBe(true);
                expect(result.rawDeclaration.length).toBe(2);
                expect(result.rawDeclaration[0]).toBe('$interpolate');
                expect(angular.isFunction(result.rawDeclaration[1])).toBe(true);
                expect(result.strippedDeclaration).toBe(result.rawDeclaration[1]);
                expect(result.injectedServices).toEqual(['$interpolate']);
                expect(result.builtIn).toBe(true);
            });

            it('should return declared directive', function() {
                var directiveLinkFn = jasmine.createSpy();

                var directiveDeclaration = ['anotherService', '$http', function() {
                    return directiveLinkFn;
                }];

                moduleInstance.directive('aDirective', directiveDeclaration);

                var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration(
                        '$compileProvider', 'aDirective');

                expect(result).toEqual({
                    providerMethod: 'directive',
                    componentName: 'aDirective',
                    rawDeclaration: directiveDeclaration,
                    strippedDeclaration: directiveDeclaration[2],
                    injectedServices: directiveDeclaration.slice(0, 2),
                    builtIn: false
                });
            });
        });


        describe('for $animateProvider', function() {

            it('should throw exception for non-existing animation', function() {
                expect(function() {
                    moduleIntrospectorFactory('aModule').getProviderComponentDeclaration(
                            '$animateProvider', 'aNonExistingAnimation');
                }).toThrow('Could not find registered component "aNonExistingAnimation" for provider: ' +
                        '$animateProvider');
            });

            it('should return declared animation', function() {
                var animationDeclaration = ['anotherService', '$http', function() {
                    return {
                        enter: angular.noop
                    };
                }];

                moduleInstance.animation('.anAnimation', animationDeclaration);

                var result = moduleIntrospectorFactory('aModule').getProviderComponentDeclaration(
                        '$animateProvider', '.anAnimation');

                expect(result).toEqual({
                    providerMethod: 'register',
                    componentName: '.anAnimation',
                    rawDeclaration: animationDeclaration,
                    strippedDeclaration: animationDeclaration[2],
                    injectedServices: animationDeclaration.slice(0, 2),
                    builtIn: false
                });
            });
        });

    });



    describe('getProviderDeclaration method', function() {
        it('should throw exception for unknown provider name', function() {
            expect(function() {
                moduleIntrospectorFactory('aModule').getProviderDeclaration('anUnknownProvider');
            }).toThrow('Could not find provider: anUnknownProvider');
        });

        it('should return provider object', function() {
            moduleInstance.provider('aService', originalProviderObject);

            expect(moduleIntrospectorFactory('aModule').getProviderDeclaration('aServiceProvider')).toEqual({
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

                expect(moduleIntrospectorFactory('aModule').getProviderDeclaration('aServiceProvider')).toEqual({
                    rawDeclaration: originalProviderConstructor[originalProviderConstructor.length - 1],
                    strippedDeclaration: originalProviderConstructor[originalProviderConstructor.length - 1],
                    injectedProviders: ['$provide', '$compileProvider'],
                    builtIn: false
                });
            });

            it('when its annotated', function() {
                moduleInstance.provider('aService', originalProviderConstructor);

                expect(moduleIntrospectorFactory('aModule').getProviderDeclaration('aServiceProvider')).toEqual({
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

                expect(moduleIntrospectorFactory('aModule').getProviderDeclaration('aServiceProvider')).toEqual({
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

                expect(moduleIntrospectorFactory('aModule').getProviderDeclaration('aServiceProvider')).toEqual({
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
                expect(moduleIntrospectorFactory('aModule').getProviderDeclaration('aServiceProvider')).toEqual({
                    rawDeclaration: originalProviderConstructor,
                    strippedDeclaration: originalProviderConstructor[originalProviderConstructor.length - 1],
                    injectedProviders: ['$provide', '$compileProvider'],
                    builtIn: false
                });
            });

            it('and register the second', function() {
                expect(moduleIntrospectorFactory('aModule').getProviderDeclaration('anotherServiceProvider')).toEqual({
                    rawDeclaration: overriddenProviderConstructor,
                    strippedDeclaration: overriddenProviderConstructor[overriddenProviderConstructor.length - 1],
                    injectedProviders: ['$provide', '$compileProvider'],
                    builtIn: false
                });
            });
        });

    });

});