"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section role="alert">
      <h1 className="text-3xl font-bold">This page could not load</h1>
      <p className="my-4">Please try again.</p>
      <button className="rounded bg-teal-800 px-5 py-3 text-white" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
