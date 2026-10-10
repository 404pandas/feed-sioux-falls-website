import React from 'react';
import PublicLayout from '../../components/PublicLayout';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { ContactCard } from '../../components/SupportForms';
import { ORG } from '../../config/org';
import { formatNumber, servedParts, usePublicSummary } from '../../components/PublicData';
import { PageTitle } from './GetHelpPage';

export default function AboutPage() {
  const { summary } = usePublicSummary();

  return (
    <PublicLayout>
      <PageTitle title="About us" lede={ORG.mission} mascot="heart" />

      <section className="band" aria-labelledby="what-title">
        <div className="container grid-2" style={{ alignItems: 'start' }}>
          <div className="stack gap-md">
            <h2 id="what-title" className="h1">
              What we do
            </h2>
            <p className="body-text">
              Feed Sioux Falls is a {ORG.legal}. We keep a pantry open around the clock at {ORG.pantry.address}, stocked
              with food, hygiene supplies, and freezer meals, so anyone can take what they need, any time.
            </p>
            <p className="body-text">
              Every Saturday our {ORG.outreach.name} heads to {ORG.outreach.where} with food, hygiene kits, clothing, and
              winter gear for neighbors living outside.
            </p>
            {summary && servedParts(summary).counted > 0 && (
              <p className="body-text">
                Volunteers count every person they serve, one at a time.{' '}
                {servedParts(summary).since ? `Since ${servedParts(summary).since}, that's` : "So far that's"}{' '}
                <span className="mark">{formatNumber(servedParts(summary).counted)} people</span>.
                {servedParts(summary).estimated > 0 &&
                  ` Before counting began, Feed Sioux Falls estimates about ${formatNumber(servedParts(summary).estimated)} more were served (an estimate, not a count).`}
              </p>
            )}
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--teal-soft)' }}>
            <img
              src="/brand/hands.png"
              alt="Five raised hands holding a teddy bear, a jar of coins, a heart, a T-shirt, and a can of food"
              style={{ display: 'block', width: '100%', height: 'auto', marginTop: 24 }}
            />
          </div>
        </div>
      </section>

      <section className="band band-white" aria-labelledby="team-title">
        <div className="container">
          <h2 id="team-title" className="h1" style={{ marginBottom: 24 }}>
            Who we are
          </h2>
          <div className="grid-3">
            {ORG.team.map((p) => (
              <article key={p.name} className="card person">
                <h3 className="h2">{p.name}</h3>
                <p className="person-role">{p.role}</p>
                <p className="body-text">{p.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="contact-title">
        <div className="container grid-2" style={{ alignItems: 'start' }}>
          <div className="stack gap-md">
            <h2 id="contact-title" className="h1">
              Get in touch
            </h2>
            <p className="body-text">
              Email <a href={`mailto:${ORG.email}`}>{ORG.email}</a>, or send a message here.
            </p>
            <div className="store-links">
              <a className="store-link" href={ORG.links.facebook} target="_blank" rel="noopener noreferrer">
                Facebook <Icon name="external" />
              </a>
              <a className="store-link" href={ORG.links.meetup} target="_blank" rel="noopener noreferrer">
                Meetup <Icon name="external" />
              </a>
              <a className="store-link" href={ORG.links.news} target="_blank" rel="noopener noreferrer">
                News <Icon name="external" />
              </a>
              <a className="store-link" href={ORG.links.website} target="_blank" rel="noopener noreferrer">
                feedsiouxfalls.com <Icon name="external" />
              </a>
            </div>
            <div>
              <Button to="/give" variant="accent">
                <Icon name="heart" /> Ways to give
              </Button>
            </div>
          </div>
          <ContactCard />
        </div>
      </section>
    </PublicLayout>
  );
}
