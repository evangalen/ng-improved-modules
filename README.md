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

