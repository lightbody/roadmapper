function FeaturesCtrl($scope, $http, $routeParams, $location, $route, $rootScope) {
    // this ensures that the modal dialog boxes don't actually cause the route to cause a new controller reload
    // see http://stackoverflow.com/questions/12422611/angularjs-paging-with-location-path-but-no-ngview-reload and
    // http://stackoverflow.com/questions/17460179/clean-urls-with-angularjs-and-modal-dialog-boxes
    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event) {
        if ($location.path().indexOf("/features") == 0) {
            $route.current = lastRoute;
        }
    });

    $scope.queryReturned = true;
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
            });
    };

    $scope.$watch("featureQuery", $scope.search);

    $scope.sizeSort = function(feature) {
    };

    $scope.quarterSort = function(feature) {
        var qtr = feature.quarter;
        if (qtr == null) {
            return null;
        }

        return qtr.substring(3, 7) + qtr.substring(0, 2);
    };

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

            // always offer quarter matching todo: could improve this to only match the QQ-YYYY format (or whatever)
            results.push({id: "quarter:" + term, text: "<strong>Quarter</strong>: " + term});

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


    $scope.showNewFeatureModal = function() {
        $location.path("/features/new");
        $scope.showNewFeature = true;
    };

    $scope.createFeature = function (feature) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(feature);
        copy.tags = [];
        feature.tags.map(function(tag) {copy.tags.push(tag.id)});

        // remove the "text" field from the team that select2 adds so that it will be well-formed
        if (copy.team) {
            delete copy.team.text;
        }

        $http.post('/features', copy)
            .success(function (returnedFeature) {
                $scope.features.push(returnedFeature);
                $scope.closeNewFeature();
            }).error(FormErrorHandler($scope));
    };

    $scope.closeNewFeature = function() {
        $location.path("/features");
        ClearErrors($scope);
        $scope.newFeature = null;
        $scope.showNewFeature = false;
    };

    $scope.modalOptions = {
        backdropFade: false,
        dialogFade: false,
        dialogClass: 'modal modal-feature'
    };

    $scope.selectProblems = function(feature) {
        $rootScope.query = [{id: "featureId:" + feature.id, text: "<strong>Feature</strong>: " + feature.title}]
        $location.path("/problems");
    };

    $scope.editFeature = function(feature) {
        $scope.selectedFeature = feature;
        $http.get('/features/' + feature.id)
            .success(function(featureWithTags) {
                // convert tag from simple raw values to select2-compatible object
                var rawTags = featureWithTags.tags;
                featureWithTags.tags = [];
                rawTags.map(function(tag) {featureWithTags.tags.push({id: tag, text: tag})});

                // map the team name over to the "text" attribute to make select2 happy
                if (featureWithTags.team) {
                    featureWithTags.team.text = featureWithTags.team.name;
                }

                $scope.selectedFeature = featureWithTags;
                $scope.showViewFeature = true;
                $location.path("/features/" + feature.id);
            });
    };

    $scope.saveFeature = function(feature) {
        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(feature);
        copy.tags = [];
        feature.tags.map(function(tag) {copy.tags.push(tag.id)});

        // remove the "text" field from the team that select2 adds so that it will be well-formed
        if (copy.team) {
            delete copy.team.text;
        }

        $http.put('/features/' + feature.id, copy)
            .success(function(returnedFeature) {
                for (var i = 0; i < $scope.features.length; i++) {
                    if ($scope.features[i].id == feature.id) {
                        $scope.features[i] = returnedFeature;
                        break;
                    }
                }

                $scope.closeViewFeature();
            }).error(FormErrorHandler($scope));
    };

    $scope.closeViewFeature = function() {
        ClearErrors($scope);
        $location.path("/features");
        $scope.showViewFeature = false;
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
            $http.get("/tags?query=" + query.term)
                .success(function (tags) {
                    var results = [];
                    tags.map(function(tag) {results.push({id: tag, text: tag})});
                    query.callback({
                        results: results
                    });
                }).error(LogHandler($scope));
        },
        formatNoMatches: function(){ return 'empty';}
    };

    $scope.teamSelect2Options = {
        allowClear: true,
        query: function (query) {
            $http.get("/teams")
                .success(function (teams) {
                    var results = [];
                    teams.map(function(team) {results.push({id: team.id, text: team.name})});
                    query.callback({
                        results: results
                    });
                }).error(LogHandler($scope));
        }
    };

    if ($routeParams.featureId) {
        if ($routeParams.featureId == "new") {
            $scope.showNewFeatureModal();
        } else if (/^\-?\d*$/.test($routeParams.featureId)) {
            $scope.editFeature({id: $routeParams.featureId});
        } else {
            $location.path("/features");
        }
    }
}
