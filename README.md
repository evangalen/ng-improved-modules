#ngModuleIntrospector &nbsp;[![Travis build status](https://travis-ci.org/evangalen/ng-module-introspector.png?branch=typescript)](https://travis-ci.org/evangalen/ng-module-introspector)&nbsp;[![Coverage Status](https://coveralls.io/repos/evangalen/ng-module-introspector/badge.png)](https://coveralls.io/r/evangalen/ng-module-introspector?branch=coveralls-setting)&nbsp;[![Bower version](https://badge.fury.io/bo/ng-module-introspector.svg)](http://badge.fury.io/bo/ng-module-introspector)

Introspects AngularJS modules for its components and their dependencies.

The ngModelIntrospector library is primarily created for the [ngImprovedTesting](https://github.com/evangalen/ng-improved-testing/) library.<br>
Currently ngModelIntrospector only allows retrieving a specific:
 - provider component declaration: the declaration of a service, a filter, a controller, a directive or an animation.
 - provider declaration: the declaration of any AngularJS provider like $provide, $filter provider, $q provider etc.

The ngModuleIntrospector library declare a single AngularJS module called "ngModuleIntrospector".
This AngularJS module consists of only one service and one type:
 - `moduleIntrospector` factory method: returns an instance of the ModuleIntrospector type for the provided array of modules just like with `angular.mock.module`; a module can be either a module name, a module configuration function of an object literal with service instances<br>
   An optional second argument called "includeNgMock" (with a default value of `false`) allows specifying if components registered by "ngMock" should be included or not.
 - `ModuleIntrospector` type: consists of only two public methods:
    - `getProviderComponentDeclarations`: returns the component declarations of a provider with same name as the component name argument.<br>
      This method can be used for both built-in (ng module) components as well a custom ones.<br>
      I.e. invoking `.getProviderComponentDeclarations('$provide', '$document')` will return:<br>
      
          [{
              providerMethod: 'provider',
              componentName: '$document',
              rawDeclaration: ['$window', function (window) { ... }],
              strippedDeclaration: function (window) { ... },
              injectedServices: ['$window'],
              builtIn: true
          }]

    - `getProviderDeclaration`: returns the declaration of a provider.<br>
      This method can be used for both built-in (ng module) components as well a custom providers.<br>
      I.e. invoking `.getProviderDeclaration('$filterProvider')` will return:<br>
      
          {
              rawDeclaration: function $FilterProvider($provide) { ... },
              strippedDeclaration: function $FilterProvider($provide) { ... },
              injectedProviders: ['$provide'],
              builtIn: true
          }

Changes
-------
0.3.0
 - The `moduleIntrospector` can now be provided with multiple module just like `angular.mock.module`.
 - Internally always includes the ngMock module to always be able to introspect a module;
   however ngModuleIntrospector will only return services from the ngMock module when `includeNgMock` (second argument of the `moduleIntrospector` service) is true.
 - renamed `getProviderComponentDeclaration` to `getProviderComponentDeclarations` and changed it to returned an array with possibly multiple element; in reality only the '$compileProvider` can return more than one element (when multiple directives with the same name are declared).
 - each provider component declaration and provider declaration has an additional boolean property `builtIn` that indicate if its a built in declaration; to indicate it's declared in the 'ng' module or the 'ngMock' module (should only occur when `includeNgMock` is true)

0.2.0
 - AngularJS 1.0.x is no longer supported
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
