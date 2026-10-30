import { useNavigate } from 'react-router-dom';

export default function BackButton({ label = '← Torna indietro' }) {
  const navigate = useNavigate();

  function goBack() {
    // react-router stores the history index in state; 0 means no in-app history (e.g. direct link)
    const hasHistory = (window.history.state?.idx ?? 0) > 0;
    if (hasHistory) navigate(-1);
    else navigate('/dashboard', { replace: true });
  }

  return (
    <button type="button" className="btn back" onClick={goBack}>
      {label}
    </button>
  );
}
