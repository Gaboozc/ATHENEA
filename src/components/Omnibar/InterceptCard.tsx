import React from 'react';
import './InterceptCard.css';

type ActionType = 'register-expense' | 'schedule-event' | 'none';
type Urgency = 'low' | 'medium' | 'high' | 'critical';

interface InterceptCardProps {
	appName: string;
	packageName: string;
	summary: string;
	urgency: Urgency;
	actionType: ActionType;
	merchant?: string;
	temporalHint?: string;
	onExecute: () => void;
	onDiscard: () => void;
}

const APP_LOGO_BY_PACKAGE: Record<string, string> = {
	'com.paypal.android.p2pmobile': 'PP',
	'com.google.android.calendar': 'GC',
	'com.whatsapp': 'WA',
};

function getAppBadge(packageName: string, appName: string): string {
	if (APP_LOGO_BY_PACKAGE[packageName]) return APP_LOGO_BY_PACKAGE[packageName];
	const initials = appName
		.split(' ')
		.map((word) => word[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
	return initials || 'AI';
}

function getProtocolLabel(actionType: ActionType): string {
	if (actionType === 'register-expense') return 'Registrar en Finanzas';
	if (actionType === 'schedule-event') return 'Registrar en Agenda';
	return 'Procesar Inteligencia';
}

export const InterceptCard: React.FC<InterceptCardProps> = ({
	appName,
	packageName,
	summary,
	urgency,
	actionType,
	merchant,
	temporalHint,
	onExecute,
	onDiscard,
}) => {
	return (
		<section className={`intercept-card-v2 urgency-${urgency}`}>
			<div className="intercept-card-head">
				<div className="intercept-app-logo" aria-hidden="true">
					{getAppBadge(packageName, appName)}
				</div>
				<div>
					<div className="intercept-title">Filtro Tactico</div>
					<div className="intercept-source">Origen: {appName}</div>
				</div>
				<div className="intercept-urgency">{urgency.toUpperCase()}</div>
			</div>

			<p className="intercept-summary-v2">{summary}</p>

			{(merchant || temporalHint) && (
				<div className="intercept-metadata">
					{merchant && <span>Comercio: {merchant}</span>}
					{temporalHint && <span>Temporalidad: {temporalHint}</span>}
				</div>
			)}

			<div className="intercept-actions-v2">
				<button type="button" className="intercept-execute" onClick={onExecute}>
					EJECUTAR PROTOCOLO
				</button>
				<button type="button" className="intercept-discard" onClick={onDiscard}>
					DESCARTAR
				</button>
			</div>

			<div className="intercept-footnote">{getProtocolLabel(actionType)}</div>
		</section>
	);
};

export default InterceptCard;
