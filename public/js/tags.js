function TagsCtrl($scope, $http, $rootScope, $location, featureService, problemService) {
    // default to sorting by reported date
    $scope.predicate = "unresolvedArr";
    $scope.reverse = true;

    $scope.assigneeSelect2Options = makeAssigneeSelect2Options($scope, false);

    $scope.$watch("assignee", function(newValue, oldValue) {
        newValue = newValue || "";
        oldValue = oldValue || "";

        if (newValue != oldValue) {
            getTagSummaries(newValue.id);
        }
    });

    $scope.selectProblemsByTag = function(tag, state) {
        problemService.query = [{id: tag.tag, text: "<strong>Tag</strong>: " + tag.tag}, {id: "state:" + state, text: "<strong>State</strong>: " + state}]
        if ($scope.assignee.id) {
            problemService.query.push({id: "assignedTo:" + $scope.assignee.id, text: "<strong>Assigned To</strong>: " + $scope.assignee.text})
        }
        problemService.search();
        $location.path("/problems");
    };

    $scope.selectFeaturesByTag = function(tag, state) {
        featureService.query = [{id: tag.tag, text: "<strong>Tag</strong>: " + tag.tag}, {id: "state:" + state, text: "<strong>State</strong>: " + state}]
        if ($scope.assignee.id) {
            featureService.query.push({id: "assignedTo:" + $scope.assignee.id, text: "<strong>Assigned To</strong>: " + $scope.assignee.text})
        }
        featureService.search();
        $location.path("/features");
    };

    $scope.modalOptions = {
        backdropFade: false,
        dialogFade: false,
        dialogClass: 'modal modal-tag-edit'
    };

    $scope.showEditTagModal = function(tag) {
        $scope.updatedTag = tag.tag;
        $scope.selectedTag = tag;
        $scope.editTagModal = true;
    };

    $scope.editTag = function (tag, updatedTag) {
        $http.put('/tags/' + tag.tag, {tag: updatedTag})
            .success(function () {
                // update the tag record
                // todo: need to account for merge scenarios, etc -- for now requires a reload :(
                tag.tag = updatedTag;

                // close the modal
                $scope.closeEditTagModal();
            }).error(LogHandler($scope));
    };

    $scope.closeEditTagModal = function() {
        $scope.selectedTag = null;
        $scope.editTagModal = false;
    };

    $scope.showDeleteTagModal = function(tag) {
        $scope.selectedTag = tag;
        $scope.deleteTagModal = true;
    };

    $scope.deleteTag = function (tag) {
        $http.delete('/tags/' + tag.tag)
            .success(function () {
                // remove the tag from the list
                $scope.tags.remove($scope.tags.indexOf(tag));

                // close the modal
                $scope.closeDeleteTagModal();
            }).error(LogHandler($scope));
    };

    $scope.closeDeleteTagModal = function() {
        $scope.selectedTag = null;
        $scope.deleteTagModal = false;
    };

    var getTagSummaries = function (assignee) {
        $scope.tags = [];
        $http.get('/tags/summaries' + (assignee ? "?assignee=" + assignee : ""))
            .success(function (tags) {
                for (var i = 0; i < tags.length; i++) {
                    var tag = tags[i];
                    tag.unresolvedProblems = tag.openProblems + tag.reviewedProblems;
                    tag.unresolvedFeatures = tag.openFeatures;
                }
                $scope.tags = tags;
            });
    };

    getTagSummaries();
}
