function ViewFeatureCtrl($scope, $http, $routeParams, $location, $rootScope, featureService, problemService, userAgentService) {
    $scope.featureService = featureService;
    $scope.problemService = problemService;
    $scope.related = {
        predicate: "rank",
        reverse: true,
        features: []
    };

    $scope.assigneeSelect2Options = {
        allowClear: true,
        data: $scope.asigneeChoices
    };

    var findRelatedFeatures = function() {
        if (!$scope.selectedFeature.tags) {
            return;
        }

        var tagSearch = $scope.selectedFeature.tags.map(function(tag) {return tag.id}).join(" ");
        $http.get("/features?limit=20&query=state:OPEN,text:" + tagSearch)
            .success(function (features) {
                $scope.related.features = features;
            }).error(LogHandler($scope));
    };
    $scope.$watch("selectedFeature.tags", findRelatedFeatures);

    $scope.sortRelated = function(predicate) {
        $scope.related.predicate = predicate;
        $scope.related.reverse = !$scope.related.reverse;
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

                // similarly, if there is an assignee map it over
                if (featureWithTags.assignee) {
                    featureWithTags.assignee.id = featureWithTags.assignee.email;
                    featureWithTags.assignee.text = featureWithTags.assignee.name;
                }

                $scope.selectedFeature = featureWithTags;
                $scope.showViewFeature = true;
                $scope.editFeatureForm.$setPristine(true);
                $rootScope.loading = false;

                // focus the first text field, but not on iOS devices because the keyboard popup is annoying
                if (!userAgentService.iOS) {
                    $("#editFeatureFirstInput").focus();
                }

                featureService.update(featureWithTags);

                // get a list of related features
                findRelatedFeatures();
            });
    };

    $scope.cmdEnter = function() {
        if (!featureService.nextFeature) {
            // no next feature? ok let's just save and stay put
            if ($scope.editFeatureForm.$valid) {
                $scope.saveFeature($scope.selectedFeature);
            }
        } else {
            // there is a next feature and the current form hasn't been touched, then just move on without saving
            if ($scope.editFeatureForm.$pristine) {
                featureService.selectFeature(featureService.nextFeature);
            } else if ($scope.editFeatureForm.$valid) {
                $scope.saveFeature($scope.selectedFeature, function() {
                    featureService.selectFeature(featureService.nextFeature);
                });
            }
        }
    };

    $scope.saveFeatureAndContinue = function(feature) {
        $scope.saveFeature(feature, function() {
            featureService.selectFeature(featureService.nextFeature);
        });
    };

    $scope.saveFeature = function(feature, callback) {
        if (!$scope.checkRole('PM')) {
            // only PMs can save features, so don't actually save but we can still call the callback b/c we're nice :)
            if (callback) {
                callback();
            }
            return;
        }


        // convert tags from select2 {id: ..., text: ...} format to just simple array of raw tag value
        var copy = angular.copy(feature);
        copy.tags = [];
        feature.tags.map(function(tag) {copy.tags.push(tag.id)});

        // remove the "text" field from the team that select2 adds so that it will be well-formed
        if (copy.team) {
            delete copy.team.text;
        }

        // convert assignee over
        if (copy.assignee) {
            copy.assignee.email = copy.assignee.id;
            delete copy.assignee.id;
            delete copy.assignee.text;
        }

        $scope.saving = true;

        $http.put('/features/' + feature.id, copy)
            .success(function(returnedFeature) {
                featureService.update(returnedFeature);

                $scope.saving = false;
                $scope.saved = true;
                $scope.editFeatureForm.$setPristine(true);
                if (callback) {
                    callback();
                }
                setTimeout(function() {
                    $scope.saved = false;
                    $scope.$digest();
                }, 5000);
            }).error(FormErrorHandler($scope));
    };

    // if we're given an ID then go ahead and get it, otherwise redirect back
    if (/^\-?\d*$/.test($routeParams.featureId)) {
        $rootScope.loading = true;
        $scope.editFeature({id: $routeParams.featureId});
    } else {
        $location.path("/features");
    }
}
