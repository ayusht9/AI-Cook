import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { ThemeToggle } from './components/ThemeToggle';
import { VoiceReader } from './components/VoiceReader';
import { db } from './db';
import { generateMealChoices } from './utils/parser';
import { ChefHat, LogOut, Loader2, IndianRupee, Activity, Utensils, CheckCircle, Clock, Zap } from 'lucide-react';

function App() {
  const { user, login, logout, loading } = useAuth();
  const [username, setUsername] = useState('');
  
  // Navigation
  const [view, setView] = useState('home'); // 'home' | 'history'
  
  // Form State
  const [schedule, setSchedule] = useState('sedentary');
  const [diet, setDiet] = useState('veg');
  const [nonVegChoice, setNonVegChoice] = useState('');
  const [budget, setBudget] = useState(500);
  const [fastMode, setFastMode] = useState(false); // Workaround for slow local model

  // AI State
  const worker = useRef(null);
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiProgress, setAiProgress] = useState('');
  const [generatedChoices, setGeneratedChoices] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // History State
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    // Initialize Web Worker
    worker.current = new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module'
    });

    worker.current.addEventListener('message', (e) => {
        const { status, output, progress, error } = e.data;
        if (status === 'progress') {
            setAiProgress('Loading AI Model... ' + (progress ? `${Math.round(progress)}%` : ''));
        } else if (status === 'generating') {
            setAiStatus('generating');
            setAiProgress('Cooking up your plans...');
        } else if (status === 'complete') {
            parseAndSetChoices(output);
            setAiStatus('complete');
        } else if (status === 'error') {
            console.error("AI Error:", error);
            setAiStatus('error');
            setAiProgress('Failed to generate. Using fast mode fallback.');
            parseAndSetChoices("Model failed, using dynamic fallback.");
        }
    });

    return () => worker.current.terminate();
  }, [schedule, diet, nonVegChoice, budget]);

  const loadHistory = async () => {
    if (user) {
      const items = await db.history.where('userId').equals(user.id).reverse().toArray();
      setHistoryItems(items);
    }
  };

  useEffect(() => {
    if (view === 'history') {
      loadHistory();
    }
  }, [view, user]);

  const parseAndSetChoices = (aiOutput) => {
    const choices = generateMealChoices(schedule, diet, nonVegChoice, budget, aiOutput || "AI Note: Optimized for your day!");
    setGeneratedChoices(choices);
  };

  const handleGenerate = (e) => {
    if (e) e.preventDefault();
    setAiStatus('loading');
    setSelectedPlan(null);
    setGeneratedChoices([]);
    
    if (fastMode) {
      // Workaround for slow AI: Instantly generate using logic without the 77M model
      setTimeout(() => {
        parseAndSetChoices("Fast Mode: AI text generation skipped for speed.");
        setAiStatus('complete');
      }, 500); // Small delay for UX
    } else {
      const promptText = `Suggest a healthy, Indian-style meal plan for a ${schedule} day, ${diet} diet with budget of ${budget} INR.`;
      worker.current.postMessage({ prompt: promptText });
    }
  };

  const selectPlan = async (plan) => {
    setSelectedPlan(plan);
    // Save to history
    await db.history.add({
      userId: user.id,
      timestamp: new Date().toISOString(),
      prompt_details: { schedule, diet, budget },
      generated_plan: plan
    });
  };

  const handleRegenerateFromHistory = (item) => {
    // Populate form with history details and regenerate
    setSchedule(item.prompt_details.schedule);
    setDiet(item.prompt_details.diet);
    setBudget(item.prompt_details.budget);
    if (item.prompt_details.diet === 'non-veg' && item.generated_plan.lunch.includes('Chicken')) {
      setNonVegChoice('Chicken'); // Best effort to restore protein choice
    }
    setView('home');
    // Trigger generation on next tick so state has time to update
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  if (loading) return <div className="container text-center mt-4">Loading...</div>;

  if (!user) {
    return (
      <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
        <div className="glass glass-panel text-center animate-slide-up">
          <ChefHat size={48} className="mb-4" style={{ color: 'var(--primary)', margin: '0 auto' }} />
          <h1>AI Cook</h1>
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>Your personal meal planner</p>
          <form onSubmit={(e) => { e.preventDefault(); login(username); }}>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Enter username" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login / Register</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="flex justify-between items-center mb-4 glass" style={{ padding: '1rem 2rem', borderRadius: 'var(--radius-lg)' }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <ChefHat style={{ color: 'var(--primary)' }} />
          <h2 style={{ margin: 0 }}>AI Cook</h2>
        </div>
        <div className="flex items-center gap-4">
          <span>Hi, {user.username}</span>
          <button 
            onClick={() => setView(view === 'home' ? 'history' : 'home')} 
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem' }}
          >
            {view === 'home' ? <><Clock size={16}/> History</> : 'Home'}
          </button>
          <ThemeToggle />
          <button onClick={logout} className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {view === 'history' ? (
        <div className="glass glass-panel animate-slide-up">
          <h2 className="mb-4">Your Past Plans</h2>
          {historyItems.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No plans generated yet.</p>
          ) : (
            <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
              {historyItems.map((item) => (
                <div key={item.id} className="glass glass-panel" style={{ padding: '1.5rem' }}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>{item.generated_plan.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                    <strong>Budget:</strong> ₹{item.prompt_details.budget} | <strong>Diet:</strong> {item.prompt_details.diet} | <strong>Intensity:</strong> {item.prompt_details.schedule}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedPlan(item.generated_plan); setView('home'); setGeneratedChoices([]); }} className="btn btn-outline">
                      View Details
                    </button>
                    <button onClick={() => handleRegenerateFromHistory(item)} className="btn btn-primary">
                      Regenerate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <main className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          {/* Left Column: Form */}
          <div className="glass glass-panel" style={{ flex: '1 1 300px', alignSelf: 'flex-start' }}>
            <h3>Plan Your Day</h3>
            <form onSubmit={handleGenerate}>
              <div className="input-group">
                <label><Activity size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/> Daily Schedule Intensity</label>
                <select value={schedule} onChange={e => setSchedule(e.target.value)}>
                  <option value="sedentary">Sedentary (Office work, Light walking)</option>
                  <option value="moderate">Moderate (Active job, Light workout)</option>
                  <option value="intense">Intense (Gym day, Heavy physical work)</option>
                </select>
              </div>

              <div className="input-group">
                <label><Utensils size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/> Dietary Preference</label>
                <select value={diet} onChange={e => {setDiet(e.target.value); setNonVegChoice('');}}>
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                </select>
              </div>

              {diet === 'non-veg' && (
                <div className="input-group animate-slide-up">
                  <label>Preferred Protein</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Chicken, Fish, Eggs" 
                    value={nonVegChoice} 
                    onChange={e => setNonVegChoice(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label><IndianRupee size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/> Daily Budget (INR)</label>
                <input 
                  type="number" 
                  min="100" 
                  step="50"
                  value={budget} 
                  onChange={e => setBudget(Number(e.target.value))}
                  required
                />
              </div>

              <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--input-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <input 
                  type="checkbox" 
                  id="fastMode"
                  checked={fastMode}
                  onChange={e => setFastMode(e.target.checked)}
                  style={{ width: 'auto', marginRight: '10px', cursor: 'pointer' }}
                />
                <label htmlFor="fastMode" style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={16} color="#eab308" /> Fast Mode (Skip local AI download)
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={aiStatus === 'loading' || aiStatus === 'generating'}>
                {(aiStatus === 'loading' || aiStatus === 'generating') ? <><Loader2 className="spin" size={20} /> Generating...</> : 'Generate Magic Plans'}
              </button>
              
              {(aiStatus === 'loading' || aiStatus === 'generating') && (
                <p className="text-center mt-4" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{aiProgress}</p>
              )}
            </form>
          </div>

          {/* Right Column: Results */}
          <div style={{ flex: '2 1 500px' }}>
            {generatedChoices.length > 0 && !selectedPlan && (
              <div className="animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                  <h3 style={{ margin: 0 }}>Select a Plan</h3>
                  <button onClick={() => handleGenerate()} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
                    <Loader2 size={16} style={{ display: 'inline', marginRight: '4px' }} /> Regenerate Options
                  </button>
                </div>
                <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
                  {generatedChoices.map(choice => (
                    <div key={choice.id} className="glass glass-panel" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => selectPlan(choice)}
                         onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                         onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 style={{ color: 'var(--primary)', margin: 0 }}>{choice.name}</h4>
                        <span style={{ fontWeight: 'bold', color: choice.budget > budget ? '#ef4444' : '#10b981' }}>
                          ₹{choice.budget} 
                          {choice.budget > budget && <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>(Over Budget)</span>}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{choice.description}</p>
                      <div className="flex gap-4 mt-4" style={{ fontSize: '0.85rem' }}>
                        <span style={{ background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '4px' }}>🔥 {choice.calories} kcal</span>
                        <span style={{ background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '4px' }}>🛒 {choice.groceryList.length} items</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPlan && (
              <div className="glass glass-panel animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                  <h2 style={{ margin: 0 }}>{selectedPlan.name}</h2>
                  <div className="flex gap-2">
                    <VoiceReader textToRead={`Plan selected: ${selectedPlan.name}. Breakfast is ${selectedPlan.breakfast}. Lunch is ${selectedPlan.lunch}. Dinner is ${selectedPlan.dinner}. Total estimated cost is ${selectedPlan.budget} rupees.`} />
                    <button onClick={() => setSelectedPlan(null)} className="btn btn-outline">Close</button>
                  </div>
                </div>
                
                <div className="mb-4" style={{ padding: '1rem', background: 'var(--input-bg)', borderRadius: 'var(--radius-md)' }}>
                  <h4 className="mb-4" style={{ color: 'var(--primary)' }}>Meals</h4>
                  <p><strong>Breakfast:</strong> {selectedPlan.breakfast}</p>
                  <p><strong>Lunch:</strong> {selectedPlan.lunch}</p>
                  <p><strong>Dinner:</strong> {selectedPlan.dinner}</p>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--input-border)' }}>
                    <p><strong>Calories:</strong> {selectedPlan.calories} kcal</p>
                    <p><strong>Substitutions:</strong> {selectedPlan.substitutions}</p>
                  </div>
                </div>

                <div style={{ padding: '1rem', background: 'var(--input-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 style={{ color: 'var(--primary)', margin: 0 }}>Grocery List</h4>
                    <span style={{ fontWeight: 'bold' }}>Est. Cost: ₹{selectedPlan.budget}</span>
                  </div>
                  <ul style={{ listStyleType: 'none' }}>
                    {selectedPlan.groceryList.map((item, idx) => (
                      <li key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--input-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} style={{ color: '#10b981' }} /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {generatedChoices.length === 0 && !selectedPlan && aiStatus !== 'loading' && aiStatus !== 'generating' && (
              <div className="glass glass-panel flex items-center justify-center" style={{ height: '100%', minHeight: '300px', color: 'var(--text-muted)' }}>
                <p>Fill out your preferences and click Generate to see your personalized meal plans!</p>
              </div>
            )}
          </div>
        </main>
      )}
      
      {/* Simple global CSS override for the spinner animation */}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;
