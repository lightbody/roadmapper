(function () {
    angular.module('roadmapper', ["ngCookies"]).
        config(function ($routeProvider) {
            $routeProvider.
                when('/signup', {controller: SignupCtrl, templateUrl: 'templates/signup.html'}).
                when('/login', {controller: LoginCtrl, templateUrl: 'templates/login.html'}).
                when('/dashboard', {controller: DashboardCtrl, templateUrl: 'templates/dashboard.html'}).
                when('/problems', {controller: ProblemsCtrl, templateUrl: 'templates/problems.html'}).
                when('/new-problem', {controller: NewProblemCtrl, templateUrl: 'templates/new-problem.html'}).
                when('/teams', {controller: TeamsCtrl, templateUrl: 'templates/teams.html'}).
                when('/new-team', {controller: NewTeamCtrl, templateUrl: 'templates/new-team.html'}).
                otherwise({redirectTo: '/login'});
        })
        .directive("navbar", function () {
            return {

                controller: function ($scope, $location, $rootScope, $cookieStore) {
                    $scope.login = function () {
                        $location.path("/login");
                    };

                    $scope.signup = function () {
                        $location.path("/signup");
                    };

                    $scope.dashboard = function () {
                        $location.path("/dashboard");
                    };

                    $scope.problems = function () {
                        $location.path("/problems");
                    };

                    $scope.teams = function () {
                        $location.path("/teams");
                    };

                    $scope.logout = function () {
                        $cookieStore.remove("session.id");
                        window.localStorage.removeItem("session.id");
                        $rootScope.user = null;
                        $location.path("/");
                    };
                },
                templateUrl: "templates/navbar.html"
            }
        });

    function TeamsCtrl($scope, $http, $location) {
        $scope.quarters = quarters;

        $scope.newTeam = function () {
            $location.path("/new-team");
        };

        $http.get('/team')
            .success(function (teams) {
                $scope.teams = teams;
            });
    }

    function NewTeamCtrl($scope, $http, $location) {
        $scope.submit = function (team) {
            $http.post('/team', team)
                .success(function () {
                    $location.path('/teams')
                })
                .error(function () {
                    debugger;
                });
        }
    }

    function ProblemsCtrl($scope, $http, $location) {
        $scope.newProblem = function () {
            $location.path("/new-problem");
        };

        $http.get('/problem')
            .success(function (problems) {
                $scope.problems = problems;
            });
    }

    function NewProblemCtrl($scope, $http, $location) {
        $scope.submit = function (problem) {
            $http.post('/problem', problem)
                .success(function () {
                    $location.path('/problems')
                })
                .error(function () {
                    debugger;
                });
        }
    }

    function SignupCtrl($scope, $http, $location) {
        $scope.submit = function (user) {
            $http.post('/user', user)
                .success(function () {
                    $location.path('/login')
                });
        }
    }

    function LoginCtrl($location, $scope, $rootScope, $http, $cookieStore) {
        var loginSuccess = function (data) {
            $http.defaults.headers.common['X-Session-ID'] = data.id;
            $cookieStore.put("session.id", data.id);
            if ($scope.remember) {
                window.localStorage["session.id"] =  data.id;
            }

            $rootScope.user = data.user;
            $location.path('/dashboard')
        };

        // check if there is already a session?
        var sessionId = window.localStorage["session.id"];
        if (sessionId == null) {
            sessionId = $cookieStore.get("session.id");
        }
        if (sessionId != null) {
            $http.get("/session/" + sessionId).success(loginSuccess).error(function() {
                // remove the cookie, since it's dead
                $cookieStore.remove("session.id");
                window.localStorage.removeItem("session.id");
            });
        }

        $scope.unauthorized = $rootScope.user == null;

        $scope.$watch("user.email", function (value) {
            $scope.unauthorized = false;
        });

        $scope.submit = function (user) {
            $http.post('/authenticate', user)
                .success(loginSuccess)
                .error(function () {
                    $scope.unauthorized = true;
                });
        }
    }

    function DashboardCtrl($scope, $rootScope, $location) {
        if ($rootScope.user == null) {
            $location.path("/login");
            return;
        }
    }
})();
