function NewFeatureCtrl($scope, $http, $routeParams, $location, $route, $rootScope) {
    $scope.createFeature = function (feature) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(feature);
        copy.tags = [];
        feature.tags.map(function(tag) {copy.tags.push(tag.id)});

        // remove the "text" field from the team that select2 adds so that it will be well-formed
        if (copy.team) {
            delete copy.team.text;
        }

        $http.post('/features', copy)
            .success(function (returnedFeature) {
                $scope.closeNewFeature();
            }).error(FormErrorHandler($scope));
    };

    $scope.closeNewFeature = function() {
        $location.path("/features");
    };
}
