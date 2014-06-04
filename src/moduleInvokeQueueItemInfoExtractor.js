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
     * @param {object} module an angular module
     * @param {string} providerName
     * @param {Array.<string>} providerMethods
     * @param {string} itemName
     * @returns {?{module: Object, providerMethod: string, declaration: *}}
     */
    this.findInvokeQueueItemInfo = function (module, providerName, providerMethods, itemName) {

        /**
         * @param {?{module: Object, providerMethod: string, declaration: *}} previousResult
         * @param {object} currentModule
         * @param {{providerName: string, providerMethods: Array.<string>, itemName: string}} searchParams
         * @returns {?{module: Object, providerMethod: string, declaration: *}}
         */
        function findInvokeQueueItemInfoRecursive(previousResult, currentModule, searchParams) {

            var result = null;

            angular.forEach(currentModule.requires, function(nameOfRequiredModule) {
                var requiredModule = angular.module(nameOfRequiredModule);

                var resultFromRecursiveInvocation =
                    findInvokeQueueItemInfoRecursive(previousResult, requiredModule, searchParams);

                if (providerName !== '$provide' || !previousResult || !resultFromRecursiveInvocation ||
                        previousResult.providerMethod !== 'constant' ||
                        resultFromRecursiveInvocation.providerMethod === 'constant') {
                    result = resultFromRecursiveInvocation;
                }

                previousResult = result;
            });

            var providerDeclarationOnInvokeQueue =
                that.findProviderDeclarationOnInvokeQueue(previousResult, currentModule, searchParams);
            if (providerDeclarationOnInvokeQueue) {
                result = angular.extend(providerDeclarationOnInvokeQueue, {module: currentModule});

                if (!result) {
                    result = previousResult;
                } else {
                    previousResult = result;
                }
            }

            return result;
        }


        return findInvokeQueueItemInfoRecursive(
                null, module, {providerName: providerName, providerMethods: providerMethods, itemName: itemName});
    };


    /**
     * @param {?{module: Object, providerMethod: string, declaration: *}} previousResult
     * @param {object} currentModule
     * @param {{providerName: string, providerMethods: Array.<string>, itemName: string}} searchParams
     * @returns {?{providerMethod: string, declaration: *}}
     */
    this.findProviderDeclarationOnInvokeQueue = function (previousResult, currentModule, searchParams) {
        var result = null;

        angular.forEach(currentModule._invokeQueue, function(item, index) {
            var currentProviderName = item[0];
            var currentProviderMethod = item[1];

            if (currentProviderName === searchParams.providerName &&
                    searchParams.providerMethods.indexOf(currentProviderMethod) !== -1) {
                var invokeLaterArgs = item[2];

                if (invokeLaterArgs.length === 2) {
                    if (invokeLaterArgs[0] === searchParams.itemName) {
                        if (isNotConstantServiceOrTryingToOverrideOne(
                                previousResult, searchParams, currentProviderMethod)) {
                            result = {providerMethod: currentProviderMethod, declaration: invokeLaterArgs[1]};
                        }
                    }
                } else if (invokeLaterArgs.length === 1) {
                    if (invokeLaterArgs[0].hasOwnProperty(searchParams.itemName)) {
                        result = {
                            providerMethod: currentProviderMethod,
                            declaration: invokeLaterArgs[0][searchParams.itemName]
                        };

                        if (isNotConstantServiceOrTryingToOverrideOne(
                                previousResult, searchParams, currentProviderMethod)) {
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


    function isNotConstantServiceOrTryingToOverrideOne(previousResult, searchParams, currentProviderMethod) {
        return searchParams.providerName !== '$provide' || !previousResult ||
                previousResult.providerMethod !== 'constant' || currentProviderMethod === 'constant';
    }
}


angular.module('ngModuleIntrospector')
    .service('moduleInvokeQueueItemInfoExtractor', ModuleInvokeQueueItemInfoExtractor);

}());