import React, { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Search, 
  ShieldCheck, 
  Compass, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Info, 
  Shield, 
  HelpCircle, 
  Coins 
} from 'lucide-react';
import './AboutUs.css';
import { metals } from './metals';

import goldImg from './assets/metals/gold.png';
import silverImg from './assets/metals/silver.png';
import bronzeImg from './assets/metals/bronze.png';
import darkImg from './assets/metals/dark.png';
import blueImg from './assets/metals/blue.png';
import cyanImg from './assets/metals/cyan.png';
import greenImg from './assets/metals/green.png';
import liquidImg from './assets/metals/liquid.png';

const metalImages = {
  gold: goldImg,
  silver: silverImg,
  bronze: bronzeImg,
  dark: darkImg,
  blue: blueImg,
  cyan: cyanImg,
  green: greenImg,
  liquid: liquidImg
};

const METAL_METADATA = {
  gold: {
    importance: "The ultimate store of value and hedge against inflation. Gold has been coveted for millennia as currency and jewelry, and is a vital reserve asset for central banks globally.",
    rarity: "Ultra Rare",
    drivers: "Inflation, geopolitical tension, central bank reserves",
    weight: "196.97 u"
  },
  titanium: {
    importance: "Extremely strong, lightweight, and corrosion-resistant. Crucial for aerospace, medical implants, high-end engineering, and military applications, representing high-growth industrial demand.",
    rarity: "Strategic Metal",
    drivers: "Aerospace production, military build-ups, industrial manufacturing",
    weight: "47.87 u"
  },
  silver: {
    importance: "Dual-purpose asset valued both as a precious metal and an essential industrial component. It has the highest electrical and thermal conductivity of any metal, vital for solar panels and electronics.",
    rarity: "Rare Precious",
    drivers: "Green energy adoption, industrial demand, silver-to-gold ratio",
    weight: "107.87 u"
  },
  chromium: {
    importance: "The key ingredient in stainless steel, providing hardness and corrosion resistance. It is widely used in metal plating and automotive manufacturing.",
    rarity: "Industrial Critical",
    drivers: "Steel manufacturing, automotive production",
    weight: "51.99 u"
  },
  manganese: {
    importance: "Essential for steelmaking, where it acts as a deoxidizer and alloying element to improve strength and wear resistance. Unreplaceable in modern infrastructure.",
    rarity: "Strategic Industrial",
    drivers: "Global infrastructure, iron smelting demand",
    weight: "54.94 u"
  },
  iron: {
    importance: "The backbone of modern civilization. Iron and steel form the foundation of global infrastructure, building construction, transportation, and industrial machinery.",
    rarity: "Abundant Essential",
    drivers: "Global steel demand, construction starts, mining output",
    weight: "55.85 u"
  },
  cobalt: {
    importance: "A critical component in lithium-ion batteries for electric vehicles and electronics. Cobalt is also used in superalloys for jet engines, making it a highly strategic green-energy metal.",
    rarity: "Critical Resource",
    drivers: "EV batteries, rechargeable electronics, jet engines",
    weight: "58.93 u"
  },
  nickel: {
    importance: "Essential for stainless steel production and increasingly crucial for electric vehicle batteries. Its demand is heavily tied to the transition to clean energy.",
    rarity: "Strategic Resource",
    drivers: "Electric vehicles, stainless steel, global warehousing stocks",
    weight: "58.69 u"
  },
  copper: {
    importance: "The metal of electrification. Copper is an outstanding conductor of electricity and heat, indispensable for power grids, electric vehicles, renewable energy, and telecommunications.",
    rarity: "Industrial Backbone",
    drivers: "Power grid expansion, EV adoption, infrastructure spending",
    weight: "63.55 u"
  },
  zinc: {
    importance: "Primarily used for galvanizing steel to prevent rust. Zinc is also essential in die-casting for the automotive industry and is a key nutrient in agriculture and health.",
    rarity: "Common Industrial",
    drivers: "Steel galvanizing, automotive parts production",
    weight: "65.38 u"
  },
  yttrium: {
    importance: "A rare earth metal used as an additive in metal alloys to increase strength. It is critical for superconducting materials, lasers, and ceramic coatings.",
    rarity: "Rare Earth",
    drivers: "Superconductors, lasers, thermal barrier coatings",
    weight: "88.91 u"
  },
  zirconium: {
    importance: "Highly resistant to heat and corrosion. It is widely used as a cladding for nuclear reactor fuel rods, in chemical processing equipment, and in premium ceramics.",
    rarity: "Nuclear Grade",
    drivers: "Nuclear power plants, chemical refinery building",
    weight: "91.22 u"
  },
  niobium: {
    importance: "Used to produce superconducting alloys and high-strength, low-alloy steels. Crucial for jet engines, particle accelerators, and MRI machines.",
    rarity: "Superconducting Tech",
    drivers: "MRI equipment, advanced aerospace alloys",
    weight: "92.91 u"
  },
  molybdenum: {
    importance: "Known for its extremely high melting point. It is used as an alloying agent in steel to enhance strength, temperature resistance, and corrosion resistance in extreme environments.",
    rarity: "Industrial Special",
    drivers: "Military manufacturing, structural steel upgrades",
    weight: "95.95 u"
  },
  technetium: {
    importance: "A highly radioactive, synthetic transition metal. Its isotope Technetium-99m is widely used in medical imaging (nuclear medicine) for diagnostic scans.",
    rarity: "Synthetic / Medical",
    drivers: "Medical scanner usage, nuclear technology regulations",
    weight: "[98] u"
  },
  ruthenium: {
    importance: "One of the rarest platinum-group metals. It is highly resistant to wear and chemical attack, used in electronics, electrical contacts, and chemical catalysts.",
    rarity: "Platinum Group Rare",
    drivers: "Microelectronics, microchip manufacturing, green hydrogen",
    weight: "101.07 u"
  },
  rhodium: {
    importance: "The rarest and most valuable precious metal in the world. Its primary use is in catalytic converters to reduce toxic exhaust emissions, making it highly valuable.",
    rarity: "Ultra-Rare Precious",
    drivers: "Automotive emission laws, platinum group supply issues",
    weight: "102.91 u"
  },
  palladium: {
    importance: "A precious metal critical for catalytic converters in gasoline vehicles, electronics, and hydrogen purification systems, showcasing extreme chemical utility.",
    rarity: "Rare Precious",
    drivers: "Auto emissions, gasoline car sales, mining capacity",
    weight: "106.42 u"
  },
  vanadium: {
    importance: "Mainly used as a steel alloy to produce ultra-high-strength materials for aerospace and hand tools. It is also emerging as a key element in next-generation redox flow batteries.",
    rarity: "Energy Critical",
    drivers: "Grid storage batteries, high-strength tools",
    weight: "50.94 u"
  },
  cadmium: {
    importance: "Used in nickel-cadmium batteries, pigments, coatings, and plastic stabilizers. Its use is carefully regulated but remains important in industrial niches.",
    rarity: "Heavy Industrial",
    drivers: "Battery recycling, manufacturing regulations",
    weight: "112.41 u"
  },
  hafnium: {
    importance: "An excellent absorber of neutrons, making it vital for control rods in nuclear reactors. Also used in microprocessors and high-temperature alloys.",
    rarity: "Nuclear & Silicon Tech",
    drivers: "Semiconductor nodes, nuclear energy expansion",
    weight: "178.49 u"
  },
  tantalum: {
    importance: "Highly corrosion-resistant and capable of storing high levels of electrical charge. Indispensable for capacitors in smartphones, laptops, and automotive electronics.",
    rarity: "Tech Critical",
    drivers: "Smartphone manufacturing, electronic supply chains",
    weight: "180.95 u"
  },
  tungsten: {
    importance: "Has the highest melting point of all metals. Critical for cutting tools, filaments, military applications, and aerospace alloys that must withstand extreme heat.",
    rarity: "Strategic Defense",
    drivers: "Defense systems, industrial drilling, rocket nozzles",
    weight: "183.84 u"
  },
  rhenium: {
    importance: "One of the rarest elements in the Earth's crust. It has a very high melting point and is used in nickel-based superalloys for combustion chambers and turbine blades of jet engines.",
    rarity: "Ultra-Rare Aerospace",
    drivers: "Jet engine turbines, high-octane gasoline refining",
    weight: "186.21 u"
  },
  osmium: {
    importance: "The densest naturally occurring element. Osmium is extremely hard and wear-resistant, used in platinum alloys, electrical contacts, and medical implants.",
    rarity: "Densest Precious",
    drivers: "Precision wear alloys, chemical processing catalysts",
    weight: "190.23 u"
  },
  iridium: {
    importance: "The most corrosion-resistant metal known. It can withstand temperatures up to 2000°C, making it vital for spark plugs, crucibles, and green hydrogen electrolysis.",
    rarity: "Ultra-Rare Critical",
    drivers: "Green hydrogen electrolyzers, spark plugs, high-heat crucibles",
    weight: "192.22 u"
  },
  platinum: {
    importance: "A premier precious metal and catalyst. Used in jewelry, catalytic converters, chemotherapy drugs, and fuel cells, representing a prestige investment class.",
    rarity: "Precious Standard",
    drivers: "Fuel cell technology, jewelry, diesel exhaust catalytic converters",
    weight: "195.08 u"
  },
  scandium: {
    importance: "A rare earth element that, when alloyed with aluminum, creates exceptionally strong and lightweight materials used in aerospace, defense, and high-end sports equipment.",
    rarity: "Aerospace Rare Earth",
    drivers: "Lightweight aircraft alloys, defense parts",
    weight: "44.96 u"
  },
  mercury: {
    importance: "The only metallic element that is liquid at standard conditions. Primarily used in electronics, chemical processing, and scientific instruments due to its unique liquid state.",
    rarity: "Liquid Metallic",
    drivers: "Chloralkali production, scientific testing apparatus",
    weight: "200.59 u"
  }
};

