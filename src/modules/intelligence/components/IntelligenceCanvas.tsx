/**
 * ATHENEA Intelligence Canvas Component
 * 
 * A Canvas is a dynamic, interactive UI component that the AI generates
 * to show the user a preview of what will be created before execution.
 * 
 * Based on OpenClaw's A2UI Canvas concept but using React
 */

import React, { useState } from 'react';
import { CanvasArtifact, CanvasField } from '../types';
import './IntelligenceCanvas.css';

interface IntelligenceCanvasProps {
  artifact: CanvasArtifact;
  onConfirm: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Main Canvas Component
 * Renders different UI types based on artifact.type
 */
export const IntelligenceCanvas: React.FC<IntelligenceCanvasProps> = ({
  artifact,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const { type, props } = artifact;

  switch (type) {
    case 'form':
      return (
        <CanvasForm
          props={props}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      );

    case 'table':
      return (
        <CanvasTable
          props={props}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      );

    case 'confirm':
      return (
        <CanvasConfirm
          props={props}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      );

    case 'text':
      return (
        <CanvasText
          props={props}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      );

    default:
      return <div className="canvas-error">Unknown canvas type: {type}</div>;
  }
};

// ============================================================================
// CANVAS FORM
// ============================================================================

interface CanvasFormProps {
  props: any;
  onConfirm: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CanvasForm: React.FC<CanvasFormProps> = ({
  props,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(
    (props.fields || []).reduce((acc: any, field: CanvasField) => ({
      ...acc,
      [field.id]: field.value || ''
    }), {})
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const firstMissingRequiredFieldId = (props.fields || []).find((field: CanvasField) => {
    return field.required && !formData[field.id];
  })?.id;

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    (props.fields || []).forEach((field: CanvasField) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onConfirm(formData);
    }
  };

  return (
    <div className="canvas-container canvas-form">
      <div className="canvas-header">
        <h2>{props.title}</h2>
        {props.description && <p className="canvas-description">{props.description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="canvas-form-body">
        {(props.fields || []).map((field: CanvasField) => (
          <FormField
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            error={errors[field.id]}
            autoFocus={field.id === firstMissingRequiredFieldId}
          />
        ))}

        <div className="canvas-footer">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (props.actionLabel || 'Confirm')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {props.cancelLabel || 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================

interface FormFieldProps {
  field: CanvasField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  autoFocus?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ field, value, onChange, error, autoFocus = false }) => {
  return (
    <div className={`form-field ${error ? 'form-field-error' : ''}`}>
      <label className="form-label">
        {field.label}
        {field.required && <span className="required">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          className="form-input form-textarea"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          autoFocus={autoFocus}
        />
      ) : field.type === 'select' ? (
        <select
          className="form-input form-select"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        >
          <option value="">Select {field.label}...</option>
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === 'checkbox' ? (
        <input
          type="checkbox"
          className="form-checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
        />
      ) : field.type === 'number' ? (
        <input
          type="number"
          className="form-input"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          placeholder={field.placeholder}
          autoFocus={autoFocus}
        />
      ) : field.type === 'date' ? (
        <input
          type="date"
          className="form-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      ) : (
        <input
          type="text"
          className="form-input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          autoFocus={autoFocus}
        />
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

// ============================================================================
// CANVAS TABLE
// ============================================================================

interface CanvasTableProps {
  props: any;
  onConfirm: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CanvasTable: React.FC<CanvasTableProps> = ({
  props,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  return (
    <div className="canvas-container canvas-table">
      <div className="canvas-header">
        <h2>{props.title}</h2>
      </div>

      <div className="canvas-table-body">
        <table className="data-table">
          <thead>
            <tr>
              {(props.columns || []).map((col: any) => (
                <th key={col.id}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(props.data || []).map((row: any, idx: number) => (
              <tr key={idx}>
                {(props.columns || []).map((col: any) => (
                  <td key={col.id}>{row[col.accessor]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="canvas-footer">
        <button
          className="btn btn-primary"
          onClick={() => onConfirm({ confirmed: true })}
          disabled={isLoading}
        >
          Confirm
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// CANVAS CONFIRM
// ============================================================================

interface CanvasConfirmProps {
  props: any;
  onConfirm: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CanvasConfirm: React.FC<CanvasConfirmProps> = ({
  props,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  return (
    <div className="canvas-container canvas-confirm">
      <div className="canvas-header">
        <h2>{props.title}</h2>
      </div>

      <div className="canvas-confirm-body">
        <p>{props.description}</p>
      </div>

      <div className="canvas-footer">
        <button
          className="btn btn-primary"
          onClick={() => onConfirm({})}
          disabled={isLoading}
        >
          {props.actionLabel || 'Confirm'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          {props.cancelLabel || 'Cancel'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// CANVAS TEXT
// ============================================================================

interface CanvasTextProps {
  props: any;
  onConfirm: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CanvasText: React.FC<CanvasTextProps> = ({
  props,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  return (
    <div className="canvas-container canvas-text">
      <div className="canvas-header">
        <h2>{props.title}</h2>
      </div>

      <div className="canvas-text-body">
        <p>{props.description}</p>
      </div>

      <div className="canvas-footer">
        <button
          className="btn btn-primary"
          onClick={() => onConfirm({})}
          disabled={isLoading}
        >
          {props.actionLabel || 'OK'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          {props.cancelLabel || 'Cancel'}
        </button>
      </div>
    </div>
  );
};

export default IntelligenceCanvas;
