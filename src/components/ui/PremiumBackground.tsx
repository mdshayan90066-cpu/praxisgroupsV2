export default function PremiumBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Semi-transparent dark overlay — lets wallpaper bleed through */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(145deg, rgba(10,10,10,0.50) 0%, rgba(15,15,15,0.42) 40%, rgba(18,18,18,0.48) 70%, rgba(10,10,10,0.58) 100%)',
        }}
      />

      {/* Gold ambient fill — top-right quadrant */}
      <div
        className="absolute"
        style={{
          top: '-15%',
          right: '-5%',
          width: '65%',
          height: '75%',
          background: 'radial-gradient(ellipse at center, rgba(200,154,75,0.18) 0%, rgba(200,154,75,0.07) 45%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Dark emerald ambient — bottom-left */}
      <div
        className="absolute"
        style={{
          bottom: '-10%',
          left: '-5%',
          width: '55%',
          height: '65%',
          background: 'radial-gradient(ellipse at center, rgba(30,77,69,0.20) 0%, rgba(30,77,69,0.08) 45%, transparent 72%)',
          filter: 'blur(55px)',
        }}
      />

      {/* Gold rim light — right edge */}
      <div
        className="absolute"
        style={{
          top: '20%',
          right: 0,
          width: '3px',
          height: '50%',
          background: 'linear-gradient(to bottom, transparent, rgba(200,154,75,0.22) 30%, rgba(200,154,75,0.32) 50%, rgba(200,154,75,0.18) 70%, transparent)',
          filter: 'blur(8px)',
        }}
      />

      {/* Horizontal surface reflection */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '52%',
          height: '1px',
          background: 'linear-gradient(to right, transparent 0%, rgba(200,154,75,0.06) 15%, rgba(200,154,75,0.13) 40%, rgba(200,154,75,0.09) 60%, rgba(255,255,255,0.03) 75%, transparent 100%)',
        }}
      />

      {/* Fine grain texture */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.045'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
          opacity: 0.4,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Bottom content fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-56"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(9,9,9,0.30))',
        }}
      />
    </div>
  );
}
