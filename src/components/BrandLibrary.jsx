import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, Search, CheckCircle2, AlertCircle, Plus, Sparkles, Video, 
  Layers, Sliders, Play, Trash2, Link, FileText, Layout, ArrowRight, Eye, ThumbsUp, MessageSquare, User
} from 'lucide-react';

export default function BrandLibrary({ backendUrl, onApplyTemplate, showNotification }) {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannelKey, setSelectedChannelKey] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Analyzing Modal / Input State
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Load saved patterns on mount
  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async (selectLatestKey = null) => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/patterns`);
      if (response.ok) {
        const data = await response.json();
        setPatterns(data);
        
        // Group patterns to see unique channels
        const grouped = groupPatterns(data);
        const keys = Object.keys(grouped);
        
        if (keys.length > 0) {
          const nextKey = selectLatestKey && grouped[selectLatestKey] ? selectLatestKey : keys[0];
          setSelectedChannelKey(nextKey);
          
          const channelTemplates = grouped[nextKey]?.templates || [];
          if (channelTemplates.length > 0) {
            setSelectedTemplateId(channelTemplates[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching brand library patterns:", err);
      showNotification("Failed to load Brand Library templates", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper to group patterns by channel run
  const groupPatterns = (rawPatterns) => {
    const grouped = {};
    rawPatterns.forEach(p => {
      // Find a clean key for grouping (default to source_video_url)
      const key = p.source_video_url || "channel_default";
      if (!grouped[key]) {
        // Guess a creator name based on video title or metadata
        let creatorName = "Creator Style";
        const videoTitle = p.math_metadata?.videos?.[0]?.title;
        if (videoTitle) {
          const words = videoTitle.split(" ");
          creatorName = words[0] ? words[0] + " Channel" : "Creator Style";
        }
        
        grouped[key] = {
          key: key,
          creatorName: creatorName,
          templates: [],
          videos: p.math_metadata?.videos || [],
          synthesized_analyses: p.math_metadata?.synthesized_analyses || []
        };
      }
      grouped[key].templates.push(p);
    });
    return grouped;
  };

  const handleAnalyzeNewVibe = async (e) => {
    e.preventDefault();
    if (!analyzeUrl) {
      showNotification("Please enter a YouTube Channel Link/Handle first", "error");
      return;
    }

    setAnalyzing(true);
    showNotification("Downloading and analyzing creator's top shorts (using pre-cached videos if network fails)...", "info");
    
    try {
      const response = await fetch(`${backendUrl}/api/analyze-vibe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: analyzeUrl })
      });

      if (response.ok) {
        const result = await response.json();
        showNotification("Channel editing styles successfully analyzed! Synthesized Template A and Template B.", "success");
        setAnalyzeUrl('');
        setShowModal(false);
        
        // Find the newly created template key from result to auto-select it
        const newKey = result.videos?.[0]?.id || null;
        fetchPatterns(newKey); // Refresh and auto-select
      } else {
        const errData = await response.json();
        showNotification(errData.detail || "Creator channel analysis failed", "error");
      }
    } catch (err) {
      console.error("Vibe analysis API error:", err);
      showNotification("An error occurred during channel style analysis", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = (pattern) => {
    if (!pattern) return;
    
    const preset = {
      font_family: pattern.vibe_analysis?.font_family || 'Impact',
      font_size: pattern.vibe_analysis?.font_size || 48,
      primary_color: pattern.vibe_analysis?.primary_color || '#FFFF00',
      secondary_color: pattern.vibe_analysis?.secondary_color || '#FFFFFF',
      caption_position: pattern.vibe_analysis?.caption_position || 'center',
      b_roll_frequency: pattern.vibe_analysis?.b_roll_frequency || 'high'
    };
    
    onApplyTemplate(preset);
    showNotification(`Template "${pattern.vibe_analysis?.name || 'Custom'}" applied to editor!`, "success");
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  const groupedChannels = groupPatterns(patterns);
  const currentChannel = groupedChannels[selectedChannelKey];
  const currentTemplates = currentChannel?.templates || [];
  const selectedPattern = currentTemplates.find(t => t.id === selectedTemplateId) || currentTemplates[0];

  return (
    <div style={{ minHeight: '520px' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '8px' }}>Brand Editing Styles Library</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Enter a creator's channel link to extract 2 distinct visual identity presets and view video-by-video stats.
          </p>
        </div>
        
        <button 
          className="neon-btn" 
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Analyze Creator Channel
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-row" style={{ height: '80px', borderRadius: '12px', opacity: 0.15 }}></div>
          ))}
        </div>
      ) : patterns.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px', borderRadius: '16px', 
          backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-light)',
          marginTop: '30px'
        }}>
          <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Brand Library is empty</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px', maxWidth: '400px', margin: '8px auto 20px' }}>
            No creator channels analyzed yet. Paste a channel URL to generate templates and load viral video stats.
          </p>
          <button className="neon-btn" onClick={() => setShowModal(true)}>
            Analyze Your First Channel
          </button>
        </div>
      ) : (
        <div>
          {/* Channel Selector Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', 
            padding: '12px 16px', borderRadius: '10px', 
            backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Selected Channel:</span>
            <select 
              value={selectedChannelKey}
              onChange={(e) => {
                const key = e.target.value;
                setSelectedChannelKey(key);
                const firstId = groupedChannels[key]?.templates?.[0]?.id || '';
                setSelectedTemplateId(firstId);
              }}
              style={{
                padding: '8px 12px', borderRadius: '6px',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
                color: '#fff', fontSize: '0.9rem', cursor: 'pointer', outline: 'none'
              }}
            >
              {Object.keys(groupedChannels).map(k => (
                <option key={k} value={k}>{groupedChannels[k].creatorName}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr', gap: '30px' }}>
            
            {/* Left Column: Styles Grid List (Shows the 2 generated templates for the channel) */}
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--accent-cyan)" /> Generated Style Blueprints (Template A & B)
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {currentTemplates.map((pattern, idx) => {
                  const isSelected = selectedTemplateId ? selectedTemplateId === pattern.id : idx === 0;
                  const template = pattern.vibe_analysis || {};
                  
                  return (
                    <div 
                      key={pattern.id}
                      onClick={() => setSelectedTemplateId(pattern.id)}
                      style={{
                        padding: '24px', borderRadius: '16px', 
                        backgroundColor: isSelected ? 'rgba(0,255,255,0.03)' : 'var(--bg-secondary)',
                        border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: isSelected ? '0 0 20px rgba(0,255,255,0.08)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: '64px', height: '90px', borderRadius: '10px', 
                          background: isSelected ? 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(160,32,240,0.2) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                          border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                            {idx === 0 ? 'A' : 'B'}
                          </span>
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Layers size={12} /> Consolidated Template {idx === 0 ? 'A' : 'B'}
                          </div>
                          
                          <h5 style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '4px', marginBottom: '8px', color: '#fff' }}>
                            {template.name || (idx === 0 ? "Kinetic Vibe Style" : "Minimalist Style")}
                          </h5>
                          
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '100px', backgroundColor: 'rgba(0, 255, 255, 0.08)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 255, 255, 0.15)' }}>
                              {template.vibe_summary || 'Vibrant'}
                            </span>
                            <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
                              Font: {template.font_family || 'Impact'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Technical specifications */}
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '20px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          A-Roll: <strong style={{ color: 'var(--accent-cyan)' }}>{template.a_roll_ratio || '70%'}</strong>
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          B-Roll: <strong style={{ color: 'var(--accent-purple)' }}>{template.b_roll_ratio || '30%'}</strong>
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Position: <strong style={{ color: '#fff' }}>{template.caption_position || 'center'}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Right Column: Sidebar Spec Details (Lists analyzed videos, metrics, and description) */}
            <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '30px' }}>
              {selectedPattern ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Visual Style Blueprint</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', lineHeight: '1.4' }}>
                      {selectedPattern.vibe_analysis?.style_description || "Consolidated editing rules synthesized from the creator's viral uploads."}
                    </p>
                  </div>
                  
                  {/* A-roll / B-roll Ratios bar */}
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>A-roll vs. B-roll Balance</span>
                    <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', marginTop: '8px', backgroundColor: 'var(--border-light)' }}>
                      <div 
                        style={{ 
                          width: selectedPattern.vibe_analysis?.a_roll_ratio || '50%', 
                          backgroundColor: 'var(--accent-cyan)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#000', fontWeight: 700
                        }}
                      >
                        {selectedPattern.vibe_analysis?.a_roll_ratio || '50%'}
                      </div>
                      <div 
                        style={{ 
                          width: selectedPattern.vibe_analysis?.b_roll_ratio || '50%', 
                          backgroundColor: 'var(--accent-purple)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fff', fontWeight: 700
                        }}
                      >
                        {selectedPattern.vibe_analysis?.b_roll_ratio || '50%'}
                      </div>
                    </div>
                  </div>

                  {/* Individual Video Analyses & Links */}
                  {selectedPattern.math_metadata?.videos && (
                    <div>
                      <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>Analyzed Videos Breakdown</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedPattern.math_metadata.videos.map((vid, idx) => {
                          const summaryObj = selectedPattern.math_metadata.synthesized_analyses?.find(s => s.video_id === vid.video_id) || {};
                          return (
                            <div 
                              key={vid.video_id || idx}
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.01)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '8px',
                                padding: '12px',
                                fontSize: '0.8rem'
                              }}
                            >
                              <a 
                                href={vid.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  color: 'var(--accent-cyan)', 
                                  fontWeight: 600, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  textDecoration: 'none',
                                  marginBottom: '4px',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <Link size={12} /> {vid.title || `Short #${idx + 1}`}
                              </a>
                              
                              <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.75rem', lineHeight: '1.3' }}>
                                {summaryObj.vibe_summary || "No individual summary provided."}
                              </p>

                              <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="Views">
                                  <Eye size={12} /> {formatViews(vid.view_count)}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="Likes">
                                  <ThumbsUp size={12} /> {formatViews(vid.like_count)}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="Comments">
                                  <MessageSquare size={12} /> {formatViews(vid.comment_count)}
                                </span>
                                <span style={{ marginLeft: 'auto' }}>
                                  Pacing: <strong>{vid.average_pacing || '2.0'}s</strong>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Caption Safe Zone visualizer */}
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>Caption "Safe Zone" Preview</h5>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{
                        width: '150px', height: '240px', borderRadius: '12px',
                        border: '3px solid var(--border-light)', backgroundColor: '#050505',
                        position: 'relative', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.4)'
                      }}>
                        <div style={{ width: '100%', height: '100%', opacity: 0.1, position: 'absolute', background: 'radial-gradient(circle, #fff 1px, transparent 1px) 0 0/10px 10px' }}></div>
                        
                        <div style={{
                          position: 'absolute', 
                          bottom: selectedPattern.vibe_analysis?.caption_position === 'bottom' ? '15%' : selectedPattern.vibe_analysis?.caption_position === 'top' ? '65%' : '40%', 
                          left: '10%', right: '10%', height: '15%',
                          borderRadius: '4px', border: '1px dashed var(--accent-cyan)',
                          backgroundColor: 'rgba(0, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 0 8px rgba(0,255,255,0.2)'
                        }}>
                          <span style={{ fontSize: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {selectedPattern.vibe_analysis?.caption_position || 'CENTER'} ZONE
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
   
                  {/* Primary Action */}
                  <button 
                    className="neon-btn"
                    onClick={() => handleApply(selectedPattern)}
                    style={{ 
                      width: '100%', justifyContent: 'center', padding: '12px', fontWeight: 600,
                      background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)'
                    }}
                  >
                    Apply Template to Editor
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Select a template card to view blueprint specifications.
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Analyze Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{ width: '500px', padding: '32px', border: '1px solid var(--border-light)', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px', 
                background: 'none', border: 'none', color: 'var(--text-muted)', 
                cursor: 'pointer'
              }}
            >
              Close (X)
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Sparkles size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }} />
              <h4 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Analyze YouTube Channel Style</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                Paste a YouTube Channel URL or Handle. We will find their top 5 viral shorts, download the top 3, and synthesize 2 distinct style templates.
              </p>
            </div>

            <form onSubmit={handleAnalyzeNewVibe} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>YouTube Channel Link / Handle</label>
                <input 
                  type="text" 
                  value={analyzeUrl}
                  onChange={(e) => setAnalyzeUrl(e.target.value)}
                  placeholder="e.g. youtube.com/@tanmaybhat or @tanmaybhat"
                  style={{
                    padding: '12px', borderRadius: '8px', 
                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
                    color: '#fff', fontSize: '0.9rem'
                  }}
                  disabled={analyzing}
                />
              </div>

              <button 
                type="submit"
                className="neon-btn"
                disabled={analyzing}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                {analyzing ? 'Downloading & Analyzing channel...' : 'Run Hybrid RAG Pipeline'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
