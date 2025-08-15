import Live from './pages/live';
import { useSocket } from './hooks/useSocket.ts';
import { ConfigApp } from './conf';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { AuthList } from './mock/auth.ts';
import type { IUser } from './dto/live-audio.ts';

type AppProps = {
  duuid: string;
};

function App({ duuid }: AppProps) {
  const { socket } = useSocket();
  useEffect(() => {
    if (socket?.id) {
      toast.success('The client connected.');
      console.log(`The client duuid is : ${duuid}`);
    }
  }, [duuid, socket?.id]);

  return (
    <Live
      roomId={ConfigApp.roomId}
      socket={socket}
      auth={AuthList.host as IUser}
      // auth={AuthList.guest as IUser}
    />
  );
}

export default App;
