(function () {
    angular.module('roadmapper', ["ngCookies"]).
        config(function ($routeProvider) {
            $routeProvider.
                when('/signup', {controller: SignupCtrl, templateUrl: 'templates/signup.html'}).
                when('/login', {controller: LoginCtrl, templateUrl: 'templates/login.html'}).
                when('/dashboard', {controller: DashboardCtrl, templateUrl: 'templates/dashboard.html'}).
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

    function SignupCtrl($scope, $http, $location) {
        $scope.submit = function (user) {
            $http.post('/user', user)
                .success(function () {
                    $location.path('/login')
                })
                .error(function() {
                    debugger;
                });
        }
    }

    function LoginCtrl($location, $scope, $rootScope, $http, $cookieStore) {
        var loginSuccess = function (data) {
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
