/* global angular, ngImprovedModulesModule, ngImprovedModules */
'use strict';

/** @const */
var serviceRegistrationMethodNames = ['provider', 'factory', 'service', 'value', 'constant'];

ngImprovedModulesModule
    .factory('moduleIntrospector', moduleIntrospectorFactory);


function moduleIntrospectorFactory(moduleInvokeQueueItemInfoExtractor) {

    /**
     * @ngdoc type
     * @param {string} moduleName
     * @constructor
     */
    ngImprovedModules.ModuleIntrospector = function(moduleName) {

        var module = angular.module(moduleName);

        /**
         * @param {string} serviceName
         * @returns {?{module: Object, providerMethod: string, declaration: *}}
         */
        this.getServiceDeclaration = function(serviceName) {
            var serviceInfo = getServiceInfo(serviceName);
            if (!serviceInfo.declaration) {
                return null;
            }

            return serviceInfo;
        };

        this.hasServiceDeclaration = function(serviceName) {
            return this.getServiceDeclaration(serviceName) !== null;
        };

        /**
         * @param injector
         * @param {string} serviceName
         * @returns {Object.<{instance: *, module: angular.Module}>}
         */
        this.getServiceDependencies = function(injector, serviceName) {
            var serviceInfo = getServiceInfo(serviceName);
            if (!serviceInfo.declaration) {
                throw 'Could not find declaration of service with name: ' + serviceName;
            }

            return getRegisteredObjectDependencies(injector, serviceInfo);
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
         * @param $injector
         * @param {string} controllerName
         * @returns {Object.<{instance: *, module: angular.Module}>}
         */
        this.getControllerDependencies = function($injector, controllerName) {
            var controllerInfo = getControllerInfo(controllerName);
            if (!controllerInfo.declaration) {
                throw 'Could not find declaration of controller with name: ' + controllerName;
            }

            return getRegisteredObjectDependencies($injector, controllerInfo);
        };


        /**
         * @param injector
         * @param {{module: Object, declaration: *}} registeredObjectInfo
         * @returns {Object.<{instance: *, module: angular.Module}>}
         */
        function getRegisteredObjectDependencies(injector, registeredObjectInfo) {
            var dependencyServiceNames = injector.annotate(registeredObjectInfo.declaration);

            var result = {};
            angular.forEach(dependencyServiceNames, function(dependencyServiceName) {
                var dependencyServiceInfo = {};
                dependencyServiceInfo.instance = injector.get(dependencyServiceName);
                dependencyServiceInfo.module = getServiceInfo(dependencyServiceName).module;

                result[dependencyServiceName] = dependencyServiceInfo;
            });

            return result;
        }


        /**
         * @returns {({module: Object}|{module: Object, providerMethod: string, declaration: *})}
         */
        function getServiceInfo(serviceName) {
            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$provide', serviceRegistrationMethodNames, serviceName);

            if (!result) {
                var ngModuleInjector = angular.injector(['ng']);

                if (ngModuleInjector.has(serviceName)) {
                    result = {module: angular.module('ng')};
                }
            }

            if (!result) {
                throw 'Could not find service with name: ' + serviceName;
            }

            return result;
        }

        /**
         * @returns {({module: Object}|{module: Object, providerMethod: string, declaration: *})}
         */
        function getFilterInfo(filterName) {
            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$filterProvider', 'register', filterName);

            if (!result) {
                var ngModuleInjector = angular.injector(['ng']);

                var $filter = ngModuleInjector.get('$filter');
                if ($filter(filterName)) {
                    result = {module: angular.module('ng')};
                }
            }

            if (!result) {
                throw 'Could not find filter with name: ' + filterName;
            }

            return result;
        }

        /**
         * @param {string} controllerName
         * @returns {({module: Object}|{module: Object, providerMethod: string, declaration: *})}
         */
        function getControllerInfo(controllerName) {
            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$controllerProvider', 'register', controllerName);

            if (!result) {
                var ngModuleInjector = angular.injector(['ng']);

                var $controller = ngModuleInjector.get('$controller');
                if ($controller(controllerName)) {
                    result = {module: angular.module('ng')};
                }
            }

            if (!result) {
                throw 'Could not find controller with name: ' + controllerName;
            }

            return result;
        }

    };


    /**
     * @ngdoc service
     * @name moduleIntrospector
     * @param {string} module
     * @returns {ngImprovedModules.ModuleIntrospector}
     * @function
     */
    return function moduleIntrospector(module) {
        return new ngImprovedModules.ModuleIntrospector(module);
    };

}
