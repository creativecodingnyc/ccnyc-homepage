import HomeEffects from "@/components/home/HomeEffects";
import HomeNav from "@/components/home/HomeNav";
import ProjectionStage from "@/components/home/ProjectionStage";
import "./home.css";

const signupEndpoint = process.env.NEXT_PUBLIC_PRESENTATION_SIGNUP_URL
  ?? "https://script.google.com/macros/s/AKfycbzzj0lhnnpv0vyrOF6PscXtb7srX7MsGRbccV-nn2YsFcp3LmHoXWRrh9XcZECMYdx9/exec";

export default function HomePage() {
  return (
    <main className="home-page">
      <button className="skip-intro" id="skipIntro" type="button">Skip intro</button>
      <ProjectionStage signupEndpoint={signupEndpoint} />
      <HomeNav />
      <p className="hint" id="hint" aria-hidden="true" hidden />
      <canvas id="beam" aria-hidden="true" />
      <button className="pier-pin" id="pierPin" type="button" aria-label="Pier 57 meetup location" aria-describedby="pierTip"><span className="pier-tip" id="pierTip">We meet at Pier 57 unless otherwise posted.</span></button>
      <h1 className="sub" id="sub">creative coding nyc</h1>
      <HomeEffects />
    </main>
  );
}
