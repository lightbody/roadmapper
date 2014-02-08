function ViewProblemCtrl($scope, $http, $routeParams, $location, $route, $rootScope, problemService, featureService, userAgentService, sorter) {
    $scope.featureService = featureService;
    $scope.problemService = problemService;

    $scope.featureSelect2Options = makeFeatureSelect2Options($scope, $http, false, sorter);
    $scope.assigneeSelect2Options = makeAssigneeSelect2Options($scope, false);

    $scope.editProblem = function(problem) {
        $scope.problem = problem;
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

                // similarly, if there is an assignee map it over
                if (problemWithTags.assignee) {
                    problemWithTags.assignee.id = problemWithTags.assignee.email;
                    problemWithTags.assignee.text = problemWithTags.assignee.name;
                }


                $scope.problem = problemWithTags;
                $scope.showViewProblem = true;
                $scope.editProblemForm.$setPristine(true);
                $rootScope.loading = false;

                // focus the first text field, but not on iOS devices because the keyboard popup is annoying
                if (!userAgentService.iOS) {
                    $("#editProblemFirstInput").focus();
                }

                problemService.update(problemWithTags);
            });
    };

    $scope.cmdEnter = function() {
        if (!problemService.nextProblem) {
            // no next problem? ok let's just save and stay put
            if ($scope.editProblemForm.$valid) {
                $scope.saveProblem($scope.problem);
            }
        } else {
            // there is a next problem and the current form hasn't been touched, then just move on without saving
            if ($scope.editProblemForm.$pristine) {
                problemService.selectProblem(problemService.nextProblem);
            } else if ($scope.editProblemForm.$valid) {
                $scope.saveProblem($scope.problem, function() {
                    problemService.selectProblem(problemService.nextProblem);
                });
            }
        }
    };

    $scope.saveProblemAndContinue = function(problem) {
        if (!problemService.nextProblem) {
            return;
        }

        if ($scope.editProblemForm.$pristine) {
            problemService.selectProblem(problemService.nextProblem);
        } else if ($scope.editProblemForm.$valid) {
            $scope.saveProblem(problem, function() {
                problemService.selectProblem(problemService.nextProblem);
            });
        }
    };

    $scope.saveProblem = function(problem, callback) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        // convert assignee over
        if (copy.assignee) {
            copy.assignee.email = copy.assignee.id;
            delete copy.assignee.id;
            delete copy.assignee.text;
        }

        $scope.saving = true;

        $http.put('/problems/' + problem.id, copy)
            .success(function(returnedProblem) {
                problemService.update(returnedProblem);

                $scope.saving = false;
                $scope.saved = true;
                $scope.editProblemForm.$setPristine(true);
                if (callback) {
                    callback();
                }
                setTimeout(function() {
                    $scope.saved = false;
                    $scope.$digest();
                }, 5000);
            }).error(FormErrorHandler($scope))
    };

    if (/^\-?\d*$/.test($routeParams.problemId)) {
        $rootScope.loading = true;
        $scope.editProblem({id: $routeParams.problemId});
    } else {
        $location.path("/problems");
    }

}
