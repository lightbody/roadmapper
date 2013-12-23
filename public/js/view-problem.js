function ViewProblemCtrl($scope, $http, $routeParams, $location, $route, $rootScope) {

    $scope.editProblem = function(problem) {
        $scope.selectedProblem = problem;
        $http.get('/problems/' + problem.id)
            .success(function(problemWithTags) {
                // convert tag from simple raw values to select2-compatible object
                var rawTags = problemWithTags.tags;
                problemWithTags.tags = [];
                rawTags.map(function(tag) {problemWithTags.tags.push({id: tag, text: tag})});

                // map the feature title over to the "text" attribute to make select2 happy
                if (problemWithTags.feature) {
                    problemWithTags.feature.text = problemWithTags.feature.title;
                }

                $scope.selectedProblem = problemWithTags;
                $scope.showViewProblem = true;
                $location.path("/problems/" + problem.id);
            });
    };

    $scope.saveProblem = function(problem) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        // remove the "text" field from the feature that select2 adds so that it will be well-formed
        if (copy.feature) {
            delete copy.feature.text;
        }

        $http.put('/problems/' + problem.id, copy)
            .success(function(returnedProblem) {
                $scope.closeViewProblem();
            }).error(FormErrorHandler($scope))
    };

    $scope.closeViewProblem = function() {
        $location.path("/problems");
    };

    $scope.featureSelect2Options = {
        allowClear: true,
        query: function (query) {
            $http.get("/features?query=title:" + query.term)
                .success(function (features) {
                    var results = [];
                    features.map(function(feature) {results.push({id: feature.id, text: feature.title})});
                    query.callback({
                        results: results
                    });
                }).error(LogHandler($scope));
        }
    };

    debugger;
    if (/^\-?\d*$/.test($routeParams.problemId)) {
        $scope.editProblem({id: $routeParams.problemId});
    } else {
        $location.path("/problems");
    }

}
