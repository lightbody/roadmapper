// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

angular.module('roadmapper', ["ngCookies", "ui.bootstrap", "ui.select2"]).
    config(function ($routeProvider) {
        $routeProvider.
            when('/signup', {controller: SignupCtrl, templateUrl: 'templates/signup.html'}).
            when('/login', {controller: LoginCtrl, templateUrl: 'templates/login.html'}).
            when('/forgot-password/:sessionId', {controller: LoginCtrl, templateUrl: 'templates/login.html'}).
            when('/dashboard', {controller: DashboardCtrl, templateUrl: 'templates/dashboard.html'}).
            when('/profile', {controller: ProfileCtrl, templateUrl: 'templates/profile.html'}).
            when('/problems', {controller: ProblemsCtrl, templateUrl: 'templates/problems.html'}).
            when('/problems/:problemId', {controller: ProblemsCtrl, templateUrl: 'templates/problems.html'}).
            when('/features', {controller: FeaturesCtrl, templateUrl: 'templates/features.html'}).
            when('/features/:featureId', {controller: FeaturesCtrl, templateUrl: 'templates/features.html'}).
            when('/teams', {controller: TeamsCtrl, templateUrl: 'templates/teams.html'}).
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

                $scope.teams = function () {
                    $location.path("/teams");
                };

                $scope.profile = function () {
                    $location.path("/profile");
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
    .filter('noFractionCurrency',
        [ '$filter', '$locale',
            function (filter, locale) {
                var currencyFilter = filter('currency');
                var formats = locale.NUMBER_FORMATS;
                return function (amount, currencySymbol) {
                    var value = currencyFilter(amount, currencySymbol);
                    var sep = value.indexOf(formats.DECIMAL_SEP);
                    if (amount >= 0) {
                        return value.substring(0, sep);
                    }
                    return value.substring(0, sep) + ')';
                };
            } ])
    .filter('truncate', function() {
        return function(input, length) {
            if (input == null) {
                return "";
            }

            if (input.length + 4 < length) {
                return input;
            } else {
                return input.substring(0, length) + " ...";
            }
        }
    })
    .run(function ($rootScope, $http, $cookieStore, $location) {
        $rootScope.query = [{id: "state:OPEN", text: "<strong>State</strong>: OPEN"}];
        $rootScope.featureQuery = [{id: "state:OPEN", text: "<strong>State</strong>: OPEN"}];

        // wire up shared enums
        $rootScope.enumQuarters = enumQuarters;
        $rootScope.enumSizes = enumSizes;
        $rootScope.enumProblemStates = enumProblemStates;
        $rootScope.enumFeatureStates = enumFeatureStates;

        // set up i18n bundle
        $rootScope.i18n = i18n;

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
            if ($location.path() != "/login" && $location.path() != "/signup" && $location.path().indexOf("/forgot-password/") != 0) {
                $location.path("/login");
            }
        }
    });

function FormErrorHandler($scope) {
    return function(data, status, headers) {
        $scope.errors = [headers("X-Global-Error")];
    }
}

function ClearErrors($scope) {
    $scope.errors = null;
}

function LogHandler($scope) {
    return function(data, status, headers, config) {
        // todo: we could do more here
        console.log("Got back " + status + " while requesting " + config.url);
    }
}

function SignupCtrl($scope, $http, $location) {
    $scope.submit = function (user) {
        $http.post('/users', user)
            .success(function () {
                $location.path('/login')
            }).error(FormErrorHandler($scope));
    }
}

function LoginCtrl($location, $scope, $rootScope, $http, $cookieStore, $routeParams) {
    var loginSuccess = function (data) {
        $http.defaults.headers.common['X-Session-ID'] = data.id;
        $cookieStore.put("session.id", data.id);
        if ($scope.remember) {
            window.localStorage["session.id"] = data.id;
        }

        $rootScope.user = data.user;

        if ($routeParams.sessionId) {
            $location.path('/profile')
        } else {
            $location.path('/dashboard')
        }
    };

    // check if there is already a session?
    var sessionId = window.localStorage["session.id"];
    if (sessionId == null) {
        sessionId = $cookieStore.get("session.id");
    }
    if (sessionId == null) {
        sessionId = $routeParams.sessionId;
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
        ClearErrors($scope);
    });

    $scope.submit = function (user) {
        $http.post('/authenticate', user)
            .success(loginSuccess)
            .error(FormErrorHandler($scope));
    };

    $scope.forgotPassword = function(email) {
        $http.post('/forgot-password', {email: email})
            .success(function() {
                $scope.forgotPasswordEmailed = true;
            })
            .error(FormErrorHandler($scope));
    };
}

function ProfileCtrl($scope, $rootScope, $http) {
    $rootScope.user.password = null;

    $scope.update = function(user) {
        var copy = angular.copy(user);
        $rootScope.user.password = null;
        $scope.confirmPassword = null;

        $http.put("/profile", copy)
            .success(function() {
                $scope.profileUpdated = true;
                setTimeout(function() {
                    $scope.$apply(function () {
                        $scope.profileUpdated = false;
                    });
                }, 2000);
            }).error(FormErrorHandler($scope));
    }
}

function DashboardCtrl($scope, $rootScope, $location) {
    if ($rootScope.user == null) {
        $location.path("/login");
        return;
    }
}