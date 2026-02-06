import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { hasPermission, getRoleLabel } from '../utils/permissions';
import { useCurrentUser } from '../hooks/useCurrentUser';

export const Navbar = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const { user, role: userRole, isDemo } = useCurrentUser();

	const handleLogout = async () => {
		await dispatch(logoutUser());
		navigate('/login');
	};

	const isActive = (path) => location.pathname === path;

	return (
		<nav className="navbar navbar-light bg-light" style={{ 
			borderBottom: isDemo ? '3px solid #ed8936' : '2px solid #e2e8f0',
			padding: '12px 0',
			boxShadow: isDemo ? '0 2px 8px rgba(237, 137, 54, 0.2)' : 'none'
		}}>
			<div className="container">
 				<Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
 					<img src={"/src/assets/img/logo.png"} alt="Scope demo logo" style={{ height: '32px', width: '32px' }} />
 					<span className="navbar-brand mb-0 h1" style={{
 						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
 						WebkitBackgroundClip: 'text',
 						WebkitTextFillColor: 'transparent',
 						fontWeight: 700,
 						fontSize: '24px',
 						display: 'inline-block'
 					}}>
 						Scope demo
 					</span>
 				</Link>
				
				<div style={{ 
					display: 'flex', 
					gap: '24px', 
					alignItems: 'center',
					flex: 1,
					marginLeft: '48px'
				}}>
					<Link 
						to="/dashboard" 
						style={{ 
							textDecoration: 'none',
							color: isActive('/dashboard') ? '#667eea' : '#4a5568',
							fontWeight: isActive('/dashboard') ? 700 : 500,
							fontSize: '16px',
							padding: '8px 16px',
							borderRadius: '8px',
							background: isActive('/dashboard') ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
							transition: 'all 0.2s'
						}}
					>
						🏠 Dashboard
					</Link>
					{(hasPermission(userRole, 'projects', 'viewAssigned') || hasPermission(userRole, 'projects', 'viewAll')) && (
						<Link 
							to="/projects" 
							style={{ 
								textDecoration: 'none',
								color: isActive('/projects') ? '#667eea' : '#4a5568',
								fontWeight: isActive('/projects') ? 700 : 500,
								fontSize: '16px',
								padding: '8px 16px',
								borderRadius: '8px',
								background: isActive('/projects') ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
								transition: 'all 0.2s'
							}}
						>
							📋 Projects
						</Link>
					)}
					{(hasPermission(userRole, 'users', 'viewAll') || hasPermission(userRole, 'users', 'viewAssigned') || hasPermission(userRole, 'users', 'viewTeam')) && (
						<Link 
							to="/users" 
							style={{ 
								textDecoration: 'none',
								color: isActive('/users') ? '#667eea' : '#4a5568',
								fontWeight: isActive('/users') ? 700 : 500,
								fontSize: '16px',
								padding: '8px 16px',
								borderRadius: '8px',
								background: isActive('/users') ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
								transition: 'all 0.2s'
							}}
						>
							👥 Users
						</Link>
					)}
					{(hasPermission(userRole, 'inventory', 'viewProject') || hasPermission(userRole, 'inventory', 'viewAll')) && (
						<Link 
							to="/inventory" 
							style={{ 
								textDecoration: 'none',
								color: isActive('/inventory') ? '#667eea' : '#4a5568',
								fontWeight: isActive('/inventory') ? 700 : 500,
								fontSize: '16px',
								padding: '8px 16px',
								borderRadius: '8px',
								background: isActive('/inventory') ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
								transition: 'all 0.2s'
							}}
						>
							📦 Inventory
						</Link>
					)}
					{(hasPermission(userRole, 'production', 'viewGroup') || hasPermission(userRole, 'production', 'viewAll') || hasPermission(userRole, 'reports', 'viewTeams')) && (
						<Link 
							to="/production" 
							style={{ 
								textDecoration: 'none',
								color: isActive('/production') ? '#667eea' : '#4a5568',
								fontWeight: isActive('/production') ? 700 : 500,
								fontSize: '16px',
								padding: '8px 16px',
								borderRadius: '8px',
								background: isActive('/production') ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
								transition: 'all 0.2s'
							}}
						>
							🔧 Production
						</Link>
					)}
				</div>

				<div className="ml-auto" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
					{user && (
						<>
							<span style={{ 
								color: '#718096', 
								fontSize: '14px',
								background: '#f7fafc',
								padding: '8px 16px',
								borderRadius: '8px',
								display: 'flex',
								alignItems: 'center',
								gap: '8px'
							}}>
								{isDemo ? '🎭' : '👤'} {user?.name || user?.email}
								<span style={{
									background: isDemo ? 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
									color: 'white',
									padding: '2px 8px',
									borderRadius: '4px',
									fontSize: '11px',
									fontWeight: 600,
									textTransform: 'uppercase'
								}}>
									{getRoleLabel(userRole)} {isDemo && '(DEMO)'}
								</span>
							</span>
							<button 
								className="btn btn-outline-danger btn-sm"
								onClick={handleLogout}
								style={{
									padding: '8px 20px',
									fontSize: '14px',
									fontWeight: 600,
									borderRadius: '8px'
								}}
							>
								🚪 Logout
							</button>
						</>
					)}
				</div>
			</div>
		</nav>
	);
};