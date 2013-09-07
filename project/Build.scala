import sbt._
import play.Project._


object ApplicationBuild extends Build {

    val appName         = "roadmapper"
    val appVersion      = "1.0-SNAPSHOT"

    val appDependencies = Seq(
      javaCore, javaJdbc, javaEbean, jdbc, filters,
        "postgresql" % "postgresql" % "9.1-901.jdbc4",
        "javax.mail" % "mail" % "1.4.7",
        "com.newrelic.agent.java" % "newrelic-agent" % "2.20.0"
    )

    val main = play.Project(appName, appVersion, appDependencies).settings(
      // Add your own project settings here      
    )

}
