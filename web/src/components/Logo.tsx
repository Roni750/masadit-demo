// Approximation of the product's "My BIZ" mark, drawn in SVG so it stays sharp at any density
export const Logo: React.FC<{ size?: number }> = ({ size = 76 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="MyBiz">
    <circle cx="50" cy="50" r="48" fill="#fff" stroke="#e3e6ea" strokeWidth="2" />
    <text x="50" y="52" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="40" fill="#111">
      My
    </text>
    <text x="60" y="78" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="20" fill="#333">
      BIZ
    </text>
    <polygon points="30,62 35,59 40,62 40,68 35,71 30,68" fill="#2bb5a5" />
    <polygon points="24,72 28,70 32,72 32,77 28,79 24,77" fill="#f2a52b" />
    <polygon points="34,73 38,71 42,73 42,78 38,80 34,78" fill="#8bc34a" />
  </svg>
);
