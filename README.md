# Roadmapper

A web application for tracking roadmap data.

# Setup

These instructions assume you have cloned the repo into a local directory named `roadmapper`.

## 1. Install Play

[Play 2.0.4](http://www.playframework.com/download) is used by Roadmapper.
See the [installation instructions](http://www.playframework.com/documentation/2.0.4/Installing).

## 2. Setup database

First, install Postgres if you don't have it. For OSX, check out [PostgresApp](http://postgresapp.com/documentation).

Next, create a user and database for the app.

    psql -h localhost
    CREATE USER roadmapper;
    CREATE DATABASE roadmapper;
    \q

## 3. Change New Relic license key

Edit `newrelic.yml` to set your New Relic license key.

## 4. Configure OAuth settings

Edit `conf/overrides.conf` and enter the root URL, client ID, and client secret. If you're a New Relic employee, you can get these values by asking another Roadmapper developer. If you're not a New Relic employee, you'll need to have your own OAuth 2 server up and running with a client set up using a redirect URL of `http://localhost:9000/auth/callback`.

Note: You can also optionally configure the OAuth values using environment variables: OAUTH_ROOT_URL, OAUTH_CLIENT_ID, and OAUTH_CLIENT_SECRET respectively.

## 5. Start Play

In the `roadmapper` directory,

    play run

Then navigate to http://localhost:9000/ in your browser to run the app's setup process.

## 6. Success

# Development

Play has a [great feature for setting up a project](http://www.playframework.com/documentation/2.0/IDE) for common Java IDEs. Once the setup steps are done, follow the directions for your IDE and you should have a nice environment for development.

While Play is running your changes to files (HTML, JavaScript, CSS, Java, and Scala) auto-refresh the server to speed your development flow.

