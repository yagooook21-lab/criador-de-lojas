import { useNavigate, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, PlayCircle, Menu } from "lucide-react";

interface StoreMobileNavProps {
  isSpaActive: boolean;
}

const StoreMobileNav = ({ isSpaActive }: StoreMobileNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isSpaActive) return null;

  // Não exibir na página de carrinho e páginas de checkout
  if (location.pathname.startsWith('/store/cart') || location.pathname.startsWith('/store/checkout')) {
    return null;
  }

  const handleHomeClick = () => {
    navigate('/store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'home', label: 'Início', icon: Home, active: location.pathname === '/store', onClick: handleHomeClick },
    { id: 'categories', label: 'Categorias', icon: LayoutGrid, active: false, onClick: () => {} },
    { id: 'cart', label: 'Carrinho', icon: ShoppingCart, active: false, onClick: () => {}, isCenter: true },
    { id: 'videos', label: 'Vídeos', icon: PlayCircle, active: false, onClick: () => {} },
    { id: 'more', label: 'Mais', icon: Menu, active: false, onClick: () => {} },
  ];

  return (
    <nav className="spa-bottom-nav">
      <div className="spa-bottom-nav-container">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`spa-bottom-nav-item ${item.active ? 'active' : ''} ${item.isCenter ? 'center-item' : ''}`}
            onClick={item.onClick}
          >
            <div className="spa-bottom-nav-icon-wrapper">
              <item.icon className="spa-bottom-nav-icon" strokeWidth={1.5} />
            </div>
            <span className="spa-bottom-nav-label">{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default StoreMobileNav;
