roadmapper.factory('problemService', function ($http, $location, $parse, $window, userAgentService) {
    var problemService = {
        problems: [],
        filteredProblems: [],
        numPerPage: 10,
        maxSize: 5,
        selectedProblem: null,
        predicate: "date",
        reverse: true,
        query: [
            {id: "state:OPEN", text: "<strong>State</strong>: OPEN"},
            {id: "assignedTo:null", text: "<strong>Unassigned</strong>"}
        ]
    };

    var calcNumPerPage = function () {
        var newNumPages = Math.floor(($window.innerHeight - 218) / 37);

        // we don't recalculate based on screen size on iOS devices because
        // it creates a weird experience as you zoom in and out
        if (userAgentService.iOS) {
            newNumPages = 10; // default to 10 in either orientation

            // but for iPads we can do better
            if (userAgentService.iPad) {
                if (Math.abs(window.orientation) == 90) {
                    newNumPages = 12;
                } else {
                    newNumPages = 18;
                }
            }
        }

        if (newNumPages != problemService.numPerPage) {
            problemService.numPerPage = newNumPages;
            problemService.search();
        }
    };
    $(window).resize(debouncer(calcNumPerPage, 1000));

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

    problemService.bulkChange = function() {
        var changes = problemService.bulkChanges;
        //console.log(changes);
        alert("Just kidding -- need to build this :)")
    };

    problemService.countItemsChecked = function() {
        var count = 0;
        for (var i = 0; i < problemService.problems.length; i++) {
            if (problemService.problems[i].checked) {
                count++;
            }
        }

        return count;
    };

    problemService.checkAll = function() {
        problemService.checkedAll = !problemService.checkedAll;
        for (var i = 0; i < problemService.problems.length; i++) {
            problemService.problems[i].checked = !problemService.problems[i].checked;
        }
    };

    problemService.update = function(problem) {
        for (var i = 0; i < problemService.problems.length; i++) {
            if (problemService.problems[i].id == problem.id) {
                // carry over the checked state before wiping out the local cache
                problem.checked = problemService.problems[i].checked;
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

    problemService.shouldShow = function(col) {
        if ($window.innerWidth <= 767) {
            if (col == 'lastModified' || col == 'feature.name' || col == 'customerName') {
                return false;
            }
        } else if ($window.innerWidth <= 979) {
            if (col == 'lastModified') {
                return false;
            }
        }

        if (col == 'state') {
            for (var i = 0; i < problemService.query.length; i++) {
                if (problemService.query[i].id.indexOf(col + ":") == 0) {
                    return false;
                }
            }
        }

        return true;
    };

    problemService.selectProblem = function(problem, event) {
        // if the feature was selected using cmd/ctrl click, then don't do anything because it'll be opened
        // correctly in a background tab
        if (event && (event.metaKey || event.ctrlKey)) {
            event.stopPropagation();
            return;
        }

        // we copy it so that when the form is being edited we're not changing the model in the list, making it look
        // like we edited it when we didn't really
        problemService.selectedProblem = angular.copy(problem);

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

    problemService.selectProblems = function(feature) {
        problemService.query = [{id: "featureId:" + feature.id, text: "<strong>Feature</strong>: " + feature.title}];
        problemService.search();
        $location.path("/problems");
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
    calcNumPerPage();
    problemService.search();

    return problemService;
});
