;(function() {
'use strict';

/** @const */
var serviceRegistrationMethodNames = ['provider', 'factory', 'service', 'value', 'constant'];

angular.module('ngImprovedModules').factory('moduleIntrospector', [
    'moduleInvokeQueueItemInfoExtractor',
    function(moduleInvokeQueueItemInfoExtractor) {

    /**
     * @ngdoc type
     * @param {string} moduleName
     * @constructor
     */
    function ModuleIntrospector(moduleName) {

        /**
         * @param {string} serviceName
         * @returns {{module: Object, providerMethod: string, declaration: *}}
         */
        function getServiceDeclaration(serviceName) {
            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                module, '$provide', serviceRegistrationMethodNames, serviceName);

            if (!result) {
                throw 'Could not find service with name: ' + serviceName;
            }

            return result;
        }



        var module = angular.module(moduleName);

        /**
         * @param {string} serviceName
         * @returns {{module: Object, providerMethod: string, declaration: *}}
         */
        this.getServiceDeclaration = getServiceDeclaration;

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
         * @param injector
         * @param {string} filterName
         * @returns {Object.<{instance: *, module: angular.Module}>}
         */
        this.getFilterDependencies = function(injector, filterName) {
            var filterInfo = getFilterInfo(filterName);

            //TODO: add support for detecting the filters from the (built-in) "ng" module
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
            var controllerInfo = getControllerDeclaration(controllerName);

            return getRegisteredObjectDependencies($injector, controllerInfo, '$scope');
        };



        /**
         * @param injector
         * @param {{module: Object, declaration: *}} registeredObjectInfo
         * @param {...string} toBeIgnoredDependencyServiceNames
         * @returns {Object.<{instance: *, module: angular.Module}>}
         */
        function getRegisteredObjectDependencies(injector, registeredObjectInfo, toBeIgnoredDependencyServiceNames) {
            var dependencyServiceNames = injector.annotate(registeredObjectInfo.declaration);
            toBeIgnoredDependencyServiceNames = Array.prototype.slice.call(arguments, 2);

            var result = {};
            angular.forEach(dependencyServiceNames, function(dependencyServiceName) {
                if (!toBeIgnoredDependencyServiceNames ||
                        toBeIgnoredDependencyServiceNames.indexOf(dependencyServiceName) === -1) {
                    var dependencyServiceInfo = {};
                    dependencyServiceInfo.instance = injector.get(dependencyServiceName);
                    dependencyServiceInfo.module = getServiceDeclaration(dependencyServiceName).module;

                    result[dependencyServiceName] = dependencyServiceInfo;
                }
            });

            return result;
        }


        /**
         * @returns {({module: Object}|{module: Object, providerMethod: string, declaration: *})}
         */
        //TODO: refactor method to be a "getFilterDeclaration" once filter from the (built-in) "ng" module are returned
        function getFilterInfo(filterName) {
            var builtInFilterDeclaration = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$provide', serviceRegistrationMethodNames, filterName + 'Filter');

            var registeredFilterDeclaration = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$filterProvider', 'register', filterName);

            if (!builtInFilterDeclaration && !registeredFilterDeclaration) {
                throw 'Could not find filter with name: ' + filterName;
            }

            return registeredFilterDeclaration || builtInFilterDeclaration;


//            //TODO: remove this whole if once filters from the (built-in) "ng" module are returned
//            if (!result) {
//                var ngModuleInjector = angular.injector(['ng']);
//
//                if (hasService(ngModuleInjector, filterName + 'Filter')) {
//                    result = {module: angular.module('ng')};
//                }
//            }
//
//            if (!result) {
//                throw 'Could not find filter with name: ' + filterName;
//            }
//
//            return result;
        }

        /**
         * @param {string} controllerName
         * @returns {{module: Object, providerMethod: string, declaration: *}}
         */
        function getControllerDeclaration(controllerName) {
            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$controllerProvider', 'register', controllerName);

            if (!result) {
                throw 'Could not find controller with name: ' + controllerName;
            }

            return result;
        }

//        /**
//         * @param {$injector} injector
//         * @param {string} serviceName
//         * @returns {boolean}
//         */
//        function hasService(injector, serviceName) {
//            if (injector.has) {
//                return injector.has(serviceName);
//            } else {
//                try {
//                    injector.get(serviceName);
//
//                    return true;
//                } catch (e) {
//                    if (e instanceof Error && e.message.indexOf('Unknown provider: ') === 0) {
//                        return false;
//                    } else {
//                        throw e;
//                    }
//                }
//            }
//        }

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

}]);

}());
