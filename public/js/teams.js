function TeamsCtrl($scope, $rootScope, $http, $location) {
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

    $scope.saveStaffLevel = function(team, quarter) {
        var newCount = {count: team.quarterStaffSummary[quarter].staffed};
        $http.put('/teams/' + team.id + '/' + quarter, newCount)
            .success(function (staffSummary) {
                team.quarterStaffSummary[quarter] = staffSummary;
            }).error(LogHandler($scope));
    };

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

    $scope.findFeatures = function(team, quarter) {
        $rootScope.featureQuery = [{id: "team:" + team.name, text: "<strong>Team</strong>: " + team.name},
            {id: "quarter:" + quarter, text: "<strong>Quarter</strong>: " + quarter}];
        $location.path("/features");

    };

    $http.get('/teams?detailed=true')
        .success(function (teams) {
            $scope.teams = teams;
        });
}
