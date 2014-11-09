;(function() {
'use strict';

/** @const */
var angular1_0 = angular.version.full.indexOf('1.0.') === 0;


var numberOfBuildProviderProbingModules = 0;



// @ngInject
function moduleIntrospectorServiceFactory() {

    /**
     * @ngdoc type
     * @param {...string} moduleNames
     * @constructor
     */
    function ModuleIntrospector(moduleNames) {
        moduleNames = Array.prototype.slice.call(arguments, 0);

        /**
         * @param {string} providerName
         * @returns {{$get: Function|Array.<string|Function>}}
         */
        function resolveProviderInstanceForAngular1_0(providerName) {
            var providerDeclaration = getComponentDeclaration('$provide', providerName);

            if (angular.isObject(providerDeclaration.rawDeclaration) &&
                    !angular.isArray(providerDeclaration.rawDeclaration)) {
                return providerDeclaration.rawDeclaration;
            } else {
                var providerProbingModuleName =
                    'generatedProviderProbingModule#' + numberOfBuildProviderProbingModules;

                var providerInstance = null;

                angular.module(providerProbingModuleName, moduleNames)
                    .config([providerName, function(_providerInstance_) {
                        providerInstance = _providerInstance_;
                    }]);

                angular.injector(['ng', providerProbingModuleName]);

                return providerInstance;
            }
        }

        /**
         * @param {string} providerName
         * @returns {{$get: Function|Array.<string|Function>}}
         */
        function resolveProviderInstance(providerName) {
            if (angular1_0) {
                return resolveProviderInstanceForAngular1_0(providerName);
            } else {
                var providerInstance = providerInjector.get(providerName);

                if (!providerInstance) {
                    throw 'Could not find provider declaration for: ' + providerName;
                }

                return providerInstance;
            }
        }

        /**
         * @param {object} providerInstance
         * @param {string} methodName
         * @param {Function} afterMethodLogic
         */
        function afterProviderMethodExecution(providerInstance, methodName, afterMethodLogic) {
            var originalMethod = providerInstance[methodName];

            providerInstance[methodName] = function() {
                var result = originalMethod.apply(this, arguments);

                if (angular.isObject(arguments[0])) {
                    angular.forEach(arguments[0], function(rawDeclaration, componentName) {
                        afterMethodLogic(componentName, rawDeclaration, result);
                    });
                } else {
                    afterMethodLogic(arguments[0], arguments[1], result);
                }

                return result;
            };
        }

        /**
         * @param {Function|Array.<string|Function>} possibleAnnotatedFn
         * @returns {Function}
         */
        function stripAnnotations(possibleAnnotatedFn) {
            if (angular.isFunction(possibleAnnotatedFn)) {
                return possibleAnnotatedFn;
            } else {
                return possibleAnnotatedFn[possibleAnnotatedFn.length - 1];
            }
        }

        /**
         * @param {Function|Array.<string|Function>} possibleAnnotatedFn
         * @returns {Array.<string>}
         */
        function determineInjectedServices(possibleAnnotatedFn) {
            if (angular.isFunction) {
                return emptyInjector.annotate(possibleAnnotatedFn);
            } else {
                return possibleAnnotatedFn.slice(0, possibleAnnotatedFn.length - 2);
            }
        }

        /**
         * @param {string} providerName
         * @param {string} providerMethod
         * @param {string} componentName
         * @param {*} rawDeclaration
         * @param {*} strippedDeclaration
         * @param {Array.<string>} injectedServices
         */
        function registerComponent(
                providerName, providerMethod, componentName, rawDeclaration, strippedDeclaration, injectedServices) {
            var registeredComponents = registeredComponentsPerProviderName[providerName];
            if (!registeredComponents) {
                registeredComponents = {};
                registeredComponentsPerProviderName[providerName] = registeredComponents;
            }

            registeredComponents[componentName] = {
                providerMethod: providerMethod,
                componentName: componentName,
                rawDeclaration: rawDeclaration,
                strippedDeclaration: strippedDeclaration,
                injectedServices: injectedServices
            };
        }

        /**
         * @param {string} providerName
         * @param {string} componentName
         * @returns {{
         *      providerMethod: string,
         *      componentName: string,
         *      rawDeclaration: *,
         *      strippedDeclaration: *,
         *      injectedServices: Array.<string>
         *  }}
         */
        function getComponentDeclaration(providerName, componentName) {
            var registeredComponents = registeredComponentsPerProviderName[providerName];

            var registeredComponent = registeredComponents && registeredComponents[componentName];
            if (!registeredComponent) {
                throw 'Could not find registered component "' + componentName + '" for provider: ' + providerName;
            }

            return registeredComponent;
        }


        /**
         * @type {
         *  Object.<
         *      Object.<{
         *          providerMethod: string,
         *          componentName: string,
         *          rawDeclaration: *,
         *          strippedDeclaration: *,
         *          injectedServices: Array.<string>
         *      }>
         *  >}
         */
        var registeredComponentsPerProviderName = {};


        //TODO: use this (maybe after renaming it to a better name) to keep al <provider>Provider declaration?!?
//        var serviceProviderDeclarationPerProviderName = {};


        var registrationMethodPerProvider = {
            $filterProvider: 'register',
            $controllerProvider: 'register',
            $compileProvider: 'directive',
            $animateProvider: 'register'
        };


        var emptyInjector = angular.injector([]);

        var providerInjector = null;

        if (!angular1_0) {
            angular.injector(
                [function ($injector) {
                    providerInjector = $injector;
                }, 'ng'].concat(moduleNames));
        }


        var $provideAnnotatedHookFn = ['$provide', function($provide) {
            function existingConstantService(serviceName) {
                var registeredServices = registeredComponentsPerProviderName.$provide;
                if (!registeredServices) {
                    return false;
                }

                var registeredService = registeredServices[serviceName];
                return !!registeredService && registeredService[serviceName].providerMethod === 'constant';
            }


            var registerService = angular.bind(undefined, registerComponent, '$provide');


            afterProviderMethodExecution($provide, 'constant', function(/** string */ name, value) {
                registerService('constant', name, value, value, []);
            });

            afterProviderMethodExecution($provide, 'value', function(/** string */ name, value) {
                if (!existingConstantService(name)) {
                    registerService('value', name, value, value, []);
                }
            });

            afterProviderMethodExecution($provide, 'service', function(
                    /** string */ name,
                    /** Function|Array.<string|Function> */ service) {
                if (!existingConstantService(name)) {
                    registerService('service', name,
                        service, stripAnnotations(service), determineInjectedServices(service));
                }
            });

            afterProviderMethodExecution($provide, 'factory', function(
                    /** string */ name,
                    /** Function|Array.<string|Function> */ getFn) {
                if (!existingConstantService(name)) {
                    registerService('factory', name,
                        getFn, stripAnnotations(getFn), determineInjectedServices(getFn));
                }
            });

            afterProviderMethodExecution($provide, 'provider', function(
                    /** string */ name,
                    /** {$get: Function|Array.<string|Function>}|Function|Array.<string|Function> */ provider,
                    /** {$get: Function|Array.<string|Function>} */ providerMethodResult) {
                if (existingConstantService(name)) {
                    return;
                }

                var providerName = name + 'Provider';

                //TODO: register a <provider>Provider in a separate hash
                registerService('provider', providerName, provider,
                    stripAnnotations(provider),
                    !angular.isObject(provider) ? determineInjectedServices(provider) : null);


                //NOTE: turns out that when invokes with a object (instead of name + value) no result is returned
                var providerInstance = providerMethodResult || resolveProviderInstance(providerName);


                registerService('provider', name, providerInstance.$get,
                        stripAnnotations(providerInstance.$get), determineInjectedServices(providerInstance.$get));


                var registrationMethodOfProvider = registrationMethodPerProvider[providerName];
                if (registrationMethodOfProvider) {

                    afterProviderMethodExecution(providerInstance, registrationMethodOfProvider, function(
                            /** string */ name,
                            /** Function|Array.<string|Function> */ rawDeclaration) {
                        registerComponent(providerName, registrationMethodOfProvider, name, rawDeclaration,
                                stripAnnotations(rawDeclaration), determineInjectedServices(rawDeclaration));
                    });
                }
            });
        }];

        angular.injector([$provideAnnotatedHookFn, 'ng'].concat(moduleNames));


        /**
         * @param {string} providerName
         * @param {string} componentName
         * @returns {{
         *      providerMethod: string,
         *      componentName: string,
         *      rawDeclaration: *,
         *      strippedDeclaration: *,
         *      injectedServices: Array.<string>
         *  }}
         */
        this.getComponentDeclaration = function(providerName, componentName) {
            return getComponentDeclaration(providerName, componentName);
        };

        /**
         * @param {string} serviceProviderName
         * @returns {{
         *      serviceProviderName: string,
         *      rawDeclaration: *,
         *      strippedDeclaration: *,
         *      injectedServices: Array.<string>
         *  }}
         */
        this.getServiceProviderDeclaration = function(serviceProviderName) {
            var registeredComponent = this.getComponentDeclaration('$provide', serviceProviderName);

            return {
                serviceProviderName: serviceProviderName,
                rawDeclaration: registeredComponent.rawDeclaration,
                strippedDeclaration: stripAnnotations(registeredComponent.rawDeclaration),
                injectedServices: determineInjectedServices(registeredComponent.rawDeclaration)
            };
        };


        /**
         * @param {string} serviceName
         * @returns {{
         *      componentName: string,
         *      rawDeclaration: *,
         *      strippedDeclaration: *,
         *      injectedServices: Array.<string>
         *  }}
         */
        this.getServiceDeclaration = function(serviceName) {
            return this.getComponentDeclaration('$provide', serviceName);
        };

        /**
         * @param {string} filterName
         * @returns {{
         *      componentName: string,
         *      rawDeclaration: Function|Array.<string|Function>,
         *      strippedDeclaration: Function,
         *      injectedServices: Array.<string>
         *  }}
         */
        this.getFilterDeclaration = function(filterName) {
            return this.getComponentDeclaration('$filterProvider', filterName);
        };

        /**
         * @param {string} controllerName
         * @returns {{
         *      componentName: string,
         *      rawDeclaration: *,
         *      strippedDeclaration: *,
         *      injectedServices: Array.<string>
         *  }}
         */
        this.getControllerDeclaration = function(controllerName) {
            return this.getComponentDeclaration('$controllerProvider', controllerName);
        };

        /**
         * @param {string} directiveName
         * @returns {{
         *      componentName: string,
         *      rawDeclaration: *,
         *      strippedDeclaration: *,
         *      injectedServices: Array.<string>
         *  }}
         */
        this.getDirectiveDeclaration = function(directiveName) {
            return this.getComponentDeclaration('$compileProvider', directiveName);
        };

        if (!angular1_0) {
            /**
             * @param {string} animationName
             * @returns {{
             *      componentName: string,
             *      rawDeclaration: *,
             *      strippedDeclaration: *,
             *      injectedServices: Array.<string>
             *  }}
             */
            this.getAnimationDeclaration = function (animationName) {
                return this.getComponentDeclaration('$animateProvider', animationName);
            };
        }
    }


    /**
     * @ngdoc service
     * @name moduleIntrospector
     * @param {string} module
     * @returns {ModuleIntrospector}
     * @function
     */
    return function moduleIntrospector(module) {
        return new ModuleIntrospector(module);
    };

}


angular.module('ngModuleIntrospector')
    .factory('moduleIntrospector', moduleIntrospectorServiceFactory);
}());