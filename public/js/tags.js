function TagsCtrl($scope, $http, $rootScope, $location, featureService, problemService) {
    // default to sorting by reported date
    $scope.predicate = "unresolvedArr";
    $scope.reverse = true;

    $scope.selectProblemsByTag = function(tag, state) {
        problemService.query = [{id: tag.tag, text: "<strong>Tag</strong>: " + tag.tag}, {id: "state:" + state, text: "<strong>State</strong>: " + state}]
        problemService.search();
        $location.path("/problems");
    };

    $scope.selectFeaturesByTag = function(tag, state) {
        featureService.query = [{id: tag.tag, text: "<strong>Tag</strong>: " + tag.tag}, {id: "state:" + state, text: "<strong>State</strong>: " + state}]
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

    $http.get('/tags/summaries')
        .success(function (tags) {
            for (var i = 0; i < tags.length; i++) {
                var tag = tags[i];
                tag.unresolvedProblems = tag.openProblems + tag.assignedProblems + tag.reviewedProblems;
                tag.unresolvedFeatures = tag.openFeatures + tag.researchingFeatures + tag.plannedFeatures + tag.committedFeatures + tag.startedFeatures + tag.stalledFeatures;
            }
            $scope.tags = tags;
        });
}
