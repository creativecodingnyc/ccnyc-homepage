import HomeEffects from "@/components/home/HomeEffects";
import HomeNav from "@/components/home/HomeNav";
import ProjectionStage from "@/components/home/ProjectionStage";
import { getUpcomingPublicMeetups } from "@/lib/public-meetups";
import "./home.css";

const signupEndpoint =
  process.env.NEXT_PUBLIC_PRESENTATION_SIGNUP_URL ??
  "https://script.google.com/macros/s/AKfycbw48NKiMlbn_IHBBqVvZOriL9FI23UfyVN4iCFJ2GKWUhVjdTMZ-5TgQLX5clptPW8/exec";

export default async function HomePage() {
  const meetups = await getUpcomingPublicMeetups();
  return (
    <main className="home-page">
      <button className="skip-intro" id="skipIntro" type="button">
        Skip
      </button>
      <ProjectionStage signupEndpoint={signupEndpoint} meetups={meetups} />
      <HomeNav />
      <p className="hint" id="hint" aria-hidden="true" hidden />
      <canvas id="beam" aria-hidden="true" />
      <button
        className="pier-pin"
        id="pierPin"
        type="button"
        aria-label="Pier 57 meetup location"
        aria-describedby="pierTip"
      >
        <span className="pier-tip" id="pierTip">
          We meet at Pier 57 unless otherwise posted.
        </span>
      </button>
      <h1 className="sub" id="sub">
        creative coding nyc
      </h1>
      <HomeEffects />
    </main>
  );
}
