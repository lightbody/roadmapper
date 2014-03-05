package util;

import com.typesafe.plugin.MailerAPI;
import com.typesafe.plugin.MailerPlugin;
import models.User;
import play.Application;
import play.Play;
import play.libs.F;

import static play.libs.F.Promise.promise;

public class Mail {
    public static void send(final User from, final User to, final String subject, final String body) {
        // don't ever send email to yourself, that's just silly
        if (from.email.equals(to.email)) {
            return;
        }

        final Application app = Play.application();
        if (app.configuration().getBoolean("smtp.mock")) {
            System.out.println("=====================================================================");
            System.out.println("From: " + from.email);
            System.out.println("To: " + to.email);
            System.out.println("Subject: " + subject);
            System.out.println("");
            System.out.println(body);
            System.out.println("=====================================================================");
        } else {
            promise(new F.Function0<Void>() {
                @Override
                public Void apply() throws Throwable {
                    MailerAPI mail = app.plugin(MailerPlugin.class).email();
                    mail.setSubject(subject);
                    mail.addFrom(from.name + " <" + from.email + ">");
                    mail.addRecipient(to.name + " <" + to.email + ">");
                    mail.send(body);

                    return null;
                }
            });
        }
    }
}
