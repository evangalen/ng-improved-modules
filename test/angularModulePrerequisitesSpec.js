/**
 * Jasmine specs that test non-documented API of "angular.Module" which are pre-required to implemented the
 * functionality of the "moduleIntrospector" service.
 * The specs allows for quick detection of whether a (future) AngularJS version is (still) compatible with the
 * "moduleIntrospector" service.
 */
describe('angular.Module', function() {
    'use strict';

    var angular1_0 = angular.version.full.indexOf('1.0.') === 0;

    var moduleInstance;

    beforeEach(function() {
        moduleInstance = angular.module('angularModulePrerequisitesSpecModule', []);
        spyOn(moduleInstance._invokeQueue, 'push').andCallThrough();
        spyOn(moduleInstance._invokeQueue, 'unshift').andCallThrough();
    });



    describe('"_invokeQueue" property', function() {

        it('should exist and initialized as []', function() {
            expect(moduleInstance._invokeQueue).not.toBeNull();
            expect(angular.isArray(moduleInstance._invokeQueue)).toBe(true);
            expect(moduleInstance._invokeQueue.length).toBe(0);
        });
    });



    describe('$provide delegate method', function() {

        var $provide;

        beforeEach(function() {
            moduleInstance.config(function(_$provide_) {
                $provide = _$provide_;

                angular.forEach($provide, function(value, key) {
                    if (angular.isFunction(value)) {
                        spyOn($provide, key).andCallThrough();
                    }
                });
            });
        });


        describe('"provider"', function() {
            describe('should initially be queued and later invoked when "auto.$injector" is created', function() {

                /** @const */
                var expectedConstructorServiceInstance = Object.freeze({});

                /** @const */
                var expectedObjectServiceInstance = Object.freeze({});

                /** @const */
                var providerObject = Object.freeze({
                    $get: function() {
                        return expectedObjectServiceInstance;
                    }
                });

                /** @constructor */
                function ProviderConstructor() {
                }
                ProviderConstructor.prototype.$get = function() {
                    return expectedConstructorServiceInstance;
                };


                it('with a name and service instance', function() {
                    moduleInstance.provider('aProviderName', providerObject);

                    assertMethodIsQueuedToBeInvokedLater(
                            '$provide', 'provider', 'push', 'aProviderName', providerObject);
                    expect(createServiceInstance('aProviderName')).toBe(expectedObjectServiceInstance);
                });

                it('with a name and service constructor', function() {
                    moduleInstance.provider('aProviderName', ProviderConstructor);

                    assertMethodIsQueuedToBeInvokedLater(
                        '$provide', 'provider', 'push', 'aProviderName', ProviderConstructor);
                    expect(createServiceInstance('aProviderName')).toBe(expectedConstructorServiceInstance);
                });

                it('with an object', function() {
                    var hash = {
                        usingObject: providerObject,
                        usingConstructor: ProviderConstructor
                    };

                    moduleInstance.provider(hash);

                    assertMethodIsQueuedToBeInvokedLater('$provide', 'provider', 'push', hash);
                    expect(createServiceInstance('usingObject')).toBe(expectedObjectServiceInstance);
                    expect(createServiceInstance('usingConstructor')).toBe(expectedConstructorServiceInstance);
                });
            });
        });


        describe('"factory"', function() {

            describe('should initially be queued and later invoked when "auto.$injector" is created', function() {

                /** @const */
                var expectedServiceInstance = Object.freeze({});

                function serviceFactory() {
                    return expectedServiceInstance;
                }


                it('with a name and factory function', function() {
                    moduleInstance.factory('aServiceName', serviceFactory);

                    assertMethodIsQueuedToBeInvokedLater('$provide', 'factory', 'push', 'aServiceName', serviceFactory);
                    expect(createServiceInstance('aServiceName')).toBe(expectedServiceInstance);
                });

                it('with an object', function() {
                    var hash = {
                        aServiceName: serviceFactory
                    };

                    moduleInstance.factory(hash);

                    assertMethodIsQueuedToBeInvokedLater('$provide', 'factory', 'push', hash);
                    expect(createServiceInstance('aServiceName')).toBe(expectedServiceInstance);
                });
            });
        });


        describe('"service"', function() {

            describe('should initially be queued and later invoked when "auto.$injector" is created', function() {

                /** @constructor */
                function ServiceConstructor() {
                }


                it('with a name and constructor', function() {
                    moduleInstance.service('aServiceName', ServiceConstructor);

                    assertMethodIsQueuedToBeInvokedLater(
                        '$provide', 'service', 'push', 'aServiceName', ServiceConstructor);
                    expect(createServiceInstance('aServiceName') instanceof ServiceConstructor).toBe(true);
                });

                it('with an object', function() {
                    var hash = {
                        aServiceName: ServiceConstructor
                    };

                    moduleInstance.service(hash);

                    assertMethodIsQueuedToBeInvokedLater('$provide', 'service', 'push', hash);
                    expect(createServiceInstance('aServiceName') instanceof ServiceConstructor).toBe(true);
                });
            });
        });


        describe('"value"', function() {

            describe('should initially be queued and later invoked when "auto.$injector" is created', function() {

                /** @const */
                var expectedServiceInstance = Object.freeze({});


                it('with a name and (any kind of) value', function() {
                    moduleInstance.value('aServiceName', expectedServiceInstance);

                    assertMethodIsQueuedToBeInvokedLater(
                        '$provide', 'value', 'push', 'aServiceName', expectedServiceInstance);
                    expect(createServiceInstance('aServiceName')).toBe(expectedServiceInstance);
                });

                it('with an object', function() {
                    var hash = {
                        aServiceName: expectedServiceInstance
                    };

                    moduleInstance.value(hash);

                    assertMethodIsQueuedToBeInvokedLater('$provide', 'value', 'push', hash);
                    expect(createServiceInstance('aServiceName')).toBe(expectedServiceInstance);
                });
            });
        });


        describe('"constant"', function() {

            describe('should initially be queued and later invoked when "auto.$injector" is created', function() {

                /** @const */
                var expectedServiceInstance = Object.freeze({});


                it('with a name and (any kind of) value', function() {
                    moduleInstance.constant('aServiceName', expectedServiceInstance);

                    assertMethodIsQueuedToBeInvokedLater(
                        '$provide', 'constant', 'unshift', 'aServiceName', expectedServiceInstance);
                    expect(createServiceInstance('aServiceName')).toBe(expectedServiceInstance);
                });

                it('with an object', function() {
                    var hash = {
                        aServiceName: expectedServiceInstance
                    };

                    moduleInstance.constant(hash);

                    assertMethodIsQueuedToBeInvokedLater('$provide', 'constant', 'unshift', hash);
                    expect(createServiceInstance('aServiceName')).toBe(expectedServiceInstance);
                });
            });
        });


        function createServiceInstance(serviceName) {
            var $injector = angular.injector([moduleInstance.name]);

            return $injector.get(serviceName);
        }
    });



    describe('$filterProvider delegate method', function() {

        var $filterProvider;

        beforeEach(function() {
            moduleInstance.config(function(_$filterProvider_) {
                $filterProvider = _$filterProvider_;

                spyOn($filterProvider, 'register').andCallThrough();
            });
        });


        describe('"filter" (for "register")', function() {

            var filter = function(text) {
                return text + '!';
            };

            var filterFactory = function() {
                return filter;
            };


            describe('should initially be queued and later invoked when "auto.$injector" is created', function() {

                it('with a name and filter factory', function() {
                    moduleInstance.filter('aFilterName', filterFactory);

                    assertMethodIsQueuedToBeInvokedLater(
                            '$filterProvider', 'register', 'push', 'aFilterName', filterFactory);
                    expect(createFilterInstance('aFilterName')).toBe(filter);
                });


                it('with an object' + (angular1_0 ? ' (not supported by angular 1.0) ' : ''), function() {
                    if (angular1_0) {
                        return;
                    }

                    var hash = {
                        aFilterName: filterFactory
                    };

                    moduleInstance.filter(hash);

                    assertMethodIsQueuedToBeInvokedLater('$filterProvider', 'register', 'push', hash);
                    expect(createFilterInstance('aFilterName')).toBe(filter);
                });
            });


            function createFilterInstance(filterName) {
                var $injector = angular.injector(['ng', moduleInstance.name]);
                var $filter = $injector.get('$filter');

                return $filter(filterName);
            }
        });

    });



    describe('$controllerProvider delegate method', function() {

        /** @constructor */
        function ControllerConstructor() {
        }


        describe('"controller" (for "register")', function() {

            describe('should initially be queued and later invoked when "auto.$injector" is created', function() {

                it('with a name and controller constructor', function() {
                    moduleInstance.controller('NameOfCtrl', ControllerConstructor);

                    assertMethodIsQueuedToBeInvokedLater(
                        '$controllerProvider', 'register', 'push', 'NameOfCtrl', ControllerConstructor);
                    expect(createControllerInstance('NameOfCtrl') instanceof ControllerConstructor).toBe(true);
                });

                it('with an object', function() {
                    var hash = {
                        NameOfCtrl: ControllerConstructor
                    };

                    moduleInstance.controller(hash);

                    assertMethodIsQueuedToBeInvokedLater('$controllerProvider', 'register', 'push', hash);
                    expect(createControllerInstance('NameOfCtrl') instanceof ControllerConstructor).toBe(true);
                });
            });
        });


        function createControllerInstance(controllerName) {
            var $injector = angular.injector(['ng', moduleInstance.name]);
            var $controller = $injector.get('$controller');

            return $controller(controllerName);
        }

    });



    describe('$compileProvider delegate method', function() {

        var directive;

        function directiveFactory() {
            return directive;
        }


        var $rootScope;

        beforeEach(inject(function(_$rootScope_) {
            $rootScope = _$rootScope_;

            directive = {
                restrict: 'E',
                template: '<span></span>'
            };
        }));


        describe('"directive" (for "register")', function() {
            describe('should initially be queued and later invoked when "auto.$injector" is created', function() {

                it('with a name and controller constructor', function() {
                    moduleInstance.directive('aDirective', directiveFactory);

                    assertMethodIsQueuedToBeInvokedLater(
                        '$compileProvider', 'directive', 'push', 'aDirective', directiveFactory);

                    var element = compileDirective();
                    expect(element.children().eq(0).prop('tagName')).toBe('SPAN');
                });

                it('with an object', function() {
                    var hash = {
                        aDirective: directiveFactory
                    };

                    moduleInstance.directive(hash);

                    assertMethodIsQueuedToBeInvokedLater('$compileProvider', 'directive', 'push', hash);

                    var element = compileDirective();
                    expect(element.children().eq(0).prop('tagName')).toBe('SPAN');
                });
            });
        });


        function compileDirective() {
            var $injector = angular.injector(['ng', moduleInstance.name]);
            var $compile = $injector.get('$compile');

            return $compile('<a-directive></a-directive>')($rootScope.$new());
        }

    });


    /**
     * Asserts that an invocation of <code>provider[method]</code> with arguments <code>firstInvokeArgument</code>
     * and <code>secondInvokeArgument</code> is "queued" on "moduleInstance" for "later invocation".
     *
     * @param {string} provider either "$provide" or a name like "...Provider"
     * @param {string} method either a "$provide" method or a configuration method of a "...Provider"
     * @param {string} insertMethod
     * @param {(string|Object.<*>)} firstInvokeArgument the first argument of the queued <code>provider[method]</code>
     *          invocation
     * @param {(*|Object.<*>)=} secondInvokeArgument the second argument of the queued <code>provider[method]</code>
     *          invocation
     */
    function assertMethodIsQueuedToBeInvokedLater(
            provider, method, insertMethod, firstInvokeArgument, secondInvokeArgument) {
        expect(moduleInstance._invokeQueue[insertMethod]).toHaveBeenCalled();

        var insertMethodInvokeArg = moduleInstance._invokeQueue[insertMethod].mostRecentCall.args[0];

        expect(insertMethodInvokeArg.length).toBe(3);
        expect(insertMethodInvokeArg[0]).toBe(provider);
        expect(insertMethodInvokeArg[1]).toBe(method);
        expect(insertMethodInvokeArg[2].length).toBe(secondInvokeArgument ? 2 : 1);
        expect(insertMethodInvokeArg[2][0]).toBe(firstInvokeArgument);
        if (secondInvokeArgument) {
            expect(insertMethodInvokeArg[2][1]).toBe(secondInvokeArgument);
        }
    }

});