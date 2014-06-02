;(function() {
'use strict';

/**
 * @ngdoc service
 * @name ModuleInvokeQueueItemInfoExtractor
 * @constructor
 */
// @ngInject
function ModuleInvokeQueueItemInfoExtractor() {

    var that = this;

    /**
     * @returns {?{module: Object, providerMethod: string, declaration: *}}
     */
    this.findInvokeQueueItemInfo = function (module, providerName, providerMethods, itemName) {

        /**
         * @returns {?{module: Object, providerMethod: string, declaration: *}}
         */
        function findInvokeQueueItemInfoRecursive(currentModule, providerName, providerMethods, itemName) {
            var result = null;

            angular.forEach(currentModule.requires, function(nameOfRequiredModule) {
                var requiredModule = angular.module(nameOfRequiredModule);

                result = findInvokeQueueItemInfoRecursive(requiredModule, providerName, providerMethods, itemName);

                //TODO: write logic to account for the fact that a non-constant declaration should not be allowed to
                //  override a earlier constant declaration
            });

            var providerDeclarationOnInvokeQueue =
                that.findProviderDeclarationOnInvokeQueue(currentModule, providerName, providerMethods, itemName);
            if (providerDeclarationOnInvokeQueue) {
                result = angular.extend(providerDeclarationOnInvokeQueue, {module: currentModule});
            }

            return result;
        }


        return findInvokeQueueItemInfoRecursive(module, providerName, providerMethods, itemName);
    };


    /**
     * @returns {?{providerMethod: string, declaration: *}}
     */
    this.findProviderDeclarationOnInvokeQueue = function (currentModule, providerName, providerMethods, itemName) {
        var result = null;

        angular.forEach(currentModule._invokeQueue, function(item, index) {
            var currentProviderName = item[0];
            var currentProviderMethod = item[1];

            if (currentProviderName === providerName && providerMethods.indexOf(currentProviderMethod) !== -1) {
                var invokeLaterArgs = item[2];

                if (invokeLaterArgs.length === 2) {
                    if (invokeLaterArgs[0] === itemName) {
                        result = {providerMethod: currentProviderMethod, declaration: invokeLaterArgs[1]};

                        if (isConstantService(providerName, currentProviderMethod)) {
                            return result;
                        }
                    }
                } else if (invokeLaterArgs.length === 1) {
                    if (invokeLaterArgs[0].hasOwnProperty(itemName)) {
                        result = {providerMethod: currentProviderMethod, declaration: invokeLaterArgs[0][itemName]};

                        if (isConstantService(providerName, currentProviderMethod)) {
                            return result;
                        }
                    }
                } else {
                    throw 'Unexpected length of invokeQueue[' + index + '][2] (the "invokeLater" arguments): ' +
                        invokeLaterArgs.length;
                }
            }
        });

        return result;
    };


    function isConstantService(providerName, providerMethod) {
        return providerName === '$provide' && providerMethod === 'constant';
    }
}


angular.module('ngModuleIntrospector')
    .service('moduleInvokeQueueItemInfoExtractor', ModuleInvokeQueueItemInfoExtractor);

}());