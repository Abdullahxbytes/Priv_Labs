import Image from "next/image";
import { AppSearch } from "@/components/app-search";
import { ContainerScrollCard } from "@/components/container-scroll-card";
import { MaterialIcon } from "@/components/material-icon";

const contributors = [
  {
    name: "Abdullah Mehmood",
    username: "Abdullahxbytes",
    image: "/contributors/abdullah-mehmood.png",
    url: "https://github.com/Abdullahxbytes",
  },
  {
    name: "Muzammil Malik",
    username: "Muzammil8k",
    image: "/contributors/muzammil-malik.png",
    url: "https://github.com/Muzammil8k",
  },
  {
    name: "Mubashir Nawaz",
    username: "Mubashir-Nawaz",
    image: "/contributors/mubashir-nawaz.png",
    url: "https://github.com/Mubashir-Nawaz",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="io-hero" aria-labelledby="page-heading">
        <div className="io-hero-copy">
          <h1 id="page-heading">
            Know before you <span>tap install.</span>
          </h1>
          <p>
            Search any Android app. Priv Lab reads the disclosures, compares the evidence, and shows
            what deserves your attention.
          </p>
        </div>
        <AppSearch />
      </section>

      <ContainerScrollCard>
        <section className="agenda-section" aria-labelledby="agenda-heading">
          <div className="agenda-mark" aria-hidden="true">
            <span />
            <span />
          </div>
          <p className="section-index">02 / Our agenda</p>
          <h2 id="agenda-heading">
            Know about the app you download <span>like they know about you.</span>
          </h2>
          <p>
            Priv Lab exists to make informed consent practical: visible sources, plain-language
            findings, and honest gaps when evidence is unavailable.
          </p>
          <a className="agenda-button" href="#app-search">
            Scan your next app <MaterialIcon name="north_east" size={20} />
          </a>
        </section>
      </ContainerScrollCard>

      <section className="credits-section" aria-labelledby="credits-heading">
        <div>
          <h2 id="credits-heading">The People Who made it possible.</h2>
        </div>
        <div className="contributor-panel">
          <div className="contributor-avatars" aria-label="Project contributors">
            {contributors.map((person, index) => (
              <div
                className="contributor-person"
                key={person.username}
                style={{ zIndex: contributors.length - index }}
              >
                <button
                  type="button"
                  aria-label={`Show ${person.name}'s GitHub profile`}
                  aria-describedby={`contributor-${person.username}`}
                >
                  <Image src={person.image} alt="" width={88} height={88} loading="eager" />
                </button>
                <div id={`contributor-${person.username}`} className="contributor-popover">
                  <strong>{person.name}</strong>
                  <a href={person.url} target="_blank" rel="noreferrer">
                    @{person.username}
                    <MaterialIcon name="north_east" size={16} />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
