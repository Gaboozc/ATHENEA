import { useLanguage } from '../context/LanguageContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import './Footer.css';

export const Footer = () => {
	const { t } = useLanguage();
	const { role } = useCurrentUser();
	const roleKey = (role || '').toLowerCase();

	const roleCycle = ['Admin', 'Manager', 'Worker'];
	const handleRoleToggle = () => {
		const currentIndex = roleCycle.findIndex(
			(item) => item.toLowerCase() === roleKey
		);
		const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % roleCycle.length;
		localStorage.setItem('athenea-role-override', roleCycle[nextIndex]);
		window.dispatchEvent(new Event('athenea:role:change'));
	};

	return (
		<footer className="footer mt-auto py-3 text-center" style={{ background: '#0b0b0b', borderTop: '1px solid #27272a', color: '#c9cdd2', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
			<img src={"/src/assets/img/Athena-logo.png"} alt="ATHENEA logo" style={{ height: '48px', width: '48px' }} />
			<div>ATHENEA {t('Tactical Engineering System')} © 2025</div>
			<button
				type="button"
				style={{
					padding: '4px 12px',
					background: '#1a1a1a',
					border: '1px solid #27272a',
					borderRadius: '6px',
					color: '#1ec9ff',
					fontSize: '11px',
					cursor: 'pointer',
					transition: 'all 0.2s ease'
				}}
				onClick={handleRoleToggle}
				onMouseEnter={(e) => e.target.style.background = '#27272a'}
				onMouseLeave={(e) => e.target.style.background = '#1a1a1a'}
			>
				{t('Role')}: {role}
			</button>
		</footer>
	);
};