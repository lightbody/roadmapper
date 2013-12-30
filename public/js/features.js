function FeaturesCtrl($scope, $http, $routeParams, $location, $route, $rootScope) {
    $scope.queryReturned = true;
    $scope.numPerPage = 10; //Math.floor((window.innerHeight - 218) / 37);
    $scope.filteredFeatures = [];
    $scope.maxSize = 5;
    $scope.features = [];

    var filterFeatures = function() {
        var begin = (($scope.currentPage - 1) * $scope.numPerPage)
            , end = begin + $scope.numPerPage;

        $scope.filteredFeatures= $scope.features.slice(begin, end);
    };

    var sortFeatures = function() {
        if (!$scope.features) return;
        $scope.features.sort(function (a, b) {
            var a1 = a[$scope.predicate];
            if (a1 && a1.toLowerCase) {
                a1 = a1.toLowerCase();
            }

            var b1 = b[$scope.predicate];
            if (b1 && b1.toLowerCase) {
                b1 = b1.toLowerCase();
            }

            if (!$scope.reverse) {
                return a1 > b1 ? 1 : -1;
            } else {
                return a1 > b1 ? -1 : 1;
            }
        });
    };

    var watchSorter = function() {
        sortFeatures();
        filterFeatures();
    };

    $scope.$watch("predicate", watchSorter);
    $scope.$watch("reverse", watchSorter);


    $scope.search = function () {
        $scope.queryReturned = false;

        // keep a copy of the query on the root scope so we maintain state
        $rootScope.featureQuery = $scope.featureQuery;

        $http.get('/features', {
            params: {
                query: $scope.featureQuery.map(function(e) { return e.id } ).join(",")
            }
        }).success(function (features) {
                $scope.queryReturned = true;
                $scope.features = features;
                $scope.currentPage = 1;
                sortFeatures();
                filterFeatures();
            });
    };

    $scope.$watch("featureQuery", $scope.search);

    $scope.numPages = function () {
        return Math.ceil($scope.features.length / $scope.numPerPage);
    };

    $scope.$watch('currentPage + numPerPage', filterFeatures);

    var sortHack = function(tag) {
        if (tag.indexOf("state:") == 0) {
            return "00000" + tag;
        } else if (tag.indexOf("title:") == 0) {
            return "11111" + tag;
        } else if (tag.indexOf("description:") == 0) {
            return "22222" + tag;
        } else if (tag.indexOf("createdBy:") == 0) {
            return "33333" + tag;
        } else if (tag.indexOf("team:") == 0) {
            return "44444" + tag;
        } else if (tag.indexOf("quarter:") == 0) {
            return "55555" + tag;
        } else {
            return "66666" + tag;
        }
    };

    var counter = 1;

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
            counter++;
            var cur = counter;

            var term = query.term;
            if (term == "") {
                query.callback({results: []});
                return;
            }

            var results = [];

            // always offer title & description matching
            results.push({id: "title:" + term, text: "<strong>Title</strong>: " + term});
            results.push({id: "description:" + term, text: "<strong>Description</strong>: " + term});

            // always offer account name matching
            results.push({id: "company:" + term, text: "<strong>Company</strong>: " + term});

            // if there is an "@", offer created-by matching
            if (term.indexOf("@") != -1) {
                results.push({id: "createdBy:" + term, text: "<strong>Created By</strong>: " + term});
            }

            // always offer team name matching todo: could improve this to detect if it's a team name
            results.push({id: "team:" + term, text: "<strong>Team</strong>: " + term});


            // does the search term match any known quarters?
            if (term.length > 3 || term.indexOf("Q") == 0 || term.indexOf("20") == 0 || term.indexOf("FY") == 0) {
                for (var i = 0; i < $rootScope.enumAllQuarters.length; i++) {
                    var quarter = $rootScope.enumAllQuarters[i];
                    if (quarter.label.indexOf(term) != -1) {
                        results.push({id: "quarter:" + quarter.id, text: "<strong>Quarter</strong>: " + quarter.label});
                    }
                }
            }

            // status matching -- only do it when we haven't already selected a state
            var hasStateQuery = false;
            $scope.featureQuery.map(function(e) {
                if (e.id.indexOf("state:") == 0) {
                    hasStateQuery = true;
                }
            });
            if (!hasStateQuery) {
                enumFeatureStates.map(function(e) {
                    if (e.match(new RegExp(".*" + term + ".*", "i"))) {
                        results.push({id: "state:" + e, text: "<strong>State</strong>: " + e});
                    }
                });
            }

            $http.get("/tags?query=" + term)
                .success(function (tags) {
                    if (cur != counter) {
                        //console.log("discarding: " +  cur + " != " + counter);
                        return;
                    }
                    //console.log("keeping: " + cur + " == " + counter);

                    tags.map(function(tag) {results.push({id: tag, text: "<strong>Tag</strong>: " + tag})});
                    query.callback({
                        results: results
                    });
                }).error(LogHandler($scope));
        },
        formatSelection: function(object, container) {
            return object.text;
        },
        formatResult: function(object, container) {
            return object.text;
        }
    };
    $scope.selectProblems = function(feature) {
        $rootScope.query = [{id: "featureId:" + feature.id, text: "<strong>Feature</strong>: " + feature.title}]
        $location.path("/problems");
    };
}
