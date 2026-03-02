import { Link, useLocation } from "react-router-dom";
import { useSelector } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

export const Navbar = () => {
	const { t, toggleLanguage, language } = useLanguage();
	const location = useLocation();
	const { projects } = useSelector((state) => state.projects);
	const { notes } = useSelector((state) => state.notes);
	const { todos } = useSelector((state) => state.todos);
	const { payments } = useSelector((state) => state.payments);
	const [openDropdown, setOpenDropdown] = useState(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [expandedMobileGroup, setExpandedMobileGroup] = useState(null);
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
	const dropdownRefs = useRef({});

	useEffect(() => {
		if (openDropdown && dropdownRefs.current[openDropdown]) {
			const buttonEl = dropdownRefs.current[openDropdown].querySelector('.navbar-dropdown-summary');
			const rect = buttonEl.getBoundingClientRect();
			setDropdownPosition({
				top: rect.bottom + 8,
				left: rect.left,
			});
		}
	}, [openDropdown]);

	useEffect(() => {
		const handleClickOutside = (e) => {
			const isDropdownButton = e.target.closest('.navbar-dropdown-summary');
			const isDropdownMenu = e.target.closest('.navbar-dropdown-menu');
			if (!isDropdownButton && !isDropdownMenu) {
				setOpenDropdown(null);
			}
		};
		if (openDropdown) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	}, [openDropdown]);
	
	const availableProjects = projects.filter((project) => project.status !== 'cancelled');
	const canCreateTask = availableProjects.length > 0;

	const reminderCount = (() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const gather = (items, dateField) => items.filter((item) => {
			const rawDate = item[dateField];
			if (!rawDate) return false;
			const dueDate = new Date(rawDate);
			if (Number.isNaN(dueDate.getTime())) return false;
			dueDate.setHours(0, 0, 0, 0);
			const diffDays = Math.ceil((dueDate - today) / 86400000);
			return diffDays <= 7;
		});
		return (
			gather(notes, 'reminderDate').length +
			gather(todos, 'dueDate').length +
			gather(payments, 'nextDueDate').length
		);
	})();
	
	const handleOpenGatekeeper = () => {
		window.dispatchEvent(new CustomEvent("athenea:gatekeeper:open"));
	};

	const toggleDropdown = (label) => {
		setOpenDropdown(openDropdown === label ? null : label);
	};

	const closeDropdown = () => {
		setOpenDropdown(null);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	const dropdowns = [
		{
			label: t('Work'),
			items: [
				{ label: t('Work Hub'), path: '/work' },
				{ label: t('Projects'), path: '/projects' },
				{ label: t('My Tasks'), path: '/my-tasks' },
					{ label: t('Collaborators'), path: '/fleet' },
				{ label: t('Intelligence'), path: '/intelligence' },
			],
		},
		{
			label: t('Personal'),
			items: [
				{ label: t('Personal Hub'), path: '/personal' },
				{ label: t('Inbox'), path: '/inbox' },
				{ label: t('Notes'), path: '/notes' },
				{ label: t('Todos'), path: '/todos' },
				{ label: t('Notifications'), path: '/notifications' },
			],
		},
		{
			label: t('Finance'),
			items: [
				{ label: t('Finance Hub'), path: '/finance' },
				{ label: t('Payments'), path: '/payments' },
			],
		},
	];

	return (
		<>
			<nav className="navbar" style={{ 
				background: '#0b0b0b',
				borderBottom: '2px solid #27272a',
				paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
				paddingBottom: '10px',
				paddingLeft: '10px',
				paddingRight: '10px',
			}}>
				<div className="navbar-inner">
					<Link to="/dashboard" className="navbar-home-button" aria-label="ATHENEA home">
						<span>ATHENEA</span>
					</Link>

					<button
						className="navbar-mobile-toggle"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						aria-label="Menu"
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</button>

					<div className="navbar-main">
						<div className="navbar-actions">
							{dropdowns.map((group) => (
								<div key={group.label} className="navbar-dropdown" ref={(el) => dropdownRefs.current[group.label] = el}>
									<button
										className="navbar-dropdown-summary"
										onClick={() => toggleDropdown(group.label)}
										aria-expanded={openDropdown === group.label}
									>
										<span>{group.label}</span>
										<span className={`navbar-dropdown-caret${openDropdown === group.label ? ' is-open' : ''}`} aria-hidden="true">▾</span>
									</button>
									{openDropdown === group.label && createPortal(
										<div className="navbar-dropdown-menu-portal" style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}>
											<div className="navbar-dropdown-menu">
												{group.items.map((item) => {
													const isActive = location.pathname.startsWith(item.path);
													return (
														<Link
															key={item.path}
															to={item.path}
															onClick={closeDropdown}
															className={`navbar-dropdown-link${isActive ? ' is-active' : ''}`}
														>
															{item.label}
														</Link>
													);
												})}
											</div>
										</div>,
										document.body
									)}
								</div>
							))}
							<Link
								to="/calendar"
								className={`navbar-button${location.pathname.startsWith('/calendar') ? ' is-active' : ''}`}
							>
								<span className="navbar-button-glow" />
								{t('Calendar')}
							</Link>
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
										{t('Create a project to log tasks.')}
								</span>
							)}
						</div>

						<div className="navbar-right-group" style={{ gap: '50px' }}>
							<button
								onClick={toggleLanguage}
								className="navbar-language-toggle"
								title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
								aria-label={language === 'en' ? 'Change to Spanish' : 'Switch to English'}
							>
								<span className="navbar-language-text">
									{language === 'en' ? 'EN' : 'ES'}
								</span>
							</button>
							<Link
								to="/notifications"
								className={`navbar-icon-button${location.pathname.startsWith('/notifications') ? ' is-active' : ''}`}
								aria-label={t('Notifications')}
							>
								{reminderCount > 0 && (
									<span className="navbar-badge">{reminderCount}</span>
								)}
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M12 2a6 6 0 0 1 6 6v4.3l1.4 2.8A1 1 0 0 1 18.5 17h-13a1 1 0 0 1-.9-1.4L6 12.3V8a6 6 0 0 1 6-6zm0 20a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22z" />
								</svg>
							</Link>
						</div>
					</div>
				</div>
			</nav>

			{isMobileMenuOpen && createPortal(
				<div className="navbar-mobile-menu">
					<div className="navbar-mobile-content">
						{dropdowns.map((group) => {
							const isExpanded = expandedMobileGroup === group.label;
							return (
								<div key={group.label} className="navbar-mobile-group">
									<button
										className="navbar-mobile-group-button"
										onClick={() => setExpandedMobileGroup(isExpanded ? null : group.label)}
										aria-expanded={isExpanded}
									>
										<span>{group.label}</span>
										<svg
											className={`navbar-mobile-group-caret${isExpanded ? ' is-open' : ''}`}
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth={2}
										>
											<polyline points="6 9 12 15 18 9"></polyline>
										</svg>
									</button>
									{isExpanded && (
										<div className="navbar-mobile-group-items">
											{group.items.map((item) => {
												const isActive = location.pathname.startsWith(item.path);
												return (
													<Link
														key={item.path}
														to={item.path}
														onClick={() => {
															closeMobileMenu();
															setExpandedMobileGroup(null);
														}}
														className={`navbar-mobile-link${isActive ? ' is-active' : ''}`}
													>
														{item.label}
													</Link>
												);
											})}
										</div>
									)}
								</div>
							);
						})}
						<div className="navbar-mobile-group">
							<Link
								to="/calendar"
								onClick={() => {
									closeMobileMenu();
									setExpandedMobileGroup(null);
								}}
								className={`navbar-mobile-link${location.pathname.startsWith('/calendar') ? ' is-active' : ''}`}
							>
								{t('Calendar')}
							</Link>
						</div>
						<div className="navbar-mobile-group" style={{ borderTop: '1px solid #27272a', paddingTop: '12px', marginTop: '12px' }}>
							<button
								onClick={() => {
									toggleLanguage();
									closeMobileMenu();
									setExpandedMobileGroup(null);
								}}
								className="navbar-mobile-language-toggle"
							>
								<span>{language === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}</span>
							</button>
						</div>
					</div>
				</div>,
				document.body
			)}
		</>
	);
};

