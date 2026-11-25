import { LinkRow } from "./LinkRow";

export function Socials() {
  return (
    <div className="desk-list">
      <LinkRow icon="youtube" href="https://www.youtube.com/@cazz">YouTube</LinkRow>
      <LinkRow icon="github" href="https://github.com/cazzwastaken">GitHub</LinkRow>
      <LinkRow icon="socials" href="https://twitter.com/cazzwastaken">X / Twitter</LinkRow>
    </div>
  );
}

export function Community() {
  return (
    <div className="desk-list">
      <LinkRow icon="community" href="https://discord.gg/xyxbg5VpcG">Join the Discord</LinkRow>
    </div>
  );
}

export function Support() {
  return (
    <div className="desk-list">
      <LinkRow icon="support" href="https://www.patreon.com/cazzwastaken">Support on Patreon</LinkRow>
    </div>
  );
}
