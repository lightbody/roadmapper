(function () {
    angular.module('roadmapper', []).
        config(function ($routeProvider) {
            $routeProvider.
                when('/signup', {controller: SignupCtrl, templateUrl: 'templates/signup.html'}).
                when('/login', {controller: LoginCtrl, templateUrl: 'templates/login.html'}).
                when('/dashboard', {controller: DashboardCtrl, templateUrl: 'templates/dashboard.html'}).
                otherwise({redirectTo: '/login'});
        })
        .directive("navbar", function () {
            return {

                controller: function ($scope, $location, $rootScope) {
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
                });
        }
    }

    function LoginCtrl($location, $scope, $rootScope, $http) {
        $scope.unauthorized = $rootScope.user == null;

        $scope.$watch("user.email", function (value) {
            $scope.unauthorized = false;
        });

        $scope.submit = function (user) {
            $http.post('/authenticate', user)
                .success(function (data) {
                    $rootScope.user = data;
                    $location.path('/dashboard')
                })
                .error(function() {
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
