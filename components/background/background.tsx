const BlurBackground = () => {
  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      {/* Soft Color Overlay */}
      <div className="absolute inset-0 animate-subtleGlow bg-gradient-to-br from-[#f8f8f8] via-[#eaeaea] to-[#ffffff] opacity-50" />

      {/* Light Glow Highlights */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-xl" />
    </div>
  );
};

export default BlurBackground;
