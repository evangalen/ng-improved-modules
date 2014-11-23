#ngModuleIntrospector &nbsp;[![Travis build status](https://travis-ci.org/evangalen/ng-module-introspector.png?branch=master)](https://travis-ci.org/evangalen/ng-module-introspector)&nbsp;[![Coverage Status](https://coveralls.io/repos/evangalen/ng-module-introspector/badge.png)](https://coveralls.io/r/evangalen/ng-module-introspector?branch=coveralls-setting)&nbsp;[![Bower version](https://badge.fury.io/bo/ng-module-introspector.svg)](http://badge.fury.io/bo/ng-module-introspector)

Introspects AngularJS modules for its components and their dependencies.

The ngModelIntrospector library is primarily created for the [ngImprovedTesting](https://github.com/evangalen/ng-improved-testing/) library.<br>
Currently ngModelIntrospector only allows retrieving a specific:
 - provider component declaration: the declaration of a service, a filter, a controller, a directive or an animation.
 - provider declaration: the declaration of any AngularJS provider like $provide, $filter provider, $q provider etc.

The ngModuleIntrospector library declare a single AngularJS module called "ngModuleIntrospector".
This AngularJS module consists of only one service and one type:
 - `moduleIntrospector` factory method: returns an instance of the ModuleIntrospector type for the provided (variable argument) moduleNames.
 - `ModuleIntrospector` type: consists of only two public methods:
    - `getProviderComponentDeclaration`: returns the declaration of registerd component of a provider.<br>
      This method can be used for both built-in (ng module) components as well a custom ones.<br>
      I.e. invoking `.getProviderComponentDeclaration('$provide', '$document')` will return:<br>
      
          {
              providerMethod: 'provider',
              componentName: '$document',
              rawDeclaration: ['$window', function (window) { ... }],
              strippedDeclaration: function (window) { ... },
              injectedServices: ['$window']
          }

    - `getProviderDeclaration`: returns the declaration of a provider.<br>
      This method can be used for both built-in (ng module) components as well a custom providers.<br>
      I.e. invoking `.getProviderDeclaration('$filterProvider')` will return:<br>
      
          {
              rawDeclaration: function $FilterProvider($provide) { ... },
              strippedDeclaration: function $FilterProvider($provide) { ... },
              injectedProviders: ['$provide']
          }

Changes
-------
0.2.0
 - AngularJS 1.0.x is no longer dropped
 - no longer uses any internal AngularJS API (like 0.1.x did)
 - the public API of `ModuleIntrospector` type had been drastically changed
 - declararations of built-in ("ng" module) provider components (i.e. the "currency" filter) and built-in providers      (i.e. $filterProvider) can now be retrieved using ngModuleIntrospector

0.1.2
 - added support for AngularJS 1.0.x (as well as the latest stable 1.3)
 - Support for "provider" registered services
 - Support for retrieving $animateProvider components (when using AngularJS 1.2+)

0.1.1
 - Fixes [ngImprovedTesting](https://github.com/evangalen/ng-improved-testing/) issue #1 (Error on circular module dependencies.)

0.1.0 Initial release
