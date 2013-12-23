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

    $scope.tagSelect2Options = {
        multiple: true,
        createSearchChoice: function(val) {
            if (val.length>0) {
                return {id: val, text: val};
            } else {
                return null;
            }
        },
        tags: [],
        tokenSeparators: [",", " "],
        query: function (query) {
            $http.get("/tags?query=" + query.term)
                .success(function (tags) {
                    var results = [];
                    tags.map(function(tag) {results.push({id: tag, text: tag})});
                    query.callback({
                        results: results
                    });
                }).error(LogHandler($scope));
        },
        formatNoMatches: function(){ return 'empty';}
    };

    $scope.teamSelect2Options = {
        allowClear: true,
        query: function (query) {
            $http.get("/teams")
                .success(function (teams) {
                    var results = [];
                    teams.map(function(team) {results.push({id: team.id, text: team.name})});
                    query.callback({
                        results: results
                    });
                }).error(LogHandler($scope));
        }
    };
}
