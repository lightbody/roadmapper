roadmapper.factory('featureService', function ($http, $location, $parse) {
    var featureService = {
        features: [],
        featuresFeatures: [],
        numPerPage: Math.floor((window.innerHeight - 218) / 37),
        maxSize: 5,
        selectedFeature: null,
        predicate: "date",
        reverse: true,
        query: [
            {id: "state:OPEN", text: "<strong>State</strong>: OPEN"}
        ]
    };

    $(window).resize(debouncer(function() {
        var newNumPages = Math.floor((window.innerHeight - 218) / 37);
        if (newNumPages != featureService.numPerPage) {
            featureService.numPerPage = newNumPages;
            featureService.search();
        }
    }, 1000));

    var watchSorter = function() {
        sortFeatures();
        filterFeatures();
    };

    var sortFeatures = function() {
        if (!featureService.features) {
            return;
        }

        featureService.features.sort(function (a, b) {
            var a1 = $parse(featureService.predicate)(a);

            if (a1 && a1.toLowerCase) {
                a1 = a1.toLowerCase();
            }

            var b1 = $parse(featureService.predicate)(b);
            if (b1 && b1.toLowerCase) {
                b1 = b1.toLowerCase();
            }

            if (a1 == null) {
                a1 = "";
            }

            if (b1 == null) {
                b1 = "";
            }

            if (!featureService.reverse) {
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

    var filterFeatures = function() {
        var begin = ((featureService.currentPage - 1) * featureService.numPerPage)
            , end = begin + featureService.numPerPage;

        featureService.filteredFeatures = featureService.features.slice(begin, end);
    };

    featureService.update = function(feature) {
        for (var i = 0; i < featureService.features.length; i++) {
            if (featureService.features[i].id == feature.id) {
                featureService.features[i] = feature;
                break;
            }
        }
    };

    featureService.search = function () {
        featureService.queryReturned = false;

        $http.get('/features', {
            params: {
                query: featureService.query.map(function (e) {
                    return e.id
                }).join(",")
            }
        }).success(function (features) {
                featureService.queryReturned = true;
                featureService.features = features;
                featureService.currentPage = 1;
                sortFeatures();
                filterFeatures();
            });
    };

    featureService.numPages = function () {
        return Math.ceil(featureService.features.length / featureService.numPerPage);
    };

    featureService.sort = function(predicate) {
        featureService.predicate = predicate;
        featureService.reverse = !featureService.reverse;
    };

    featureService.shouldShow = function(col) {
        if (window.innerWidth <= 767) {
            if (col == 'engineeringCost' || col == 'revenueBenefit' || col == 'retentionBenefit' || col == 'positioningBenefit' || col == 'lastModified') {
                return false;
            }
        } else if (window.innerWidth <= 979) {
            if (col == 'engineeringCost' || col == 'revenueBenefit' || col == 'retentionBenefit' || col == 'positioningBenefit') {
                return false;
            }
        }

        if (col == 'state' || col == 'team' || col == 'quarter') {
            for (var i = 0; i < featureService.query.length; i++) {
                if (featureService.query[i].id.indexOf(col + ":") == 0) {
                    return false;
                }
            }
        }

        return true;
    };

    featureService.selectFeature = function(feature) {
        featureService.selectedFeature = feature;

        // find the index for this feature
        var index = -1;
        for (var i = 0; i < featureService.features.length; i++) {
            var p = featureService.features[i];
            if (p.id == feature.id) {
                index = i;
                break;
            }
        }

        // now get the next and previous features
        featureService.nextFeature = null;
        featureService.prevFeature = null;
        if (index != -1) {
            if (index > 0) {
                featureService.prevFeature = featureService.features[index - 1];
            }
            if (index < featureService.features.length - 1) {
                featureService.nextFeature = featureService.features[index + 1];
            }
        }

        $location.path("/features/" + feature.id);
    };

    featureService.wireUpController = function(scope) {
        scope.featureService = featureService;
        scope.$watch("featureService.query", function(newValue, oldValue) {
            // we only want to search when the value actually changes
            var oldStr = oldValue.map(function (e) { return e.id }).join(",");
            var newStr = newValue.map(function (e) { return e.id }).join(",");
            if (oldStr == newStr) {
                return;
            }

            featureService.search();
        });
        scope.$watch("featureService.predicate", watchSorter);
        scope.$watch("featureService.reverse", watchSorter);
        scope.$watch('featureService.currentPage + featureService.numPerPage', filterFeatures);
    };

    // force a search the first time
    featureService.search();

    return featureService;
});
