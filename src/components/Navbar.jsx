import { Link, useLocation } from "react-router-dom";
import { useSelector } from 'react-redux';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

export const Navbar = () => {
	const { user, isDemo, role } = useCurrentUser();
	const { language, setLanguage, t } = useLanguage();
	const location = useLocation();
	const isAdmin = role === 'Admin' || role === 'admin' || role === 'super-admin';
	const { projects } = useSelector((state) => state.projects);
	const { currentOrgId } = useSelector((state) => state.organizations);
	const scopedProjects = currentOrgId
		? projects.filter((project) => !project.orgId || project.orgId === currentOrgId)
		: [];
	const availableProjects = role === "pm" && user?.id
		? scopedProjects.filter((project) => project.pmId === user.id && project.status !== 'cancelled')
		: scopedProjects.filter((project) => project.status !== 'cancelled');
	const canCreateTask = availableProjects.length > 0;
	const handleOpenGatekeeper = () => {
		window.dispatchEvent(new CustomEvent("athenea:gatekeeper:open"));
	};


	const handleLanguageToggle = (event) => {
		setLanguage(event.target.checked ? 'es' : 'en');
	};

	const navItems = [
		{ label: t('Dashboard'), path: '/dashboard' },
		{ label: t('Projects'), path: '/projects' },
		{
			label: t('My Tasks'),
			path: '/my-tasks',
			icon: (
				<svg className="navbar-button-icon" viewBox="0 0 24 24" aria-hidden="true">
					<path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
					<path d="M9 9h6" />
					<path d="M9 13h6" />
					<path d="M9 17h4" />
				</svg>
			)
		},
		...(isAdmin
			? [
					{ label: t('Intelligence'), path: '/intelligence' },
					{ label: t('Workstreams'), path: '/workstreams' },
					{ label: t('Fleet'), path: '/fleet' }
				]
			: []),
		{ label: t('Settings'), path: '/settings' }
	];

	return (
		<nav className="navbar" style={{ 
			background: '#0b0b0b',
			borderBottom: isDemo ? '3px solid #d4af37' : '2px solid #27272a',
			padding: '12px 0',
			boxShadow: isDemo ? '0 2px 8px rgba(212, 175, 55, 0.2)' : 'none'
		}}>
			<div className="container navbar-inner" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
				<Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
					<img src={"/src/assets/img/Athena-logo.png"} alt="ATHENEA logo" style={{ height: '64px', width: '64px' }} />
 					<span className="navbar-brand mb-0 h1" style={{
						background: '#d4af37',
 						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
 						fontWeight: 700,
						fontSize: '26px',
 						display: 'inline-block'
 					}}>
						ATHENEA
 					</span>
 				</Link>

				<div className="navbar-actions">
					{navItems.map((item) => {
						const isActive = location.pathname.startsWith(item.path);
						return (
							<Link
								key={item.path}
								to={item.path}
								className={`navbar-button${isActive ? ' is-active' : ''}`}
							>
								<span className="navbar-button-glow" />
								{item.icon}
								{item.label}
							</Link>
						);
					})}
				</div>

				<div style={{ 
					display: 'flex', 
					gap: '16px', 
					alignItems: 'center',
					marginLeft: '16px'
				}}>
					<button
						onClick={handleOpenGatekeeper}
						data-gatekeeper-trigger="true"
						disabled={!canCreateTask}
						className={`navbar-task-button${canCreateTask ? '' : ' is-disabled'}`}
					>
						<span className="task-button-text">{t('New Task')}</span>
						<span className="task-button-icon" aria-hidden="true">
							<svg
								className="task-button-svg"
								viewBox="0 0 24 24"
								strokeWidth={2}
								strokeLinejoin="round"
								strokeLinecap="round"
								stroke="currentColor"
								fill="none"
							>
								<line y2={19} y1={5} x2={12} x1={12} />
								<line y2={12} y1={12} x2={19} x1={5} />
							</svg>
						</span>
					</button>
					{!canCreateTask && (
						<span style={{ fontSize: '12px', color: '#9aa3ad' }}>
							{t('Create a project to log tasks.')}
						</span>
					)}
				</div>

				<div className="ml-auto" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: 'auto' }}>
					<Link
						to="/notifications"
						className={`navbar-icon-button${location.pathname.startsWith('/notifications') ? ' is-active' : ''}`}
						aria-label={t('Notifications')}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M12 2a6 6 0 0 1 6 6v4.3l1.4 2.8A1 1 0 0 1 18.5 17h-13a1 1 0 0 1-.9-1.4L6 12.3V8a6 6 0 0 1 6-6zm0 20a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22z" />
						</svg>
					</Link>
					<Link
						to="/field-reports"
						className={`navbar-pill${location.pathname.startsWith('/field-reports') ? ' is-active' : ''}`}
					>
						<div className="navbar-pill-button">
							<div>
								<div>
									<div>{t('Field Reports')}</div>
								</div>
							</div>
						</div>
					</Link>
					<div className="lang-switch">
						<span className="lang-flag" role="img" aria-label="United States">
							<svg viewBox="0 0 22 14" aria-hidden="true">
								<rect width="22" height="14" fill="#b22234" />
								<rect y="1.08" width="22" height="1.08" fill="#fff" />
								<rect y="3.23" width="22" height="1.08" fill="#fff" />
								<rect y="5.38" width="22" height="1.08" fill="#fff" />
								<rect y="7.54" width="22" height="1.08" fill="#fff" />
								<rect y="9.69" width="22" height="1.08" fill="#fff" />
								<rect y="11.85" width="22" height="1.08" fill="#fff" />
								<rect width="9.5" height="7.5" fill="#3c3b6e" />
								<circle cx="1.4" cy="1.2" r="0.35" fill="#fff" />
								<circle cx="3.1" cy="1.2" r="0.35" fill="#fff" />
								<circle cx="4.8" cy="1.2" r="0.35" fill="#fff" />
								<circle cx="6.5" cy="1.2" r="0.35" fill="#fff" />
								<circle cx="8.2" cy="1.2" r="0.35" fill="#fff" />
								<circle cx="2.25" cy="2.4" r="0.35" fill="#fff" />
								<circle cx="3.95" cy="2.4" r="0.35" fill="#fff" />
								<circle cx="5.65" cy="2.4" r="0.35" fill="#fff" />
								<circle cx="7.35" cy="2.4" r="0.35" fill="#fff" />
								<circle cx="1.4" cy="3.6" r="0.35" fill="#fff" />
								<circle cx="3.1" cy="3.6" r="0.35" fill="#fff" />
								<circle cx="4.8" cy="3.6" r="0.35" fill="#fff" />
								<circle cx="6.5" cy="3.6" r="0.35" fill="#fff" />
								<circle cx="8.2" cy="3.6" r="0.35" fill="#fff" />
								<circle cx="2.25" cy="4.8" r="0.35" fill="#fff" />
								<circle cx="3.95" cy="4.8" r="0.35" fill="#fff" />
								<circle cx="5.65" cy="4.8" r="0.35" fill="#fff" />
								<circle cx="7.35" cy="4.8" r="0.35" fill="#fff" />
								<circle cx="1.4" cy="6" r="0.35" fill="#fff" />
								<circle cx="3.1" cy="6" r="0.35" fill="#fff" />
								<circle cx="4.8" cy="6" r="0.35" fill="#fff" />
								<circle cx="6.5" cy="6" r="0.35" fill="#fff" />
								<circle cx="8.2" cy="6" r="0.35" fill="#fff" />
							</svg>
						</span>
						<label className="lang-switch-control">
							<input
								id="language_mode"
								name="language_mode"
								type="checkbox"
								checked={language === 'es'}
								onChange={handleLanguageToggle}
							/>
							<span
								className="lang-switch-track"
								data-off="EN"
								data-on="ES"
							/>
						</label>
						<span className="lang-flag" role="img" aria-label="Venezuela">
							<svg viewBox="0 0 22 14" aria-hidden="true">
								<rect width="22" height="14" fill="#cf142b" />
								<rect width="22" height="9.3" fill="#00247d" />
								<rect width="22" height="4.6" fill="#ffcc00" />
								<circle cx="5" cy="7" r="0.35" fill="#fff" />
								<circle cx="6.5" cy="6.4" r="0.35" fill="#fff" />
								<circle cx="8" cy="6.1" r="0.35" fill="#fff" />
								<circle cx="9.5" cy="6" r="0.35" fill="#fff" />
								<circle cx="11" cy="6.1" r="0.35" fill="#fff" />
								<circle cx="12.5" cy="6.4" r="0.35" fill="#fff" />
								<circle cx="14" cy="7" r="0.35" fill="#fff" />
								<circle cx="15.2" cy="7.6" r="0.35" fill="#fff" />
							</svg>
						</span>
					</div>
				</div>
			</div>
		</nav>
	);
};