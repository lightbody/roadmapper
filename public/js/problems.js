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
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        $http.post('/problems', copy)
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
                // convert tag from simple raw values to select2-compatible object
                var rawTags = problemWithTags.tags;
                problemWithTags.tags = [];
                rawTags.map(function(tag) {problemWithTags.tags.push({id: tag, text: tag})});

                $scope.selectedProblem = problemWithTags;
                $q.when(viewProblemModalPromise).then(function(modalEl) {
                    modalEl.modal('show');
                });
            });
    };

    $scope.saveProblem = function(problem) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        $http.put('/problems/' + problem.id, copy)
            .success(function() {
                //todo
            })
            .error(function() {
                debugger;
            })
    };

    $scope.select2Options = {
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
            console.log("in query function2");
            $http.get("/tags?query=" + query.term)
                .success(function (tags) {
                    var results = [];
                    tags.map(function(tag) {results.push({id: tag, text: tag})});
                    query.callback({
                        results: results
                    });
                })
                .error(function () {
                    debugger;
                });
        },
        formatNoMatches: function(){ return 'empty';}
    };

    $http.get('/problems/open')
        .success(function (problems) {
            $scope.openProblems = problems;
        });
}
