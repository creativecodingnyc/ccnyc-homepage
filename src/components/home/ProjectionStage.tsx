type ProjectionStageProps = {
  signupEndpoint: string;
};

export default function ProjectionStage({ signupEndpoint }: ProjectionStageProps) {
  return (
    <section id="board" aria-label="About Creative Coding NYC">
      <div className="board">
        <div className="col stage">
          <div className="blk screen" id="shot">
            <img alt="" id="shotA" />
            <img alt="" id="shotB" />

            <div
              className="panel intro"
              id="shotInfo"
              aria-hidden="true"
              aria-labelledby="aboutTitle"
              inert
              tabIndex={0}
            >
              <h2 className="sr-only" id="aboutTitle">About</h2>
              <p>
                Creative Coding NYC is a weekly community meetup for anyone
                interested in bringing their creative ideas to life using code.
                Everyone is welcome! People from all backgrounds come to our
                meetups, from non-technical artists to veteran programmers. Our
                top priority at CCNYC is to foster an inclusive, welcoming
                environment where members can support and learn from one another.
              </p>
              <p className="subtitle">Our gatherings are a space to:</p>
              <ul>
                <li>Work on individual projects or collaborate with others</li>
                <li>Get creative or technical feedback</li>
                <li>Have discussions on creative coding</li>
                <li>Share resources, other artists&apos; work, ideas, etc.</li>
                <li>Learn independently or with others</li>
                <li>Build relationships with others in the creative coding community :)</li>
              </ul>
            </div>

            <div className="panel agenda-box" id="shotAgenda" aria-hidden="true" aria-labelledby="agendaTitle" inert tabIndex={0}>
              <h2 className="title" id="agendaTitle">Tuesday meeting agenda · 6–8 PM</h2>
              <div className="schedule">
                <div><time>6:00–7:20</time><p><strong>Chill, code, collaborate</strong></p></div>
                <div><time>7:20–7:30</time><p><strong>Announcements</strong></p></div>
                <div><time>7:30–8:00</time><p><strong>Demos</strong></p></div>
              </div>
              <a className="qr-link" href="/?panel=demo-signup">
                <span>Scan to sign up for demos</span>
                <img
                  src="https://quickchart.io/qr?text=https%3A%2F%2Fccnyc.space%2F%3Fpanel%3Ddemo-signup&size=220&margin=2&dark=ffffff&light=00000000&v=4"
                  width="140"
                  height="140"
                  alt="QR code that opens the homepage Demo Signup component"
                />
              </a>
            </div>

            <div
              className="panel signup-box"
              id="shotSignup"
              aria-hidden="true"
              aria-labelledby="signupTitle"
              inert
              tabIndex={0}
              data-signup-endpoint={signupEndpoint}
            >
              <div className="head">
                <div>
                  <h2 className="title" id="signupTitle">Demo signup</h2>
                  <p className="status" id="projectorSignupStatus" role="status">Loading lineup…</p>
                </div>
              </div>
              <form className="form" id="signupForm">
                <input
                  name="name"
                  type="text"
                  maxLength={60}
                  autoComplete="name"
                  placeholder="Your name"
                  aria-label="Your name"
                  required
                />
                <input
                  name="instagram"
                  type="text"
                  maxLength={30}
                  autoComplete="off"
                  placeholder="Instagram (optional)"
                  aria-label="Instagram handle, optional"
                />
                <input
                  name="password"
                  type="password"
                  autoComplete="off"
                  placeholder="Demo password"
                  aria-label="Demo signup password"
                  required
                />
                <button type="submit">Sign up</button>
              </form>
              <ol className="lineup" id="projectorLineup" aria-label="Demo signup lineup" />
            </div>
          </div>
        </div>

        <div className="blk pier-block">
          <canvas id="pier" aria-label="Sketch of Pier 57 on the Hudson River" />
          <p className="caption">Pier 57 · Hudson River Park</p>
          <p className="address">40.743° N · 74.010° W · 25 11th Ave</p>
        </div>
      </div>
    </section>
  );
}
