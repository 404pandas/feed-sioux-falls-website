import React from 'react';
import PublicLayout from '../../components/PublicLayout';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { ContactCard } from '../../components/SupportForms';
import { ORG } from '../../config/org';
import { formatOutreachDate, usePublicSummary } from '../../components/PublicData';

export function PageTitle({ title, lede, mascot }) {
  return (
    <div className="page-title-band">
      <div className="container">
        <div>
          <h1 className="h1" style={{ fontSize: 'clamp(34px, 8vw, 52px)' }}>
            {title}
          </h1>
          {lede && <p className="lede">{lede}</p>}
        </div>
        {mascot && <img className="mascot" src={`/brand/${mascot}.png`} alt="" style={{ height: 120 }} />}
      </div>
    </div>
  );
}

export default function GetHelpPage() {
  const { summary } = usePublicSummary();

  return (
    <PublicLayout>
      <PageTitle
        title="Get help"
        lede="Food, hygiene supplies, and winter gear, free. No sign-up and no questions asked."
        mascot="shirt"
      />

      <section className="band" aria-labelledby="pantry-title">
        <div className="container grid-2">
          <article className="card info-card">
            <h2 id="pantry-title" className="h2">
              The 24/7 pantry
            </h2>
            <p className="big-line">{ORG.pantry.hours}</p>
            <p className="body-text">{ORG.pantry.address}</p>
            <ul className="body-text" style={{ paddingLeft: 22, margin: '4px 0' }}>
              <li>Take what you need from the shelves, fridge, and freezer.</li>
              <li>The fridge and freezer have a child lock because the city requires it. Anyone can open it.</li>
              <li>{ORG.pantry.host}.</li>
            </ul>
            <Button href={ORG.pantry.mapUrl} variant="primary" style={{ alignSelf: 'flex-start' }}>
              <Icon name="pin" /> Get directions
            </Button>
          </article>

          <article className="card info-card">
            <h2 className="h2">Saturday outreach</h2>
            <p className="big-line">{ORG.outreach.when}</p>
            <p className="body-text">{ORG.outreach.where}</p>
            <ul className="body-text" style={{ paddingLeft: 22, margin: '4px 0' }}>
              <li>Our {ORG.outreach.name} hands out food, hygiene kits, socks, gloves, and more.</li>
              {summary?.nextOutreach && <li>Next one: {formatOutreachDate(summary.nextOutreach.date)}.</li>}
              <li>Plans change in bad weather. Check our Facebook page for updates.</li>
            </ul>
            <div className="hero-actions">
              <Button href={ORG.outreach.mapUrl} variant="primary">
                <Icon name="pin" /> Get directions
              </Button>
              <Button href={ORG.links.facebook} variant="outline">
                Facebook updates <Icon name="external" />
              </Button>
            </div>
          </article>
        </div>
      </section>

      <section className="band band-white" aria-labelledby="ask-title">
        <div className="container grid-2" style={{ alignItems: 'start' }}>
          <div className="stack gap-md">
            <h2 id="ask-title" className="h1">
              Need something we don't have out?
            </h2>
            <p className="body-text">
              Send us a note. Only your message is required. Leave a phone number or email if you'd like an answer.
            </p>
            <p className="body-text">
              Or email us at <a href={`mailto:${ORG.email}`}>{ORG.email}</a>.
            </p>
            <div className="card" style={{ background: 'var(--coin-soft)' }}>
              <p className="h2" style={{ marginBottom: 6 }}>
                Other help, any time
              </p>
              <p className="body-text">
                Call or text <strong>211</strong> to reach the Helpline Center, which connects people across South Dakota
                to shelter, food, rent help, and more.
              </p>
            </div>
          </div>
          <ContactCard defaultCategory="assistance" title="Ask for help" />
        </div>
      </section>

      <section className="band" aria-labelledby="survey-title">
        <div className="container narrow stack gap-md">
          <h2 id="survey-title" className="h1">
            Tell the city what you need
          </h2>
          <p className="body-text">
            Our anonymous survey helps City Council see who needs help and which services aren't working. About 3
            minutes. Skip anything you want. <span lang="es">También en español.</span>
          </p>
          <div>
            <Button to="/survey" title="Take the survey" />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
