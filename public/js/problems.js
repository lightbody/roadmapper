function ProblemsCtrl($scope, $http, $routeParams, $location, $route, $rootScope) {
    // this ensures that the modal dialog boxes don't actually cause the route to cause a new controller reload
    // see http://stackoverflow.com/questions/12422611/angularjs-paging-with-location-path-but-no-ngview-reload and
    // http://stackoverflow.com/questions/17460179/clean-urls-with-angularjs-and-modal-dialog-boxes
    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event) {
        if ($location.path().indexOf("/problems") == 0) {
            $route.current = lastRoute;
        }
    });

    $scope.queryReturned = true;
    $scope.search = function () {
        $scope.queryReturned = false;

        // keep a copy of the query on the root scope so we maintain state
        $rootScope.query = $scope.query;

        $http.get('/problems', {
            params: {
                query: $scope.query.map(function(e) { return e.id } ).join(",")
            }
        }).success(function (problems) {
                $scope.queryReturned = true;
                $scope.problems = problems;
            });
    };

    $scope.$watch("query", $scope.search);

    var sortHack = function(tag) {
        if (tag.indexOf("state:") == 0) {
            return "00000" + tag;
        } else if (tag.indexOf("accountId:") == 0) {
            return "11111" + tag;
        } else if (tag.indexOf("featureId:") == 0) {
            return "11112" + tag;
        } else if (tag.indexOf("company:") == 0) {
            return "22222" + tag;
        } else if (tag.indexOf("user:") == 0) {
            return "33333" + tag;
        } else if (tag.indexOf("email:") == 0) {
            return "44444" + tag;
        } else if (tag.indexOf("description:") == 0) {
            return "55555" + tag;
        } else {
            return "66666" + tag;
        }
    };

    $scope.querySelect2Options = {
        multiple: true,
        sortResults: function(results, container, query) {
            if (query.term) {
                return results.sort(function(a, b) {
                    // this is lame but it works
                    var tag1 = sortHack(a.id);
                    var tag2 = sortHack(b.id);

                    if (tag1 < tag2) {
                        return -1;
                    } else if (tag1 > tag2) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            }

            return results;
        },
        createSearchChoice: function(val) {
            if (val.length>0) {
                return {id: val, text: "<strong>Tag</strong>: " + val};
            } else {
                return null;
            }
        },
        tags: [],
        tokenSeparators: [",", " "],
        query: function (query) {
            var term = query.term;
            if (term == "") {
                query.callback({results: []});
                return;
            }

            var results = [];

            // always offer description matching
            results.push({id: "description:" + term, text: "<strong>Description</strong>: " + term});

            // always offer account name matching
            results.push({id: "company:" + term, text: "<strong>Company</strong>: " + term});

            // always offer user name matching
            results.push({id: "user:" + term, text: "<strong>User</strong>: " + term});

            // if there is an "@", offer email matching
            if (term.indexOf("@") != -1) {
                results.push({id: "email:" + term, text: "<strong>Email</strong>: " + term});
            }

            // if it's a number, match account ID and feature ID
            if (/^\-?\d*$/.test(term)) {
                results.push({id: "accountId:" + term, text: "<strong>Account ID</strong>: " + term});
                results.push({id: "featureId:" + term, text: "<strong>Feature ID</strong>: " + term});
            }

            // status matching -- only do it when we haven't already selected a state
            var hasStateQuery = false;
            $scope.query.map(function(e) {
                if (e.id.indexOf("state:") == 0) {
                    hasStateQuery = true;
                }
            });
            if (!hasStateQuery) {
                enumProblemStates.map(function(e) {
                    if (e.match(new RegExp(".*" + term + ".*", "i"))) {
                        results.push({id: "state:" + e, text: "<strong>State</strong>: " + e});
                    }
                });
            }

            $http.get("/tags?query=" + term)
                .success(function (tags) {
                    tags.map(function(tag) {results.push({id: tag, text: "<strong>Tag</strong>: " + tag})});
                    query.callback({
                        results: results
                    });
                })
                .error(function () {
                    debugger;
                });
        },
        formatSelection: function(object, container) {
            return object.text;
        },
        formatResult: function(object, container) {
            return object.text;
        }
    };


    $scope.showNewProblemModal = function() {
        $location.path("/problems/new");
        $scope.showNewProblem = true;
    };

    $scope.createProblem = function (problem) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        $http.post('/problems', copy)
            .success(function (returnedProblem) {
                $scope.problems.push(returnedProblem);
                $scope.closeNewProblem();
            })
            .error(function () {
                debugger;
            });
    };

    $scope.closeNewProblem = function() {
        $location.path("/problems");
        $scope.newProblem = null;
        $scope.showNewProblem = false;
    };

    $scope.modalOptions = {
        backdropFade: true,
        dialogFade: true,
        dialogClass: 'modal modal-problem'
    };

    $scope.selectFeature = function(feature) {
        $location.path("/features/" + feature.id);
    };

    $scope.editProblem = function(problem) {
        $scope.selectedProblem = problem;
        $http.get('/problems/' + problem.id)
            .success(function(problemWithTags) {
                // convert tag from simple raw values to select2-compatible object
                var rawTags = problemWithTags.tags;
                problemWithTags.tags = [];
                rawTags.map(function(tag) {problemWithTags.tags.push({id: tag, text: tag})});

                // map the feature title over to the "text" attribute to make select2 happy
                if (problemWithTags.feature) {
                    problemWithTags.feature.text = problemWithTags.feature.title;
                }

                $scope.selectedProblem = problemWithTags;
                $scope.showViewProblem = true;
                $location.path("/problems/" + problem.id);
            });
    };

    $scope.saveProblem = function(problem) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(problem);
        copy.tags = [];
        problem.tags.map(function(tag) {copy.tags.push(tag.id)});

        // remove the "text" field from the feature that select2 adds so that it will be well-formed
        if (copy.feature) {
            delete copy.feature.text;
        }

        $http.put('/problems/' + problem.id, copy)
            .success(function(returnedProblem) {
                for (var i = 0; i < $scope.problems.length; i++) {
                    if ($scope.problems[i].id == returnedProblem.id) {
                        $scope.problems[i] = returnedProblem;
                        break;
                    }
                }

                $scope.closeViewProblem();
            })
            .error(function() {
                debugger;
            })
    };

    $scope.closeViewProblem = function() {
        $location.path("/problems");
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

    $scope.featureSelect2Options = {
        allowClear: true,
        query: function (query) {
            $http.get("/features?query=title:" + query.term)
                .success(function (features) {
                    var results = [];
                    features.map(function(feature) {results.push({id: feature.id, text: feature.title})});
                    query.callback({
                        results: results
                    });
                })
                .error(function () {
                    debugger;
                });
        }
    };

    if ($routeParams.problemId) {
        if ($routeParams.problemId == "new") {
            $scope.showNewProblemModal();
        } else if (/^\-?\d*$/.test($routeParams.problemId)) {
            $scope.editProblem({id: $routeParams.problemId});
        } else {
            $location.path("/problems");
        }
    }

}
