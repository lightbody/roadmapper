function ProblemsCtrl($scope, $http, $routeParams, $location, $route, $rootScope, problemService) {
    problemService.wireUpController($scope);

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
        openOnEnter: false,
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
            problemService.query.map(function(e) {
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
                }).error(LogHandler($scope));
        },
        formatSelection: function(object, container) {
            return object.text;
        },
        formatResult: function(object, container) {
            return object.text;
        }
    };

    $scope.selectFeature = function(feature) {
        $location.path("/features/" + feature.id);
    };
}
