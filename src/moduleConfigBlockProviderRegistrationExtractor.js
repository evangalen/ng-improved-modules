;(function() {
'use strict';

/** @const */
var registrationMethodPerProvider = {
    $animateProvider: 'register',
    $filterProvider: 'register',
    $controllerProvider: 'register',
    $compileProvider: 'directive'
};

/** @const */
var emptyInjector = angular.injector([]);


ModuleConfigBlockProviderRegistrationExtractor.$inject = [];

/** @constructor */
function ModuleConfigBlockProviderRegistrationExtractor() {

    function $provideMethodFactory(providerMethod) {

        /**
         * param {(string|Object.<*>)} firstArg
         * @param {(*|Object.<*>)=} secondArg
         */
        return function (firstArg, secondArg) {

            function handleServiceRegistration(serviceName, declaration) {
                var $provideFactoryOriginalFn = null;

                try {
                    var builtInFilters = null;

                    if (providerMethod === 'provider' && serviceName === '$filter') {
                        $provideFactoryOriginalFn = $provide.factory;

                        builtInFilters = {};

                        $provide.factory = function (firstArg, secondArg) {
                            var factoryResult = $provideFactoryOriginalFn.apply($provide, arguments);

                            if (angular.isObject(firstArg)) {
                                angular.forEach(firstArg, function (factoryFn, serviceName) {
                                    builtInFilters[serviceName] = factoryFn;
                                });
                            } else {
                                builtInFilters[firstArg] = secondArg;
                            }

                            return factoryResult;
                        };
                    }

                    var $providerMethodResult = $provide[providerMethod].call($provide, firstArg, secondArg);

                    if (serviceName === itemName) {
                        result = {providerMethod: providerMethod, declaration: declaration};
                    } else if (builtInFilters) {
                        angular.forEach(builtInFilters, function (serviceFactory, serviceName) {
                            if (serviceName === itemName) {
                                result = {providerMethod: 'factory', declaration: serviceFactory};
                            }
                        });
                    }

                    return $providerMethodResult;
                } finally {
                    if ($provideFactoryOriginalFn) {
                        $provide.factory = $provideFactoryOriginalFn;
                    }
                }
            }


            //TODO: use a future "provider(name)" property from "result"
            if (result && isConstantService(providerName, result.providerMethod) && !(providerName === '$provide' && providerMethod === 'constant')) {
                return;
            }

            if (angular.isObject(firstArg)) {
                var $provideMethodResult = {};

                angular.forEach(firstArg, function (declaration, serviceName) {
                    $provideMethodResult[serviceName] = handleServiceRegistration(serviceName, declaration);
                });

                return $provideMethodResult;
            } else {
                return handleServiceRegistration(firstArg, secondArg);
            }
        };
    }

    function createConfigElement(provider, method, invocationArguments) {
        return [provider, method, invocationArguments];
    }


    /**
     *
     * @param $provide
     * @param {Array.<Array.<*>>} configBlock
     * @param {Object.<string, Object>} previouslyRegisteredProviders
     * @returns {Array.<Array.<*>>}
     */
    this.extractProviderRegistrationsFromModuleConfigBlock = function (
            $provide, configBlock, previouslyRegisteredProviders) {
        var result = [];

        var annotatedConfigBlock = angular.isFunction(configBlock) ? emptyInjector.annotate(configBlock) : configBlock;

        if (annotatedConfigBlock.length !== 2 || annotatedConfigBlock[0] !== '$provide') {
            return;
        }

        var $provideWrapper = {
            provider: $provideMethodFactory('provider'),
            factory: $provideMethodFactory('factory'),
            service: $provideMethodFactory('service'),
            value: $provideMethodFactory('value'),
            constant: $provideMethodFactory('constant'),

            //TODO: add support for "decorator" (if at all possible)
            decorator: angular.noop
        };

        emptyInjector.invoke(annotatedConfigBlock, angular.module('ng'), {$provide: $provideWrapper});

        return result;
    };

}

angular.module('ngImprovedModules')
    .service('ModuleConfigBlockProviderRegistrationExtractor', ModuleConfigBlockProviderRegistrationExtractor);

}());