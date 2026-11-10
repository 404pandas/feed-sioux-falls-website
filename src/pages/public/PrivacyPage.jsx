import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/PublicLayout';
import { ORG } from '../../config/org';
import { PageTitle } from './GetHelpPage';

// The privacy policy for the Feed Sioux Falls app (Android) and this
// website. It's also the policy linked from the Google Play listing, so keep
// it in step with what the app and backend actually do - every statement
// here was checked against the code (feed-sioux-falls/backend/src/models,
// routes, and the mobile app) on the date below. Update the date with any
// change.
const UPDATED = 'November 10, 2026';

function Section({ id, title, children }) {
  return (
    <section className="policy-section" aria-labelledby={id}>
      <h2 id={id} className="h2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  const email = <a href={`mailto:${ORG.email}`}>{ORG.email}</a>;

  return (
    <PublicLayout>
      <PageTitle title="Privacy policy" lede={`How ${ORG.name} handles what you share with us. Last updated ${UPDATED}.`} mascot="heart" />

      <div className="band">
        <div className="container narrow policy">
          <div className="card policy-summary">
            <h2 className="h2">The short version</h2>
            <ul>
              <li>You never need an account, a name, or an ID to get help, use the pantry, or take our survey.</li>
              <li>The community survey is anonymous. Every question is optional. We don't save your name, location, or internet address with your answers.</li>
              <li>
                We share <strong>rough numbers only</strong> (like "40 people said they have no photo ID") with Sioux Falls City
                Council and our partners. Never names, contact details, or anyone's own answers.
              </li>
              <li>We don't sell your information, show ads, or use tracking or analytics tools.</li>
              <li>Questions or want something deleted? Email {email}.</li>
            </ul>
          </div>

          <Section id="who" title="Who we are">
            <p className="body-text">
              {ORG.name} is a {ORG.legal} in Sioux Falls, South Dakota. We run a 24/7 pantry at {ORG.pantry.address} and a
              Saturday street outreach. This policy covers the {ORG.name} app for Android and this website, and the
              volunteer and admin tools inside them.
            </p>
          </Section>

          <Section id="collect" title="What we collect, and when">
            <h3 className="h3">If you just look around</h3>
            <p className="body-text">
              Reading the website or app doesn't send us anything about you. Your phone or browser remembers your survey
              language, and your survey progress for up to 12 hours (in case you lose signal), on your own device. That
              progress is erased when you send the survey or tap Quick Exit.
            </p>

            <h3 className="h3">The community survey</h3>
            <p className="body-text">
              The survey helps City Council see who needs help and which services aren't working. Every question is
              optional, and no name is needed. We save:
            </p>
            <ul>
              <li>
                Your answers. Some questions are personal: where you slept, how long you've been without housing, what led
                to it, your age range, gender, race, who is with you, income and work, health, mental health, disability,
                substance use, pregnancy, military service, being a domestic violence survivor, time in jail or foster
                care, and which services you use or can't reach. You can skip any of them, or choose "Prefer not to say".
              </li>
              <li>Anything you write in the two open questions.</li>
              <li>The language you used, and whether you filled it out on your own, with a volunteer, or on paper.</li>
              <li>The day it was sent (not the time).</li>
            </ul>
            <p className="body-text">
              We do <strong>not</strong> save your name, your location, your internet (IP) address, or anything about your
              phone with your answers.
            </p>
            <p className="body-text">
              <strong>If you ask us to contact you</strong>, the name, phone number, email, best time to reach you, and
              whether it's safe to leave a message are kept <strong>separately</strong> from your answers, so your answers
              can't be matched to you. We use them only to reach you.
            </p>
            <p className="body-text">
              If you have no signal when you send it, the app keeps the finished survey (and any contact details) on that
              phone until it can send it, then removes it from the phone.
            </p>

            <h3 className="h3">Messages and "I need help" requests</h3>
            <p className="body-text">
              When you send us a note, we keep your message, what it's about, and the name, phone number, or email you
              choose to give. All of those except the message are optional.
            </p>

            <h3 className="h3">Donations</h3>
            <p className="body-text">
              If you give by card in our app or on this website, the card is handled by our payment processor, Stripe. Your
              card number goes straight to Stripe and never reaches us. We keep the amount, the date, whether it went
              through, and the name and email you choose to give. Stripe also gets that name and email, and may collect
              information about your device to prevent fraud (see{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                Stripe's privacy policy
              </a>
              ). Giving through Zeffy, Pledge, or text-to-give happens on their services, under their own privacy policies.
            </p>

            <h3 className="h3">Notifications (app)</h3>
            <p className="body-text">
              Notifications are off until you turn them on. If you do, we keep a notification address for your phone
              (provided by Expo and Google's Firebase Cloud Messaging, which deliver them), which kinds you turned on, and
              whether you chose to hide what notifications say. If you're logged in as a volunteer or admin, it's linked to
              your login so staff messages reach you. The Saturday reminder is set on your phone and doesn't involve us.
              Turning notifications off deletes your phone's address from our records.
            </p>

            <h3 className="h3">Volunteers and admins</h3>
            <p className="body-text">
              Staff logins are set up by our admins. For each person we keep their name, role, and PIN (stored scrambled, so
              no one can read it) and whether they can log in. We also keep what staff record while working: people-served
              counts (just numbers, never who was served), inventory changes, outreach events and notes, receipts and their
              photos, team chat and messages between staff, notices sent, and a change log of who changed what. Receipt
              photos are taken or chosen only when a staff member adds a receipt. The app reads the text on the photo on the
              phone itself (using Google's ML Kit); the photo isn't sent anywhere to be read. Saved receipts and their photos
              may be shared with our bookkeeper for our accounts.
            </p>
          </Section>

          <Section id="dont" title="What we don't do">
            <ul>
              <li>We don't sell, rent, or trade your information.</li>
              <li>We don't show ads, and we don't use advertising, analytics, or tracking tools.</li>
              <li>The app doesn't use your location, contacts, or microphone.</li>
              <li>We don't ask for ID, proof of need, or your name to get help.</li>
            </ul>
          </Section>

          <Section id="use" title="How we use it">
            <ul>
              <li>To run the pantry and outreach: knowing what's running low, what to buy, and how many people we serve.</li>
              <li>To answer you when you write to us or ask to be contacted.</li>
              <li>To process donations and keep our financial records.</li>
              <li>To send the notifications you choose.</li>
              <li>To report to City Council, funders, and partners, using totals only (see below).</li>
            </ul>
          </Section>

          <Section id="share" title="What we share, and with whom">
            <h3 className="h3">City Council and our partners: rough numbers only</h3>
            <p className="body-text">
              We share totals and percentages from the survey and our counts, like "62% of people who answered slept
              outside" or "we served 2,000 people this year", with Sioux Falls City Council, funders, and partner
              organizations, in reports and on this website. We never share names, contact details, or anyone's own set of
              answers. We don't share numbers so small that they could point to one person. We read written answers before
              sharing any of them, and remove anything that could identify someone.
            </p>
            <h3 className="h3">Who can see what inside {ORG.name}</h3>
            <p className="body-text">
              Only {ORG.name} admins can see individual survey answers, contact requests, and messages sent to us.
              Volunteers can help someone fill out a survey, but can't look up answers afterward.
            </p>
            <h3 className="h3">Companies that help us run the app and website</h3>
            <p className="body-text">
              These companies store or carry information for us, and are allowed to use it only to provide their service:
            </p>
            <ul>
              <li>Render (hosts our website and server).</li>
              <li>MongoDB Atlas (stores our database).</li>
              <li>Stripe (card donations).</li>
              <li>Expo and Google Firebase Cloud Messaging (deliver notifications and app updates).</li>
              <li>Google ML Kit (reads receipt text on the phone; Google may receive basic usage information about it, not the photo).</li>
            </ul>
            <p className="body-text">
              Like most websites, our hosting company may briefly keep technical logs (such as internet addresses) to keep
              the service running and secure. We don't save internet addresses in our database.
            </p>
            <h3 className="h3">If the law requires it</h3>
            <p className="body-text">
              We would share information only if we're legally required to. Because the survey doesn't record names, we
              can't connect survey answers to a person.
            </p>
            <h3 className="h3">Links to other sites</h3>
            <p className="body-text">
              Our app and website link to other services, such as Google Maps, Facebook, Meetup, Zeffy, Pledge, Amazon, and
              store websites. Their own privacy policies apply when you use them. The survey's Quick Exit button opens a
              weather website.
            </p>
          </Section>

          <Section id="keep" title="How long we keep it">
            <ul>
              <li>Survey answers: kept as long as they're useful for showing needs over time. They don't identify anyone.</li>
              <li>Contact requests and messages: kept until we've followed up, then deleted when no longer needed.</li>
              <li>Donation records: kept as long as the law requires for our financial records.</li>
              <li>Staff accounts and work records: kept while the person volunteers with us; admins can remove access at any time.</li>
              <li>Survey progress on your own device: up to 12 hours, or until you send it or tap Quick Exit.</li>
            </ul>
            <p className="body-text">You can ask us to delete your information sooner (see "Your choices").</p>
          </Section>

          <Section id="safe" title="Keeping it safe">
            <ul>
              <li>Everything travels over encrypted connections (HTTPS).</li>
              <li>PINs are stored scrambled, staff logins end after 30 days, and changing a PIN logs that person out everywhere.</li>
              <li>Sensitive information can only be seen by logged-in admins.</li>
              <li>Quick Exit in the survey erases your answers and leaves right away.</li>
              <li>
                In the app, "Hide what notifications say" makes every notification read only "You have a new update" and keeps
                them off the lock screen. Android always shows which app a notification came from.
              </li>
            </ul>
            <p className="body-text">No system is perfectly secure, but we work to protect what you share.</p>
          </Section>

          <Section id="choices" title="Your choices">
            <ul>
              <li>Skip any survey question, or the whole survey. Help is never tied to it.</li>
              <li>Turn notifications off, or turn off any kind of notification, in the app's Notifications screen at any time.</li>
              <li>
                Ask us to see, correct, or delete information you gave us, such as a contact request, message, or donation
                record, by emailing {email}. Because survey answers aren't stored with names, we can't find one person's
                survey, but we can delete a contact request.
              </li>
              <li>Volunteers and admins can ask an admin, or email us, to change or remove their login and information.</li>
            </ul>
          </Section>

          <Section id="children" title="Children">
            <p className="body-text">
              Our app and website are for a general audience and aren't meant for children under 13. The survey is
              anonymous and lets people say they're under 18 without giving a name. If a child under 13 sent us contact
              details, email us and we'll delete them.
            </p>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p className="body-text">
              If we change how we handle information, we'll update this page and the date at the top. Big changes will also
              be noted in the app.
            </p>
          </Section>

          <Section id="contact" title="Questions">
            <p className="body-text">
              Email {email}, or send a note from our <Link to="/help">Get help</Link> page. You can write to us in English or
              Spanish.
            </p>
          </Section>
        </div>
      </div>
    </PublicLayout>
  );
}
