import Link from "next/link";
export default function NotFound() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="my-4">This page could not be found.</p>
      <Link className="text-teal-800 underline" href="/">
        Return to Priv Lab
      </Link>
    </section>
  );
}
