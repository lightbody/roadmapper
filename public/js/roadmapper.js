// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

window.onerror = function(msg) {
    console.log("?");
    console.log("!" + msg);
};

(function () {
    angular.module('roadmapper', ["ngCookies", "ui.bootstrap", "ui.select2"]).
        config(function ($routeProvider) {
            $routeProvider.
                when('/signup', {controller: SignupCtrl, templateUrl: 'templates/signup.html'}).
                when('/login', {controller: LoginCtrl, templateUrl: 'templates/login.html'}).
                when('/dashboard', {controller: DashboardCtrl, templateUrl: 'templates/dashboard.html'}).
                when('/problems', {controller: ProblemsCtrl, templateUrl: 'templates/problems.html'}).
                when('/features', {controller: FeaturesCtrl, templateUrl: 'templates/features.html'}).
                when('/features/new', {controller: NewFeatureCtrl, templateUrl: 'templates/new-feature.html'}).
                when('/categories', {controller: CategoriesCtrl, templateUrl: 'templates/categories.html'}).
                when('/teams', {controller: TeamsCtrl, templateUrl: 'templates/teams.html'}).
                when('/teams/new', {controller: NewTeamCtrl, templateUrl: 'templates/new-team.html'}).
                otherwise({redirectTo: '/login'});
        })
        .directive('integer', function() {
            return {
                require: 'ngModel',
                link: function(scope, elm, attrs, ctrl) {
                    ctrl.$parsers.unshift(function(viewValue) {
                        if (/^\-?\d*$/.test(viewValue)) {
                            // it is valid
                            ctrl.$setValidity('integer', true);
                            return viewValue;
                        } else {
                            // it is invalid, return undefined (no model update)
                            ctrl.$setValidity('integer', false);
                            return undefined;
                        }
                    });
                }
            };
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
        .filter('truncate', function() {
            return function(input, length) {
                if (input.length + 4 < length) {
                    return input;
                } else {
                    return input.substring(0, length) + " ...";
                }
            }
        })
        .run(function ($rootScope, $http, $cookieStore, $location) {
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
                $http.defaults.headers.common['X-Session-ID'] = sessionId;
                $cookieStore.put("session.id", sessionId);
                $http.get("/sessions/" + sessionId)
                    .success(function (data) {
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

        $scope.confirmSelection = function (category) {
            $scope.selectedCategory = category;
        };

        $scope.deleteCategory = function (category, replacementCategory) {
            var params = {};
            if (replacementCategory != null) {
                params.replacementCategory = replacementCategory;
            }

            $http.delete('/categories/' + category.id, {
                params: params
            }).success(function () {
                    $scope.replacementCategory = null;
                    $scope.categories.remove($scope.categories.indexOf(category));
                }).error(function () {
                    debugger;
                });
        };

        $http.get('/categories')
            .success(function (categories) {
                $scope.categories = categories;
            });
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
                window.localStorage["session.id"] = data.id;
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
            $http.get("/sessions/" + sessionId).success(loginSuccess).error(function () {
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
