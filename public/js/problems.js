console.log("problems.js loading");

function ProblemsCtrl($scope, $http, $location, $modal, $q) {
    // Create modal (returns a promise since it may have to perform an http request)
    var newProblemModalPromise = $modal({
        template: 'templates/new-problem.html',
        persist: true,
        show: false,
        backdrop: 'static',
        scope: $scope
    });

    // Toggle modal
    $scope.showNewProblemModal = function() {
        $q.when(newProblemModalPromise).then(function(modalEl) {
            modalEl.modal('show');
        });
    };


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

    // Create modal (returns a promise since it may have to perform an http request)
    var viewProblemModalPromise = $modal({
        template: 'templates/view-problem.html',
        persist: true,
        show: false,
        backdrop: 'static',
        scope: $scope
    });


    $scope.editProblem = function(problem) {
        $scope.selectedProblem = problem;
        $http.get('/problems/' + problem.id)
            .success(function(problemWithTags) {
                $scope.selectedProblem = problemWithTags;
                $q.when(viewProblemModalPromise).then(function(modalEl) {
                    modalEl.modal('show');
                });
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

    $http.get('/problems/open')
        .success(function (problems) {
            $scope.openProblems = problems;
        });
}
