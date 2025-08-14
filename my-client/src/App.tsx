import Live from './pages/live';
import { useSocket } from './hooks/useSocket.ts';
import { ConfigApp } from './conf';

function App() {
  const { socketId, socket } = useSocket();
  console.log('Socket is connected', {
    socketId,
    socket,
  });
  return <Live roomId={ConfigApp.roomId} socket={socket} />;
}

export default App;
