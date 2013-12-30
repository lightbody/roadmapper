function ViewFeatureCtrl($scope, $http, $routeParams, $location, $route, $rootScope) {
    $scope.editFeature = function(feature) {
        $scope.selectedFeature = feature;
        $http.get('/features/' + feature.id)
            .success(function(featureWithTags) {
                // convert tag from simple raw values to select2-compatible object
                var rawTags = featureWithTags.tags;
                featureWithTags.tags = [];
                rawTags.map(function(tag) {featureWithTags.tags.push({id: tag, text: tag})});

                // map the team name over to the "text" attribute to make select2 happy
                if (featureWithTags.team) {
                    featureWithTags.team.text = featureWithTags.team.name;
                }

                $scope.selectedFeature = featureWithTags;
                $scope.showViewFeature = true;
                $rootScope.loading = false;
            });
    };

    $scope.saveFeature = function(feature) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(feature);
        copy.tags = [];
        feature.tags.map(function(tag) {copy.tags.push(tag.id)});

        // remove the "text" field from the team that select2 adds so that it will be well-formed
        if (copy.team) {
            delete copy.team.text;
        }

        $http.put('/features/' + feature.id, copy)
            .success(function(returnedFeature) {
                if ($scope.features) {
                    for (var i = 0; i < $scope.features.length; i++) {
                        if ($scope.features[i].id == feature.id) {
                            $scope.features[i] = returnedFeature;
                            break;
                        }
                    }
                }

                $scope.closeViewFeature();
            }).error(FormErrorHandler($scope));
    };

    $scope.closeViewFeature = function() {
        $location.path("/features");
    };

    // if we're given an ID then go ahead and get it, otherwise redirect back
    if (/^\-?\d*$/.test($routeParams.featureId)) {
        $rootScope.loading = true;
        $scope.editFeature({id: $routeParams.featureId});
    } else {
        $location.path("/features");
    }
}
