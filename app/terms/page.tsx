import type { Metadata } from "next";
import content from "@/data/site-content.json";
import { LegalPage, Part } from "@/components/LegalPage";
import { OFFER, TRIAL, quote, usd } from "@/lib/offer";
import { openGraph } from "@/lib/seo";

// Terms in plain language. The prices come from lib/offer.ts; the rest are the user's decisions of 2026-10-11
// (docs/website/REBUILD_BRIEF_2026-10-11.md in lead-outreach): 90 days of fixes incl. platform API changes, the client's
// own cloud account, the trial as the first link (two platforms). Governing law is left to the order confirmation on
// purpose: no registration number, VAT id or court is invented here.

const TITLE = "Terms of service";
const DESCRIPTION =
  "Coelor's terms in plain words: what we build, the free 7-day trial, the one-time price per connection, code you own, 90 days of fixes and your own hosting.";

export const metadata: Metadata = {
  title: `${TITLE} · Coelor`,
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: openGraph(`${TITLE} · Coelor`, DESCRIPTION, "/terms"),
};

export default function TermsPage() {
  const { brand } = content;
  const mail = <a href={`mailto:${brand.email}`}>{brand.email}</a>;
  const each = usd(OFFER.perConnection);
  const examples = [2, 3, 4].map((n) => `${n} connections: ${usd(quote(n))}`).join(" · ");
  return (
    <LegalPage
      title={TITLE}
      intro={`These terms apply when ${brand.name} builds for your business. Before we start, we send you an order confirmation with your connections and your price. Where it says something different, the order confirmation applies.`}
    >
      <Part id="t-who" n={1} title="Who we are">
        <p>
          {brand.name} · {brand.address} · {mail}. &quot;We&quot; is {brand.name}; &quot;you&quot; is the business that
          orders the build.
        </p>
      </Part>

      <Part id="t-build" n={2} title="What we build">
        <p>
          We build custom ecommerce integrations: software that connects the platforms you sell and work on (your web
          store, marketplace accounts, warehouse system, supplier files, and tools such as Google Sheets or Slack) and
          works to your rules.
        </p>
        <p>
          A <strong>connection</strong> is one platform or account we build for. We agree in writing which connections and
          rules your build has before we start.
        </p>
      </Part>

      <Part id="t-trial" n={3} title={`The free ${TRIAL.days}-day trial`}>
        <p>
          Your first link runs free for {TRIAL.days} days: two of your platforms connected, for example your store and one
          marketplace. No card needed.
        </p>
        <ul>
          <li>Keep it: those connections are billed as normal.</li>
          <li>Don&apos;t keep it: we switch it off, and you pay nothing.</li>
        </ul>
        <p>The trial works on your real accounts and data. Check its work as you would with any new tool.</p>
      </Part>

      <Part id="t-price" n={4} title="Prices and payment">
        <ul>
          <li>
            {each} per connection, one-time. From {OFFER.freeAt} connections, one of them is free ({OFFER.freeAt} connections
            for the price of {OFFER.freeAt - 1}).
          </li>
          <li>For example: {examples}.</li>
          <li>Prices are in US dollars. Your exact price is in your order confirmation.</li>
          <li>You pay once, after it runs and before handover. We charge no monthly fee.</li>
        </ul>
      </Part>

      <Part id="t-hosting" n={5} title="Hosting">
        <p>
          Your build runs in your own cloud account. We set it up there. The host bills you directly, usually $5–20 a
          month. We charge nothing monthly.
        </p>
      </Part>

      <Part id="t-code" n={6} title="Your source code">
        <p>
          You own the source code we write for you, once you have paid for it. You can change it, move it, and have any
          developer work on it.
        </p>
        <p>
          We start from parts we have built and run before. Those parts stay ours, and you get a permanent, free license to
          use and change them as part of your build.
        </p>
      </Part>

      <Part id="t-fixes" n={7} title="After handover: 90 days of fixes">
        <p>
          For 90 days after handover we fix problems in your build for free. This includes changes a platform makes to its
          API. After 90 days, each fix has a fixed price that we agree with you before we start. Or any developer can do
          it: you have the code.
        </p>
      </Part>

      <Part id="t-access" n={8} title="Your accounts, API keys and access">
        <ul>
          <li>You create the API keys in your own accounts, limited to what the build needs. You can revoke them at any time.</li>
          <li>We do not ask for your passwords.</li>
          <li>We use your keys and data only to build and run your integration.</li>
          <li>You make sure you may connect these accounts under each platform&apos;s own terms.</li>
        </ul>
      </Part>

      <Part id="t-platforms" n={9} title="Other companies' platforms">
        <p>
          Your build works with platforms we do not control, such as marketplaces, web stores and warehouse systems. We
          cannot promise that they stay online, keep their API the same, or keep giving you API access. Platform names and
          logos belong to their owners. Naming a platform does not mean it endorses us.
        </p>
      </Part>

      <Part id="t-liability" n={10} title="Liability">
        <p>
          We build with care and test before handover. If something still goes wrong, our total liability is limited to
          what you paid us for that build. We are not liable for indirect losses, such as lost sales or profit, or for
          problems caused by a platform, your host, or changes someone else made. Nothing in these terms limits a
          liability that the law does not allow us to limit.
        </p>
      </Part>

      <Part id="t-law" n={11} title="Law and disputes">
        <p>The law that applies and the place for disputes: to be agreed in the order confirmation.</p>
      </Part>

      <Part id="t-changes" n={12} title="Changes and contact">
        <p>
          We may update these terms; the date at the top shows the last change. The version in your order confirmation
          applies to your build. Questions: {mail}.
        </p>
      </Part>
    </LegalPage>
  );
}
