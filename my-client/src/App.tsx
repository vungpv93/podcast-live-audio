import Live from './pages/live';
import { useSocket } from './hooks/useSocket.ts';
import { ConfigApp } from './conf';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

function App() {
  const { socket } = useSocket();
  useEffect(() => {
    if (socket?.id) {
      toast.success("Connect success");
    }
  }, [socket?.id]);
  return <Live roomId={ConfigApp.roomId} socket={socket} />;
}

export default App;