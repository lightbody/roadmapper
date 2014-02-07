package util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Log {
    protected Logger logger;
    private String className;

    public Log() {
        Exception e = new Exception();
        className = e.getStackTrace()[1].getClassName();
        logger = LoggerFactory.getLogger(className);
    }

    public Log(Class clazz) {
        className = clazz.getName();
        logger = LoggerFactory.getLogger(className);
    }

    public void severe(String msg, Object... args) {
        logger.error(msg, args);
    }

    public void warn(String msg, Object... args) {
        logger.warn(msg, args);
    }

    public void info(String msg, Object... args) {
        logger.info(msg, args);
    }

    public void fine(String msg, Object... args) {
        logger.debug(msg, args);
    }
}
