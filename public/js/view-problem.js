function ViewProblemCtrl($scope, $http, $routeParams, $location, $route, $rootScope, problemService) {
    $scope.problemService = problemService;

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
                $scope.editProblemForm.$setPristine(true);
                $rootScope.loading = false;
            });
    };

    $scope.saveProblemAndContinue = function(problem) {
        $scope.saveProblem(problem, function() {
            problemService.selectProblem(problemService.nextProblem);
        });
    };

    $scope.saveProblem = function(problem, callback) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        // remove the "text" field from the feature that select2 adds so that it will be well-formed
        if (copy.feature) {
            delete copy.feature.text;
        }

        $scope.saving = true;

        $http.put('/problems/' + problem.id, copy)
            .success(function(returnedProblem) {
                $scope.saving = false;
                $scope.saved = true;
                $scope.editProblemForm.$setPristine(true);
                callback();
                setTimeout(function() {
                    $scope.saved = false;
                    $scope.$digest();
                }, 5000);
            }).error(FormErrorHandler($scope))
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

    if (/^\-?\d*$/.test($routeParams.problemId)) {
        $rootScope.loading = true;
        $scope.editProblem({id: $routeParams.problemId});
    } else {
        $location.path("/problems");
    }

}