const AboutUs = ({ rates = {}, holdings = {}, walletBalance = 0, isLoggedIn, onRequireAuth, onTradeRequest, onExplore }) => {
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [activeAction, setActiveAction] = useState('buy');
  const [rupees, setRupees] = useState('');
  const [grams, setGrams] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('atomic');

  const handleCardClick = (metal) => {
    setSelectedMetal(metal);
    setActiveAction('buy');
    setRupees('');
    setGrams('');
  };

  const getPricePerGram = (metal) => {
    return rates[metal?.assetId]?.price || 0;
  };

  const handleRupeesChange = (val) => {
    setRupees(val);
    const pricePerGram = getPricePerGram(selectedMetal);
    if (val && !isNaN(val) && pricePerGram > 0) {
      setGrams((parseFloat(val) / pricePerGram).toFixed(4));
    } else {
      setGrams('');
    }
  };

  const handleGramsChange = (val) => {
    setGrams(val);
    const pricePerGram = getPricePerGram(selectedMetal);
    if (val && !isNaN(val) && pricePerGram > 0) {
      setRupees((parseFloat(val) * pricePerGram).toFixed(2));
    } else {
      setRupees('');
    }
  };

  const handleSwapFields = () => {
    setRupees('');
    setGrams('');
  };

  const handleTradeSubmit = (actionType) => {
    if (!isLoggedIn) {
      onRequireAuth?.();
      return;
    }

    const finalRupees = parseFloat(rupees) || 0;
    const finalGrams = parseFloat(grams) || 0;
    
    if (finalRupees <= 0) return;

    const rate = getPricePerGram(selectedMetal);
    const subtotal = finalRupees;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;

    onTradeRequest?.({
      asset: selectedMetal.assetId,
      action: actionType === 'sip' ? 'buy' : actionType, // backend confirmation resolves 'sip' initializations
      weight: finalGrams.toFixed(4),
      rate: rate,
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2)
    });

    // Close local modal to allow global App.jsx checkout overlay to render clearly
    setSelectedMetal(null);
  };

  // Dynamic daily change logic based on atomic number
  const getMetalChangePct = (metal) => {
    if (rates[metal.assetId]?.pct) return rates[metal.assetId].pct;
    // Semi-random deterministic calculation for aesthetic variety
    const hash = Math.sin(metal.no * 9.8) * 1.8;
    return parseFloat(hash.toFixed(2));
  };

  // Filter & Sort Logic
  const filteredMetals = metals
    .filter((metal) => {
      // Category filter
      if (activeFilter === 'precious' && metal.type !== 'Precious Metal') return false;
      if (activeFilter === 'transition' && metal.type !== 'Transition Metal') return false;

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          metal.name.toLowerCase().includes(query) || 
          metal.symbol.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const priceA = rates[a.assetId]?.price || 0;
      const priceB = rates[b.assetId]?.price || 0;
      const changeA = getMetalChangePct(a);
      const changeB = getMetalChangePct(b);

      switch (sortBy) {
        case 'price-high':
          return priceB - priceA;
        case 'price-low':
          return priceA - priceB;
        case 'change-high':
          return changeB - changeA;
        case 'atomic':
        default:
          return a.no - b.no;
      }
    });

  const getMetadata = (assetId) => {
    return METAL_METADATA[assetId] || {
      importance: "A highly strategic metallic element representing physical rarity and emerging industrial applications.",
      rarity: "Strategic Metal",
      drivers: "Industrial growth, global tech logistics",
      weight: "N/A"
    };
  };

  const selectedHolding = holdings[selectedMetal?.assetId] || 0;
  const selectedHoldingValue = selectedHolding * getPricePerGram(selectedMetal);

  return (
    <div className="about-us-exact-container">
      {/* Intro Banner */}
      <div className="elements-hero">
        <span className="hero-tagline">Invest in Precious Possibilities</span>
        <h1 className="hero-title">The World's Most Valuable Metals</h1>
        <p className="hero-subtitle">
          Explore and invest in 29 physical elements, backing your digital portfolio with raw, tangible materials. Track live market rates and instantly transact globally strategic metals.
        </p>
      </div>

      {/* Highlights Strip */}
      <div className="highlights-grid">
        <div className="highlight-card">
          <div className="highlight-icon-wrapper">
            <ShieldCheck size={20} />
          </div>
          <h3 className="highlight-title">Secure Your Wealth</h3>
          <p className="highlight-desc">Invest in globally trusted, physical metals safely ledgered on-chain.</p>
        </div>
        <div className="highlight-card">
          <div className="highlight-icon-wrapper">
            <Compass size={20} />
          </div>
          <h3 className="highlight-title">Diversify Smartly</h3>
          <p className="highlight-desc">Spread capital across strategic technology elements and industrial reserves.</p>
        </div>
        <div className="highlight-card">
          <div className="highlight-icon-wrapper">
            <Sparkles size={20} />
          </div>
          <h3 className="highlight-title">Built to Last</h3>
          <p className="highlight-desc">Tangible metallic assets containing absolute, permanent material value.</p>
        </div>
        <div className="highlight-card">
          <div className="highlight-icon-wrapper">
            <Coins size={20} />
          </div>
          <h3 className="highlight-title">Liquid & Accessible</h3>
          <p className="highlight-desc">Convert holdings instantly back to cash or trigger systematic SIPs.</p>
        </div>
      </div>

      {/* Search & Sort Panel */}
      <div className="controls-container">
        <div className="filter-tabs">
          <button 
            type="button" 
            className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Elements
          </button>
          <button 
            type="button" 
            className={`filter-tab-btn ${activeFilter === 'precious' ? 'active' : ''}`}
            onClick={() => setActiveFilter('precious')}
          >
            Precious Metals
          </button>
          <button 
            type="button" 
            className={`filter-tab-btn ${activeFilter === 'transition' ? 'active' : ''}`}
            onClick={() => setActiveFilter('transition')}
          >
            Transition Metals
          </button>
        </div>

        <div className="search-sort-box">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-bar-input" 
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sort-select-wrapper">
            <label htmlFor="sort-select" className="sort-label">Sort</label>
            <select 
              id="sort-select"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="atomic">Atomic Number</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="change-high">Daily Gain</option>
            </select>
          </div>
        </div>
      </div>

      {/* Elements Table Grid */}
      <div className="metals-periodic-grid">
        {filteredMetals.length > 0 ? (
          filteredMetals.map((metal) => {
            const price = rates[metal.assetId]?.price || 0;
            const change = getMetalChangePct(metal);
            const isPositive = change >= 0;

            return (
              <button
                key={metal.no}
                type="button"
                className={`metal-grid-card group-${metal.group}`}
                onClick={() => handleCardClick(metal)}
                aria-label={`View details of ${metal.name}`}
                title={`View ${metal.name}`}
              >
                <span className="card-atomic-no">{metal.no}</span>
                <span className="card-symbol">{metal.symbol}</span>
                <span className="card-name">{metal.name}</span>
                
                <div className="card-ore-container">
                  <img
                    src={metalImages[metal.group] || metalImages.dark}
                    alt={`${metal.name} ore`}
                    className="card-ore-image"
                  />
                </div>

                <div className="card-pricing-block">
                  <span className="card-price">
                    {price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Loading...'}
                  </span>
                  <span className={`card-change-badge ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {isPositive ? '+' : ''}{change}%
                  </span>
                </div>

                <span className="card-type-label">{metal.type}</span>
              </button>
            );
          })
        ) : (
          <div className="no-results-view">
            <HelpCircle size={40} style={{ marginBottom: '12px', color: '#726c7e' }} />
            <h3>No Elements Found</h3>
            <p>Try refining your search terms or selecting another category.</p>
          </div>
        )}
      </div>

      {/* Dual Pane Details Modal Drawer */}
      {selectedMetal && (
        <div className="metal-modal-overlay" onClick={() => setSelectedMetal(null)}>
          <div className="metal-details-modal-box" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-corner"
              onClick={() => setSelectedMetal(null)}
              title="Close Panel"
              aria-label="Close Panel"
            >
              <X size={18} />
            </button>

            {/* Left Column: Element Intelligence */}
            <div className="modal-left-pane">
              <div>
                <div className="metal-badge-row">
                  <span className={`metal-type-pill ${selectedMetal.type === 'Transition Metal' ? 'transition-metal' : ''}`}>
                    {selectedMetal.type}
                  </span>
                  <span style={{ fontSize: '12px', color: '#726c7e', fontWeight: 600 }}>Physical Asset Vault</span>
                </div>

                <div className="metal-hero-display">
                  <div className={`glowing-symbol-avatar ${selectedMetal.type === 'Transition Metal' ? 'trans-glow' : ''}`}>
                    <span className="at-no">{selectedMetal.no}</span>
                    <span className="sym">{selectedMetal.symbol}</span>
                  </div>
                  <div className="metal-title-block">
                    <h2>{selectedMetal.name}</h2>
                    <p>Asset ID: <span style={{ fontFamily: 'monospace', color: '#d9af56' }}>{selectedMetal.assetId}</span></p>
                  </div>
                </div>

                <div className="metal-thesis-section">
                  <h4 className="thesis-heading"><Info size={12} /> Strategic Importance</h4>
                  <p className="thesis-body">
                    {getMetadata(selectedMetal.assetId).importance}
                  </p>
                </div>
              </div>

              <div className="metal-spec-table">
                <div className="spec-row">
                  <span className="spec-label">Atomic Mass</span>
                  <span className="spec-val">{getMetadata(selectedMetal.assetId).weight}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Rarity Tier</span>
                  <span className="spec-val" style={{ color: '#d9af56' }}>
                    {getMetadata(selectedMetal.assetId).rarity}
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Key Drivers</span>
                  <span className="spec-val">{getMetadata(selectedMetal.assetId).drivers}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Trading Desk */}
            <div className="modal-right-pane">
              <div className="pricing-title-section">
                <div className="live-price">
                  ₹{getPricePerGram(selectedMetal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g
                </div>
                <div className="live-rates-pulse">
                  <span className="green-pulse-dot"></span>
                  <span>Live Market Rate</span>
                </div>
              </div>

              <div className="wallet-holdings-bar">
                <div className="balance-item">
                  <span className="lbl">Wallet Cash</span>
                  <span className="val" style={{ color: '#10b981' }}>
                    ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="balance-item" style={{ textAlign: 'right' }}>
                  <span className="lbl">Your Holding</span>
                  <span className="val" style={{ color: '#d9af56' }}>
                    {selectedHolding.toFixed(4)} g (₹{selectedHoldingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                  </span>
                </div>
              </div>

              <div className="trade-tabs">
                <button 
                  type="button" 
                  className={`trade-tab-btn ${activeAction === 'buy' ? 'active buy' : ''}`}
                  onClick={() => setActiveAction('buy')}
                >
                  BUY {selectedMetal.symbol}
                </button>
                <button 
                  type="button" 
                  className={`trade-tab-btn ${activeAction === 'sell' ? 'active sell' : ''}`}
                  onClick={() => setActiveAction('sell')}
                >
                  SELL {selectedMetal.symbol}
                </button>
              </div>

              <div className="inputs-group-block">
                <div className="trade-input-container">
                  <span className="input-lbl-prefix">Rupees</span>
                  <input 
                    type="number" 
                    className="numeric-entry-field"
                    placeholder="Enter amount"
                    value={rupees}
                    onChange={(e) => handleRupeesChange(e.target.value)}
                  />
                </div>

                <div className="swap-btn-row">
                  <button 
                    type="button" 
                    className="circular-swap-btn"
                    onClick={handleSwapFields}
                    title="Clear Inputs"
                  >
                    <ArrowRightLeft size={14} />
                  </button>
                </div>

                <div className="trade-input-container">
                  <span className="input-lbl-prefix">Grams</span>
                  <input 
                    type="number" 
                    className="numeric-entry-field"
                    placeholder="Enter weight"
                    value={grams}
                    onChange={(e) => handleGramsChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="shortcut-pills">
                {[100, 500, 1000, 5000].map((amount) => (
                  <button 
                    key={amount} 
                    type="button" 
                    className="shortcut-pill-btn"
                    onClick={() => handleRupeesChange(amount.toString())}
                  >
                    +₹{amount.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Order breakdown */}
              <div className="order-cost-breakdown">
                <div className="cost-row">
                  <span className="cost-lbl">Subtotal</span>
                  <span className="cost-val">
                    ₹{(parseFloat(rupees) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="cost-row">
                  <span className="cost-lbl">GST (18%)</span>
                  <span className="cost-val">
                    ₹{((parseFloat(rupees) || 0) * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="cost-row total">
                  <span className="cost-lbl">{activeAction === 'buy' ? 'Total Cost' : 'Estimated Return'}</span>
                  <span className="cost-val">
                    ₹{((parseFloat(rupees) || 0) * (activeAction === 'buy' ? 1.18 : 1.0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Trigger */}
              <button 
                type="button" 
                className={`submit-trade-btn ${activeAction === 'buy' ? 'buy' : 'sell'}`}
                onClick={() => handleTradeSubmit(activeAction)}
                disabled={!rupees || parseFloat(rupees) <= 0 || (activeAction === 'sell' && selectedHolding < parseFloat(grams))}
              >
                {activeAction === 'buy' ? 'Authorize Buy Order' : 'Authorize Sell Order'}
              </button>

              <button 
                type="button"
                className="sip-shortcut-link"
                onClick={() => handleTradeSubmit('sip')}
                disabled={!rupees || parseFloat(rupees) <= 0}
              >
                Or Setup Daily SIP Systematic Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutUs;
