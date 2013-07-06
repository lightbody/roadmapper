package util;

import play.Configuration;
import play.Play;

import javax.mail.*;
import javax.mail.internet.*;
import java.util.Properties;

public class Mail {
    public static void send(String to, String subject, String body) throws MessagingException {
        Properties props = new Properties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.host", "smtp.sendgrid.net");
        props.put("mail.smtp.port", 587);
        props.put("mail.smtp.auth", "true");

        Authenticator auth = new SMTPAuthenticator();
        Session mailSession = Session.getDefaultInstance(props, auth);
        // uncomment for debugging infos to stdout
        // mailSession.setDebug(true);
        Transport transport = mailSession.getTransport();

        MimeMessage message = new MimeMessage(mailSession);

        Multipart multipart = new MimeMultipart("alternative");

        BodyPart part1 = new MimeBodyPart();
        part1.setText(body);
        multipart.addBodyPart(part1);

        message.setContent(multipart);
        message.setFrom(new InternetAddress("roadmapper@lightbody.net"));
        message.setSubject(subject);
        message.addRecipient(Message.RecipientType.TO, new InternetAddress(to));

        transport.connect();
        transport.sendMessage(message,
                message.getRecipients(Message.RecipientType.TO));
        transport.close();

    }

    private static class SMTPAuthenticator extends javax.mail.Authenticator {
        public PasswordAuthentication getPasswordAuthentication() {
            Configuration config = Play.application().configuration();
            String username = config.getString("mail.smtp.user");
            String password = config.getString("mail.smtp.pass");
            return new PasswordAuthentication(username, password);
        }
    }

}
