export default function FullscreenMessage({ text, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <p className={`title text-xl ${children ? '' : 'animate-pulse'}`}>{text}</p>
      {children}
    </div>
  )
}
