import type { Metadata } from "next";
import content from "@/data/site-content.json";
import { LegalPage, Part } from "@/components/LegalPage";
import { openGraph } from "@/lib/seo";
import { TOKEN_COOKIE, VISITOR_COOKIE } from "@/lib/track";

// Privacy policy in plain language. Facts it states, and where they live in the code (change both together):
// form fields → components/ContactForm.tsx + app/api/contact/route.ts; analytics events, IP prefix, cookie names and
// lifetimes → lib/track.ts, app/r/[token]/route.ts, components/Tracker.tsx; email opens → app/o/[file]/route.ts.

const TITLE = "Privacy policy";
const DESCRIPTION =
  "What Coelor collects on coelor.com and in its emails, why, how long we keep it, who processes it, and your rights, including access and deletion.";

export const metadata: Metadata = {
  title: `${TITLE} · Coelor`,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: openGraph(`${TITLE} · Coelor`, DESCRIPTION, "/privacy"),
};

export default function PrivacyPage() {
  const { brand } = content;
  const mail = <a href={`mailto:${brand.email}`}>{brand.email}</a>;
  return (
    <LegalPage title={TITLE} intro="What we collect on coelor.com and in our emails, why we collect it, how long we keep it, and what you can ask us.">
      <Part id="p-who" n={1} title="Who we are">
        <p>
          {brand.name} is a small team of engineers in Dhaka, Bangladesh. We build custom ecommerce integrations. We decide
          how the data on this page is used: in GDPR terms, we are the controller.
        </p>
        <p>
          {brand.name} · {brand.address} · {mail}
        </p>
      </Part>

      <Part id="p-collect" n={2} title="What we collect">
        <ul>
          <li>
            <strong>The contact form:</strong> your name, your email address, your message, and your choice (free trial or
            price). Nothing is sent until you press Send.
          </li>
          <li>
            <strong>Visits to this site:</strong> our own analytics, no outside service. We record which page you open,
            which sections you see, how far you scroll, how long the page is open, and which links and buttons you click.
            With each event we store the first part of your IP address only (for example 203.0.113.0, never the full
            address), your browser&apos;s name and version (user agent) and its language. For most visitors this sets no cookie.
          </li>
          <li>
            <strong>Our emails:</strong> they contain a small image that tells us when an email is opened, and links that
            tell us when one is clicked. A click sets two cookies (see Cookies below).
          </li>
          <li>
            <strong>If we wrote to you first:</strong> we found your business email address on a public source, such as
            your shop&apos;s website. We keep it with public facts about your business (such as your website and the
            platforms you sell on) and the emails we sent you.
          </li>
        </ul>
        <p>We do not use outside analytics, ad trackers or social media plugins, and we do not sell your data.</p>
      </Part>

      <Part id="p-cookies" n={3} title="Cookies">
        <p>This site sets only two cookies, and only after you click a link in one of our emails:</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-rule-strong text-ink">
                <th scope="col" className="py-2 pr-4 font-semibold">Name</th>
                <th scope="col" className="py-2 pr-4 font-semibold">What it holds</th>
                <th scope="col" className="py-2 font-semibold">Kept for</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-rule">
                <td className="py-2 pr-4 font-mono text-ink">{VISITOR_COOKIE}</td>
                <td className="py-2 pr-4">A random visitor id, so your next visits count as the same visitor</td>
                <td className="py-2">12 months</td>
              </tr>
              <tr className="border-b border-rule">
                <td className="py-2 pr-4 font-mono text-ink">{TOKEN_COOKIE}</td>
                <td className="py-2 pr-4">The id of the email you clicked, so we know which email brought you here</td>
                <td className="py-2">6 months</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Both are first-party cookies: only coelor.com can read them. The site works the same without them, and you can delete them in your browser at any time.</p>
      </Part>

      <Part id="p-why" n={4} title="Why we use it">
        <ul>
          <li>To answer your message, set up your trial or send your price (steps before a contract; GDPR Art. 6(1)(b)).</li>
          <li>To see which pages and emails help people, improve them, and follow up on our emails (our legitimate interest; Art. 6(1)(f)).</li>
          <li>To keep the site and the contact form safe from abuse (our legitimate interest; Art. 6(1)(f)).</li>
        </ul>
      </Part>

      <Part id="p-keep" n={5} title="How long we keep it">
        <ul>
          <li>Contact form messages: while we talk with you, and up to 2 years after our last contact. If you become a client, as long as the law requires for business records.</li>
          <li>Analytics events: up to 2 years.</li>
          <li>Cookies: 12 months ({VISITOR_COOKIE}) and 6 months ({TOKEN_COOKIE}), or until you delete them.</li>
          <li>Spam protection: the contact form counts sends per network for 10 minutes and receipts per email address for 24 hours, in memory only.</li>
          <li>Outreach records: until you unsubscribe or ask us to delete them. After an unsubscribe we keep only your email address on a do-not-contact list, so we never write to you again.</li>
        </ul>
      </Part>

      <Part id="p-processors" n={6} title="Who handles it for us">
        <ul>
          <li><strong>Amazon Web Services:</strong> our own server in Frankfurt, Germany. It runs this site and stores the analytics events.</li>
          <li><strong>Spacemail:</strong> our mail host. It sends and stores our emails, including contact form messages.</li>
          <li><strong>MongoDB Atlas:</strong> the database for our outreach records.</li>
          <li><strong>Our team in Dhaka, Bangladesh:</strong> reads messages and records to answer you. Bangladesh is outside the EU. We use your data there only for the reasons above.</li>
        </ul>
        <p>We do not sell your data or share it for advertising.</p>
      </Part>

      <Part id="p-rights" n={7} title="Your rights">
        <p>You can ask us at any time to:</p>
        <ul>
          <li>show you the data we have about you (access);</li>
          <li>correct it;</li>
          <li>delete it;</li>
          <li>stop using it for analytics or emails (objection);</li>
          <li>limit how we use it (restriction);</li>
          <li>send you a copy in a common file format (portability).</li>
        </ul>
        <p>
          Email {mail}. We reply within one month, and we may ask you to confirm that the request comes from you. Every email
          from us has an unsubscribe link. If you think we handle your data wrongly, you can also complain to the data
          protection authority where you live.
        </p>
      </Part>

      <Part id="p-changes" n={8} title="Changes">
        <p>When we change this page, we change the date at the top.</p>
      </Part>
    </LegalPage>
  );
}
