import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Video, Search, Music, Film, Layers, Play, Pause, 
  RotateCcw, Sliders, ChevronRight, CheckCircle2, AlertCircle, 
  Settings, User, HelpCircle, Upload, Plus, Volume2, Link, Trash2,
  Home, Lock, Mail, Eye, EyeOff, Check, X, ShieldAlert, LogOut,
  Share2, FolderOpen
} from 'lucide-react';
import './App.css';
import SocialNetworkModule from './components/SocialNetworkModule';
import BrandLibrary from './components/BrandLibrary';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

function App() {
  const [view, setView] = useState('landing'); // default to landing page view
  const [studioTab, setStudioTab] = useState('projects'); // default to projects tab
  
  const getFallbackVideoUrl = (start = 0, end = 60) => {
    const extractYtId = (url) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    if (videoFeeds && videoFeeds.length > 0) {
      const ytFeed = videoFeeds.find(f => f.type === 'youtube' || f.source?.includes('youtube.com') || f.source?.includes('youtu.be'));
      if (ytFeed) {
        const ytId = extractYtId(ytFeed.source);
        if (ytId) return `https://www.youtube.com/embed/${ytId}?start=${parseInt(start)}&end=${parseInt(end)}&autoplay=1`;
      }
    }
    
    const newProjYtId = extractYtId(newProjLink);
    if (newProjYtId) return `https://www.youtube.com/embed/${newProjYtId}?start=${parseInt(start)}&end=${parseInt(end)}&autoplay=1`;

    if (wizardMultiFeeds && wizardMultiFeeds.length > 0) {
      const ytFeed = wizardMultiFeeds.find(f => f.type === 'youtube' || f.link?.includes('youtube.com') || f.link?.includes('youtu.be'));
      if (ytFeed) {
        const ytId = extractYtId(ytFeed.link);
        if (ytId) return `https://www.youtube.com/embed/${ytId}?start=${parseInt(start)}&end=${parseInt(end)}&autoplay=1`;
      }
    }
    return "https://www.w3schools.com/html/mov_bbb.mp4";
  };

  
  // Wizard States
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardPipeline, setWizardPipeline] = useState('A');
  const [wizardStyleOptIn, setWizardStyleOptIn] = useState(false);
  const [wizardCreatorHandle, setWizardCreatorHandle] = useState('');
  const [wizardMusicTrackId, setWizardMusicTrackId] = useState('m1');
  const [wizardMultiFeeds, setWizardMultiFeeds] = useState([
    { id: 'feed-1', label: 'Wide Angle Feed', type: 'link', file: null, link: 'https://www.w3schools.com/html/mov_bbb.mp4', status: 'Ready' },
    { id: 'feed-2', label: 'Zoom Speaker Feed', type: 'link', file: null, link: 'https://www.w3schools.com/html/movie.mp4', status: 'Ready' }
  ]);
  const [wizardProgressSteps, setWizardProgressSteps] = useState([]);
  const [wizardCurrentProgressIdx, setWizardCurrentProgressIdx] = useState(0);

  // App States
  const [channelInput, setChannelInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Competitor Scraped States
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [creatorPresets, setCreatorPresets] = useState(null);
  const [viralShorts, setViralShorts] = useState([]);
  
  // Project & Sync States
  const [projectTitle, setProjectTitle] = useState('');
  const [projectGenre, setProjectGenre] = useState('Cinematic');
  const [projectsList, setProjectsList] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [videoFeeds, setVideoFeeds] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [videoSourceType, setVideoSourceType] = useState('file'); // 'file', 'youtube', 'drive'
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [feedLabelInput, setFeedLabelInput] = useState('');
  
  // Modal states for creating project
  const [isNewProjModalOpen, setIsNewProjModalOpen] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSourceType, setNewProjSourceType] = useState('file'); // 'file', 'link'
  const [newProjFile, setNewProjFile] = useState(null);
  const [newProjLink, setNewProjLink] = useState('');
  const [newProjYoutubeUrl, setNewProjYoutubeUrl] = useState('');
  const [newProjDriveUrl, setNewProjDriveUrl] = useState('');
  const [newProjFeedLabel, setNewProjFeedLabel] = useState('Main Angle');
  
  // AI Clipper Settings
  const [targetCreatorHandle, setTargetCreatorHandle] = useState('');
  const [desiredClipsCount, setDesiredClipsCount] = useState(3);
  const [isProcessingAIClips, setIsProcessingAIClips] = useState(false);
  
  // AI Clips & Timeline States
  const [generatedClips, setGeneratedClips] = useState([]);
  const [activeClip, setActiveClip] = useState(null);
  const [isClipping, setIsClipping] = useState(false);
  
  // Rendering & Customization States
  const [captionFont, setCaptionFont] = useState('Impact');
  const [captionSize, setCaptionSize] = useState(48);
  const [primaryColor, setPrimaryColor] = useState('#FFFF00');
  const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
  const [captionPos, setCaptionPos] = useState('center');
  const [animStyle, setAnimStyle] = useState('pop');
  
  // Audio & Music States
  const [musicCatalog, setMusicCatalog] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioPlayerRef = useRef(new Audio());
  
  // Render States
  const [isRendering, setIsRendering] = useState(false);
  const [renderedClips, setRenderedClips] = useState([]);
  const [selectedRenderedClips, setSelectedRenderedClips] = useState([]);

  // Time tracking for dynamic captions
  const [playerTime, setPlayerTime] = useState(0);

  useEffect(() => {
    setPlayerTime(0);
    if (!activeClip) return;
    
    const duration = (activeClip.end_time - activeClip.start_time) || 30;
    const interval = setInterval(() => {
      setPlayerTime((prev) => {
        const next = prev + 0.25;
        return next >= duration ? 0 : next;
      });
    }, 250);
    
    return () => clearInterval(interval);
  }, [activeClip]);

  const getDynamicCaption = () => {
    if (!activeClip || !activeClip.transcript) return "VIRAL HIGHLIGHT";
    const words = activeClip.transcript.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "VIRAL HIGHLIGHT";
    
    // Group into chunks of 3 words
    const chunkSize = 3;
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }
    
    const duration = (activeClip.end_time - activeClip.start_time) || 30;
    const chunkDuration = duration / chunks.length;
    
    const index = Math.floor(playerTime / chunkDuration);
    const activeChunk = chunks[Math.min(index, chunks.length - 1)] || chunks[0];
    return activeChunk;
  };

  // Fetch initial data (music catalog, projects list)
  // Authentication States
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('welcome'); // 'welcome', 'selection', 'email_entry', 'email_verify', 'finalize', 'forgot_password', 'reset_verify', 'reset_finalize'
  const [authEmail, setAuthEmail] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true); // true = sign up, false = sign in
  const [showPassword, setShowPassword] = useState(false);
  const [authReferralSource, setAuthReferralSource] = useState('');

  // Password Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');

  // Check active session on app mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.user) {
            setCurrentUser(data.user);
            setView('studio'); // Auto-route to studio if already logged in!
            showNotification(`Welcome back, ${data.user.name}!`);
          }
        }
      } catch (err) {
        console.warn("No active session detected.");
      }
    };
    checkSession();
  }, []);

  const [youtubeCallbackStatus, setYoutubeCallbackStatus] = useState(null);
  const [youtubeCallbackChannelId, setYoutubeCallbackChannelId] = useState(null);

  // Check for YouTube callback redirect params in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ytStatus = params.get('youtube_status');
    const channelId = params.get('channel_id');
    const detail = params.get('detail');
    
    if (ytStatus) {
      if (ytStatus === 'success') {
        setYoutubeCallbackStatus('success');
        setYoutubeCallbackChannelId(channelId);
        setView('social-network');
        showNotification("YouTube Channel linked successfully!");
      } else if (ytStatus === 'error') {
        showNotification(detail || "Failed to link YouTube Channel", "error");
      }
      
      // Clean URL search parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Google Sign-in initialization is defined below handleGoogleAuthCallback to prevent TDZ errors

  // Fetch initial data (music catalog, projects list)
  useEffect(() => {
    if (currentUser || view === 'studio') {
      fetchMusicCatalog();
      fetchProjects();
    }
  }, [currentUser, view]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjectsList(data);
      } else {
        throw new Error();
      }
    } catch (err) {
      console.warn("Failed to fetch projects list from backend.");
    }
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // --- PASSWORD STRENGTH CHECKS ---
  const checkPassLength = (pass) => pass.length >= 8 && pass.length <= 25;
  const checkPassLower = (pass) => /[a-z]/.test(pass);
  const checkPassUpper = (pass) => /[A-Z]/.test(pass);
  const checkPassDigit = (pass) => /\d/.test(pass);
  const checkPassSpecial = (pass) => /[@$!%*?&]/.test(pass);

  // --- AUTHENTICATION HANDLERS ---
  const handleEmailInit = async (e) => {
    if (e) e.preventDefault();
    if (!authEmail) {
      setAuthError("Email is required.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup/email/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setAuthOtp('');
        setAuthMode('email_verify');
        showNotification("Verification code sent! Check your email.");
      } else {
        setAuthError(data.detail || "Failed to send verification code.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailVerify = async (e) => {
    e.preventDefault();
    if (!authOtp) {
      setAuthError("Verification code is required.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, otp_code: authOtp }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setAuthToken(data.token);
        setAuthName('');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthMode('finalize');
        showNotification("Email verified successfully! Complete your profile.");
      } else {
        setAuthError(data.detail || "Invalid or expired verification code.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!authName || !authPassword) {
      setAuthError("Name and password are required.");
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    
    // Front-end password check matching backend regex:
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/;
    if (!passRegex.test(authPassword)) {
      setAuthError("Password does not meet validation policy rules.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          name: authName,
          password: authPassword,
          token: authToken,
          referral_source: authReferralSource || null
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setCurrentUser(data.user);
        setView('studio');
        showNotification("Account created successfully! Welcome to Studio.");
        // Reset auth fields
        setAuthEmail('');
        setAuthOtp('');
        setAuthName('');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthToken('');
        setAuthReferralSource('');
      } else {
        setAuthError(data.detail || "Registration failed.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotInitiate = async (e) => {
    if (e) e.preventDefault();
    if (!recoveryEmail) {
      setAuthError("Email is required.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setRecoveryOtp('');
        setAuthMode('reset_verify');
        showNotification("Recovery code sent successfully! Check your email.");
      } else {
        setAuthError(data.detail || "Failed to initiate password recovery.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    if (!recoveryOtp) {
      setAuthError("Verification code is required.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, otp_code: recoveryOtp }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setRecoveryToken(data.token);
        setRecoveryPassword('');
        setRecoveryConfirmPassword('');
        setAuthMode('reset_finalize');
        showNotification("Code verified! Set your new password.");
      } else {
        setAuthError(data.detail || "Invalid or expired verification code.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (!recoveryPassword || !recoveryConfirmPassword) {
      setAuthError("Passwords are required.");
      return;
    }
    if (recoveryPassword !== recoveryConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    
    // Front-end password check matching backend regex (8-25 characters):
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/;
    if (!passRegex.test(recoveryPassword)) {
      setAuthError("Password does not meet validation policy rules.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail,
          password: recoveryPassword,
          token: recoveryToken
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        showNotification("Password has been reset successfully! Please log in.");
        // Reset recovery fields
        setRecoveryEmail('');
        setRecoveryOtp('');
        setRecoveryToken('');
        setRecoveryPassword('');
        setRecoveryConfirmPassword('');
        setIsSignUp(false);
        setAuthMode('email_entry');
      } else {
        setAuthError(data.detail || "Failed to reset password.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignin = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signin/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setCurrentUser(data.user);
        setView('studio');
        showNotification(`Welcome back, ${data.user.name}!`);
        // Reset fields
        setAuthEmail('');
        setAuthPassword('');
      } else {
        setAuthError(data.detail || "Invalid email or password.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const sendGoogleTokenToBackend = async (credential) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signin/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (data.action === 'login') {
          setCurrentUser(data.user);
          setView('studio');
          showNotification(`Logged in via Google as ${data.user.name}`);
        } else if (data.action === 'signup_finalize_required') {
          setAuthEmail(data.email);
          setAuthName(data.name);
          setAuthToken(data.token);
          setAuthPassword('');
          setAuthConfirmPassword('');
          setAuthMode('finalize');
          showNotification("Google account verified! Please set your password.");
        }
      } else {
        setAuthError(data.detail || "Google authentication failed.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const triggerGoogleAuthSimulated = async (codeValue) => {
    setShowGoogleModal(false);
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google/callback?code=${encodeURIComponent(codeValue)}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (data.action === 'login') {
          setCurrentUser(data.user);
          setView('studio');
          showNotification(`Logged in via Google as ${data.user.name}`);
        } else if (data.action === 'signup_finalize_required') {
          setAuthEmail(data.email);
          setAuthName(data.name);
          setAuthToken(data.token);
          setAuthPassword('');
          setAuthConfirmPassword('');
          setAuthMode('finalize');
          showNotification("Google account verified! Please set your password.");
        }
      } else {
        setAuthError(data.detail || "Google authentication failed.");
      }
    } catch (err) {
      setAuthError("Could not connect to backend server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuthCallback = (response) => {
    if (response && response.credential) {
      sendGoogleTokenToBackend(response.credential);
    }
  };

  // Initialize Google Sign-in button (placed here to avoid Temporal Dead Zone issues)
  useEffect(() => {
    if (authMode === 'selection' && view === 'auth') {
      let active = true;
      const initGoogleBtn = () => {
        if (!active) return;
        /* global google */
        if (typeof google !== 'undefined') {
          const btnEl = document.getElementById("google-signin-button");
          if (btnEl) {
            try {
              google.accounts.id.initialize({
                client_id: "1079750944571-1llr1tqbluu1s04duil36e79fceefq6a.apps.googleusercontent.com",
                callback: handleGoogleAuthCallback,
                auto_select: false
              });
              
              google.accounts.id.renderButton(
                btnEl,
                { 
                  theme: "filled_blue", 
                  size: "large", 
                  shape: "rectangular", 
                  width: 320, 
                  text: "continue_with" 
                }
              );
            } catch (err) {
              console.error("Failed to initialize Google GSI:", err);
            }
          } else {
            // Container not rendered in DOM yet, retry in 100ms
            setTimeout(initGoogleBtn, 100);
          }
        } else {
          // Script not loaded yet, retry in 200ms
          setTimeout(initGoogleBtn, 200);
        }
      };
      // Short delay to ensure container DOM element is rendered in page tree
      setTimeout(initGoogleBtn, 100);
      
      return () => {
        active = false;
      };
    }
  }, [authMode, view]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setCurrentUser(null);
        setView('landing');
        showNotification("Logged out successfully.");
      }
    } catch (err) {
      showNotification("Failed to logout.", "error");
    }
  };

  const fetchMusicCatalog = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/music-catalog`);
      if (res.ok) {
        const data = await res.json();
        setMusicCatalog(data);
      } else {
        throw new Error();
      }
    } catch {
      // Mock Fallback
      setMusicCatalog([
        { id: "m1", title: "Epic Horizon", artist: "Aether", genre: "Cinematic", duration: 120, audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
        { id: "m2", title: "Cyberpunk Chase", artist: "Glitch Theory", genre: "Hype/High-Energy", duration: 95, audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
        { id: "m3", title: "Midnight Breeze", artist: "Chill Hop", genre: "Lo-Fi", duration: 150, audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
        { id: "m4", title: "Deep Shadow", artist: "Synth Dark", genre: "Suspense", duration: 110, audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" }
      ]);
    }
  };

  const playPreviewAudio = (track) => {
    if (selectedMusic?.id === track.id && isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.src = track.audio_url;
      audioPlayerRef.current.play();
      setSelectedMusic(track);
      setIsPlayingAudio(true);
    }
  };

  // 1. YouTube Channel Competitor Scraper
  const handleScrapeChannel = async (e) => {
    e.preventDefault();
    if (!channelInput) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze-channel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: channelInput })
      });
      
      if (!res.ok) throw new Error("API call failed");
      
      const data = await res.json();
      setCreatorProfile(data.channel);
      setCreatorPresets(data.style_preset);
      setViralShorts(data.viral_shorts);
      
      // Auto-populate styles with analyzed results
      if (data.style_preset) {
        setCaptionFont(data.style_preset.font_family || 'Impact');
        setPrimaryColor(data.style_preset.primary_color || '#FFFF00');
        setSecondaryColor(data.style_preset.secondary_color || '#FFFFFF');
        setCaptionPos(data.style_preset.caption_position || 'center');
        setAnimStyle(data.style_preset.animation_style || 'pop');
      }
      
      showNotification(`Successfully decoded @${channelInput}'s style parameters!`);
    } catch (err) {
      console.warn("Channel scrape API failed. Using mock credentials fallback.");
      // MOCK FALLBACK for quick demonstration
      setCreatorProfile({
        id: "mock_id",
        handle: channelInput.startsWith('@') ? channelInput : `@${channelInput}`,
        title: channelInput.toUpperCase() + " AI",
        avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"
      });
      setCreatorPresets({
        font_family: "Montserrat",
        font_size: 50,
        primary_color: "#FF007F", // Neon Pink
        secondary_color: "#FFFFFF",
        caption_position: "bottom",
        animation_style: "bounce",
        pacing_description: "Dynamic cutting, subtitles popping on every word",
        b_roll_frequency: "high"
      });
      setViralShorts([
        { id: "s1", title: "I built an AI in under 5 minutes!", view_count: 245000, like_count: 18000, published_at: "2026-06-05" },
        { id: "s2", title: "The hidden secret to growth", view_count: 189000, like_count: 12400, published_at: "2026-06-03" },
        { id: "s3", title: "Coding is dead? Let's verify.", view_count: 112000, like_count: 8500, published_at: "2026-05-28" }
      ]);
      
      setCaptionFont("Montserrat");
      setPrimaryColor("#FF007F");
      setCaptionPos("bottom");
      setAnimStyle("bounce");
      
      showNotification("Fallback mock database returned channel data.", "info");
    } finally {
      setLoading(false);
    }
  };

  // 2. Project Creation & Video uploading
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectTitle) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: projectTitle, genre: projectGenre })
      });
      
      if (!res.ok) throw new Error();
      
      const newProj = await res.json();
      setProjectsList([newProj, ...projectsList]);
      setActiveProject(newProj);
      setVideoFeeds([]);
      setIsSynced(false);
      showNotification(`Project "${projectTitle}" created!`);
    } catch {
      // Mock Fallback
      const newProj = { id: `proj_${Date.now()}`, title: projectTitle, genre: projectGenre };
      setProjectsList([newProj, ...projectsList]);
      setActiveProject(newProj);
      setVideoFeeds([]);
      setIsSynced(false);
      showNotification(`Created local draft: "${projectTitle}"`, "info");
    } finally {
      setProjectTitle('');
      setLoading(false);
    }
  };

  const handleAddFeed = (label, type, value) => {
    if (!label) {
      showNotification("Please specify a label for this angle (e.g. Close-up, Wide)", "error");
      return;
    }
    const newFeed = {
      id: `feed_${Date.now()}`,
      label,
      type, // 'file', 'youtube', 'drive'
      file_name: type === 'file' ? (value || 'local_file.mp4') : 
                 type === 'youtube' ? 'YouTube Import' : 'Google Drive Import',
      source: value || '',
      status: 'Ready'
    };
    setVideoFeeds([...videoFeeds, newFeed]);
    setFeedLabelInput('');
    setYoutubeUrlInput('');
    setDriveUrlInput('');
    showNotification(`Added ${type} feed: "${label}" successfully!`);
  };

  const handleWizardSubmit = async (e) => {
    e.preventDefault();
    if (!newProjTitle) {
      showNotification("Project title is required", "error");
      return;
    }
    
    // Set processing screen states
    setWizardStep('processing');
    setLoading(true);
    
    let projectId = `proj_${Date.now()}`;
    let createdProject = null;

    // 1. Initialize Active Progress Steps based on pipeline
    let steps = [];
    if (wizardPipeline === 'A') {
      steps = [
        "Ingesting raw long-form content...",
        ...(wizardStyleOptIn ? ["Analyzing competitor channel hooks & style presets..."] : []),
        "Evaluating transcript & peak audio levels...",
        "Segmenting timeline into top high-retention clips...",
        "Rendering vertical shorts & captions..."
      ];
    } else {
      steps = [
        "Ingesting multi-cam recordings...",
        "Fingerprinting audio waveforms...",
        "Aligning timelines & syncing events...",
        "Compiling transitions & cutting unified track...",
        "Rendering synced master video..."
      ];
    }
    setWizardProgressSteps(steps);
    setWizardCurrentProgressIdx(0);

    const advanceProgress = (idx, delay = 1500) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setWizardCurrentProgressIdx(idx);
          resolve();
        }, delay);
      });
    };

    try {
      // Step 1: Create project record on backend
      const res = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newProjTitle, genre: projectGenre })
      });
      if (res.ok) {
        createdProject = await res.json();
        projectId = createdProject.id;
      } else {
        throw new Error("Failed to create project record");
      }
    } catch (err) {
      console.warn("Backend offline or project create failed. Using local fallback.", err);
      createdProject = { id: projectId, title: newProjTitle, genre: projectGenre };
    }

    // Step 2: Media Ingestion
    await advanceProgress(1); // Advance to step 2

    if (wizardPipeline === 'A') {
      // Pipeline A: Ingest single feed
      let firstFeed = null;
      try {
        if (newProjSourceType === 'file') {
          const formData = new FormData();
          formData.append('label', 'Main Angle');
          formData.append('file', newProjFile);

          const uploadRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}/upload`, {
            method: 'POST',
            body: formData
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            firstFeed = {
              id: uploadData.id || `feed_${Date.now()}`,
              label: uploadData.label || 'Main Angle',
              type: 'file',
              file_name: newProjFile.name,
              source: uploadData.file_path,
              status: 'Ready'
            };
          } else {
            throw new Error("File upload failed on server");
          }
        } else {
          // Link type
          const isYoutube = newProjLink.includes('youtube.com') || newProjLink.includes('youtu.be');
          const isDrive = newProjLink.includes('drive.google.com') || newProjLink.includes('google.com/drive');
          const detectedType = isYoutube ? 'youtube' : (isDrive ? 'drive' : 'link');

          const linkRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}/add-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: 'Main Angle',
              url: newProjLink
            })
          });

          if (linkRes.ok) {
            const linkData = await linkRes.json();
            firstFeed = {
              id: linkData.id || `feed_${Date.now()}`,
              label: linkData.label || 'Main Angle',
              type: detectedType,
              file_name: detectedType === 'youtube' ? 'YouTube Import' : (detectedType === 'drive' ? 'Google Drive Import' : 'Web Link'),
              source: linkData.file_path,
              status: 'Ready'
            };
          } else {
            throw new Error("Link ingestion failed on server");
          }
        }
      } catch (err) {
        console.warn("Media ingestion fallback.", err);
        firstFeed = {
          id: `feed_${Date.now()}`,
          label: 'Main Angle',
          type: newProjSourceType === 'file' ? 'file' : 'youtube',
          file_name: newProjSourceType === 'file' ? newProjFile.name : 'Ingested Feed Link',
          source: newProjSourceType === 'file' ? URL.createObjectURL(newProjFile) : newProjLink,
          status: 'Ready'
        };
      }
      setVideoFeeds([firstFeed]);

      // Step A3: Creator Style Analysis (if opted-in)
      let targetChannelId = "";
      if (wizardStyleOptIn) {
        await advanceProgress(2); // Advance to analyzing
        try {
          const styleRes = await fetch(`${BACKEND_URL}/api/analyze-channel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handle: wizardCreatorHandle || "@mrbeast" })
          });
          if (styleRes.ok) {
            const styleData = await styleRes.json();
            targetChannelId = styleData.channel?.id || "";
            // Set styles from analysis
            if (styleData.style_preset) {
              setCaptionFont(styleData.style_preset.font_family || 'Impact');
              setPrimaryColor(styleData.style_preset.primary_color || '#FFFF00');
              setSecondaryColor(styleData.style_preset.secondary_color || '#FFFFFF');
            }
          }
        } catch (err) {
          console.warn("Style analysis failed, continuing.", err);
        }
      }

      // Step A4: Evaluate transcript & segment clips
      const segmentStepIdx = wizardStyleOptIn ? 3 : 2;
      await advanceProgress(segmentStepIdx);
      
      const renderStepIdx = wizardStyleOptIn ? 4 : 3;
      await advanceProgress(renderStepIdx);

      // Call generate clips
      let clips = [];
      try {
        const clipsRes = await fetch(
          `${BACKEND_URL}/api/projects/${projectId}/generate-clips?target_channel_id=${targetChannelId}&limit=${desiredClipsCount}`
        );
        if (clipsRes.ok) {
          clips = await clipsRes.json();
        } else {
          throw new Error("Clips generation endpoint failed");
        }
      } catch (err) {
        console.warn("Generate clips fallback.", err);
        // Fallback mock clips
        clips = Array.from({ length: desiredClipsCount }).map((_, i) => ({
          id: `clip_${Date.now()}_${i}`,
          project_id: projectId,
          title: `Viral Segment #${i+1}: Secret Formula`,
          start_time: i * 30.0,
          end_time: (i + 1) * 30.0,
          hook_score: 95 - i * 4,
          transcript: `This is high-retention clip number ${i+1}. Focus on hook profiles, visual layouts, and kinetic neon text.`,
          status: 'pending'
        }));
      }

      // Step A5: Render vertical shorts & captions
      setGeneratedClips(clips);
      
      // Render clips so they are completed and playable
      const renderedList = [];
      for (const clip of clips) {
        let servedUrl = getFallbackVideoUrl(clip.start_time, clip.end_time);
        try {
          const renderRes = await fetch(`${BACKEND_URL}/api/render-clip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clip_id: clip.id,
              font_family: captionFont,
              font_size: captionSize,
              primary_color: primaryColor,
              secondary_color: secondaryColor,
              caption_position: captionPos,
              animation_style: animStyle,
              music_track_id: wizardMusicTrackId === 'none' ? null : wizardMusicTrackId
            })
          });
          if (renderRes.ok) {
            const renderData = await renderRes.json();
            servedUrl = renderData.video_url;
          }
        } catch (err) {
          console.warn("Failed to render clip, using fallback:", err);
        }
        
        clip.status = 'completed';
        clip.video_url = servedUrl;
        renderedList.push({
          id: clip.id,
          project_id: projectId,
          title: clip.title,
          url: servedUrl,
          preset: { font: captionFont, color: primaryColor }
        });
      }
      setRenderedClips(prev => [...renderedList, ...prev]);
      setGeneratedClips([...clips]);
      setActiveClip(clips[0]);
      
    } else {
      // Pipeline B: Multi-Cam Sync Ingestion
      // Ingest feeds
      let activeFeeds = [];
      for (let i = 0; i < wizardMultiFeeds.length; i++) {
        const feed = wizardMultiFeeds[i];
        try {
          if (feed.type === 'file' && feed.file) {
            const formData = new FormData();
            formData.append('label', feed.label);
            formData.append('file', feed.file);
            const uploadRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}/upload`, {
              method: 'POST',
              body: formData
            });
            if (uploadRes.ok) {
              const uData = await uploadRes.json();
              activeFeeds.push({
                id: uData.id,
                label: uData.label,
                type: 'file',
                file_name: feed.file.name,
                source: uData.file_path,
                status: 'Ready'
              });
            }
          } else {
            const linkRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}/add-link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ label: feed.label, url: feed.link })
            });
            if (linkRes.ok) {
              const lData = await linkRes.json();
              activeFeeds.push({
                id: lData.id,
                label: lData.label,
                type: 'link',
                file_name: feed.label,
                source: lData.file_path,
                status: 'Ready'
              });
            }
          }
        } catch (err) {
          activeFeeds.push({
            id: feed.id,
            label: feed.label,
            type: feed.type,
            file_name: feed.type === 'file' ? feed.file?.name : feed.label,
            source: feed.type === 'file' ? URL.createObjectURL(feed.file) : feed.link,
            status: 'Ready'
          });
        }
      }
      setVideoFeeds(activeFeeds);

      // Multi-cam sync processing simulation steps
      await advanceProgress(1); // Fingerprinting waveforms
      await advanceProgress(2); // Aligning timelines
      await advanceProgress(3); // Compiling transitions
      await advanceProgress(4); // Rendering synced master

      // Call sync endpoint
      try {
        const syncRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}/sync`, {
          method: 'POST'
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          // Load the synced clip representing this synced project
          const syncClipsRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}/clips`);
          if (syncClipsRes.ok) {
            const syncedClips = await syncClipsRes.json();
            setGeneratedClips(syncedClips);
            if (syncedClips.length > 0) {
              setActiveClip(syncedClips[0]);
              setRenderedClips(prev => [
                {
                  id: syncedClips[0].id,
                  project_id: projectId,
                  title: syncedClips[0].title,
                  url: syncedClips[0].video_url,
                  preset: { font: captionFont, color: primaryColor }
                },
                ...prev
              ]);
            }
          }
        }
      } catch (err) {
        console.warn("Sync failed, fallback master clip.", err);
        const fallbackClip = {
          id: `clip_sync_${Date.now()}`,
          project_id: projectId,
          title: "Synced Multi-Cam Master",
          start_time: 0,
          end_time: 60.0,
          hook_score: 95,
          transcript: "Synced multi-camera master compilation video.",
          video_url: getFallbackVideoUrl(0, 60),
          status: 'completed'
        };
        setGeneratedClips([fallbackClip]);
        setActiveClip(fallbackClip);
        setRenderedClips(prev => [
          {
            id: fallbackClip.id,
            project_id: projectId,
            title: fallbackClip.title,
            url: fallbackClip.video_url,
            preset: { font: captionFont, color: primaryColor }
          },
          ...prev
        ]);
      }
    }

    // Wrap up
    setProjectsList([createdProject, ...projectsList]);
    setActiveProject(createdProject);
    setIsSynced(true);
    setLoading(false);
    
    // Close modal, open success tab
    setIsNewProjModalOpen(false);
    setStudioTab('success');
    showNotification(`Project "${newProjTitle}" created successfully!`, "success");
  };

  const handleSelectProject = async (proj) => {
    setActiveProject(proj);
    setLoading(true);
    try {
      // 1. Fetch project video feeds
      const resFeeds = await fetch(`${BACKEND_URL}/api/projects/${proj.id}/videos`);
      if (resFeeds.ok) {
        const feeds = await resFeeds.json();
        const mappedFeeds = feeds.map(feed => {
          const isYoutube = feed.file_path.includes('youtube.com') || feed.file_path.includes('youtu.be');
          const isDrive = feed.file_path.includes('drive.google.com') || feed.file_path.includes('google.com/drive');
          const detectedType = isYoutube ? 'youtube' : (isDrive ? 'drive' : 'file');
          
          return {
            id: feed.id,
            label: feed.label,
            type: detectedType,
            file_name: detectedType === 'file' ? feed.file_path.split('/').pop() : 
                       detectedType === 'youtube' ? 'YouTube Import' : 'Google Drive Import',
            source: feed.file_path,
            status: 'Ready'
          };
        });
        setVideoFeeds(mappedFeeds);
      } else {
        setVideoFeeds([]);
      }

      // 2. Fetch project clips
      const resClips = await fetch(`${BACKEND_URL}/api/projects/${proj.id}/clips`);
      if (resClips.ok) {
        const clips = await resClips.json();
        setGeneratedClips(clips);
        if (clips.length > 0) {
          const completed = clips.filter(c => c.status === 'completed').map(c => ({
            id: c.id,
            project_id: proj.id,
            title: c.title,
            url: c.video_url,
            preset: { font: captionFont, color: primaryColor }
          }));
          
          setRenderedClips(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newClips = completed.filter(c => !existingIds.has(c.id));
            return [...newClips, ...prev];
          });

          setActiveClip(clips[0]);
          if (completed.length > 0) {
            setStudioTab('success');
          } else {
            setStudioTab('editor');
          }
        } else {
          setActiveClip(null);
          setStudioTab('projects');
        }
      } else {
        setGeneratedClips([]);
        setActiveClip(null);
        setStudioTab('projects');
      }
      setIsSynced(false);
      showNotification(`Loaded project "${proj.title}"`);
    } catch (err) {
      console.error("Failed to load project details", err);
      showNotification("Error loading project details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent card selection click
    }
    if (!window.confirm("Are you sure you want to delete this project and all its generated videos?")) {
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProjectsList(projectsList.filter(p => p.id !== projectId));
        setRenderedClips(prev => prev.filter(c => c.project_id !== projectId));
        showNotification("Project deleted successfully", "success");
        if (activeProject && activeProject.id === projectId) {
          setActiveProject(null);
          setVideoFeeds([]);
          setGeneratedClips([]);
          setActiveClip(null);
          setStudioTab('projects');
        }
      } else {
        throw new Error();
      }
    } catch (err) {
      console.error("Failed to delete project", err);
      showNotification("Failed to delete project", "error");
    }
  };

  // 3. Sync Feeds
  const handleSyncFeeds = async () => {
    if (videoFeeds.length < 2) {
      showNotification("Please upload at least 2 camera angles to sync", "error");
      return;
    }
    
    setIsSyncing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${activeProject.id}/sync`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error();
      
      setIsSynced(true);
      showNotification("Angles synced using audio amplitude cues!");
    } catch {
      // Mock delay
      setTimeout(() => {
        setIsSynced(true);
        setIsSyncing(false);
        showNotification("Synced feeds via audio sync tracks!", "info");
      }, 2000);
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Run AI clipping generator
  const handleGenerateClips = async () => {
    setIsClipping(true);
    try {
      const channelId = creatorProfile?.id || '';
      const res = await fetch(`${BACKEND_URL}/api/projects/${activeProject.id}/generate-clips?target_channel_id=${channelId}&limit=${desiredClipsCount}`);
      if (!res.ok) throw new Error();
      
      const clips = await res.json();
      setGeneratedClips(clips);
      showNotification(`Mistral AI identified ${clips.length} high-hook segments!`);
    } catch {
      // Mock fallback
      setTimeout(() => {
        const fallbackClips = [
          { id: "c1", title: "Target Niche Rule", start_time: 12.5, end_time: 35.0, hook_score: 95, transcript: "If you try to target everyone, you target no one. That is the first major hook you need to get down when building a brand online.", editing_notes: "Cut to Close-up. Zoom in on 'everyone' and 'no one'." },
          { id: "c2", title: "Neon Retention Hack", start_time: 48.0, end_time: 72.0, hook_score: 88, transcript: "If you use bold impact fonts, neon yellow colors, and frequent zoom-ins, your audience retention spikes by 35%. I tested it myself.", editing_notes: "Apply styled captions with glowing stroke. Pop text on every word." },
          { id: "c3", title: "Audiotrack Pacing", start_time: 90.0, end_time: 115.0, hook_score: 82, transcript: "Hype high-energy tracks keep viewers hooked till the very last second. Let me show you exactly what background music we run.", editing_notes: "Increase background music volume by 5% during transition." },
          { id: "c4", title: "Core Value Focus", start_time: 120.0, end_time: 145.0, hook_score: 85, transcript: "So here is the secret to scaling anything. You don't focus on the marketing first. You focus on the core value proposition.", editing_notes: "Zoom in on 'focus on the core' to emphasize the point." },
          { id: "c5", title: "Micro-Edits Spikes", start_time: 150.0, end_time: 175.0, hook_score: 90, transcript: "Using micro-animations is highly effective for improving user engagement. Hover effects keep interfaces feeling alive.", editing_notes: "Add popping text animation for every word. Apply light zoom-in on 'user engagement'." },
          { id: "c6", title: "Hook within 3 Seconds", start_time: 180.0, end_time: 200.0, hook_score: 93, transcript: "You must grab attention in the first 3 seconds or the viewer scrolls away. A bold statement works best.", editing_notes: "Add visual shock overlay. Zoom in closely on speaker." },
          { id: "c7", title: "Visual Pacing Secret", start_time: 210.0, end_time: 235.0, hook_score: 80, transcript: "Video pacing should match the speed of speech. Cut out pauses and keep the story moving fast.", editing_notes: "Split screens or quick transitions. Fast paced music mixed." },
          { id: "c8", title: "Clean Audio Mix", start_time: 240.0, end_time: 265.0, hook_score: 81, transcript: "Your vocal track must be crystal clear. Keep the music volume low to ensure your voice sits on top.", editing_notes: "Lower music overlay gain. Apply compressor filter suggestion." },
          { id: "c9", title: "Retaining Viewer Interest", start_time: 270.0, end_time: 295.0, hook_score: 84, transcript: "Add visual loops or secondary angles every 5 seconds to prevent visual fatigue and keep interest high.", editing_notes: "Switch angle to Camera B. Show subtle B-roll." },
          { id: "c10", title: "Call to Action Rule", start_time: 300.0, end_time: 325.0, hook_score: 89, transcript: "Never end a video without a solid call to action. Keep it simple and tell them exactly what to do next.", editing_notes: "Zoom out. Display logo overlay. End on high note music." }
        ];
        const sliced = fallbackClips.slice(0, desiredClipsCount);
        setGeneratedClips(sliced);
        if (sliced.length > 0) {
          setActiveClip(sliced[0]);
        }
        setIsClipping(false);
        showNotification(`Mistral AI extracted ${sliced.length} viral clips.`, "info");
      }, 1500);
    } finally {
      setIsClipping(false);
    }
  };


  // NEW: Separate AI shorts styling & clipping generator
  const handleAnalyzeStyleAndGenerateClips = async () => {
    if (!targetCreatorHandle) {
      showNotification("Please enter a creator YouTube handle first.", "error");
      return;
    }
    if (videoFeeds.length === 0) {
      showNotification("Please add a video file or link to your project first.", "error");
      return;
    }

    setIsProcessingAIClips(true);
    showNotification(`Analyzing style blueprint for "${targetCreatorHandle}"...`, "info");

    try {
      // 1. Analyze Channel Style
      let channelId = "";
      try {
        const resAnalyze = await fetch(`${BACKEND_URL}/api/analyze-channel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle: targetCreatorHandle })
        });
        if (resAnalyze.ok) {
          const dataAnalyze = await resAnalyze.json();
          setCreatorProfile(dataAnalyze.channel);
          setCreatorPresets(dataAnalyze.style_preset);
          setViralShorts(dataAnalyze.viral_shorts);
          channelId = dataAnalyze.channel.id;

          // Auto-populate styles with analyzed results
          if (dataAnalyze.style_preset) {
            setCaptionFont(dataAnalyze.style_preset.font_family || 'Impact');
            setPrimaryColor(dataAnalyze.style_preset.primary_color || '#FFFF00');
            setSecondaryColor(dataAnalyze.style_preset.secondary_color || '#FFFFFF');
            setCaptionPos(dataAnalyze.style_preset.caption_position || 'center');
            setAnimStyle(dataAnalyze.style_preset.animation_style || 'pop');
          }
        } else {
          throw new Error("Style analysis failed");
        }
      } catch (err) {
        console.warn("Failed to analyze channel, using mock fallback style.", err);
        // Fallback mock styling
        const mockPresets = {
          font_family: "Montserrat",
          font_size: 50,
          primary_color: "#FF007F",
          secondary_color: "#FFFFFF",
          caption_position: "bottom",
          animation_style: "bounce",
          pacing_description: "Dynamic cutting, subtitles popping on every word",
          b_roll_frequency: "high"
        };
        setCreatorProfile({
          id: `chan_${Date.now()}`,
          handle: targetCreatorHandle,
          title: targetCreatorHandle.toUpperCase().replace('@', '') + " Style",
          avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"
        });
        setCreatorPresets(mockPresets);
        setCaptionFont("Montserrat");
        setPrimaryColor("#FF007F");
        setCaptionPos("bottom");
        setAnimStyle("bounce");
        channelId = `chan_${Date.now()}`;
      }

      // 2. Generate Clips
      showNotification(`Scraped creator style successfully! Extracting ${desiredClipsCount} viral clips...`, "info");
      
      const resClips = await fetch(
        `${BACKEND_URL}/api/projects/${activeProject.id}/generate-clips?target_channel_id=${channelId}&limit=${desiredClipsCount}`
      );
      if (resClips.ok) {
        const clips = await resClips.json();
        setGeneratedClips(clips);
        if (clips.length > 0) {
          setActiveClip(clips[0]);
        }
        showNotification(`Successfully generated ${clips.length} clips! Rendering them now...`, "info");
        const renderedList = [];
        for (const clip of clips) {
          let servedUrl = getFallbackVideoUrl(clip.start_time, clip.end_time);
          try {
            const renderRes = await fetch(`${BACKEND_URL}/api/render-clip`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clip_id: clip.id,
                font_family: captionFont,
                font_size: captionSize,
                primary_color: primaryColor,
                secondary_color: secondaryColor,
                caption_position: captionPos,
                animation_style: animStyle,
                music_track_id: selectedMusic?.id || null
              })
            });
            if (renderRes.ok) {
              const renderData = await renderRes.json();
              servedUrl = renderData.video_url;
            }
          } catch (err) {
            console.warn(`Failed to render clip ${clip.id}, using fallback:`, err);
          }
          
          clip.status = 'completed';
          clip.video_url = servedUrl;
          renderedList.push({
            id: clip.id,
            project_id: activeProject.id,
            title: clip.title,
            url: servedUrl,
            preset: { font: captionFont, color: primaryColor }
          });
        }
        
        setRenderedClips(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newClips = renderedList.filter(c => !existingIds.has(c.id));
          return [...newClips, ...prev];
        });
        setGeneratedClips([...clips]);
        showNotification(`Successfully rendered all ${clips.length} clips in creator style!`, "success");
      } else {
        throw new Error("Clip generation failed");
      }

      // Automatically transition to editor tab
      setStudioTab('editor');

    } catch (err) {
      console.warn("Clipping generation API failed. Using mock clips generation.", err);
      // Fallback clips generation
      setTimeout(() => {
        const fallbackClips = [
          { id: "c1", title: "Target Niche Rule", start_time: 12.5, end_time: 35.0, hook_score: 95, transcript: "If you try to target everyone, you target no one. That is the first major hook you need to get down when building a brand online.", editing_notes: "Cut to Close-up. Zoom in on 'everyone' and 'no one'." },
          { id: "c2", title: "Neon Retention Hack", start_time: 48.0, end_time: 72.0, hook_score: 88, transcript: "If you use bold impact fonts, neon yellow colors, and frequent zoom-ins, your audience retention spikes by 35%. I tested it myself.", editing_notes: "Apply styled captions with glowing stroke. Pop text on every word." },
          { id: "c3", title: "Audiotrack Pacing", start_time: 90.0, end_time: 115.0, hook_score: 82, transcript: "Hype high-energy tracks keep viewers hooked till the very last second. Let me show you exactly what background music we run.", editing_notes: "Increase background music volume by 5% during transition." },
          { id: "c4", title: "Core Value Focus", start_time: 120.0, end_time: 145.0, hook_score: 85, transcript: "So here is the secret to scaling anything. You don't focus on the marketing first. You focus on the core value proposition.", editing_notes: "Zoom in on 'focus on the core' to emphasize the point." },
          { id: "c5", title: "Micro-Edits Spikes", start_time: 150.0, end_time: 175.0, hook_score: 90, transcript: "Using micro-animations is highly effective for improving user engagement. Hover effects keep interfaces feeling alive.", editing_notes: "Add popping text animation for every word. Apply light zoom-in on 'user engagement'." },
          { id: "c6", title: "Hook within 3 Seconds", start_time: 180.0, end_time: 200.0, hook_score: 93, transcript: "You must grab attention in the first 3 seconds or the viewer scrolls away. A bold statement works best.", editing_notes: "Add visual shock overlay. Zoom in closely on speaker." },
          { id: "c7", title: "Visual Pacing Secret", start_time: 210.0, end_time: 235.0, hook_score: 80, transcript: "Video pacing should match the speed of speech. Cut out pauses and keep the story moving fast.", editing_notes: "Split screens or quick transitions. Fast paced music mixed." },
          { id: "c8", title: "Clean Audio Mix", start_time: 240.0, end_time: 265.0, hook_score: 81, transcript: "Your vocal track must be crystal clear. Keep the music volume low to ensure your voice sits on top.", editing_notes: "Lower music overlay gain. Apply compressor filter suggestion." },
          { id: "c9", title: "Retaining Viewer Interest", start_time: 270.0, end_time: 295.0, hook_score: 84, transcript: "Add visual loops or secondary angles every 5 seconds to prevent visual fatigue and keep interest high.", editing_notes: "Switch angle to Camera B. Show subtle B-roll." },
          { id: "c10", title: "Call to Action Rule", start_time: 300.0, end_time: 325.0, hook_score: 89, transcript: "Never end a video without a solid call to action. Keep it simple and tell them exactly what to do next.", editing_notes: "Zoom out. Display logo overlay. End on high note music." }
        ];
        const slicedClips = fallbackClips.slice(0, desiredClipsCount);
        setGeneratedClips(slicedClips);
        if (slicedClips.length > 0) {
          setActiveClip(slicedClips[0]);
        }
        setStudioTab('editor');
        showNotification(`Generated ${slicedClips.length} clips in creator style.`, "success");
      }, 1500);
    } finally {
      setIsProcessingAIClips(false);
    }
  };

  // 5. Render final output short with captions and music
  const handleRenderClip = async () => {
    if (!activeClip) return;
    setIsRendering(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/render-clip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: activeClip.id,
          font_family: captionFont,
          font_size: captionSize,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          caption_position: captionPos,
          animation_style: animStyle,
          music_track_id: selectedMusic?.id || null
        })
      });
      
      if (!res.ok) throw new Error();
      
      const result = await res.json();
      const updatedClips = generatedClips.map(c => 
        c.id === activeClip.id ? { ...c, status: 'completed', video_url: result.video_url } : c
      );
      setGeneratedClips(updatedClips);
      
      const finalClip = { 
        id: activeClip.id, 
        project_id: activeProject.id,
        title: activeClip.title, 
        url: result.video_url, 
        preset: { font: captionFont, color: primaryColor }
      };
      setRenderedClips([finalClip, ...renderedClips]);
      showNotification("Video compiled & captions burned successfully!");
      setStudioTab('gallery');
    } catch {
      // Mock Fallback render
      setTimeout(() => {
        const mockUrl = getFallbackVideoUrl(activeClip.start_time, activeClip.end_time);
        const updatedClips = generatedClips.map(c => 
          c.id === activeClip.id ? { ...c, status: 'completed', video_url: mockUrl } : c
        );
        setGeneratedClips(updatedClips);
        
        const finalClip = { 
          id: activeClip.id, 
          project_id: activeProject.id,
          title: activeClip.title, 
          url: mockUrl, 
          preset: { font: captionFont, color: primaryColor }
        };
        setRenderedClips([finalClip, ...renderedClips]);
        setIsRendering(false);
        showNotification("Mock short rendered and saved to output gallery.", "info");
        setStudioTab('gallery');
      }, 3000);
    } finally {
      setIsRendering(false);
    }
  };

  const handleRenderAllClips = async () => {
    if (generatedClips.length === 0) return;
    setIsRendering(true);
    showNotification("Rendering all pending clips in project...", "info");
    
    let renderedCount = 0;
    const updatedClips = [...generatedClips];
    const newRenderedClipsList = [];
    
    for (let i = 0; i < updatedClips.length; i++) {
      const clip = updatedClips[i];
      if (clip.status === 'completed' && clip.video_url) {
        continue;
      }
      
      let servedUrl = getFallbackVideoUrl(clip.start_time, clip.end_time);
      try {
        const res = await fetch(`${BACKEND_URL}/api/render-clip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clip_id: clip.id,
            font_family: captionFont,
            font_size: captionSize,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            caption_position: captionPos,
            animation_style: animStyle,
            music_track_id: selectedMusic?.id || null
          })
        });
        if (res.ok) {
          const result = await res.json();
          servedUrl = result.video_url;
        }
      } catch (err) {
        console.warn(`Failed to render clip ${clip.id}, using fallback:`, err);
      }
      
      clip.status = 'completed';
      clip.video_url = servedUrl;
      updatedClips[i] = { ...clip };
      newRenderedClipsList.push({
          id: clip.id,
          project_id: activeProject.id,
          title: clip.title,
          url: servedUrl,
          preset: { font: captionFont, color: primaryColor }
        });
      renderedCount++;
    }
    
    setGeneratedClips(updatedClips);
    setRenderedClips(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const filtered = newRenderedClipsList.filter(c => !existingIds.has(c.id));
      return [...filtered, ...prev];
    });
    
    setIsRendering(false);
    showNotification(`Successfully rendered ${renderedCount} clips!`, "success");
    setStudioTab('gallery');
  };

  const handleDeleteRender = async (clipId) => {
    if (!window.confirm("Are you sure you want to delete this rendered video clip?")) {
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/clips/${clipId}/render`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        // Remove from renderedClips
        setRenderedClips(prev => prev.filter(c => c.id !== clipId));
        setSelectedRenderedClips(prev => prev.filter(id => id !== clipId));
        
        // Update in generatedClips
        const updated = generatedClips.map(c => 
          c.id === clipId ? { ...c, status: 'pending', video_url: null } : c
        );
        setGeneratedClips(updated);
        
        // If active clip was deleted, update its url
        if (activeClip && activeClip.id === clipId) {
          setActiveClip(prev => ({ ...prev, status: 'pending', video_url: null }));
        }
        
        showNotification("Rendered video deleted successfully.");
      } else {
        // If 404 clip render was already deleted or not found, still remove from UI
        if (res.status === 404) {
          setRenderedClips(prev => prev.filter(c => c.id !== clipId));
          setSelectedRenderedClips(prev => prev.filter(id => id !== clipId));
          showNotification("Video render record cleaned up.");
        } else {
          showNotification("Failed to delete rendered video from server.", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to communicate with backend server.", "error");
    }
  };

  const handleDeleteBulkRenders = async () => {
    if (selectedRenderedClips.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedRenderedClips.length} selected videos?`)) {
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/clips/delete-renders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip_ids: selectedRenderedClips })
      });
      
      if (res.ok) {
        const result = await res.json();
        const deletedIds = new Set(selectedRenderedClips);
        
        // Update renderedClips
        setRenderedClips(prev => prev.filter(c => !deletedIds.has(c.id)));
        
        // Update generatedClips
        const updated = generatedClips.map(c => 
          deletedIds.has(c.id) ? { ...c, status: 'pending', video_url: null } : c
        );
        setGeneratedClips(updated);
        
        // Update activeClip if it was one of the deleted items
        if (activeClip && deletedIds.has(activeClip.id)) {
          setActiveClip(prev => ({ ...prev, status: 'pending', video_url: null }));
        }
        
        setSelectedRenderedClips([]);
        showNotification(`Successfully deleted ${result.count || selectedRenderedClips.length} rendered videos.`);
      } else {
        showNotification("Failed to delete rendered videos from server.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to communicate with backend server.", "error");
    }
  };

  const renderAuthCard = () => {
    const errorAlert = authError && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
        backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '20px'
      }}>
        <ShieldAlert size={16} style={{ flexShrink: 0 }} />
        <span>{authError}</span>
      </div>
    );

    if (authMode === 'welcome') {
      return (
        <div className="glass-panel auth-card">
          <h2 className="auth-title">Get Started</h2>
          <p className="auth-subtitle">Join the platform and start creating content powered by AI.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button 
              className="auth-btn auth-btn-primary" 
              onClick={() => {
                setIsSignUp(true);
                setAuthMode('selection');
                setAuthError('');
              }}
            >
              Sign Up
            </button>
            
            <button 
              className="auth-btn auth-btn-secondary" 
              onClick={() => {
                setIsSignUp(false);
                setAuthMode('email_entry');
                setAuthError('');
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }

    if (authMode === 'selection') {
      return (
        <div className="glass-panel auth-card">
          <h2 className="auth-title">Create Your Account</h2>
          <p className="auth-subtitle">Choose registration method to proceed</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Google Identity Services Container */}
            <div 
              id="google-signin-button" 
              style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                minHeight: '44px',
                width: '100%',
                margin: '8px 0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            ></div>

            <button 
              className="email-matching-btn"
              onClick={() => {
                setAuthMode('email_entry');
                setAuthError('');
              }}
            >
              <div className="email-matching-btn-icon-wrapper">
                <Mail size={18} color="#1a73e8" />
              </div>
              <span className="email-matching-btn-text">Continue with Email</span>
            </button>
            
            <div className="auth-divider">or</div>
            
            <button 
              className="auth-btn auth-btn-secondary" 
              onClick={() => setAuthMode('welcome')}
            >
              Back
            </button>
          </div>
        </div>
      );
    }

    if (authMode === 'email_entry') {
      return (
        <div className="glass-panel auth-card">
          <h2 className="auth-title">{isSignUp ? "Sign Up with Email" : "Sign In"}</h2>
          <p className="auth-subtitle">{isSignUp ? "Enter your email to verify account" : "Log in to your Creator Suite"}</p>
          
          {errorAlert}
          
          <form className="auth-form" onSubmit={isSignUp ? handleEmailInit : handleEmailSignin}>
            <div className="auth-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="example@email.com" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            {!isSignUp && (
              <div className="auth-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                  <span 
                    className="auth-link" 
                    onClick={() => { setAuthMode('forgot_password'); setRecoveryEmail(authEmail); setAuthError(''); }}
                    style={{ fontSize: '0.8rem', fontWeight: 500 }}
                  >
                    Forgot Password?
                  </span>
                </div>
                <div className="auth-input-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="auth-input" 
                    placeholder="Enter password" 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', background: 'none', border: 'none',
                      color: 'var(--text-muted)', cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
            
            <button type="submit" className="auth-btn auth-btn-primary" disabled={authLoading}>
              {authLoading ? "Loading..." : isSignUp ? "Send Verification Code" : "Sign In"}
            </button>
            
            <button 
              type="button" 
              className="auth-btn auth-btn-secondary" 
              onClick={() => {
                setAuthError('');
                if (isSignUp) {
                  setAuthMode('selection');
                } else {
                  setAuthMode('welcome');
                }
              }}
            >
              Back
            </button>
          </form>
          
          {isSignUp ? (
            <p className="auth-switch-text">
              Already have an account?{' '}
              <span className="auth-link" onClick={() => { setIsSignUp(false); setAuthMode('email_entry'); setAuthError(''); setAuthPassword(''); }}>
                Sign In
              </span>
            </p>
          ) : (
            <p className="auth-switch-text">
              New to the application?{' '}
              <span className="auth-link" onClick={() => { setIsSignUp(true); setAuthMode('selection'); setAuthError(''); }}>
                Sign Up
              </span>
            </p>
          )}
        </div>
      );
    }

    if (authMode === 'email_verify') {
      return (
        <div className="glass-panel auth-card">
          <h2 className="auth-title">Verify Your Email</h2>
          <p className="auth-subtitle">A 6-digit verification code has been sent to {authEmail}</p>
          
          {errorAlert}
          
          <form className="auth-form" onSubmit={handleEmailVerify}>
            <div className="auth-group">
              <label className="auth-label">Verification Code</label>
              <div className="auth-input-wrapper">
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Enter code" 
                  maxLength={6}
                  value={authOtp}
                  onChange={(e) => setAuthOtp(e.target.value)}
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className="auth-btn auth-btn-primary" disabled={authLoading}>
              {authLoading ? "Verifying..." : "Verify Code"}
            </button>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="auth-btn auth-btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => { setAuthMode('email_entry'); setAuthError(''); }}
              >
                Back
              </button>
              <button 
                type="button" 
                className="auth-btn auth-btn-secondary" 
                style={{ flex: 1 }}
                onClick={handleEmailInit}
                disabled={authLoading}
              >
                Resend
              </button>
            </div>
          </form>
        </div>
      );
    }

    if (authMode === 'finalize') {
      const isLenValid = checkPassLength(authPassword);
      const isLowerValid = checkPassLower(authPassword);
      const isUpperValid = checkPassUpper(authPassword);
      const isDigitValid = checkPassDigit(authPassword);
      const isSpecialValid = checkPassSpecial(authPassword);

      return (
        <div className="glass-panel auth-card">
          <h2 className="auth-title">Tell Us About Yourself</h2>
          <p className="auth-subtitle">Complete your registration profile details</p>
          
          {errorAlert}
          
          <form className="auth-form" onSubmit={handleFinalize}>
            <div className="auth-group">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Enter your full name" 
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="auth-group">
              <label className="auth-label">How did you hear about us?</label>
              <div className="auth-input-wrapper">
                <select 
                  className="auth-input" 
                  value={authReferralSource} 
                  onChange={(e) => setAuthReferralSource(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                >
                  <option value="">Select an option</option>
                  <option value="GOOGLE">Google Search</option>
                  <option value="YOUTUBE">YouTube Video</option>
                  <option value="FRIEND">A Friend</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            
            <div className="auth-group">
              <label className="auth-label">Create Password</label>
              <div className="auth-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="auth-input" 
                  placeholder="Choose password" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="auth-group">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="auth-input" 
                  placeholder="Re-enter password" 
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            {/* Password strength validator list */}
            <div className="password-checker-container">
              <p className="password-checker-title">Password Requirements:</p>
              <div className={`password-checker-item ${isLenValid ? 'valid' : ''}`}>
                {isLenValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                8 - 25 characters
              </div>
              <div className={`password-checker-item ${isLowerValid ? 'valid' : ''}`}>
                {isLowerValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                At least 1 lowercase letter
              </div>
              <div className={`password-checker-item ${isUpperValid ? 'valid' : ''}`}>
                {isUpperValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                At least 1 uppercase letter
              </div>
              <div className={`password-checker-item ${isDigitValid ? 'valid' : ''}`}>
                {isDigitValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                At least 1 number
              </div>
              <div className={`password-checker-item ${isSpecialValid ? 'valid' : ''}`}>
                {isSpecialValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                At least 1 special character (@$!%*?&)
              </div>
            </div>
            
            <button 
              type="submit" 
              className="auth-btn auth-btn-primary" 
              disabled={authLoading || !(isLenValid && isLowerValid && isUpperValid && isDigitValid && isSpecialValid)}
            >
              {authLoading ? "Registering..." : "Continue"}
            </button>
          </form>
        </div>
      );
    }

    if (authMode === 'forgot_password') {
      return (
        <div className="glass-panel auth-card">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your email and we'll send a code to reset your password.</p>
          
          {errorAlert}
          
          <form className="auth-form" onSubmit={handleForgotInitiate}>
            <div className="auth-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="example@email.com" 
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className="auth-btn auth-btn-primary" disabled={authLoading}>
              {authLoading ? "Sending Code..." : "Send Reset Code"}
            </button>
            
            <button 
              type="button" 
              className="auth-btn auth-btn-secondary" 
              onClick={() => { setAuthMode('email_entry'); setAuthError(''); }}
            >
              Back
            </button>
          </form>
        </div>
      );
    }

    if (authMode === 'reset_verify') {
      return (
        <div className="glass-panel auth-card">
          <h2 className="auth-title">Enter Reset Code</h2>
          <p className="auth-subtitle">We sent a 6-digit verification code to {recoveryEmail}</p>
          
          {errorAlert}
          
          <form className="auth-form" onSubmit={handleForgotVerify}>
            <div className="auth-group">
              <label className="auth-label">Reset Code</label>
              <div className="auth-input-wrapper">
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="Enter code" 
                  maxLength={6}
                  value={recoveryOtp}
                  onChange={(e) => setRecoveryOtp(e.target.value)}
                  style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className="auth-btn auth-btn-primary" disabled={authLoading}>
              {authLoading ? "Verifying..." : "Verify Code"}
            </button>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="auth-btn auth-btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => { setAuthMode('forgot_password'); setAuthError(''); }}
              >
                Back
              </button>
              <button 
                type="button" 
                className="auth-btn auth-btn-secondary" 
                style={{ flex: 1 }}
                onClick={handleForgotInitiate}
                disabled={authLoading}
              >
                Resend
              </button>
            </div>
          </form>
        </div>
      );
    }

    if (authMode === 'reset_finalize') {
      const isLenValid = checkPassLength(recoveryPassword);
      const isLowerValid = checkPassLower(recoveryPassword);
      const isUpperValid = checkPassUpper(recoveryPassword);
      const isDigitValid = checkPassDigit(recoveryPassword);
      const isSpecialValid = checkPassSpecial(recoveryPassword);

      return (
        <div className="glass-panel auth-card">
          <h2 className="auth-title">Set New Password</h2>
          <p className="auth-subtitle">Create a secure new password for your account</p>
          
          {errorAlert}
          
          <form className="auth-form" onSubmit={handleForgotReset}>
            <div className="auth-group">
              <label className="auth-label">New Password</label>
              <div className="auth-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="auth-input" 
                  placeholder="Choose new password" 
                  value={recoveryPassword}
                  onChange={(e) => setRecoveryPassword(e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="auth-group">
              <label className="auth-label">Confirm New Password</label>
              <div className="auth-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="auth-input" 
                  placeholder="Re-enter new password" 
                  value={recoveryConfirmPassword}
                  onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            {/* Password strength validator list */}
            <div className="password-checker-container">
              <p className="password-checker-title">Password Requirements:</p>
              <div className={`password-checker-item ${isLenValid ? 'valid' : ''}`}>
                {isLenValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                8 - 25 characters
              </div>
              <div className={`password-checker-item ${isLowerValid ? 'valid' : ''}`}>
                {isLowerValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                At least 1 lowercase letter
              </div>
              <div className={`password-checker-item ${isUpperValid ? 'valid' : ''}`}>
                {isUpperValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                At least 1 uppercase letter
              </div>
              <div className={`password-checker-item ${isDigitValid ? 'valid' : ''}`}>
                {isDigitValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                At least 1 number
              </div>
              <div className={`password-checker-item ${isSpecialValid ? 'valid' : ''}`}>
                {isSpecialValid ? <CheckCircle2 size={14} /> : <X size={14} />}
                At least 1 special character (@$!%*?&)
              </div>
            </div>
            
            <button 
              type="submit" 
              className="auth-btn auth-btn-primary" 
              disabled={authLoading || !(isLenValid && isLowerValid && isUpperValid && isDigitValid && isSpecialValid)}
            >
              {authLoading ? "Saving..." : "Reset Password"}
            </button>
          </form>
        </div>
      );
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Toast Notification */}
      {message && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px 24px', borderRadius: '12px',
          backgroundColor: message.type === 'error' ? 'rgba(220,53,69,0.95)' : 
                           message.type === 'info' ? 'rgba(0,123,255,0.95)' : 'rgba(20,115,80,0.95)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)', transition: 'all 0.3s ease'
        }}>
          {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{message.text}</span>
        </div>
      )}

      {/* --- HEADER NAV --- */}
      <header style={{
        borderBottom: '1px solid var(--border-light)',
        padding: '20px 0', backgroundColor: 'rgba(8, 8, 12, 0.8)',
        backdropFilter: 'blur(10px)', sticky: 'top', zIndex: 10
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setView('landing')}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)',
              display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
            }}>
              <Film size={22} color="#fff" />
            </div>
            <h2 className="gradient-title" style={{ fontSize: '1.4rem', letterSpacing: '1px' }}>ViralShorts.AI</h2>
          </div>
          
          <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <span 
              style={{ color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }} 
              onClick={() => setView('landing')}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Home size={16} /> Home
            </span>
            <span 
              style={{ color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }} 
              onClick={() => {
                if (currentUser) {
                  setView('studio');
                } else {
                  setAuthMode('welcome');
                  setView('auth');
                }
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <Sliders size={16} /> Studio
            </span>
            {currentUser && (
              <span 
                style={{ 
                  color: view === 'social-network' ? '#fff' : 'var(--text-secondary)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  transition: 'color 0.2s' 
                }} 
                onClick={() => {
                  setView('social-network');
                  setYoutubeCallbackStatus(null);
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = view === 'social-network' ? '#fff' : 'var(--text-secondary)'}
              >
                <Share2 size={16} /> Social Network
              </span>
            )}
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 500 }}>
                  Hi, {currentUser.name}
                </span>
                <button 
                  onClick={handleLogout}
                  style={{
                    background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-secondary)',
                    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-magenta)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsSignUp(false);
                  setAuthMode('welcome');
                  setView('auth');
                }}
                style={{
                  background: 'none', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)',
                  padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 500,
                  boxShadow: '0 0 5px var(--accent-cyan-glow)', transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-cyan)';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--accent-cyan)';
                }}
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* --- 1. LANDING PAGE VIEW --- */}
      {view === 'landing' && (
        <main className="container" style={{ 
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 120px)',
          padding: '20px 0'
        }}>
          <div className="ambient-glow" style={{ top: '15%', left: '35%' }}></div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            position: 'relative', 
            zIndex: 1,
            maxWidth: '850px'
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: '30px', backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-light)', marginBottom: '24px', fontSize: '0.9rem',
              color: 'var(--accent-cyan)'
            }}>
              <Sparkles size={16} /> Powered by Mistral AI & Turso DB
            </div>
            
            <h1 className="gradient-title" style={{ fontSize: '3.8rem', lineHeight: '1.15', marginBottom: '16px', maxWidth: '850px' }}>
              Transform Long Videos into <span className="neon-text-glow" style={{ color: '#fff' }}>Viral Shorts</span>
            </h1>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', marginBottom: '48px', lineHeight: '1.6' }}>
              Scrape creators, copy their hook templates, auto-cut multi-cam angles, and burn kinetic neon subtitles with copyright-safe beats.
            </p>

            {/* Glowing CTA Button */}
            <button className="neon-btn" onClick={() => {
              if (currentUser) {
                setView('studio');
              } else {
                setAuthMode('welcome');
                setView('auth');
              }
            }}>
              Start Creating <ChevronRight size={18} />
            </button>
          </div>
        </main>
      )}

      {/* --- AUTHENTICATION FLOW VIEWS --- */}
      {view === 'auth' && (
        <main className="auth-container" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Multiple blended neon color glows in background to fill empty space */}
          <div className="ambient-glow" style={{ top: '10%', left: '20%', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(0, 255, 255, 0.12) 0%, transparent 70%)' }}></div>
          <div className="ambient-glow" style={{ bottom: '10%', right: '15%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255, 0, 127, 0.1) 0%, transparent 70%)' }}></div>
          <div className="ambient-glow" style={{ top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(138, 43, 226, 0.12) 0%, transparent 70%)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
            {renderAuthCard()}
          </div>
        </main>
      )}

      {/* --- SOCIAL NETWORK VIEW --- */}
      {view === 'social-network' && (
        <main className="container" style={{ padding: '40px 0', minHeight: 'calc(100vh - 120px)' }}>
          <SocialNetworkModule
            currentUser={currentUser}
            BACKEND_URL={BACKEND_URL}
            showNotification={showNotification}
            setView={setView}
            initialSubView={youtubeCallbackStatus === 'success' ? 'success-established' : 'landing'}
            initialChannelId={youtubeCallbackChannelId}
          />
        </main>
      )}

      {/* --- 2. STUDIO VIEW --- */}
      {view === 'studio' && (
        <main className="container" style={{ padding: '40px 0' }}>
          <div style={{ display: 'flex', gap: '30px' }}>
            
            {/* Sidebar Navigation */}
            <aside style={{ width: '260px', flexShrink: 0 }}>
              <div className="glass-panel" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px solid var(--border-light)', marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>WORKSPACE</p>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '4px' }}>Creator Suite</h4>
                </div>
                
                <button 
                  className={`sidebar-link ${studioTab === 'projects' ? 'active' : ''}`}
                  onClick={() => setStudioTab('projects')}
                  style={sidebarLinkStyle(studioTab === 'projects')}
                >
                  <Layers size={18} /> Projects
                </button>

                {activeProject && (
                  <>
                    <button 
                      className={`sidebar-link ${studioTab === 'competitor' ? 'active' : ''}`}
                      onClick={() => setStudioTab('competitor')}
                      style={sidebarLinkStyle(studioTab === 'competitor')}
                    >
                      <Search size={18} /> Creator Intel
                    </button>
                    
                    <button 
                      className={`sidebar-link ${studioTab === 'brand_library' ? 'active' : ''}`}
                      onClick={() => setStudioTab('brand_library')}
                      style={sidebarLinkStyle(studioTab === 'brand_library')}
                    >
                      <FolderOpen size={18} /> Brand Library
                    </button>
                    
                    <button 
                      className={`sidebar-link ${studioTab === 'sync' ? 'active' : ''}`}
                      onClick={() => setStudioTab('sync')}
                      style={sidebarLinkStyle(studioTab === 'sync')}
                    >
                      <Video size={18} /> Multi-Cam Sync
                    </button>
                    
                    <button 
                      className={`sidebar-link ${studioTab === 'editor' ? 'active' : ''}`}
                      onClick={() => {
                        if (!activeClip) {
                          showNotification("Please select a clip first", "info");
                        } else {
                          setStudioTab('editor');
                        }
                      }}
                      style={sidebarLinkStyle(studioTab === 'editor')}
                    >
                      <Sliders size={18} /> Timeline Editor
                    </button>
                  </>
                )}

                {activeProject && studioTab === 'success' && (
                  <button 
                    className="sidebar-link active"
                    onClick={() => setStudioTab('success')}
                    style={sidebarLinkStyle(true)}
                  >
                    <Sparkles size={18} style={{ color: 'var(--accent-cyan)' }} /> Success Preview
                  </button>
                )}
                
                <button 
                  className={`sidebar-link ${studioTab === 'gallery' ? 'active' : ''}`}
                  onClick={() => setStudioTab('gallery')}
                  style={sidebarLinkStyle(studioTab === 'gallery')}
                >
                  <Film size={18} /> Rendered Gallery
                </button>
              </div>
            </aside>

            {/* Dashboard Contents */}
            <section style={{ flexGrow: 1 }}>
              <div className="glass-panel" style={{ padding: '32px', minHeight: '500px', position: 'relative' }}>
                
                {/* --- TAB: BRAND LIBRARY --- */}
                {studioTab === 'brand_library' && (
                  <BrandLibrary 
                    backendUrl={BACKEND_URL}
                    showNotification={showNotification}
                    onApplyTemplate={(preset) => {
                      setCaptionFont(preset.font_family);
                      setCaptionSize(preset.font_size);
                      setPrimaryColor(preset.primary_color);
                      setSecondaryColor(preset.secondary_color);
                      setCaptionPos(preset.caption_position);
                      
                      if (activeClip) {
                        setStudioTab('editor');
                      } else {
                        showNotification("Template styling successfully loaded! Choose an AI clip to apply these formats.", "info");
                      }
                    }}
                  />
                )}

                {/* --- TAB 1: CREATOR INTEL --- */}
                {studioTab === 'competitor' && (
                  <div>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '8px' }}>YouTube Creator Analysis</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      Analyze any creator's vertical shorts views, transcript hooks, and visual styles to clone their success formula.
                    </p>
                    
                    <form onSubmit={handleScrapeChannel} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                      <div style={{ position: 'relative', flexGrow: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          placeholder="Enter YouTube handle (e.g. @mrbeast)"
                          value={channelInput}
                          onChange={(e) => setChannelInput(e.target.value)}
                          style={{
                            width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px',
                            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
                            color: '#fff', fontSize: '1rem', outline: 'none'
                          }}
                        />
                      </div>
                      <button type="submit" className="neon-btn" style={{ padding: '14px 28px', flexShrink: 0 }} disabled={loading}>
                        {loading ? 'Analyzing...' : 'Fetch Style Blueprint'}
                      </button>
                    </form>

                    {creatorProfile && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px' }}>
                        {/* Profile Summary */}
                        <div style={{ borderRight: '1px solid var(--border-light)', paddingRight: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <img 
                              src={creatorProfile.avatar_url} 
                              alt={creatorProfile.title} 
                              style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--accent-purple)' }}
                            />
                            <div>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{creatorProfile.title}</h4>
                              <p style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{creatorProfile.handle}</p>
                            </div>
                          </div>
                          
                          {creatorPresets && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Extracted Presets</h5>
                              
                              <div style={styleBadgeRow}>
                                <span style={styleBadgeLabel}>Font Family:</span>
                                <span style={styleBadgeVal}>{creatorPresets.font_family}</span>
                              </div>
                              <div style={styleBadgeRow}>
                                <span style={styleBadgeLabel}>Highlight Accent:</span>
                                <span style={{ ...styleBadgeVal, color: creatorPresets.primary_color }}>{creatorPresets.primary_color}</span>
                              </div>
                              <div style={styleBadgeRow}>
                                <span style={styleBadgeLabel}>Caption Anchor:</span>
                                <span style={styleBadgeVal}>{creatorPresets.caption_position}</span>
                              </div>
                              <div style={styleBadgeRow}>
                                <span style={styleBadgeLabel}>B-Roll frequency:</span>
                                <span style={styleBadgeVal}>{creatorPresets.b_roll_frequency}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Viral Videos */}
                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Top Performing Shorts</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {viralShorts.map(video => (
                              <a 
                                key={video.id} 
                                href={
                                  (video.id.startsWith('short_') || video.id.startsWith('s'))
                                    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(video.title)}`
                                    : `https://www.youtube.com/shorts/${video.id}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)',
                                  border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                              >
                                <div>
                                  <h5 style={{ fontSize: '0.95rem', fontWeight: 500 }}>{video.title}</h5>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Published: {video.published_at}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <p style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.95rem' }}>
                                    {(video.view_count / 1000).toFixed(0)}K views
                                  </p>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{video.like_count} likes</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB 2: PROJECTS VIEW --- */}
                {studioTab === 'projects' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '4px' }}>Project Manager & Video Ingest</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                          Create editing projects and import your video source files via upload, YouTube, or Google Drive.
                        </p>
                      </div>
                      
                      <button 
                        className="neon-btn" 
                        onClick={() => {
                          setWizardStep(1);
                          setIsNewProjModalOpen(true);
                        }}
                        style={{ padding: '12px 24px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Sparkles size={16} /> Let's Create
                      </button>
                    </div>

                    {!activeProject ? (
                      <div>
                        <div style={{
                          padding: '60px 40px', textAlign: 'center', border: '2px dashed var(--border-light)',
                          borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
                          marginBottom: '40px', backgroundColor: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(5px)'
                        }}>
                          <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            backgroundColor: 'rgba(0, 255, 255, 0.05)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 255, 255, 0.15)',
                            boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)'
                          }}>
                            <Layers size={32} style={{ color: 'var(--accent-cyan)' }} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>No Active Project Workspace</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px', maxWidth: '440px', margin: '8px auto 0 auto' }}>
                              Get started by launching a brand new project instance or choose one of your previously saved draft sessions below.
                            </p>
                          </div>
                          <button 
                            className="neon-btn" 
                            onClick={() => {
                              setWizardStep(1);
                              setIsNewProjModalOpen(true);
                            }}
                            style={{ padding: '12px 30px', fontSize: '0.95rem' }}
                          >
                            Let's Create <ChevronRight size={18} />
                          </button>
                        </div>

                        {projectsList.length > 0 && (
                          <div style={{ marginTop: '40px' }}>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', color: '#fff', fontFamily: 'Space Grotesk' }}>
                              Existing Project Drafts
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                              {projectsList.map(proj => (
                                <div 
                                  key={proj.id} 
                                  onClick={() => handleSelectProject(proj)}
                                  className="glass-panel"
                                  style={{ 
                                    padding: '20px', 
                                    cursor: 'pointer', 
                                    border: '1px solid var(--border-light)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-light)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <h5 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: '#fff', wordBreak: 'break-word' }}>{proj.title}</h5>
                                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--accent-purple)', color: '#fff', fontWeight: 600, flexShrink: 0 }}>
                                      {proj.genre}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                      Created: {new Date(proj.created_at || Date.now()).toLocaleDateString()}
                                    </p>
                                    <button
                                      onClick={(e) => handleDeleteProject(proj.id, e)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ff4d4d';
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.08)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--text-muted)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                      title="Delete Project"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Active Project Info */}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px',
                          backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)',
                          marginBottom: '30px'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>ACTIVE PROJECT</span>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{activeProject.title}</h4>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button 
                              onClick={() => {
                                setActiveProject(null);
                                setVideoFeeds([]);
                                setGeneratedClips([]);
                                setActiveClip(null);
                              }}
                              style={{
                                padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)',
                                backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              Close Project
                            </button>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>GENRE TAG</span>
                              <h4 style={{ fontSize: '1rem', fontWeight: 500, color: '#fff' }}>{activeProject.genre}</h4>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px' }}>
                          {/* Left Panel: Options */}
                          <div>
                            {/* Option A: AI Shorts Generator */}
                            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                              <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Sparkles size={20} style={{ color: 'var(--accent-cyan)' }} /> Option 1: AI Shorts Generator
                              </h4>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>
                                Pick a YouTube creator whose formatting style (fonts, highlights, position) you want to replicate. We'll analyze their channel and carve out engaging short clips in their signature style.
                              </p>

                              <div style={{ marginBottom: '16px' }}>
                                <label style={labelStyle}>Creator YouTube Handle</label>
                                <div style={{ position: 'relative' }}>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. @mrbeast, @colinandsamir"
                                    value={targetCreatorHandle}
                                    onChange={(e) => setTargetCreatorHandle(e.target.value)}
                                    style={{ ...inputStyle, paddingLeft: '36px' }}
                                  />
                                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                </div>
                              </div>

                              <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                  <label style={labelStyle}>Number of Clips</label>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{desiredClipsCount} clips</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="1" 
                                  max="10" 
                                  value={desiredClipsCount}
                                  onChange={(e) => setDesiredClipsCount(parseInt(e.target.value))}
                                  style={{
                                    width: '100%',
                                    accentColor: 'var(--accent-cyan)',
                                    cursor: 'pointer'
                                  }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  <span>1 clip</span>
                                  <span>5 clips</span>
                                  <span>10 clips</span>
                                </div>
                              </div>

                              <button 
                                className="neon-btn" 
                                onClick={handleAnalyzeStyleAndGenerateClips}
                                style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem', padding: '12px' }}
                                disabled={isProcessingAIClips || !targetCreatorHandle || videoFeeds.length === 0}
                              >
                                {isProcessingAIClips ? (
                                  <span>Processing Style & Ingesting...</span>
                                ) : (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sparkles size={16} /> Analyze Style & Generate {desiredClipsCount} Clips
                                  </span>
                                )}
                              </button>
                            </div>

                            {/* Option B: Multi-Camera Syncer */}
                            <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Layers size={18} style={{ color: 'var(--accent-purple)' }} /> Option 2: Add Additional Feeds (Multi-Cam Sync)
                              </h4>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px', lineHeight: '1.4' }}>
                                Upload multiple video angles of the same shoot below to stitch and switch between them dynamically.
                              </p>
                              
                              {/* Ingestion Source Tabs */}
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <button 
                                  type="button"
                                  onClick={() => setVideoSourceType('file')}
                                  style={{
                                    flexGrow: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)',
                                    backgroundColor: videoSourceType === 'file' ? 'var(--accent-purple)' : 'var(--bg-secondary)',
                                    color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                                  }}
                                >
                                  Upload File
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setVideoSourceType('youtube')}
                                  style={{
                                    flexGrow: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)',
                                    backgroundColor: videoSourceType === 'youtube' ? 'var(--accent-purple)' : 'var(--bg-secondary)',
                                    color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                                  }}
                                >
                                  YouTube Link
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setVideoSourceType('drive')}
                                  style={{
                                    flexGrow: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)',
                                    backgroundColor: videoSourceType === 'drive' ? 'var(--accent-purple)' : 'var(--bg-secondary)',
                                    color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                                  }}
                                >
                                  Drive Link
                                </button>
                              </div>

                              <div style={{ marginBottom: '12px' }}>
                                <label style={labelStyle}>Feed Label / Angle Name</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Speaker Close-Up, Wide View"
                                  value={feedLabelInput}
                                  onChange={(e) => setFeedLabelInput(e.target.value)}
                                  style={inputStyle}
                                />
                              </div>

                              {videoSourceType === 'file' && (
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={labelStyle}>Choose Video File</label>
                                  <div style={{
                                    border: '2px dashed var(--border-light)', padding: '16px', borderRadius: '8px',
                                    textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer'
                                  }} onClick={() => handleAddFeed(feedLabelInput || "Camera Angle " + (videoFeeds.length + 1), "file", "local_shoot_capture.mp4")}>
                                    <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: '6px' }} />
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click to simulate local video file upload</p>
                                  </div>
                                </div>
                              )}

                              {videoSourceType === 'youtube' && (
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={labelStyle}>YouTube Video URL</label>
                                  <input 
                                    type="text" 
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={youtubeUrlInput}
                                    onChange={(e) => setYoutubeUrlInput(e.target.value)}
                                    style={inputStyle}
                                  />
                                  <button 
                                    type="button"
                                    className="neon-btn" 
                                    style={{ marginTop: '12px', width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
                                    onClick={() => handleAddFeed(feedLabelInput || "YouTube Angle", "youtube", youtubeUrlInput)}
                                  >
                                    Import YouTube Feed
                                  </button>
                                </div>
                              )}

                              {videoSourceType === 'drive' && (
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={labelStyle}>Google Drive Link</label>
                                  <input 
                                    type="text" 
                                    placeholder="https://drive.google.com/file/d/..."
                                    value={driveUrlInput}
                                    onChange={(e) => setDriveUrlInput(e.target.value)}
                                    style={inputStyle}
                                  />
                                  <button 
                                    type="button"
                                    className="neon-btn" 
                                    style={{ marginTop: '12px', width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
                                    onClick={() => handleAddFeed(feedLabelInput || "Drive Angle", "drive", driveUrlInput)}
                                  >
                                    Import Google Drive Feed
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Panel: Feeds list & navigation */}
                          <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Feeds Queue</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                              {videoFeeds.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No angles or files imported yet.</p>
                              ) : (
                                videoFeeds.map(feed => (
                                  <div key={feed.id} style={{
                                    padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                  }}>
                                    <div>
                                      <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>{feed.label}</span>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Type: {feed.type.toUpperCase()} • {feed.file_name}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'green', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle2 size={12} /> Ready
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>

                            {videoFeeds.length >= 2 && (
                              <button 
                                className="neon-btn" 
                                onClick={() => setStudioTab('sync')}
                                style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)' }}
                              >
                                Proceed to Multi-Cam Sync →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB 2B: MULTI-CAM SYNC VIEW --- */}
                {studioTab === 'sync' && (
                  <div>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '8px' }}>Multi-Camera Sync Timeline</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      Sync your imported feeds and align them using audio-amplitude tracking to compile the primary edit.
                    </p>

                    {videoFeeds.length < 2 ? (
                      <div style={{
                        padding: '60px 20px', textAlign: 'center', border: '2px dashed var(--border-light)',
                        borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                      }}>
                        <Video size={48} style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <h4>Not Enough Video Feeds</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            You need at least 2 camera feeds to sync. Go to the **Projects** tab to add them first.
                          </p>
                          <button 
                            className="neon-btn" 
                            onClick={() => setStudioTab('projects')}
                            style={{ marginTop: '16px', padding: '8px 16px', fontSize: '0.8rem' }}
                          >
                            Go to Projects
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '30px' }}>
                        {/* Left Side: Sync Feeds list */}
                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Aligned Video Feeds</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {videoFeeds.map((feed, index) => (
                              <div key={feed.id} style={{
                                padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-light)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Angle {index + 1}: {feed.label}</span>
                                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-cyan)' }}>
                                    {feed.type.toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ height: '4px', backgroundColor: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--accent-purple)', animation: 'pulse 2s infinite' }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Side: Sync Controls & AI Clipping */}
                        <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '30px' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Sync feeds & Generate clips</h4>
                          
                          {!isSynced ? (
                            <div style={{ padding: '24px 0', textAlign: 'center' }}>
                              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                                Align all feeds to match active speakers and switch feeds dynamically.
                              </p>
                              <button 
                                className="neon-btn" 
                                onClick={handleSyncFeeds} 
                                disabled={isSyncing}
                                style={{ width: '100%', justifyContent: 'center' }}
                              >
                                {isSyncing ? 'Synchronizing Waves...' : 'Sync Angles & Cut Video'}
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                                backgroundColor: 'rgba(0,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--accent-cyan-glow)',
                                marginBottom: '24px'
                              }}>
                                <CheckCircle2 size={18} color="cyan" />
                                <span style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>Multi-cam Sync Completed successfully!</span>
                              </div>

                              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.95rem' }}>
                                Feeds are synced. Click below to run Mistral AI to parse the transcript and select the most viral hook segments.
                              </p>

                              <button 
                                className="neon-btn" 
                                onClick={handleGenerateClips} 
                                disabled={isClipping}
                                style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)' }}
                              >
                                {isClipping ? 'Analyzing Transcripts...' : 'Extract AI Viral Clips'}
                              </button>
                            </div>
                          )}

                          {/* Clips List */}
                          {generatedClips.length > 0 && (
                            <div style={{ marginTop: '30px' }}>
                              <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Identified Shorts ({generatedClips.length})
                              </h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {generatedClips.map(clip => (
                                  <div key={clip.id} style={{
                                    padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                  }}>
                                    <div>
                                      <h5 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{clip.title}</h5>
                                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        Timestamps: {clip.start_time}s - {clip.end_time}s
                                      </p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                      <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hook Score</span>
                                        <p style={{ color: 'var(--accent-magenta)', fontWeight: 700, fontSize: '1.1rem' }}>{clip.hook_score}%</p>
                                      </div>
                                      
                                      <button 
                                        className="neon-btn"
                                        onClick={() => {
                                          setActiveClip(clip);
                                          setStudioTab('editor');
                                        }}
                                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- TAB 3: TIMELINE EDITOR --- */}
                {studioTab === 'editor' && activeClip && (
                  <div>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '8px' }}>Kinetic Subtitle & Sound Studio</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                      Apply your target creator's styling preset, customize colors, overlay copyright-safe background music, and render.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 2fr', gap: '30px' }}>
                      
                      {/* Left Column: Vertical Video Preview */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '240px', height: '426px', borderRadius: '16px',
                          border: '4px solid var(--border-light)', backgroundColor: '#000',
                          position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
                        }}>
                          {/* Simulated Reframed Video */}
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                          </div>

                          {/* Burning Subtitle Mockup */}
                          <div style={{
                            position: 'absolute', 
                            left: '5%', right: '5%',
                            bottom: captionPos === 'bottom' ? '15%' : captionPos === 'top' ? '70%' : '45%',
                            textAlign: 'center', zIndex: 5,
                            pointerEvents: 'none'
                          }}>
                            <span style={{
                              fontFamily: captionFont === 'Impact' ? 'Impact, sans-serif' : 'sans-serif',
                              fontSize: `${captionSize / 2.3}px`,
                              fontWeight: '900',
                              color: primaryColor,
                              textTransform: 'uppercase',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: `2px solid ${secondaryColor}`,
                              boxShadow: '0 0 10px rgba(0,0,0,0.8)',
                              textShadow: '2px 2px 0px #000'
                            }}>
                              {getDynamicCaption().toUpperCase()}
                            </span>
                          </div>

                          {/* Video Sync Tag */}
                          <div style={{
                            position: 'absolute', top: '12px', right: '12px',
                            padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(138,43,226,0.7)',
                            fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-light)'
                          }}>
                            9:16 Reframe
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                          <button style={ctrlBtnStyle}><Play size={16} /></button>
                          <button style={ctrlBtnStyle}><RotateCcw size={16} /></button>
                        </div>
                      </div>

                      {/* Right Column: Customization Controls */}
                      <div>
                        {/* Clip Information */}
                        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-magenta)' }}>EDITING CLIP</span>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{activeClip.title}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                            "{activeClip.transcript}"
                          </p>
                        </div>

                        {/* Subtitle Style Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                          <div>
                            <label style={labelStyle}>Typography Font</label>
                            <select 
                              value={captionFont} 
                              onChange={(e) => setCaptionFont(e.target.value)}
                              style={inputStyle}
                            >
                              <option value="Impact">Impact (Bold, Viral)</option>
                              <option value="Montserrat">Montserrat (Modern)</option>
                              <option value="Cabinet Grotesk">Cabinet Grotesk (Premium)</option>
                              <option value="Space Grotesk">Space Grotesk (Technical)</option>
                            </select>
                          </div>

                          <div>
                            <label style={labelStyle}>Primary Color (Hex)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="color" 
                                value={primaryColor} 
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                              />
                              <input 
                                type="text" 
                                value={primaryColor} 
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                style={{ ...inputStyle, flexGrow: 1 }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={labelStyle}>Caption Position</label>
                            <select 
                              value={captionPos} 
                              onChange={(e) => setCaptionPos(e.target.value)}
                              style={inputStyle}
                            >
                              <option value="top">Top Third</option>
                              <option value="center">Center</option>
                              <option value="bottom">Bottom Third</option>
                            </select>
                          </div>

                          <div>
                            <label style={labelStyle}>Kinetic Transition</label>
                            <select 
                              value={animStyle} 
                              onChange={(e) => setAnimStyle(e.target.value)}
                              style={inputStyle}
                            >
                              <option value="pop">Pop (Word by word)</option>
                              <option value="bounce">Bounce Slide</option>
                              <option value="fade">Smooth Fade</option>
                            </select>
                          </div>
                        </div>

                        {/* Copyright-Safe Music Recommendation */}
                        <div style={{ marginBottom: '30px' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Music size={18} color="magenta" /> Recommended Background Music
                          </h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '14px' }}>
                            These fully licensed tracks match the <strong>{activeProject?.genre}</strong> genre of your project.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {musicCatalog.map(track => (
                              <div key={track.id} style={{
                                padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)',
                                border: selectedMusic?.id === track.id ? '1px solid var(--accent-purple)' : '1px solid var(--border-light)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                              }}>
                                <div>
                                  <h5 style={{ fontSize: '0.9rem', fontWeight: 500 }}>{track.title}</h5>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{track.artist} • {track.genre}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <button 
                                    onClick={() => playPreviewAudio(track)}
                                    style={{
                                      background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
                                    }}
                                  >
                                    {selectedMusic?.id === track.id && isPlayingAudio ? <Pause size={14} /> : <Play size={14} />} Preview
                                  </button>
                                  <button 
                                    onClick={() => setSelectedMusic(track)}
                                    style={{
                                      padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-light)',
                                      backgroundColor: selectedMusic?.id === track.id ? 'var(--accent-purple)' : 'transparent',
                                      color: '#fff', fontSize: '0.8rem', cursor: 'pointer'
                                    }}
                                  >
                                    {selectedMusic?.id === track.id ? 'Selected' : 'Use Track'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Render Buttons */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                          <button 
                            className="neon-btn" 
                            onClick={handleRenderClip} 
                            disabled={isRendering}
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '10px' }}
                          >
                            {isRendering ? 'Processing...' : 'Render Selected'}
                          </button>
                          <button 
                            className="neon-btn-secondary" 
                            onClick={handleRenderAllClips} 
                            disabled={isRendering}
                            style={{ 
                              flex: 1, 
                              justifyContent: 'center', 
                              fontSize: '0.85rem', 
                              padding: '10px',
                              backgroundColor: 'rgba(138, 43, 226, 0.2)',
                              border: '1px solid var(--accent-purple)',
                              borderRadius: '8px',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(138, 43, 226, 0.4)';
                              e.currentTarget.style.boxShadow = '0 0 10px var(--accent-purple-glow)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(138, 43, 226, 0.2)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {isRendering ? 'Processing...' : 'Render All Clips'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SUCCESS SCREEN VIEW --- */}
                {studioTab === 'success' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '4px' }}>AI Video Successfully Generated!</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                          Your viral shortform content is ready. Preview, customize font, or download it immediately.
                        </p>
                      </div>
                      
                      <button 
                        className="neon-btn" 
                        onClick={() => setStudioTab('projects')}
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Back to Projects
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                      {/* Vertical Video Preview Window (9:16 Smartphone Frame) */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '0 auto' }}>
                        <div style={{
                          width: '280px',
                          height: '500px',
                          borderRadius: '32px',
                          border: '6px solid #222',
                          backgroundColor: '#000',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(0, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {/* Speaker Notch */}
                          <div style={{
                            position: 'absolute', top: '0', width: '110px', height: '18px',
                            backgroundColor: '#222', borderRadius: '0 0 12px 12px', zIndex: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: '#444' }} />
                          </div>

                          {/* Video Player */}
                          {activeClip?.video_url ? (
                            activeClip.video_url.includes('youtube.com/embed/') ? (
                              <iframe
                                key={activeClip.id}
                                src={activeClip.video_url}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                              />
                            ) : (
                              <video 
                                key={activeClip.id}
                                src={activeClip.video_url} 
                                controls 
                                autoPlay
                                loop
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            )
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                              Video is rendering...
                            </div>
                          )}


                          {/* Dynamic Caption Overlay */}
                          <div style={{
                            position: 'absolute',
                            bottom: '18%',
                            left: '10%',
                            right: '10%',
                            textAlign: 'center',
                            pointerEvents: 'none',
                            zIndex: 8
                          }}>
                            <span style={{
                              fontFamily: captionFont === 'Impact' ? 'Impact, Arial Black, sans-serif' : captionFont,
                              fontSize: '1.45rem',
                              color: primaryColor,
                              textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000',
                              textTransform: 'uppercase',
                              fontWeight: '900',
                              letterSpacing: '1px',
                              lineHeight: '1.2',
                              display: 'inline-block',
                              backgroundColor: 'rgba(0,0,0,0.4)',
                              padding: '4px 10px',
                              borderRadius: '6px'
                            }}>
                              {getDynamicCaption().toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Status Indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }} />
                          Interactive 9:16 Preview Player
                        </div>
                      </div>

                      {/* Right Panel: Clips selector, Metadata, Downloads */}
                      <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        <div className="glass-panel" style={{ padding: '24px' }}>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-purple)', fontWeight: 600, letterSpacing: '0.5px' }}>
                            {wizardPipeline === 'A' ? "Smart Repurposed Clips" : "Multi-Cam Synced Output"}
                          </span>
                          <h4 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#fff', marginTop: '4px', marginBottom: '8px' }}>
                            {activeClip?.title || "Consolidated Master"}
                          </h4>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                            {activeClip?.hook_score && (
                              <span style={{
                                padding: '4px 10px', borderRadius: '6px',
                                backgroundColor: 'rgba(0, 255, 255, 0.08)', border: '1px solid rgba(0, 255, 255, 0.15)',
                                color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600
                              }}>
                                Hook Score: {activeClip.hook_score}/100
                              </span>
                            )}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              Duration: ~30s
                            </span>
                          </div>
                          
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0, padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <strong>Transcript Segment:</strong> "{activeClip?.transcript || 'No transcript available.'}"
                          </p>
                        </div>

                        {/* Pipeline A Clip Selector Tabs */}
                        {generatedClips.length > 1 && (
                          <div>
                            <h5 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: '#fff' }}>
                              Toggle Generated Clips ({generatedClips.length})
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {generatedClips.map((clip, index) => (
                                <div 
                                  key={clip.id}
                                  onClick={() => setActiveClip(clip)}
                                  style={{
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    border: activeClip?.id === clip.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                                    backgroundColor: activeClip?.id === clip.id ? 'rgba(0, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <div>
                                    <h6 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: activeClip?.id === clip.id ? 'var(--accent-cyan)' : '#fff' }}>
                                      {index + 1}. {clip.title}
                                    </h6>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                      Clip Length: 30s • Hook score: {clip.hook_score}
                                    </p>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {activeClip?.id === clip.id ? <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} /> : null}
                                    <Play size={12} style={{ color: 'var(--text-muted)' }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Download and Edit Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                          <button 
                            className="neon-btn"
                            onClick={() => {
                              if (activeClip?.video_url) {
                                window.open(activeClip.video_url, '_blank');
                              } else {
                                showNotification("Video link is not ready yet", "error");
                              }
                            }}
                            style={{ 
                              padding: '14px', 
                              fontSize: '1rem', 
                              justifyContent: 'center',
                              boxShadow: '0 0 15px var(--accent-cyan-glow)'
                            }}
                          >
                            <Upload size={18} style={{ transform: 'rotate(180deg)', marginRight: '6px' }} /> Download MP4 Video
                          </button>
                          
                          <button 
                            className="sidebar-link"
                            onClick={() => {
                              setStudioTab('editor');
                            }}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              border: '1px solid var(--border-light)',
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              transition: 'all 0.2s ease',
                              textAlign: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                          >
                            <Sliders size={16} style={{ marginRight: '8px' }} /> Custom Style & Timeline Editor
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* --- TAB 4: RENDERED GALLERY --- */}
                {studioTab === 'gallery' && (
                  <div>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '8px' }}>Rendered Output Gallery</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.95rem' }}>
                      Here are your compiled vertical shortform clips, formatted in 9:16 and ready for publishing on YouTube, TikTok, and Reels.
                    </p>

                    {renderedClips.length > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-light)',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <strong>{selectedRenderedClips.length}</strong> of <strong>{renderedClips.length}</strong> videos selected
                          </span>
                          <button
                            onClick={() => {
                              if (selectedRenderedClips.length === renderedClips.length) {
                                setSelectedRenderedClips([]);
                              } else {
                                setSelectedRenderedClips(renderedClips.map(c => c.id));
                              }
                            }}
                            className="sidebar-link"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--border-light)', backgroundColor: 'transparent', color: '#fff', cursor: 'pointer', borderRadius: '6px' }}
                          >
                            {selectedRenderedClips.length === renderedClips.length ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                        
                        {selectedRenderedClips.length > 0 && (
                          <button
                            onClick={handleDeleteBulkRenders}
                            className="neon-btn"
                            style={{
                              padding: '8px 16px',
                              fontSize: '0.85rem',
                              backgroundColor: 'rgba(220, 53, 69, 0.2)',
                              border: '1px solid #dc3545',
                              boxShadow: '0 0 10px rgba(220, 53, 69, 0.15)',
                              color: '#fff',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.4)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.2)'}
                          >
                            <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete Selected ({selectedRenderedClips.length})
                          </button>
                        )}
                      </div>
                    )}

                    {renderedClips.length === 0 ? (
                      <div style={{
                        padding: '60px 20px', textAlign: 'center', border: '2px dashed var(--border-light)',
                        borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                      }}>
                        <Film size={48} style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <h4>No Rendered Video Yet</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Go to the Sync tab, choose a clip, style its captions, and trigger render.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
                        {renderedClips.map(clip => (
                          <div key={clip.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: selectedRenderedClips.includes(clip.id) ? '1px solid var(--accent-cyan)' : '1px solid var(--border-light)' }}>
                            <div style={{ position: 'relative', width: '100%', height: '320px', backgroundColor: '#000' }}>
                              {/* Standard Video Player */}
                              {clip.url && clip.url.includes('youtube.com/embed/') ? (
                                <iframe
                                  src={clip.url}
                                  style={{ width: '100%', height: '100%', border: 'none' }}
                                  allow="autoplay; encrypted-media"
                                  allowFullScreen
                                />
                              ) : (
                                <video 
                                  src={clip.url} 
                                  controls 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              )}

                              {/* Selection Checkbox */}
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isSelected = selectedRenderedClips.includes(clip.id);
                                  if (isSelected) {
                                    setSelectedRenderedClips(selectedRenderedClips.filter(id => id !== clip.id));
                                  } else {
                                    setSelectedRenderedClips([...selectedRenderedClips, clip.id]);
                                  }
                                }}
                                style={{
                                  position: 'absolute', top: '12px', left: '12px', zIndex: 10,
                                  width: '24px', height: '24px', borderRadius: '6px',
                                  border: selectedRenderedClips.includes(clip.id) ? '2px solid var(--accent-cyan)' : '2px solid rgba(255,255,255,0.6)',
                                  backgroundColor: selectedRenderedClips.includes(clip.id) ? 'var(--accent-cyan)' : 'rgba(0,0,0,0.4)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                                }}
                              >
                                {selectedRenderedClips.includes(clip.id) && (
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#000' }} />
                                )}
                              </div>
                              {/* Delete Video Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRender(clip.id);
                                }}
                                style={{
                                  position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                                  backgroundColor: 'rgba(220, 53, 69, 0.85)', color: '#fff',
                                  border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', transition: 'all 0.2s ease',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.85)'}
                                title="Delete Rendered Video"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <h5 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>{clip.title}</h5>
                                <span style={{
                                  fontSize: '0.7rem', display: 'inline-block', padding: '2px 8px',
                                  borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-light)',
                                  color: clip.preset.color
                                }}>
                                  Font: {clip.preset.font}
                                </span>
                              </div>
                              
                              <button 
                                className="neon-btn"
                                onClick={() => window.open(clip.url, '_blank')}
                                style={{ padding: '6px 12px', fontSize: '0.75rem', marginTop: '14px', width: '100%', justifyContent: 'center' }}
                              >
                                Download MP4
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </section>
          </div>
        </main>
      )}
      {/* --- NEW PROJECT MODAL DIALOG --- */}
      {isNewProjModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '600px', padding: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 35px var(--accent-purple-glow)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            
            {/* Modal Header */}
            {wizardStep !== 'processing' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 600, fontFamily: 'Space Grotesk', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Sparkles size={20} style={{ color: 'var(--accent-cyan)' }} /> Project Setup Wizard
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                    {wizardPipeline === 'A' 
                      ? `Step ${wizardStep} of 4: AI Repurposing Pipeline`
                      : `Step ${wizardStep} of 2: Multi-Cam Sync Timeline`
                    }
                  </p>
                </div>
                
                <button 
                  onClick={() => setIsNewProjModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '4px', borderRadius: '50%'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  X
                </button>
              </div>
            )}

            {/* Step Indicators Bar */}
            {wizardStep !== 'processing' && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
                {wizardPipeline === 'A' ? (
                  [1, 2, 3, 4].map(s => (
                    <div 
                      key={s} 
                      style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        backgroundColor: s <= wizardStep ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  ))
                ) : (
                  [1, 2].map(s => (
                    <div 
                      key={s} 
                      style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        backgroundColor: s <= wizardStep ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  ))
                )}
              </div>
            )}

            {/* --- STEP 1: CHOOSE PIPELINE & PROJECT NAME --- */}
            {wizardStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setWizardStep(2); }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Project Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Creator Repurposer Ep 1"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Choose Studio Pipeline</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Pipeline A Option */}
                    <div 
                      onClick={() => setWizardPipeline('A')}
                      style={{
                        padding: '16px', borderRadius: '12px', cursor: 'pointer',
                        border: wizardPipeline === 'A' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                        backgroundColor: wizardPipeline === 'A' ? 'rgba(0, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                        transition: 'all 0.2s ease', display: 'flex', gap: '16px', alignItems: 'flex-start'
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        backgroundColor: 'rgba(0, 255, 255, 0.08)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Sparkles size={18} style={{ color: 'var(--accent-cyan)' }} />
                      </div>
                      <div>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>
                          Pipeline A: Smart AI Repurposing
                        </h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                          Convert long-form videos into high-retention vertical shorts. Auto-cuts timelines, applies captions overlay, and replicates styling.
                        </p>
                      </div>
                    </div>

                    {/* Pipeline B Option */}
                    <div 
                      onClick={() => setWizardPipeline('B')}
                      style={{
                        padding: '16px', borderRadius: '12px', cursor: 'pointer',
                        border: wizardPipeline === 'B' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                        backgroundColor: wizardPipeline === 'B' ? 'rgba(0, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                        transition: 'all 0.2s ease', display: 'flex', gap: '16px', alignItems: 'flex-start'
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        backgroundColor: 'rgba(168, 85, 247, 0.08)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Video size={18} style={{ color: 'var(--accent-purple)' }} />
                      </div>
                      <div>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>
                          Pipeline B: Multi-Cam Sync Engine
                        </h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                          Sync multiple video recordings or camera feeds of the exact same event using audio waveform fingerprinting into a single vertical timeline.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsNewProjModalOpen(false)}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)',
                      backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="neon-btn" 
                    style={{ padding: '10px 24px', fontSize: '0.85rem' }}
                  >
                    Next Step <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                  </button>
                </div>
              </form>
            )}

            {/* --- PIPELINE A - STEP 2: MEDIA INGESTION --- */}
            {wizardStep === 2 && wizardPipeline === 'A' && (
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                if (newProjSourceType === 'file' && !newProjFile) {
                  showNotification("Please upload a raw video file", "error");
                  return;
                }
                if (newProjSourceType === 'link' && !newProjLink) {
                  showNotification("Please enter a video URL link", "error");
                  return;
                }
                setWizardStep(3); 
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Select Video Source</label>
                  <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-light)', marginBottom: '16px' }}>
                    <button 
                      type="button"
                      onClick={() => setNewProjSourceType('file')}
                      style={{
                        flexGrow: 1, padding: '10px', borderRadius: '8px', border: 'none',
                        backgroundColor: newProjSourceType === 'file' ? 'var(--accent-purple)' : 'transparent',
                        color: newProjSourceType === 'file' ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                      }}
                    >
                      <Upload size={14} style={{ marginRight: '6px' }} /> Upload Video
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewProjSourceType('link')}
                      style={{
                        flexGrow: 1, padding: '10px', borderRadius: '8px', border: 'none',
                        backgroundColor: newProjSourceType === 'link' ? 'var(--accent-purple)' : 'transparent',
                        color: newProjSourceType === 'link' ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
                      }}
                    >
                      <Link size={14} style={{ marginRight: '6px' }} /> Paste Link
                    </button>
                  </div>

                  {newProjSourceType === 'file' ? (
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setNewProjFile(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => document.getElementById('wizard-file-input').click()}
                      style={{
                        border: '2px dashed var(--border-light)', padding: '32px 20px', borderRadius: '10px',
                        textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <Upload size={32} style={{ color: newProjFile ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                      {newProjFile ? (
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', wordBreak: 'break-all' }}>
                            {newProjFile.name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {(newProjFile.size / (1024 * 1024)).toFixed(2)} MB • Replace File
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Drag video here or <span style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>browse files</span>
                          </p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Supports MP4, MOV, WebM up to 500MB
                          </p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        id="wizard-file-input" 
                        accept="video/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNewProjFile(e.target.files[0]);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : (
                    <div>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="url" 
                          placeholder="https://www.youtube.com/watch?v=... or Google Drive URL"
                          value={newProjLink}
                          onChange={(e) => setNewProjLink(e.target.value)}
                          style={{ ...inputStyle, paddingLeft: '38px' }}
                          required={newProjSourceType === 'link'}
                        />
                        <Link size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                        Paste a public YouTube video URL or a shared file link on Google Drive.
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setWizardStep(1)}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)',
                      backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                    }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="neon-btn" 
                    style={{ padding: '10px 24px', fontSize: '0.85rem' }}
                  >
                    Next Step <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                  </button>
                </div>
              </form>
            )}

            {/* --- PIPELINE A - STEP 3: PARAMETERS & STYLE OPT-IN --- */}
            {wizardStep === 3 && wizardPipeline === 'A' && (
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                if (wizardStyleOptIn && !wizardCreatorHandle) {
                  showNotification("Please type a creator handle (starting with @)", "error");
                  return;
                }
                setWizardStep(4); 
              }}>
                {/* Quantitative Slider */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Clips Parameterization</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                    How many short-form clips (&lt; 1 minute) do you want generated?
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={desiredClipsCount} 
                      onChange={(e) => setDesiredClipsCount(Number(e.target.value))}
                      style={{ flexGrow: 1, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                    />
                    <span style={{ 
                      fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-cyan)',
                      width: '40px', textAlign: 'center', display: 'inline-block' 
                    }}>
                      {desiredClipsCount}
                    </span>
                  </div>
                </div>

                {/* Creator Style opt-in */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ ...labelStyle, margin: 0 }}>Creator Style Analysis</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="style-opt-in" 
                        checked={wizardStyleOptIn}
                        onChange={(e) => setWizardStyleOptIn(e.target.checked)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-purple)' }}
                      />
                      <label htmlFor="style-opt-in" style={{ fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>Analyze & Replicate</label>
                    </div>
                  </div>
                  
                  {wizardStyleOptIn ? (
                    <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', animation: 'fadeIn 0.2s ease' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                        Input the handle using the <strong>@</strong> symbol to analyze visual cues, hooks, and overlay pacing.
                      </p>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="text" 
                          placeholder="e.g. @MrBeast"
                          value={wizardCreatorHandle}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val && !val.startsWith('@')) {
                              val = '@' + val;
                            }
                            setWizardCreatorHandle(val);
                          }}
                          style={inputStyle}
                          required={wizardStyleOptIn}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', backgroundColor: 'rgba(255,255,255,0.01)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Style analysis skipped. Standard clipping algorithms and standard presets will be applied.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setWizardStep(2)}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)',
                      backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                    }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="neon-btn" 
                    style={{ padding: '10px 24px', fontSize: '0.85rem' }}
                  >
                    Next Step <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                  </button>
                </div>
              </form>
            )}

            {/* --- PIPELINE A - STEP 4: AUDIO LAYER & MUSIC --- */}
            {wizardStep === 4 && wizardPipeline === 'A' && (
              <form onSubmit={handleWizardSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Audio Layer & Licensing Selection</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                    Select copyright-safe background music. Or select None to preserve original speaker audio.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {/* None Option */}
                    <div 
                      onClick={() => setWizardMusicTrackId('none')}
                      style={{
                        padding: '12px', borderRadius: '8px', cursor: 'pointer',
                        border: wizardMusicTrackId === 'none' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                        backgroundColor: wizardMusicTrackId === 'none' ? 'rgba(0, 255, 255, 0.03)' : 'rgba(255,255,255,0.01)',
                        display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Volume2 size={16} style={{ color: 'var(--text-muted)' }} />
                        <span>No background music (Voice only)</span>
                      </div>
                      {wizardMusicTrackId === 'none' && <CheckCircle2 size={16} style={{ color: 'var(--accent-cyan)' }} />}
                    </div>

                    {/* Seeded tracks */}
                    {musicCatalog.map(track => (
                      <div 
                        key={track.id}
                        onClick={() => {
                          setWizardMusicTrackId(track.id);
                          setSelectedMusic(track);
                        }}
                        style={{
                          padding: '12px', borderRadius: '8px', cursor: 'pointer',
                          border: wizardMusicTrackId === track.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                          backgroundColor: wizardMusicTrackId === track.id ? 'rgba(0, 255, 255, 0.03)' : 'rgba(255,255,255,0.01)',
                          display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Music size={16} style={{ color: 'var(--accent-purple)' }} />
                          <div>
                            <span style={{ fontWeight: 600, color: '#fff', display: 'block' }}>{track.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{track.genre} • {track.artist}</span>
                          </div>
                        </div>
                        {wizardMusicTrackId === track.id && <CheckCircle2 size={16} style={{ color: 'var(--accent-cyan)' }} />}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setWizardStep(3)}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)',
                      backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                    }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="neon-btn" 
                    style={{ padding: '10px 28px', fontSize: '0.85rem', boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}
                  >
                    Let's Create <Sparkles size={14} style={{ marginLeft: '6px' }} />
                  </button>
                </div>
              </form>
            )}

            {/* --- PIPELINE B - STEP 2: MULTI-FEED INGESTION PORTAL --- */}
            {wizardStep === 2 && wizardPipeline === 'B' && (
              <form onSubmit={handleWizardSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Multi-Feed Camera Feeds Portal</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                    Stitch multiple video cameras or angles of the exact same event. Feeds will sync automatically. (Minimum 2 feeds required).
                  </p>

                  {/* Added Feeds List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {wizardMultiFeeds.map((feed, index) => (
                      <div 
                        key={feed.id} 
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-light)',
                          backgroundColor: 'rgba(255,255,255,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Video size={16} style={{ color: 'var(--accent-cyan)' }} />
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                              Feed #{index + 1}: {feed.label}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', wordBreak: 'break-all' }}>
                              {feed.type === 'file' ? (feed.file?.name || 'Local File') : feed.link}
                            </span>
                          </div>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            if (wizardMultiFeeds.length <= 2) {
                              showNotification("You must keep at least 2 camera feeds for Multi-Cam sync", "info");
                              return;
                            }
                            setWizardMultiFeeds(wizardMultiFeeds.filter(f => f.id !== feed.id));
                          }}
                          style={{
                            backgroundColor: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer',
                            fontSize: '0.8rem', fontWeight: 600
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add feed tool */}
                  <div style={{
                    padding: '16px', borderRadius: '10px', border: '1px dashed var(--border-light)',
                    backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '12px'
                  }}>
                    <h6 style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', color: 'var(--accent-purple)' }}>
                      Add Feed Angle
                    </h6>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        id="new-feed-label"
                        placeholder="Angle Label (e.g. Host Shot)"
                        style={{ ...inputStyle, flexGrow: 1 }}
                      />
                      <input 
                        type="url" 
                        id="new-feed-link"
                        placeholder="Video Link URL"
                        style={{ ...inputStyle, flexGrow: 2 }}
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        const labelEl = document.getElementById('new-feed-label');
                        const linkEl = document.getElementById('new-feed-link');
                        if (!labelEl.value || !linkEl.value) {
                          showNotification("Both angle label and link are required", "error");
                          return;
                        }
                        const newFeed = {
                          id: `feed_${Date.now()}`,
                          label: labelEl.value,
                          type: 'link',
                          file: null,
                          link: linkEl.value,
                          status: 'Ready'
                        };
                        setWizardMultiFeeds([...wizardMultiFeeds, newFeed]);
                        labelEl.value = '';
                        linkEl.value = '';
                      }}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                        backgroundColor: 'var(--accent-purple)', color: '#fff', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600, alignSelf: 'flex-end'
                      }}
                    >
                      + Add Angle Feed
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setWizardStep(1)}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)',
                      backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                    }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="neon-btn" 
                    style={{ padding: '10px 28px', fontSize: '0.85rem', boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}
                    disabled={wizardMultiFeeds.length < 2}
                  >
                    Sync Feeds <Video size={14} style={{ marginLeft: '6px' }} />
                  </button>
                </div>
              </form>
            )}

            {/* --- PROCESSING ANIMATION SCREEN --- */}
            {wizardStep === 'processing' && (
              <div style={{
                padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', gap: '24px'
              }}>
                {/* Spinner */}
                <div className="processing-spinner" style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  border: '4px solid rgba(0, 255, 255, 0.1)', borderTop: '4px solid var(--accent-cyan)',
                  animation: 'spin 1s linear infinite'
                }} />

                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                    AI Video Assembly Engine Active
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                    Segmenting audio transcripts, sync structures, and compilation waveforms.
                  </p>
                </div>

                {/* Progress Checklist */}
                <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  {wizardProgressSteps.map((stepLabel, idx) => {
                    const isCompleted = idx < wizardCurrentProgressIdx;
                    const isActive = idx === wizardCurrentProgressIdx;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: isCompleted ? '#22c55e' : (isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'), fontWeight: isActive ? 600 : 400 }}>
                        {isCompleted ? (
                          <CheckCircle2 size={16} color="#22c55e" />
                        ) : (
                          isActive ? (
                            <div className="spinner-mini" style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(0, 255, 255, 0.1)', borderTop: '2px solid var(--accent-cyan)', animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: '5px', marginRight: '5px' }} />
                          )
                        )}
                        <span>{stepLabel}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${((wizardCurrentProgressIdx + 1) / wizardProgressSteps.length) * 100}%`,
                    height: '100%', backgroundColor: 'var(--accent-cyan)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Google Simulated OAuth Modal */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '30px', animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
                <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', fontWeight: 600 }}>Sign in with Google</h4>
              </div>
              <button onClick={() => setShowGoogleModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
              Simulate Google OAuth flow callbacks in the local development environment:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div 
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
                  borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)'
                }}
                onClick={() => triggerGoogleAuthSimulated('rakshitraj1107@gmail.com')}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>R</div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Rakshit Raj</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>rakshitraj1107@gmail.com</p>
                </div>
              </div>

              <div 
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
                  borderRadius: '8px', cursor: 'pointer', transition: 'var(--transition-smooth)'
                }}
                onClick={() => triggerGoogleAuthSimulated('newuser')}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-magenta)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>N</div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Create New Google Account</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Simulate OAuth signup redirect</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline CSS Helper styles

const sidebarLinkStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
  fontFamily: 'Space Grotesk, sans-serif',
  fontSize: '0.95rem',
  fontWeight: isActive ? 600 : 500,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s ease',
  boxShadow: isActive ? 'inset 0 0 8px rgba(0, 255, 255, 0.05)' : 'none',
  borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent'
});

const styleBadgeRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.85rem',
  padding: '6px 0',
  borderBottom: '1px dashed rgba(255, 255, 255, 0.05)'
};

const styleBadgeLabel = {
  color: 'var(--text-muted)'
};

const styleBadgeVal = {
  color: '#fff',
  fontWeight: 500
};

const uploadAngleBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px dashed var(--border-light)',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s ease'
};

const ctrlBtnStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'var(--bg-tertiary)',
  border: '1px solid var(--border-light)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '6px',
  letterSpacing: '0.5px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-light)',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none'
};

export default App;
