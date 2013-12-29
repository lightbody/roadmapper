roadmapper.factory('problemService', function ($http) {
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
            var a1 = a[problemService.predicate];
            if (a1 && a1.toLowerCase) {
                a1 = a1.toLowerCase();
            }

            var b1 = b[problemService.predicate];
            if (b1 && b1.toLowerCase) {
                b1 = b1.toLowerCase();
            }

            if (!problemService.reverse) {
                return a1 > b1 ? 1 : -1;
            } else {
                return a1 > b1 ? -1 : 1;
            }
        });
    };

    var filterProblems = function() {
        var begin = ((problemService.currentPage - 1) * problemService.numPerPage)
            , end = begin + problemService.numPerPage;

        problemService.filteredProblems = problemService.problems.slice(begin, end);
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

    problemService.wireUpController = function(scope) {
        scope.problemService = problemService;
        scope.$watch("problemService.query", problemService.search);
        scope.$watch("problemService.predicate", watchSorter);
        scope.$watch("problemService.reverse", watchSorter);
        scope.$watch('problemService.currentPage + problemService.numPerPage', filterProblems);
    };

    return problemService;
});
