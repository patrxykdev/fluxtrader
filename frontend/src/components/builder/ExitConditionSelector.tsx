// frontend/src/components/builder/ExitConditionSelector.tsx
import React, { useState } from 'react';
import type { ExitCondition, ExitType, IndicatorType, OperatorType, TimeUnit } from './types';
import { EXIT_PRESETS, INDICATOR_PARAMS } from './types';
import './ExitConditionSelector.css';

interface ExitConditionSelectorProps {
  exitCondition: ExitCondition;
  onExitConditionChange: (exitCondition: ExitCondition) => void;
}

const ExitConditionSelector: React.FC<ExitConditionSelectorProps> = ({
  exitCondition,
  onExitConditionChange
}) => {
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetSelect = (preset: any) => {
    onExitConditionChange({
      type: preset.type,
      value: preset.value,
      timePeriod: preset.timePeriod,
      timeUnit: preset.timeUnit,
      indicator: preset.indicator,
      operator: preset.operator,
      indicatorValue: preset.indicatorValue
    });
    setShowCustom(false);
  };

  const handleCustomChange = (field: keyof ExitCondition, value: any) => {
    onExitConditionChange({
      ...exitCondition,
      [field]: value
    });
  };

  const renderCustomFields = () => {
    switch (exitCondition.type) {
      case 'profit_target':
      case 'trailing_stop':
        return (
          <div className="custom-field">
            <label>Percentage:</label>
            <input
              type="number"
              value={exitCondition.value || ''}
              onChange={(e) => handleCustomChange('value', parseFloat(e.target.value))}
              min="0.1"
              max="50"
              step="0.1"
              placeholder="5.0"
            />
            <span>%</span>
          </div>
        );

      case 'time_based':
        return (
          <div className="custom-time-fields">
            <div className="custom-field">
              <label>Hold Period:</label>
              <input
                type="number"
                value={exitCondition.timePeriod || ''}
                onChange={(e) => handleCustomChange('timePeriod', parseInt(e.target.value))}
                min="1"
                max={exitCondition.timeUnit === 'minutes' ? 1440 : exitCondition.timeUnit === 'hours' ? 8760 : 365}
                placeholder={exitCondition.timeUnit === 'minutes' ? '60' : exitCondition.timeUnit === 'hours' ? '24' : '7'}
              />
              <span className="time-unit-hint">
                {exitCondition.timeUnit === 'minutes' ? 'max 1440 (24h)' : 
                 exitCondition.timeUnit === 'hours' ? 'max 8760 (365d)' : 
                 'max 365 days'}
              </span>
            </div>
            <div className="custom-field">
              <label>Time Unit:</label>
              <select
                value={exitCondition.timeUnit || 'days'}
                onChange={(e) => handleCustomChange('timeUnit', e.target.value as TimeUnit)}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="exit-condition-selector">
      <h4>Exit Strategy</h4>
      <p className="exit-description">
        Choose how to exit your position. Select a preset or customize your exit conditions.
      </p>

      {/* Preset Buttons */}
      <div className="exit-presets">
        {EXIT_PRESETS.map((preset, index) => (
          <button
            key={index}
            className={`preset-button ${exitCondition.type === preset.type && 
              (preset.type === 'manual' || 
               (preset.type === 'profit_target' && exitCondition.value === preset.value) ||
               (preset.type === 'trailing_stop' && exitCondition.value === preset.value) ||
               (preset.type === 'time_based' && exitCondition.timePeriod === preset.timePeriod && exitCondition.timeUnit === preset.timeUnit)) ? 'selected' : ''}`}
            onClick={() => handlePresetSelect(preset)}
          >
            <div className="preset-label">{preset.label}</div>
            <div className="preset-description">{preset.description}</div>
          </button>
        ))}
      </div>

      {/* Custom Configuration */}
      <div className="custom-exit-section">
        <button
          className="custom-toggle-button"
          onClick={() => setShowCustom(!showCustom)}
        >
          {showCustom ? 'Hide' : 'Show'} Custom Configuration
        </button>

        {showCustom && (
          <div className="custom-exit-config">
            <div className="custom-field">
              <label>Exit Type:</label>
              <select
                value={exitCondition.type}
                onChange={(e) => handleCustomChange('type', e.target.value as ExitType)}
              >
                <option value="manual">Manual Exit</option>
                <option value="profit_target">Profit Target</option>
                <option value="trailing_stop">Trailing Stop</option>
                <option value="time_based">Time Based</option>
              </select>
            </div>

            {renderCustomFields()}
          </div>
        )}
      </div>

      {/* Current Selection Display */}
      <div className="current-exit-display">
        <strong>Current Exit:</strong> {
          exitCondition.type === 'manual' ? 'Manual Exit' :
          exitCondition.type === 'profit_target' ? `${exitCondition.value}% Profit Target` :
          exitCondition.type === 'trailing_stop' ? `${exitCondition.value}% Trailing Stop` :
          exitCondition.type === 'time_based' ? `${exitCondition.timePeriod} ${exitCondition.timeUnit || 'days'} Hold` :
          'Manual Exit'
        }
      </div>
    </div>
  );
};

export default ExitConditionSelector; 