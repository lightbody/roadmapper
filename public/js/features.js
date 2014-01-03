function FeaturesCtrl($scope, $http, featureService, $q, problemService, $rootScope) {
    $scope.featureService = featureService;
    $scope.problemService = problemService;
    featureService.wireUpController($scope);

    $(window).on("resize.FeaturesCtrl", debouncer(function() {
        $scope.$digest();
    }, 1000));

    $scope.$on('$destroy', function() {
        $(window).off("resize.FeaturesCtrl");
    });

    var sortHack = function(tag) {
        if (tag.indexOf("state:") == 0) {
            return "00000" + tag;
        } else if (tag.indexOf("assignedTo:") == 0) {
            return "000111" + tag;
        } else if (tag.indexOf("title:") == 0) {
            return "11111" + tag;
        } else if (tag.indexOf("description:") == 0) {
            return "22222" + tag;
        } else if (tag.indexOf("text:") == 0) {
            return "33333" + tag;
        } else if (tag.indexOf("createdBy:") == 0) {
            return "44444" + tag;
        } else if (tag.indexOf("team:") == 0) {
            return "55555" + tag;
        } else if (tag.indexOf("quarter:") == 0) {
            return "66666" + tag;
        } else {
            return "77777" + tag;
        }
    };

    var canceler = null;
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

            // always offer title, description, and full text matching
            results.push({id: "title:" + term, text: "<strong>Title</strong>: " + term});
            results.push({id: "description:" + term, text: "<strong>Description</strong>: " + term});
            results.push({id: "text:" + term, text: "<strong>Text</strong>: " + term});

            // some smart options around assignment
            if (term == "me") {
                results.push({id: "assignedTo:" + $scope.user.email, text: "<strong>Assigned To Me</strong>"});
            } else if (term.toLowerCase().indexOf("ass") == 0) {
                results.push({id: "assignedTo:not-null", text: "<strong>Assigned to Anyone</strong>"});
                results.push({id: "assignedTo:" + $scope.user.email, text: "<strong>Assigned To Me</strong>"});
            } else if (term.toLowerCase().indexOf("un") == 0) {
                results.push({id: "assignedTo:null", text: "<strong>Unassigned</strong>"});
            } else if (term.length >= 3) {
                $scope.asigneeChoices.map(function(entry) {
                    if (entry.id.toLowerCase().indexOf(term.toLowerCase()) != -1
                        || entry.text.toLowerCase().indexOf(term.toLowerCase()) != -1) {
                        results.push({id: "assignedTo:" + entry.id, text: "<strong>Assigned To</strong>: " + entry.text});
                    }
                });
            }

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
            featureService.query.map(function(e) {
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

            if (canceler != null) {
                canceler.resolve();
            }
            canceler = $q.defer();
            $http.get("/tags?query=" + term, {timeout: canceler.promise})
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

    $scope.showDeleteFeatureModal = function(feature) {
        $scope.selectedFeature = feature;
        $scope.deleteFeatureModal = true;
    };

    $scope.deleteFeature = function (feature) {
        $http.delete('/features/' + feature.id)
            .success(function () {
                featureService.search();

                // close the modal
                $scope.closeDeleteFeatureModal();
            }).error(LogHandler($scope));
    };

    $scope.closeDeleteFeatureModal = function() {
        $scope.selectedFeature = null;
        $scope.deleteFeatureModal = false;
    };
}
