import { Link, useLocation } from "react-router-dom";
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

export const Navbar = () => {
	const { t } = useLanguage();
	const location = useLocation();
	const { projects } = useSelector((state) => state.projects);
	
	const availableProjects = projects.filter((project) => project.status !== 'cancelled');
	const canCreateTask = availableProjects.length > 0;
	
	const handleOpenGatekeeper = () => {
		window.dispatchEvent(new CustomEvent("athenea:gatekeeper:open"));
	};

	const navItems = [
		{ label: t('Dashboard'), path: '/dashboard' },
		{ label: t('Projects'), path: '/projects' },
		{ label: t('My Tasks'), path: '/my-tasks' },
		{ label: t('Intelligence'), path: '/intelligence' },
		{ label: t('Workstreams'), path: '/workstreams' },
		{ label: t('Fleet'), path: '/fleet' },
		{ label: t('Settings'), path: '/settings' }
	];

	return (
		<nav className="navbar" style={{ 
			background: '#0b0b0b',
			borderBottom: '2px solid #27272a',
			padding: '12px 5px',
		}}>
			<div className="navbar-inner" style={{ display: 'flex', alignItems: 'center', gap: '1px', justifyContent: 'flex-start' }}>
				<Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
					<img src={"/src/assets/img/Athena-logo.png"} alt="ATHENEA logo" style={{ height: '52px', width: '52px' }} />
 					<span className="navbar-brand mb-0 h1" style={{
						background: '#d4af37',
 						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
 						fontWeight: 700,
						fontSize: '22px',
 						display: 'inline-block'
 					}}>
						ATHENEA
 					</span>
 				</Link>

				<div className="navbar-main">
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
									{item.label}
								</Link>
							);
						})}
					</div>

					<div className="navbar-task-group">
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
								{t('Create a workstream project to log tasks.')}
							</span>
						)}
					</div>

					<div className="navbar-right-group" style={{ gap: '50px' }}>
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
						<Link
							to="/notifications"
							className={`navbar-icon-button${location.pathname.startsWith('/notifications') ? ' is-active' : ''}`}
							aria-label={t('Notifications')}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M12 2a6 6 0 0 1 6 6v4.3l1.4 2.8A1 1 0 0 1 18.5 17h-13a1 1 0 0 1-.9-1.4L6 12.3V8a6 6 0 0 1 6-6zm0 20a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22z" />
							</svg>
						</Link>
					</div>
				</div>
			</div>
		</nav>
	);
};
