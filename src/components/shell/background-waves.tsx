// Ondas decorativas del pie de página de los mockups.
export function BackgroundWaves() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[300px] overflow-hidden">
      <div className="absolute -right-[30%] -bottom-[140px] -left-[30%] h-[300px] rounded-[50%] bg-[#efe5dd]" />
      <div className="absolute -right-[40%] -bottom-[200px] -left-[10%] h-[300px] rounded-[50%] bg-[#f2d8cd]" />
    </div>
  );
}
