/**
 * ATHENEA Intelligence Module - Example Implementation
 * 
 * This file demonstrates how to integrate the Intelligence Module
 * into an ATHENEA page. Use this as a template for the Intelligence page.
 * 
 * ⚠️ This is a DEMO/EXAMPLE file - copy and adapt for your needs
 */

import React, { useState } from 'react';
import {
  useIntelligence,
  IntelligenceCanvas,
  allSkills,
  getSkillsByHub
} from './index';
import './IntelligenceExample.css';

/**
 * Example Intelligence Panel
 * Shows how to use the Intelligence module in a real component
 */
export function IntelligenceExamplePanel() {
  const {
    sendPrompt,
    isLoading,
    currentResponse,
    currentArtifact,
    lastError,
    confidenceScore,
    confirmAction,
    cancelAction
  } = useIntelligence('WorkHub');

  const [inputValue, setInputValue] = useState('');
  const [selectedHub, setSelectedHub] = useState<'WorkHub' | 'PersonalHub' | 'FinanceHub'>('WorkHub');

  const handleSendPrompt = async () => {
    if (!inputValue.trim()) return;

    // Send prompt to Bridge
    await sendPrompt(inputValue, selectedHub);

    // Clear input
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const suggestedSkills = getSkillsByHub(selectedHub).slice(0, 3);

  return (
    <div className="intelligence-panel">
      {/* Header */}
      <div className="intelligence-header">
        <h1>🤖 ATHENEA Assistant</h1>
        <p>Tell me what you want to do...</p>
      </div>

      {/* Hub Selector */}
      <div className="hub-selector">
        <button
          className={`hub-btn ${selectedHub === 'WorkHub' ? 'active' : ''}`}
          onClick={() => setSelectedHub('WorkHub')}
        >
          💼 Work
        </button>
        <button
          className={`hub-btn ${selectedHub === 'PersonalHub' ? 'active' : ''}`}
          onClick={() => setSelectedHub('PersonalHub')}
        >
          📝 Personal
        </button>
        <button
          className={`hub-btn ${selectedHub === 'FinanceHub' ? 'active' : ''}`}
          onClick={() => setSelectedHub('FinanceHub')}
        >
          💰 Finance
        </button>
      </div>

      {/* Input Section */}
      <div className="input-section">
        <textarea
          className="input-textarea"
          placeholder={`What do you want to do in ${selectedHub}? (e.g., "Add task fix bug", "Create note about meeting", "Record $50 coffee")`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          rows={3}
        />
        <div className="input-footer">
          <div className="quick-suggestions">
            <span className="label">Quick suggestions:</span>
            {suggestedSkills.map((skill) => (
              <button
                key={skill.id}
                className="suggestion-btn"
                onClick={() => setInputValue(`${skill.icon} ${skill.name.toLowerCase()}`)}
                disabled={isLoading}
              >
                {skill.icon} {skill.name}
              </button>
            ))}
          </div>
          <button
            className="send-btn"
            onClick={handleSendPrompt}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Response Section */}
      {currentResponse && (
        <div className="response-section">
          {/* Reasoning */}
          <div className="reasoning-box">
            <div className="reasoning-header">
              <span className={`confidence-badge ${confidenceScore >= 80 ? 'high' : confidenceScore >= 60 ? 'medium' : 'low'}`}>
                {confidenceScore}% confidence
              </span>
            </div>
            <p className="reasoning-text">{currentResponse.reasoning.reasoning}</p>
            {currentResponse.reasoning.matchedSkill && (
              <p className="matched-skill">
                Matched skill: <strong>{currentResponse.reasoning.matchedSkill.icon} {currentResponse.reasoning.matchedSkill.name}</strong>
              </p>
            )}
          </div>

          {/* Canvas Preview */}
          {currentArtifact && (
            <div className="artifact-section">
              <IntelligenceCanvas
                artifact={currentArtifact}
                onConfirm={confirmAction}
                onCancel={cancelAction}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Message */}
          <div className="message-box">
            {currentResponse.userMessage}
          </div>
        </div>
      )}

      {/* Error Section */}
      {lastError && (
        <div className="error-box">
          ⚠️ {lastError}
        </div>
      )}

      {/* Skills Reference */}
      <div className="skills-reference">
        <details>
          <summary>📚 Available Skills in {selectedHub}</summary>
          <div className="skills-list">
            {getSkillsByHub(selectedHub).map((skill) => (
              <div key={skill.id} className="skill-item">
                <div className="skill-header">
                  <span className="skill-icon">{skill.icon}</span>
                  <span className="skill-name">{skill.name}</span>
                </div>
                <p className="skill-description">{skill.description}</p>
                <p className="skill-keywords">
                  Keywords: <code>{skill.keywords.slice(0, 3).join(', ')}</code>
                </p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

/**
 * Example: Minimal Chat Component
 * For embedding in a chat interface
 */
export function IntelligenceChatBubble({ prompt, response }: any) {
  return (
    <div className="chat-exchange">
      {/* User Message */}
      <div className="chat-bubble user">
        <p>{prompt}</p>
      </div>

      {/* Assistant Response */}
      {response && (
        <div className="chat-bubble assistant">
          <div className="response-confidence">
            {response.reasoning.confidence}% confidence
          </div>
          <p>{response.userMessage}</p>
          {response.reasoning.matchedSkill && (
            <p className="skill-match">
              → {response.reasoning.matchedSkill.icon} {response.reasoning.matchedSkill.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Example: Integration with existing Intelligence.tsx page
 * 
 * Replace the content of pages/Intelligence.jsx with something like:
 * 
 * import { IntelligenceExamplePanel } from '@/modules/intelligence/example';
 * 
 * export function Intelligence() {
 *   return (
 *     <Layout>
 *       <IntelligenceExamplePanel />
 *     </Layout>
 *   );
 * }
 */

export default IntelligenceExamplePanel;
