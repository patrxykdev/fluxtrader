// frontend/src/components/builder/ConditionRow.tsx
import React from 'react';
import type { Condition, IndicatorType, OperatorType } from './types';
import { useBuilderStore } from './builderStore';
import { INDICATOR_PARAMS } from './types';

interface ConditionRowProps {
  condition: Condition;
}

const ConditionRow: React.FC<ConditionRowProps> = ({ condition }) => {
  const { updateCondition, removeCondition } = useBuilderStore();
  
  // Check if the indicator has parameters
  const hasParams = INDICATOR_PARAMS[condition.indicator as keyof typeof INDICATOR_PARAMS] && 
    Object.keys(INDICATOR_PARAMS[condition.indicator as keyof typeof INDICATOR_PARAMS]).length > 0;

  // Helper function for operator symbols (commented out as it's not currently used)
  // const getOperatorSymbol = (operator: OperatorType) => {
  //   switch (operator) {
  //     case 'less_than': return '<';
  //     case 'greater_than': return '>';
  //     case 'crosses_above': return 'Crosses Above';
  //     case 'crosses_below': return 'Crosses Below';
  //     case 'equals': return '=';
  //     case 'not_equals': return '≠';
  //     case 'between': return 'Between';
  //     case 'outside': return 'Outside';
  //     default: return operator;
  //   }
  // };

  // Helper function for indicator display names (commented out as it's not currently used)
  // const getIndicatorDisplayName = (indicator: IndicatorType) => {
  //   switch (indicator) {
  //     case 'Bollinger_Bands': return 'Bollinger Bands';
  //     case 'Williams_R': return 'Williams %R';
  //     case 'Close': return 'Price';
  //     default: return indicator;
  //   }
  // };

  const isCrossOperator = (operator: OperatorType) => {
    return operator === 'crosses_above' || operator === 'crosses_below';
  };

  const renderParameterInputs = () => {
    const params = INDICATOR_PARAMS[condition.indicator as keyof typeof INDICATOR_PARAMS];
    
    if (!params || Object.keys(params).length === 0) {
      return null;
    }

    return (
      <div className="parameter-inputs">
        {Object.entries(params).map(([key, defaultValue]) => (
          <div key={key} className="parameter-input">
            <label>{key.replace('_', ' ').toUpperCase()}:</label>
            <input
              type="number"
              value={condition[key as keyof Condition] ?? defaultValue}
              onChange={(e) => {
                const inputValue = e.target.value;
                const value = inputValue === '' ? undefined : (parseInt(inputValue) || defaultValue);
                updateCondition(condition.id, key as keyof Condition, value as any);
              }}
              min="1"
              max="200"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderCrossComparisonInputs = () => {
    if (!isCrossOperator(condition.operator)) return null;

    return (
      <div className="cross-comparison-inputs">
        <div className="cross-indicator-select">
          <label>Crosses:</label>
          <select 
            value={condition.compareIndicator || 'Close'}
            onChange={(e) => updateCondition(condition.id, 'compareIndicator', e.target.value as IndicatorType)}
          >
            <option value="Close">Price</option>
            <option value="SMA">SMA</option>
            <option value="EMA">EMA</option>
            <option value="RSI">RSI</option>
            <option value="MACD">MACD</option>
            <option value="Stochastic">Stochastic</option>
            <option value="Williams_R">Williams %R</option>
            <option value="Bollinger_Bands">Bollinger Bands</option>
            <option value="ATR">ATR</option>
            <option value="Volume">Volume</option>
          </select>
        </div>
        
        {condition.compareIndicator && condition.compareIndicator !== 'Close' && (
          <div className="compare-parameter-inputs">
            {Object.entries(INDICATOR_PARAMS[condition.compareIndicator as keyof typeof INDICATOR_PARAMS] || {}).map(([key, defaultValue]) => (
              <div key={`compare_${key}`} className="parameter-input">
                <label>Compare {key.replace('_', ' ').toUpperCase()}:</label>
                <input
                  type="number"
                  value={String(condition[`compare${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof Condition] ?? defaultValue)}
                                  onChange={(e) => {
                  const inputValue = e.target.value;
                  const value = inputValue === '' ? undefined : (parseInt(inputValue) || defaultValue);
                  updateCondition(condition.id, `compare${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof Condition, value as string | number | undefined);
                }}
                  min="1"
                  max="200"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderValueInput = () => {
    if (isCrossOperator(condition.operator)) {
      return (
        <input 
          type="text" 
          className="form-input value-input"
          placeholder="Value (optional)"
          value={condition.compareValue || ''}
          onChange={(e) => updateCondition(condition.id, 'compareValue', e.target.value)}
        />
      );
    }

    if (condition.operator === 'between' || condition.operator === 'outside') {
      return (
        <div className="range-inputs">
          <input 
            type="text" 
            className="form-input value-input"
            placeholder="Min"
            value={condition.value}
            onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
          />
          <span>and</span>
          <input 
            type="text" 
            className="form-input value-input"
            placeholder="Max"
            value={condition.compareValue || ''}
            onChange={(e) => updateCondition(condition.id, 'compareValue', e.target.value)}
          />
        </div>
      );
    }

    return (
      <input 
        type="text" 
        className="form-input value-input"
        placeholder="Value"
        value={condition.value}
        onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
      />
    );
  };

  return (
    <div className="condition-row">
      <div className="condition-main">
        <select 
          className="form-select indicator-select"
          value={condition.indicator}
          onChange={(e) => updateCondition(condition.id, 'indicator', e.target.value as IndicatorType)}
        >
          <option value="RSI">RSI</option>
          <option value="MACD">MACD</option>
          <option value="SMA">SMA</option>
          <option value="EMA">EMA</option>
          <option value="Bollinger_Bands">Bollinger Bands</option>
          <option value="Stochastic">Stochastic</option>
          <option value="Williams_R">Williams %R</option>
          <option value="ATR">ATR</option>
          <option value="Volume">Volume</option>
          <option value="Close">Price</option>
        </select>
        
        <select 
          className="form-select operator-select"
          value={condition.operator}
          onChange={(e) => updateCondition(condition.id, 'operator', e.target.value as OperatorType)}
        >
          <option value="less_than">{'<'}</option>
          <option value="greater_than">{'>'}</option>
          <option value="equals">{'='}</option>
          <option value="not_equals">{'≠'}</option>
          <option value="crosses_above">Crosses Above</option>
          <option value="crosses_below">Crosses Below</option>
          <option value="between">Between</option>
          <option value="outside">Outside</option>
        </select>
        
        {renderValueInput()}
      </div>
      
      {hasParams && renderParameterInputs()}
      {renderCrossComparisonInputs()}
      
      <div className="condition-actions">
        <button 
          onClick={() => removeCondition(condition.id)} 
          className="remove-button"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ConditionRow;