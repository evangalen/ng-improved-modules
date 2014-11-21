;(function() {
    'use strict';


    /**
 * @ngdoc type
 * @param {...string} moduleNames
 * @constructor
 */
function ModuleIntrospector(moduleNames) {
    moduleNames = Array.prototype.slice.call(arguments, 0);

    /**
     * @param {object} providerInstance
     * @param {string} methodName
     * @param {function(string, *)} beforeMethodLogic
     * @param {function(string, *)} afterMethodLogic
     */
    function aroundProviderMethodExecution(providerInstance, methodName, beforeMethodLogic, afterMethodLogic) {
        return aroundExecution(
                providerInstance, methodName, supportObject(beforeMethodLogic), supportObject(afterMethodLogic));
    }

    /**
     * @param {function(string, *)} delegate
     * @returns {function((object|string), *=)}
     */
    function supportObject(delegate) {
        return function(key, value) {
            if (angular.isObject(key)) {
                angular.forEach(arguments[0], function(rawDeclaration, componentName) {
                    delegate(componentName, rawDeclaration);
                });
            } else {
                return delegate(key, value);
            }
        };
    }

    /**
     * @param {object} providerInstance
     * @param {string} methodName
     * @param {function(string, *)} afterMethodLogic
     */
    function afterProviderMethodExecution(providerInstance, methodName, afterMethodLogic) {
        return aroundProviderMethodExecution(providerInstance, methodName, angular.noop, afterMethodLogic);
    }

    /**
     * @param {object} object
     * @param {string} methodName
     * @param {Function} beforeMethodLogic
     * @param {Function} afterMethodLogic
     */
    function aroundExecution(object, methodName, beforeMethodLogic, afterMethodLogic) {
        var originalMethod = object[methodName];

        object[methodName] = function() {
            beforeMethodLogic.apply(this, arguments);

            var result = originalMethod.apply(this, arguments);

            afterMethodLogic.apply(this, arguments);

            return result;
        };
    }

    /**
     * @param {Function|Array.<(string|Function)>} possibleAnnotatedFn
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
     * @param {Function|Array.<(string|Function)>} possibleAnnotatedFn
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

    function existingConstantService(serviceName) {
        var registeredServices = registeredComponentsPerProviderName.$provide;
        if (!registeredServices) {
            return false;
        }

        var registeredService = registeredServices[serviceName];
        return !!registeredService && registeredService[serviceName].providerMethod === 'constant';
    }

    /**
     * @param {string} serviceProviderName
     * @param {{$get: Function|Array.<(string|Function)>}|Function|Array.<(string|Function)>} rawDeclaration
     * @param {{$get: Function|Array.<(string|Function)>}|Function} strippedDeclaration
     * @param {Array.<string>} injectedServices
     */
    function registerServiceProviderDeclaration(
            serviceProviderName, rawDeclaration, strippedDeclaration, injectedServices) {
        serviceProviderDeclarationPerProviderName[serviceProviderName] = {
                rawDeclaration: rawDeclaration,
                strippedDeclaration: strippedDeclaration,
                injectedServices: injectedServices
            };
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


    /**
      * @type {{
      *     serviceProviderName: string,
      *     rawDeclaration: {$get: Function|Array.<(string|Function)>}|Function|Array.<(string|Function)>,
      *     strippedDeclaration: {$get: Function|Array.<(string|Function)>}|Function,
      *     injectedServices: Array.<string>
      * }}
     */
    var serviceProviderDeclarationPerProviderName = {};


    var registrationMethodPerProvider = {
        $filterProvider: 'register',
        $controllerProvider: 'register',
        $compileProvider: 'directive',
        $animateProvider: 'register'
    };


    var emptyInjector = angular.injector([]);

    var providerInjector = null;

    /** @ngInject */
    var providerInjectorCapturingConfigFn = function ($injector) {
        providerInjector = $injector;
    };

    /** @ngInject */
    var $provideMethodsHookConfigFn = function($provide) {
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
                /** string */ name, /** Function|Array.<(string|Function)> */ service) {
            if (!existingConstantService(name)) {
                registerService('service', name,
                    service, stripAnnotations(service), determineInjectedServices(service));
            }
        });

        afterProviderMethodExecution($provide, 'factory', function(
                /** string */ name, /** Function|Array.<(string|Function)> */ getFn) {
            if (!existingConstantService(name)) {
                registerService('factory', name,
                    getFn, stripAnnotations(getFn), determineInjectedServices(getFn));
            }
        });

        afterProviderMethodExecution($provide, 'provider', function(
                /** string */ name,
                /** {$get: Function|Array.<(string|Function)>}|Function|Array.<(string|Function)> */ provider) {
            if (existingConstantService(name)) {
                return;
            }

            var providerName = name + 'Provider';

            var providerInjectedServices =
                angular.isFunction(provider) || angular.isArray(provider) ? determineInjectedServices(provider) : [];

            registerServiceProviderDeclaration(
                    providerName, provider, stripAnnotations(provider), providerInjectedServices);


            var providerInstance = providerInjector.get(providerName);

            registerService('provider', name, providerInstance.$get,
                    stripAnnotations(providerInstance.$get), determineInjectedServices(providerInstance.$get));

            if (name === '$filter') {
                var $provideCapturingFactoryInvocations = {
                    factory: function(name, getFn) {
                        var suffix = 'Filter';

                        var endsWithFilterSuffix = name.indexOf(suffix, name.length - suffix.length) !== -1;
                        if (!endsWithFilterSuffix) {
                            throw 'Unexpected registered factory: ' + name;
                        }

                        var filterProviderRegistrationMethodName = registrationMethodPerProvider[providerName];
                        var nameWithoutSuffix = name.substring(0, name.length - suffix.length);

                        registerComponent(providerName, filterProviderRegistrationMethodName, nameWithoutSuffix, getFn,
                                stripAnnotations(getFn), determineInjectedServices(getFn));
                    }
                };


                emptyInjector.instantiate(provider, {$provide: $provideCapturingFactoryInvocations});
            }


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
    };


    // create an injector that first captures the "providerInjector", the hook the $provide methods,
    // loads the ng module and finally loads all moduleNames.
    angular.injector([providerInjectorCapturingConfigFn, $provideMethodsHookConfigFn, 'ng'].concat(moduleNames));


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
     *      rawDeclaration: Function|Array.<(string|Function)>,
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


angular.module('ngModuleIntrospector')
    .factory('moduleIntrospector', function() {

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
    });
}());