/* FIX UX-2 — Micro-onboarding de primera sesión */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeBanner.css';

const STORAGE_KEY = 'athenea.onboarding.v1.done';

const SECTIONS = [
  {
    icon: '🗂',
    title: 'Work · Personal · Finance',
    text: 'Tres áreas para organizar tu vida. Navega entre ellas desde el menú superior.',
  },
  {
    icon: '🧿',
    title: 'Cortana · Jarvis · SHODAN',
    text: 'Tres agentes especializados. Habla con ellos desde la esfera flotante en la esquina.',
  },
  {
    icon: '🎙',
    title: 'Lenguaje natural',
    text: 'Di "agregar tarea reunión mañana" o "gasté 200 en comida". También funciona por voz.',
  },
];

export const WelcomeBanner = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(
    () => !localStorage.getItem(STORAGE_KEY)
  );
  const [openIndex, setOpenIndex] = useState(null);

  if (!visible) return null;

  const dismiss = (goToWork = false) => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    if (goToWork) navigate('/work');
  };

  return (
    <aside className="welcome-banner" role="banner" aria-label="Bienvenida a ATHENEA">
      <button
        type="button"
        className="welcome-banner-close"
        onClick={() => dismiss()}
        aria-label="Cerrar"
      >
        ✕
      </button>

      <p className="welcome-banner-eyebrow">Bienvenido a ATHENEA</p>

      <div className="welcome-banner-sections">
        {SECTIONS.map((section, i) => (
          <div key={i} className="welcome-banner-section">
            {/* Mobile: accordion toggle */}
            <button
              type="button"
              className="welcome-banner-section-toggle"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              aria-expanded={openIndex === i}
            >
              <span className="welcome-banner-section-icon">{section.icon}</span>
              <span className="welcome-banner-section-title">{section.title}</span>
              <span className="welcome-banner-section-chevron">
                {openIndex === i ? '▲' : '▼'}
              </span>
            </button>
            {/* Desktop: always visible text; Mobile: visible when expanded */}
            <p
              className={`welcome-banner-section-text${openIndex === i ? ' is-open' : ''}`}
            >
              {section.text}
            </p>
          </div>
        ))}
      </div>

      <div className="welcome-banner-footer">
        <button
          type="button"
          className="welcome-banner-cta"
          onClick={() => dismiss(true)}
        >
          Entendido, explorar →
        </button>
      </div>
    </aside>
  );
};
