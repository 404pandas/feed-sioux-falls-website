import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/PublicLayout';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { ORG } from '../../config/org';
import { NeedsList, formatNumber, formatOutreachDate, usePublicSummary } from '../../components/PublicData';

export default function HomePage() {
  const { summary, loading } = usePublicSummary();

  return (
    <PublicLayout>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-inner">
          <div className="hero-copy stack gap-lg">
            <h1 id="hero-title" className="hero-title">
              Food is a human right.
            </h1>
            <p className="hero-lede">
              Feed Sioux Falls is a neighbor-run pantry that never closes, plus a Saturday street outreach team. Take what
              you need. Give what you can.
            </p>
            <div className="hero-actions">
              <Button to="/help" title="Get help today" />
              <Button to="/give" variant="accent">
                <Icon name="heart" /> Donate
              </Button>
            </div>
          </div>
          <div className="hero-art">
            <img
              src="/brand/hands.png"
              alt="Five raised hands holding a teddy bear, a jar of coins, a heart, a T-shirt, and a can of food"
              width="529"
              height="228"
            />
          </div>
        </div>
      </section>

      <section className="band band-white" aria-label="Our impact">
        <div className="container">
          {summary ? (
            <>
              <p className="impact">
                So far, neighbors helping neighbors have served <span className="mark">{formatNumber(summary.peopleServed.allTime)} people</span>{' '}
                and handed out <span className="mark">{formatNumber(summary.itemsGiven.allTime)} items</span> across{' '}
                <span className="mark">{formatNumber(summary.outreachEvents)} outreach days</span>.
              </p>
              <p className="impact-note">
                Counted live by our volunteers, one person at a time.
                {summary.peopleServed.thisYear > 0 && ` ${formatNumber(summary.peopleServed.thisYear)} this year`}
                {summary.peopleServed.thisMonth > 0 && `, ${formatNumber(summary.peopleServed.thisMonth)} this month`}
                {summary.peopleServed.thisYear > 0 && '.'}
              </p>
            </>
          ) : (
            <p className="impact">{loading ? ' ' : ORG.mission}</p>
          )}
        </div>
      </section>

      <section className="band" aria-labelledby="help-title">
        <div className="container">
          <div className="section-head">
            <img className="mascot" src="/brand/shirt.png" alt="" />
            <div>
              <h2 id="help-title" className="h1">
                Need something today?
              </h2>
              <p className="body-text">No sign-up, no questions, no paperwork.</p>
            </div>
          </div>
          <div className="grid-2">
            <article className="card info-card">
              <p className="pill pill-ok" style={{ alignSelf: 'flex-start' }}>
                <Icon name="clock" /> Open now
              </p>
              <h3 className="big-line">The pantry is open 24/7</h3>
              <p className="body-text">{ORG.pantry.address}</p>
              <p className="body-muted">
                Shelves, a fridge, and a freezer. {ORG.pantry.host}.
              </p>
              <Button href={ORG.pantry.mapUrl} variant="outline" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                <Icon name="pin" /> Directions
              </Button>
            </article>

            <article className="card info-card">
              <p className="pill pill-low" style={{ alignSelf: 'flex-start' }}>
                <Icon name="calendar" /> Every Saturday
              </p>
              <h3 className="big-line">Outreach, {ORG.outreach.when}</h3>
              <p className="body-text">{ORG.outreach.where}</p>
              <p className="body-muted">
                Our {ORG.outreach.name} brings food, hygiene supplies, and winter gear.
                {summary?.nextOutreach && ` Next one: ${formatOutreachDate(summary.nextOutreach.date)}.`}
              </p>
              <Button href={ORG.outreach.mapUrl} variant="outline" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                <Icon name="pin" /> Directions
              </Button>
            </article>
          </div>
          <p style={{ marginTop: 24 }}>
            <Link className="text-link" to="/help">
              More help, and how to reach us <Icon name="chevronRight" />
            </Link>
          </p>
        </div>
      </section>

      <section className="band band-coin" aria-labelledby="needs-title" id="needs">
        <div className="container">
          <div className="section-head">
            <img className="mascot" src="/brand/can.png" alt="" />
            <div>
              <h2 id="needs-title" className="h1">
                What we're short on
              </h2>
              <p className="body-text">Straight from our inventory, updated as volunteers hand things out.</p>
            </div>
          </div>
          {summary && summary.needs.length > 0 && <NeedsList items={summary.needs} limit={6} />}
          {summary && summary.needs.length === 0 && (
            <p className="empty-note">We're stocked up right now. Thank you! Money donations help keep it that way.</p>
          )}
          {!summary && !loading && (
            <p className="empty-note">We couldn't load the list just now. Hygiene items, socks, and winter gear are always welcome.</p>
          )}
          <div className="hero-actions" style={{ marginTop: 28 }}>
            <Button to="/give" title="See everything we need" variant="outline" />
            {ORG.links.amazonWishlist && (
              <Button href={ORG.links.amazonWishlist} variant="coin">
                Our Amazon wish list <Icon name="external" />
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="band band-white" aria-labelledby="survey-title">
        <div className="container">
          <div className="section-head">
            <img className="mascot" src="/brand/bear.png" alt="" />
            <div>
              <h2 id="survey-title" className="h1">
                Help the city count everyone
              </h2>
            </div>
          </div>
          <div className="narrow stack gap-md">
            <p className="body-text">
              Sioux Falls counts people without homes on just one day a year, and misses too many. Our anonymous survey
              gives City Council a truer picture of who needs what. It takes about 3 minutes, every question is optional,
              and no name is needed. <span lang="es">También en español.</span>
            </p>
            {summary?.surveysCollected > 0 && (
              <p className="body-muted">{formatNumber(summary.surveysCollected)} neighbors have filled it out so far.</p>
            )}
            <div className="hero-actions">
              <Button to="/survey" title="Take the survey" variant="primary" />
            </div>
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="give-title">
        <div className="container">
          <div className="section-head">
            <img className="mascot" src="/brand/jar.png" alt="" />
            <div>
              <h2 id="give-title" className="h1">
                Ways to help
              </h2>
            </div>
          </div>
          <div className="grid-3">
            <article className="card give-tile">
              <h3 className="h2">Give online</h3>
              <p className="body-text">Donate on Zeffy. It takes a minute, and it goes straight to supplies.</p>
              <Button href={ORG.links.zeffy} variant="accent">
                Donate on Zeffy <Icon name="external" />
              </Button>
            </article>
            <article className="card give-tile">
              <h3 className="h2">Give by text</h3>
              <p className="text-to-give">
                Text {ORG.textToGive.keyword}
                <br />
                to {ORG.textToGive.number}
              </p>
              <Button href={`sms:${ORG.textToGive.number}?&body=${ORG.textToGive.keyword}`} variant="outline">
                Open my texts
              </Button>
            </article>
            <article className="card give-tile">
              <h3 className="h2">Give your time</h3>
              <p className="body-text">Join the Saturday outreach crew. Meet up, hand out, make friends.</p>
              <Button href={ORG.links.meetup} variant="outline">
                Join on Meetup <Icon name="external" />
              </Button>
            </article>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
