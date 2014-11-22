'use strict';

/**
 * @typedef {(Function|Array.<(string|Function)>)} PossiblyAnnotatedFn
 */

/**
 * @typedef {({$get: Function|Array.<(string|Function)>}|Function|Array.<(string|Function)>)} RawServiceProviderDeclaration
 */

/**
 * @typedef {({$get: Function|Array.<(string|Function)>}|Function)} StrippedServiceProviderDeclaration
 */


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
     * @param {function(string, *)} afterMethodLogic
     */
    function afterProviderMethodExecution(providerInstance, methodName, afterMethodLogic) {
        return afterExecution(providerInstance, methodName, supportObject(afterMethodLogic));
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
     * @param {object} object
     * @param {string} methodName
     * @param {Function} afterMethodLogic
     */
    function afterExecution(object, methodName, afterMethodLogic) {
        var originalMethod = object[methodName];

        object[methodName] = function() {
            var result = originalMethod.apply(this, arguments);

            afterMethodLogic.apply(this, arguments);

            return result;
        };
    }

    /**
     * @param {PossiblyAnnotatedFn} possibleAnnotatedFn
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
     * @param {PossiblyAnnotatedFn} possibleAnnotatedFn
     * @returns {string[]}
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
     * @param {string[]} injectedServices
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
     *      injectedServices: string[]
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
     * @param {string} serviceName
     * @returns {boolean}
     */
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
     * @param {RawServiceProviderDeclaration} rawDeclaration
     * @param {StrippedServiceProviderDeclaration} strippedDeclaration
     * @param {string[]} injectedServices
     */
    function registerServiceProviderDeclaration(
            serviceProviderName, rawDeclaration, strippedDeclaration, injectedServices) {
        serviceProviderDeclarationPerProviderName[serviceProviderName] = {
                rawDeclaration: rawDeclaration,
                strippedDeclaration: strippedDeclaration,
                injectedServices: injectedServices
            };
    }

    function registerBuiltInFilters($FilterProvider) {
        var $provideCapturingFactoryInvocations = {
            factory: function(name, getFn) {
                var suffix = 'Filter';

                var endsWithFilterSuffix = name.indexOf(suffix, name.length - suffix.length) !== -1;
                if (!endsWithFilterSuffix) {
                    throw 'Unexpected registered factory: ' + name;
                }

                var providerName = '$filterProvider';
                var filterProviderRegistrationMethodName = registrationMethodPerProvider[providerName];
                var nameWithoutSuffix = name.substring(0, name.length - suffix.length);

                registerComponent(providerName, filterProviderRegistrationMethodName, nameWithoutSuffix, getFn,
                    stripAnnotations(getFn), determineInjectedServices(getFn));
            }
        };


        emptyInjector.instantiate($FilterProvider, {$provide: $provideCapturingFactoryInvocations});
    }


    /**
     * @type {
     *  Object.<
     *      Object.<{
     *          providerMethod: string,
     *          componentName: string,
     *          rawDeclaration: *,
     *          strippedDeclaration: *,
     *          injectedServices: string[]
     *      }>
     *  >}
     */
    var registeredComponentsPerProviderName = {};

    /**
      * @type {
      *  Object.<{
      *     rawDeclaration: RawServiceProviderDeclaration,
      *     strippedDeclaration: StrippedServiceProviderDeclaration,
      *     injectedServices: string[]
      *  }>}
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

        afterProviderMethodExecution($provide, 'service', function(/** string */ name, /** PossiblyAnnotatedFn */ service) {
            if (!existingConstantService(name)) {
                registerService('service', name,
                    service, stripAnnotations(service), determineInjectedServices(service));
            }
        });

        afterProviderMethodExecution($provide, 'factory', function(/** string */ name, /** PossiblyAnnotatedFn */ getFn) {
            if (!existingConstantService(name)) {
                registerService('factory', name,
                    getFn, stripAnnotations(getFn), determineInjectedServices(getFn));
            }
        });

        afterProviderMethodExecution($provide, 'provider', function(/** string */ name, /** RawServiceProviderDeclaration */ provider) {
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
                registerBuiltInFilters(provider);
            }


            var registrationMethodOfProvider = registrationMethodPerProvider[providerName];
            if (registrationMethodOfProvider) {
                afterProviderMethodExecution(providerInstance, registrationMethodOfProvider, function(
                        /** string */ name,
                        /** Function|Array.<(string|Function)> */ rawDeclaration) {
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
     *      injectedServices: string[]
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
     *      injectedServices: string[]
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
     *      injectedServices: string[]
     *  }}
     */
    this.getServiceDeclaration = function(serviceName) {
        return this.getComponentDeclaration('$provide', serviceName);
    };

    /**
     * @param {string} filterName
     * @returns {{
     *      componentName: string,
     *      rawDeclaration: PossiblyAnnotatedFn,
     *      strippedDeclaration: Function,
     *      injectedServices: string[]
     *  }}
     */
    this.getFilterDeclaration = function(filterName) {
        return this.getComponentDeclaration('$filterProvider', filterName);
    };

    /**
     * @param {string} controllerName
     * @returns {{
     *      componentName: string,
     *      rawDeclaration: PossiblyAnnotatedFn,
     *      strippedDeclaration: Function,
     *      injectedServices: string[]
     *  }}
     */
    this.getControllerDeclaration = function(controllerName) {
        return this.getComponentDeclaration('$controllerProvider', controllerName);
    };

    /**
     * @param {string} directiveName
     * @returns {{
     *      componentName: string,
     *      rawDeclaration: PossiblyAnnotatedFn,
     *      strippedDeclaration: Function,
     *      injectedServices: string[]
     *  }}
     */
    this.getDirectiveDeclaration = function(directiveName) {
        return this.getComponentDeclaration('$compileProvider', directiveName);
    };

    /**
     * @param {string} animationName
     * @returns {{
     *      componentName: string,
     *      rawDeclaration: PossiblyAnnotatedFn,
     *      strippedDeclaration: Function,
     *      injectedServices: string[]
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
