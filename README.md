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

## 4. Start Play

In the `roadmapper` directory,

    play run

Then navigate to http://localhost:9000/ in your browser to run the app's setup process.

## 4. Success

# Development

Play has a [great feature for setting up a project](http://www.playframework.com/documentation/2.0/IDE) for common Java IDEs. Once the setup steps are done, follow the directions for your IDE and you should have a nice environment for development.

While Play is running your changes to files (HTML, JavaScript, CSS, Java, and Scala) auto-refresh the server to speed your development flow.

