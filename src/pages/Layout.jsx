import { Outlet, Navigate } from "react-router-dom"
import { useSelector } from 'react-redux';
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    const { token } = useSelector((state) => state.auth);

    // If not authenticated, redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <ScrollToTop>
            <Navbar />
                <Outlet />
            <Footer />
        </ScrollToTop>
    )
}