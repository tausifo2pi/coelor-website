// Section ids on /pricing, in page order. Unique across / and /pricing (the homepage uses hero, connect, pains, build,
// why, proof, process, pricing, team, faq, contact): the outreach panel maps section_view events by id. The one
// exception is `contact`: it is the shared Contact section (components/Contact.tsx sets the id), and the demos link to
// /pricing?plan=trial#contact. No JSON here, so the quote (a client component) can use it without the page's copy.
export const IDS = {
  top: "top",
  connection: "how",
  setups: "setups",
  trial: "trial",
  compare: "compare",
  process: "p-process",
  included: "included",
  after: "after",
  proof: "p-proof",
  faq: "p-faq",
  contact: "contact",
} as const;
