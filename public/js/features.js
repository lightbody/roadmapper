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


    $scope.showNewFeatureModal = function() {
        $location.path("/features/new");
        $scope.showNewFeature = true;
    };

    $scope.createFeature = function (feature) {

        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(feature);
        copy.tags = [];
        feature.tags.map(function(tag) {copy.tags.push(tag.id)});

        $http.post('/features', copy)
            .success(function (returnedFeature) {
                $scope.features.push(returnedFeature);
                $scope.closeNewFeature();
            })
            .error(function () {
                debugger;
            });
    };

    $scope.closeNewFeature = function() {
        $location.path("/features");
        $scope.newFeature = null;
        $scope.showNewFeature = false;
    };

    $scope.modalOptions = {
        backdropFade: true,
        dialogFade: true,
        dialogClass: 'modal modal-feature'
    };

    $scope.editFeature = function(feature) {
        $scope.selectedFeature = feature;
        $http.get('/features/' + feature.id)
            .success(function(featureWithTags) {
                // convert tag from simple raw values to select2-compatible object
                var rawTags = featureWithTags.tags;
                featureWithTags.tags = [];
                rawTags.map(function(tag) {featureWithTags.tags.push({id: tag, text: tag})});

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

        $http.put('/features/' + feature.id, copy)
            .success(function(returnedFeature) {
                for (var i = 0; i < $scope.features.length; i++) {
                    if ($scope.features[i].id == feature.id) {
                        $scope.features[i] = returnedFeature;
                        break;
                    }
                }

                $scope.closeViewFeature();
            })
            .error(function() {
                debugger;
            })
    };

    $scope.closeViewFeature = function() {
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
                })
                .error(function () {
                    debugger;
                });
        },
        formatNoMatches: function(){ return 'empty';}
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
