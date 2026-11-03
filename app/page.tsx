import CanvasBoard from '../components/canvas/CanvasBoard';

export default function Page() {
  // The main page is now just a clean wrapper for the CanvasBoard component
  return (
    <main>
      <CanvasBoard />
    </main>
  );
}