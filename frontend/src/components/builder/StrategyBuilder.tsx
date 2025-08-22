// frontend/src/components/builder/StrategyBuilder.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBuilderStore } from './builderStore';
import ConditionRow from './ConditionRow';
import ExitConditionSelector from './ExitConditionSelector';
import './StrategyBuilder.css';
import toast from 'react-hot-toast';
import ConfirmationToast from '../common/ConfirmationToast';

const StrategyBuilder: React.FC = () => {
  const [strategyName, setStrategyName] = useState('');
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | ''>('');
  const {
  conditions, logicalOperator, action, exitCondition,
  setLogicalOperator, setAction, setExitCondition, addCondition,
  saveStrategy, resetBuilder,
  savedStrategies, fetchSavedStrategies, loadStrategy, deleteStrategy
} = useBuilderStore();
  const handleLoadStrategy = async () => {
    if (selectedStrategyId === '') return;
    const loadedStrategy = await loadStrategy(Number(selectedStrategyId));
    if (loadedStrategy) {
      // Update the name input field with the loaded strategy's name
      setStrategyName(loadedStrategy.name);
    }
  };
const handleSaveStrategy = () => {
    const promise = saveStrategy(strategyName);

    toast.promise(promise, {
        loading: 'Saving strategy...',
        success: (response) => {
            // Assuming the backend response has a 'name' field
            return `Strategy "${(response as any).data.name}" saved successfully!`;
        },
        error: (err) => {
            // The store now throws an error with the message
            return err.toString();
        },
    }, {
        // Apply the same custom styles
        className: 'flux-toast',
        success: {
            className: 'flux-toast-success',
            iconTheme: { primary: '#fff', secondary: '#198754' },
        },
        error: {
            className: 'flux-toast-error',
            iconTheme: { primary: '#fff', secondary: '#dc3545' },
        },
    });
  };

  useEffect(() => {
    fetchSavedStrategies().catch(error => {
      console.error("Failed to fetch strategies", error);
      // If it's an authentication error, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      }
    });
    return () => {
      resetBuilder(); // Reset when component unmounts
    };
  }, [fetchSavedStrategies, resetBuilder]);

  return (
    <div className="builder-wrapper">
      <header className="builder-header">
  <Link to="/dashboard" className="back-to-dashboard-button">← Back to Dashboard</Link>
  
  {/* NEW: Loader Section */}
  <div className="strategy-loader">
       <select
         className="form-select"
         value={selectedStrategyId}
         onChange={async (e) => {
           const id = Number(e.target.value);
           setSelectedStrategyId(id); // Update the selected ID state
           const loadedStrategy = await loadStrategy(id); // Call the load function immediately
           if (loadedStrategy) {
             setStrategyName(loadedStrategy.name); // Update the name input
           }
         }}
       >
         <option value="" disabled>Load a saved strategy...</option>
         {savedStrategies.map(strategy => (
           <option key={strategy.id} value={strategy.id}>
             {strategy.name}
           </option>
         ))}
       </select>
       {/* The "Load" button has been removed */}
     </div>
  
  <div className="strategy-actions">
       <input type="text" placeholder="My Awesome Strategy" className="strategy-name-input" value={strategyName} onChange={(e) => setStrategyName(e.target.value)} />
       <button className="save-strategy-button" onClick={() => handleSaveStrategy()}>Save Strategy</button>
       
       {/* The new Delete button. It's only enabled if a strategy is loaded. */}
       <button 
  className="delete-strategy-button"
  onClick={() => {
  if (!selectedStrategyId) return;

  toast(
    (t) => (
      <ConfirmationToast
        toastId={t.id}
        message="Are you sure you want to delete this strategy?"
        onConfirm={() => {
          const deletePromise = deleteStrategy(Number(selectedStrategyId));
          toast.promise(
            deletePromise,
            {
              loading: 'Deleting...',
              success: () => {
                setStrategyName('');
                setSelectedStrategyId('');
                return 'Strategy deleted.';
              },
              error: 'Could not delete strategy.',
            },
            { // Styles for the success/error toast
              className: 'flux-toast-danger',
              success: { className: 'flux-toast-success' },
              error: { className: 'flux-toast-error' },
            }
          );
        }}
      />
    ),
    { 
      duration: Infinity, 
      style: {
        background: '#D9534F', // The main red background from your image
        color: '#FFFFFF',     // White text
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
      },
    }
  );
}}
  disabled={!selectedStrategyId}
  title={!selectedStrategyId ? "Load a strategy to delete it" : "Delete this strategy"}
>
  Delete
</button>
     </div>
</header>
      <main className="builder-main-content">
        <div className="builder-form-card">
          <div className="section-title">
            <h3>Trigger Conditions</h3>
            <p>Define the market conditions that must be met to trigger an action.</p>
          </div>
          <div className="conditions-list">
            {conditions.map((condition, index) => (
              <div key={condition.id} className="condition-group">
                <ConditionRow condition={condition} />
                {index < conditions.length - 1 && (
                  <div className="logical-operator-selector">
                    <select value={logicalOperator} onChange={(e) => setLogicalOperator(e.target.value as 'AND' | 'OR')} className="form-select small">
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={addCondition} className="add-condition-button">+ Add Condition</button>
          <hr className="divider" />
          <div className="section-title">
            <h3>Action</h3>
            <p>Define what action to take when all conditions are met.</p>
          </div>
          <div className="action-selector">
            <span>When conditions are met:</span>
            <div className="action-buttons">
              <button
                className={`action-button long-button ${action === 'LONG' ? 'selected' : ''}`}
                onClick={() => setAction('LONG')}
              >
                LONG
              </button>
              <button
                className={`action-button short-button ${action === 'SHORT' ? 'selected' : ''}`}
                onClick={() => setAction('SHORT')}
              >
                SHORT
              </button>
            </div>
          </div>
          
          <hr className="divider" />
          
          <div className="section-title">
            <h3>Exit Strategy</h3>
            <p>Define when to exit your position to lock in profits or limit losses.</p>
          </div>
          
          <ExitConditionSelector 
            exitCondition={exitCondition}
            onExitConditionChange={setExitCondition}
          />
        </div>
      </main>
    </div>
  );
};


export default StrategyBuilder;