console.log("problems.js loading");

function ProblemsCtrl($scope, $http, $location) {
    $scope.createProblem = function (problem, modalDismiss) {
        $http.post('/problems', problem)
            .success(function (returnedProblem) {
                $scope.openProblems.push(returnedProblem);

                modalDismiss();
            })
            .error(function () {
                debugger;
            });
    };

    $scope.editProblem = function(problem) {
        $scope.selectedProblem = problem;
        $http.get('/problems/' + problem.id)
            .success(function(problemWithTags) {
                $scope.selectedProblem = problemWithTags;
            });
    };

    $scope.saveProblem = function(problem) {
        $http.put('/problems/' + problem.id, problem)
            .success(function() {
                //todo
            })
            .error(function() {
                debugger;
            })
    };

    console.log("getting /problems/open");

    $http.get('/problems/open')
        .success(function (problems) {
            $scope.openProblems = problems;
        });
}
