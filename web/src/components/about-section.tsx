import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIVACY_POLICY_URL, SUPPORT } from "@/constants/contact";

// Home page About section; the mobile app has its own native version (Settings → About App)
export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-16 py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold">About WasteLess</h2>
        <p className="text-lg text-muted-foreground">
          WasteLess is a mobile-first platform that helps people give away items they no longer
          need to those who do. From food and clothes to books and tools, you can share them with
          someone nearby, quickly and safely.
        </p>
        <p className="text-lg text-muted-foreground">
          It was built as part of a 30-day Build In Public challenge by{" "}
          <a
            href="https://github.com/JosephatJuma"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            Josephat Juma
          </a>
          , and invites both developers and non-tech folks to contribute ideas, test features, and
          follow progress in real time.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <a href="https://github.com/biokeyper/Wasteless" target="_blank" rel="noreferrer">
              See the code on GitHub
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
          </Button>
        </div>

        <div id="contact" className="scroll-mt-16 pt-8 space-y-4">
          <h3 className="text-2xl font-semibold">Contact us</h3>
          <p className="text-muted-foreground">
            Questions, problems or feedback? Reach the WasteLess team:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <a href={SUPPORT.whatsapp.url} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp {SUPPORT.whatsapp.label}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={SUPPORT.phone.url}>
                <Phone className="h-4 w-4" />
                Call {SUPPORT.phone.label}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={SUPPORT.email.url}>
                <Mail className="h-4 w-4" />
                {SUPPORT.email.label}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
