(function() {
  goog.provide('gn_harvest_controller');


  goog.require('gn_category');
  goog.require('gn_harvester');

  var module = angular.module('gn_harvest_controller',
      ['gn_harvester', 'gn_category']);


  /**
   *
   */
  module.controller('GnHarvestController', [
    '$scope', '$http', '$translate', '$injector',
    function($scope, $http, $translate, $injector) {

      $scope.pageMenu = {
        folder: 'harvest/',
        defaultTab: 'harvest',
        tabs: []
      };
      $scope.harvesterTypes = {};
      $scope.harvesters = {};
      $scope.harvesterSelected = null;
      $scope.harvesterUpdated = false;
      $scope.harvesterNew = false;
      $scope.harvesterHistory = {};

      function parseBoolean(object) {
        angular.forEach(object, function(value, key) {
          if (typeof value == 'string') {
            if (value == 'true' || value == 'false') {
              object[key] = (value == 'true');
            }
          } else {
            parseBoolean(value);
          }
        });
      }

      function loadHarvesters() {
        $http.get('admin.harvester.list@json').success(function(data) {
          $scope.harvesters = data;
          parseBoolean($scope.harvesters);
        }).error(function(data) {
          // TODO
        });
      }


      function loadHistory() {
        $http.get('admin.harvester.history@json?uuid=' +
                $scope.harvesterSelected.site.uuid).success(function(data) {
          $scope.harvesterHistory = data;
        }).error(function(data) {
          // TODO
        });
      }

      function loadHarvesterTypes() {
        $http.get('admin.harvester.info@json?type=harvesterTypes')
        .success(function(data) {
              angular.forEach(data[0], function(value) {
                $scope.harvesterTypes[value] = {label: $translate(value)};
                $.getScript('../../catalog/templates/admin/harvest/type/' +
                    value + '.js')
                    .done(function(script, textStatus) {
                      $scope.harvesterTypes[value].loaded = true;
                      // FIXME: could we make those harvester specific
                      // function a controller
                    })
                  .fail(function(jqxhr, settings, exception) {
                      $scope.harvesterTypes[value].loaded = false;
                    });
              });
            }).error(function(data) {
              // TODO
            });
      }

      $scope.getTplForHarvester = function() {
        // TODO : return view by calling harvester ?
        if ($scope.harvesterSelected) {
          return '../../catalog/templates/admin/' + $scope.pageMenu.folder +
              'type/' + $scope.harvesterSelected['@type'] + '.html';
        } else {
          return null;
        }
      };
      $scope.updatingHarvester = function() {
        $scope.harvesterUpdated = true;
      };
      $scope.addHarvester = function(type) {
        $scope.harvesterNew = true;
        $scope.harvesterSelected = window['gnHarvester' + type].createNew();
      };

      $scope.buildResponseGroup = function(h) {
        var groups = '';
        angular.forEach(h.privileges, function(p) {
          var ops = '';
          angular.forEach(p.operation, function(o) {
            ops += '<operation name="' + o['@name'] + '"/>';
          });
          groups +=
              '<group id="' + p['@id'] + '">' + ops + '</group>';
        });
        return '<privileges>' + groups + '</privileges>';
      };
      $scope.buildResponseCategory = function(h) {
        var cats = '';
        angular.forEach(h.categories, function(c) {

          cats +=
              '<category id="' + c['@id'] + '"/>';
        });
        return '<categories>' + cats + '</categories>';
      };


      $scope.saveHarvester = function() {
        var body = window['gnHarvester' + $scope.harvesterSelected['@type']]
                            .buildResponse($scope.harvesterSelected, $scope);

        $http.post('admin.harvester.' +
                ($scope.harvesterNew ? 'add' : 'update') +
            '@json', body, {
              headers: {'Content-type': 'application/xml'}
            }).success(function(data) {
          loadHarvesters();
        }).error(function(data) {
          console.log(data);
        });
      };
      $scope.selectHarvester = function(h) {
        $scope.harvesterSelected = h;
        $scope.harvesterUpdated = false;
        $scope.harvesterNew = false;
      };

      $scope.deleteHarvester = function() {
        $http.get('admin.harvester.remove@json?id=' +
                  $scope.harvesterSelected['@id'])
              .success(function(data) {
              $scope.harvesterSelected = {};
              $scope.harvesterUpdated = false;
              $scope.harvesterNew = false;
              loadHarvesters();
            }).error(function(data) {
              console.log(data);
            });
      };

      $scope.runHarvester = function() {
        $http.get('admin.harvester.run@json?id=' +
                $scope.harvesterSelected['@id'])
            .success(function(data) {
              console.log(data);
            }).error(function(data) {
              console.log(data);
            });
      };

      loadHarvesters();
      loadHarvesterTypes();

    }]);

})();