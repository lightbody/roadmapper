function NewProblemCtrl($scope, $http, $location, problemService, sorter) {
    $scope.createAnother = true;

    $("#newProblemFirstInput").focus();

    $scope.featureSelect2Options = makeFeatureSelect2Options($scope, $http, false, sorter);
    $scope.assigneeSelect2Options = makeAssigneeSelect2Options($scope, false);

    $scope.cmdEnter = function() {
        if ($scope.newProblemForm.$pristine || $scope.newProblemForm.$invalid) {
            return;
        }

        $scope.createProblem($scope.problem);
    };

    $scope.createProblem = function (problem) {
        var copy = angular.copy(problem);

        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        copy.tags = problem.tags.map(function(tag) {return tag.id});

        // set the assignee email
        if (copy.assignee) {
            copy.assignee.email = copy.assignee.id;
        }

        $scope.saving = true;
        $http.post('/problems', copy)
            .success(function (returnedProblem) {
                $scope.saving = false;
                $scope.saved = returnedProblem.id;
                var client = new ZeroClipboard($("#copy-problem-button"));

                client.on( 'dataRequested', function (client, args) {
                    var href = window.location.href;
                    client.setText(href.substring(0, href.length - 3) + returnedProblem.id);
                });

                setTimeout(function() {
                    $scope.saved = null;
                    $scope.$digest();
                }, 30000);

                mixpanel.people.increment("Problems Recorded");
                mixpanel.track("Record Problem", returnedProblem);

                problemService.search();
                if ($scope.createAnother) {
                    $scope.problem = {tags: []};
                    $scope.junk = []; // todo: ugly hack to clear out tag selector
                    $scope.newProblemForm.$setPristine(true);
                    $("#newProblemFirstInput").focus(); // todo: we should focus back first field in a more Angular-like way, but I have no idea how!
                } else {
                    $location.path("/problems");
                }
            }).error(FormErrorHandler($scope));
    };

    $scope.cancelNewProblem = function() {
        $location.path("/problems");
    };

}
