roadmapper.factory('problemService', function ($http, $location, $parse) {
    var problemService = {
        problems: [],
        filteredProblems: [],
        numPerPage: 10,
        maxSize: 5,
        selectedProblem: null,
        predicate: "date",
        reverse: true,
        query: [
            {id: "state:OPEN", text: "<strong>State</strong>: OPEN"}
        ]
    };

    var watchSorter = function() {
        sortProblems();
        filterProblems();
    };

    var sortProblems = function() {
        if (!problemService.problems) {
            return;
        }

        problemService.problems.sort(function (a, b) {
            var a1 = $parse(problemService.predicate)(a);

            if (a1 && a1.toLowerCase) {
                a1 = a1.toLowerCase();
            }

            var b1 = $parse(problemService.predicate)(b);
            if (b1 && b1.toLowerCase) {
                b1 = b1.toLowerCase();
            }

            if (a1 == null) {
                a1 = "";
            }

            if (b1 == null) {
                b1 = "";
            }

            if (!problemService.reverse) {
                if (a1 == b1) {
                    return a.id > b.id ? 1 : -1;
                } else {
                    return a1 > b1 ? 1 : -1;
                }
            } else {
                if (a1 == b1) {
                    return a.id > b.id ? -1 : 1;
                } else {
                    return a1 > b1 ? -1 : 1;
                }
            }
        });
    };

    var filterProblems = function() {
        var begin = ((problemService.currentPage - 1) * problemService.numPerPage)
            , end = begin + problemService.numPerPage;

        problemService.filteredProblems = problemService.problems.slice(begin, end);
    };

    problemService.update = function(problem) {
        for (var i = 0; i < problemService.problems.length; i++) {
            if (problemService.problems[i].id == problem.id) {
                problemService.problems[i] = problem;
                break;
            }
        }
    };

    problemService.search = function () {
        problemService.queryReturned = false;

        $http.get('/problems', {
            params: {
                query: problemService.query.map(function (e) {
                    return e.id
                }).join(",")
            }
        }).success(function (problems) {
                problemService.queryReturned = true;
                problemService.problems = problems;
                problemService.currentPage = 1;
                sortProblems();
                filterProblems();
            });
    };

    problemService.numPages = function () {
        return Math.ceil(problemService.problems.length / problemService.numPerPage);
    };

    problemService.sort = function(predicate) {
        problemService.predicate = predicate;
        problemService.reverse = !problemService.reverse;
    };

    problemService.selectProblem = function(problem) {
        problemService.selectedProblem = problem;

        // find the index for this problem
        var index = -1;
        for (var i = 0; i < problemService.problems.length; i++) {
            var p = problemService.problems[i];
            if (p.id == problem.id) {
                index = i;
                break;
            }
        }

        // now get the next and previous problems
        problemService.nextProblem = null;
        problemService.prevProblem = null;
        if (index != -1) {
            if (index > 0) {
                problemService.prevProblem = problemService.problems[index - 1];
            }
            if (index < problemService.problems.length - 1) {
                problemService.nextProblem = problemService.problems[index + 1];
            }
        }

        $location.path("/problems/" + problem.id);
    };

    problemService.wireUpController = function(scope) {
        scope.problemService = problemService;
        scope.$watch("problemService.query", function(newValue, oldValue) {
            // we only want to search when the value actually changes
            var oldStr = oldValue.map(function (e) { return e.id }).join(",");
            var newStr = newValue.map(function (e) { return e.id }).join(",");
            if (oldStr == newStr) {
                return;
            }

            problemService.search();
        });
        scope.$watch("problemService.predicate", watchSorter);
        scope.$watch("problemService.reverse", watchSorter);
        scope.$watch('problemService.currentPage + problemService.numPerPage', filterProblems);
    };

    // force a search the first time
    problemService.search();

    return problemService;
});
