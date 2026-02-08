import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { useLanguage } from '../context/LanguageContext';

export const Home = () => {

  const {store, dispatch} =useGlobalReducer()
	const { t } = useLanguage();

	return (
		<div className="text-center mt-5">
			<h1>{t('Welcome to ATHENEA')}</h1>
			<p>
			</p>
		</div>
	);
}; 