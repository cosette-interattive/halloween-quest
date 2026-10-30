import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <Outlet />
      <nav className="tabbar">
        <NavLink to="/dashboard">Home</NavLink>
        <NavLink to="/missioni">Missioni</NavLink>
        <NavLink to="/valida">Valida</NavLink>
        <NavLink to="/classifica">Classifica</NavLink>
        <NavLink to="/profilo">Profilo</NavLink>
      </nav>
    </div>
  );
}
