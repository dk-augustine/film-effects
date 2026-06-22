import { useState } from 'react';
import Home from './components/Home';
import Editor from './components/Editor';

function App() {
  const [photo, setPhoto] = useState(null);

  return (
    <div className="min-h-screen bg-black w-full overflow-hidden">
      {!photo ? (
        <Home onPhotoSelect={setPhoto} />
      ) : (
        <Editor photoUrl={photo} onClose={() => setPhoto(null)} />
      )}
    </div>
  );
}

export default App;
