function NewProblemCtrl($scope, $http, $routeParams, $location, $route, $rootScope) {

    $scope.createProblem = function (problem) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        $http.post('/problems', copy)
            .success(function (returnedProblem) {
                mixpanel.people.increment("Problems Recorded");
                mixpanel.track("Record Problem", returnedProblem);

                $scope.clearNewProblem();
                $scope.closeNewProblem();
            }).error(FormErrorHandler($scope));
    };

    $scope.closeNewProblem = function() {
        $location.path("/problems");
    };

    $scope.clearNewProblem = function() {
        // seperate clear functionality addresses https://github.com/lightbody/roadmapper/issues/2
        ClearErrors($scope);
        $scope.newProblem = null;
    };

}
