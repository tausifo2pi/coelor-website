import type { Metadata } from "next";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Unsubscribe · Coelor",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const { done } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center gap-8 px-5 py-16">
      <a href="/" aria-label="Coelor home">
        <Logo height={26} />
      </a>
      <div className="panel flex flex-col gap-4 p-6 md:p-7">
        {done ? (
          <>
            <h1 className="text-[22px] font-semibold text-ink">You&apos;re unsubscribed.</h1>
            <p className="text-[15px] text-ink-muted">
              We won&apos;t email you again. Sorry for the interruption.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[22px] font-semibold text-ink">Stop emails from Coelor?</h1>
            <p className="text-[15px] text-ink-muted">
              Confirm below and we&apos;ll remove your address from our outreach list.
            </p>
            <form method="post" action={`/api/u/${encodeURIComponent(token)}`}>
              <button type="submit" className="btn-primary">
                Unsubscribe
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
