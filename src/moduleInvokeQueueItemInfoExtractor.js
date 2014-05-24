;(function() {
'use strict';

/** @const */
var emptyInjector = angular.injector([]);

var $provide;

angular.module('$provideExtractorModule', ['ng'])
    .config(['$provide', function(_$provide_) {
        $provide = _$provide_;
    }]);

angular.injector(['$provideExtractorModule']);

/** @constructor */
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

            var providerDeclarationOnInvokeQueue;

            if (currentModule === module) {
                var ngModule = angular.module('ng');

                providerDeclarationOnInvokeQueue =
                    that.findProviderDeclarationOnInvokeQueue(ngModule, providerName, providerMethods, itemName);
                if (providerDeclarationOnInvokeQueue) {
                    result = angular.extend(providerDeclarationOnInvokeQueue, {module: ngModule});
                }
            }

            for (var j = 0; j < currentModule.requires.length; j++) {
                var requiredModule = angular.module(currentModule.requires[j]);

                result = findInvokeQueueItemInfoRecursive(requiredModule, providerName, providerMethods, itemName);

                //TODO: write logic to account for the fact that a non-constant declaration should not be allowed to
                //  override a earlier constant declaration
            }

            providerDeclarationOnInvokeQueue =
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

        if (currentModule._configBlocks) {
            for (var i = 0; i < currentModule._configBlocks.length; i++) {
                var configBlockElement = currentModule._configBlocks[i];

                result =
                    this.handleInvokeQueueElement(result, configBlockElement, providerName, providerMethods, itemName);
            }
        }

        for (var j = 0; j < currentModule._invokeQueue.length; j++) {
            var invokeQueueElement = currentModule._invokeQueue[j];

            result = this.handleInvokeQueueElement(result, invokeQueueElement, providerName, providerMethods, itemName);
        }

        return result;
    };

    this.handleInvokeQueueElement = function(
            previousResult, invokeQueueElement, providerName, providerMethods, itemName) {
        var currentProviderName = invokeQueueElement[0];
        var currentProviderMethod = invokeQueueElement[1];

        //TODO: use a future "provider(name)" property from "result"
        if (previousResult && isConstantService(previousResult, previousResult.providerMethod) &&
                !isConstantService(currentProviderName, currentProviderMethod)) {
            return previousResult;
        }

        if (currentProviderName === '$injector' && currentProviderMethod === 'invoke') {
            //TODO: find out why we need to add an additional ...[0] to invokeQueueElement[2]
            return this.findServicesRegisteredInConfigBlock(
                    previousResult, invokeQueueElement[2][0], providerName, providerMethods, itemName);
        } else if (currentProviderName === providerName && providerMethods.indexOf(currentProviderMethod) !== -1) {
            var invokeLaterArgs = invokeQueueElement[2];

            if (invokeLaterArgs.length === 2) {
                if (invokeLaterArgs[0] === itemName) {
           return {providerMethod: currentProviderMethod, declaration: invokeLaterArgs[1]};
                }
            } else if (invokeLaterArgs.length === 1) {
                if (invokeLaterArgs[0].hasOwnProperty(itemName)) {
                    return {providerMethod: currentProviderMethod, declaration: invokeLaterArgs[0][itemName]};
                }
            } else {
                throw 'Unexpected length of invokeQueueElement[2] (the "invokeLater" arguments): ' +
                        invokeLaterArgs.length;
            }
        }

        return null;
    };



    function isConstantService(providerName, providerMethod) {
        return providerName === '$provide' && providerMethod === 'constant';
    }

}


angular.module('ngImprovedModules').service('moduleInvokeQueueItemInfoExtractor', ModuleInvokeQueueItemInfoExtractor);

}());