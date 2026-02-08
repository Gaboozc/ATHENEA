import { useLanguage } from '../context/LanguageContext';

export const Footer = () => {
	const { t } = useLanguage();

	return (
		<footer className="footer mt-auto py-3 text-center" style={{ background: '#0b0b0b', borderTop: '1px solid #27272a', color: '#c9cdd2' }}>
			<img src={"/src/assets/img/Athena-logo.png"} alt="ATHENEA logo" style={{ height: '48px', width: '48px', marginBottom: '8px' }} />
			<div>ATHENEA {t('Tactical Engineering System')} © 2025</div>
		</footer>
	);
};