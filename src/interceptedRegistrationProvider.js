;(function() {
'use strict';

/**
 * @param {string} registrationMethod
 * @param {string} [queueInsertMethod = 'push']
 */
function invokeLaterInfo(registrationMethod, queueInsertMethod) {
    return {registrationMethod: registrationMethod, queueInsertMethod: queueInsertMethod || 'push'};
}


angular.module('ngImprovedModules')

    .constant('invokeLaterInfoArrayPerProvider', {
        $provide: [
            invokeLaterInfo('provider'),
            invokeLaterInfo('factory'),
            invokeLaterInfo('service'),
            invokeLaterInfo('value'),
            invokeLaterInfo('constant', 'unshift')
        ],
        $animateProvider: [invokeLaterInfo('register')],
        $filterProvider: [invokeLaterInfo('register')],
        $controllerProvider: [invokeLaterInfo('register')],
        $compileProvider: [invokeLaterInfo('directive')]
    })

    .factory('interceptedRegistrationProvider', function(invokeLaterInfoArrayPerProvider) {

        /**
         * @param {string} providerName
         * @param {Object} providerInstance
         * @param {Array.<*>} interceptedRegistrations
         * @param {function(string, string, Array.<(string|Object)>)} [providerRegistrationCallback]
         * @returns {Object}
         */
        return function(providerName, providerInstance, interceptedRegistrations, providerRegistrationCallback) {
            var invokeLaterInfoArrayForProvider = invokeLaterInfoArrayPerProvider[providerInstance];
            if (!invokeLaterInfoArrayForProvider) {
                return providerInstance;
            }

            function InterceptedProvider() {}
            InterceptedProvider.prototype = Object.create(providerInstance);

            angular.forEach(invokeLaterInfoArrayForProvider, function(invokeLaterInfo) {
                var registrationMethod = invokeLaterInfo.registrationMethod;
                var queueInsertMethod = invokeLaterInfo.queueInsertMethod;

                if (providerRegistrationCallback) {
                    providerRegistrationCallback(providerName, registrationMethod, arguments);
                }

                InterceptedProvider.prototype[registrationMethod] = function() {
                    var result = providerInstance[registrationMethod].apply(this, arguments);

                    interceptedRegistrations[queueInsertMethod](providerName, registrationMethod, arguments);

                    return result;
                };
            });

            return new InterceptedProvider();
        };
    });


}());
