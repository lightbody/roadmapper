function TeamsCtrl($scope, $rootScope, $http, $location, featureService, sorter) {
    $scope.showNewTeamModal = function() {
        $scope.showNewTeam = true;
    };

    $scope.createTeam = function (team) {
        $http.post('/teams', team)
            .success(function (returnedTeam) {
                $scope.teams.push(returnedTeam);
                $scope.closeNewTeam();
            }).error(LogHandler($scope));
    };

    $scope.closeNewTeam = function() {
        $scope.newTeam = null;
        $scope.showNewTeam = false;
    };

    $scope.modalOptions = {
        backdropFade: false,
        dialogFade: false,
        dialogClass: 'modal modal-team'
    };

    $scope.saveTeam = debouncer(function(team) {
        $http.put('/teams/' + team.id, team)
            .success(function (updatedTeam) {
                team.name = updatedTeam.name;
                team.utilization = updatedTeam.utilization;
                team.quarterStaffSummary = updatedTeam.quarterStaffSummary;
            }).error(LogHandler($scope));
    }, 1000);

    $scope.saveStaffLevel = debouncer(function(team, quarter) {
        var newCount = {count: team.quarterStaffSummary[quarter].staffed};
        $http.put('/teams/' + team.id + '/' + quarter, newCount)
            .success(function (staffSummary) {
                team.quarterStaffSummary[quarter] = staffSummary;
            }).error(LogHandler($scope));
    }, 1000);

    $scope.checkStaffing = function(summary) {
        if (summary.scheduled == 0) {
            return "unscheduled";
        }

        var pct = summary.scheduled / summary.staffed;
        if (pct < 0.85) {
            return "underutilized";
        }

        if (pct < 1.15) {
            return "ok";
        }

        return "critical";
    };

    $scope.findFeatures = function(team, quarterId) {
        var quarterLabel = "???";
        for (var i = 0; i < $rootScope.enumAllQuarters.length; i++) {
            var quarter = $rootScope.enumAllQuarters[i];
            if (quarter.id == quarterId) {
                quarterLabel = quarter.label;
                break;
            }
        }

        featureService.query = [{id: "team:" + team.name, text: "<strong>Team</strong>: " + team.name},
            {id: "quarter:" + quarterId, text: "<strong>Quarter</strong>: " + quarterLabel}];
        featureService.search();
        $location.path("/features");

    };

    $http.get('/teams?detailed=true')
        .success(function (teams) {
            $scope.teams = teams.sort(sorter("name", false, "id"));
        });
}
