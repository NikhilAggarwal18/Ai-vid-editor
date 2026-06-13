import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Video, Sliders, ChevronRight, CheckCircle2, 
  AlertCircle, RefreshCw, Trash2, BarChart3, 
  Eye, Users, Clock, MousePointerClick, ArrowLeft, Search, Plus
} from 'lucide-react';

const YoutubeIcon = ({ size = 24, fill = "currentColor", style = {}, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    style={{ width: size, height: size, fill: fill, stroke: 'none', ...style }}
    {...props}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

import PrimaryButton from './PrimaryButton';
import CreatorSelectionCard from './CreatorSelectionCard';
import AnalyticsMetricCard from './AnalyticsMetricCard';
import AudienceAgeSelector from './AudienceAgeSelector';
import ContentFormatCard from './ContentFormatCard';
import ChannelProfileCard from './ChannelProfileCard';

const GENRE_SUGGESTIONS = [
  "Gaming", "Education", "Tech", "Finance", 
  "Entertainment", "Vlogs", "Fitness", 
  "Business", "Productivity", "News"
];

export default function SocialNetworkModule({ 
  currentUser, 
  BACKEND_URL, 
  showNotification,
  setView,
  initialSubView = 'landing',
  initialChannelId = null
}) {
  const [subView, setSocialSubView] = useState(initialSubView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  // Onboarding states
  const [ageRange, setAgeRange] = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [customGenre, setCustomGenre] = useState('');
  const [showCustomGenreField, setShowCustomGenreField] = useState(false);
  const [contentFormat, setContentFormat] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState([]);
  const [timeframe, setTimeframe] = useState('30D');

  // Load profile status on mount
  useEffect(() => {
    if (initialSubView === 'success-established' && initialChannelId) {
      setProfile({
        is_established_creator: true,
        youtube_channel_id: initialChannelId,
        youtube_channel_title: "Connected Creator"
      });
      fetchAnalytics();
    } else {
      checkProfileStatus();
    }
  }, [initialSubView, initialChannelId]);

  const checkProfileStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/social-network/youtube/analytics`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setProfile({
            is_established_creator: true,
            youtube_channel_id: data.channel_id,
            youtube_channel_title: "Connected Creator"
          });
          setAnalyticsData(data.analytics || []);
          setSocialSubView('analytics');
        }
      } else if (res.status === 400) {
        const errData = await res.json();
        if (errData.detail && errData.detail.includes("User is registered as a new creator")) {
          setProfile({ is_established_creator: false });
          setSocialSubView('onboarding');
        } else {
          setSocialSubView('landing');
        }
      } else {
        setSocialSubView('landing');
      }
    } catch (err) {
      console.warn("Could not load creator profile status:", err);
      setSocialSubView('landing');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/social-network/youtube/analytics`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setAnalyticsData(data.analytics || []);
          showNotification("Analytics refreshed successfully!");
        }
      } else {
        const data = await res.json();
        setError(data.detail || "Unable to fetch analytics.");
      }
    } catch (err) {
      setError("Network error: Could not reach backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Flow A: Established Creator auth
  const handleConnectYouTube = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/social-network/youtube/auth-url`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
        } else {
          showNotification("Failed to generate Google auth link", "error");
        }
      } else {
        showNotification("Failed to generate Google auth link", "error");
      }
    } catch (err) {
      showNotification("Could not reach backend server", "error");
    } finally {
      setLoading(false);
    }
  };

  // Simulator helper for local dev testing
  const handleSimulateOAuth = async () => {
    setLoading(true);
    try {
      const mockCode = `mock_code_${Math.floor(Math.random() * 100000)}`;
      const res = await fetch(`${BACKEND_URL}/api/social-network/youtube/callback?code=${mockCode}&state=${currentUser.id}&redirect=false`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          showNotification("Mock YouTube Account connected!");
          setProfile({
            is_established_creator: true,
            youtube_channel_id: data.youtube_channel_id,
            youtube_channel_title: "Mock Connected Channel"
          });
          setSocialSubView('success-established');
        }
      } else {
        showNotification("Mock YouTube connection failed", "error");
      }
    } catch (err) {
      showNotification("Connection error during OAuth simulation", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your YouTube Channel? This deletes your linked credentials.")) return;
    setLoading(true);
    try {
      // Disconnect by setting profile as new creator with empty fields, or delete.
      // We onboard as new-creator with empty payload to clear OAuth, or delete profile:
      // Let's call onboarding with dummy inputs or add unlinking.
      // Since onboarding new creator sets is_established = 0 and tokens = NULL, we can just onboard as new creator to unlink!
      const res = await fetch(`${BACKEND_URL}/api/social-network/onboarding/new-creator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_audience_age: '18_22',
          content_genre: 'Gaming',
          content_format: 'BOTH'
        }),
        credentials: 'include'
      });
      if (res.ok) {
        showNotification("YouTube Channel unlinked.");
        setProfile(null);
        setSocialSubView('landing');
      } else {
        showNotification("Unlink operation failed", "error");
      }
    } catch (err) {
      showNotification("Could not contact backend server", "error");
    } finally {
      setLoading(false);
    }
  };

  // Flow B: New Creator onboarding
  const handleOnboardingSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validation
    const errors = {};
    if (!ageRange) errors.age = "Please select an audience age range.";
    
    const finalGenre = showCustomGenreField ? customGenre : genreInput;
    if (!finalGenre) errors.genre = "Please enter a content genre.";
    
    if (!contentFormat) errors.format = "Please select a content format.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/social-network/onboarding/new-creator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_audience_age: ageRange,
          content_genre: finalGenre,
          content_format: contentFormat
        }),
        credentials: 'include'
      });
      if (res.ok) {
        showNotification("Creator profile saved!");
        setSocialSubView('success-new');
      } else {
        showNotification("Failed to save profile", "error");
      }
    } catch (err) {
      showNotification("Could not reach backend server", "error");
    } finally {
      setLoading(false);
    }
  };

  // Render SVG Performance Graph
  const renderSvgGraph = () => {
    if (!analyticsData || analyticsData.length === 0) {
      return (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          No analytics data available.
        </div>
      );
    }

    // Slice data based on timeframe
    let dataSlice = [...analyticsData];
    if (timeframe === '7D') dataSlice = analyticsData.slice(-7);
    else if (timeframe === '30D') dataSlice = analyticsData.slice(-30);

    const width = 600;
    const height = 200;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const views = dataSlice.map(d => d.views);
    const maxVal = Math.max(...views, 100) * 1.1; // 10% spacing above
    const minVal = Math.min(...views, 0);
    const range = (maxVal - minVal) || 1;

    const points = dataSlice.map((d, index) => {
      const x = paddingLeft + (index * (width - paddingLeft - paddingRight)) / (dataSlice.length - 1);
      const y = height - paddingBottom - ((d.views - minVal) * (height - paddingTop - paddingBottom)) / range;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '220px', display: 'block' }}>
        <defs>
          <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - paddingBottom - ratio * (height - paddingTop - paddingBottom);
          const val = Math.round(minVal + ratio * range);
          return (
            <g key={ratio} style={{ opacity: 0.15 }}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#fff" strokeWidth="1" strokeDasharray="4" />
              <text x={paddingLeft - 10} y={y + 4} fill="#fff" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
                {val.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* X Axis labels */}
        {dataSlice.map((d, index) => {
          // Label every N items to prevent overlap
          const skip = Math.max(1, Math.floor(dataSlice.length / 5));
          if (index % skip !== 0 && index !== dataSlice.length - 1) return null;
          
          const x = paddingLeft + (index * (width - paddingLeft - paddingRight)) / (dataSlice.length - 1);
          const dateStr = d.day.slice(5); // MM-DD format
          
          return (
            <text 
              key={index} 
              x={x} 
              y={height - paddingBottom + 18} 
              fill="var(--text-muted)" 
              fontSize="9" 
              textAnchor="middle"
              fontFamily="var(--font-mono)"
            >
              {dateStr}
            </text>
          );
        })}
        
        {/* Area fill */}
        <polygon
          points={`${paddingLeft},${height - paddingBottom} ${points} ${width - paddingRight},${height - paddingBottom}`}
          fill="url(#chart-gradient)"
        />
        
        {/* Plot line */}
        <polyline
          fill="none"
          stroke="var(--accent-cyan)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          style={{ filter: 'drop-shadow(0px 0px 5px var(--accent-cyan-glow))' }}
        />

        {/* Dots on points */}
        {dataSlice.map((d, index) => {
          if (dataSlice.length > 15 && index % 2 !== 0 && index !== dataSlice.length - 1) return null;
          const x = paddingLeft + (index * (width - paddingLeft - paddingRight)) / (dataSlice.length - 1);
          const y = height - paddingBottom - ((d.views - minVal) * (height - paddingTop - paddingBottom)) / range;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4.5"
              fill="var(--bg-primary)"
              stroke="var(--accent-cyan)"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ position: 'relative', minHeight: '60vh' }}>
      {/* Dynamic Glow effect */}
      <div className="ambient-glow" style={{ top: '10%', left: '40%', opacity: 0.15 }}></div>

      {/* --- View 1: Landing selection --- */}
      {subView === 'landing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '12px' }}>Social Network</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Connect your existing YouTube channel or tell us about your future audience to receive personalized recommendations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '16px' }}>
            <CreatorSelectionCard
              title="🎥 Established Creator"
              description="Connect your YouTube account to import content details, analyze video performance metrics, track subscriber growth, and auto-generate recommendations."
              ctaText="Connect YouTube"
              icon={YoutubeIcon}
              onClick={handleConnectYouTube}
            />

            <CreatorSelectionCard
              title="🚀 New Creator"
              description="Help us understand your upcoming content plans, target audience preferences, and category formats to craft your content production strategy."
              ctaText="Set Up Profile"
              icon={Sparkles}
              onClick={() => setSocialSubView('onboarding')}
            />
          </div>

          {/* Local Developer Simulation Option */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span 
              onClick={handleSimulateOAuth}
              style={{
                fontSize: '0.85rem',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                textDecoration: 'underline'
              }}
            >
              ⚡ Simulate YouTube OAuth callback (Demo Mode)
            </span>
          </div>
        </div>
      )}

      {/* --- View 2: Flow B New Creator Onboarding --- */}
      {subView === 'onboarding' && (
        <div className="glass-panel" style={{ padding: '36px', maxWidth: '650px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '24px' }}>
            <button 
              onClick={() => setSocialSubView('landing')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>Step 1 of 1</span>
          </div>

          <form onSubmit={handleOnboardingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Age Range Question */}
            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 600, marginBottom: '14px' }}>
                Who is your primary audience?
              </label>
              <AudienceAgeSelector
                selectedAge={ageRange}
                onChange={(val) => {
                  setAgeRange(val);
                  if (formErrors.age) setFormErrors({ ...formErrors, age: null });
                }}
              />
              {formErrors.age && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> {formErrors.age}
                </p>
              )}
            </div>

            {/* Genre Question */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px' }}>
                What type of content will you create?
              </label>
              
              {!showCustomGenreField ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Select or search content genre..."
                      value={genreInput}
                      onChange={(e) => {
                        setGenreInput(e.target.value);
                        setIsGenreDropdownOpen(true);
                        if (formErrors.genre) setFormErrors({ ...formErrors, genre: null });
                      }}
                      onFocus={() => setIsGenreDropdownOpen(true)}
                      style={{
                        padding: '12px 16px 12px 38px',
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'rgba(0, 0, 0, 0.2)',
                        color: '#fff'
                      }}
                    />
                  </div>

                  {isGenreDropdownOpen && (
                    <div 
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        marginTop: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        padding: '8px 0',
                        border: '1px solid var(--border-light)',
                        backgroundColor: '#0a0a0f'
                      }}
                    >
                      {GENRE_SUGGESTIONS.filter(g => g.toLowerCase().includes(genreInput.toLowerCase())).map((genre) => (
                        <div
                          key={genre}
                          onClick={() => {
                            setGenreInput(genre);
                            setIsGenreDropdownOpen(false);
                          }}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {genre}
                        </div>
                      ))}
                      
                      <div
                        onClick={() => {
                          setShowCustomGenreField(true);
                          setIsGenreDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          color: 'var(--accent-cyan)',
                          borderTop: '1px solid var(--border-light)',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Plus size={14} /> Create Custom Genre
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Enter custom content genre..."
                    value={customGenre}
                    onChange={(e) => {
                      setCustomGenre(e.target.value);
                      if (formErrors.genre) setFormErrors({ ...formErrors, genre: null });
                    }}
                    autoFocus
                    style={{
                      padding: '12px 16px',
                      flexGrow: 1,
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: 'rgba(0, 0, 0, 0.2)',
                      color: '#fff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomGenreField(false);
                      setCustomGenre('');
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-secondary)',
                      padding: '0 16px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {formErrors.genre && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> {formErrors.genre}
                </p>
              )}
            </div>

            {/* Content Format Question */}
            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 600, marginBottom: '14px' }}>
                What format do you plan to create?
              </label>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <ContentFormatCard
                  title="Long Form"
                  description="Videos above 3 minutes"
                  selected={contentFormat === 'LONG_FORM'}
                  onSelect={() => {
                    setContentFormat('LONG_FORM');
                    if (formErrors.format) setFormErrors({ ...formErrors, format: null });
                  }}
                />
                <ContentFormatCard
                  title="Short Form"
                  description="YouTube Shorts"
                  selected={contentFormat === 'SHORT_FORM'}
                  onSelect={() => {
                    setContentFormat('SHORT_FORM');
                    if (formErrors.format) setFormErrors({ ...formErrors, format: null });
                  }}
                />
                <ContentFormatCard
                  title="Both"
                  description="Long-form + Shorts"
                  selected={contentFormat === 'BOTH'}
                  onSelect={() => {
                    setContentFormat('BOTH');
                    if (formErrors.format) setFormErrors({ ...formErrors, format: null });
                  }}
                />
              </div>
              {formErrors.format && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={14} /> {formErrors.format}
                </p>
              )}
            </div>

            {/* Submit button */}
            <PrimaryButton 
              type="submit" 
              loading={loading}
              style={{ padding: '14px 32px', fontSize: '1rem', alignSelf: 'flex-start', marginTop: '12px' }}
            >
              Complete Setup <ChevronRight size={18} />
            </PrimaryButton>
          </form>
        </div>
      )}

      {/* --- View 3: Success New Creator --- */}
      {subView === 'success-new' && (
        <div className="glass-panel" style={{ padding: '48px 36px', maxWidth: '550px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ color: 'var(--accent-cyan)', backgroundColor: 'rgba(0, 255, 255, 0.08)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={38} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '8px' }}>Setup Completed!</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>
              Your creator profile has been saved successfully. We'll use this to optimize recommendations and hook formula analysis.
            </p>
          </div>
          <PrimaryButton 
            onClick={() => setView('studio')}
            style={{ width: '100%', marginTop: '12px' }}
          >
            Generate Content Strategy
          </PrimaryButton>
        </div>
      )}

      {/* --- View 4: Success Established Creator --- */}
      {subView === 'success-established' && (
        <div className="glass-panel" style={{ padding: '48px 36px', maxWidth: '550px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ color: 'var(--accent-cyan)', backgroundColor: 'rgba(0, 255, 255, 0.08)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={38} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '8px' }}>YouTube Connected</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>
              Your YouTube account has been connected successfully. We've fetched your channel metadata and configured the secure token vaults.
            </p>
          </div>
          <PrimaryButton 
            onClick={() => {
              setSocialSubView('analytics');
              fetchAnalytics();
            }}
            style={{ width: '100%', marginTop: '12px' }}
          >
            Go To Analytics
          </PrimaryButton>
        </div>
      )}

      {/* --- View 5: Analytics Dashboard --- */}
      {subView === 'analytics' && profile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Header row with unlinking */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Analytics Dashboard</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Channel performance and stats for the connected channel</p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={fetchAnalytics}
                disabled={loading}
                style={{
                  background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-secondary)',
                  padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'var(--transition-smooth)', fontSize: '0.9rem'
                }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Analytics
              </button>
              
              <button 
                onClick={handleDisconnect}
                style={{
                  background: 'none', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444',
                  padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'var(--transition-smooth)', fontSize: '0.9rem'
                }}
              >
                <Trash2 size={14} /> Disconnect Channel
              </button>
            </div>
          </div>

          {/* Profile Card and Stats Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', flexWrap: 'wrap' }}>
            
            {/* Left side Profile */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <ChannelProfileCard
                channelName={profile.youtube_channel_title || "Connected Creator"}
                channelId={profile.youtube_channel_id}
                avatar={null} /* Use default fallback icon with custom CSS */
              />
              
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '24px', 
                  backgroundColor: 'rgba(15, 15, 24, 0.4)', 
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#fff' }}>Channel Stats</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Account Mode:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>Established Creator</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Linked on:</span>
                    <span>13 June 2026</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Security Level:</span>
                    <span style={{ color: '#10b981', fontWeight: 500 }}>AES-256 Encrypted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side metric counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <AnalyticsMetricCard
                title="Total Views"
                value="245,000"
                changePercentage={12.4}
                icon={Eye}
              />
              <AnalyticsMetricCard
                title="Watch Time"
                value="2,500 hrs"
                changePercentage={8.2}
                icon={Clock}
              />
              <AnalyticsMetricCard
                title="Subscribers Gained"
                value="+1,230"
                changePercentage={15.1}
                icon={Users}
              />
              <AnalyticsMetricCard
                title="Average CTR"
                value="6.5%"
                changePercentage={-1.2}
                icon={MousePointerClick}
              />
            </div>
          </div>

          {/* SVG Performance Graph Panel */}
          <div className="glass-panel" style={{ padding: '28px', backgroundColor: 'rgba(15, 15, 24, 0.4)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', margin: 0 }}>View Traffic</h3>
              
              {/* Filter buttons */}
              <div style={{ display: 'flex', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
                {['7D', '30D'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setTimeframe(opt)}
                    style={{
                      background: timeframe === opt ? 'rgba(0, 255, 255, 0.15)' : 'none',
                      border: 'none',
                      color: timeframe === opt ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {renderSvgGraph()}
          </div>

          {/* Top Performing Videos Table */}
          <div className="glass-panel" style={{ padding: '28px', backgroundColor: 'rgba(15, 15, 24, 0.4)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>Top Performing Videos</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 500 }}>Video Title</th>
                    <th style={{ padding: '12px 16px', fontWeight: 500 }}>Views</th>
                    <th style={{ padding: '12px 16px', fontWeight: 500 }}>CTR</th>
                    <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { title: "How I grew my YouTube channel by 10k in 30 days", views: "48,200", ctr: "8.4%" },
                    { title: "Avoid these 5 critical mistakes in video editing", views: "36,500", ctr: "7.1%" },
                    { title: "Clone this viral Hook formula for YouTube Shorts", views: "29,100", ctr: "6.5%" }
                  ].map((vid, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 500, color: '#fff' }}>
                        {vid.title}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {vid.views}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {vid.ctr}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            showNotification("Analyzing video content formula...");
                            setView('studio');
                          }}
                          style={{
                            background: 'rgba(0, 255, 255, 0.1)',
                            border: '1px solid rgba(0, 255, 255, 0.2)',
                            color: 'var(--accent-cyan)',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-cyan)';
                            e.currentTarget.style.color = '#000';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
                            e.currentTarget.style.color = 'var(--accent-cyan)';
                          }}
                        >
                          Analyze Content
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
