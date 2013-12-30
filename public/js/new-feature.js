function NewFeatureCtrl($scope, $http, $location) {
    $scope.createAnother = false;

    $scope.cmdEnter = function() {
        if ($scope.newFeatureForm.$pristine || $scope.newFeatureForm.$invalid) {
            return;
        }

        $scope.createFeature($scope.newFeature);
    };

    $scope.createFeature = function (feature) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(feature);
        copy.tags = [];
        feature.tags.map(function(tag) {copy.tags.push(tag.id)});

        // remove the "text" field from the team that select2 adds so that it will be well-formed
        if (copy.team) {
            delete copy.team.text;
        }

        $scope.saving = true;
        $http.post('/features', copy)
            .success(function (returnedFeature) {
                $scope.saving = false;
                $scope.saved = returnedFeature.id;
                setTimeout(function() {
                    $scope.saved = null;
                    $scope.$digest();
                }, 5000);

                if ($scope.createAnother) {
                    $scope.newFeature = {tags: []};
                    $scope.junk = []; // todo: ugly hack to clear out tag selector
                    $scope.newFeatureForm.$setPristine(true);
                    // todo: we should focus back on the title field but I don't know how :(
                } else {
                    $location.path("/features");
                }
            }).error(FormErrorHandler($scope));
    };

    $scope.cancelNewFeature = function() {
        $location.path("/features");
    };
}
