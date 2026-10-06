import React from 'react';
import PublicLayout from '../../components/PublicLayout';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { ContactCard, DonateCard } from '../../components/SupportForms';
import { ORG } from '../../config/org';
import { NeedsList, StatusPill, StoreLinks, usePublicSummary } from '../../components/PublicData';
import { PageTitle } from './GetHelpPage';

export default function GivePage() {
  const { summary, loading } = usePublicSummary();
  const needIds = new Set((summary?.needs || []).map((n) => String(n._id)));
  const fastMovers = (summary?.mostNeeded || []).filter((m) => !needIds.has(String(m._id)));

  return (
    <PublicLayout>
      <PageTitle
        title="Give"
        lede="Money buys supplies in bulk. Items fill the shelves. Time keeps Saturday outreach going. All of it helps."
        mascot="jar"
      />

      <section className="band" aria-labelledby="money-title">
        <div className="container">
          <h2 id="money-title" className="h1" style={{ marginBottom: 24 }}>
            Give money
          </h2>
          <div className="grid-3">
            <article className="card give-tile">
              <h3 className="h2">Zeffy</h3>
              <p className="body-text">Our main donation page. Quick and secure.</p>
              <Button href={ORG.links.zeffy} variant="accent">
                Donate on Zeffy <Icon name="external" />
              </Button>
            </article>
            <article className="card give-tile">
              <h3 className="h2">Text to give</h3>
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
              <h3 className="h2">Pledge</h3>
              <p className="body-text">Another easy way to give online.</p>
              <Button href={ORG.links.pledge} variant="outline">
                Give on Pledge <Icon name="external" />
              </Button>
            </article>
          </div>
          <div className="grid-2" style={{ marginTop: 24, alignItems: 'start' }}>
            <div className="stack gap-sm">
              <p className="h2">Or give by card right here</p>
              <p className="body-text">
                $2,800 restocks hygiene and winter supplies for a whole month. Any amount helps.
              </p>
            </div>
            <DonateCard />
          </div>
        </div>
      </section>

      <section className="band band-coin" aria-labelledby="items-title" id="needs">
        <div className="container">
          <div className="section-head">
            <img className="mascot" src="/brand/can.png" alt="" />
            <div>
              <h2 id="items-title" className="h1">
                Give items
              </h2>
              <p className="body-text">
                Drop off any time at {ORG.pantry.address}. Individually wrapped and travel-size items are easiest to hand
                out.
              </p>
            </div>
          </div>

          {ORG.links.amazonWishlist && (
            <div style={{ marginBottom: 24 }}>
              <Button href={ORG.links.amazonWishlist} variant="coin">
                Shop our Amazon wish list <Icon name="external" />
              </Button>
            </div>
          )}

          <h3 className="h2" style={{ marginBottom: 12 }}>
            Short on right now
          </h3>
          {summary && summary.needs.length > 0 && <NeedsList items={summary.needs} />}
          {summary && summary.needs.length === 0 && <p className="empty-note">Nothing is running low right now. Thank you!</p>}
          {!summary && !loading && <p className="empty-note">We couldn't load the list just now. Please try again later.</p>}

          {fastMovers.length > 0 && (
            <>
              <h3 className="h2" style={{ margin: '36px 0 12px' }}>
                What goes out fastest
              </h3>
              <p className="body-text" style={{ marginBottom: 16 }}>
                These are stocked today, but they're what people ask for most.
              </p>
              <ul className="need-list two-col">
                {fastMovers.map((item) => (
                  <li key={item._id} className="need">
                    <div className="need-top">
                      <span className="need-name">{item.name}</span>
                      <StatusPill status={item.status} />
                    </div>
                    <StoreLinks sources={item.sources} itemName={item.name} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="band band-white" aria-labelledby="time-title">
        <div className="container grid-2" style={{ alignItems: 'start' }}>
          <div className="stack gap-md">
            <h2 id="time-title" className="h1">
              Give time, or team up
            </h2>
            <p className="body-text">
              Join the {ORG.outreach.name} on Saturdays at {ORG.outreach.where}. Sign up through our Meetup group to
              hear about each outreach.
            </p>
            <div>
              <Button href={ORG.links.meetup} variant="primary">
                Join on Meetup <Icon name="external" />
              </Button>
            </div>
            <p className="body-text">
              Businesses, churches, and groups: host a drive or fundraiser, or partner with us. Send a note and we'll
              get back to you.
            </p>
          </div>
          <ContactCard defaultCategory="partner" title="Partner with us" />
        </div>
      </section>
    </PublicLayout>
  );
}
