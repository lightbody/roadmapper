console.log("problems.js loading");

function ProblemsCtrl($scope, $http) {
    $scope.showNewProblemModal = function() {
        $scope.showNewProblem = true;
    };

    $scope.createProblem = function (problem) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        $http.post('/problems', copy)
            .success(function (returnedProblem) {
                $scope.openProblems.push(returnedProblem);

                $scope.showNewProblem = false;
            })
            .error(function () {
                debugger;
            });
    };

    $scope.closeNewProblem = function() {
        $scope.newProblem = null;
        $scope.showNewProblem = false;
    };

    $scope.modalOptions = {
        backdropFade: true,
        dialogFade:true
    };

    $scope.editProblem = function(problem) {
        $scope.selectedProblem = problem;
        $http.get('/problems/' + problem.id)
            .success(function(problemWithTags) {
                // convert tag from simple raw values to select2-compatible object
                var rawTags = problemWithTags.tags;
                problemWithTags.tags = [];
                rawTags.map(function(tag) {problemWithTags.tags.push({id: tag, text: tag})});

                $scope.selectedProblem = problemWithTags;
                $scope.showViewProblem = true;
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
                $scope.showViewProblem = false;
            })
            .error(function() {
                debugger;
            })
    };

    $scope.closeViewProblem = function() {

        $scope.showViewProblem = false;
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
