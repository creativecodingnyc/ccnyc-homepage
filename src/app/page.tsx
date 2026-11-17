import HomeEffects from "@/components/home/HomeEffects";
import HomeNav from "@/components/home/HomeNav";
import ProjectionStage from "@/components/home/ProjectionStage";
import { PRESENTATION_SIGNUP_URL } from "@/lib/endpoints";
import { getUpcomingPublicMeetups } from "@/lib/public-meetups";
import "./home.css";

export default async function HomePage() {
  const meetups = await getUpcomingPublicMeetups();
  return (
    <main className="home-page">
      <button className="skip-intro" id="skipIntro" type="button">
        Skip
      </button>
      <ProjectionStage
        signupEndpoint={PRESENTATION_SIGNUP_URL}
        meetups={meetups}
      />
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
