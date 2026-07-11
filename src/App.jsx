import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { ThemeToggle } from './components/ThemeToggle';
import { VoiceReader } from './components/VoiceReader';
import { db } from './db';
import { generateMealChoices } from './utils/parser';
import { ChefHat, LogOut, Loader2, IndianRupee, Activity, Utensils, CheckCircle } from 'lucide-react';

function App() {
  const { user, login, logout, loading } = useAuth();
  const [username, setUsername] = useState('');
  
  // Form State
  const [schedule, setSchedule] = useState('sedentary'); // sedentary, moderate, intense
  const [diet, setDiet] = useState('veg'); // veg, non-veg
  const [nonVegChoice, setNonVegChoice] = useState('');
  const [budget, setBudget] = useState(500); // INR

  // AI State
  const worker = useRef(null);
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiProgress, setAiProgress] = useState('');
  const [generatedChoices, setGeneratedChoices] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

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
            setAiProgress('Failed to generate. Using fallback logic.');
            // Fallback for hackathon demo if model fails to load
            parseAndSetChoices("Model failed, using dynamic fallback.");
        }
    });

    return () => worker.current.terminate();
  }, []);

  const parseAndSetChoices = (aiOutput) => {
    const choices = generateMealChoices(schedule, diet, nonVegChoice, budget, aiOutput || "Model generated creative text.");
    setGeneratedChoices(choices);
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    setAiStatus('loading');
    setSelectedPlan(null);
    
    const promptText = `Suggest a healthy, Indian-style meal plan for a ${schedule} day, ${diet} diet with budget of ${budget} INR.`;
    worker.current.postMessage({ prompt: promptText });
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
        <div className="flex items-center gap-2">
          <ChefHat style={{ color: 'var(--primary)' }} />
          <h2 style={{ margin: 0 }}>AI Cook</h2>
        </div>
        <div className="flex items-center gap-4">
          <span>Hi, {user.username}</span>
          <ThemeToggle />
          <button onClick={logout} className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

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
              <h3 className="mb-4">Select a Plan</h3>
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
                  <button onClick={() => setSelectedPlan(null)} className="btn btn-outline">Back</button>
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
      
      {/* Simple global CSS override for the spinner animation */}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;
