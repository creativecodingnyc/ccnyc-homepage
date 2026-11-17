import Link from "next/link";
import "./not-found.css";

const slices = Array.from({ length: 7 }, (_, index) => index);

export default function NotFound() {
  return (
    <main className="notFoundPage">
      <Link className="notFoundBrand" href="/">
        CCNYC
      </Link>
      <section className="notFoundMessage" aria-labelledby="not-found-title">
        <p className="notFoundCode">404</p>
        <h1 id="not-found-title" className="notFoundTitle">
          <span className="notFoundAccessible">Page not found</span>
          <span className="notFoundSplit" aria-hidden="true">
            {slices.map((slice) => (
              <span
                key={slice}
                style={{ "--slice": slice } as React.CSSProperties}
              >
                Page not found
              </span>
            ))}
          </span>
        </h1>
        <p className="notFoundCopy">This page slipped out of alignment.</p>
        <Link className="notFoundReturn" href="/">
          Return home →
        </Link>
      </section>
      <p className="notFoundFooter">creative coding nyc</p>
    </main>
  );
}
