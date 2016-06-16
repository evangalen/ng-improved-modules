import * as angular from 'angular';
import { moduleIntrospector } from './moduleIntrospector';

angular.module('ngModuleIntrospector', [])
    .factory('moduleIntrospector', moduleIntrospector);
