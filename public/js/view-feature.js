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
                $location.path("/features/" + feature.id);
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
                for (var i = 0; i < $scope.features.length; i++) {
                    if ($scope.features[i].id == feature.id) {
                        $scope.features[i] = returnedFeature;
                        break;
                    }
                }

                $scope.closeViewFeature();
            }).error(FormErrorHandler($scope));
    };

    $scope.closeViewFeature = function() {
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

    // if we're given an ID then go ahead and get it, otherwise redirect back
    if (/^\-?\d*$/.test($routeParams.featureId)) {
        $scope.editFeature({id: $routeParams.featureId});
    } else {
        $location.path("/features");
    }
}
