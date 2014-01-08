package controllers

import play.api.mvc.PathBindable
import play.api.Play
import collection.concurrent.TrieMap
import java.net.JarURLConnection
import Play.current
import java.io.File

object VersionedAssets {
  def at(file: VersionedAsset) = Assets.at(file.path, file.file)
}

case class VersionedAsset(file: String, path: String = "/public", versionParam: String = "v")

object VersionedAsset {

  private val lastModifieds = new TrieMap[String, Option[Long]]

  private def lastModifiedFor(resource: java.net.URL): Option[Long] = {
    lastModifieds.getOrElseUpdate(resource.toExternalForm, resource.getProtocol match {
      case "jar" => {
        resource.getPath.split('!').drop(1).headOption.flatMap { fileNameInJar =>
          Option(resource.openConnection)
            .collect { case c: JarURLConnection => c }
            .flatMap(c => Option(c.getJarFile.getJarEntry(fileNameInJar.drop(1))))
            .map(_.getTime)
            .filterNot(_ == 0)
        }
      }
      case _ => None
    })
  }

  implicit def pathBinder = new PathBindable[VersionedAsset] {
    def bind(key: String, value: String) = Right(VersionedAsset(value))

    def unbind(key: String, value: VersionedAsset) = {
      val resourceName = Option(value.path + "/" + value.file).map(name => if (name.startsWith("/")) name else ("/" + name)).get

      val modified = Play.resource(resourceName).flatMap { resource =>
        resource.getProtocol match {
          case file if file == "file" => Some(new File(resource.toURI).lastModified())
          case jar if jar == "jar" => lastModifiedFor(resource)
          case _ => None
        }
      }
      modified.map(value.file + "?" + value.versionParam + "=" + _).getOrElse(value.file)
//      value.file
    }
  }

  implicit def toVersionedAsset(path: String): VersionedAsset = VersionedAsset(path)
}
