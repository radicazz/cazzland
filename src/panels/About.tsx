import { LinkRow } from "./LinkRow";

/** Profile plus every outbound link, grouped. The phone's default window (the terminal is desktop-first). */
export function About() {
  return (
    <div className="desk-about">
      <div className="desk-profile">
        <img src="/portrait.webp" alt="" />
        <div>
          <h1>
            Hey, I’m Cazz<span>.</span>
          </h1>
          <p>I make videos about C++, reverse engineering, and how games work.</p>
        </div>
      </div>
      <section aria-labelledby="about-socials">
        <h2 id="about-socials">Socials</h2>
        <div className="desk-list">
          <LinkRow icon="youtube" href="https://www.youtube.com/@cazz">YouTube</LinkRow>
          <LinkRow icon="github" href="https://github.com/cazzwastaken">GitHub</LinkRow>
          <LinkRow icon="socials" href="https://twitter.com/cazzwastaken">X / Twitter</LinkRow>
        </div>
      </section>
      <section aria-labelledby="about-community">
        <h2 id="about-community">Community</h2>
        <div className="desk-list">
          <LinkRow icon="community" href="https://discord.gg/xyxbg5VpcG">Join the Discord</LinkRow>
        </div>
      </section>
      <section aria-labelledby="about-support">
        <h2 id="about-support">Support</h2>
        <div className="desk-list">
          <LinkRow icon="support" href="https://www.patreon.com/cazzwastaken">Support on Patreon</LinkRow>
        </div>
      </section>
    </div>
  );
}
