function NewProblemCtrl($scope, $http, $location) {
    $scope.createAnother = true;

    $scope.createProblem = function (problem) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        $scope.saving = true;
        $http.post('/problems', copy)
            .success(function (returnedProblem) {
                $scope.saving = false;
                $scope.saved = returnedProblem.id;
                setTimeout(function() {
                    $scope.saved = null;
                    $scope.$digest();
                }, 5000);

                mixpanel.people.increment("Problems Recorded");
                mixpanel.track("Record Problem", returnedProblem);

                if ($scope.createAnother) {
                    $scope.newProblem = {};
                    $scope.junk = []; // todo: ugly hack to clear out tag selector
                    $scope.newProblemForm.$setPristine(true);
                    // todo: we should focus back on the description field but I don't know how :(
                } else {
                    $location.path("/problems");
                }
            }).error(FormErrorHandler($scope));
    };

    $scope.cancelNewProblem = function() {
        $location.path("/problems");
    };

}
