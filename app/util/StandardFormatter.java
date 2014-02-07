package util;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;
import java.util.logging.*;

public class StandardFormatter extends Formatter {
    public static void wireUp() {
        Logger logger = Logger.getLogger("");
        Handler[] handlers = logger.getHandlers();
        for (Handler handler : handlers) {
            logger.removeHandler(handler);
        }

        ConsoleHandler handler = new ConsoleHandler();
        handler.setFormatter(new StandardFormatter());
        handler.setLevel(Level.FINE);
        logger.addHandler(handler);

        // tell commons-logging to use the JDK logging (otherwise it would default to log4j
        System.setProperty("org.apache.commons.logging.Log", "org.apache.commons.logging.impl.Jdk14Logger");
    }

    private static final int CLASS_LENGTH = 20;

    public String format(LogRecord record) {
        try {
            StringBuilder sb = new StringBuilder();

            String level = "UNKN";
            if (record.getLevel().equals(Level.WARNING)) {
                level = "WARN";
            } else if (record.getLevel().equals(Level.SEVERE)) {
                level = "SEVR";
            } else if (record.getLevel().equals(Level.INFO)) {
                level = "INFO";
            } else if (record.getLevel().equals(Level.FINE)) {
                level = "FINE";
            } else if (record.getLevel().equals(Level.FINEST)) {
                level = "FNST";
            } else if (record.getLevel().equals(Level.FINER)) {
                level = "FINR";
            } else if (record.getLevel().equals(Level.CONFIG)) {
                level = "CONF";
            } else if (record.getLevel().equals(Level.OFF)) {
                level = "OFF ";
            } else if (record.getLevel().equals(Level.ALL)) {
                level = "ALL ";
            }

            sb.append(level).append(" ");

            SimpleDateFormat sdf = new SimpleDateFormat("MM/dd HH:mm:ss");
            sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
            sb.append(sdf.format(new Date(record.getMillis()))).append(" ");


            String className = record.getLoggerName();
            int classNameLength = className.length();
            int before = sb.length();
            if (classNameLength > CLASS_LENGTH) {
                int index = -1;
                while (true) {
                    sb.append(className.charAt(index + 1));

                    int oldIndex = index;
                    index = className.indexOf(".", index + 1);

                    if (index == -1) {
                        String str = className.substring(oldIndex + 2);
                        int rem = CLASS_LENGTH - (sb.length() - before);

                        if (str.length() > rem) {
                            str = str.substring(0, rem - 1) + '~';
                        }

                        sb.append(str);

                        break;
                    } else {
                        sb.append('.');
                    }
                }
            } else {
                sb.append(className);
            }
            int after = sb.length();

            for (int i = (after - before); i <= CLASS_LENGTH - 1; i++) {
                sb.append(' ');
            }

            sb.append(" - ");
            if (record.getParameters() != null && record.getParameters().length > 0) {
                java.util.Formatter formatter = new java.util.Formatter(sb);
                formatter.format(record.getMessage(), record.getParameters());
                formatter.format("\n");
            } else {
                sb.append(record.getMessage()).append("\n");
            }

            if (record.getThrown() != null) {
                StringWriter sw = new StringWriter();
                record.getThrown().printStackTrace(new PrintWriter(sw));
                sb.append(sw.toString());
            }

            return sb.toString();
        } catch (Exception e) {
            System.err.println("*******************************************************");
            System.err.println("There was a problem formatting a log statement:");
            e.printStackTrace();
            System.err.println("We will return the raw message and print any stack now");
            System.err.println("*******************************************************");

            if (record.getThrown() != null) {
                System.err.println("Root stack trace:");
                record.getThrown().printStackTrace();
                System.err.println("*******************************************************");
            }

            return record.getMessage() + "\n";
        }
    }
}
