/* global angular, inject, describe, beforeEach, it, spyOn, expect, module, xit */
'use strict';

describe('moduleInvokeQueueItemInfoExtractor service', function() {
    'use strict';

    beforeEach(module('ngImprovedModules'));

    var moduleInvokeQueueItemInfoExtractor;

    beforeEach(inject(function(_moduleInvokeQueueItemInfoExtractor_) {
        moduleInvokeQueueItemInfoExtractor = _moduleInvokeQueueItemInfoExtractor_;
    }));



    describe('findProviderDeclarationOnInvokeQueue method', function() {

        var currentModule;

        beforeEach(function() {
            currentModule = angular.module('aTestingModule', []);
        });

        describe('for a declaration registered the regular way (using documented API)', function() {
            it('should return only non-constant declaration', function() {
                var service = {aServiceMethod: angular.noop};

                currentModule.value('aService', service);

                var providerDeclaration = moduleInvokeQueueItemInfoExtractor.findProviderDeclarationOnInvokeQueue(
                        currentModule, '$provide', ['value'], 'aService');

                expect(providerDeclaration).toEqual({providerMethod: 'value', declaration: service});
            });

            it('should return last non-constant declaration where more than one is registered', function() {
                var valueDeclaration = {};
                var factoryDeclaration = function() {};

                currentModule.value('aService', valueDeclaration);
                currentModule.factory('aService', factoryDeclaration);

                var providerDeclaration = moduleInvokeQueueItemInfoExtractor.findProviderDeclarationOnInvokeQueue(
                    currentModule, '$provide', ['value', 'factory'], 'aService');

                expect(providerDeclaration).toEqual({providerMethod: 'factory', declaration: factoryDeclaration});
            });

            it('should return first constant declaration', function() {
                var firstConstantDeclaration = {};
                var secondConstantDeclaration = {};

                currentModule.constant('aService', firstConstantDeclaration);
                currentModule.constant('aService', secondConstantDeclaration);

                var providerDeclaration = moduleInvokeQueueItemInfoExtractor.findProviderDeclarationOnInvokeQueue(
                    currentModule, '$provide', ['constant'], 'aService');

                expect(providerDeclaration)
                    .toEqual({providerMethod: 'constant', declaration: firstConstantDeclaration});
            });
        });



        describe('for a declaration registered using a map (using non-documented API)', function() {
            it('should return only non-constant declaration', function() {
                var service = {aServiceMethod: angular.noop};

                currentModule.value({anotherService: {}, aService: service});

                var providerDeclaration = moduleInvokeQueueItemInfoExtractor.findProviderDeclarationOnInvokeQueue(
                    currentModule, '$provide', ['value'], 'aService');

                expect(providerDeclaration).toEqual({providerMethod: 'value', declaration: service});
            });

            it('should return last non-constant declaration where more than one is registered', function() {
                var valueDeclaration = {};
                var factoryDeclaration = function() {};

                currentModule.value({anotherService1: {}, aService: valueDeclaration});
                currentModule.factory({anotherService2: angular.noop, aService: factoryDeclaration});

                var providerDeclaration = moduleInvokeQueueItemInfoExtractor.findProviderDeclarationOnInvokeQueue(
                    currentModule, '$provide', ['value', 'factory'], 'aService');

                expect(providerDeclaration).toEqual({providerMethod: 'factory', declaration: factoryDeclaration});
            });

            it('should return first constant declaration', function() {
                var firstConstantDeclaration = {};
                var secondConstantDeclaration = {};

                currentModule.constant({anotherService1: {}, aService: firstConstantDeclaration});
                currentModule.constant({anotherService2: {}, aService: secondConstantDeclaration});

                var providerDeclaration = moduleInvokeQueueItemInfoExtractor.findProviderDeclarationOnInvokeQueue(
                    currentModule, '$provide', ['constant'], 'aService');

                expect(providerDeclaration)
                    .toEqual({providerMethod: 'constant', declaration: firstConstantDeclaration});
            });

        });
    });



    describe('findInvokeQueueItemInfoRecursive method', function() {

        it('should return null for non-overridden service of the (built-in) "ng" module', function() {
            var module = angular.module('aModule', []);

            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                    module, '$provide', ['provider', 'factory', 'service', 'value', 'constant'], '$http');

            expect(result).toBeNull();
        });

        it('should return overridden built-in service', function() {
            var module = angular.module('aModule', []);

            var $httpOverridden = {};

            module.value('$http', $httpOverridden);

            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                module, '$provide', ['provider', 'factory', 'service', 'value', 'constant'], '$http');

            expect(result).toEqual({module: module, providerMethod: 'value', declaration: $httpOverridden});
        });

        it('should return overridden built-in service declared in another module', function() {
            var $httpOverridden = {};

            var anotherModule = angular.module('anotherModule', []);
            anotherModule.value('$http', $httpOverridden);

            var module = angular.module('aModule', ['anotherModule']);

            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                module, '$provide', ['provider', 'factory', 'service', 'value', 'constant'], '$http');

            expect(result).toEqual({module: anotherModule, providerMethod: 'value', declaration: $httpOverridden});
        });

        it('should return overridden service of service originally declared in another module (even a constant ' +
                'service)', function() {
            var originalService = {original: 'service'};
            var overriddenService = {overridden: 'service'};

            var anotherModule = angular.module('anotherModule', []);
            anotherModule.constant('aService', originalService);

            var module = angular.module('aModule', ['anotherModule']);
            module.constant('aService', overriddenService);

            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                module, '$provide', ['provider', 'factory', 'service', 'value', 'constant'], 'aService');

            expect(result).toEqual({module: module, providerMethod: 'constant', declaration: overriddenService});
        });

        //TODO: enable this spec once the TODO has been implemented
        xit('should return non overridden non-constant service of constant service originally declared in another ' +
                'module', function() {
            var originalService = {original: 'service'};
            var overriddenService = {overridden: 'service'};

            var anotherModule = angular.module('anotherModule', []);
            anotherModule.constant('aService', originalService);

            var module = angular.module('aModule', ['anotherModule']);
            module.value('aService', overriddenService);

            var result = moduleInvokeQueueItemInfoExtractor.findInvokeQueueItemInfo(
                module, '$provide', ['provider', 'factory', 'service', 'value', 'constant'], 'aService');

            expect(result).toEqual({module: module, providerMethod: 'constant', declaration: originalService});
        });

    });
});
