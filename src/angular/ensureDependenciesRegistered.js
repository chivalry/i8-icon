'use strict';

di('ensureDependenciesRegistered', function(di) {
  var
    registered = false;

  return function ensureDependenciesRegistered($injector) {
    if (registered) {
      return;
    }

    di('log', function() {
      return $injector.get('$log');
    });

    di('httpGet', function() {
      var
        $http = $injector.get('$http'),
        $templateCache = $injector.get('$templateCache')
        ;

      return function(url, params) {
        var
          options = {
            cache: $templateCache
          };
        if (params) {
          options.params = params;
        }
        return $http.get(url, options);
      }
    });

    di('Promise', function() {
      var
        $q = $injector.get('$q'),
        $rootScope = $injector.get('$rootScope');

      function ensureDigestDecorator(fn) {
        return function() {
          var
            args = Array.prototype.slice.call(arguments);

          if (!$rootScope.$$phase) {
            $rootScope.$apply(function() {
              fn.apply(this, args);
            })
          }
          else {
            fn.apply(this, args);
          }
        }
      }

      function Promise(value) {
        var
          deferred;
        if (typeof value != 'function') {
          return Promise.resolve(value);
        }
        deferred = $q.defer();
        value(
          ensureDigestDecorator(deferred.resolve),
          ensureDigestDecorator(deferred.reject)
        );
        return deferred.promise;
      }

      Promise.reject = $q.reject;
      Promise.resolve = $q.when;
      Promise.all = $q.all;

      return Promise;
    });

    di('timeout', function() {
      var
        $timeout = $injector.get('$timeout');

      return function(fn, delay) {
        if (typeof fn != 'function') {
          delay = fn;
          fn = function() {};
        }
        return $timeout(fn, delay);
      };
    });

    registered = true;
  }

});

