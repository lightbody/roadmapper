// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

(function () {
    angular.module('roadmapper', ["ngCookies"]).
        config(function ($routeProvider) {
            $routeProvider.
                when('/signup', {controller: SignupCtrl, templateUrl: 'templates/signup.html'}).
                when('/login', {controller: LoginCtrl, templateUrl: 'templates/login.html'}).
                when('/dashboard', {controller: DashboardCtrl, templateUrl: 'templates/dashboard.html'}).
                when('/problems', {controller: ProblemsCtrl, templateUrl: 'templates/problems.html'}).
                when('/problems/new', {controller: NewProblemCtrl, templateUrl: 'templates/new-problem.html'}).
                when('/features', {controller: FeaturesCtrl, templateUrl: 'templates/features.html'}).
                when('/features/new', {controller: NewFeatureCtrl, templateUrl: 'templates/new-feature.html'}).
                when('/categories', {controller: CategoriesCtrl, templateUrl: 'templates/categories.html'}).
                when('/teams', {controller: TeamsCtrl, templateUrl: 'templates/teams.html'}).
                when('/teams/new', {controller: NewTeamCtrl, templateUrl: 'templates/new-team.html'}).
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

                    $scope.features = function () {
                        $location.path("/features");
                    };

                    $scope.categories = function () {
                        $location.path("/categories");
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
        })
        .run(function($rootScope, $http, $cookieStore, $location) {
            // wire up shared enums
            $rootScope.enumQuarters = enumQuarters;
            $rootScope.enumSizes = enumSizes;
            $rootScope.enumProblemStates = enumProblemStates;

            // check if there is already a session?
            var sessionId = window.localStorage["session.id"];
            if (sessionId == null) {
                sessionId = $cookieStore.get("session.id");
            }

            if (sessionId != null) {
                $http.get("/sessions/" + sessionId)
                    .success(function (data) {
                        $http.defaults.headers.common['X-Session-ID'] = data.id;
                        $cookieStore.put("session.id", data.id);

                        $rootScope.user = data.user;
                    })
                    .error(function () {
                        // remove the cookie, since it's dead
                        $cookieStore.remove("session.id");
                        window.localStorage.removeItem("session.id");
                        $location.path("/login");
                    });
            } else {
                if ($location.path() != "/login" && $location.path() != "/signup") {
                    $location.path("/login");
                }
            }
        });

    function CategoriesCtrl($scope, $http, $location) {
        $scope.newCategory = function (category) {
            $http.post('/categories', category)
                .success(function (returnedCategory) {
                    $scope.category = null;
                    $scope.categories.push(returnedCategory);
                })
                .error(function () {
                    debugger;
                });
        };

        $scope.deleteCategory = function(category) {
            $http.delete('/categories/' + category.id)
                .success(function () {
                    $scope.categories.remove($scope.categories.indexOf(category));
                })
                .error(function () {
                    debugger;
                });
        };

        $http.get('/categories')
            .success(function (categories) {
                $scope.categories = categories;
            });
    }

    function NewCategoryCtrl($scope, $http, $location) {
    }

    function TeamsCtrl($scope, $http, $location) {
        $scope.newTeam = function () {
            $location.path("/teams/new");
        };

        $http.get('/teams')
            .success(function (teams) {
                $scope.teams = teams;
            });
    }

    function NewTeamCtrl($scope, $http, $location) {
        $scope.submit = function (team) {
            $http.post('/teams', team)
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
            $location.path("/problems/new");
        };

        $http.get('/problems/open')
            .success(function (problems) {
                $scope.problems = problems;
            });
    }

    function NewProblemCtrl($scope, $http, $location) {
        $scope.submit = function (problem) {
            $http.post('/problems', problem)
                .success(function () {
                    $location.path('/problems')
                })
                .error(function () {
                    debugger;
                });
        }
    }

    function FeaturesCtrl($scope, $http, $location) {
        $scope.newFeature = function () {
            $location.path("/features/new");
        };

        $http.get('/features')
            .success(function (features) {
                $scope.features = features;
            });
    }

    function NewFeatureCtrl($scope, $http, $location) {
        $http.get("/teams")
            .success(function (teams) {
                $scope.teams = teams;
            });

        $scope.submit = function (feature) {
            debugger;
            $http.post('/features', feature)
                .success(function () {
                    $location.path('/features')
                })
                .error(function () {
                    debugger;
                });
        }
    }

    function SignupCtrl($scope, $http, $location) {
        $scope.submit = function (user) {
            $http.post('/users', user)
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
            $http.get("/sessions/" + sessionId).success(loginSuccess).error(function() {
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
