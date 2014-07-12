;(function() {
'use strict';

/** @const */
var serviceRegistrationMethodNames = ['provider', 'factory', 'service', 'value', 'constant'];

// @ngInject
function moduleIntrospectorServiceFactory(moduleInvokeQueueItemInfoExtractor) {

    /**
     * @ngdoc type
     * @param {string} moduleName
     * @constructor
     */
    function ModuleIntrospector(moduleName) {

        var module = angular.module(moduleName);


        /**
         * @param {string} serviceName
         * @returns {{module: Object, providerName: string, providerMethod: string, declaration: *}}
         */
        this.getServiceDeclaration = function(serviceName) {
            var serviceInfo = getServiceInfo(serviceName);
            if (!serviceInfo.declaration) {
                throw 'Could not find declaration of service with name: ' + serviceName;
            }

            return serviceInfo;
        };

        /**
         * @param injector
         * @param {string} serviceName
         * @returns {Object.<{instance: *, module: angular.Module}>}
         */
        this.getServiceDependencies = function(injector, serviceName) {
            var serviceInfo = this.getServiceDeclaration(serviceName);

            return getRegisteredObjectDependencies(injector, serviceInfo);
        };

        /**
         *
         * @param {string} serviceName
         * @returns {boolean}
         */
        this.hasValueService = function(serviceName) {
            var serviceInfo = getServiceInfo(serviceName);

            return !!(serviceInfo && serviceInfo.declaration && serviceInfo.providerMethod === 'value');
        };

        /**
         *
         * @param {string} serviceName
         * @returns {boolean}
         */
        this.hasConstantService = function(serviceName) {
            var serviceInfo = getServiceInfo(serviceName);

            return !!(serviceInfo && serviceInfo.declaration && serviceInfo.providerMethod === 'constant');
        };

        /**
         * @param {string} filterName
         * @returns {{module: Object, providerName: string, providerMethod: string, declaration: *}}
         */
        this.getFilterDeclaration = function(filterName) {
            var filterInfo = getFilterInfo(filterName);
            if (!filterInfo.declaration) {
                throw 'Could not find declaration of filter with name: ' + filterName;
            }

            return filterInfo;
        };

        /**
         * @param injector
         * @param {string} filterName
         * @returns {Object.<{instance: *, module: angular.Module}>}
         */
        this.getFilterDependencies = function(injector, filterName) {
            var filterInfo = getFilterInfo(filterName);
            if (!filterInfo.declaration) {
                throw 'Could not find declaration of filter with name: ' + filterName;
            }

            return getRegisteredObjectDependencies(injector, filterInfo);
        };

        /**
         * @param {string} controllerName
         * @returns {{module: Object, providerName: string, providerMethod: string, declaration: *}}
         */
        this.getControllerDeclaration = function(controllerName) {
            var controllerInfo = getControllerInfo(controllerName);
            if (!controllerInfo.declaration) {
                throw 'Could not find declaration of controller with name: ' + controllerName;
            }

            return controllerInfo;
        };

        /**
         * @param $injector
         * @param {string} controllerName
         * @returns {Object.<{instance: *, module: angular.Module}>}
         */
        this.getControllerDependencies = function($injector, controllerName) {
            var controllerInfo = getControllerInfo(controllerName);
            if (!controllerInfo.declaration) {
                throw 'Could not find declaration of controller with name: ' + controllerName;
            }

            return getRegisteredObjectDependencies($injector, controllerInfo, '$scope');
        };

        /**
         * @param injector
         * @param {{module: Object, declaration: *}} registeredObjectInfo
         * @param {...string} toBeIgnoredDependencyServiceNames
         * @returns {Object.<{instance: *, module: angular.Module}>}
         */
        function getRegisteredObjectDependencies(injector, registeredObjectInfo, toBeIgnoredDependencyServiceNames) {
            var declaration = registeredObjectInfo.declaration;

            if (registeredObjectInfo.providerMethod === 'provider') {
                if (angular.isObject(declaration) && !angular.isArray(declaration)) {
                    declaration = declaration.$get;
                } else {
                    var providerInstance = injector.instantiate(declaration);
                    declaration = providerInstance.$get;
                }
            }

            var dependencyServiceNames = injector.annotate(declaration);
            toBeIgnoredDependencyServiceNames = Array.prototype.slice.call(arguments, 2);

            var result = {};
            angular.forEach(dependencyServiceNames, function(dependencyServiceName) {
                if (!toBeIgnoredDependencyServiceNames ||
                        toBeIgnoredDependencyServiceNames.indexOf(dependencyServiceName) === -1) {
                    var dependencyServiceInfo = {};
                    dependencyServiceInfo.instance = injector.get(dependencyServiceName);
                    dependencyServiceInfo.module = getServiceInfo(dependencyServiceName).module;

                    result[dependencyServiceName] = dependencyServiceInfo;
                }
            });

            return result;
        }


        /**
         * @returns {({module: Object}|{module: Object, providerName: string, providerMethod: string, declaration: *})}
         */
        function getServiceInfo(serviceName) {
            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$provide', serviceRegistrationMethodNames, serviceName);

            if (!result) {
                var ngModuleInjector = /** @type {$injector} */ angular.injector(['ng']);

                if (hasService(ngModuleInjector, serviceName)) {
                   result = {module: angular.module('ng')};
                }
            } else {
                result.providerName = '$provide';
            }

            if (!result) {
                throw 'Could not find service with name: ' + serviceName;
            }

            return result;
        }

        /**
         * @returns {({module: Object}|{module: Object, providerName: string, providerMethod: string, declaration: *})}
         */
        function getFilterInfo(filterName) {
            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$filterProvider', 'register', filterName);

            if (!result) {
                var ngModuleInjector = /** @type {$injector} */ angular.injector(['ng']);

                if (hasService(ngModuleInjector, filterName + 'Filter')) {
                    result = {module: angular.module('ng')};
                }
            } else {
                result.providerName = '$filterProvider';
            }

            if (!result) {
                throw 'Could not find filter with name: ' + filterName;
            }

            return result;
        }

        /**
         * @param {string} controllerName
         * @returns {({module: Object}|{module: Object, providerName: string, providerMethod: string, declaration: *})}
         */
        function getControllerInfo(controllerName) {
            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$controllerProvider', 'register', controllerName);

            if (!result) {
                throw 'Could not find controller with name: ' + controllerName;
            } else {
                result.providerName = '$controllerProvider';
            }

            return result;
        }

        /**
         * @param {$injector} injector
         * @param {string} serviceName
         * @returns {boolean}
         */
        function hasService(injector, serviceName) {
            if (injector.has) {
                return injector.has(serviceName);
            } else {
                try {
                    injector.get(serviceName);

                    return true;
                } catch (e) {
                    if (e instanceof Error && e.message.indexOf('Unknown provider: ') === 0) {
                        return false;
                    } else {
                        throw e;
                    }
                }
            }
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
