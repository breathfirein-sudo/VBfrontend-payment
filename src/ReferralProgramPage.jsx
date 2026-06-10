import React, { useState } from 'react';
import { Gift, Sparkles, Award, ShieldCheck, ChevronDown, ChevronUp, UserPlus, ArrowRight } from 'lucide-react';
import './ReferralProgramPage.css';

export default function ReferralProgramPage({ rates, onRequireAuth, isLoggedIn, onGoToDashboard }) {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How does the referral bonus program work?",
      answer: "It's simple! Share your unique referral link with your friends. Once they register a vault account and complete their KYC check, you will instantly get a Gold bonus credited to your vault. If you successfully refer 1,500 people, you also qualify for the milestone reward of a 1 Gram Physical Gold Coin!"
    },
    {
      question: "Is there a limit on how many friends I can refer?",
      answer: "No, there is absolutely no limit! You can invite as many friends as you want. The more friends who join and complete their verification, the more gold you will accumulate in your secure vault."
    },
    {
      question: "How do I claim my 1 Gram Physical Gold coin?",
      answer: "Once your dashboard shows 1,500 successful completed referrals, a 'Claim Gold Coin' option will unlock on your referral dashboard tab. Our client relations team will then verify your log and ship your physical 24k gold coin securely to your registered delivery address."
    },
    {
      question: "Are the gold credits in my vault physically backed?",
      answer: "Yes, 100%! Every rupee or gram of gold in your vault is backed 1-to-1 by physical bullion stored securely in hyper-secure vault storage facilities like Brink's and Sequel."
    }
  ];

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  return (
    <main className="referral-page-content animate-fade-in">
      {/* Standalone Hero Section */}
      <section className="referral-page-hero">
        <div className="referral-hero-glass">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>EXCHANGE PARTNER REWARDS</span>
          </div>
          <h1>Investhour Gold Vault Referral Program</h1>
          <p className="hero-subtext">
            accumulate institutional-grade physical gold by introducing friends to India's most secure digital commodities exchange.
          </p>
          <div className="hero-grid-offers">
            <div className="offer-box">
              <span className="offer-value">Gold Payout</span>
              <span className="offer-title">Per Verified Referral</span>
            </div>
            <div className="offer-divider">+</div>
            <div className="offer-box milestone">
              <span className="offer-value">1 Gram Gold Coin</span>
              <span className="offer-title">At 1,500 Referrals Milestone</span>
            </div>
          </div>
          
          <div className="hero-cta-section">
            {isLoggedIn ? (
              <button className="btn-referral-cta primary" onClick={onGoToDashboard}>
                Go to Referral Dashboard <ArrowRight size={18} />
              </button>
            ) : (
              <button className="btn-referral-cta primary" onClick={onRequireAuth}>
                Open Your Vault Account <UserPlus size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Visual Step Description */}
      <section className="referral-steps-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container-grid">
          <div className="step-card-box">
            <div className="step-badge-num">1</div>
            <h3>Share Your Link</h3>
            <p>Obtain your unique referral link from your Vault Profile Dashboard and share it with your network via chat, email, or social media.</p>
          </div>
          <div className="step-card-box">
            <div className="step-badge-num">2</div>
            <h3>Friend Registers</h3>
            <p>Your friend opens a free Investhour digital vault account using your link and successfully completes their secure KYC verification.</p>
          </div>
          <div className="step-card-box">
            <div className="step-badge-num">3</div>
            <h3>Accumulate Gold</h3>
            <p>Physically-backed gold is instantly credited to your vault. Track invites in real-time on your dashboard ledger.</p>
          </div>
        </div>
      </section>
      {/* Accordion FAQs */}
      <section className="referral-faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-accordion-list">
          {faqs.map((faq, index) => (
            <div key={index} className={`faq-item-card ${openFaq === index ? 'active' : ''}`} onClick={() => toggleFaq(index)}>
              <div className="faq-question-header">
                <h3>{faq.question}</h3>
                {openFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {openFaq === index && (
                <div className="faq-answer-body">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Security Banner */}
      <section className="referral-security-banner">
        <div className="security-banner-content">
          <ShieldCheck size={40} className="sec-shield-icon" />
          <div>
            <h3>Secure & Regulated Commodities Vaulting</h3>
            <p>Every referral program payout is fully recorded in the vault ledger, audited regularly, and fully backed by physically locked precious metals.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
