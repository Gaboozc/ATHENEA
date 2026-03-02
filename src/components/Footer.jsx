import { useLanguage } from '../context/LanguageContext';
import atheneaLogo from '../assets/img/Athena-logo.png';
import './Footer.css';

export const Footer = () => {
	const { t } = useLanguage();

	return (
		<footer className="footer mt-auto py-3 text-center" style={{ background: '#0b0b0b', borderTop: '1px solid #27272a', color: '#c9cdd2', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
			<img src={atheneaLogo} alt="ATHENEA logo" style={{ height: '48px', width: '48px' }} />
			<div>ATHENEA {t('Personal Assistant')} © 2025</div>
		</footer>
	);
};