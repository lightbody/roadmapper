// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

var LINK_EXPRESSION = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

angular.module('roadmapper', ["ngCookies", "ui.bootstrap", "ui.select2"]).
    config(function ($routeProvider) {
        $routeProvider.
            when('/dashboard', {controller: DashboardCtrl, templateUrl: templateUrls.dashboard}).
            when('/problems', {controller: ProblemsCtrl, templateUrl: templateUrls.problems}).
            when('/problems/:problemId', {controller: ProblemsCtrl, templateUrl: templateUrls.problems}).
            when('/features', {controller: FeaturesCtrl, templateUrl: templateUrls.features}).
            when('/features/:featureId', {controller: FeaturesCtrl, templateUrl: templateUrls.features}).
            when('/teams', {controller: TeamsCtrl, templateUrl: templateUrls.teams}).
            when('/tags', {controller: TagsCtrl, templateUrl: templateUrls.tags}).
            otherwise({redirectTo: '/dashboard'});
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
                $scope.dashboard = function () {
                    $location.path("/dashboard");
                };

                $scope.problems = function () {
                    $location.path("/problems");
                };

                $scope.tags = function () {
                    $location.path("/tags");
                };

                $scope.features = function () {
                    $location.path("/features");
                };

                $scope.teams = function () {
                    $location.path("/teams");
                };

                $scope.logout = function () {
                    window.location.href = "/logout"
                };
            },
            templateUrl: "nav.html"
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
    .filter('minlinks', function() {
        return function(input) {
            return input.replace(LINK_EXPRESSION, "<link>");
        }
    })
    .filter('size', function() {
        return function(input) {
            if (input == null) {
                return "";
            }

            return input.substring(0, 1);
        }
    })
    .filter('shortQuarter', function() {
        return function(qtr) {
            if (qtr == null) {
                return null;
            }

            return qtr.substring(0, 2);
        }
    })
    .filter('longQuarter', function() {
        return function(qtr) {
            if (qtr == null) {
                return null;
            }

            return qtr.substring(3, 7) + ' ' + qtr.substring(0, 2);
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

        $rootScope.user = user;

        // segment.io
        analytics.identify(user.email, {
            name: user.name,
            email: user.email,
            firstLogin: user.firstLogin
        });

        // mixpanel stuff
        mixpanel.set_config({track_pageview: false});
        mixpanel.identify(user.email);
        mixpanel.register({
            "User Email": user.email,
            "User Name": user.name
        });
        mixpanel.people.set("$email", user.email);
        mixpanel.people.set("$username", user.email);
        mixpanel.people.set("$name", user.name);
        mixpanel.people.set("$created", new Date(user.firstLogin));
        mixpanel.people.increment("Sessions");
        mixpanel.name_tag(user.name);
    });

function FormErrorHandler($scope) {
    return function(data, status, headers) {
        $scope.errors = [data.globalError];
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

function DashboardCtrl($scope, $http) {
    $http.get('/dashboard-stats')
        .success(function (stats) {
            $scope.stats = stats;
        }).error(LogHandler($scope));
}